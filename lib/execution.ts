export class ToolExecutor{
 limit:number;used=0;
 constructor(limit=8){this.limit=limit;}
 async execute<T>(operation:()=>Promise<T>):Promise<T>{
  if(this.used>=this.limit)throw new Error('工具调用预算已用尽');this.used++;
  try{return await operation();}catch(error){
   const e=error as Error;
   if((e instanceof TypeError||/timeout|timed out|HTTP 50[234]|network/i.test(e.message))&&!/401|403|2003/.test(e.message))return await operation();
   throw error;
  }
 }
}
