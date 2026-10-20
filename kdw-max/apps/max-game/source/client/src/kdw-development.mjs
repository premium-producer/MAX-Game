// Local authoring controls. The server catalog never enables these commands.
export function reduceDevelopment(catalog,s,c,now,{sequence,enterTask,budget}){
 if(!catalog.kdwDevelopment)return 'DEVELOPMENT_UNAVAILABLE';
 if(c.type==='DEV_TIMER'){
  s.devTimerEnabled=c.active;
  if(s.missionId&&['scan','task'].includes(s.status)){
   const p=s.progress[s.missionId];
   s.devActivityDeadlineAt??=s.deadlineAt??now+budget;
   p.remainingMs=budget;s.deadlineAt=c.active?(s.pausedAt??now)+budget:null;
  }
  return null;
 }
 if(!s.missionId||!s.ownerActive)return 'TASK_UNAVAILABLE';
 const p=s.progress[s.missionId],ids=sequence(catalog,s,p),index=ids.indexOf(c.taskId);
 if(c.type==='SKIP_TASK'){
  if(s.status!=='task'||s.taskId!==c.taskId)return 'TASK_UNAVAILABLE';
  p.completed=p.completed.filter(id=>id!==c.taskId);
  if(!p.skipped.includes(c.taskId))p.skipped.push(c.taskId);
  if(!p.finished.includes(c.taskId))p.finished.push(c.taskId);
  p.currentTaskIndex++;p.currentScreenId=null;
  while(p.finished.includes(ids[p.currentTaskIndex]))p.currentTaskIndex++;
  s.runId++;s.resultReadyAt=null;
  enterTask(catalog,s,now,true);
  return null;
 }
 if(index<0||index>p.currentTaskIndex&&!p.finished.includes(c.taskId))return 'TASK_UNAVAILABLE';
 const task=catalog.tasks[c.taskId];
 for(const key of ['completed','skipped','finished'])p[key]=p[key].filter(id=>id!==c.taskId);
 for(const screenId of Object.keys(task.screens))delete p.answers[screenId];
 if(p.interactions)delete p.interactions[c.taskId];
 if(task.coreCatalog)delete p.channelModel;
 if(c.taskId==='business.channel')delete p.postsActivity;
 if(c.taskId==='business.store')delete p.storeActivity;
 p.currentTaskIndex=index;p.currentScreenId=null;p.scanned=true;
 s.scanned=true;s.runId++;s.resultReadyAt=null;
 enterTask(catalog,s,now,true);
 return null;
}

export function finishDevelopmentState(previous,s,c,now,budget){
 if(s.devTimerEnabled===undefined)return;
 const p=s.missionId?s.progress[s.missionId]:null;
 if(c.type==='RETURN_MENU'&&previous.missionId){
  s.progress[previous.missionId].devActivityRemainingMs=(previous.devActivityDeadlineAt??now+budget)-(previous.pausedAt??now);
  s.devActivityDeadlineAt=null;
 }else if(s.taskId&&(s.taskId!==previous.taskId||s.runId!==previous.runId)){
  s.devActivityDeadlineAt=now+(c.type==='SELECT_MISSION'?(p.devActivityRemainingMs??budget):budget);
 }else if(c.type==='OWNER_CHANGED'&&c.active&&previous.pausedAt!==null&&s.devActivityDeadlineAt!=null){
  s.devActivityDeadlineAt+=now-previous.pausedAt;
 }
 if(!s.devTimerEnabled)s.deadlineAt=null;
}

// Posting animation keeps advancing even when the countdown is switched off.
export function activityRemaining(state,now){
 const deadline=state.devActivityDeadlineAt??state.deadlineAt;
 return deadline==null?60000:deadline-(state.pausedAt??now);
}
