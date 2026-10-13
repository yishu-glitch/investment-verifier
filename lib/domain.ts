export type Relation = 'support' | 'oppose' | 'unknown';
export type Verdict = '支持' | '部分支持' | '不支持' | '证据不足';
export interface ResearchInput {
  companyCode: string;
  companyName: string;
  claim: string;
  currentYear: number;
  previousYear: number;
  dataCutoff: string;
}
export interface Evidence {
  id: string;
  sourceId: string;
  questionId: string;
  sourceType: 'financial' | 'disclosure' | 'calculation' | 'original';
  title: string;
  sourceUrl: string | null;
  locator: string;
  reportPeriod: string;
  disclosedAt: string | null;
  fetchedAt: string;
  rawValue: string;
  normalizedValue: number | null;
  unit: string;
  scope: string;
  relation: Relation;
  limitations: string[];
  content: string;
}
export interface ToolResult {
  ok: boolean;
  evidence: Evidence[];
  data?: unknown;
  error?: {type:string;message:string;retryable:boolean};
}
export interface ProviderContext {
  fuyaoKey: string;
  ifindToken: string;
  openaiKey: string;
  model: string;
  fetcher?: typeof fetch;
}
export interface ResearchQuestion {id:string;question:string;method:string;expectedSources:string[]}
export interface Conclusion {
  verdict: Verdict;
  summary: string;
  claims: {text:string;evidenceIds:string[];relation:Relation}[];
  conflicts: {description:string;evidenceIds:string[];resolution:string}[];
  limitations: string[];
  revisionTriggers: {condition:string;effect:string}[];
}
export interface RunEvent {
  runId: string;
  versionId: string;
  stepId: string;
  type: 'plan' | 'step' | 'evidence' | 'conclusion' | 'error' | 'done';
  status: 'running' | 'completed' | 'failed' | 'stopped';
  label: string;
  at: string;
  data?: unknown;
}
export function shortId(prefix='e'):string {return prefix+'_'+crypto.randomUUID().slice(0,12)}
