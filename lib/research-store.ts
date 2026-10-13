import type {ResearchInput,ResearchState} from './domain.ts';
interface Statement {bind(...values:any[]):Statement;run():Promise<any>;first():Promise<any>;all():Promise<{results:any[]}>}
export interface Database {prepare(query:string):Statement}
export class ResearchRepository{
 db:Database;
 constructor(db:Database){this.db=db;}
 fresh(taskId:string,version:number,input:ResearchInput):ResearchState{
  const now=new Date().toISOString();return {id:crypto.randomUUID(),taskId,version,createdAt:now,updatedAt:now,input,status:'draft',plan:[],events:[],evidence:[],conclusion:null,metrics:[],messages:[],usage:{model:'',inputTokens:0,outputTokens:0,toolCalls:0}};
 }
 async create(input:ResearchInput,owner:string):Promise<ResearchState>{
  const taskId=crypto.randomUUID();const state=this.fresh(taskId,1,input);
  await this.db.prepare('INSERT INTO tasks(id,owner,latest_version,created_at) VALUES(?,?,?,?)').bind(taskId,owner,state.id,state.createdAt).run();
  await this.db.prepare('INSERT INTO versions(id,task_id,number,state) VALUES(?,?,?,?)').bind(state.id,taskId,1,JSON.stringify(state)).run();return state;
 }
 async get(taskId:string,owner:string,versionId?:string):Promise<ResearchState|null>{
  const query=versionId?'SELECT v.state FROM versions v JOIN tasks t ON t.id=v.task_id WHERE t.id=? AND t.owner=? AND v.id=?':'SELECT v.state FROM versions v JOIN tasks t ON t.latest_version=v.id WHERE t.id=? AND t.owner=?';
  const row=await this.db.prepare(query).bind(taskId,owner,...(versionId?[versionId]:[])).first();return row?JSON.parse(row.state):null;
 }
 async save(state:ResearchState,owner:string):Promise<void>{
  const authorized=await this.get(state.taskId,owner,state.id);if(!authorized)throw new Error('没有更新此研究的权限');
  state.updatedAt=new Date().toISOString();await this.db.prepare('UPDATE versions SET state=? WHERE id=? AND task_id=?').bind(JSON.stringify(state),state.id,state.taskId).run();
 }
 async revise(taskId:string,input:ResearchInput,owner:string):Promise<ResearchState>{
  const current=await this.get(taskId,owner);if(!current)throw new Error('没有访问此研究的权限');
  const state=this.fresh(taskId,current.version+1,input);
  await this.db.prepare('INSERT INTO versions(id,task_id,number,state) VALUES(?,?,?,?)').bind(state.id,taskId,state.version,JSON.stringify(state)).run();
  const changed=await this.db.prepare('UPDATE tasks SET latest_version=? WHERE id=? AND owner=? AND latest_version=?').bind(state.id,taskId,owner,current.id).run();
  if((changed.meta?.changes??changed.changes)===0)throw new Error('研究版本已更新，请刷新后重试');return state;
 }
 async list(owner:string):Promise<{taskId:string;id:string;version:number;input:ResearchInput;status:string;updatedAt:string}[]>{
  const rows=await this.db.prepare('SELECT v.state FROM versions v JOIN tasks t ON t.latest_version=v.id WHERE t.owner=? ORDER BY t.created_at DESC LIMIT 40').bind(owner).all();
  return rows.results.map(row=>{const state:ResearchState=JSON.parse(row.state);return {taskId:state.taskId,id:state.id,version:state.version,input:state.input,status:state.status,updatedAt:state.updatedAt};});
 }
 async versions(taskId:string,owner:string):Promise<{id:string;version:number;status:string;input:ResearchInput;createdAt:string}[]>{
  const rows=await this.db.prepare('SELECT v.state FROM versions v JOIN tasks t ON t.id=v.task_id WHERE t.id=? AND t.owner=? ORDER BY v.number DESC').bind(taskId,owner).all();
  return rows.results.map(row=>{const s:ResearchState=JSON.parse(row.state);return {id:s.id,version:s.version,status:s.status,input:s.input,createdAt:s.createdAt};});
 }
}
