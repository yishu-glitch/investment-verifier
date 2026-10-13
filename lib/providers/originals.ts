import type {ResearchInput,ProviderContext,ToolResult,Evidence} from '../domain.ts';
import {shortId} from '../domain.ts';
import {modelResponse,responseText} from '../openai.ts';
const domains=['cninfo.com.cn','sse.com.cn','szse.cn'];
export function isOfficialUrl(url:string):boolean{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)&&domains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d));}catch{return false;}}
export async function locateOriginals(input:ResearchInput,context:ProviderContext):Promise<ToolResult>{
 const result=await modelResponse(context,{tools:[{type:'web_search',filters:{allowed_domains:domains}}],tool_choice:'required',include:['web_search_call.action.sources'],max_output_tokens:1600,input:`查找 ${input.companyName}（${input.companyCode}）${input.currentYear} 和 ${input.previousYear} 年年度报告的官方原文。只查巨潮资讯、上交所、深交所，优先直接 PDF。输出报告标题和链接，不作投资判断，不给出任何财务结论。`});
 const sources: {url:string;title?:string}[]=(result.output||[]).filter((x:any)=>x.type==='web_search_call').flatMap((x:any)=>x.action?.sources||[]);
 const citations=(result.output||[]).filter((x:any)=>x.type==='message').flatMap((x:any)=>x.content||[]).flatMap((x:any)=>x.annotations||[]).filter((x:any)=>x.type==='url_citation');
 const all=[...citations,...sources].filter(x=>isOfficialUrl(x.url));const unique=Array.from(new Map(all.map(x=>[x.url,x])).values()).slice(0,5);
 const evidence:Evidence[]=unique.map(source=>({id:shortId(),sourceId:source.url,questionId:'original',sourceType:'original',title:source.title||'官方披露原文',sourceUrl:source.url,locator:'官方原文链接；打开核对对应章节',reportPeriod:`${input.currentYear} / ${input.previousYear}`,disclosedAt:null,fetchedAt:new Date().toISOString(),rawValue:source.url,normalizedValue:null,unit:'文档',scope:'原文定位',relation:'unknown',limitations:['该步骤仅定位原始材料，不代表系统已经逐页核验全文'],content:`已从官方域名检索到材料：${source.title||source.url}。此证据只供溯源，不独立支持投资命题。`}));
 return {ok:true,evidence,data:{located:unique,searchSummary:responseText(result),usage:result.usage}};
}
