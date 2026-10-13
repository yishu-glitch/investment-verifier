import {owner,repository,jsonResponse,checkOrigin} from '../../../lib/server';
import {validateInput} from '../../../lib/validate';
export async function GET(request:Request){const identity=owner(request);try{return jsonResponse({tasks:await repository().list(identity.id)},identity);}catch(error){return jsonResponse({error:(error as Error).message},identity,500);}}
export async function POST(request:Request){const identity=owner(request);try{checkOrigin(request);const input=validateInput(await request.json());if(!input.ok)return jsonResponse({error:input.errors.join('；')},identity,400);return jsonResponse(await repository().create(input.input!,identity.id),identity,201);}catch(error){return jsonResponse({error:(error as Error).message},identity,500);}}
