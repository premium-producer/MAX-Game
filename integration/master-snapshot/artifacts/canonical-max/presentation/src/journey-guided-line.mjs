import {GuidedJourney} from './journey-guided.mjs';
import {tileEdgeCurve,JOURNEY_LINK_STYLE} from './journey-links.mjs';
import {taskDevice} from './journey-media.mjs';

export const LINE_STORAGE='max-journey:guided-line:v1';
export const LINE_PHONE=Object.freeze({width:392,height:800,gap:420,lanes:5});
export const LINE_LINK_STYLE=Object.freeze({...JOURNEY_LINK_STYLE,lineWidth:.015,strandSpacing:.011,waveAmplitude:.012,intensity:1.05});
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const deviceGap=node=>Math.max(LINE_PHONE.gap,taskDevice(node).width/2+120+32);

// A separate save keeps the phone's world position; it never migrates Guided progress.
export class GuidedLineJourney extends GuidedJourney{
 get phoneMetrics(){return taskDevice(this.current);}
 constructor(content,value){
  let saved;try{saved=typeof value==='string'?JSON.parse(value):value;}catch{}
  super(content);
  if(saved?.lineVersion===1)Object.assign(this,new GuidedJourney(content,saved));
  this.phonePositions={};
  if(saved?.lineVersion===1)for(const m of content.missions){
   const positions=this.phonePositions[m.id]={},raw=saved.phonePositions?.[m.id];
   if(raw&&typeof raw==='object')for(const [step,p]of Object.entries(raw))if(finite(p))positions[step]={x:p.x,y:p.y};
  }
  // Base restore may reveal a pending step. Place it beyond the saved phone,
  // rather than losing a manually moved phone when closing on the result.
  const o=this.current,previous=this.nodes.at(-2);
  if(o&&previous&&o.step!=='open-max'&&!saved?.positions?.[this.session.mission]?.[o.step]){
   const p=this.phonePositions[this.session.mission]?.[previous.step];if(finite(p)){o.worldX=Math.max(p.x+deviceGap(previous),o.worldX);o.worldY=p.y;}
  }
 }
 get phone(){
  const node=this.current;if(!node)return null;
  this.phonePositions??={};const positions=this.phonePositions[this.session.mission]??={};
  if(!finite(positions[node.step]))positions[node.step]={x:node.worldX+deviceGap(node),y:0};
  return positions[node.step];
 }
 get continuation(){const p=this.phone;return p?{worldX:p.x+deviceGap(this.current),worldY:p.y}:null;}
 movePhone(x,y){if(!this.current||!Number.isFinite(x)||!Number.isFinite(y))return false;const p=this.phone;p.x=x;p.y=y;return true;}
 ensureNext(){
  const previous=this.current,phone=previous&&this.phone,added=super.ensureNext();
  if(added&&previous&&phone){
   added.worldX=Math.max(phone.x+deviceGap(previous),...this.nodes.filter(n=>n!==added).map(n=>n.worldX+320));
   added.worldY=phone.y;
  }
  return added;
 }
 serialize(){return JSON.stringify({...JSON.parse(super.serialize()),lineVersion:1,phonePositions:this.phonePositions});}
}

// Five separately keyed bundles with distributed boundary ports, not five copies
// of the same centre curve. Cardinal attachment selection retains its hysteresis.
export function phoneLaneCurves(a,b,previous){
 const base=tileEdgeCurve(a,b,previous),lanePort=(p,r,lane)=>{
  const vertical=Math.abs(p.nx)>.5,span=(vertical?r.h:r.w)*.4;
  return {...p,x:vertical?p.x:r.x+r.w/2+lane*span,y:vertical?r.y+r.h/2+lane*span:p.y};
 };
 const curves=Array.from({length:LINE_PHONE.lanes},(_,i)=>{
  const lane=(i-2)/2,start=lanePort(base.start,a,lane),end=lanePort(base.end,b,lane);
  const dx=start.x-base.start.x,dy=start.y-base.start.y,ex=end.x-base.end.x,ey=end.y-base.end.y;
  return {...base,start,end,c1:{x:base.c1.x+dx,y:base.c1.y+dy},c2:{x:base.c2.x+ex,y:base.c2.y+ey}};
 });
 return {base,curves};
}
