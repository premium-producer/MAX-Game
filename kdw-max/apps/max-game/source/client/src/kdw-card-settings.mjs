// Pinned per activity so renderer and authoritative receipts share one schedule.
export const CARD_SETTINGS=Object.freeze({pauseTaskTimer:true,enterMs:800,holdMs:2000,exitMs:800,maxOverlapPercent:15,minOpacityPercent:15});
export const cardSettings=state=>({...CARD_SETTINGS,...state.standPolicy?.value.max.cardActivity});
export function pauseCardTimer(state,settings,now){
 if(!state.standPolicy||!settings.pauseTaskTimer||state.deadlineAt==null)return;
 state.cardTaskPause={taskId:state.taskId,screenId:state.screenId,runId:state.runId,deadlineAt:state.deadlineAt,remainingMs:Math.max(0,state.deadlineAt-now)};
 state.deadlineAt=null;
}
export function finishCardTimer(previous,state,now){
 const pause=state.cardTaskPause;if(!pause)return;
 if(state.status==='task'&&state.taskId===pause.taskId&&state.screenId===pause.screenId&&state.runId===pause.runId)return;
 if(state.status==='task'&&state.taskId===pause.taskId&&state.runId===pause.runId&&state.deadlineAt==null)state.deadlineAt=now+pause.remainingMs;
 delete state.cardTaskPause;
}
