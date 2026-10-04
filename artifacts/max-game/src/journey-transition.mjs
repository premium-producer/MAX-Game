// One clock for a zone's glyphs, optics and links. No timers or extra RAF.
import {MotionValue,TRANSITION_MOTION as TIMING} from './journey-motion.mjs';
const ease=t=>t*t*(3-2*t);
export class JourneyTransition {
 constructor(timing=TIMING){this.timing=timing;this.value=1;this.velocity=0;this.phase='idle';this.elapsed=0;this.commit=null;this.reversal=null;}
 get busy(){return this.phase!=='idle';}
 start(commit,{reduced=false,enterOnly=false,exitOnly=false,interrupt=false}={}){
  if(this.busy&&!interrupt)return false;
  if(reduced){this.cancel();commit();return true;}
  if(this.busy&&interrupt){
   // A close replaces the old callback, not the current rendered pose/velocity.
   this.reversal=new MotionValue(this.value);this.reversal.velocity=this.velocity;
   this.commit=commit;this.exitOnly=exitOnly;this.phase='exit';this.elapsed=0;return true;
  }
  this.elapsed=0;this.commit=commit;this.exitOnly=exitOnly;
  this.phase=enterOnly?'enter':'exit';this.value=enterOnly?0:1;
  if(enterOnly){this.commit=null;commit();}
  return true;
 }
 tick(delta){
  if(!this.busy)return false;
  this.elapsed+=Math.max(0,Math.min(delta,.05));
  const duration=this.phase==='exit'?this.timing.exit:this.timing.enter;
  let t=Math.min(1,this.elapsed/duration);
  if(this.reversal){
   this.reversal.step(0,Math.max(0,Math.min(delta,.05)),this.timing.interruptOmega);
   this.value=this.reversal.value;this.velocity=this.reversal.velocity;
   t=this.reversal.at(0,.001,.025)?1:0;
   if(t===1){this.value=0;this.velocity=0;this.reversal=null;}
  }else{
   this.value=this.phase==='exit'?1-ease(t):ease(t);
   this.velocity=(this.phase==='exit'?-1:1)*6*t*(1-t)/duration;
  }
  if(t===1){
   if(this.phase==='exit'){
    const commit=this.commit;this.commit=null;this.phase='enter';this.elapsed=0;
    // Commit at exactly zero; the new DOM and GPU resources are never exposed mid-swap.
    commit?.();
    if(this.exitOnly){this.phase='idle';this.value=1;}
   }else{this.phase='idle';this.value=1;}
  }
  return true;
 }
 cancel(){this.phase='idle';this.commit=null;this.value=1;this.velocity=0;this.reversal=null;this.elapsed=0;}
}
