import {env} from 'cloudflare:workers';
import {ResearchRepository} from './research-store';
import type {ProviderContext} from './domain';
export function providerContext():ProviderContext{
 const values=env as unknown as Record<string,string>;
 for(const name of ['FUYAO_API_KEY','IFIND_AUTH_TOKEN','OPENAI_API_KEY','OPENAI_MODEL'])if(!values[name])throw new Error(`服务端尚未配置 ${name}`);
 return {fuyaoKey:values.FUYAO_API_KEY,ifindToken:values.IFIND_AUTH_TOKEN,openaiKey:values.OPENAI_API_KEY,model:values.OPENAI_MODEL};
}
export function repository():ResearchRepository{if(!env.DB)throw new Error('研究数据库尚未配置');return new ResearchRepository(env.DB);}
export function owner(request:Request):{id:string;cookie?:string}{
 const account=request.headers.get('oai-authenticated-user-id');if(account)return {id:'account:'+account};
 const cookie=request.headers.get('cookie')||'';const match=cookie.match(/(?:^|;\s*)research_session=([a-f0-9-]{36})(?:;|$)/);
 if(match)return {id:'session:'+match[1]};
 const id=crypto.randomUUID();return {id:'session:'+id,cookie:`research_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${new URL(request.url).protocol==='https:'?'; Secure':''}`};
}
export function jsonResponse(value:unknown,identity:{cookie?:string},status=200):Response{return Response.json(value,{status,headers:{'Cache-Control':'no-store',...(identity.cookie?{'Set-Cookie':identity.cookie}:{})}});}
export function checkOrigin(request:Request):void{
 if(request.headers.get('sec-fetch-site')==='cross-site')throw new Error('不接受跨站写入请求');
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new Error('请求来源与站点不一致');
}
