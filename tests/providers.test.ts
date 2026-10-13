import test from 'node:test';
import assert from 'node:assert/strict';

test('MCP only executes tools discovered for that service and retains its session', async () => {
  const module = await import('../lib/providers/ifind.ts').catch(()=>null);
  assert.equal(typeof module?.IfindClient,'function','MCP adapter must be implemented');
  const seen:string[]=[];
  const fetcher=async (_url:unknown,options:any)=>{
    const body=JSON.parse(options.body); seen.push(body.method);
    if(body.method==='initialize') return Response.json({result:{protocolVersion:'2025-03-26'}},{headers:{'Mcp-Session-Id':'test-session'}});
    assert.equal(options.headers['Mcp-Session-Id'],'test-session');
    if(body.method==='tools/list') return Response.json({result:{tools:[{name:'get_stock_financials'}]}});
    if(body.method==='tools/call') return Response.json({result:{content:[{type:'text',text:'{"code":1,"msg":"success","data":{"answer":"营收100元"}}'}]}});
    return new Response(null,{status:202});
  };
  const client=new module!.IfindClient('fixture-token',fetcher);
  const result=await client.call('stock','get_stock_financials',{query:'公司2025年度营收'});
  assert.equal(result.answer,'营收100元');
  await assert.rejects(client.call('stock','delete_account',{}),/不在/);
  assert.equal(seen.filter(x=>x==='tools/call').length,1);
});

test('the MCP parser accepts SSE transport and rejects application-level errors', async () => {
  const module = await import('../lib/providers/ifind.ts').catch(()=>null);
  assert.equal(typeof module?.parseMcpBody,'function');
  assert.deepEqual(module!.parseMcpBody('event: message\ndata: {"result":{"tools":[]}}\n\n'),{result:{tools:[]}});
  assert.throws(()=>module!.unwrapIfind({result:{content:[{type:'text',text:'{"code":-1,"msg":"denied","data":null}'}]}}),/denied/);
});

test('a failed cash-flow endpoint does not discard income evidence already fetched',async()=>{
 const {fetchFinancials}=await import('../lib/providers/fuyao.ts');
 const fetcher=async (url:unknown)=>String(url).includes('income-statements')?Response.json({code:0,data:{item:[{thscode:'600519.SH',ticker:'600519',period:'annual',fiscal_year:2025,fiscal_period:'FY',report_date_ms:Date.parse('2026-04-17'),period_end_ms:Date.parse('2025-12-31'),currency:'CNY',operating_income:100,operating_costs:30,net_profit:20,parent_holder_net_profit:18}]}}):new Response('unavailable',{status:503});
 const result=await fetchFinancials({companyCode:'600519.SH',companyName:'贵州茅台',claim:'盈利改善',currentYear:2025,previousYear:2024,dataCutoff:'2026-10-13'},{fuyaoKey:'fixture',ifindToken:'fixture',openaiKey:'fixture',model:'fixture',fetcher:fetcher as typeof fetch});
 assert.equal(result.ok,false);assert.ok(result.evidence.some(e=>e.normalizedValue===100));assert.match(result.error?.message||'',/现金流|cash-flow/);
});
