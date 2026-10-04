import {MotionValue,TRANSITION_MOTION as TIMING} from './journey-motion.mjs';

// Optional lanes are independent links; existing one-link pairs keep their keys.
export function signalLinkKey(a,b,lane){const pair=a<b?`${a}:${b}`:`${b}:${a}`;return lane===undefined?pair:`${pair}:lane:${lane}`;}

// Hide the old, frozen geometry before rebuilding ports. Even a very short
// drag must cross zero before the new curve becomes visible.
export function suspendSignalLink(entry,suspended){
 if(suspended){entry.frozen=true;entry.resetEdgeAfterMove=true;}
 entry.suspended=suspended;
}
export function stepSignalLinkPresence(entry,dt,reduced=false){
 const hiding=entry.suspended||entry.frozen||entry.removing;
 const target=hiding?0:1,rate=hiding?TIMING.linkHide:TIMING.linkReveal;
 entry.opacity=reduced?target:target+(entry.opacity-target)*Math.exp(-rate*Math.max(0,Math.min(dt,.05)));
 if(hiding&&entry.opacity<.003)entry.opacity=0;
 entry.group.visible=entry.opacity>0;
 if(entry.frozen&&entry.opacity===0&&!entry.suspended&&!entry.removing){
  entry.frozen=false;return true; // Rebuild now, while invisible; reveal next tick.
 }
 return !entry.suspended&&!entry.frozen;
}

// Screen-space adaptation: shortest available pairs build a connected, acyclic
// network (Kruskal MST; a forest when reach is bounded). No mission role selects a hub.
// Call per zone; resting nodes exclude bob, a selected flight uses its live centre.
export function nearestLinks(nodes,maxDistance=Infinity){
 const ordered=nodes.filter(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)).slice().sort((a,b)=>a.id-b.id);
 const parents=new Map(ordered.map(n=>[n.id,n.id])),edges=[],links=[];
 const root=id=>{while(parents.get(id)!==id)id=parents.get(id);return id;};
 for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
  const a=ordered[i],b=ordered[j],distance=Math.hypot(a.x-b.x,a.y-b.y);if(distance<=maxDistance)edges.push({a:a.id,b:b.id,distance});
 }
 edges.sort((a,b)=>a.distance-b.distance||a.a-b.a||a.b-b.b);
 for(const e of edges){const a=root(e.a),b=root(e.b);if(a===b)continue;parents.set(a,b);links.push({...e,correct:true,screen:true});if(links.length===ordered.length-1)break;}
 return links;
}

// Journey reach scales with the tile, not monitor pixels or browser zoom.
export const JOURNEY_LINK_REACH_TILES=7;
// Judge the actual gap between ports, not the direction between tile centres.
// A side can face the other centre yet point almost backwards along that gap.
function portFacing(start,end){
 const dx=end.x-start.x,dy=end.y-start.y,distance=Math.hypot(dx,dy);
 if(distance<1e-9)return {distance,start:1,end:1};
 return {distance,start:(start.nx*dx+start.ny*dy)/distance,end:-(end.nx*dx+end.ny*dy)/distance};
}
function shapeTileCurve(curve){
 const {start,end,c1,c2}=curve,facing=portFacing(start,end);
 const ease=value=>{const t=Math.max(0,Math.min(1,value/.5));return t*t*(3-2*t);};
 // While an attachment slides around a corner, shorten its tangent smoothly
 // instead of retaining a long perpendicular handle and drawing a hairpin.
 const first=ease(facing.start),last=ease(facing.end),handle=facing.distance*.38;
 c1.x=start.x+start.nx*handle*first;c1.y=start.y+start.ny*handle*first;
 c2.x=end.x+end.nx*handle*last;c2.y=end.y+end.ny*handle*last;
 const bow=.06*Math.min(first,last);
 curve.bowX=-(end.y-start.y)*bow;curve.bowY=(end.x-start.x)*bow;
 return curve;
}
// Cardinal ports use the live tile rectangle, never the caption or its centre.
// A small tie band keeps idle bob from flipping equally close sides each frame.
export function tileEdgeCurve(a,b,previous){
 const ports=r=>[
  {side:'top',x:r.x+r.w/2,y:r.y,nx:0,ny:-1},
  {side:'right',x:r.x+r.w,y:r.y+r.h/2,nx:1,ny:0},
  {side:'bottom',x:r.x+r.w/2,y:r.y+r.h,nx:0,ny:1},
  {side:'left',x:r.x,y:r.y+r.h/2,nx:-1,ny:0},
 ];
 const dx=b.x+b.w/2-a.x-a.w/2,dy=b.y+b.h/2-a.y-a.h/2;
 const candidates=[];
 for(const start of ports(a))for(const end of ports(b)){
  if(start.nx*dx+start.ny*dy<0||end.nx*dx+end.ny*dy>0)continue;
  const facing=portFacing(start,end),quality=Math.min(facing.start,facing.end);
  const score=facing.distance*(2-(facing.start+facing.end)*.5);
  candidates.push({start,end,score,quality});
 }
 candidates.sort((u,v)=>{
  const difference=u.score-v.score;
  if(Math.abs(difference)>1e-9*Math.max(1,a.w,a.h,b.w,b.h))return difference;
  // Equivalent corner routes should first preserve the source port: the
  // destination changes to its bottom/top instead of moving both ends.
  if(previous&&u.start.side!==v.start.side){
   const change=Number(u.start.side!==previous.start.side)-Number(v.start.side!==previous.start.side);
   if(change)return change;
  }
  return (v.start.nx-u.start.nx)*dx+(v.start.ny-u.start.ny)*dy;
 });
 // Prefer ports that both make forward progress. Overlapping/zero-size tiles
 // may have no such pair during a reveal; keep that transient case finite.
 let pair=candidates.find(p=>p.quality>=.2)||candidates[0];
 const retained=previous&&candidates.find(p=>p.start.side===previous.start.side&&p.end.side===previous.end.side);
 if(retained&&retained.quality>=Math.min(.12,pair.quality)&&retained.score<=pair.score+Math.min(a.w,a.h,b.w,b.h)*.08)pair=retained;
 return shapeTileCurve({start:pair.start,end:pair.end,c1:{},c2:{},bowX:0,bowY:0});
}

export function sampleTileEdgeCurve(curve,t,target={}){
 const u=1-t,bow=16*t*t*u*u;
 target.x=u*u*u*curve.start.x+3*u*u*t*curve.c1.x+3*u*t*t*curve.c2.x+t*t*t*curve.end.x+curve.bowX*bow;
 target.y=u*u*u*curve.start.y+3*u*u*t*curve.c1.y+3*u*t*t*curve.c2.y+t*t*t*curve.end.y+curve.bowY*bow;
 return target;
}

// Move the attachment around the rounded perimeter, not through the icon.
// Frames follow the current tile immediately; only the local port angle springs.
function roundedPort(frame,angle,target){
 const ux=Math.cos(angle),uy=Math.sin(angle),ax=Math.abs(ux),ay=Math.abs(uy);
 const hx=frame.w/2,hy=frame.h/2,r=Math.max(0,Math.min(frame.radius,hx,hy));
 let distance=Math.min(ax>1e-9?hx/ax:Infinity,ay>1e-9?hy/ay:Infinity);
 let x=ax*distance,y=ay*distance,nx=0,ny=0;
 if(r>0&&x>hx-r&&y>hy-r){
  const cx=hx-r,cy=hy-r,dot=ax*cx+ay*cy;
  distance=dot+Math.sqrt(Math.max(0,dot*dot-cx*cx-cy*cy+r*r));
  x=ax*distance;y=ay*distance;nx=(x-cx)/r;ny=(y-cy)/r;
 }else if(hx-x<hy-y)nx=1;else ny=1;
 target.x=frame.x+Math.sign(ux)*x;target.y=frame.y+Math.sign(uy)*y;
 target.nx=Math.sign(ux)*nx;target.ny=Math.sign(uy)*ny;
 return target;
}

export class TileEdgeMotion {
 constructor(){this.angles=null;this.curve={start:{},end:{},c1:{},c2:{},bowX:0,bowY:0};}
 step(goal,dt,reduced=false){
  if(!goal.frames)return goal;
  const targets=['start','end'].map((key,i)=>Math.atan2(goal[key].y-goal.frames[i].y,goal[key].x-goal.frames[i].x));
  if(!this.angles)this.angles=targets.map(angle=>new MotionValue(angle));
  const curve=this.curve;
  ['start','end'].forEach((key,i)=>{
   const motion=this.angles[i],difference=Math.atan2(Math.sin(targets[i]-motion.value),Math.cos(targets[i]-motion.value));
   // Unwrap around the current angle, retaining velocity even if retargeted mid-turn.
   motion.step(motion.value+difference,dt,14,reduced);
   roundedPort(goal.frames[i],motion.value,curve[key]);
  });
  shapeTileCurve(curve);
  // World coordinates have inverted Y compared with the logical tile coordinates.
  if(goal.flipBow){curve.bowX*=-1;curve.bowY*=-1;}
  return curve;
 }
}

export function linkReachPresence(distance,reach){
 const t=Math.max(0,Math.min(1,(reach-distance)/(reach*.18)));
 return t*t*(3-2*t);
}

// Restore X-Sputnik's 5 fibers / 80 samples / 32 flowing particles and 3.25
// traveling undulations. Slightly wider spread for the flat MAX field; thin
// strands leave headroom for particle peaks instead of clipping into cyan rails.
export const JOURNEY_LINK_STYLE=Object.freeze({strandCount:5,segmentCount:80,particleCount:32,flowSpeed:.19,waveAmplitude:.018,waveFrequency:3.25,strandSpacing:.008,lineWidth:.006,intensity:1.15,pulseStrength:.35});

// Upstream particle motion: independent phase around the animated centerline,
// not locked to precisely the same bright strand as every other particle.
export function updateSignalParticles(entry,elapsed){
 const {style}=entry,center=(style.strandCount-1)*.5,positions=entry.particleAttribute.array;
 for(let i=0;i<style.particleCount;i++){
  const t=(elapsed*style.flowSpeed+i/style.particleCount+entry.offset)%1;
  const scaled=t*style.segmentCount,first=Math.floor(scaled),second=Math.min(style.segmentCount,first+1),mix=scaled-first;
  const lane=((i%style.strandCount)-center)*style.strandSpacing;
  const wave=Math.sin(t*style.waveFrequency*Math.PI*2-elapsed*3.2+i)*style.waveAmplitude;
  const lateral=(lane+wave)*Math.sin(Math.PI*t);
  for(let axis=0;axis<3;axis++){
   const a=first*3+axis,b=second*3+axis;
   positions[i*3+axis]=entry.centerPositions[a]+(entry.centerPositions[b]-entry.centerPositions[a])*mix
    +(entry.normalPositions[a]+(entry.normalPositions[b]-entry.normalPositions[a])*mix)*lateral;
  }
 }
 entry.particleAttribute.needsUpdate=true;
}
