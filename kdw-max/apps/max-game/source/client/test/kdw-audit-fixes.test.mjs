import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {V5_MISSION_CATALOG} from '../src/journey-v5-backend.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
import {createTrustedClock} from '../src/application/trusted-clock.mjs';
import {TASK_CLOCK_RULES_REVISION} from '../src/core/mission-core.mjs';
import {startProduction} from '../src/kdw-production.mjs';
import {monitorPreparation,gameAudioActive} from '../src/kdw-runtime-health.mjs';
const require=createRequire(import.meta.url),{DEFAULTS}=require('../../../../STARTUP/tools/stand-settings.cjs');
const catalog={...V5_MISSION_CATALOG,contentRevision:V5_MISSION_CATALOG.contentRevision+'.audit-fixes',kdwProduction:{production:true,revision:'audit-fixes',value:DEFAULTS}};
async function driver(admit){
 let time=1000000,mono=0,serial=0;const id='regression',persistence=createMemoryPersistencePort();
 const make=()=>createMissionSessionApplication({catalog,persistence,now:()=>time,monotonic:()=>mono,admit,missionRulesRevision:TASK_CLOCK_RULES_REVISION});
 const app=make();await app.createSession({sessionId:id});const snap=()=>app.getSnapshot(id);
 const send=async(type,fields={})=>{const s=(await snap()).state;const out=await app.sendCommand({schemaVersion:1,type,commandId:'test.'+(++serial),sessionId:id,contentRevision:catalog.contentRevision,expectedRevision:s.revision,...fields});assert.equal(out.reply.ok,true,out.reply.code);return out;};
 await app.inputOwnerChanged(id,{active:true});await send('SELECT_MISSION',{missionId:'business'});
 return{id,app,make,snap,send,advance(ms){time+=ms;mono+=Math.max(ms,0);},shift(ms){time+=ms;}};
}
async function begin(d){await d.send('STAND_READY',{screenId:'scan'});await d.app.handleContact(d.id,{contactId:'palm',sequence:0,type:'down',inside:true});d.advance(800);await d.app.pollTime(d.id);await d.send('STAND_READY',{screenId:(await d.snap()).state.screenId});}
test('production ticker preserves registration result until renderer allows advancement; inactivity still runs',async()=>{
 const d=await driver();await begin(d);
 while((await d.snap()).state.status==='task'){const s=(await d.snap()).state,screen=catalog.tasks[s.taskId].screens[s.screenId];await d.send('ACT',{taskId:s.taskId,screenId:s.screenId,actionId:screen.actions[0].actionId});}
 const facade=createWebGLSession({port:d.app,catalog,sessionId:d.id});await facade.start();
 const interval=globalThis.setInterval,clear=globalThis.clearInterval,doc=globalThis.document;const callbacks=[];
 globalThis.document={addEventListener(){},removeEventListener(){}};globalThis.setInterval=fn=>{callbacks.push(fn);return callbacks.length;};globalThis.clearInterval=()=>{};
 let stop;try{
  stop=startProduction({getSession:()=>facade,ready:()=>false});d.advance(2000);callbacks[0]();for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));
  assert.equal((await d.snap()).state.screenId,'business.platform.ready');assert.equal((await d.snap()).state.status,'result');
  await facade.poll(Date.now(),{pauseResult:false});assert.equal((await d.snap()).state.taskId,'business.channel');
 }finally{stop?.();globalThis.setInterval=interval;globalThis.clearInterval=clear;globalThis.document=doc;await facade.close();}
 const idle=await driver();await begin(idle);idle.advance(60000);await idle.app.pollTime(idle.id);assert.equal((await idle.snap()).state.status,'result');idle.advance(60000);await idle.app.pollTime(idle.id,undefined,{allowResult:false});assert.equal((await idle.snap()).state.standEndReason,'inactivity');await idle.app.close();
});
test('server admission refusal cannot start the task, retry succeeds on the same visitor',async()=>{
 let fail=true,calls=0;const d=await driver(async()=>{calls++;if(fail)throw Error('GAME_NO_LONGER_ACTIVE');});
 await d.send('STAND_READY',{screenId:'scan'});await d.app.handleContact(d.id,{contactId:'palm',sequence:0,type:'down',inside:true});d.advance(800);
 await assert.rejects(d.app.pollTime(d.id),/GAME_NO_LONGER_ACTIVE/);assert.equal((await d.snap()).state.status,'scan');fail=false;await d.app.pollTime(d.id);assert.equal((await d.snap()).state.status,'task');assert.equal(calls,2);await d.app.close();
});
test('clock correction preserves elapsed time and valid saved deadlines',async()=>{
 let wall=1000000,mono=0;const c=createTrustedClock({wall:()=>wall,monotonic:()=>mono});assert.equal(c(),1000000);wall-=300000;mono+=1000;assert.equal(c(),1001000);c.recover(1005000);mono+=2000;assert.equal(c(),1007000);assert.throws(()=>c.recover(1007000+86400001),{code:'CLOCK_CORRECTION_REQUIRED'});
 const d=await driver();await begin(d);const deadline=(await d.snap()).state.deadlineAt;d.shift(-5000);await d.send('STAND_TOUCH');const recovered=d.make();assert.equal((await recovered.getSnapshot(d.id)).state.deadlineAt,deadline);await d.app.close();await recovered.close();
});
test('preparation watchdog reports once per stalled scene and respects ready state',()=>{
 const set=globalThis.setInterval,clear=globalThis.clearInterval;let tick,time=0,calls=0,state={sessionId:'one',runId:1,status:'scan',screenId:null,standReady:false};
 globalThis.setInterval=fn=>(tick=fn,1);globalThis.clearInterval=()=>{};
 try{const stop=monitorPreparation(()=>state,{now:()=>time,timeoutMs:1000,onFailure:()=>calls++});time=1000;tick();tick();assert.equal(calls,1);state={...state,status:'task',screenId:'a',standReady:true};tick();time=3000;tick();assert.equal(calls,1);stop();}finally{globalThis.setInterval=set;globalThis.clearInterval=clear;}
});
test('portable audio is active without managed assignment and stops outside presentation',()=>{
 assert.equal(gameAudioActive({connected:true,local:true,presented:true}),true);
 assert.equal(gameAudioActive({connected:true,local:true,presented:false}),false);
 assert.equal(gameAudioActive({connected:true,local:false,presented:true}),false);
 assert.equal(gameAudioActive({connected:true,local:false,presented:true,assignment:{lifecycle:{status:'active'}}}),true);
});
test('five-second and five-minute wall corrections survive command and restart without a fresh budget',async()=>{
 for(const shift of [-300000,-5000,5000,300000]){
  const d=await driver();await begin(d);const deadline=(await d.snap()).state.deadlineAt;d.shift(shift);await d.send('STAND_TOUCH');const recovered=d.make();
  assert.equal((await recovered.getSnapshot(d.id)).state.deadlineAt,deadline);await recovered.pollTime(d.id);const s=await recovered.getSnapshot(d.id);assert.ok(s.view.remainingMs===null||s.view.remainingMs>=0);if(shift===300000)assert.equal(s.state.status,'result');
  await d.app.close();await recovered.close();
 }
});
