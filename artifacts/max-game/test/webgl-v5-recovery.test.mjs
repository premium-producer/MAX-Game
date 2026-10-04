import test from 'node:test';
import assert from 'node:assert/strict';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
import {V5RevealJourney} from '../src/journey-v5-route-layout.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {recoveryDetails} from '../src/journey-v5-recovery.mjs';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../src/journey-v5-backend.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));

// The installed release, its receipt replay and its clock own all fixtures.
// No invented saved state or direct progress mutation is used below.
async function fixture(){
 let now=1000,session,app,controller;const errors=[],persistence=createMemoryPersistencePort();
 const sessionId='v5-recovery';
 const open=async(initialOwnerActive=true)=>{
  app=createApp({persistence,now:()=>now});
  session=createWebGLSession({catalog,port:app,sessionId,initialOwnerActive,onSnapshot:s=>controller?.accept(s),onError:e=>errors.push(e)});
  await session.start();
 };
 await open();
 return {
  get session(){return session;},get app(){return app;},get snapshot(){return session.snapshot;},
  advance(ms){now+=ms;},
  async poll(){await app.pollTime(sessionId);await flush();},
  async select(missionId='blogger'){const result=await session.command('SELECT_MISSION',{missionId});assert.equal(result.reply.ok,true);},
  async scan(){await session.contact('hand','down',true);now+=800;await session.contact('hand','up',true);assert.equal(session.snapshot.state.scanned,true);},
  async answer(){
   const {state,view}=session.snapshot,screen=catalog.tasks[state.taskId].screens[state.screenId];
   if(screen.automaticMs!==null){now+=screen.automaticMs+1;await app.pollTime(sessionId);return;}
   const action=screen.actions.find(a=>a.actionId==='channel.continue-private')??screen.actions.find(a=>a.outcome.kind!=='incorrect');
   assert.ok(view.actions.some(a=>a.actionId===action.actionId));
   assert.equal((await session.act(state.screenId,action.actionId)).reply.ok,true);
  },
  async reopen(initialOwnerActive=false){controller=null;await session.close();now+=60000;await open(initialOwnerActive);},
  controller(){controller=new V5RevealJourney(sharedRevealContent(catalog),session);controller.configure(1760,1024,256);return controller;},
  async close(){await session.close();assert.deepEqual(errors,[]);},
 };
}

test('local recovery starts without ownership and preserves confirmed screen, answers and time until explicit continue',async()=>{
 const f=await fixture();
 try{
  await f.select();await f.scan();await f.answer();f.advance(2300);await f.session.owner(false);
  const before=f.snapshot;await f.reopen();
  assert.equal(f.snapshot.state.ownerActive,false);
  assert.equal(f.snapshot.state.screenId,before.state.screenId);assert.deepEqual(f.snapshot.state.progress,before.state.progress);
  assert.equal(f.snapshot.view.remainingMs,before.view.remainingMs);
  assert.deepEqual(recoveryDetails(f.snapshot,catalog),{title:catalog.missions.blogger.title,canContinue:true});
  const revision=f.snapshot.state.revision;f.advance(300000);await f.poll();
  assert.equal(f.snapshot.state.revision,revision);assert.equal(f.snapshot.view.remainingMs,before.view.remainingMs);
  const c=f.controller();assert.equal(c.phase,'paused');assert.equal(c.phoneVisible,false);
  const run=f.snapshot.state.runId,screen=f.snapshot.state.screenId,answers=structuredClone(f.snapshot.state.progress.blogger.answers);
  await f.session.owner(true);assert.equal(c.resume(c.activeId),true);assert.equal(c.phase,'trace');
  assert.equal(c.answer(c.descriptor.actions[0].actionId),false);
  for(let i=0;i<120&&c.phase==='trace';i++)c.tick(1/60,{settled:false,deviceReady:false});
  assert.equal(c.phase,'phone-enter');assert.equal(c.phoneVisible,true);
  for(let i=0;i<60;i++)c.tick(1/60,{settled:false,deviceReady:false});
  assert.equal(c.phase,'phone-enter','unprepared/unsettled device remains noninteractive');
  assert.equal(c.answer(c.descriptor.actions[0].actionId),false);
  c.tick(1/60,{settled:true,deviceReady:true});assert.equal(c.phase,'task');
  assert.equal(c.displayedState.screenId,screen);assert.equal(f.snapshot.state.runId,run);
  assert.deepEqual(f.snapshot.state.progress.blogger.answers,answers);
  assert.equal(f.snapshot.view.remainingMs,before.view.remainingMs);
 }finally{await f.close();}
});

test('restart from recovery resets only selected mission and requires a new full hold',async()=>{
 const f=await fixture();
 try{
  await f.select('digital-id');await f.scan();await f.answer();
  await f.session.command('RETURN_MENU');const other=structuredClone(f.snapshot.state.progress['digital-id']);
  await f.select('blogger');await f.scan();await f.answer();await f.reopen();
  const c=f.controller(),oldRun=f.snapshot.state.runId;
  assert.equal((await f.session.restart()).reply.ok,true);await f.session.owner(true);
  assert.notEqual(f.snapshot.state.runId,oldRun);assert.equal(f.snapshot.state.status,'scan');assert.equal(c.phase,'palm');
  assert.equal(f.snapshot.state.scanned,false);assert.equal(f.snapshot.state.screenId,null);assert.equal(c.phoneVisible,false);
  assert.deepEqual(f.snapshot.state.progress.blogger.answers,{});assert.deepEqual(f.snapshot.state.progress['digital-id'],other);
  assert.equal(f.snapshot.view.remainingMs,180000);
  await f.session.contact('early','down',true);f.advance(799);await f.session.contact('early','up',true);await f.poll();
  assert.equal(f.snapshot.state.scanned,false);
  await f.scan();assert.equal(c.startup.stage,'shell');
 }finally{await f.close();}
});

test('scan recovery keeps the hand; returning to menu preserves progress; default owner behavior stays compatible',async()=>{
 const f=await fixture();
 try{
  assert.equal(f.snapshot.state.ownerActive,true,'legacy/default facade still acquires input');
  assert.equal(recoveryDetails(f.snapshot,catalog),null);
  await f.select();await f.reopen();
  assert.equal(recoveryDetails(f.snapshot,catalog).canContinue,true);const c=f.controller();assert.equal(c.phase,'palm');
  await f.session.owner(true);assert.equal(c.resume(),false,'scan cannot bypass holding through resume');assert.equal(f.snapshot.state.scanned,false);
  await f.scan();await f.answer();const progress=structuredClone(f.snapshot.state.progress);
  await f.session.command('RETURN_MENU');assert.equal(recoveryDetails(f.snapshot,catalog),null);assert.equal(c.phase,'menu');
  assert.equal(f.snapshot.state.progress.blogger.currentScreenId,progress.blogger.currentScreenId);
  assert.deepEqual(f.snapshot.state.progress.blogger.answers,progress.blogger.answers);
 }finally{await f.close();}
});

test('expired and zero-budget recovery offer restart, not continue',async()=>{
 for(const expire of [false,true]){
  const f=await fixture();
  try{
   await f.select();await f.scan();f.advance(180000);
   if(expire)await f.poll();else await f.session.owner(false);
   await f.reopen();assert.equal(f.snapshot.view.remainingMs,0);
   assert.equal(f.snapshot.state.status,expire?'expired':'task');assert.equal(recoveryDetails(f.snapshot,catalog).canContinue,false);
  }finally{await f.close();}
 }
});

test('result recovery stays frozen until continue; completed recovery retains QR and does not restart',async()=>{
 const f=await fixture();
 try{
  await f.select();await f.scan();
  for(let i=0;i<60&&f.snapshot.state.status==='task';i++)await f.answer();
  assert.equal(f.snapshot.state.status,'result');await f.reopen();
  const result=f.snapshot,readyAt=result.state.resultReadyAt;
  f.advance(10000);await f.poll();assert.equal(f.snapshot.state.status,'result');assert.equal(f.snapshot.state.resultReadyAt,readyAt);
  assert.equal(recoveryDetails(f.snapshot,catalog).canContinue,true);
  await f.session.owner(true);f.advance(801);await f.poll();assert.equal(f.snapshot.state.status,'task');
  for(let i=0;i<100&&f.snapshot.state.status!=='completed';i++){
   if(f.snapshot.state.status==='result'){f.advance(801);await f.poll();}else await f.answer();
  }
  assert.equal(f.snapshot.state.status,'completed');const progress=structuredClone(f.snapshot.state.progress),run=f.snapshot.state.runId;
  await f.reopen();assert.equal(recoveryDetails(f.snapshot,catalog).canContinue,true);assert.equal(f.snapshot.view.remainingMs,null);
  const c=f.controller();assert.equal(c.phase,'complete');assert.ok(f.snapshot.view.qr?.asset);
  await f.session.owner(true);assert.equal(f.snapshot.state.status,'completed');assert.equal(f.snapshot.state.runId,run);assert.deepEqual(f.snapshot.state.progress,progress);
 }finally{await f.close();}
});
