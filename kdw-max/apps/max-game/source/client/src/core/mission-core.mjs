import {finishCardTimer} from '../kdw-card-settings.mjs';
import {operatorGoto,resumeOperatorTask} from '../kdw-operator-model.mjs';
import {production,timing,prepareProductionTask,completeByTimeout,productionCommand} from '../kdw-production-core.mjs';
import {reduceStore,STORE_VERSION,storeGoal,catalogForStoreReceipt} from '../kdw-store-rating.mjs';
import {catalogForBusinessReceipt} from '../kdw-business-choice.mjs';
import {reduceDevelopment,finishDevelopmentState} from '../kdw-development.mjs';
import {reducePosts,postsGoal,POSTS_SCREEN,catalogForPostsReceipt} from '../kdw-posts-model.mjs';
import {assertMissionCommand,missionToken,deepFreeze} from '../contracts/mission-command.mjs';
import {createGameModel,dispatchGameCommand} from './game-core.mjs';
import {interactionKind,validateInteraction,interactionComplete} from '../kdw-interactions-model.mjs';
import {PERSONAL_TASKS,savePersonal,personalAction,personalComplete,catalogForPersonalReceipt} from '../kdw-personal-channel-model.mjs';
import {forbiddenFields,catalogForTextReceipt} from '../kdw-text-policy.mjs';

export const MISSION_RULES_REVISION='mission-rules-v1';
export const TASK_CLOCK_RULES_REVISION='mission-rules-task-clock-v2';
export const TASK_CLOCK_BUDGET_MS=60000;
const taskClock=s=>s.rulesRevision===TASK_CLOCK_RULES_REVISION;
const initialBudget=s=>taskClock(s)?TASK_CLOCK_BUDGET_MS:180000;
const INTERNAL=new Set(['OUTPUT_RECOVERY','OPERATOR_GOTO','HOLD_CONFIRMED','OWNER_CHANGED','EXPIRE','AUTO_SCREEN','STAND_IDLE']);
const branchTask=tool=>`business.${tool}`;
export function createMissionModel(catalog,{sessionId,rulesRevision=MISSION_RULES_REVISION}){
 if(!missionToken(sessionId)||catalog?.schemaVersion!==1)throw new TypeError('Invalid mission session/catalog');
 if(![MISSION_RULES_REVISION,TASK_CLOCK_RULES_REVISION].includes(rulesRevision))throw new TypeError('Invalid mission rules revision');
 return deepFreeze({schemaVersion:1,state:{schemaVersion:1,sessionId,revision:0,contentRevision:catalog.contentRevision,rulesRevision,status:'menu',missionId:null,taskId:null,screenId:null,runId:0,scanned:false,startedAt:null,deadlineAt:null,resultReadyAt:null,ownerActive:false,pausedAt:null,progress:{},...(catalog.kdwProduction?{standPolicy:structuredClone(catalog.kdwProduction),standReady:false,lastTouchAt:null,standEndReason:null}:{})},receipts:[]});
}
const sequence=(catalog,state,p)=>{const ids=catalog.missions[state.missionId].taskIds;return [...ids,...(p.businessTool&&!ids.includes(branchTask(p.businessTool))?[branchTask(p.businessTool)]:[])];};
function enterTask(catalog,state,now,freshClock=false){
 const p=state.progress[state.missionId],ids=sequence(catalog,state,p),taskId=ids[p.currentTaskIndex];
 if(!taskId){state.status=p.skipped.length?'incomplete':'completed';if(production(state))state.standReady=false;state.taskId=null;state.screenId=null;state.resultReadyAt=null;state.deadlineAt=null;state.pausedAt=null;return;}
 state.status='task';state.taskId=taskId;state.screenId=p.currentScreenId||catalog.tasks[taskId].startScreenId;state.screenEnteredAt=now;
 if(taskClock(state)&&freshClock){p.remainingMs=TASK_CLOCK_BUDGET_MS;state.startedAt=now;state.deadlineAt=now+TASK_CLOCK_BUDGET_MS;state.pausedAt=state.ownerActive?null:now;}
 if(production(state))prepareProductionTask(state);
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
 if(production(s)&&['DEV_TIMER','RESTART_TASK','SKIP_TASK','RESTART_MISSION','RESET_PROGRESS'].includes(c.type))return reject('PRODUCTION_CONTROL_FORBIDDEN');
 if(production(s)&&c.type==='SELECT_MISSION'&&s.status!=='menu')return reject('MISSION_ALREADY_ACTIVE');
 if(s.ownerActive&&s.deadlineAt!==null&&now>=s.deadlineAt&&!['FINISH_MISSION','OPERATOR_GOTO','DEV_TIMER','RESTART_TASK','RETURN_MENU','RESTART_MISSION','RESET_PROGRESS','EXPIRE','OWNER_CHANGED','OUTPUT_RECOVERY','STAND_READY','STAND_TOUCH','STAND_IDLE'].includes(c.type))return reject('MISSION_EXPIRED');
 if(s.outputPausedAt!==undefined&&!['OUTPUT_RECOVERY','OWNER_CHANGED','OPERATOR_GOTO'].includes(c.type))return reject('OUTPUT_RECOVERING');
 if(c.type==='OUTPUT_RECOVERY'){
  if(!production(s))return reject('PRODUCTION_REQUIRED');
  if(c.active){if(s.outputPausedAt===undefined)s.outputPausedAt=now;}
  else if(s.outputPausedAt!==undefined){
   const duration=now-s.outputPausedAt;
   for(const key of ['deadlineAt','resultReadyAt','screenEnteredAt','lastTouchAt','startedAt'])if(Number.isFinite(s[key]))s[key]+=duration;
   if(s.cardTaskPause&&Number.isFinite(s.cardTaskPause.deadlineAt))s.cardTaskPause.deadlineAt+=duration;
   delete s.outputPausedAt;
  }
 }else if(c.type==='OPERATOR_GOTO'){delete s.outputPausedAt;const error=operatorGoto(catalog,s,c,now);if(error)return reject(error);effects.push({type:'OPERATOR_SCREEN_CHANGED',screenId:s.screenId});}
 else if(['STAND_READY','STAND_TOUCH'].includes(c.type)){
  if(!production(s))return reject('PRODUCTION_REQUIRED');const error=productionCommand(s,c,now);if(error)return reject(error);
 }else if(['DEV_TIMER','RESTART_TASK','SKIP_TASK'].includes(c.type)){
  const error=reduceDevelopment(catalog,s,c,now,{sequence,enterTask,budget:TASK_CLOCK_BUDGET_MS});if(error)return reject(error);
  effects.push({type:c.type==='DEV_TIMER'?'DEV_TIMER_CHANGED':c.type==='SKIP_TASK'?'TASK_SKIPPED':'TASK_RESTARTED',taskId:c.type==='SKIP_TASK'?c.taskId:s.taskId});
 }else if(c.type==='SELECT_MISSION'){
  if(!Object.hasOwn(catalog.missions,c.missionId))return reject('MISSION_UNAVAILABLE');
  s.missionId=c.missionId;s.runId++;s.resultReadyAt=null;
  // Standby entry is a fresh visit; ordinary selection retains recovery semantics.
  if(c.fresh===true)delete s.progress[s.missionId];
  const p=s.progress[s.missionId]??={completed:[],skipped:[],finished:[],answers:{},businessTool:null,currentTaskIndex:0,currentScreenId:null,scanned:false,remainingMs:initialBudget(s)};
  const ids=sequence(catalog,s,p),previousTaskIndex=p.currentTaskIndex;while(p.finished.includes(ids[p.currentTaskIndex])){p.currentTaskIndex++;p.currentScreenId=null;}
  s.startedAt=now;s.deadlineAt=now+p.remainingMs;s.pausedAt=s.ownerActive?null:now;s.scanned=p.scanned;
  if(!p.scanned){s.status='scan';s.taskId=null;s.screenId=null;}else enterTask(catalog,s,now,p.currentTaskIndex!==previousTaskIndex);
  if(production(s)){s.deadlineAt=null;s.standReady=false;s.lastTouchAt=null;s.standEndReason=null;}
  effects.push({type:'MISSION_SELECTED',missionId:s.missionId});
 }else if(c.type==='HOLD_CONFIRMED'){
  if(s.status!=='scan')return reject('SCAN_UNAVAILABLE');
  if(production(s)&&(!s.standReady||now>=s.deadlineAt))return reject('PALM_NOT_READY');
  if(production(s))s.lastTouchAt=now;
  s.scanned=true;currentProgress(s).scanned=true;enterTask(catalog,s,now,true);effects.push({type:'MISSION_SCANNED'});
 }else if(c.type==='OWNER_CHANGED'){
  if(c.active===s.ownerActive)return reject('OWNER_UNCHANGED');
  if(!production(s)&&!c.active&&s.missionId&&['scan','task','result'].includes(s.status)){s.pausedAt=now;if(s.deadlineAt!==null)currentProgress(s).remainingMs=Math.max(0,s.deadlineAt-now);}
  if(!production(s)&&c.active&&s.pausedAt!==null){const duration=now-s.pausedAt;if(s.deadlineAt!==null)s.deadlineAt+=duration;if(s.resultReadyAt!==null)s.resultReadyAt+=duration;if(s.screenEnteredAt!==undefined)s.screenEnteredAt+=duration;s.pausedAt=null;}
  s.ownerActive=c.active;if(production(s))s.pausedAt=null;
 }else if(c.type==='EXPIRE'){
  if((!production(s)&&!s.ownerActive)||s.deadlineAt===null||now<s.deadlineAt)return reject('TIMER_NOT_EXPIRED');
  if(production(s)){
   if(s.status==='task'){completeByTimeout(s,now);effects.push({type:'TASK_COMPLETED',taskId:s.taskId,reason:'timeout'});}
   else{s.standEndReason=s.status==='scan'?'no-show':'qr';s.status='menu';s.missionId=null;s.taskId=null;s.screenId=null;s.deadlineAt=null;s.resultReadyAt=null;s.standReady=false;s.runId++;}
  }else{s.status='expired';currentProgress(s).remainingMs=0;effects.push({type:'MISSION_EXPIRED'});if(taskClock(s)){s.taskId=null;s.screenId=null;s.resultReadyAt=null;}}
 }else if(c.type==='RETURN_MENU'||c.type==='STAND_IDLE'){
  if(c.type==='STAND_IDLE'){if(!production(s)||!['task','result'].includes(s.status)||s.lastTouchAt===null||now-s.lastTouchAt<timing(s,'inactivitySeconds'))return reject('INACTIVITY_NOT_EXPIRED');s.standEndReason='inactivity';}
  else if(production(s))return reject('PRODUCTION_CONTROL_FORBIDDEN');
  if(s.missionId&&s.deadlineAt!==null){currentProgress(s).remainingMs=Math.max(0,s.deadlineAt-(s.pausedAt??now));}
  s.status='menu';s.missionId=null;s.taskId=null;s.screenId=null;s.deadlineAt=null;s.pausedAt=null;s.resultReadyAt=null;s.scanned=false;s.runId++;
 }else if(c.type==='RESET_PROGRESS'){
  const owner=s.ownerActive;Object.assign(s,structuredClone(createMissionModel(catalog,{sessionId:s.sessionId,rulesRevision:s.rulesRevision}).state),{revision:s.revision,ownerActive:owner,runId:s.runId+1});effects.push({type:'PROGRESS_RESET'});
 }else if(c.type==='RESTART_MISSION'){
  if(!s.missionId)return reject('MISSION_UNAVAILABLE');
  const id=s.missionId;delete s.progress[id];const p=s.progress[id]={completed:[],skipped:[],finished:[],answers:{},businessTool:null,currentTaskIndex:0,currentScreenId:null,scanned:false,remainingMs:initialBudget(s)};
  s.runId++;s.status='scan';s.taskId=null;s.screenId=null;s.scanned=false;s.startedAt=now;s.deadlineAt=now+p.remainingMs;s.pausedAt=s.ownerActive?null:now;s.resultReadyAt=null;effects.push({type:'MISSION_RESTARTED'});
 }else if(c.type==='FINISH_MISSION'){
  if(!s.missionId||c.missionId!==s.missionId||!['task','result'].includes(s.status))return reject('MISSION_FINISH_UNAVAILABLE');
  const p=currentProgress(s),ids=sequence(catalog,s,p);
  // Use the normal final/QR state without claiming that unfinished tasks were passed.
  for(const id of ids){if(!p.completed.includes(id)&&!p.skipped.includes(id))p.skipped.push(id);if(!p.finished.includes(id))p.finished.push(id);}
  p.currentTaskIndex=ids.length;p.currentScreenId=null;
  enterTask(catalog,s,now);s.lastTouchAt=now;
  effects.push({type:'MISSION_FINISHED',missionId:s.missionId,reason:'timer-tap'});
 }else if(c.type==='ADVANCE_RESULT'){
  if(s.status!=='result'||now<s.resultReadyAt&&!(catalog.kdwBusinessConfirmation?.screenId===s.screenId&&!internal))return reject('RESULT_NOT_READY');
  currentProgress(s).currentTaskIndex++;currentProgress(s).currentScreenId=null;
  if(catalog.kdwDevelopment){const p=currentProgress(s),ids=sequence(catalog,s,p);while(p.finished.includes(ids[p.currentTaskIndex]))p.currentTaskIndex++;}
  enterTask(catalog,s,now,true);
  effects.push({type:'NEXT_TASK',taskId:s.taskId});
 }else if(['START_POSTS','PUBLISH_POST','POST_ARRIVED'].includes(c.type)){
  if(!catalog.kdwPostsActivity)return reject('POSTS_UNAVAILABLE');
  const error=reducePosts(s,c,now,catalog.kdwPostsActivity);if(error)return reject(error);
  effects.push({type:c.type==='START_POSTS'?'POSTS_STARTED':c.type==='POST_ARRIVED'?'POST_ARRIVED':'POST_PUBLISHED'});
 }else if(['START_STORE','PICK_PRODUCT','PRODUCT_ARRIVED'].includes(c.type)){
  if(!catalog.kdwStoreActivity)return reject('STORE_UNAVAILABLE');
  const error=reduceStore(s,c,now,[1,2,3,4,5,6,7,8,9,10].includes(catalog.kdwStoreActivity)?catalog.kdwStoreActivity:STORE_VERSION);if(error)return reject(error);
  effects.push({type:c.type==='START_STORE'?'STORE_STARTED':c.type==='PRODUCT_ARRIVED'?'PRODUCT_ARRIVED':'PRODUCT_ADDED'});
 }else if(c.type==='SAVE_INTERACTION'){
  if(!catalog.kdwInteractions||s.status!=='task')return reject('INTERACTION_UNAVAILABLE');
  if(c.taskId!==s.taskId||c.screenId!==s.screenId)return reject('WRONG_CONTEXT');
  if(catalog.kdwPersonalChannel&&PERSONAL_TASKS.includes(s.taskId)&&(c.value.schemaVersion!==undefined||s.taskId==='blogger.comments')){
   const error=savePersonal(s,c,!!catalog.kdwPersonalReplayLongReply,catalog.kdwTextReplayLegacy?false:(catalog.kdwTextReplayVersion??true));if(error)return reject(error);
  }else{
   const kind=interactionKind(s.taskId),editable=kind==='channel'?['blogger.channel.name','blogger.channel.filled'].includes(s.screenId):kind==='store'&&s.screenId==='business.store.start';
   if(!editable||!validateInteraction(kind,c.value))return reject('INVALID_INTERACTION');
   if(kind==='channel'&&!catalog.kdwTextReplayLegacy&&forbiddenFields(c.value,catalog.kdwTextReplayVersion))return reject('TEXT_NOT_ALLOWED');
   const p=currentProgress(s);p.interactions??={};p.interactions[s.taskId]=structuredClone(c.value);
  }
  effects.push({type:'INTERACTION_SAVED',taskId:s.taskId});
 }else if(['ACT','AUTO_SCREEN'].includes(c.type)){
  if(s.status!=='task')return reject('TASK_UNAVAILABLE');
  if(c.missionId!==undefined&&c.missionId!==s.missionId||c.taskId!==undefined&&c.taskId!==s.taskId)return reject('WRONG_CONTEXT');
  if(c.screenId!==s.screenId)return reject('SCREEN_CONFLICT');
  const p=currentProgress(s),screen=catalog.tasks[s.taskId].screens[s.screenId];
  if(catalog.kdwStoreActivity&&s.taskId==='business.store'&&(s.screenId==='business.store.start'||p.storeActivity)&&!storeGoal(p.storeActivity))return reject('STORE_RATING_REQUIRED');
  if(catalog.kdwPostsActivity&&s.screenId===POSTS_SCREEN&&!postsGoal(p.postsActivity??{audience:0}))return reject('POSTS_GOAL_REQUIRED');
  const a=screen.actions.find(a=>a.actionId===c.actionId);if(!a)return reject('ACTION_UNAVAILABLE');
  if(catalog.kdwPersonalChannel&&!catalog.kdwPersonalReplayLegacy){const error=personalAction(s,c,now,catalog.kdwTextReplayLegacy?false:(catalog.kdwTextReplayVersion??true));if(error)return reject(error);}
  if(catalog.kdwInteractions){
   const kind=interactionKind(s.taskId),needsValue=kind==='channel'&&['channel.fill-name-example','channel.create'].includes(c.actionId)||kind==='store'&&['business.store.start','business.store.publish','business.store.result'].includes(s.screenId);
   if(kind==='channel'&&needsValue&&!catalog.kdwTextReplayLegacy&&forbiddenFields(p.interactions?.[s.taskId],catalog.kdwTextReplayVersion))return reject('TEXT_NOT_ALLOWED');
   if(needsValue&&!(kind==='store'&&p.storeActivity&&storeGoal(p.storeActivity))&&!(kind==='channel'&&personalComplete(p.interactions?.[s.taskId]))&&!interactionComplete(kind,p.interactions?.[s.taskId]))return reject(kind==='channel'?'CHANNEL_NAME_REQUIRED':'STORE_PRODUCT_REQUIRED');
  }
  if(screen.automaticMs!==null&&screen.automaticMs!==undefined){if(c.type!=='AUTO_SCREEN')return reject('AUTOMATIC_SCREEN');if(now-s.screenEnteredAt<screen.automaticMs)return reject('SCREEN_NOT_READY');}
  else if(c.type==='AUTO_SCREEN')return reject('NOT_AUTOMATIC_SCREEN');
  const o=a.outcome;if(o.kind==='incorrect')return reject('INCORRECT_ANSWER');
  if(catalog.tasks[s.taskId].coreCatalog){
   const source=catalog.tasks[s.taskId].coreCatalog;
   const apply=model=>{const g=model.state;return dispatchGameCommand(source,model,{schemaVersion:1,type:'ACT',commandId:c.commandId,sessionId:s.sessionId,contentRevision:source.contentRevision,missionId:source.missionId,taskId:g.taskId,screenId:g.screenId,expectedRevision:g.revision,actionId:c.actionId});};
   let result=p.channelModel?apply(p.channelModel):null;
   // Previously accepted receipts retain their exact semantics. Repair only a
   // rejected/missing inner task after an explicit operator jump.
   if(!result?.reply.ok&&s.operatorControlled&&(!p.channelModel||p.channelModel.state.screenId!==s.screenId||p.channelModel.state.status!=='active')){
    const resumed=resumeOperatorTask(source,p.channelModel,{sessionId:s.sessionId,screenId:s.screenId,commandId:c.commandId});if(resumed)result=apply(resumed);
   }
   if(!result)return reject('TASK_UNAVAILABLE');
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
   s.status='result';s.resultReadyAt=now+(production(s)?timing(s,'resultSeconds'):800);
   if(catalog.kdwBusinessConfirmation?.from===s.screenId){s.screenId=catalog.kdwBusinessConfirmation.screenId;p.currentScreenId=s.screenId;}
   if(taskClock(s)){p.remainingMs=s.cardTaskPause?.remainingMs??Math.max(0,s.deadlineAt-(s.pausedAt??now));s.deadlineAt=null;}
   if(p.currentTaskIndex===sequence(catalog,s,p).length-1)s.deadlineAt=null;
  }else return reject('INVALID_OUTCOME');
 }else return reject('INVALID_COMMAND');
 if(s.operatorControlled&&s.missionId){const p=currentProgress(s);for(const id of p.operatorTasks??[])if(p.finished.includes(id)){p.completed=p.completed.filter(t=>t!==id);if(!p.skipped.includes(id))p.skipped.push(id);}if(s.status==='completed'&&p.skipped.length)s.status='incomplete';}
 if(!production(s))finishDevelopmentState(model.state,s,c,now,TASK_CLOCK_BUDGET_MS);
 finishCardTimer(model.state,s,now);
 s.revision++;const reply=deepFreeze({ok:true,code:'APPLIED',commandId:c.commandId,snapshot:s});
 return {model:deepFreeze({schemaVersion:1,state:s,receipts:[...model.receipts,{command:c,now,internal,reply}]}),reply,effects:deepFreeze(effects),duplicate:false};
}
export function restoreMissionModel(catalog,raw){
 try{const saved=typeof raw==='string'?JSON.parse(raw):raw;if(saved?.schemaVersion!==1||!saved.state||!Array.isArray(saved.receipts))throw new Error('Invalid mission model');
  let m=createMissionModel(catalog,{sessionId:saved.state.sessionId,rulesRevision:saved.state.rulesRevision});
  for(const r of saved.receipts){const result=dispatchMissionCommand(catalogForTextReceipt(catalogForPersonalReceipt(catalogForStoreReceipt(catalogForPostsReceipt(catalogForBusinessReceipt(catalog,r),r),r),r),r),m,r.command,{now:r.now,internal:r.internal});if(!result.reply.ok||result.duplicate||JSON.stringify(result.reply)!==JSON.stringify(r.reply))throw new Error('Invalid mission receipt');m=result.model;}
  if(JSON.stringify(m)!==JSON.stringify(saved))throw new Error('State differs from accepted commands');return {ok:true,model:m};
 }catch(error){return {ok:false,code:'INVALID_SAVED_MISSION',message:error.message,model:null};}
}
