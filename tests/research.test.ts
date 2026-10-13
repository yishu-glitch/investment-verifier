import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
const input={companyCode:'600519.SH',companyName:'贵州茅台',claim:'利润增长是否来自主营业务',currentYear:2025,previousYear:2024,dataCutoff:'2026-10-13'};
function database(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('CREATE TABLE tasks(id TEXT PRIMARY KEY,owner TEXT NOT NULL,latest_version TEXT NOT NULL,created_at TEXT NOT NULL);CREATE TABLE versions(id TEXT PRIMARY KEY,task_id TEXT NOT NULL,number INTEGER NOT NULL,state TEXT NOT NULL);');
 return {prepare(query:string){let args:any[]=[];return {bind(...values:any[]){args=values;return this;},async run(){return sql.prepare(query).run(...args);},async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)}}}}};
}
test('research records survive updates and are isolated by owner',async()=>{
 const m=await import('../lib/research-store.ts').catch(()=>null);assert.equal(typeof m?.ResearchRepository,'function');
 const repo=new m!.ResearchRepository(database());const state=await repo.create(input,'alice');
 state.status='failed';state.evidence.push({id:'e-existing'} as any);await repo.save(state,'alice');
 const loaded=await repo.get(state.taskId,'alice');assert.equal(loaded?.status,'failed');assert.equal(loaded?.evidence[0].id,'e-existing');
 assert.equal(await repo.get(state.taskId,'bob'),null);
 await assert.rejects(repo.save(state,'bob'),/权限/);
});
test('new research versions retain old results without letting an old run overwrite the current version',async()=>{
 const m=await import('../lib/research-store.ts').catch(()=>null);assert.equal(typeof m?.ResearchRepository,'function');
 const repo=new m!.ResearchRepository(database());const old=await repo.create(input,'alice');
 const next=await repo.revise(old.taskId,{...input,currentYear:2024,previousYear:2023},'alice');
 assert.notEqual(next.id,old.id);assert.equal(next.version,2);
 old.status='completed';await repo.save(old,'alice');
 assert.equal((await repo.get(old.taskId,'alice'))?.id,next.id);
 assert.equal((await repo.get(old.taskId,'alice',old.id))?.status,'completed');
});
