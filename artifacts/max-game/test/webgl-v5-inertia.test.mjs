import test from 'node:test';
import assert from 'node:assert/strict';
import {IconMotion,MotionValue} from '../src/journey-motion.mjs';
import {V5MotionValue,V5_INERTIA,enableV5Inertia,v5InstructionLeft,v5InstructionTop,v5IconWorldPoint} from '../src/journey-v5-inertia.mjs';
import {scenePose,projectBounds} from '../src/journey-scene-pose.mjs';
import {guidedIconGeometry} from '../src/journey-icon-scale.mjs';
import fs from 'node:fs';

test('actual maath damping converges without overshoot at 30/60/120Hz',()=>{
 const samples=[];
 for(const hz of [30,60,120]){
  const m=new V5MotionValue(0);let prior=0,halfway;
  for(let i=0;i<hz*3;i++){
   m.step(600,1/hz,V5_INERTIA.iconsOmega);
   assert.ok(m.value>=prior&&m.value<=600);
   if(i===hz/2-1)halfway=m.value;
   prior=m.value;
  }
  assert.ok(m.at(600));samples.push(halfway);
 }
 assert.ok(Math.max(...samples)-Math.min(...samples)<1,'half-second pose stable across frame rates');
});

test('retarget and retained owner preserve position and velocity; release eases out',()=>{
 const m=enableV5Inertia(new IconMotion({x:0,y:10,size:256,radius:68}));
 for(let i=0;i<12;i++)m.x.step(400,1/60,V5_INERTIA.iconsOmega);
 const before={value:m.x.value,velocity:m.x.velocity},owner=m.x;
 enableV5Inertia(m);assert.equal(m.x,owner);assert.equal(m.x.value,before.value);assert.equal(m.x.velocity,before.velocity);
 m.x.step(800,1/60,V5_INERTIA.iconsOmega);
 assert.ok(m.x.value>before.value&&m.x.value<800);
 assert.ok(m.x.velocity>0);
 let tail;
 for(let i=0;i<180;i++){m.x.step(800,1/60,V5_INERTIA.iconsOmega);if(i===40)tail=m.x.velocity;}
 assert.ok(tail>0);assert.ok(m.x.velocity<tail&&m.x.at(800));
});

test('phone filtering has short lag, continues after release and supports recapture',()=>{
 const p=new V5MotionValue(200);p.step(500,1/60,V5_INERTIA.phoneOmega);
 assert.ok(p.value>200&&p.value<250,'pointer event is not a teleport');
 for(let i=0;i<10;i++)p.step(500,1/60,V5_INERTIA.phoneOmega);
 const actual=p.value,velocity=p.velocity;
 const recaptureTarget=actual+20;
 assert.equal(p.value,actual);assert.equal(p.velocity,velocity);
 p.step(recaptureTarget,1/60,V5_INERTIA.phoneOmega);
 assert.ok(p.value>actual&&p.value<=recaptureTarget);
 for(let i=0;i<120;i++)p.step(recaptureTarget,1/60,V5_INERTIA.phoneOmega);
 assert.ok(p.at(recaptureTarget));
});

test('pause/reduced motion and epsilon clear stale velocity',()=>{
 const p=new V5MotionValue(0);p.step(100,1/60,14);
 const before={value:p.value,velocity:p.velocity};
 for(let i=0;i<120;i++)p.step(300,0,14);
 assert.equal(p.value,before.value);assert.equal(p.velocity,before.velocity);
 p.step(400,0,14,true);assert.equal(p.value,400);assert.equal(p.velocity,0);assert.equal(p.__damp.velocity_value,0);
 p.velocity=100;p.step(400.00001,1/60,14);assert.equal(p.velocity,0);assert.equal(p.__damp.velocity_value,0);
 p.step(400.00001,1/60,14);assert.equal(p.value,400.00001);
});

test('existing icon engine uses slower retained X/Y, display and readiness share one owner',()=>{
 const m=enableV5Inertia(new IconMotion({x:0,y:0,size:256,radius:68}));
 const initial=new MotionValue(30);initial.velocity=150;
 const migrating={x:initial,y:new MotionValue(20)};enableV5Inertia(migrating);
 assert.equal(migrating.x.value,30);assert.equal(migrating.x.velocity,150);
 const target={x:600,y:0,size:256,radius:68,movementOmega:V5_INERTIA.iconsOmega,reduced:false,time:0};
 for(let i=0;i<12;i++)m.step(1/60,target);
 assert.ok(m.x.value>200&&m.x.value<450,'shared travel cadence stays gradual at 200ms');
 assert.ok(!m.x.at(600));
 for(let i=0;i<240;i++)m.step(1/60,target);
 assert.ok(m.x.at(600));assert.equal(m.x instanceof V5MotionValue,true);
});

test('information card projects from actual filtered phone with constant gap',()=>{
 const phone=new V5MotionValue(500),camera=120,width=360;
 for(let i=0;i<20;i++){
  phone.step(800,1/60,14);
  const phoneRight=phone.value-camera+width/2;
  assert.equal(v5InstructionLeft(phone.value,camera,width)-phoneRight,64);
 }
 assert.equal(v5InstructionTop(440),'calc(var(--guided-device-center-y, 50%) - 220px)');
});

test('captured icon stays at its visible pose before threshold, including hover size and idle bob',()=>{
 const m=enableV5Inertia(new IconMotion({x:200,y:80,size:256,radius:68,phase:1}));
 const target={x:200,y:80,size:256,radius:68,hover:true,time:0,movementOmega:V5_INERTIA.iconsOmega};
 for(let i=0;i<90;i++)m.step(1/60,{...target,time:i/60});
 const before={x:m.x.value,y:m.y.value,size:m.size.value,vx:m.x.velocity,vy:m.y.velocity};
 assert.deepEqual(m.captureDrag(),{x:before.x,y:before.y});
 for(let i=0;i<60;i++)m.step(1/60,{...target,time:2+i/60});
 assert.equal(m.x.value,before.x);assert.equal(m.y.value,before.y);assert.equal(m.size.value,before.size);
 assert.equal(m.x.velocity,before.vx);assert.equal(m.y.velocity,before.vy);
 m.releaseDrag();m.step(1/60,{...target,time:4});assert.notEqual(m.y.value,before.y);
});

test('icon drag uses the identical phone maath response at 30/60/120Hz, without bob or capture scaling',()=>{
 for(const hz of [30,60,120]){
  const icon=enableV5Inertia(new IconMotion({x:210,y:-90,size:260,radius:68}));
  const phoneX=new V5MotionValue(210),phoneY=new V5MotionValue(-90);
  icon.captureDrag();
  for(let i=0;i<hz;i++){
   const x=210+i*3,y=-90+i*2;
   icon.step(1/hz,{x,y,size:256,radius:68,dragging:true,hover:true,time:i/hz,
    dragOmega:V5_INERTIA.phoneOmega,movementOmega:V5_INERTIA.iconsOmega});
   phoneX.step(x,1/hz,V5_INERTIA.phoneOmega);phoneY.step(y,1/hz,V5_INERTIA.phoneOmega);
   assert.equal(icon.x.value,phoneX.value);assert.equal(icon.y.value,phoneY.value);assert.equal(icon.size.value,260);
  }
  const value=icon.x.value,velocity=icon.x.velocity;
  icon.releaseDrag();assert.equal(icon.x.value,value);assert.equal(icon.x.velocity,velocity);
  assert.deepEqual(icon.captureDrag(),{x:icon.x.value,y:icon.y.value});
 }
});

test('nested guided-field inset is counted once on capture and first movement, including lagging poses',()=>{
 const css=fs.readFileSync(new URL('../src/journey-guided.css',import.meta.url),'utf8');
 const fieldTop=Number(css.match(/\.guided-field\{inset:(\d+)px/)[1]);assert.equal(fieldTop,100);
 const height=952,camera=450,world={x:-220,y:-600},goal={worldX:-190,worldY:-570};
 const geometry=guidedIconGeometry(world.x,world.y,camera,height),targetGeometry=guidedIconGeometry(goal.worldX,goal.worldY,camera,height);
 const centre={x:geometry.left+128,y:fieldTop+geometry.top+128};
 const targetCentre={x:targetGeometry.left+128,y:fieldTop+targetGeometry.top+128};
 const offset={x:centre.x-targetCentre.x,y:centre.y-targetCentre.y};
 const m=enableV5Inertia(new IconMotion({...centre,size:261,radius:68}));m.captureDrag();
 const layout={hostX:53,hostY:127,cx:128,cy:128,size:256};
 const pose=scenePose(layout,m,256,348),tile=projectBounds({x:0,y:0,w:256,h:256},pose);
 assert.equal(tile.x+tile.w/2-layout.hostX,m.x.value);
 assert.equal(tile.y+tile.h/2-layout.hostY,m.y.value);
 assert.equal(centre.y-height/2+100,world.y+100,'previous inverse added the nested field offset twice');
 assert.deepEqual(v5IconWorldPoint(offset,goal),world);
 const target=v5IconWorldPoint(offset,goal);target.y+=8;
 // Previous reveal clamp jumps this valid outside-field drag by 244px.
 const oldClamp=Math.max(128-height/2,Math.min(height/2-128,target.y));
 assert.equal(oldClamp-target.y,244);
 const nextCentre={x:target.x-camera,y:fieldTop+height/2-100+target.y};
 m.step(1/60,{...nextCentre,size:256,radius:68,dragging:true,dragOmega:V5_INERTIA.phoneOmega});
 assert.ok(m.y.value>centre.y&&m.y.value<centre.y+8);
 assert.equal(m.x.value,centre.x);
});
