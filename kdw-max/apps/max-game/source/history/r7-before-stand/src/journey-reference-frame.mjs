import {scenePose,projectBounds} from './journey-scene-pose.mjs';
import {REVEAL_MOTION} from './journey-guided-reveal.mjs';
import {referenceDrift,separateReferenceObjects} from './journey-reference-motion.mjs';

// Measured entries come from the DOM adapter. No DOM, WebGL or game commands
// belong here. This extraction intentionally preserves the existing mechanics.
export function prepareReferenceFrame(entries,{delta,time,driftTime,reduced=false,offsets}){
 const frames=new Map(),boxes=[],obstacles=[];
 for(const entry of entries){
  const {owner,role,presence=1,motion:m,layout:l,width,height}=entry;
  if(role==='device'&&presence>.001)obstacles.push(entry.rect);
  if(!m)continue;
  const fixed=role==='palm';
  m.step(Math.min(delta,.05),{...l,hover:entry.hover,dragging:entry.dragging,selected:entry.selected,present:true,labelVisible:entry.labelVisible,badgeVisible:false,planning:true,movementOmega:REVEAL_MOTION.fieldOmega,reduced,time});
  const pose=scenePose(l,m,width,height);
  const drift=referenceDrift(driftTime,m.seed,fixed||reduced||entry.dragging);
  pose.x+=drift.x;pose.y+=drift.y;
  const prior=offsets.get(owner)||{x:0,y:0},decay=fixed||reduced?0:Math.exp(-Math.min(delta,.05)*8);
  const carry={x:prior.x*decay,y:prior.y*decay};pose.x+=carry.x;pose.y+=carry.y;
  frames.set(owner,{l,pose,carry});
  if(presence<=.001)continue;
  const parts=entry.parts.filter(p=>p.kind==='tile'||p.kind==='caption'&&m.label.value>.001).map(p=>projectBounds(p.bounds,pose));
  if(!parts.length)continue;
  const x=Math.min(...parts.map(b=>b.x)),y=Math.min(...parts.map(b=>b.y));
  boxes.push({id:owner,fixed,x,y,w:Math.max(...parts.map(b=>b.x+b.w))-x,h:Math.max(...parts.map(b=>b.y+b.h))-y});
 }
 const corrections=separateReferenceObjects(boxes,obstacles);
 for(const [owner,offset]of corrections){const frame=frames.get(owner);frame.pose.x+=offset.x;frame.pose.y+=offset.y;offsets.set(owner,{x:frame.carry.x+offset.x,y:frame.carry.y+offset.y});}
 return frames;
}

// Opt-in bounded trace. Counts confirmed scan transitions, not frame events.
export class ReferenceStartTrace{
 constructor(limit=180){this.limit=limit;this.rows=[];this.run=null;this.scanned=false;this.confirmations=0;}
 record(context,entries,frames){
  if(context.runId!==this.run){this.run=context.runId;this.scanned=!!context.scanned;this.confirmations=0;}
  else if(context.scanned&&!this.scanned)this.confirmations++;
  this.scanned=!!context.scanned;
  const ids=entries.map(e=>e.id),duplicateIds=ids.filter((id,i)=>ids.indexOf(id)!==i);
  const row={...context,scanConfirmations:this.confirmations,duplicateIds,objects:entries.map(e=>{
   const pose=frames.get(e.owner)?.pose||e.rect;
   return {id:e.id,role:e.role,pose:pose&&{...pose},presence:e.presence??1,alpha:(e.motion?.alpha.value??1)*(e.presence??1),velocity:e.motion?{x:e.motion.x.velocity,y:e.motion.y.velocity}:null};
  })};
  this.rows.push(row);if(this.rows.length>this.limit)this.rows.shift();return row;
 }
}
