import {MotionValue,TRANSITION_MOTION as TIMING} from './journey-motion.mjs';

// Persistent per-zone focus, independent of the dialog's DOM and entrance/exit.
export class PopupFocus {
 constructor(){this.amount=new MotionValue(0);this.object='';}
 step(object,closing,dt,reduced=false){
  if(object)this.object=object;
  const target=object&&!closing?1:0;
  this.amount.step(target,Math.min(dt,.05),12,reduced);
  if(this.amount.at(target,.0001,.001)){this.amount.value=target;this.amount.velocity=0;}
  return this.amount.value;
 }
}

// Layout owns final bounds; this state owns the displayed bounds. Retargeting
// preserves both current geometry and velocity, including a reversed resize.
export class InstructionMotion {
 constructor({top,height},{Motion=MotionValue,omega=14}={}){this.top=new Motion(top);this.height=new Motion(height);this.omega=omega;this.target={top,height};}
 retarget(target){this.target={...target};}
 step(dt,reduced=false){for(const k of ['top','height'])this[k].step(this.target[k],Math.min(dt,.05),this.omega,reduced);}
 get settled(){return ['top','height'].every(k=>this[k].at(this.target[k],.02,.1));}
}

// Only copy/options leave; the glass shells and field remain present throughout.
// Quintic easing has zero velocity/acceleration at the invisible content swap.
const ease=t=>t*t*t*(t*(t*6-15)+10);
// The phone and instruction share the renderer's existing content clock. Join
// its invisible swap instead of publishing new copy before the old copy fades.
export function joinTaskContentCommit(motion,commit){
 if(!motion?.busy)return false;
 if(motion.value===0&&['ready','in'].includes(motion.phase)){commit();return true;}
 if(!['out','resize'].includes(motion.phase)||typeof motion.commit!=='function')return false;
 const previous=motion.commit;motion.commit=()=>{previous();commit();};return true;
}
export class TaskContentTransition {
 constructor(){this.phase='idle';this.value=1;this.elapsed=0;this.commit=null;}
 get busy(){return this.phase!=='idle';}
 // Linear visual clock across both phases; the content itself keeps its
 // eased fade. The edge wave therefore never brakes at the invisible swap.
 get sweepProgress(){
  const total=TIMING.contentExit+TIMING.contentEnter;
  if(this.phase==='out')return Math.min(this.elapsed,TIMING.contentExit)/total;
  if(this.phase==='in')return (TIMING.contentExit+Math.min(this.elapsed,TIMING.contentEnter))/total;
  return 0;
 }
 start(commit,reduced=false){
  if(this.busy)return false;
  if(reduced){this.value=0;try{commit();}finally{this.value=1;}return true;}
  this.phase='out';this.elapsed=0;this.commit=commit;return true;
 }
 tick(dt){
  if(!this.busy)return false;
  this.elapsed+=Math.max(0,Math.min(dt,.05));
  const t=Math.min(1,this.elapsed/(this.phase==='out'?TIMING.contentExit:TIMING.contentEnter));
  const next=this.phase==='out'?1-ease(t):this.phase==='recover'?this.recoverFrom+(1-this.recoverFrom)*ease(t):ease(t);
  this.value=Math.max(0,Math.min(1,next));
  if(t===1){
   if(this.phase==='out'){
    const commit=this.commit;this.commit=null;this.phase='in';this.elapsed=0;commit?.();
   }else {this.phase='idle';this.value=1;}
  }
  return true;
 }
 cancel(){this.commit=null;this.phase='idle';this.value=1;this.elapsed=0;}
 restore(reduced=false){this.commit=null;if(reduced){this.cancel();return;}this.recoverFrom=this.value;this.phase='recover';this.elapsed=0;}
}
