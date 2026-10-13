import type {ProviderContext,ResearchInput,ToolResult,Evidence} from '../domain.ts';
import {shortId} from '../domain.ts';
import {unwrapFuyao} from '../finance.ts';

const fields:Record<string,string>={operating_income:'营业收入',operating_costs:'营业成本',operating_profit:'营业利润',profit_total:'利润总额',net_profit:'净利润',parent_holder_net_profit:'归母净利润',sales_fee:'销售费用',manage_fee:'管理费用',research_and_development_expenses:'研发费用',act_cash_flow_net:'经营活动现金流净额',assets_total:'资产总额',accounts_receivable:'应收账款',total_debt:'负债总额'};
export async function fetchFinancials(input:ResearchInput,context:ProviderContext):Promise<ToolResult>{
  const evidence:Evidence[]=[];const data:Record<string,unknown[]>={};const errors:string[]=[];
  for(const table of ['income-statements','cash-flow-statements']){
    try{
    const url=`https://fuyao.aicubes.cn/api/a-share/financials/${table}?thscode=${encodeURIComponent(input.companyCode)}&period=annual&limit=10`;
    const response=await (context.fetcher||fetch)(url,{headers:{'X-api-key':context.fuyaoKey},signal:AbortSignal.timeout(25000)});
    if(!response.ok) throw new Error(`扶摇 HTTP ${response.status}`);
    const rows=unwrapFuyao(await response.json()).filter(row=>[input.currentYear,input.previousYear].includes(Number(row.fiscal_year)));
    data[table]=rows;
    for(const row of rows){
      const disclosed=typeof row.report_date_ms==='number'?new Date(row.report_date_ms).toISOString().slice(0,10):null;
      if(disclosed&&disclosed>input.dataCutoff) continue;
      for(const [key,label] of Object.entries(fields)){
        if(!(key in row)) continue;
        const value=typeof row[key]==='number'?row[key] as number:null;
        evidence.push({id:shortId(),sourceId:`report:${input.companyCode}:${row.fiscal_year}:annual`,questionId:'financial',sourceType:'financial',title:`${row.fiscal_year} 年度 · ${label}`,sourceUrl:`https://fuyao.aicubes.cn/docs/api-reference/financials/`,locator:`${table} / ${row.fiscal_year} / ${key}`,reportPeriod:`${row.fiscal_year} FY`,disclosedAt:disclosed,fetchedAt:new Date().toISOString(),rawValue:JSON.stringify(row[key]),normalizedValue:value,unit:'元',scope:'年度累计 · 合并报表 · CNY',relation:'unknown',limitations:value===null?['该字段未披露']:[],content:`${label}：${value===null?'未披露':value+' 元'}；原始字段 ${key}。`});
      }
    }
    }catch(error){errors.push(`${table}：${(error as Error).message}`);}
  }
  return {ok:!errors.length,evidence,data,...(errors.length?{error:{type:'partial_data',message:errors.join('；'),retryable:false}}:{})};
}
