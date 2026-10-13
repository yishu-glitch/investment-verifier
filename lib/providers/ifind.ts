import type {ProviderContext,ResearchInput,ToolResult,Evidence} from '../domain.ts';
import {shortId} from '../domain.ts';

type Service='stock'|'news';
const endpoints={stock:'hexin-ifind-ds-stock-mcp',news:'hexin-ifind-ds-news-mcp'};
export function parseMcpBody(body:string):any {
  try{return JSON.parse(body);}catch{}
  const chunks=body.split(/\r?\n\r?\n/).map(chunk=>chunk.split(/\r?\n/).filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trim()).join('\n'));
  for(const chunk of chunks.reverse()) {try{return JSON.parse(chunk);}catch{}}
  throw new Error('MCP 响应无法解析');
}
export function unwrapIfind(payload:any):any {
  if(payload.error) throw new Error(`iFinD ${payload.error.code}: ${payload.error.message || '工具错误'}`);
  if(payload.result?.isError) throw new Error('iFinD 工具返回错误');
  const texts=(payload.result?.content||[]).filter((x:any)=>x.type==='text').map((x:any)=>x.text);
  if(!texts.length) throw new Error('iFinD 没有返回文本结果');
  let inner:any; try{inner=JSON.parse(texts.join('\n'));}catch{return {answer:texts.join('\n')}}
  if(inner.code!==undefined&&![0,1].includes(inner.code)) throw new Error(inner.msg || inner.message || 'iFinD 业务错误');
  return inner.data ?? inner;
}
export class IfindClient {
  token:string; fetcher:typeof fetch; sessions:Partial<Record<Service,string>>={}; tools:Partial<Record<Service,Set<string>>>={}; id=0;
  constructor(token:string,fetcher:typeof fetch=fetch){this.token=token;this.fetcher=fetcher;}
  async post(service:Service,payload:unknown):Promise<{payload:any;session:string|null}> {
    const response=await this.fetcher(`https://api-mcp.51ifind.com:8643/ds-mcp-servers/${endpoints[service]}`,{
      method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream','Authorization':this.token,...(this.sessions[service]?{'Mcp-Session-Id':this.sessions[service]!}:{})},
      body:JSON.stringify(payload),signal:AbortSignal.timeout(40000)
    });
    if(!response.ok) throw new Error(`iFinD HTTP ${response.status}`);
    const text=await response.text();
    return {payload:text.trim()?parseMcpBody(text):{},session:response.headers.get('mcp-session-id')};
  }
  async discover(service:Service):Promise<Set<string>> {
    if(this.tools[service]) return this.tools[service]!;
    const initial=await this.post(service,{jsonrpc:'2.0',id:++this.id,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'investment-evidence-verifier',version:'1.0.0'}}});
    if(initial.payload.error||!initial.session) throw new Error('iFinD 初始化失败或未返回会话');
    this.sessions[service]=initial.session;
    await this.post(service,{jsonrpc:'2.0',method:'notifications/initialized'});
    const listed=await this.post(service,{jsonrpc:'2.0',id:++this.id,method:'tools/list',params:{}});
    if(!Array.isArray(listed.payload.result?.tools)) throw new Error('iFinD 工具目录不可用');
    const tools=new Set<string>(listed.payload.result.tools.map((x:any)=>x.name));this.tools[service]=tools;return tools;
  }
  async call(service:Service,name:string,params:Record<string,unknown>):Promise<any>{
    const allowed=await this.discover(service);
    if(!allowed.has(name)) throw new Error(`工具 ${name} 不在已授权目录中`);
    return unwrapIfind((await this.post(service,{jsonrpc:'2.0',id:++this.id,method:'tools/call',params:{name,arguments:params}})).payload);
  }
}
export async function searchDisclosures(input:ResearchInput,query:string,context:ProviderContext):Promise<ToolResult>{
  const client=new IfindClient(context.ifindToken,context.fetcher);
  const result=await client.call('news','search_notice',{query:`${input.companyName} ${input.companyCode} ${query}`,time_start:`${input.previousYear}-01-01`,time_end:input.dataCutoff,size:4});
  let rows=result;
  if(typeof result==='string'){try{rows=JSON.parse(result);}catch{rows=[{'公告片段内容':result}];}}
  if(!Array.isArray(rows)) rows=[rows];
  const now=new Date().toISOString();
  const evidence:Evidence[]=rows.filter((x:any)=>x['公告片段内容']).map((row:any)=>({
    id:shortId(),sourceId:`notice:${input.companyCode}:${row['公告标题']||query}:${row['日期']||''}`,questionId:'disclosure',sourceType:'disclosure',title:row['公告标题']||'iFinD 公告检索片段',
    sourceUrl:row['公告链接']||row.url||null,locator:'iFinD 语义检索片段，页码待原文确认',reportPeriod:`${input.currentYear} / ${input.previousYear}`,disclosedAt:row['日期']||null,fetchedAt:now,
    rawValue:row['公告片段内容'],normalizedValue:null,unit:'原文',scope:'上市公司披露',relation:'unknown',limitations:['检索片段可能截断；需核对公告全文'],content:row['公告片段内容']
  }));
  return {ok:true,evidence,data:{retrieved:evidence.length,sourceCount:new Set(evidence.map(x=>x.sourceId)).size}};
}
