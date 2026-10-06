import {MISSION_CATALOG} from '../content/mission-catalog.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../core/mission-core.mjs';
import {deepFreeze,missionToken} from '../contracts/mission-command.mjs';
import {assertMissionCatalog} from '../contracts/mission-catalog.mjs';

const err=(code,cause)=>Object.assign(new Error(code,cause?{cause}:undefined),{code});
const copy=o=>deepFreeze(structuredClone(o));
const freshLayouts=()=>({layoutRevision:0,positions:{},receipts:[]});
/** One authority per session. now is host time, never a field of client commands. */
export function createMissionSessionApplication({catalog=MISSION_CATALOG,persistence,now=()=>Date.now(),onObserverError=()=>{},routingProfile=null}){
 catalog=copy(assertMissionCatalog(structuredClone(catalog)));
 routingProfile?.assertCatalog(catalog);
 if(!persistence||['load','create','commit'].some(k=>typeof persistence[k]!=='function'))throw new TypeError('Explicit PersistencePort required');
 if(typeof now!=='function'||typeof onObserverError!=='function')throw new TypeError('Clock and diagnostic handler required');
 const cache=new Map(),queues=new Map(),listeners=new Map(),contacts=new Map(),sequences=new Map();let closed=false,internalSerial=0;
 const clock=()=>{const time=Math.floor(now());if(!Number.isSafeInteger(time)||time<0)throw err('INVALID_TRUSTED_TIME');return time;};
 const queue=(id,fn)=>{if(closed)return Promise.reject(err('APPLICATION_CLOSED'));if(!missionToken(id))return Promise.reject(err('INVALID_SESSION_ID'));const task=(queues.get(id)??Promise.resolve()).catch(()=>{}).then(()=>{if(closed)throw err('APPLICATION_CLOSED');return fn();});const tail=task.catch(()=>{});queues.set(id,tail);tail.then(()=>{if(queues.get(id)===tail)queues.delete(id);});return task;};
 async function load(id){if(cache.has(id))return cache.get(id);const saved=await persistence.load(id);if(!saved)throw err('SESSION_NOT_FOUND');
  const r=saved.record,restored=restoreMissionModel(catalog,r?.mission,{routingProfile});
  if(r?.schemaVersion!==2||!['clockCheckpointAt,layouts,mission,schemaVersion','layouts,mission,schemaVersion'].includes(Object.keys(r).sort().join(','))||!restored.ok||restored.model.state.sessionId!==id||!Number.isSafeInteger(saved.version)||saved.version<0||!validLayouts(r.layouts)||Object.keys(r.layouts.positions).some(key=>!validLayoutNode(key,catalog)))throw err('INVALID_SAVED_SESSION');
  const lastConfirmed=restored.model.receipts.at(-1)?.now??0,checkpoint=r.clockCheckpointAt??lastConfirmed;
  if(!Number.isSafeInteger(checkpoint)||checkpoint<lastConfirmed||checkpoint>clock())throw err('INVALID_SAVED_CLOCK');
  let entry={version:saved.version,record:copy({...r,mission:restored.model,clockCheckpointAt:checkpoint})};
  // A process restart cannot restore an expired transport lease. Preserve the
  // timer only to the last committed checkpoint, then pause before returning.
  // Server downtime consumes no confirmed budget; at most 5 seconds can roll back.
  if(restored.model.state.ownerActive){const result=dispatchMissionCommand(catalog,restored.model,internalCommand(entry,'OWNER_CHANGED',{active:false}),{now:checkpoint,internal:true,routingProfile});if(!result.reply.ok)throw err('INVALID_RECOVERY_TIME');entry=await commit(id,entry,{...entry.record,mission:result.model},[]);}
  cache.set(id,entry);return entry;
 }
 function snapshot(entry){const s=structuredClone(entry.record.mission.state);for(const p of Object.values(s.progress))delete p.channelModel;
  const icon=id=>catalog.assets[id]??catalog.assets[catalog.uiIcons?.fallback]??null;
  const screen=s.taskId&&s.screenId?catalog.tasks[s.taskId].screens[s.screenId]:null;
  const device=screen?{kind:screen.deviceKind,asset:screen.assetId?catalog.assets[screen.assetId]:null,annotations:screen.annotations??[]}:null;
  const p=s.missionId?s.progress[s.missionId]:null;const baseIds=s.missionId?catalog.missions[s.missionId].taskIds:[];const taskIds=[...baseIds,...(p?.businessTool&&!baseIds.includes(`business.${p.businessTool}`)?[`business.${p.businessTool}`]:[])];
  const nodes=s.missionId?[{nodeId:'open-max',taskId:null,title:'Открыть MAX',icon:icon(catalog.missions[s.missionId].startAssetId),completed:p.scanned},...taskIds.map(taskId=>({nodeId:taskId,taskId,title:catalog.tasks[taskId].title,icon:icon(catalog.tasks[taskId].iconAssetId),current:taskId===s.taskId,completed:p.completed.includes(taskId),skipped:p.skipped.includes(taskId)}))]:[];
  const edges=taskIds.map((to,i)=>({edgeId:`route.${i}`,from:to.startsWith('digital-id.')&&i>0?'digital-id.create-id':i===0?'open-max':taskIds[i-1],to,completed:p.completed.includes(to),active:to===s.taskId}));
  const prepareNext=screen?[...new Set(screen.actions.filter(a=>['navigate','skip-screen'].includes(a.outcome.kind)).map(a=>catalog.tasks[s.taskId].screens[a.outcome.screenId].assetId).filter(Boolean))].map(id=>catalog.assets[id]):[];
  const view={device,instruction:screen?.instruction?{text:screen.instruction,informational:true}:null,actions:s.status==='task'&&screen.automaticMs===null?screen.actions.map(({outcome,...action})=>action):[],missing:screen?.missing??null,automaticMs:screen?.automaticMs??null,nodes,edges,prepareNext,
   icons:Object.fromEntries(Object.entries(catalog.uiIcons??{}).map(([role,id])=>[role,icon(id)])),
   missions:Object.values(catalog.missions).map(m=>({missionId:m.missionId,title:m.title,icon:icon(m.iconAssetId),test:m.test,missing:[...m.missing]})),
   result:['completed','incomplete'].includes(s.status)?{complete:s.status==='completed',title:s.status==='completed'?'Миссия выполнена':'Миссия просмотрена с пропусками',text:s.status==='completed'?catalog.missions[s.missionId].completionText??'Возможности MAX изучены.':'Часть обязательных экранов ещё не предоставлена. Пропущенные задания не засчитаны.'}:null,
   qr:['completed','incomplete'].includes(s.status)?{...catalog.missions[s.missionId].qr,asset:catalog.assets['official.max-qr']}:null,
   resumeRequired:Boolean(p?.scanned),remainingMs:s.deadlineAt===null?null:Math.max(0,s.deadlineAt-(s.pausedAt??clock()))};
  return copy({schemaVersion:2,state:s,layouts:{layoutRevision:entry.record.layouts.layoutRevision,positions:entry.record.layouts.positions},view});
 }
 const report=e=>{try{onObserverError(e);}catch{}};
 function deliver(cb,event){try{Promise.resolve(cb(event)).catch(report);}catch(e){report(e);}}
 function publish(id,e,effects){if(closed)return;for(const cb of listeners.get(id)??[])deliver(cb,copy({snapshot:snapshot(e),effects}));}
 async function commit(id,entry,record,effects){try{const version=await persistence.commit(id,entry.version,record);if(version!==entry.version+1)throw err('INVALID_STORE_ACK');const next={version,record:copy(record)};cache.set(id,next);publish(id,next,effects);return next;}catch(cause){cache.delete(id);throw err(cause?.code==='STORE_CONFLICT'?'STORE_CONFLICT':'STORAGE_UNAVAILABLE',cause);}}
 async function dispatch(id,input,time,internal=false){let e=await load(id);
  if(input.type==='SET_LAYOUT')return layout(id,e,input);
  const result=dispatchMissionCommand(catalog,e.record.mission,input,{now:time,internal,routingProfile});
  if(result.reply.ok&&!result.duplicate){e=await commit(id,e,{...e.record,mission:result.model,clockCheckpointAt:time},result.effects);if(['SELECT_MISSION','RETURN_MENU','RESTART_MISSION','RESET_PROGRESS','EXPIRE'].includes(input.type)||input.type==='OWNER_CHANGED'&&!input.active){contacts.delete(id);for(const key of sequences.keys())if(key.startsWith(`${id}:`))sequences.delete(key);}}
  return copy({reply:result.reply,duplicate:result.duplicate,snapshot:snapshot(e)});
 }
 function internalCommand(e,type,fields={}){return {schemaVersion:1,type,commandId:`internal.${e.record.mission.state.runId}.${e.record.mission.state.revision}.${++internalSerial}`,sessionId:e.record.mission.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:e.record.mission.state.revision,...fields};}
 async function layout(id,e,c){
  const allowed=['schemaVersion','type','commandId','sessionId','contentRevision','expectedRevision','expectedLayoutRevision','layoutId','positions'];
  const reject=code=>copy({reply:{ok:false,code},duplicate:false,snapshot:snapshot(e)});
  if(Object.keys(c).some(k=>!allowed.includes(k))||c.schemaVersion!==1||!missionToken(c.commandId)||c.contentRevision!==catalog.contentRevision||c.layoutId&&c.layoutId!=='base'||!validPositions(c.positions)||Object.keys(c.positions).some(key=>!validLayoutNode(key,catalog)))return reject('INVALID_LAYOUT_COMMAND');
  const old=e.record.layouts.receipts.find(r=>r.command.commandId===c.commandId);if(old)return JSON.stringify(old.command)===JSON.stringify(c)?copy({reply:old.reply,duplicate:true,snapshot:snapshot(e)}):reject('COMMAND_ID_REUSED');
  if(e.record.mission.receipts.some(r=>r.command.commandId===c.commandId))return reject('COMMAND_ID_REUSED');
  if(c.expectedLayoutRevision!==e.record.layouts.layoutRevision)return reject('LAYOUT_REVISION_CONFLICT');
  const next={layoutRevision:e.record.layouts.layoutRevision+1,positions:structuredClone(c.positions),receipts:[...e.record.layouts.receipts]};
  const reply={ok:true,code:'APPLIED',commandId:c.commandId,layoutRevision:next.layoutRevision};next.receipts.push({command:structuredClone(c),reply});
  e=await commit(id,e,{...e.record,layouts:next},[{type:'LAYOUT_CHANGED',layoutRevision:next.layoutRevision}]);return copy({reply,duplicate:false,snapshot:snapshot(e)});
 }
 async function poll(id,time){let e=await load(id),s=e.record.mission.state;
  if(s.ownerActive&&s.deadlineAt!==null&&time>=s.deadlineAt&&s.status!=='expired')return dispatch(id,internalCommand(e,'EXPIRE'),time,true);
  if(!s.ownerActive)return copy({reply:{ok:true,code:'UNCHANGED'},duplicate:false,snapshot:snapshot(e)});
  const contact=contacts.get(id);if(contact&&s.status==='scan'&&contact.runId===s.runId&&time-contact.startedAt>=800){contacts.delete(id);return dispatch(id,internalCommand(e,'HOLD_CONFIRMED'),time,true);}
  if(s.status==='result'&&time>=s.resultReadyAt)return dispatch(id,internalCommand(e,'ADVANCE_RESULT'),time,true);
  if(s.status==='task'){const screen=catalog.tasks[s.taskId].screens[s.screenId];if(screen.automaticMs!==null&&screen.automaticMs!==undefined&&time-s.screenEnteredAt>=screen.automaticMs)return dispatch(id,internalCommand(e,'AUTO_SCREEN',{screenId:s.screenId,actionId:screen.actions[0].actionId}),time,true);}
  if(['scan','task','result'].includes(s.status)&&time-e.record.clockCheckpointAt>=5000)e=await commit(id,e,{...e.record,clockCheckpointAt:time},[]);
  return copy({reply:{ok:true,code:'UNCHANGED'},duplicate:false,snapshot:snapshot(e)});
 }
 return {
  createSession({sessionId}){return queue(sessionId,async()=>{const record={schemaVersion:2,mission:createMissionModel(catalog,{sessionId,routingProfile}),layouts:freshLayouts(),clockCheckpointAt:clock()};const version=await persistence.create(sessionId,record);if(version!==0)throw err('INVALID_STORE_ACK');const e={version,record:copy(record)};cache.set(sessionId,e);return snapshot(e);});},
  getSnapshot(id){return queue(id,async()=>snapshot(await load(id)));},
  sendCommand(input){const c=structuredClone(input);return queue(c?.sessionId,async()=>{const e=await load(c.sessionId);if(e.record.layouts.receipts.some(r=>r.command.commandId===c.commandId)&&c.type!=='SET_LAYOUT')return copy({reply:{ok:false,code:'COMMAND_ID_REUSED'},duplicate:false,snapshot:snapshot(e)});return dispatch(c.sessionId,c,clock());});},
  subscribe(id,callback){if(typeof callback!=='function')return Promise.reject(new TypeError('Callback required'));return queue(id,async()=>{const e=await load(id);if(closed)throw err('APPLICATION_CLOSED');const set=listeners.get(id)??new Set();listeners.set(id,set);set.add(callback);deliver(callback,copy({snapshot:snapshot(e),effects:[]}));return()=>{set.delete(callback);};});},
  inputOwnerChanged(id,{active},trustedNow=clock()){return queue(id,async()=>{contacts.delete(id);for(const key of sequences.keys())if(key.startsWith(`${id}:`))sequences.delete(key);const e=await load(id);if(e.record.mission.state.ownerActive===active)return snapshot(e);await dispatch(id,internalCommand(e,'OWNER_CHANGED',{active}),Math.floor(trustedNow),true);return snapshot(await load(id));});},
  handleContact(id,event,trustedNow=clock()){const value=structuredClone(event);return queue(id,async()=>{const e=await load(id),s=e.record.mission.state;
   if(!missionToken(value.contactId)||!Number.isSafeInteger(value.sequence)||value.sequence<0||!['down','move','up','cancel'].includes(value.type)||typeof value.inside!=='boolean')throw err('INVALID_CONTACT');
   const key=`${id}:${value.contactId}`,last=sequences.get(key)??-1;if(value.sequence<=last)throw err('CONTACT_SEQUENCE_CONFLICT');sequences.set(key,value.sequence);
   const contact=contacts.get(id);
   if(!s.ownerActive||s.status!=='scan'){contacts.delete(id);return snapshot(e);}
   if(value.type==='down'&&value.inside&&!contact)contacts.set(id,{contactId:value.contactId,startedAt:Math.floor(trustedNow),runId:s.runId});
   else if(contact?.contactId===value.contactId&&(!value.inside||['up','cancel'].includes(value.type))){
    if(value.type==='up'&&value.inside&&Math.floor(trustedNow)-contact.startedAt>=800){await poll(id,Math.floor(trustedNow));return snapshot(await load(id));}
    contacts.delete(id);
   }
   await poll(id,Math.floor(trustedNow));return snapshot(await load(id));});},
  pollTime(id,trustedNow=clock()){return queue(id,()=>poll(id,Math.floor(trustedNow)));},
  async close(){closed=true;contacts.clear();sequences.clear();listeners.clear();await Promise.all([...queues.values()]);cache.clear();}
 };
}
function validPositions(value){return value&&typeof value==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(value))&&Object.entries(value).every(([id,p])=>missionToken(id)&&p&&[Object.prototype,null].includes(Object.getPrototypeOf(p))&&Object.keys(p).sort().join(',')==='x,y'&&Number.isFinite(p.x)&&Number.isFinite(p.y));}
function validLayouts(l){const ids=new Set();return l&&Object.keys(l).sort().join(',')==='layoutRevision,positions,receipts'&&Number.isSafeInteger(l.layoutRevision)&&l.layoutRevision>=0&&validPositions(l.positions)&&Array.isArray(l.receipts)&&l.receipts.length===l.layoutRevision&&l.receipts.every((r,i)=>{const cmd=r.command;if(!cmd||cmd.type!=='SET_LAYOUT'||cmd.expectedLayoutRevision!==i||!missionToken(cmd.commandId)||ids.has(cmd.commandId)||r.reply?.ok!==true||r.reply.commandId!==cmd.commandId||r.reply.layoutRevision!==i+1||!validPositions(cmd.positions))return false;ids.add(cmd.commandId);return true;})&&(l.receipts.length?JSON.stringify(l.receipts.at(-1).command.positions)===JSON.stringify(l.positions):Object.keys(l.positions).length===0);}

// Each renderer keeps its own base-coordinate space; old Site keys remain valid.
function validLayoutNode(key,catalog){
 if(key==='open-max'||Object.hasOwn(catalog.tasks,key))return true;
 const parts=key.split(':');
 return parts.length===4&&parts[0]==='renderer'&&missionToken(parts[1])&&Object.hasOwn(catalog.missions,parts[2])&&(parts[3]==='open-max'||catalog.missions[parts[2]].taskIds.includes(parts[3]));
}
