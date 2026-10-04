import test from 'node:test';
import assert from 'node:assert/strict';
import {V5_MOTION} from '../src/journey-v5-motion-profile.mjs';
import {V5MotionValue,enableV5Inertia} from '../src/journey-v5-inertia.mjs';
import {IconMotion} from '../src/journey-motion.mjs';
import {V5DeviceMorph} from '../src/journey-v5-device-morph.mjs';
import {V5MissionContinuation} from '../src/journey-v5-mission-continuation.mjs';
import {JourneyTransition} from '../src/journey-transition.mjs';

for(const hz of [30,60,120])test(`common maath fade and balanced popup at ${hz}Hz`,()=>{
 const icon=enableV5Inertia(new IconMotion({x:0,y:0,size:256,radius:68}));
 const device=new V5MotionValue(1),morph=new V5DeviceMorph();morph.start(()=>{},false,{from:392,to:392});
 const mission=new V5MissionContinuation({commit:()=>{},reveal:()=>{},done:()=>{},error:assert.fail});mission.start();
 const popup=new JourneyTransition(V5_MOTION.popup);popup.start(()=>{},{exitOnly:true});
 let fade90=null,popup90=null;
 for(let i=1;i<=hz/2;i++){
  const dt=1/hz;
  device.step(0,dt,V5_MOTION.presenceOmega);
  icon.step(dt,{x:0,y:0,size:256,radius:68,present:false,presenceOmega:V5_MOTION.presenceOmega,time:0});
  morph.tick(dt);mission.tick(dt);popup.tick(dt);
  assert.ok(Math.abs(icon.alpha.value-device.value)<1e-9);
  assert.ok(Math.abs(morph.value-device.value)<1e-9);
  assert.ok(Math.abs(mission.opacity.value-device.value)<1e-9);
  if(fade90===null&&device.value<=.1)fade90=i/hz;
  if(popup90===null&&popup.value<=.1)popup90=i/hz;
 }
 assert.ok(fade90>=.3&&fade90<=.35);assert.ok(Math.abs(fade90-popup90)<=.08);
 mission.cancel();morph.cancel();
});
