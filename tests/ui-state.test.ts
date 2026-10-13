import test from 'node:test';import assert from 'node:assert/strict';
test('stream events from a previous version never replace the current research',async()=>{
 const m=await import('../lib/ui-state.ts').catch(()=>null);assert.equal(typeof m?.applyRunEvent,'function');
 const state={id:'new',status:'draft',events:[],evidence:[],plan:[],conclusion:null};
 assert.equal(m!.applyRunEvent(state as any,{versionId:'old',type:'done',status:'completed'} as any),state);
});
test('a failed execution keeps evidence already received',async()=>{
 const m=await import('../lib/ui-state.ts').catch(()=>null);assert.equal(typeof m?.applyRunEvent,'function');
 const state={id:'new',status:'running',events:[],evidence:[{id:'kept'}],plan:[],conclusion:null};
 const next=m!.applyRunEvent(state as any,{versionId:'new',type:'error',status:'failed',label:'接口失败'} as any);
 assert.equal(next.evidence[0].id,'kept');assert.equal(next.status,'failed');
});
