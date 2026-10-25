import {V5MotionValue} from './journey-v5-inertia.mjs';
import {V5_MOTION} from './journey-v5-motion-profile.mjs';

// Retire the incoming links on their last device anchor. The confirmation
// changes shape before its media commits, so following that geometry would snap.
export class RegistrationLinks {
 update(rect,{screenId,runKey,time,reduced=false,original=false}){
  const hidden=!original&&screenId==='business.platform.ready';
  if(this.runKey!==runKey||!this.alpha){
   this.runKey=runKey;this.alpha=new V5MotionValue(hidden?0:1);this.rect=null;this.time=time;
  }
  const dt=Math.max(0,Math.min(.05,time-this.time));this.time=time;
  if(!hidden)this.rect=rect?{...rect}:null;
  this.alpha.step(hidden?0:1,dt,V5_MOTION.presenceOmega,reduced);
  if(this.alpha.at(hidden?0:1,V5_MOTION.presenceDistance,V5_MOTION.presenceSpeed)){
   this.alpha.value=hidden?0:1;this.alpha.velocity=0;
  }
  return {rect:this.rect,opacity:this.alpha.value};
 }
}
