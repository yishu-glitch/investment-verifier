import {owner,repository,jsonResponse,checkOrigin} from '../../../lib/server';
import type {ResearchState} from '../../../lib/domain';
import archive from '../../../lib/cases/maotai-2025.json';

/** 载入 Codex/联调写入的真实研究存档；案例源统一用 lib/cases/，避免与 data/ 重复。 */
export async function POST(request:Request){
 const identity=owner(request);
 try{
  checkOrigin(request);
  const template=archive as ResearchState;
  if(!template?.input||!template.conclusion)return jsonResponse({error:'示例研究存档不可用'},identity,500);
  const repo=repository();
  const created=await repo.create(template.input,identity.id);
  const state:ResearchState={
   ...structuredClone(template),
   id:created.id,
   taskId:created.taskId,
   version:1,
   createdAt:created.createdAt,
   updatedAt:new Date().toISOString(),
   events:(template.events||[]).map(event=>({...event,versionId:created.id})),
  };
  await repo.save(state,identity.id);
  return jsonResponse(state,identity,201);
 }catch(error){
  return jsonResponse({error:(error as Error).message},identity,500);
 }
}
