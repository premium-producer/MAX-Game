import {damp} from 'maath/easing/dist/maath-easing.esm.js';
import {MotionValue} from './journey-motion.mjs';
import {V5_MOTION} from './journey-v5-motion-profile.mjs';

export const V5_INERTIA=Object.freeze({iconsOmega:V5_MOTION.travelOmega,phoneOmega:V5_MOTION.dragOmega,infoGap:64});

// maath owns the damping calculation; retain the engine's value/velocity/rest
// interface so display, input and readiness still consume the same pose.
export class V5MotionValue extends MotionValue {
 step(goal,dt,omega=16,reduced=false){
  this.__damp??={};
  if(reduced){this.value=goal;this.velocity=0;this.__damp.velocity_value=0;return;}
  if(!(dt>0))return;
  this.__damp.velocity_value=this.velocity;
  const moving=damp(this,'value',goal,2/omega,dt,Infinity,undefined,.0001);
  this.velocity=moving?this.__damp.velocity_value:0;
  if(!moving)this.__damp.velocity_value=0;
 }
}

export function enableV5Inertia(motion){
 for(const key of ['x','y','alpha','label','badge'])if(motion[key]&&!(motion[key] instanceof V5MotionValue)){
  const prior=motion[key],next=new V5MotionValue(prior.value);
  next.velocity=prior.velocity;motion[key]=next;
 }
 return motion;
}

export const v5InstructionTop=height=>`calc(var(--guided-device-center-y, 50%) - ${height/2}px)`;
export const v5InstructionLeft=(phoneX,cameraX,width)=>phoneX-cameraX+width/2+V5_INERTIA.infoGap;

// Offset from the measured layout target to the retained visible centre.
// This cancels parent/field offsets, including .guided-field's 100px top inset.
export const v5IconWorldPoint=(offset,goal)=>({x:goal.worldX+offset.x,y:goal.worldY+offset.y});
