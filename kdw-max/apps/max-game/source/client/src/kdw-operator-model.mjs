import {createGameModel,dispatchGameCommand} from './core/game-core.mjs';
// Resume the embedded task kernel after an operator moved the outer mission.
// Replay valid navigation edges rather than forging a snapshot or completion.
export function resumeOperatorTask(catalog,model,{sessionId,screenId,commandId}){
 const route=start=>{const queue=[{screen:start,path:[]}],seen=new Set([start]);for(let i=0;i<queue.length;i++){const row=queue[i];if(row.screen===screenId)return row.path;for(const a of catalog.screens[row.screen]?.actions??[]){const next=a.outcome.screenId;if(a.outcome.kind==='complete-task'||!next||seen.has(next))continue;seen.add(next);queue.push({screen:next,path:[...row.path,a.actionId]});}}return null;};
 let current=model?.state.status==='active'?model:null,path=current?route(current.state.screenId):null;
 if(!path){current=createGameModel(catalog,{sessionId});path=route(current.state.screenId);}
 if(!path)return null;
 for(const [i,actionId]of path.entries()){const s=current.state,result=dispatchGameCommand(catalog,current,{schemaVersion:1,type:'ACT',commandId:commandId.slice(0,90)+'.resume.'+i,sessionId,contentRevision:catalog.contentRevision,missionId:catalog.missionId,taskId:s.taskId,screenId:s.screenId,expectedRevision:s.revision,actionId});if(!result.reply.ok)return null;current=result.model;}
 return current;
}
// Operator navigation is explicit and independent of visitor ACT.
export function operatorRoute(catalog,state){
 const mission=catalog.missions[state.missionId];if(!mission)return [];
 const ids=[...mission.taskIds],branch=state.progress[state.missionId]?.businessTool;
 if(branch&&!ids.includes('business.'+branch))ids.push('business.'+branch);
 const route=[{screenId:'operator.scan',taskId:null,title:'Ожидание ладони'}];
 for(const taskId of ids){const task=catalog.tasks[taskId];let screens=Object.keys(task.screens);
  if(screens[0]!==task.startScreenId){const prefix=[],seen=new Set();let id=task.startScreenId;while(id&&!seen.has(id)&&id!==screens[0]){seen.add(id);prefix.push(id);id=task.screens[id]?.actions.find(a=>['navigate','skip-screen'].includes(a.outcome.kind)&&!seen.has(a.outcome.screenId))?.outcome.screenId;}screens=[...prefix,...screens.filter(s=>!seen.has(s))];}
  for(const screenId of screens)route.push({taskId,screenId,title:task.screens[screenId].title||screenId,taskTitle:task.title});
 }
 route.push({screenId:'operator.completed',taskId:null,title:'Итог миссии'});return route;
}
export const operatorScope=s=>JSON.stringify([s.sessionId,s.runId,s.status,s.missionId,s.taskId,s.screenId]);
export function operatorPosition(route,s){return s.status==='scan'?0:['completed','incomplete','expired'].includes(s.status)?route.length-1:route.findIndex(r=>r.screenId===s.screenId&&r.taskId===s.taskId);}
export function operatorGoto(catalog,s,c,now){
 if(!s.missionId||c.missionId!==s.missionId)return 'OPERATOR_MISSION_CHANGED';
 const target=operatorRoute(catalog,s).find(r=>r.screenId===c.screenId&&r.taskId===(c.taskId??null));if(!target)return 'OPERATOR_SCREEN_UNAVAILABLE';
 const p=s.progress[s.missionId],ids=[...catalog.missions[s.missionId].taskIds],branch=p.businessTool;if(branch&&!ids.includes('business.'+branch))ids.push('business.'+branch);
 s.runId++;s.resultReadyAt=null;s.pausedAt=null;s.deadlineAt=null;s.standReady=false;s.standEndReason=null;s.lastTouchAt=now;s.operatorControlled=true;
 if(target.screenId==='operator.scan'){s.status='scan';s.scanned=false;p.scanned=false;s.taskId=null;s.screenId=null;return null;}
 s.scanned=true;p.scanned=true;
 if(target.screenId==='operator.completed'){s.status='incomplete';s.taskId=null;s.screenId=null;p.currentTaskIndex=ids.length;return null;}
 p.operatorTasks??=[];if(!p.operatorTasks.includes(target.taskId))p.operatorTasks.push(target.taskId);
 const index=ids.indexOf(target.taskId);p.currentTaskIndex=index;p.currentScreenId=target.screenId;
 for(const key of ['completed','skipped','finished'])p[key]=p[key].filter(id=>ids.indexOf(id)<index);
 for(const id of ids.slice(0,index)){if(!p.finished.includes(id))p.finished.push(id);if(!p.completed.includes(id)&&!p.skipped.includes(id))p.skipped.push(id);}
 s.status='task';s.taskId=target.taskId;s.screenId=target.screenId;s.screenEnteredAt=now;s.startedAt=now;p.remainingMs=60000;
 if(s.missionId==='business')p.answers.businessType??=s.standPolicy?.value.defaults.businessType??'cafe';
 if(!s.standPolicy)s.deadlineAt=now+60000;
 return null;
}
