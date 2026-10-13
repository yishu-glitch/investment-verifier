import type {ProviderContext} from './domain.ts';
export async function modelResponse(context:ProviderContext,body:Record<string,unknown>):Promise<any>{
 const response=await (context.fetcher||fetch)('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+context.openaiKey,'Content-Type':'application/json'},body:JSON.stringify({model:context.model,store:false,reasoning:{effort:'low'},...body}),signal:AbortSignal.timeout(120000)});
 const data:any=await response.json();
 if(!response.ok)throw new Error(`OpenAI HTTP ${response.status}：${data.error?.code||data.error?.type||'模型请求失败'}`);
 if(data.status==='incomplete')throw new Error('模型输出未完成，请减少任务范围或重试');
 return data;
}
export function responseText(response:any):string{return (response.output||[]).filter((x:any)=>x.type==='message').flatMap((x:any)=>x.content||[]).filter((x:any)=>x.type==='output_text').map((x:any)=>x.text).join('\n');}
export function jsonFormat(name:string,schema:unknown){return {format:{type:'json_schema',name,strict:true,schema}};}

export const conclusionSchema={type:'object',additionalProperties:false,required:['verdict','summary','claims','conflicts','limitations','revisionTriggers'],properties:{
 verdict:{type:'string',enum:['支持','部分支持','不支持','证据不足']},summary:{type:'string'},
 claims:{type:'array',items:{type:'object',additionalProperties:false,required:['text','evidenceIds','relation'],properties:{text:{type:'string'},evidenceIds:{type:'array',items:{type:'string'}},relation:{type:'string',enum:['support','oppose','unknown']}}}},
 conflicts:{type:'array',items:{type:'object',additionalProperties:false,required:['description','evidenceIds','resolution'],properties:{description:{type:'string'},evidenceIds:{type:'array',items:{type:'string'}},resolution:{type:'string'}}}},
 limitations:{type:'array',items:{type:'string'}},revisionTriggers:{type:'array',items:{type:'object',additionalProperties:false,required:['condition','effect'],properties:{condition:{type:'string'},effect:{type:'string'}}}}
}};
