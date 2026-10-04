import test from 'node:test';
import assert from 'node:assert/strict';
import {V5RevealJourney} from '../src/journey-v5-route-layout.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../src/journey-v5-backend.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function rowCentres(nodes,active,device,nodeWidth){
 let x=0,phoneX;const centres={};
 for(const node of nodes){centres[node.step]={x:x+nodeWidth/2,y:0};x+=nodeWidth+400;if(node===active){phoneX=x+device.width/2;x+=device.width+400;}}
 return Object.fromEntries(Object.entries(centres).map(([id,p])=>[id,{x:p.x-phoneX,y:p.y}]));
}
async function fixture(mission='blogger'){
 let now=Date.now(),c;const errors=[],sessionId=`startup-${mission}`;
 const app=createApp({persistence:createMemoryPersistencePort(),now:()=>now});
 const session=createWebGLSession({catalog,port:app,sessionId,onSnapshot:s=>c?.accept(s),onError:e=>errors.push(e)});
 await session.start();c=new V5RevealJourney(sharedRevealContent(catalog),session,rowCentres);c.configure(1760,1024,256);
 await session.command('SELECT_MISSION',{missionId:mission});
 return {c,session,
  async down(id='hand'){assert.equal(c.down(id),true);await flush();},
  async confirm(){now+=800;await app.pollTime(sessionId);await flush();assert.equal(session.snapshot.state.scanned,true);},
  async release(id='hand'){assert.equal(c.up(id,true),true);await flush();},
  async close(){await session.close();await app.close();assert.deepEqual(errors,[]);},
 };
}
function stepUntil(c,predicate,{hz=60,maxSeconds=12,...options}={}){
 for(let i=0;i<hz*maxSeconds&&!predicate();i++)c.tick(1/hz,{settled:true,deviceReady:true,deviceShown:true,...options});
 assert.ok(predicate(),`transition did not reach expected state; phase=${c.phase}, startup=${c.startup?.stage}`);
}
const row=c=>c.nodes.map(n=>{const p=c.rowPose(n);return [n.step,p.worldX,p.worldY];});

test('unconfirmed holding shows no startup; confirmation presents an empty shell before logo and row',async()=>{
 const f=await fixture(),c=f.c;
 try{
  await f.down();
  assert.equal(c.phase,'holding');assert.ok(!c.startup);assert.equal(c.phoneVisible,false);assert.equal(c.deviceVisibilityTarget,0);
  assert.equal(c.snapshot.state.scanned,false);assert.equal(c.snapshot.state.status,'scan');
  assert.equal(c.answer(c.descriptor.actions?.[0]?.actionId),false);
  await f.confirm();
  assert.equal(c.phase,'arrange');assert.equal(c.startup.stage,'shell');assert.equal(c.startupLogo,true);
  assert.equal(c.phoneVisible,true);assert.equal(c.deviceVisibilityTarget,1);assert.equal(c.deviceLinkPresence,0);
  assert.equal(c.nodes.length,catalog.missions.blogger.taskIds.length+1);assert.ok(c.current);
  const targets=row(c),phone={...c.phone},key=c.startupKey;
  c.nodes.forEach(n=>assert.equal(c.pose(n).worldX,c.rowPose(n).worldX,'intro must use the final slot rather than a ring'));
  assert.equal(c.paths.elapsed,0);assert.equal(c.startupContentPresence,0);assert.ok(c.nodes.every(n=>c.presence(n)===0));
  c.tick(.1,{settled:true,deviceReady:true,deviceShown:false});assert.equal(c.startup.stage,'shell');
  c.tick(.1,{settled:true,deviceReady:false,deviceShown:true});assert.equal(c.startup.stage,'shell');
  assert.equal(c.paths.elapsed,0);assert.equal(c.startupContentPresence,0);assert.ok(c.nodes.every(n=>c.presence(n)===0));
  c.tick(.1,{settled:true,deviceReady:true,deviceShown:true});assert.equal(c.startup.stage,'row');
  assert.equal(c.paths.elapsed,0,'shell release frame must not advance icon paths');assert.equal(c.startupContentPresence,0,'logo starts after shell release');
  assert.deepEqual(row(c),targets);assert.deepEqual(c.phone,phone);assert.equal(c.startupKey,key);
 }finally{await f.close();}
});

for(const hz of [30,60,120])test(`startup ${hz}Hz: sequential row → icon links → phone links → prepared task`,async()=>{
 const f=await fixture('communication'),c=f.c;
 try{
  await f.down();await f.confirm();const targets=row(c),phone={...c.phone},logoKey=c.startupKey,firstVisible=new Map();
  c.tick(1/hz,{settled:true,deviceReady:true,deviceShown:true});assert.equal(c.startup.stage,'row');
  assert.equal(c.paths.elapsed,0);assert.equal(c.startupContentPresence,0);
  for(let i=0;i<hz*.6;i++){
   c.tick(1/hz,{settled:true,deviceReady:true,deviceShown:true});
   c.nodes.forEach(n=>{if(c.presence(n)>.02&&!firstVisible.has(n.step))firstVisible.set(n.step,i/hz);});
  }
  assert.ok(c.startupContentPresence>0&&c.startupContentPresence<1,'logo fades in while icons arrive');
  const times=[...firstVisible.values()];assert.ok(times.length>=2,'at least two icons must begin independently after the shell appears');
  for(let i=1;i<times.length;i++)assert.ok(times[i]>times[i-1],'icon start times must be staggered');
  assert.equal(c.startup.stage,'row');assert.equal(c.snapshot.state.scanned,true);
  stepUntil(c,()=>c.paths?.done===true,{hz,deviceReady:false});
  c.tick(1/hz,{settled:true,deviceReady:false});assert.equal(c.startup.stage,'row','row waits for prepared logo/phone');
  c.tick(1/hz,{settled:false,deviceReady:true});assert.equal(c.startup.stage,'row','row waits for actual motion settlement');
  stepUntil(c,()=>c.startup?.stage==='trace',{hz});assert.equal(c.phase,'trace');assert.equal(c.deviceLinkPresence,0);
  assert.ok(c.edges().some(e=>e.b===c.activeId));assert.equal(c.startupLogo,true);
  stepUntil(c,()=>c.startup?.stage==='fan',{hz});assert.equal(c.phase,'phone-enter');assert.equal(c.startupLogo,true);
  assert.equal(c.answer(c.descriptor.actions?.[0]?.actionId),false);
  stepUntil(c,()=>c.startup?.stage==='content',{hz});assert.equal(c.startupLogo,false);
  assert.notEqual(c.phoneContentKey,logoKey);assert.equal(c.deviceVisibilityTarget,1);
  for(let i=0;i<hz;i++)c.tick(1/hz,{settled:true,deviceReady:false});
  assert.equal(c.startup.stage,'content');assert.notEqual(c.phase,'task');
  c.tick(1/hz,{settled:false,deviceReady:true});assert.equal(c.startup.stage,'content');
  c.tick(1/hz,{settled:true,deviceReady:true,busy:true});assert.equal(c.startup.stage,'content');
  stepUntil(c,()=>c.phase==='task',{hz});assert.equal(c.startup,null);
  const finalRow=row(c),widthDelta=c.phoneMetrics.width-392;
  assert.equal(c.phoneMetrics.height,800);assert.equal(c.phoneMetrics.width,c.targetPhoneMetrics.width);
  finalRow.forEach((p,i)=>{
   assert.equal(p[0],targets[i][0]);assert.equal(p[2],targets[i][2],'format morph keeps every row centre Y');
   const side=Math.sign(targets[i][1]-phone.x);
   assert.ok(Math.abs(p[1]-targets[i][1]-side*widthDelta/2)<1e-8,'row expands/contracts only by the actual half-width difference');
  });
  assert.deepEqual(c.phone,phone,'one persistent device centre serves splash and the aspect-driven task');
  assert.equal(c.snapshot.state.status,'task');
 }finally{await f.close();}
});

test('early release never creates a phone; a fresh full hold starts the shell',async()=>{
 const f=await fixture(),c=f.c;
 try{
  await f.down();
  c.tick(.1,{settled:true,deviceReady:true});await f.release();
  assert.equal(c.snapshot.state.scanned,false);assert.ok(!c.startup);assert.equal(c.deviceVisibilityTarget,0);
  for(let i=0;i<120;i++)c.tick(1/60,{deviceHidden:false});
  assert.ok(!c.startup);assert.equal(c.phase,'palm');assert.equal(c.phoneVisible,false);
  await f.down('again');assert.ok(!c.startup);assert.equal(c.phoneVisible,false);
  await f.confirm();assert.equal(c.startup.stage,'shell');stepUntil(c,()=>c.phase==='task',{reduced:true});assert.equal(c.snapshot.state.scanned,true);
 }finally{await f.close();}
});

test('release and cancellation after confirmed scanning retain the same visible shell',async()=>{
 const f=await fixture(),c=f.c;
 try{
  await f.down();await f.confirm();
  const startup=c.startup,key=c.startupKey,phone={...c.phone};
  c.up('hand',true);c.cancelContact('hand');c.moveContact('hand',false);await flush();
  assert.equal(c.startup,startup);assert.equal(c.startup.stage,'shell');assert.equal(c.startupKey,key);
  assert.equal(c.deviceVisibilityTarget,1);assert.equal(c.phoneVisible,true);assert.deepEqual(c.phone,phone);
  assert.equal(c.snapshot.state.scanned,true);assert.equal(c.answer(c.descriptor.actions?.[0]?.actionId),false);
  stepUntil(c,()=>c.phase==='task',{reduced:true});
 }finally{await f.close();}
});

test('restart invalidates every startup phase and cannot be revived by late ready frames',async()=>{
 for(const stage of ['shell','row','trace','fan','content']){
  const f=await fixture(),c=f.c;
  try{
   await f.down();await f.confirm();stepUntil(c,()=>c.startup?.stage===stage,{reduced:true});
   const oldRun=c.snapshot.state.runId;await c.restart();
   assert.notEqual(c.snapshot.state.runId,oldRun);assert.equal(c.startup,null);assert.equal(c.paths,null);assert.equal(c.phase,'palm');
   for(let i=0;i<30;i++)c.tick(.1,{settled:true,deviceReady:true,reduced:true});
   assert.equal(c.phase,'palm');assert.equal(c.phoneVisible,false);assert.equal(c.snapshot.state.scanned,false);
  }finally{await f.close();}
 }
});

test('leaving the hit area cancels the old hold; a replacement owns the only confirmed startup',async()=>{
 const f=await fixture(),c=f.c;
 try{
  await f.down('first');
  c.tick(.1,{settled:true,deviceReady:true});assert.equal(c.moveContact('first',false),true);await flush();
  assert.ok(!c.startup);assert.equal(c.snapshot.state.scanned,false);assert.equal(c.phoneVisible,false);
  c.tick(.1,{deviceHidden:false});
  await f.down('replacement');assert.ok(!c.startup);assert.equal(c.phoneVisible,false);
  assert.equal(c.up('first'),false,'late release cannot cancel the replacement contact');
  assert.equal(c.contact,'replacement');await f.confirm();
  stepUntil(c,()=>c.phase==='task',{reduced:true});assert.equal(c.snapshot.state.scanned,true);
 }finally{await f.close();}
});

test('hidden page cancels an unconfirmed hold and cannot complete scanning through presentation time',async()=>{
 const f=await fixture(),c=f.c;
 try{
  await f.down();c.tick(.2,{settled:true,deviceReady:true});
  c.tick(30,{active:false,settled:true,deviceReady:true,reduced:true});await flush();
  assert.equal(c.contact,null);assert.ok(!c.startup);assert.equal(c.snapshot.state.scanned,false);
  stepUntil(c,()=>!c.startup,{deviceHidden:true,reduced:true});
  for(let i=0;i<30;i++)c.tick(.1,{settled:true,deviceReady:true,reduced:true});
  assert.equal(c.phase,'palm');assert.equal(c.snapshot.state.status,'scan');
 }finally{await f.close();}
});

test('confirmed startup pauses without consuming motion time; reduced motion keeps all readiness barriers',async()=>{
 const f=await fixture(),c=f.c;
 try{
  await f.down();await f.confirm();
  for(const stage of ['shell','row','trace','fan','content']){
   stepUntil(c,()=>c.startup?.stage===stage,{reduced:true});
   const before=JSON.stringify({stage:c.startup.stage,paths:c.paths?.elapsed,logo:c.startupContentPresence,phone:c.phone,key:c.phoneContentKey,link:c.deviceLinkReveal});
   c.tick(30,{active:false,settled:true,deviceReady:true,reduced:true});
   assert.equal(JSON.stringify({stage:c.startup.stage,paths:c.paths?.elapsed,logo:c.startupContentPresence,phone:c.phone,key:c.phoneContentKey,link:c.deviceLinkReveal}),before);
  }
  c.tick(.1,{settled:true,deviceReady:false,reduced:true});assert.equal(c.startup.stage,'content');
  c.tick(.1,{settled:true,deviceReady:true,reduced:true});assert.equal(c.phase,'task');
 }finally{await f.close();}
});
