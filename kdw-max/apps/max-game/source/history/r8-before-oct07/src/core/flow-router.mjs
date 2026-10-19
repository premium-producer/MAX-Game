import {assign, createMachine, transition} from 'xstate';
import {deepFreeze, missionToken} from '../contracts/mission-command.mjs';

// Pure library-owned routing. The host owns time, persistence and effects.
// Accepts a task from an already validated v3 document; draft graphs must not run.
export function createTaskFlowRouter(task) {
 task=structuredClone(task);
 const screens=task.screens.filter(s=>s.enabled), keys=new Map(screens.map((s,i)=>[s.screenId,`s${i}`]));
 if(!keys.has(task.startScreenId))throw new TypeError('FLOW_START_UNAVAILABLE');
 const states={done:{type:'final'}};
 for(const screen of screens){
  const active=screen.interactions.filter(i=>i.enabled);
  if(active.some(i=>!i.target||i.semanticRef))throw new TypeError('FLOW_SEMANTIC_ADAPTER_REQUIRED');
  states[keys.get(screen.screenId)]={on:{INTERACT:active.map(i=>{
   const target=i.target.kind==='complete-task'?'done':keys.get(i.target.screenId);
   if(!target)throw new TypeError('FLOW_TARGET_UNAVAILABLE');
   return {guard:({event})=>event.interactionId===i.interactionId&&event.kind===i.kind,
    target:`#flow.${target}`,actions:assign({selected:()=>i.interactionId})};
  })}};
 }
 const machine=createMachine({id:'flow',initial:keys.get(task.startScreenId),context:{selected:null},states});
 return Object.freeze({resolve(screenId,interactionId,kind){
  if(!keys.has(screenId))return null;
  const current=machine.resolveState({value:keys.get(screenId),context:{selected:null}});
  const [next,effects]=transition(machine,current,{type:'INTERACT',interactionId,kind});
  if(effects.length)throw new Error('FLOW_EXTERNAL_EFFECT_FORBIDDEN');
  if(next.context.selected!==interactionId)return null;
  if(next.value==='done')return {kind:'complete-task'};
  const destination=screens.find(s=>keys.get(s.screenId)===next.value);
  return {kind:'navigate',screenId:destination.screenId};
 }});
}

// Narrow opt-in integration gate. Nested channel semantics and automatic
// screens remain blocked until their dedicated adapters have been verified.
export async function createFlowRoutingProfile(catalog,{taskIds,rulesRevision}) {
 if(!missionToken(rulesRevision)||rulesRevision==='mission-rules-v1'||!Array.isArray(taskIds)||!taskIds.length||new Set(taskIds).size!==taskIds.length)throw new TypeError('INVALID_FLOW_PROFILE');
 const routers=new Map(),identities=new Map(),contentRevision=catalog.contentRevision;
 for(const id of taskIds){
  const task=catalog.tasks[id];
  if(!task||task.coreCatalog||Object.values(task.screens).some(s=>s.automaticMs!==null||s.missing||s.actions.some(a=>!['navigate','complete-task'].includes(a.outcome.kind)||a.outcome.answer)))throw new TypeError(`FLOW_UNSUPPORTED_TASK: ${id}`);
  const flowTask={startScreenId:task.startScreenId,screens:Object.values(task.screens).map(s=>({screenId:s.screenId,enabled:true,interactions:s.actions.map(a=>({interactionId:a.actionId,enabled:true,kind:a.placement==='hotspot'?'hotspot':'button',target:a.outcome.kind==='navigate'?{kind:'screen',screenId:a.outcome.screenId}:{kind:'complete-task'}}))}))};
  routers.set(id,createTaskFlowRouter(flowTask));identities.set(id,JSON.stringify(task));
 }
 const identity=JSON.stringify({engine:'xstate@5.20.2',adapter:1,rulesRevision,contentRevision,tasks:[...identities].sort(([a],[b])=>a<b?-1:a>b?1:0)});
 const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity));
 const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return Object.freeze({rulesRevision:`${rulesRevision.slice(0,63)}.${fingerprint}`,taskIds:deepFreeze([...taskIds]),
  assertCatalog(value){if(value.contentRevision!==contentRevision||[...identities].some(([id,json])=>JSON.stringify(value.tasks[id])!==json))throw new TypeError('FLOW_CATALOG_CONFLICT');},
  hasTask:id=>routers.has(id),
  resolve(taskId,screenId,action){return routers.get(taskId)?.resolve(screenId,action.actionId,action.placement==='hotspot'?'hotspot':'button')??null;}
 });
}
