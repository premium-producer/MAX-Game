import {operatorRoute,operatorPosition,operatorScope} from './kdw-operator-model.mjs';
export function mountOperatorGame({bridge,getSession,getCatalog,getPhase,isBusy,goto,document=globalThis.document,now=()=>Date.now()}){
 let disposed=false,last=0,processing=false;
 function summary(){const session=getSession(),s=session?.snapshot?.state,catalog=getCatalog();if(!s)return null;const route=operatorRoute(catalog,s),index=operatorPosition(route,s),busy=processing||isBusy();
  return {at:now(),token:operatorScope(s),sessionId:s.sessionId,runId:s.runId,status:s.status,missionId:s.missionId,missionTitle:catalog.missions[s.missionId]?.title??'Главное меню',taskId:s.taskId,taskTitle:catalog.tasks[s.taskId]?.title??'',screenId:s.screenId,screenTitle:route[index]?.title??'',index:index+1,total:route.length,phase:getPhase(),ready:!!s.standReady,busy,canBack:!busy&&index>0,canNext:!busy&&index>=0&&index<route.length-1,remainingMs:session.snapshot.view.remainingMs,operatorControlled:s.operatorControlled===true,missions:Object.values(catalog.missions).map(m=>({id:m.missionId,title:m.title}))};
 }
 function publish(){const value=summary();if(value)document.documentElement.dataset.operatorGame=JSON.stringify(value);return value;}
 const stop=bridge?.onGameControl?.(async input=>{
  if(disposed||!['next','back'].includes(input?.action))throw Error('OPERATOR_ACTION_UNAVAILABLE');
  const session=getSession(),s=session?.snapshot?.state;if(!s||input.token!==operatorScope(s))throw Error('OPERATOR_STATE_CHANGED');
  if(processing||isBusy())throw Error('OPERATOR_TRANSITION_BUSY');
  const route=operatorRoute(getCatalog(),s),index=operatorPosition(route,s),target=route[index+(input.action==='next'?1:-1)];if(index<0||!target)throw Error('OPERATOR_BOUNDARY');
  processing=true;try{await goto({...target,missionId:s.missionId},input.token);processing=false;return publish();}finally{processing=false;}
 });
 return{tick(){if(!disposed&&now()-last>=250){last=now();publish();}},dispose(){disposed=true;stop?.();delete document.documentElement.dataset.operatorGame;},summary};
}
