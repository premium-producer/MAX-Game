import {pauseCardTimer} from './kdw-card-settings.mjs';
export const production=s=>!!s.standPolicy;
export const timing=(s,key)=>s.standPolicy.value.max.timings[key]*1000;
export function prepareProductionTask(s){s.deadlineAt=null;s.standReady=false;}
export function completeByTimeout(s,now){
 const p=s.progress[s.missionId],id=s.taskId,d=s.standPolicy.value.defaults;
 p.skipped=p.skipped.filter(t=>t!==id);if(!p.completed.includes(id))p.completed.push(id);if(!p.finished.includes(id))p.finished.push(id);
 p.autoCompleted??=[];if(!p.autoCompleted.includes(id))p.autoCompleted.push(id);
 if(s.missionId==='business')p.answers.businessType??=d.businessType;
 if(id==='blogger.channel'){
  p.interactions??={};const v=p.interactions[id]??{};
  p.interactions[id]={schemaVersion:2,name:v.name?.trim()||d.channelName,description:v.description??d.channelDescription,avatar:v.avatar??'cinema',visibility:v.visibility??'private',slug:v.slug?.trim()||d.channelSlug};
  p.personalChannel={...p.interactions[id],id:'channel.'+s.runId,created:true};
 }
 if(id==='blogger.comments'){p.interactions??={};const reply=p.interactions[id]?.reply?.trim()||d.commentReply;p.interactions[id]={schemaVersion:2,reply};p.personalComments={schemaVersion:1,channelId:p.personalChannel?.id??'channel.'+s.runId,reply,submittedAt:now};}
 s.status='result';s.resultReadyAt=now+timing(s,'resultSeconds');s.deadlineAt=null;p.remainingMs=0;
}
export function productionCommand(s,c,now){
 if(c.type==='STAND_TOUCH'){if(['task','result'].includes(s.status))s.lastTouchAt=now;return null;}
 if(c.type==='STAND_READY'){
  if(!['scan','task','completed','incomplete'].includes(s.status)||c.screenId!==(s.screenId??s.status))return 'SCENE_CONFLICT';
  if(!s.standReady){s.standReady=true;s.deadlineAt=now+timing(s,s.status==='scan'?'palmWaitSeconds':s.status==='task'?'taskDurationSeconds':'qrDisplaySeconds');const activity=s.screenId==='business.channel.result'?s.progress.business?.postsActivity:s.screenId==='business.store.start'?s.progress.business?.storeActivity:null;if(activity?.popup){activity.startRemainingMs=timing(s,'taskDurationSeconds');pauseCardTimer(s,activity.popup,now);}}
  return null;
 }
 return 'STAND_COMMAND_UNAVAILABLE';
}
