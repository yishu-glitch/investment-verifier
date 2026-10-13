import type {Evidence,ResearchState} from './domain.ts';
import {growth} from './finance.ts';
export function calculateMetrics(evidence:Evidence[],currentYear:number,previousYear:number):ResearchState['metrics']{
 const by=(year:number,key:string)=>evidence.find(e=>e.sourceType==='financial'&&e.reportPeriod===`${year} FY`&&e.locator.endsWith('/ '+key));
 const metrics:ResearchState['metrics']=[];
 for(const [field,label] of [['operating_income','营业收入'],['parent_holder_net_profit','归母净利润'],['operating_profit','营业利润'],['act_cash_flow_net','经营现金流净额']]){
  const c=by(currentYear,field),p=by(previousYear,field);
  metrics.push({label,current:c?.normalizedValue??null,previous:p?.normalizedValue??null,unit:'元',growth:growth(c?.normalizedValue??null,p?.normalizedValue??null),evidenceIds:[c?.id,p?.id].filter(Boolean) as string[]});
 }
 const margin=(year:number)=>{const revenue=by(year,'operating_income'),cost=by(year,'operating_costs');return revenue?.normalizedValue&&cost?.normalizedValue!==null&&cost?.normalizedValue!==undefined?(revenue.normalizedValue-cost.normalizedValue)/revenue.normalizedValue*100:null};
 metrics.push({label:'毛利率',current:margin(currentYear),previous:margin(previousYear),unit:'%',growth:null,evidenceIds:['operating_income','operating_costs'].flatMap(field=>[by(currentYear,field)?.id,by(previousYear,field)?.id]).filter(Boolean) as string[]});
 return metrics;
}
