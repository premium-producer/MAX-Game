import test from 'node:test';
import assert from 'node:assert/strict';
import {Hold,restore,missions,fitScene,SCENE,WALL_SCENE,WALL_GAME,WALL_MOVE,WALL_INPUT,WALL_ROUTE,SITE_ROUTE_MOTION,ROUTE_LINK_STAGGER,PHONE_FIBER_COUNT,PHONE_FIBER_STAGGER,PHONE_FIBER_DURATION,visibleRouteLinkCount,wallLinePositions,clampNodeToField,planPhoneInsertion,translatePhonePlan,routeIdleOffset,clampPhonePose,phoneFiberPorts,phoneFiberReveal} from '../public/site-game/model.mjs';
import {INTERACTION_BAND,zonesForLayout} from '../src/circle-model.mjs';
import * as originalReveal from '../src/journey-guided-reveal.mjs';
import * as siteReveal from '../public/site-game/site-reveal-motion.mjs';
import {IconMotion,MOTION} from '../public/site-game/original/journey-motion.mjs';
import {JOURNEY_LINK_STYLE,tileEdgeCurve,sampleTileEdgeCurve} from '../public/site-game/original/journey-links.mjs';
import {JOURNEY_LINK_STYLE as originalLinkStyle} from '../src/journey-links.mjs';
import {readFileSync} from 'node:fs';
test('hold belongs to one contact; early release and cancellation allow retry',()=>{const h=new Hold();assert.equal(h.down(1,100),true);assert.equal(h.down(2,200),false);assert.equal(h.progress(500),.5);h.release(2);assert.equal(h.progress(500),.5);h.release(1);assert.equal(h.progress(900),0);assert.equal(h.down(2,900),true);assert.equal(h.progress(1700),1);h.cancel();assert.equal(h.progress(2000),0);});
test('only isolated scanned save can restore',()=>{assert.equal(missions.length,6);assert.equal(restore('{'),null);assert.equal(restore(JSON.stringify({version:1,mission:'bad',scanned:true})),null);assert.deepEqual(restore(JSON.stringify({version:1,mission:'blogger',scanned:true})),{mission:'blogger',scanned:true});assert.equal(restore(JSON.stringify({version:1,mission:'blogger',scanned:false})),null);});
test('whole fixed scene fits desktop, portrait and wall viewports without overflow',()=>{for(const [width,height] of [[1600,900],[1366,768],[1920,1080],[390,844],[4096,1280]]){const {scale,x,y}=fitScene(width,height);assert.ok(scale>0);assert.ok(x>=-1e-6&&y>=-1e-6);assert.ok(x+SCENE.width*scale<=width+1e-6);assert.ok(y+SCENE.height*scale<=height+1e-6);}});
test('manual route pose can leave the game frame horizontally and restores only valid positions',()=>{
 assert.deepEqual(clampNodeToField(0,0,WALL_GAME),{x:2384,y:307});
 assert.deepEqual(clampNodeToField(9999,9999,WALL_GAME),{x:3904,y:1101});
 assert.deepEqual(clampNodeToField(0,815,WALL_MOVE),{x:120,y:815});
 assert.deepEqual(clampNodeToField(4096,815,WALL_MOVE),{x:3976,y:815});
 const saved=restore(JSON.stringify({version:1,mission:'blogger',scanned:true,layout:'wall',positions:{1:{x:2500,y:800},2:{x:'bad',y:700}}}));
 assert.deepEqual(saved,{mission:'blogger',scanned:true,layout:'wall',positions:{1:{x:2500,y:800}}});
});
test('full right-wall mode uses measured input band and a 400px phone slot',()=>{
 const zone=zonesForLayout('single')[0];
 assert.deepEqual(WALL_SCENE,{width:4096,height:1280});
 assert.deepEqual(WALL_GAME,{left:zone.left,right:zone.left+zone.w,top:zone.top,bottom:zone.top+zone.h});
 assert.deepEqual(WALL_INPUT,{left:zone.left,right:zone.left+zone.w,top:INTERACTION_BAND.top,bottom:INTERACTION_BAND.bottom});
 assert.ok(WALL_GAME.top<WALL_INPUT.top&&WALL_GAME.bottom>WALL_INPUT.bottom);
 for(const m of missions){const xs=wallLinePositions(m.steps.length+1);assert.equal(xs.length,m.steps.length+1);assert.ok(xs[0]-120>=0,m.id);assert.ok(xs[1]-120>=WALL_INPUT.left,m.id);assert.equal(xs[1],(WALL_GAME.left+WALL_GAME.right)/2-400,m.id);assert.ok(xs.every((x,i)=>i===0||x-xs[i-1]===400),m.id);}
 assert.ok(WALL_ROUTE.centerX>=WALL_INPUT.left&&WALL_ROUTE.centerX<=WALL_INPUT.right);
 for(const [w,h] of [[4096,1280],[1920,1080],[1366,768]]){const {scale,x,y}=fitScene(w,h,WALL_SCENE);assert.ok(scale>0&&x>=0&&y>=0);assert.ok(x+WALL_SCENE.width*scale<=w+1e-6);assert.ok(y+WALL_SCENE.height*scale<=h+1e-6);}
});

test('local reveal uses the original MAX timing, ring and arc geometry',()=>{assert.equal(siteReveal.REVEAL_TIMING.firstFollow,originalReveal.REVEAL_TIMING.firstFollow);assert.equal(siteReveal.REVEAL_MOTION.fieldOmega,originalReveal.REVEAL_MOTION.fieldOmega);for(const count of [3,4,5,6]){assert.equal(siteReveal.revealBurstDuration(count),originalReveal.revealBurstDuration(count));for(let i=0;i<count;i++){assert.deepEqual(siteReveal.revealRing(i,count,SCENE.width),originalReveal.revealRing(i,count,SCENE.width));assert.deepEqual(siteReveal.revealLaunchPoint(i,count,SCENE.width),originalReveal.revealLaunchPoint(i,count,SCENE.width));for(const t of [0,.15,.5,.85,1]){const start=siteReveal.revealRing(i,count,SCENE.width),end={worldX:100+i*280,worldY:0};assert.deepEqual(siteReveal.revealArc(start,end,t),originalReveal.revealArc(start,end,t));if(i===0)assert.deepEqual(siteReveal.revealMaxArc(start,end,t),originalReveal.revealMaxArc(start,end,t));}}}});
test('original motion and fiber sources are copied without edits',()=>{for(const name of ['journey-motion.mjs','journey-links.mjs'])assert.equal(readFileSync(new URL(`../public/site-game/original/${name}`,import.meta.url),'utf8'),readFileSync(new URL(`../src/${name}`,import.meta.url),'utf8'));assert.deepEqual(JOURNEY_LINK_STYLE,originalLinkStyle);assert.equal(JOURNEY_LINK_STYLE.strandCount,5);assert.equal(JOURNEY_LINK_STYLE.segmentCount,80);assert.equal(JOURNEY_LINK_STYLE.particleCount,32);});
test('motion owner stays stable at 30, 60 and 120 Hz',()=>{const poses=[];for(const hz of [30,60,120]){const motion=new IconMotion({x:0,y:0,size:240,radius:32});for(let i=0;i<hz;i++)motion.step(1/hz,{x:320,y:-80,size:240,radius:32,expanded:true,movementOmega:siteReveal.REVEAL_MOTION.fieldOmega,time:i/hz});poses.push([motion.x.value,motion.y.value,motion.x.velocity]);}for(let i=1;i<poses.length;i++)for(let j=0;j<3;j++)assert.ok(Math.abs(poses[i][j]-poses[0][j])<.001);});
test('drag follows through IconMotion, preserves velocity on release and regrab at 30/60/120 Hz',()=>{
 const poses=[];
 for(const hz of [30,60,120]){
  const motion=new IconMotion({x:0,y:0,size:240,radius:32});motion.press();
  for(let i=0;i<hz/10;i++)motion.step(1/hz,{x:360,y:0,size:240,radius:32,dragging:true,expanded:false});
  const held=motion.x.value,velocity=motion.x.velocity;
  assert.ok(held>0&&held<360&&velocity>0&&motion.size.value>240);
  for(let i=0;i<hz/2;i++)motion.step(1/hz,{x:360,y:0,size:240,radius:32,expanded:true,movementOmega:MOTION.route});
  assert.ok(motion.x.at(360,12,160));
  const before=motion.x.value;motion.press();motion.step(1/hz,{x:before+40,y:0,size:240,radius:32,dragging:true,expanded:false});
  assert.ok(motion.x.value<before+40&&motion.x.velocity!==0);
  poses.push([held,velocity]);
 }
 for(let i=1;i<poses.length;i++)for(let j=0;j<2;j++)assert.ok(Math.abs(poses[i][j]-poses[0][j])<.001);
 const reduced=new IconMotion({x:0,y:0,size:240,radius:32});reduced.step(1/60,{x:360,y:0,size:240,radius:32,dragging:true,reduced:true});assert.equal(reduced.x.value,360);
});
test('all six missions leave a port gap for the original curved fiber',()=>{for(const mission of missions){const count=mission.steps.length+1,spacing=Math.min(300,Math.max(180,(SCENE.width-260)/(count-1)));assert.ok(spacing>240,mission.id);const curve=tileEdgeCurve({x:0,y:0,w:240,h:230},{x:spacing,y:0,w:240,h:230});const a=sampleTileEdgeCurve(curve,0),b=sampleTileEdgeCurve(curve,1);assert.ok(b.x-a.x>0,mission.id);}});
test('phone insertion keeps a 400px center gap on both sides in every mission',()=>{
 for(const mission of missions){const base=wallLinePositions(mission.steps.length+1).map(x=>({x,y:815})),saved=structuredClone(base);
  for(let active=1;active<base.length;active++){const plan=planPhoneInsertion(base,active),right=plan.left+370;
   assert.equal(plan.left+185,(WALL_GAME.left+WALL_GAME.right)/2,`${mission.id}:${active}:center`);
   assert.deepEqual(base,saved,`${mission.id}:${active}:base`);
   assert.deepEqual(plan.shiftedIndices,base.map((_,i)=>i).slice(2),`${mission.id}:${active}:suffix`);
   assert.equal(plan.left+185-plan.positions[1].x,400,`${mission.id}:${active}:left-gap`);
   assert.equal(plan.positions[2].x-(plan.left+185),400,`${mission.id}:${active}:right-gap`);
   for(let i=0;i<base.length;i++){const p=plan.positions[i];if(i<2)assert.deepEqual(p,base[i],`${mission.id}:${active}:${i}:static`);else assert.equal(p.x,base[i].x+400,`${mission.id}:${active}:${i}:shift`);assert.ok(p.x+120<=plan.left-32||p.x-120>=right+32,`${mission.id}:${active}:${i}:phone-gap`);}
   for(let i=0;i<base.length;i++)for(let j=i+1;j<base.length;j++){const a=plan.positions[i],b=plan.positions[j];assert.ok(Math.abs(a.y-b.y)>=230||Math.abs(a.x-b.x)>=240,`${mission.id}:${active}:${i}-${j}:overlap`);}
   const icon={x:plan.positions[active].x-120,y:700,w:240,h:230},device={x:plan.left,y:220,w:370,h:840},ports=phoneFiberPorts(icon,device,plan.side);
   assert.equal(ports.length,5);assert.equal(ports[0].end.y,device.y+84);assert.equal(ports[4].end.y,device.y+756);
   assert.ok(ports.every(p=>Number.isFinite(p.start.x)&&Number.isFinite(p.end.x)));
  }
 }
});
test('blogger future pair moves right; manually moved icon stays free',()=>{
 const base=wallLinePositions(4).map(x=>({x,y:815})),regular=planPhoneInsertion(base,1);
 assert.deepEqual(regular.positions.map(p=>p.x),[2344,2744,3544,3944]);
 assert.deepEqual(regular.shiftedIndices,[2,3]);
 assert.equal(regular.displacedIndex,2);
 assert.equal(regular.positions[2].y,815);
 assert.equal(regular.positions[3].x-regular.positions[2].x,base[3].x-base[2].x);
 assert.ok(regular.positions[2].x>base[2].x&&regular.positions[3].x>base[3].x);
 const dragged=base.map(p=>({...p}));dragged[1]={x:2020,y:980};
 const plan=planPhoneInsertion(dragged,1,WALL_GAME,370,{side:regular.side,manualIndices:[1]});
 assert.deepEqual(plan.positions[1],dragged[1]);
 assert.equal(plan.left,regular.left);assert.deepEqual(plan.positions[0],regular.positions[0]);
 assert.deepEqual(plan.positions.slice(2),regular.positions.slice(2));
 assert.deepEqual(dragged[0],base[0]);
 const manuallyPlaced=base.map(p=>({...p}));manuallyPlaced[2]={x:3700,y:960};
 const manualPlan=planPhoneInsertion(manuallyPlaced,1,WALL_GAME,370,{manualIndices:[2]});
 assert.deepEqual(manualPlan.positions[2],manuallyPlaced[2]);
 assert.equal(manualPlan.positions[3].x,base[3].x+400);
});
test('dragging the phone moves the row horizontally while its Y stays anchored',()=>{
 const base=wallLinePositions(4).map(x=>({x,y:815})),plan=planPhoneInsertion(base,1),shift={x:-520,y:145};
 const moved=translatePhonePlan(plan,shift);
 assert.equal(moved.left-plan.left,shift.x);
 for(let i=0;i<base.length;i++)assert.deepEqual(moved.positions[i],{x:plan.positions[i].x+shift.x,y:plan.positions[i].y});
 assert.equal(moved.positions[1].x-moved.positions[0].x,plan.positions[1].x-plan.positions[0].x);
 assert.equal(moved.positions[2].x-(moved.left+185),plan.positions[2].x-(plan.left+185));
 assert.deepEqual(base,wallLinePositions(4).map(x=>({x,y:815})));
 assert.deepEqual(clampPhonePose(-100,140,370,800),{left:0,centerY:400});
 assert.deepEqual(clampPhonePose(4100,1180,370,800),{left:3726,centerY:880});
 const saved=restore(JSON.stringify({version:1,mission:'blogger',scanned:true,layout:'wall',positions:{},phoneShift:shift}));
 assert.deepEqual(saved.phoneShift,shift);
});
test('route idle offsets stay small and individual; slower followers retain velocity',()=>{
 const a=routeIdleOffset(2,0),b=routeIdleOffset(2,1);
 assert.notDeepEqual(a,b);
 for(const sample of [a,b,routeIdleOffset(9,3)]){assert.ok(Math.abs(sample.x)<=SITE_ROUTE_MOTION.idleX);assert.ok(Math.abs(sample.y)<=SITE_ROUTE_MOTION.idleY);}
 const phone=new IconMotion({x:0,y:0,size:240,radius:32}),card=new IconMotion({x:0,y:0,size:240,radius:32});
 for(let i=0;i<8;i++){phone.step(1/60,{x:240,y:0,size:240,radius:32,expanded:true,movementOmega:MOTION.drag});card.step(1/60,{x:240,y:0,size:240,radius:32,expanded:true,movementOmega:SITE_ROUTE_MOTION.phoneFollowOmega});}
 assert.ok(phone.x.value>card.x.value);
 const before=card.x.value,velocity=card.x.velocity;
 card.step(1/60,{x:240,y:0,size:240,radius:32,expanded:true,movementOmega:SITE_ROUTE_MOTION.phoneFollowOmega});
 assert.ok(card.x.value>before&&card.x.velocity>0&&velocity>0);
});
test('row links begin 200 ms apart; phone fibers begin 50 ms apart',()=>{
 assert.equal(ROUTE_LINK_STAGGER,.2);
 assert.equal(PHONE_FIBER_COUNT,5);
 assert.equal(PHONE_FIBER_STAGGER,.05);
 assert.equal(PHONE_FIBER_DURATION+(PHONE_FIBER_COUNT-1)*PHONE_FIBER_STAGGER,siteReveal.REVEAL_TIMING.trace);
 assert.equal(siteReveal.revealTracePresence((.19-ROUTE_LINK_STAGGER)/siteReveal.REVEAL_TIMING.trace),0);
 assert.ok(siteReveal.revealTracePresence((.21-ROUTE_LINK_STAGGER)/siteReveal.REVEAL_TIMING.trace)>0);
 for(let i=0;i<PHONE_FIBER_COUNT;i++){
  assert.equal(phoneFiberReveal(i*PHONE_FIBER_STAGGER,i),0);
  assert.ok(phoneFiberReveal(i*PHONE_FIBER_STAGGER+.02,i)>0);
  if(i<PHONE_FIBER_COUNT-1)assert.equal(phoneFiberReveal(i*PHONE_FIBER_STAGGER+.02,i+1),0);
  assert.ok(Math.abs(phoneFiberReveal(i*PHONE_FIBER_STAGGER+PHONE_FIBER_DURATION*.5,i)-siteReveal.revealTracePresence(.5))<1e-12);
  assert.equal(phoneFiberReveal(i*PHONE_FIBER_STAGGER+PHONE_FIBER_DURATION,i),1);
  assert.equal(phoneFiberReveal(0,i,true),1);
 }
 assert.equal(phoneFiberReveal(.09,2),0);
 assert.ok(phoneFiberReveal(siteReveal.REVEAL_TIMING.trace-.01,PHONE_FIBER_COUNT-1)<1);
 assert.equal(phoneFiberReveal(siteReveal.REVEAL_TIMING.trace,PHONE_FIBER_COUNT-1),1);
});
test('the opening row connects only MAX to the first task',()=>{
 for(const mission of missions){
  assert.equal(visibleRouteLinkCount(0,mission.steps.length),1,mission.id);
  assert.equal(visibleRouteLinkCount(1,mission.steps.length),Math.min(2,mission.steps.length),mission.id);
 }
 assert.equal(visibleRouteLinkCount(-1,4),0);
});
