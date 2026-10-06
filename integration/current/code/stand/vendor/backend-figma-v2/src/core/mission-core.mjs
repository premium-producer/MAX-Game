import {assertMissionCommand,missionToken,deepFreeze} from '../contracts/mission-command.mjs';
import {createGameModel,dispatchGameCommand} from './game-core.mjs';

export const MISSION_RULES_REVISION='mission-rules-v1';
const INTERNAL=new Set(['HOLD_CONFIRMED','OWNER_CHANGED','EXPIRE','AUTO_SCREEN']);
const branchTask=tool=>`business.${tool}`;
export function createMissionModel(catalog,{sessionId}){
 if(!missionToken(sessionId)||catalog?.schemaVersion!==1)throw new TypeError('Invalid mission session/catalog');
 return deepFreeze({schemaVersion:1,state:{schemaVersion:1,sessionId,revision:0,contentRevision:catalog.contentRevision,rulesRevision:MISSION_RULES_REVISION,status:'menu',missionId:null,taskId:null,screenId:null,runId:0,scanned:false,startedAt:null,deadlineAt:null,resultReadyAt:null,ownerActive:false,pausedAt:null,progress:{}},receipts:[]});
}
const sequence=(catalog,state,p)=>{const ids=catalog.missions[state.missionId].taskIds;return [...ids,...(p.businessTool&&!ids.includes(branchTask(p.businessTool))?[branchTask(p.businessTool)]:[])];};
function enterTask(catalog,state,now){
 const p=state.progress[state.missionId],ids=sequence(catalog,state,p),taskId=ids[p.currentTaskIndex];
 if(!taskId){state.status=p.skipped.length?'incomplete':'completed';state.taskId=null;state.screenId=null;state.resultReadyAt=null;state.deadlineAt=null;state.pausedAt=null;return;}
 state.status='task';state.taskId=taskId;state.screenId=p.currentScreenId||catalog.tasks[taskId].startScreenId;state.screenEnteredAt=now;
 if(catalog.tasks[taskId].coreCatalog&&!p.channelModel)p.channelModel=createGameModel(catalog.tasks[taskId].coreCatalog,{sessionId:state.sessionId});
 p.currentScreenId=state.screenId;
}
const currentProgress=s=>s.progress[s.missionId];
export function dispatchMissionCommand(catalog,model,input,{now=0,internal=false}={}){
 const reject=code=>({model,reply:deepFreeze({ok:false,code,snapshot:model.state}),effects:[],duplicate:false});
 if(typeof internal!=='boolean')return reject('INVALID_TRUSTED_CONTEXT');
 let c;try{c=assertMissionCommand(input);}catch{return reject('INVALID_COMMAND');}
 const prior=model.receipts.find(r=>r.command.commandId===c.commandId);
 if(prior)return JSON.stringify(prior.command)===JSON.stringify(c)?{model,reply:prior.reply,effects:[],duplicate:true}:reject('COMMAND_ID_REUSED');
 if(c.sessionId!==model.state.sessionId)return reject('WRONG_CONTEXT');
 if(c.contentRevision!==model.state.contentRevision)return reject('CONTENT_CONFLICT');
 if(c.expectedRevision!==model.state.revision)return reject('REVISION_CONFLICT');
 if(INTERNAL.has(c.type)&&!internal)return reject('TRUSTED_COMMAND_REQUIRED');
 if(!Number.isSafeInteger(now)||now<0||now<(model.receipts.at(-1)?.now??0))return reject('INVALID_TRUSTED_TIME');
 const s=structuredClone(model.state),effects=[];
 if(s.ownerActive&&s.deadlineAt!==null&&now>=s.deadlineAt&&!['RETURN_MENU','RESTART_MISSION','RESET_PROGRESS','EXPIRE','OWNER_CHANGED'].includes(c.type))return reject('MISSION_EXPIRED');
 if(c.type==='SELECT_MISSION'){
  if(!Object.hasOwn(catalog.missions,c.missionId))return reject('MISSION_UNAVAILABLE');
  s.missionId=c.missionId;s.runId++;s.resultReadyAt=null;
  const p=s.progress[s.missionId]??={completed:[],skipped:[],finished:[],answers:{},businessTool:null,currentTaskIndex:0,currentScreenId:null,scanned:false,remainingMs:180000};
  const ids=sequence(catalog,s,p);while(p.finished.includes(ids[p.currentTaskIndex])){p.currentTaskIndex++;p.currentScreenId=null;}
  s.startedAt=now;s.deadlineAt=now+p.remainingMs;s.pausedAt=s.ownerActive?null:now;s.scanned=p.scanned;
  if(!p.scanned){s.status='scan';s.taskId=null;s.screenId=null;}else enterTask(catalog,s,now);
  effects.push({type:'MISSION_SELECTED',missionId:s.missionId});
 }else if(c.type==='HOLD_CONFIRMED'){
  if(s.status!=='scan')return reject('SCAN_UNAVAILABLE');
  s.scanned=true;currentProgress(s).scanned=true;enterTask(catalog,s,now);effects.push({type:'MISSION_SCANNED'});
 }else if(c.type==='OWNER_CHANGED'){
  if(c.active===s.ownerActive)return reject('OWNER_UNCHANGED');
  if(!c.active&&s.missionId&&['scan','task','result'].includes(s.status)){s.pausedAt=now;if(s.deadlineAt!==null)currentProgress(s).remainingMs=Math.max(0,s.deadlineAt-now);}
  if(c.active&&s.pausedAt!==null){const duration=now-s.pausedAt;if(s.deadlineAt!==null)s.deadlineAt+=duration;if(s.resultReadyAt!==null)s.resultReadyAt+=duration;if(s.screenEnteredAt!==undefined)s.screenEnteredAt+=duration;s.pausedAt=null;}
  s.ownerActive=c.active;
 }else if(c.type==='EXPIRE'){
  if(!s.ownerActive||s.deadlineAt===null||now<s.deadlineAt)return reject('TIMER_NOT_EXPIRED');
  s.status='expired';currentProgress(s).remainingMs=0;effects.push({type:'MISSION_EXPIRED'});
 }else if(c.type==='RETURN_MENU'){
  if(s.missionId&&s.deadlineAt!==null){currentProgress(s).remainingMs=Math.max(0,s.deadlineAt-(s.pausedAt??now));}
  s.status='menu';s.missionId=null;s.taskId=null;s.screenId=null;s.deadlineAt=null;s.pausedAt=null;s.resultReadyAt=null;s.scanned=false;s.runId++;
 }else if(c.type==='RESET_PROGRESS'){
  const owner=s.ownerActive;Object.assign(s,structuredClone(createMissionModel(catalog,{sessionId:s.sessionId}).state),{revision:s.revision,ownerActive:owner,runId:s.runId+1});effects.push({type:'PROGRESS_RESET'});
 }else if(c.type==='RESTART_MISSION'){
  if(!s.missionId)return reject('MISSION_UNAVAILABLE');
  const id=s.missionId;delete s.progress[id];const p=s.progress[id]={completed:[],skipped:[],finished:[],answers:{},businessTool:null,currentTaskIndex:0,currentScreenId:null,scanned:false,remainingMs:180000};
  s.runId++;s.status='scan';s.taskId=null;s.screenId=null;s.scanned=false;s.startedAt=now;s.deadlineAt=now+p.remainingMs;s.pausedAt=s.ownerActive?null:now;s.resultReadyAt=null;effects.push({type:'MISSION_RESTARTED'});
 }else if(c.type==='ADVANCE_RESULT'){
  if(s.status!=='result'||now<s.resultReadyAt)return reject('RESULT_NOT_READY');
  currentProgress(s).currentTaskIndex++;currentProgress(s).currentScreenId=null;enterTask(catalog,s,now);
  effects.push({type:'NEXT_TASK',taskId:s.taskId});
 }else if(['ACT','AUTO_SCREEN'].includes(c.type)){
  if(s.status!=='task')return reject('TASK_UNAVAILABLE');
  if(c.missionId!==undefined&&c.missionId!==s.missionId||c.taskId!==undefined&&c.taskId!==s.taskId)return reject('WRONG_CONTEXT');
  if(c.screenId!==s.screenId)return reject('SCREEN_CONFLICT');
  const p=currentProgress(s),screen=catalog.tasks[s.taskId].screens[s.screenId];
  const a=screen.actions.find(a=>a.actionId===c.actionId);if(!a)return reject('ACTION_UNAVAILABLE');
  if(screen.automaticMs!==null&&screen.automaticMs!==undefined){if(c.type!=='AUTO_SCREEN')return reject('AUTOMATIC_SCREEN');if(now-s.screenEnteredAt<screen.automaticMs)return reject('SCREEN_NOT_READY');}
  else if(c.type==='AUTO_SCREEN')return reject('NOT_AUTOMATIC_SCREEN');
  const o=a.outcome;if(o.kind==='incorrect')return reject('INCORRECT_ANSWER');
  if(catalog.tasks[s.taskId].coreCatalog){
   const source=catalog.tasks[s.taskId].coreCatalog,g=p.channelModel.state,result=dispatchGameCommand(source,p.channelModel,{schemaVersion:1,type:'ACT',commandId:c.commandId,sessionId:s.sessionId,contentRevision:source.contentRevision,missionId:source.missionId,taskId:g.taskId,screenId:g.screenId,expectedRevision:g.revision,actionId:c.actionId});
   if(!result.reply.ok)return reject(result.reply.code);p.channelModel=result.model;
  }
  p.answers[s.screenId]=c.actionId;if(o.answer)p.answers[o.answer.kind]=o.answer.value;
  if(screen.missing&&!p.skipped.includes(s.taskId))p.skipped.push(s.taskId);
  if(['navigate','skip-screen'].includes(o.kind)){s.screenId=o.screenId;p.currentScreenId=o.screenId;s.screenEnteredAt=now;effects.push({type:'SCREEN_CHANGED',screenId:s.screenId});}
  else if(['complete-task','skip-task','choose-tool'].includes(o.kind)){
   if(o.kind==='choose-tool')p.businessTool=o.value;
   if(!p.skipped.includes(s.taskId)&&!p.completed.includes(s.taskId)){p.completed.push(s.taskId);effects.push({type:'TASK_COMPLETED',taskId:s.taskId});}
   else effects.push({type:'TASK_SKIPPED',taskId:s.taskId});
   if(!p.finished.includes(s.taskId))p.finished.push(s.taskId);
   s.status='result';s.resultReadyAt=now+800;
   if(p.currentTaskIndex===sequence(catalog,s,p).length-1)s.deadlineAt=null;
  }else return reject('INVALID_OUTCOME');
 }else return reject('INVALID_COMMAND');
 s.revision++;const reply=deepFreeze({ok:true,code:'APPLIED',commandId:c.commandId,snapshot:s});
 return {model:deepFreeze({schemaVersion:1,state:s,receipts:[...model.receipts,{command:c,now,internal,reply}]}),reply,effects:deepFreeze(effects),duplicate:false};
}
export function restoreMissionModel(catalog,raw){
 try{const saved=typeof raw==='string'?JSON.parse(raw):raw;if(saved?.schemaVersion!==1||!saved.state||!Array.isArray(saved.receipts))throw new Error('Invalid mission model');
  let m=createMissionModel(catalog,{sessionId:saved.state.sessionId});
  for(const r of saved.receipts){const result=dispatchMissionCommand(catalog,m,r.command,{now:r.now,internal:r.internal});if(!result.reply.ok||result.duplicate||JSON.stringify(result.reply)!==JSON.stringify(r.reply))throw new Error('Invalid mission receipt');m=result.model;}
  if(JSON.stringify(m)!==JSON.stringify(saved))throw new Error('State differs from accepted commands');return {ok:true,model:m};
 }catch(error){return {ok:false,code:'INVALID_SAVED_MISSION',message:error.message,model:null};}
}
