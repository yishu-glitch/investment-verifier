import {owner,repository,providerContext,jsonResponse,checkOrigin} from '../../../../../lib/server';
import {answerResearchQuestion} from '../../../../../lib/agent';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const identity=owner(request);try{
  checkOrigin(request);const {id}=await params;const body:any=await request.json();
  if(typeof body.question!=='string'||!body.question.trim()||body.question.length>1500)return jsonResponse({error:'请输入 1–1500 字的研究问题'},identity,400);
  const repo=repository();const state=await repo.get(id,identity.id,body.versionId);
  if(!state)return jsonResponse({error:'未找到研究版本'},identity,404);
  if(state.status==='running')return jsonResponse({error:'请等待本轮验证完成后追问，或查看已取得的证据'},identity,409);
  state.messages.push({role:'user',text:body.question.trim(),at:new Date().toISOString()});
  const answer=await answerResearchQuestion(state,body.question.trim(),providerContext(),body.evidenceId);
  state.messages.push({role:'assistant',text:answer,at:new Date().toISOString()});await repo.save(state,identity.id);
  return jsonResponse({answer,messages:state.messages,usage:state.usage},identity);
 }catch(error){return jsonResponse({error:(error as Error).message},identity,500);}
}
