import {owner,repository,providerContext,jsonResponse,checkOrigin} from '../../../../../lib/server';
import {runResearch} from '../../../../../lib/agent';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const identity=owner(request);let state,repo,context;
 try{checkOrigin(request);repo=repository();const {id}=await params;state=await repo.get(id,identity.id);if(!state)return jsonResponse({error:'未找到此研究任务'},identity,404);if(state.status==='running')return jsonResponse({error:'此版本正在运行'},identity,409);if(state.status==='completed'||state.status==='stopped')return jsonResponse({error:'请创建新版本后重新验证'},identity,409);context=providerContext();}
 catch(error){return jsonResponse({error:(error as Error).message},identity,500);}
 state.status='running';await repo.save(state,identity.id);
 const cancellation=new AbortController();let disconnected=false;
 const stop=()=>{disconnected=true;cancellation.abort();};request.signal.addEventListener('abort',stop,{once:true});
 context.signal=cancellation.signal;const fetcher=context.fetcher||fetch;
 context.fetcher=((input,options)=>fetcher(input,{...options,signal:options?.signal?AbortSignal.any([cancellation.signal,options.signal]):cancellation.signal})) as typeof fetch;
 const encoder=new TextEncoder();const stream=new ReadableStream({async start(controller){
  const heartbeat=setInterval(()=>{try{controller.enqueue(encoder.encode(': connection alive\n\n'));}catch{disconnected=true;}},15000);
  try{for await(const event of runResearch(state,context)){
   await repo.save(state,identity.id);
   if(disconnected){state.status='stopped';await repo.save(state,identity.id);break;}
   try{controller.enqueue(encoder.encode('data: '+JSON.stringify(event)+'\n\n'));}catch{disconnected=true;}
  }}catch(error){state.status='failed';await repo.save(state,identity.id);try{controller.enqueue(encoder.encode('data: '+JSON.stringify({type:'error',label:(error as Error).message,versionId:state.id})+'\n\n'));}catch{}}
  finally{clearInterval(heartbeat);request.signal.removeEventListener('abort',stop);try{controller.close();}catch{}}
 },async cancel(){stop();state.status='stopped';await repo.save(state,identity.id);}});
 return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no',...(identity.cookie?{'Set-Cookie':identity.cookie}:{})}});
}
