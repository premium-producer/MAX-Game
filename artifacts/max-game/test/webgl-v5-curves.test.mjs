import test from 'node:test';
import assert from 'node:assert/strict';
import {V5RevealJourney} from '../src/journey-v5-route-layout.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../src/journey-v5-backend.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
import {IconMotion} from '../src/journey-motion.mjs';
import {enableV5Inertia,V5_INERTIA} from '../src/journey-v5-inertia.mjs';

// Native CSS Flexbox supplies these measured centres in the renderer.
function rowCentres(nodes,active,device,nodeWidth){
 let x=0,phoneX;const centres={};
 for(const node of nodes){centres[node.step]={x:x+nodeWidth/2,y:0};x+=nodeWidth+400;if(node===active){phoneX=x+device.width/2;x+=device.width+400;}}
 return Object.fromEntries(Object.entries(centres).map(([id,p])=>[id,{x:p.x-phoneX,y:p.y}]));
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(mission='communication'){
 let now=1000,c;const app=createApp({persistence:createMemoryPersistencePort(),now:()=>now});
 const session=createWebGLSession({catalog,port:app,sessionId:'curves',onSnapshot:s=>c?.accept(s),onError:assert.fail});
 await session.start();c=new V5RevealJourney(sharedRevealContent(catalog),session,rowCentres);c.configure(1760,1024,256);
 await session.command('SELECT_MISSION',{missionId:mission});await session.contact('hand','down',true);now+=800;await session.contact('hand','up',true);
 return {c,session,advanceResult:async()=>{now+=1000;await app.pollTime('curves');},close:async()=>{await session.close();await app.close();}};
}
const poses=c=>c.nodes.map(n=>{const p=c.pose(n);return {x:p.worldX,y:p.worldY};});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

for(const hz of [30,60,120])test(`v5 ${hz}Hz: startup takes short vertical staggered paths directly into the working row`,async()=>{
 const f=await fixture(),c=f.c;
 try{
  assert.equal(c.phase,'arrange');assert.equal(c.startupLogo,true);assert.equal(c.phoneVisible,true);
  const samples=[poses(c)];let frames=0;
  while(c.phase==='arrange'&&frames<hz*8){c.tick(1/hz,{active:true,settled:true,deviceReady:true,deviceShown:true});samples.push(poses(c));frames++;}
  assert.equal(c.phase,'trace');const starts=samples[0],ends=samples.at(-1);
  const launchFrames=starts.map((p,i)=>samples.findIndex(s=>distance(s[i],p)>1));
  for(let i=1;i<launchFrames.length;i++)assert.ok(launchFrames[i]-launchFrames[i-1]>=hz*.04,`icon ${i} needs a visible stagger`);
  starts.forEach((start,i)=>{
   assert.ok(Math.abs(distance(start,ends[i])-64)<.001,'each icon arrives through the short 64px vertical path');
   assert.ok(samples.every(s=>Math.abs(s[i].x-start.x)<.001),`icon ${i} keeps its final row X throughout startup`);
  });
  assert.ok(frames/hz>.8,'settled:true must not bypass sequential arrival');
 }finally{await f.close();}
});

for(const hz of [30,60,120])test(`v5 ${hz}Hz: actual IconMotion finishes repacking without pose or velocity reset`,async()=>{
 const f=await fixture('blogger'),c=f.c;
 try{
  for(let i=0;i<20&&c.phase!=='task';i++)c.tick(.1,{settled:true,deviceReady:true,deviceShown:true,reduced:true});
  for(let i=0;i<30&&f.session.snapshot.state.status!=='result';i++){
   const action=c.descriptor.actions.find(a=>a.actionId==='channel.continue-private')??c.descriptor.actions[0];
   assert.equal(c.answer(action.actionId),true);await flush();
  }
  assert.equal(f.session.snapshot.state.status,'result');
  const motions=new Map(c.nodes.map((n,i)=>{const p=c.pose(n);return [n.step,enableV5Inertia(new IconMotion({x:p.worldX,y:p.worldY,size:256,radius:67,phase:i}))];}));
  c.readMotionPose=n=>{const m=motions.get(n.step);return {worldX:m.x.value,worldY:m.y.value};};
  const state=()=>[...motions.values()].map(m=>[m.x.value,m.y.value,m.x.velocity,m.y.velocity]);
  const before=state();await f.advanceResult();
  for(let i=0;i<120&&c.handoff.stage!=='pack';i++)c.tick(1/hz,{settled:true,deviceHidden:true,deviceReady:true,deviceShown:true});
  assert.equal(c.handoff.stage,'pack');assert.deepEqual(state(),before,'entering pack must retain the visible state');
  let frames=0,peakSpeed=0;
  while(c.handoff.stage==='pack'&&frames<hz*8){
   for(const node of c.nodes){
    const target=c.pose(node),m=motions.get(node.step),from={x:m.x.value,y:m.y.value};
    m.step(1/hz,{x:target.worldX,y:target.worldY,size:256,radius:67,movementOmega:V5_INERTIA.iconsOmega,time:frames/hz});
    const step=distance(from,{x:m.x.value,y:m.y.value});peakSpeed=Math.max(peakSpeed,step*hz);
    assert.ok(step<2200/hz,`bounded frame displacement: ${step}px at ${hz}Hz`);
   }
   const retained=state(),settled=[...motions.values()].every(m=>!m.intro&&!m.connectionsMoving&&m.alpha.value>.995);
   c.tick(1/hz,{settled,deviceHidden:true,deviceReady:true,deviceShown:true});
   assert.deepEqual(state(),retained,'controller target/phase changes must never overwrite retained position or velocity');
   frames++;
  }
  assert.equal(c.handoff.stage,'trace');assert.ok(frames/hz>1.3&&frames/hz<8);assert.ok(peakSpeed>100,'fixture must exercise real motion');
  for(const node of c.nodes){const target=c.pose(node),m=motions.get(node.step);assert.ok(distance({x:m.x.value,y:m.y.value},{x:target.worldX,y:target.worldY})<2,'trace waits for the visible centre');}
 }finally{await f.close();}
});

test('v5 startup freezes on pause; reduced motion resolves the row; restart cancels it',async()=>{
 const f=await fixture(),c=f.c;
 try{
  for(let i=0;i<12;i++)c.tick(1/60,{settled:false,deviceReady:true,deviceShown:true});
  const frozen=poses(c);
  for(const options of [{active:false},{dragging:true},{busy:true}]){
   c.tick(10,{...options,settled:true});assert.deepEqual(poses(c),frozen);assert.equal(c.phase,'arrange');
  }
  c.tick(1/60,{settled:true,deviceReady:true,deviceShown:true,reduced:true});assert.equal(c.phase,'trace');
  await c.restart();assert.equal(c.phase,'palm');assert.equal(c.handoff,null);
  for(let i=0;i<120;i++)c.tick(1/60,{settled:true,deviceReady:true,deviceShown:true,deviceHidden:true});
  assert.equal(c.phase,'palm');assert.equal(c.snapshot.state.status,'scan');
 }finally{await f.close();}
});

for(const hz of [30,60,120])test(`v5 ${hz}Hz: confirmed next task eases into position before its link appears`,async()=>{
 const f=await fixture('blogger'),c=f.c;
 try{
  for(let i=0;i<20&&c.phase!=='task';i++)c.tick(.1,{settled:true,deviceReady:true,deviceShown:true,reduced:true});
  assert.equal(c.phase,'task');
  for(let i=0;i<30&&f.session.snapshot.state.status!=='result';i++){
   const action=c.descriptor.actions.find(a=>a.actionId==='channel.continue-private')??c.descriptor.actions[0];
   assert.equal(c.answer(action.actionId),true);await flush();
  }
  assert.equal(f.session.snapshot.state.status,'result');await f.advanceResult();assert.equal(c.handoff.stage,'unlink');
  for(let i=0;i<120&&c.handoff.stage!=='pack';i++)c.tick(1/hz,{settled:true,deviceHidden:true,deviceReady:true,deviceShown:true});
  assert.equal(c.handoff.stage,'pack');assert.equal(c.activeId,'blogger.comments');
  const index=c.nodes.findIndex(n=>n.step===c.activeId),samples=[poses(c)];let frames=0;
  const frozen=poses(c);
  for(const options of [{active:false},{dragging:true},{busy:true}]){
   c.tick(10,{...options,settled:true});assert.deepEqual(poses(c),frozen);assert.equal(c.handoff.stage,'pack');
  }
  while(c.handoff.stage==='pack'&&frames<hz*8){
   assert.ok(!c.edges().some(e=>e.b===c.activeId),'incoming link stays absent during repacking');
   c.tick(1/hz,{settled:true,deviceHidden:true,deviceReady:true,deviceShown:true});samples.push(poses(c));frames++;
  }
  assert.equal(c.handoff.stage,'trace');assert.ok(frames/hz>.8,'next-task movement must not collapse to one frame');
  const points=samples.map(s=>s[index]),length=distance(points[0],points.at(-1));assert.ok(length>100);
  const speeds=points.slice(1).map((p,i)=>distance(p,points[i])*hz),peak=Math.max(...speeds);
  const window=Math.max(1,Math.floor(hz*.1));
  assert.ok(Math.max(...speeds.slice(0,window))<peak*.5,'next icon starts gently');
  assert.ok(Math.max(...speeds.slice(-window))<peak*.5,'next icon brakes gently');
  const final=poses(c);c.tick(1/hz,{settled:true,deviceReady:true,deviceShown:true});assert.deepEqual(poses(c),final,'tracing must retain the reached row');
 }finally{await f.close();}
});
