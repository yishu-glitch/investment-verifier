import {env} from 'cloudflare:workers';
import {IfindClient} from '../../../lib/providers/ifind';
export async function GET(request:Request){
 const e=env as unknown as Record<string,string>;
 const config={openai:!!e.OPENAI_API_KEY,fuyao:!!e.FUYAO_API_KEY,ifind:!!e.IFIND_AUTH_TOKEN,model:e.OPENAI_MODEL||null};
 if(new URL(request.url).searchParams.get('probe')!=='true'||e.ALLOW_DIAGNOSTICS!=='true')return Response.json({ok:true,configured:config});
 const results:any={};
 try{const client=new IfindClient(e.IFIND_AUTH_TOKEN);results.ifind={ok:true,toolCount:(await client.discover('stock')).size};}catch(error){results.ifind={ok:false,error:(error as Error).message};}
 try{const response=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:'Bearer '+e.OPENAI_API_KEY},signal:AbortSignal.timeout(20000)});results.openai={ok:response.ok,status:response.status};}catch(error){results.openai={ok:false,error:(error as Error).name};}
 try{const response=await fetch('https://fuyao.aicubes.cn/api/a-share/financials/income-statements?thscode=600519.SH&period=annual&limit=2',{headers:{'X-api-key':e.FUYAO_API_KEY},signal:AbortSignal.timeout(20000)});const data:any=await response.json();results.fuyao={ok:response.ok&&data.code===0,status:response.status,code:data.code};}catch(error){results.fuyao={ok:false,error:(error as Error).name};}
 return Response.json({ok:Object.values(results).every((x:any)=>x.ok),configured:config,results});
}
