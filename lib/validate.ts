import type {Conclusion,Evidence,ResearchInput} from './domain.ts';
export function validateConclusion(conclusion:Conclusion,evidence:Evidence[]):{ok:boolean;errors:string[]}{
 const errors:string[]=[];const ids=new Set(evidence.map(x=>x.id));
 const amounts=evidence.flatMap(e=>[...(typeof e.normalizedValue==='number'?[e.normalizedValue]:[]),...((e.content||'')+' '+(e.rawValue||'')).matchAll(/-?\d[\d,]*(?:\.\d+)?/g)].map(x=>typeof x==='number'?x:Number(x[0].replaceAll(',','')))).filter(Number.isFinite);
 const narrative=[conclusion.summary,...(conclusion.claims||[]).map(c=>c.text),...(conclusion.conflicts||[]).flatMap(c=>[c.description,c.resolution])].join(' ');
 for(const match of narrative.matchAll(/(-?[\d,]+(?:\.\d+)?)\s*(亿|万)?元/g)){
  const scale=match[2]==='亿'?1e8:match[2]==='万'?1e4:1;
  const value=Number(match[1].replaceAll(',',''))*scale;
  const precision=match[1].includes('.')?match[1].split('.')[1].length:0;
  const tolerance=.51*Math.pow(10,-precision)*scale;
  if(!amounts.some(n=>Math.abs(n-value)<=tolerance))errors.push(`金额 ${match[0]} 无法与原始证据匹配，请核对单位或改为定性描述，金额保留在计算对照表`);
 }
 if(!['支持','部分支持','不支持','证据不足'].includes(conclusion.verdict))errors.push('结论类别无效');
 if(!conclusion.summary?.trim())errors.push('结论摘要缺失');
 if(conclusion.verdict!=='证据不足'&&!conclusion.claims?.length)errors.push('判断缺少可追溯依据');
 for(const claim of conclusion.claims||[]){
  if(!claim.evidenceIds?.length)errors.push('论据缺少证据引用');
  for(const id of claim.evidenceIds||[])if(!ids.has(id))errors.push(`引用 ${id} 不存在`);
  if(claim.relation!=='unknown'&&claim.evidenceIds?.length&&claim.evidenceIds.every(id=>evidence.find(e=>e.id===id)?.sourceType==='original'))errors.push('原文链接定位不能独立支持或反对财务判断');
 }
 for(const conflict of conclusion.conflicts||[])for(const id of conflict.evidenceIds||[])if(!ids.has(id))errors.push(`冲突引用 ${id} 不存在`);
 if(!conclusion.limitations?.length)errors.push('必须明确数据与判断限制');
 if(!conclusion.revisionTriggers?.length)errors.push('必须说明改变判断的条件');
 if(/保证收益|必涨|稳赚|建议买入|建议卖出|直接买入|直接卖出/.test(JSON.stringify(conclusion)))errors.push('结论超出投资研究边界');
 return {ok:errors.length===0,errors};
}
export function validateInput(value:any):{ok:boolean;errors:string[];input?:ResearchInput}{
 const errors:string[]=[];
 if(!value||!/^\d{6}\.(SH|SZ|BJ)$/.test(value.companyCode||''))errors.push('请提供完整 A 股证券代码，例如 600519.SH');
 if(typeof value?.companyName!=='string'||!value.companyName.trim()||value.companyName.length>80)errors.push('请填写公司名称');
 if(typeof value?.claim!=='string'||value.claim.trim().length<5||value.claim.length>600)errors.push('命题需为 5–600 字');
 if(!Number.isInteger(value?.currentYear)||!Number.isInteger(value?.previousYear)||value.currentYear<=value.previousYear||value.previousYear<2016||value.currentYear>new Date().getFullYear())errors.push('请设置有效且可比较的年度报告期');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value?.dataCutoff||'')||Number.isNaN(Date.parse(value.dataCutoff)))errors.push('数据截止日期无效');
 return {ok:!errors.length,errors,...(!errors.length?{input:{...value,companyName:value.companyName.trim(),claim:value.claim.trim()}}:{})};
}
