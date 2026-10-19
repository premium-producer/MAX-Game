import {SharedRevealJourney} from './journey-shared-reveal.mjs';
import {REVEAL_TIMING} from './journey-guided-reveal.mjs';

export const REFERENCE_UI={width:3591,height:1113,tile:120,spacing:260,gap:140,phoneScale:.625};
// Presentation projection only. All commands, progress and content stay in SessionPort.
export class ReferenceRevealJourney extends SharedRevealJourney{
 // Trace, opening and route travel overlap; no separate motionless link hold.
 get phoneVisible(){return this.phase==='trace'||super.phoneVisible;}
 tick(dt,options={}){
  // Decorative drift must never hold a semantic transition hostage. The phone
  // still waits for its media/readiness gate supplied by the adapter.
  super.tick(dt,{...options,settled:['burst','arrange'].includes(this.phase)?true:options.settled});
 }
 pose(node){
  const pose=super.pose(node),offset=566-this.geometry.width/2;
  if(this.phase==='burst')pose.worldX+=offset;
  if(this.phase==='arrange'){
   const t=Math.max(0,Math.min(1,this.elapsed/REVEAL_TIMING.arrange));
   pose.worldX+=offset*(1-t*t*t*(t*(t*6-15)+10));
  }
  return pose;
 }
 populate(){
  super.populate();
  const nodes=this.nodes,start=this.geometry.width/2+54.5-(Math.min(nodes.length,5)-1)*REFERENCE_UI.spacing/2;
  nodes.forEach((node,i)=>{if(!this.manualNodes[this.session.mission]?.includes(node.step))node.worldX=start+i*REFERENCE_UI.spacing;});
 }
 get phoneMetrics(){
  const original=super.phoneMetrics;
  const scale=original.kind==='pc'?520/original.width:REFERENCE_UI.phoneScale;
  return {...original,width:original.width*scale,height:original.height*scale,scale,original};
 }
 get phoneLayout(){
  const active=this.current,device=this.phoneMetrics;
  if(!active)return {phone:{x:this.geometry.width/2,y:this.geometry.height/2},side:1,offsets:{}};
  const x=active.worldX+REFERENCE_UI.tile/2+REFERENCE_UI.gap+device.width/2;
  const phone=this.manualPhones[this.session.mission]?.[this.activeId]||{x,y:this.geometry.height/2};
  const next=this.nodes.filter(n=>n.worldX>active.worldX);
  const first=Math.min(...next.map(n=>n.worldX));
  const shift=next.length?Math.max(0,phone.x+device.width/2+REFERENCE_UI.gap+REFERENCE_UI.tile/2-first):0;
  return {phone,side:1,offsets:Object.fromEntries(next.map(n=>[n.step,shift]))};
 }
 captionVisible(node){return !['palm','holding','burst','arrange'].includes(this.phase);}
}
