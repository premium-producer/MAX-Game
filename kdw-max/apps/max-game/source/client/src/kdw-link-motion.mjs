import {MotionValue} from './journey-motion.mjs';

// Portable layout has a 128px corridor rather than the stand's 400px.
// Attachments track the current frames exactly. Only the bend has inertia,
// capped in logical pixels so a resize cannot fling the ports around a corner.
export const CALM_LINK_STYLE=Object.freeze({waveAmplitude:.004,waveFrequency:1.25});
export class CalmLinkMotion {
 constructor(){this.links=new Map();this.time=null;}
 update(links,scale,time,reduced=false){
  const dt=this.time===null?0:Math.max(0,Math.min(.05,time-this.time));this.time=time;
  const live=new Set();
  for(const link of links){
   const frames=link.edgeCurve?.frames;if(!frames)continue;
   const [a,b]=frames,sign=b.x>=a.x?1:-1,lane=link.lane===undefined?0:(2-link.lane)/2;
   const span=r=>Math.max(0,Math.min(r.h*.27,r.h/2-r.radius));
   const start={x:a.x+sign*a.w/2,y:a.y+lane*span(a)};
   const end={x:b.x-sign*b.w/2,y:b.y+lane*span(b)};
   const gap=sign*(end.x-start.x),dy=end.y-start.y;
   const key=`${link.scope}:${link.a}:${link.b}:${link.lane??'route'}`;live.add(key);
   let motion=this.links.get(key);if(!motion){motion=new MotionValue(dy);this.links.set(key,motion);}
   motion.step(dy,dt,20,reduced);
   const limit=6*scale,bend=Math.max(-limit,Math.min(limit,(motion.value-dy)*.15));
   // Also bound retained state: an abrupt geometry change settles quickly.
   motion.value=dy+bend/.15;motion.velocity=Math.max(-120*scale,Math.min(120*scale,motion.velocity));
   const handle=Math.max(0,gap)*.42;
   link.edgeCurve={start,end,c1:{x:start.x+sign*handle,y:start.y+bend},c2:{x:end.x-sign*handle,y:end.y+bend},bowX:0,bowY:0};
   // Overlapping tiles during entrance have no free corridor to draw into.
   link.visibility*=Math.max(0,Math.min(1,gap/(16*scale)));
  }
  for(const key of this.links.keys())if(!live.has(key))this.links.delete(key);
 }
}
