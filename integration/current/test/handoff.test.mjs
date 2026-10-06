import test from 'node:test';
import assert from 'node:assert/strict';
import {V5RevealJourney} from '../code/client/src/journey-v5-route-layout.mjs';
import {V5MotionValue} from '../code/client/src/journey-v5-inertia.mjs';
import {sharedRevealContent} from '../code/client/src/journey-shared-reveal.mjs';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../code/client/src/journey-v5-backend.mjs';
import {createMemoryPersistencePort} from '../code/client/vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {createWebGLSession} from '../code/client/src/application/webgl-session.mjs';
const flush=()=>new Promise(r=>setImmediate(r));
async function fixture(){
 let now=1000,c;const app=createApp({persistence:createMemoryPersistencePort(),now:()=>now});
 const session=createWebGLSession({catalog,port:app,sessionId:'handoff',onSnapshot:s=>c?.accept(s),onError:assert.fail});
 await session.start();c=new V5RevealJourney(sharedRevealContent(catalog),session);c.configure(1760,1024,256);
 await session.command('SELECT_MISSION',{missionId:'blogger'});await session.contact('hand','down',true);now+=800;await session.contact('hand','up',true);
 for(let i=0;i<10;i++)c.tick(.1,{settled:true,deviceReady:true,deviceShown:true,reduced:true});
 for(let i=0;i<30&&session.snapshot.state.status!=='result';i++){
  const action=c.descriptor.actions.find(a=>a.actionId==='channel.continue-private')??c.descriptor.actions[0];
  assert.equal(c.answer(action.actionId),true);await flush();
 }
 assert.equal(session.snapshot.state.status,'result');
 now+=1000;await app.pollTime('handoff');assert.equal(c.handoff.stage,'unlink');
 return {c,session,close:async()=>{await session.close();await app.close();}};
}

for(const hz of [30,60,120])test(`ordered task handoff ${hz}Hz: links, device, packing, readiness, pause`,async()=>{
 const f=await fixture(),c=f.c,phone=new V5MotionValue(1),seen=[];let packed=0,ready=false;
 try{
  for(let i=0;i<hz*15&&c.handoff;i++){
   const stage=c.handoff.stage;if(seen.at(-1)!==stage){seen.push(stage);
    const frozen=[stage,c.handoff.link.value,c.handoff.trace.value,c.activeId];
    c.tick(10,{active:false});assert.deepEqual([c.handoff.stage,c.handoff.link.value,c.handoff.trace.value,c.activeId],frozen);
    assert.equal(c.answer(c.descriptor.actions[0]?.actionId),false);
   }
   if(stage==='unlink'){assert.equal(c.deviceVisibilityTarget,1);assert.equal(c.activeId,'blogger.channel');assert.equal(phone.value,1);}
   if(stage==='exit'){assert.equal(c.handoff.link.value,0);assert.equal(c.activeId,'blogger.channel');}
   if(stage==='pack'){assert.ok(phone.value<.005);assert.equal(c.activeId,'blogger.comments');assert.ok(!c.edges().some(e=>e.b===c.activeId));packed++;}
   if(stage==='trace'){assert.equal(c.deviceVisibilityTarget,0);assert.ok(phone.value<.005);if(c.handoff.trace.value===1)ready=true;}
   if(stage==='enter'){assert.equal(c.handoff.trace.value,1);assert.equal(c.handoff.link.value,0);assert.equal(ready,true);}
   if(stage==='link'){assert.ok(phone.at(1,.005,.05));assert.equal(c.handoff.trace.value,1);}
   phone.step(c.deviceVisibilityTarget,1/hz,12);
   c.tick(1/hz,{active:true,deviceHidden:phone.at(0,.005,.05),deviceReady:ready,settled:(stage!=='pack'||packed>hz/5)&&phone.at(c.deviceVisibilityTarget,.005,.05)});
  }
  assert.deepEqual(seen,['unlink','exit','pack','trace','enter','link']);assert.equal(c.handoff,null);assert.equal(c.phase,'task');assert.equal(c.activeId,'blogger.comments');
 }finally{await f.close();}
});

test('restart during every handoff stage discards old display and never starts the next task',async()=>{
 for(const stage of ['unlink','exit','pack','trace','enter','link']){
  const f=await fixture(),c=f.c;
  try{
   for(let i=0;i<12&&c.handoff.stage!==stage;i++)c.tick(.1,{settled:true,deviceHidden:true,deviceReady:true,deviceShown:true,reduced:true});
   assert.equal(c.handoff.stage,stage);await c.restart();
   assert.equal(c.handoff,null);assert.equal(c.phase,'palm');
   for(let i=0;i<20;i++)c.tick(.1,{settled:true,deviceHidden:true,deviceReady:true,deviceShown:true,reduced:true});
   assert.equal(c.phase,'palm');assert.equal(c.snapshot.state.status,'scan');assert.equal(c._pending,null);
  }finally{await f.close();}
 }
});

