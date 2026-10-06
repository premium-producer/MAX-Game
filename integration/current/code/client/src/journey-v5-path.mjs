import {QuadraticBezierCurve,Vector2} from 'three';
import {sine} from 'maath/easing/dist/maath-easing.esm.js';

// Targets only: Three owns curves, maath owns easing, retained IconMotion
// owns the visible pose/velocity and the matching input/link geometry.
export class V5PathBatch {
 constructor(from,to,{seconds,stagger,bend}){
  this.elapsed=0;this.duration=seconds+Math.max(0,to.length-1)*stagger;
  this.paths=new Map(to.map((p,i)=>{
   const start=from[p.step]??p,a=new Vector2(start.worldX,start.worldY),b=new Vector2(p.worldX,p.worldY);
   const control=a.clone().lerp(b,.5);
   control.y+=(start.worldY<=0?-1:1)*bend;
   return [p.step,{curve:new QuadraticBezierCurve(a,control,b),delay:i*stagger,seconds,point:new Vector2()}];
  }));
 }
 get done(){return this.elapsed>=this.duration;}
 tick(dt,reduced=false){if(!(dt>0))return;this.elapsed=reduced?this.duration:Math.min(this.duration,this.elapsed+Math.min(dt,.05));}
 pose(id){
  const path=this.paths.get(id);if(!path)return null;
  const t=Math.max(0,Math.min(1,(this.elapsed-path.delay)/path.seconds));
  const point=path.curve.getPoint(sine.inOut(t),path.point);
  return {worldX:point.x,worldY:point.y};
 }
}
