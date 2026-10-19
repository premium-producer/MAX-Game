import {V5_MOTION} from './journey-v5-motion-profile.mjs';
import {V5MotionValue} from './journey-v5-inertia.mjs';

export const V5_DEVICE_FRAME=Object.freeze({height:800,insetX:10,insetY:12,actionHeight:96,actionGap:10,contentGap:18});
// The image and its hotspot canvas fill the shell. External controls never
// reduce the image viewport; semantic phone/PC labels never select dimensions.
export function v5DeviceMetrics(device){
 const {height,insetX,insetY}=V5_DEVICE_FRAME;
 const asset=device?.asset,valid=Number.isFinite(asset?.width)&&asset.width>0&&Number.isFinite(asset?.height)&&asset.height>0;
 const contentHeight=height-2*insetY;
 return {kind:device?.kind==='pc'?'pc':'phone',width:valid?2*insetX+contentHeight*asset.width/asset.height:392,height};
}

// Application sequencing only. maath owns interpolation; the renderer owns the clock.
export class V5DeviceMorph{
 constructor(){this.phase='idle';this.alpha=new V5MotionValue(1);}
 get value(){return this.alpha.value;}
 get busy(){return this.phase!=='idle';}
 get sweepProgress(){return 0;}
 start(commit,reduced=false,options={}){
  if(this.busy)return false;
  this.commit=commit;this.options=options;this.reduced=reduced;
  this.width=new V5MotionValue(options.from??0);this.target=options.to??this.width.value;
  this.phase='out';return true;
 }
 tick(dt){
  if(!this.busy||!(dt>0))return false;
  dt=Math.min(dt,.05);
  if(this.phase==='out'){
   this.alpha.step(0,dt,V5_MOTION.presenceOmega,this.reduced);
   if(this.alpha.at(0,V5_MOTION.presenceDistance,V5_MOTION.presenceSpeed)){this.alpha.value=0;this.alpha.velocity=0;this.phase='resize';}
  }else if(this.phase==='resize'){
   this.width.step(this.target,dt,V5_MOTION.travelOmega,this.reduced);
   const settled=this.width.at(this.target,V5_MOTION.resizeDistance,V5_MOTION.resizeSpeed);
   this.options.resize?.(settled?this.target:this.width.value);
   if(settled){this.phase='ready';const commit=this.commit;this.commit=null;commit?.();}
  }else if(this.phase==='ready'){
   if(this.options.ready?.()!==false)this.phase='in';
  }else{
   this.alpha.step(1,dt,V5_MOTION.presenceOmega,this.reduced);
   if(this.alpha.at(1,V5_MOTION.presenceDistance,V5_MOTION.presenceSpeed)){this.alpha.value=1;this.alpha.velocity=0;this.phase='idle';}
  }
  return true;
 }
 cancel(){this.commit=null;this.options={};this.phase='idle';this.alpha=new V5MotionValue(1);}
 restore(reduced=false){this.commit=null;this.options={};this.reduced=reduced;this.phase='in';}
}
