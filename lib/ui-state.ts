import type {ResearchState,RunEvent,ToolResult,Conclusion,ResearchQuestion} from './domain.ts';
export function applyRunEvent(state:ResearchState,event:RunEvent):ResearchState{
 if(state.id!==event.versionId)return state;
 const next={...state,events:[...state.events,event],updatedAt:event.at||state.updatedAt};
 if(event.type==='plan')next.plan=(event.data as {questions:ResearchQuestion[]})?.questions||state.plan;
 if(event.type==='evidence'){const known=new Set(state.evidence.map(x=>x.id));next.evidence=[...state.evidence,...((event.data as ToolResult)?.evidence||[]).filter(x=>!known.has(x.id))];}
 if(event.type==='conclusion')next.conclusion=event.data as Conclusion;
 if(event.type==='error')next.status='failed';
 else if(event.type==='done')next.status=event.status==='completed'?'completed':event.status==='failed'?'failed':'stopped';
 else next.status='running';
 return next;
}
