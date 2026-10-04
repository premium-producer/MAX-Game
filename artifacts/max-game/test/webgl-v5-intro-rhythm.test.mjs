import test from 'node:test';
import assert from 'node:assert/strict';
import {V5RevealJourney} from '../src/journey-v5-route-layout.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../src/journey-v5-backend.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
import {V5DeviceMorph} from '../src/journey-v5-device-morph.mjs';
import {IconMotion} from '../src/journey-motion.mjs';
import {enableV5Inertia,V5_INERTIA} from '../src/journey-v5-inertia.mjs';

// Measured-centre contract fixture; native Flexbox rendering is not simulated.
function rowCentres(nodes,active,device,nodeWidth){
 let x=0,phoneX;const centres={};
 for(const node of nodes){
  centres[node.step]={x:x+nodeWidth/2,y:0};x+=nodeWidth+400;
  if(node===active){phoneX=x+device.width/2;x+=device.width+400;}
 }
 return Object.fromEntries(Object.entries(centres).map(([id,p])=>[id,{x:p.x-phoneX,y:p.y}]));
}
async function fixture(mission){
 let now=1000,c;
 const app=createApp({persistence:createMemoryPersistencePort(),now:()=>now});
 const session=createWebGLSession({catalog,port:app,sessionId:`intro-${mission}`,onSnapshot:s=>c?.accept(s),onError:assert.fail});
 await session.start();c=new V5RevealJourney(sharedRevealContent(catalog),session,rowCentres);c.configure(1760,1024,256);
 await session.command('SELECT_MISSION',{missionId:mission});await session.contact('hand','down',true);now+=800;await session.contact('hand','up',true);
 assert.equal(c.phase,'arrange');assert.equal(c.startup.stage,'shell');
 c.tick(1/60,{deviceReady:true,deviceShown:true});assert.equal(c.startup.stage,'row');
 return {c,close:async()=>{await session.close();await app.close();}};
}
const poses=c=>c.nodes.map(n=>{const p=c.pose(n);return {worldX:p.worldX,worldY:p.worldY};});

for(const mission of Object.keys(catalog.missions))test(`${mission}: sequential startup uses the displayed device width at every stage`,async()=>{
 const f=await fixture(mission),c=f.c;
 try{
  const arranged=c.nodes.map(n=>{const p=c.rowPose(n);return {worldX:p.worldX,worldY:p.worldY};}),phone={...c.phone};
  assert.equal(c.spread,true,'camera must already select its device-centred target during arrange');
  assert.equal(c.phoneVisible,true,'phone exists before the first icon arrives');assert.equal(c.startupLogo,true);
  const stages=[];
  for(let i=0;i<120&&c.phase!=='task';i++){
   // Reduced-motion renderer has completed the content morph before ready.
   if(c.startup?.stage==='content')c.presentedDevice={...c.targetPhoneMetrics};
   const expected=c.nodes.map(n=>{const p=c.rowPose(n);return {worldX:p.worldX,worldY:p.worldY};});
   c.tick(1/60,{settled:true,deviceReady:true,deviceShown:true,reduced:true});stages.push(c.phase);
   assert.deepEqual(poses(c),expected,`${c.phase} follows the displayed width`);assert.deepEqual(c.phone,phone);
   if(c.startupLogo)assert.deepEqual(poses(c),arranged,'no advance PC reservation while the logo is visible');
  }
  assert.equal(c.phase,'task');assert.ok(stages.includes('trace'));assert.ok(stages.includes('phone-enter'));
  const row=c.nodes.map(n=>({x:c.pose(n).worldX,width:256}));row.push({x:phone.x,width:c.phoneMetrics.width});row.sort((a,b)=>a.x-b.x);
  for(let i=1;i<row.length;i++)assert.ok(Math.abs(row[i].x-row[i].width/2-row[i-1].x-row[i-1].width/2-400)<.001);
  for(const p of arranged)assert.equal(p.worldY-100,phone.y);
 }finally{await f.close();}
});

for(const hz of [30,60,120])test(`real IconMotion settles sequentially into the startup row ${hz}Hz before trace`,async()=>{
 const f=await fixture('communication'),c=f.c;
 try{
  const motions=c.nodes.map((n,i)=>{const p=c.pose(n);return enableV5Inertia(new IconMotion({x:p.worldX,y:p.worldY,size:256,radius:67,phase:i}));});
  const goals=c.nodes.map(n=>{const p=c.rowPose(n);return {worldX:p.worldX,worldY:p.worldY};}),retained=motions.map(m=>[m.x.value,m.y.value]);
  assert.deepEqual(motions.map(m=>[m.x.value,m.y.value]),retained);
  const before=[c.phase,c.elapsed,...poses(c)];c.tick(10,{active:false,settled:true});assert.deepEqual([c.phase,c.elapsed,...poses(c)],before);
  let frames=0;
  for(;frames<hz*8&&c.phase==='arrange';frames++){
   const targets=poses(c);
   motions.forEach((m,i)=>m.step(1/hz,{x:targets[i].worldX,y:targets[i].worldY,size:256,radius:67,movementOmega:V5_INERTIA.iconsOmega,time:frames/hz}));
   const settled=motions.every(m=>!m.connectionsMoving&&m.alpha.value>.995);
   c.tick(1/hz,{active:true,settled,deviceReady:true,deviceShown:true});
  }
  assert.equal(c.phase,'trace','actual motion must finish within the bounded test clock');
  assert.deepEqual(poses(c),goals,'trace must retain the already reached targets');
  motions.forEach((m,i)=>assert.ok(Math.hypot(m.x.value-goals[i].worldX,m.y.value-goals[i].worldY)<2));
  assert.equal(c.phoneVisible,true);assert.equal(c.startupLogo,true);assert.equal(c.deviceLinkPresence,0);
 }finally{await f.close();}
});


for(const hz of [30,60,120])test(`business ${hz}Hz: MAX splash uses its actual width; row expands only with the device`,async()=>{
 const f=await fixture('business'),c=f.c;
 const checkGaps=()=>{
  const row=c.nodes.map(n=>({x:c.pose(n).worldX,width:256}));row.push({x:c.phone.x,width:c.phoneMetrics.width});row.sort((a,b)=>a.x-b.x);
  for(let i=1;i<row.length;i++)assert.ok(Math.abs(row[i].x-row[i].width/2-row[i-1].x-row[i-1].width/2-400)<.001,'400px measured gap follows displayed shell, never the future PC');
 };
 try{
  for(let i=0;i<20&&c.startup.stage!=='content';i++)c.tick(1/hz,{settled:true,deviceReady:true,deviceShown:true,reduced:true});
  assert.equal(c.startup.stage,'content');assert.equal(c.paths,null);
  assert.equal(c.phoneMetrics.width,392);assert.ok(c.targetPhoneMetrics.width>900);checkGaps();
  const phone={...c.phone},initial=poses(c),morph=new V5DeviceMorph();let commits=0,previous=initial,previousWidth=c.phoneMetrics.width;
  morph.start(()=>commits++,false,{from:c.phoneMetrics.width,to:c.targetPhoneMetrics.width,resize:width=>{c.presentedDevice={...c.targetPhoneMetrics,width};},ready:()=>true});
  for(let i=0;i<hz*8&&morph.busy;i++){
   const phase=morph.phase;morph.tick(1/hz);const next=poses(c);checkGaps();
   assert.deepEqual(c.phone,phone);assert.equal(c.phoneMetrics.height,800);
   if(phase==='out')assert.deepEqual(next,initial,'logo fade alone cannot move icons');
   const widthDelta=c.phoneMetrics.width-previousWidth;
   assert.ok(widthDelta>=0,'expansion cannot reverse');
   next.forEach((p,j)=>{
    const delta=p.worldX-previous[j].worldX,side=Math.sign(initial[j].worldX-phone.x);
    assert.ok(Math.abs(delta-side*widthDelta/2)<.001,'each row target follows the actual shell edge without an independent jump');
   });
   c.tick(1/hz,{settled:true,deviceReady:!morph.busy,busy:morph.busy});previous=next;previousWidth=c.phoneMetrics.width;
  }
  assert.equal(morph.busy,false);assert.equal(commits,1);assert.equal(c.phase,'task');checkGaps();
  assert.ok(poses(c)[0].worldX<initial[0].worldX);assert.ok(poses(c).at(-1).worldX>initial.at(-1).worldX);
 }finally{await f.close();}
});
