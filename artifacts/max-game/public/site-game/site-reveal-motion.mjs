// The reveal geometry and timing below are ported from
// artifacts/max-game/src/journey-guided-reveal.mjs. Keep the equations in sync.
export const REVEAL_TIMING=Object.freeze({hold:.8,firstFlight:.9,firstFollow:.78,stagger:.25,appear:.58,burstSettle:.25,arrange:.85,trace:1.2});
export const REVEAL_MOTION=Object.freeze({fieldOmega:7.5});
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
export const revealTracePresence=progress=>{const t=Math.max(0,Math.min(1,progress));return t*t*(3-2*t);};
export const revealLaunchTime=index=>index===0?0:REVEAL_TIMING.firstFollow+(index-1)*REVEAL_TIMING.stagger;
export const revealFlightDuration=index=>index===0?REVEAL_TIMING.firstFlight:REVEAL_TIMING.appear;
export const revealBurstDuration=count=>revealLaunchTime(Math.max(0,count-1))+revealFlightDuration(Math.max(0,count-1))+REVEAL_TIMING.burstSettle;
export function revealRing(index,count,width){
 const radiusX=Math.min(380,Math.max(0,(width-160)/2));
 const angles=count===3?[-90,135,45]:count===4?[-90,180,90,0]:count===5?[-90,-140,130,50,-40]:[-90,-140,130,90,50,-40];
 const angle=angles[index]*Math.PI/180;
 return {worldX:width/2+Math.cos(angle)*radiusX,worldY:Math.sin(angle)*260};
}
export function revealLaunchPoint(index,count,width){return index===0?{worldX:width/2,worldY:0}:{worldX:width/2+(index-(count-1)/2)*24,worldY:(index%2?1:-1)*12};}
export function revealArc(from,to,progress,bend=150){
 const t=smooth(progress),u=1-t,side=from.worldY<=0?-1:1;
 const control={worldX:(from.worldX+to.worldX)/2,worldY:(from.worldY+to.worldY)/2+side*bend};
 return {worldX:u*u*from.worldX+2*u*t*control.worldX+t*t*to.worldX,worldY:u*u*from.worldY+2*u*t*control.worldY+t*t*to.worldY};
}
export function revealMaxArc(from,to,progress){
 const t=smooth(progress),u=1-t;
 const control={worldX:to.worldX-120,worldY:-480};
 return {worldX:u*u*from.worldX+2*u*t*control.worldX+t*t*to.worldX,worldY:u*u*from.worldY+2*u*t*control.worldY+t*t*to.worldY};
}
export function revealNodeTarget(phase,elapsed,index,count,lineX,width){
 const ring=revealRing(index,count,width),line={worldX:width/2+lineX,worldY:0},start=revealLaunchPoint(index,count,width);
 if(phase==='reveal'){
  const launch=revealLaunchTime(index),flight=revealFlightDuration(index),landing=launch+flight;
  if(elapsed<launch)return {...start,presence:0};
  if(elapsed<=landing)return {...revealArc(start,ring,(elapsed-launch)/flight,0),presence:smooth((elapsed-launch)/Math.min(.28,flight))};
  const drift=6*smooth((elapsed-landing)/.16)*smooth((revealBurstDuration(count)-elapsed)/.22);
  return {worldX:ring.worldX+Math.cos(elapsed*3+index*1.9)*drift,worldY:ring.worldY+Math.sin(elapsed*2.4+index*1.3)*drift,presence:1};
 }
 if(phase==='arrange')return {...(index===0?revealMaxArc(ring,line,elapsed/REVEAL_TIMING.arrange):revealArc(ring,line,elapsed/REVEAL_TIMING.arrange,Math.max(110,Math.min(150,Math.abs(ring.worldY)*.62)))),presence:1};
 return {...line,presence:1};
}
