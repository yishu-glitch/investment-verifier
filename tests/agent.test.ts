import test from 'node:test';
import assert from 'node:assert/strict';

test('narrative amounts must match source values after unit conversion',async()=>{
 const {validateConclusion}=await import('../lib/validate.ts');
 const base={verdict:'不支持',summary:'归母净利润为82.32亿元',claims:[{text:'利润下降',evidenceIds:['profit'],relation:'oppose'}],conflicts:[],limitations:['片段核验'],revisionTriggers:[{condition:'数据更正',effect:'重算'}]};
 const evidence=[{id:'profit',sourceType:'financial',normalizedValue:82320067101.68,content:'归母净利润：82320067101.68 元',rawValue:'82320067101.68'}];
 assert.equal(validateConclusion(base as any,evidence as any).ok,false,'tenfold amount error must fail');
 assert.equal(validateConclusion({...base,summary:'归母净利润为823.20亿元'} as any,evidence as any).ok,true);
});

test('conclusions cannot reference evidence that was not collected',async()=>{
 const m=await import('../lib/validate.ts').catch(()=>null);
 assert.equal(typeof m?.validateConclusion,'function','conclusion validator must exist');
 const result=m!.validateConclusion({verdict:'支持',summary:'已有依据',claims:[{text:'利润增长',evidenceIds:['not-real'],relation:'support'}],conflicts:[],limitations:[],revisionTriggers:[]},[]);
 assert.equal(result.ok,false);assert.match(result.errors.join(' '),/不存在/);
});

test('positive conclusions must include cited findings and explicit limits',async()=>{
 const m=await import('../lib/validate.ts').catch(()=>null);
 assert.equal(typeof m?.validateConclusion,'function');
 const result=m!.validateConclusion({verdict:'支持',summary:'有依据',claims:[],conflicts:[],limitations:[],revisionTriggers:[]},[]);
 assert.equal(result.ok,false);
});

test('tool budget prevents the ninth execution and transient failures retry only once',async()=>{
 const m=await import('../lib/execution.ts').catch(()=>null);
 assert.equal(typeof m?.ToolExecutor,'function');
 const exec=new m!.ToolExecutor(8);
 let successful=0;
 for(let i=0;i<8;i++) await exec.execute(async()=>{successful++;return {ok:true};});
 await assert.rejects(exec.execute(async()=>{successful++;return {ok:true};}),/预算/);
 assert.equal(successful,8);
 let attempts=0;
 const retry=new m!.ToolExecutor(8);
 await assert.rejects(retry.execute(async()=>{attempts++;throw new TypeError('network failed');}),/network failed/);
 assert.equal(attempts,2);
});

test('authentication failures are not retried',async()=>{
 const m=await import('../lib/execution.ts').catch(()=>null);
 assert.equal(typeof m?.ToolExecutor,'function');
 let attempts=0;
 await assert.rejects(new m!.ToolExecutor(8).execute(async()=>{attempts++;throw new Error('HTTP 401');}),/401/);
 assert.equal(attempts,1);
});

test('locating a document URL alone cannot support a financial conclusion',async()=>{
 const {validateConclusion}=await import('../lib/validate.ts');
 const conclusion={verdict:'支持',summary:'盈利改善',claims:[{text:'盈利改善',evidenceIds:['url-only'],relation:'support'}],conflicts:[],limitations:['原文未核验'],revisionTriggers:[{condition:'新增报告',effect:'重新判断'}]};
 const result=validateConclusion(conclusion as any,[{id:'url-only',sourceType:'original'} as any]);assert.equal(result.ok,false);
});
