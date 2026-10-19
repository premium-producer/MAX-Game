import {Verrou} from '@verrou/core';
import {memoryStore} from '@verrou/core/drivers/memory';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {flowDocumentsEqual} from './collaboration.mjs';

export const CARD_LOCK_TTL_MS=30000;
export const CARD_LOCK_HEARTBEAT_MS=8000;
const invalid=message=>Object.assign(Error(message),{status:400});
const lockFailure=(code,screenIds)=>Object.assign(Error(code==='CARD_LOCKED'?'Экран уже редактирует другой участник':'Право редактирования экрана истекло'),{status:423,code,screenIds});
export function validateEditorId(value){
 if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{8,128}$/.test(value))throw invalid('Не указан редактор');
 return value;
}

/** Changed shared text/final/start settings reserve their complete affected scope. */
export function changedCardIds(before,after,catalog){
 const ids=new Set(),beforeTasks=new Map(before.tasks.map(t=>[t.taskId,t]));
 const addTask=task=>task.screens.forEach(screen=>ids.add(screen.screenId));
 for(const mission of after.missions){
  if(before.missions.find(m=>m.missionId===mission.missionId)?.helpText!==mission.helpText){
   const source=catalog.missions.find(m=>m.missionId===mission.missionId);
   for(const task of source.tasks)addTask(task);
  }
 }
 for(const task of after.tasks){
  const previous=beforeTasks.get(task.taskId);
  if(!previous||previous.helpText!==task.helpText||previous.startScreenId!==task.startScreenId||
   previous.screens.find(s=>s.final)?.screenId!==task.screens.find(s=>s.final)?.screenId)addTask(task);
  for(const screen of task.screens){
   const old=previous?.screens.find(s=>s.screenId===screen.screenId);
   if(!old||!flowDocumentsEqual(old,screen))ids.add(screen.screenId);
  }
 }
 return [...ids];
}

/** The legacy endpoint also supports catalogs without v3 navigation outcomes. */
export function changedLegacyCardIds(before,after,catalog){
 const ids=new Set();
 const records=document=>new Map((document.records||[]).map(record=>[JSON.stringify([record.screenId,record.actionId]),record]));
 const oldRecords=records(before),newRecords=records(after);
 for(const key of new Set([...oldRecords.keys(),...newRecords.keys()])){
  const old=oldRecords.get(key),next=newRecords.get(key);
  if(!old||!next||!flowDocumentsEqual(old,next))ids.add((next||old).screenId);
 }
 const oldSettings=new Map((before.screens||[]).map(screen=>[screen.screenId,screen])),newSettings=new Map((after.screens||[]).map(screen=>[screen.screenId,screen]));
 for(const id of new Set([...oldSettings.keys(),...newSettings.keys()])){
  const old=oldSettings.get(id),next=newSettings.get(id);
  if(!old||!next||!flowDocumentsEqual(old,next))ids.add(id);
 }
 for(const mission of catalog.missions)for(const task of mission.tasks){
  const finalIn=settings=>task.screens.find(screen=>settings.get(screen.screenId)?.final)?.screenId;
  if(finalIn(oldSettings)!==finalIn(newSettings))for(const screen of task.screens)ids.add(screen.screenId);
 }
 return [...ids];
}

// The store calls this manager only within its shared mutation queue. Verrou owns
// acquisition, random owner tokens and TTL. The map is listing/client metadata.
export function createCardLocks({ttlMs=CARD_LOCK_TTL_MS,heartbeatMs=CARD_LOCK_HEARTBEAT_MS}={}){
 const verrou=new Verrou({default:'memory',stores:{memory:{driver:memoryStore()}}});
 const held=new Map();
 const timings={ttlMs,heartbeatMs};
 async function expire(){
  for(const [screenId,entry] of held)if(await entry.lock.isExpired()){
   // Verrou 0.5.2 implicit memory takeover retains the old owner. Releasing the
   // expired lease before reacquiring avoids that path and prevents stale renew.
   await entry.lock.release();held.delete(screenId);
  }
 }
 const expiresAt=async entry=>Date.now()+Math.max(0,await entry.lock.getRemainingTime());
 const grant=async(screenId,entry)=>{const validForMs=Math.max(0,entry.lock.getRemainingTime());return {screenId,token:entry.token,expiresAt:Date.now()+validForMs,validForMs,...timings};};
 function owned(screenId,clientId,token){
  const entry=held.get(screenId);
  if(!entry||entry.clientId!==clientId||typeof token!=='string'||Buffer.byteLength(token)!==64||!timingSafeEqual(Buffer.from(entry.token),Buffer.from(token)))throw lockFailure('CARD_LEASE_LOST',[screenId]);
  return entry;
 }
 return {
  async list(clientId){validateEditorId(clientId);await expire();return {locks:await Promise.all([...held].map(async([screenId,entry])=>({screenId,owned:entry.clientId===clientId,expiresAt:await expiresAt(entry)}))),...timings};},
  async mutate({action,screenId,token},clientId){
   validateEditorId(clientId);await expire();
   if(action==='acquire'){
    const existing=held.get(screenId);
    if(existing){if(existing.clientId!==clientId)throw lockFailure('CARD_LOCKED',[screenId]);return grant(screenId,existing);}
    const lock=verrou.createLock(`max-card:${screenId}`,ttlMs);
    if(!await lock.acquireImmediately())throw lockFailure('CARD_LOCKED',[screenId]);
    const entry={clientId,lock,token:randomBytes(32).toString('hex')};held.set(screenId,entry);
    for(const [oldId,old] of held)if(oldId!==screenId&&old.clientId===clientId){await old.lock.release();held.delete(oldId);}
    return grant(screenId,entry);
   }
   if(!['renew','release'].includes(action))throw invalid('Неизвестное действие блокировки');
   const entry=owned(screenId,clientId,token);
   if(action==='release'){await entry.lock.release();held.delete(screenId);return {released:true};}
   await entry.lock.extend(ttlMs);return grant(screenId,entry);
  },
  async guard(screenIds,context){
   await expire();
   if(context?.clientId!==undefined)validateEditorId(context.clientId);
   if(context?.screenId!==undefined||context?.token!==undefined)owned(context.screenId,context.clientId,context.token);
   const busy=screenIds.filter(screenId=>{const entry=held.get(screenId);return entry&&entry.clientId!==context?.clientId;});
   if(busy.length)throw lockFailure('CARD_LOCKED',busy);
   for(const screenId of screenIds)if(held.has(screenId)){
    if(context?.screenId!==screenId)throw lockFailure('CARD_LEASE_LOST',[screenId]);
    owned(screenId,context.clientId,context.token);
   }
  }
 };
}
