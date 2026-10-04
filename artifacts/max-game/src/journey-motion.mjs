// Closed-form critical spring; see docs/Research/max-webgl-motion-20260928.md.
// A retarget changes only the goal: position AND velocity survive ownership changes.
export class MotionValue {
 constructor(value){this.value=value;this.velocity=0;}
 step(goal,dt,omega=16,reduced=false){
  if(reduced){this.value=goal;this.velocity=0;return;}
  if(!(dt>0))return;
  const offset=this.value-goal,c=this.velocity+omega*offset,e=Math.exp(-omega*dt);
  this.value=goal+(offset+c*dt)*e;
  this.velocity=(this.velocity-omega*c*dt)*e;
 }
 at(goal,distance=.1,speed=.5){return Math.abs(this.value-goal)<=distance&&Math.abs(this.velocity)<=speed;}
}

export const MOTION={menu:17,place:10.5,route:12,next:10,nextReveal:7,nextHide:14,field:20,drag:38,effect:20,label:10,badge:8,labelDelay:.04,badgeDelay:.11,positionRest:.08,speedRest:.6};
export const ROUTE_INTRO={reveal:.24,hold:.5,travelOmega:10,burstDuration:.9};
export const TRANSITION_MOTION={exit:.16,enter:.28,contentExit:.34,contentEnter:.50,interruptOmega:36,linkHide:32,linkReveal:6.5};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};

// One distance spring for the whole route: intermediate corners are never
// arrival gates. Quadratic fillets stay within 12px of the safe polyline.
export class PlacementFlight {
 constructor(start,waypoints,velocity={x:0,y:0}){
  const points=[start,...waypoints].filter((p,i,a)=>!i||Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)>.001);
  this.segments=[];this.length=0;this.elapsed=0;this.distance=new MotionValue(0);this.velocity=velocity;this.end=points.at(-1);
  const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  const add=(a,b,c)=>{
   const point=t=>c?mix(mix(a,b,t),mix(b,c,t),t):mix(a,b,t);
   const samples=[{t:0,d:0}],count=c?24:1;let last=a,length=0;
   for(let i=1;i<=count;i++){const p=point(i/count);length+=Math.hypot(p.x-last.x,p.y-last.y);samples.push({t:i/count,d:length});last=p;}
   if(length>.001){this.segments.push({a,b,c,point,samples,start:this.length,length});this.length+=length;}
  };
  let from=points[0];
  for(let i=1;i<points.length-1;i++){
   const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y),cut=Math.min(12,ab*.2,bc*.2);
   const entry=mix(b,a,cut/ab),exit=mix(b,c,cut/bc);add(from,entry);add(entry,b,exit);from=exit;
  }
  add(from,this.end);
 }
 step(dt,reduced=false){
  this.elapsed+=Math.max(0,dt);this.distance.step(this.length,dt,12.5,reduced);
  const s=this.segments.find(s=>this.distance.value<s.start+s.length)||this.segments.at(-1);
  let p=this.end,tx=0,ty=0;
  if(s){
   const d=Math.max(0,Math.min(s.length,this.distance.value-s.start)),found=s.samples.findIndex(v=>v.d>=d),i=found<0?s.samples.length-1:Math.max(1,found),a=s.samples[i-1],b=s.samples[i];
   const t=a.t+(b.t-a.t)*(d-a.d)/(b.d-a.d);p=s.point(t);
   const dx=s.c?2*((1-t)*(s.b.x-s.a.x)+t*(s.c.x-s.b.x)):s.b.x-s.a.x,dy=s.c?2*((1-t)*(s.b.y-s.a.y)+t*(s.c.y-s.b.y)):s.b.y-s.a.y;
   const len=Math.hypot(dx,dy)||1;tx=dx/len;ty=dy/len;
  }
  // Preserve the menu's incoming velocity, then dissipate it on the same clock.
  const t=this.elapsed,e=reduced?0:Math.exp(-14*t),offset=t*e,v=(1-14*t)*e;
  return {x:p.x+this.velocity.x*offset,y:p.y+this.velocity.y*offset,vx:tx*this.distance.velocity+this.velocity.x*v,vy:ty*this.distance.velocity+this.velocity.y*v};
 }
 get settled(){return this.distance.at(this.length,.2,2);}
}
export class IconMotion {
 constructor({x,y,size,radius,menu=false,next=false,phase=0}){
  this.x=new MotionValue(x);this.y=new MotionValue(y);this.size=new MotionValue(size);
  this.radius=new MotionValue(radius);this.alpha=new MotionValue(menu?0:1);
  this.label=new MotionValue(menu?0:1);this.badge=new MotionValue(menu?0:1);
  this.energy=new MotionValue(0);this.float=new MotionValue(menu?1:0);
  this.selection=new MotionValue(0);this.pressRemaining=0;
  this.phase=menu?'menu':'field';this.seed=phase;this.elapsed=0;this.goal=null;
  this.logo=1;this.intro=null;this.next=next;
  this.connectionTarget={x,y};this.connectionsMoving=false;this.connectionRest=0;
 }
 presentStart(){
  this.intro={x:this.x.value,y:this.y.value,size:this.size.value,radius:this.radius.value,elapsed:0};
  this.phase='intro';this.logo=0;this.label.value=0;this.badge.value=0;
 }
 stepIntro(dt,target){
  const intro=this.intro,end=ROUTE_INTRO.reveal+ROUTE_INTRO.hold;
  const before=intro.elapsed;intro.elapsed+=dt;
  this.logo=target.reduced?1:smooth(intro.elapsed/ROUTE_INTRO.reveal);
  // Emergence and hold keep the exact tapped centre, without idle bob or hover.
  // Split the boundary-crossing frame: the flight receives only its own delta.
  const travelDt=target.reduced?dt:Math.max(0,intro.elapsed-Math.max(before,end));
  const growing=target.reduced?1:smooth(intro.elapsed/ROUTE_INTRO.reveal);
  if(before<end&&!target.reduced){
   this.size.value=intro.size+(target.size-intro.size)*growing;
   this.radius.value=intro.radius+(target.radius-intro.radius)*growing;
  }
  for(const key of ['x','y','size','radius'])this[key].step(target[key],travelDt,ROUTE_INTRO.travelOmega,target.reduced);
  this.alpha.step(1,dt,MOTION.effect,target.reduced);
  this.label.step(1,target.reduced?dt:Math.max(0,intro.elapsed-Math.max(before,ROUTE_INTRO.reveal)),MOTION.label,target.reduced);
  this.energy.step(travelDt>0?.3:.65,dt,14,target.reduced);
  if((travelDt>0||target.reduced)&&['x','y','size','radius'].every(key=>this[key].at(target[key],.08,.6))){
   this.intro=null;this.phase='field';this.elapsed=0;
  }
 }
 place(goal){this.phase='placing';this.goal={...goal};this.elapsed=0;this.flight=null;}
 fly(goal,waypoints){this.place(goal);this.flight=new PlacementFlight({x:this.x.value,y:this.y.value},waypoints,{x:this.x.velocity,y:this.y.velocity});}
 leave(goal){this.phase='leaving';this.goal={...goal};}
 cancel(){this.phase='menu';this.goal=null;this.flight=null;}
 adopt(){this.phase='field';this.goal=null;this.flight=null;this.elapsed=0;}
 hold(){this.held=true;}
 captureDrag(){this.dragAnchor={x:this.x.value,y:this.y.value,size:this.size.value};return {x:this.x.value,y:this.y.value};}
 releaseDrag(){this.dragAnchor=null;}
 press(){this.pressRemaining=.55;}
 release(){if(!this.held)return;this.held=false;for(const v of [this.x,this.y,this.size,this.radius])v.velocity=0;}
 step(dt,{x,y,size,radius,hover=false,dragging=false,expanded=false,selected=false,present=true,labelVisible=true,badgeVisible=true,planning=false,movementOmega=null,dragOmega=null,presenceOmega=null,reduced=false,time=0}){
  const retargeted=Math.hypot(x-this.connectionTarget.x,y-this.connectionTarget.y)>.1;
  this.connectionTarget={x,y};
  if(dragging||retargeted||this.intro||this.phase==='placing'||this.phase==='leaving'){
   this.connectionsMoving=true;this.connectionRest=0;
  }
  this.selection.step(this.pressRemaining>0?1:selected?.7:0,dt,18,reduced);
  this.pressRemaining=Math.max(0,this.pressRemaining-dt);
  if(this.intro){this.stepIntro(Math.max(0,dt),{x,y,size,radius,reduced});return;}
  const previousElapsed=this.elapsed;this.elapsed+=dt;
  const menu=this.phase==='menu',placing=this.phase==='placing',leaving=this.phase==='leaving';
  const goal=placing||leaving?this.goal:{x,y,size,radius};
  const omega=placing?MOTION.place:leaving?MOTION.menu:dragging?(dragOmega??MOTION.drag):this.next?MOTION.next:menu?MOTION.menu:movementOmega??(planning?MOTION.route:MOTION.field);
  this.float.step(menu||!placing&&!leaving&&!dragging&&!expanded?1:0,dt,12,reduced);
  const floating=!this.dragAnchor&&!placing&&!leaving&&!reduced?this.float.value:0;
  const bobX=menu?Math.sin(time*1.1+this.seed)*2*floating:0;
  const bobY=Math.sin(time*(menu?1.2:1.05)+this.seed)*(menu?2.5:1.6)*floating;
  if(!this.held&&(!this.dragAnchor||dragging)){
   if(placing&&this.flight){const p=this.flight.step(dt,reduced);this.x.value=p.x;this.y.value=p.y;this.x.velocity=p.vx;this.y.velocity=p.vy;}
   else{this.x.step(goal.x+bobX,dt,omega,reduced);this.y.step(goal.y+bobY,dt,omega,reduced);}
  }
  // Lift remains modest; the tile's centre is the transform origin, never its caption.
  const lift=this.next&&!present?.88:placing||leaving||expanded?1:dragging?1.035:hover?1.018:1;
  if(!this.held&&!this.dragAnchor){this.size.step(goal.size*lift,dt,omega,reduced);this.radius.step(goal.radius*lift,dt,omega,reduced);}
  // A reused next-plus travels while hidden; reveal only near its new slot.
  const nextReady=reduced||!this.next||Math.hypot(this.x.value-goal.x,this.y.value-goal.y)<size*.25&&Math.hypot(this.x.velocity,this.y.velocity)<size*1.5;
  const visible=!leaving&&present&&nextReady;
  this.alpha.step(visible?1:0,dt,presenceOmega??(this.next?(visible?MOTION.nextReveal:MOTION.nextHide):MOTION.effect),reduced);
  // Reveal accessories on the same clock as landing, with a soft stagger.
  // Clip only the portion before each delay so 30/60/120 Hz cross it identically.
  const onField=this.phase==='field';
  const revealDt=delay=>reduced?dt:Math.max(0,this.elapsed-Math.max(previousElapsed,delay));
  this.label.step(placing||leaving||this.next&&!visible||!labelVisible?0:1,onField?revealDt(MOTION.labelDelay):dt,presenceOmega??(this.next?MOTION.nextReveal:onField?MOTION.label:MOTION.effect),reduced);
  this.badge.step(onField&&badgeVisible?1:0,onField?revealDt(MOTION.badgeDelay):dt,presenceOmega??(onField?MOTION.badge:MOTION.effect),reduced);
  this.energy.step(placing?.65:dragging?.5:hover?.35:menu?.18:0,dt,14,reduced);
  // Ignore idle bob/hover, but wait for a real move to settle before reconnecting.
  if(this.connectionsMoving&&!dragging&&!placing&&!leaving){
   const resting=(this.held||Math.hypot(this.x.value-x,this.y.value-y)<2&&Math.hypot(this.x.velocity,this.y.velocity)<4)&&this.alpha.value>.98;
   this.connectionRest=resting?this.connectionRest+Math.max(0,dt):0;
   if(resting&&(reduced||this.connectionRest>=.12))this.connectionsMoving=false;
  }
 }
 arrived(){
  if(this.phase==='placing'&&this.flight)return this.flight.settled&&Math.hypot(this.x.value-this.goal.x,this.y.value-this.goal.y)<.3&&Math.hypot(this.x.velocity,this.y.velocity)<3&&this.size.at(this.goal.size,.08,1)&&this.radius.at(this.goal.radius,.08,1)&&this.label.value<.004;
  return this.phase==='placing'&&this.x.at(this.goal.x,MOTION.positionRest,MOTION.speedRest)&&this.y.at(this.goal.y,MOTION.positionRest,MOTION.speedRest)&&this.size.at(this.goal.size,.04,.3)&&this.radius.at(this.goal.radius,.04,.3)&&this.label.value<.004;
 }
}

// Geometry continuity is separate from DOM identity; a keyed owner adopts this state.
export class MotionRegistry {
 constructor(){this.zones=new Map();}
 get(zone,id,initial){let entries=this.zones.get(zone);if(!entries){entries=new Map();this.zones.set(zone,entries);}if(!entries.has(id))entries.set(id,new IconMotion(initial));return entries.get(id);}
 prune(active){for(const [zone,entries]of this.zones){for(const id of entries.keys())if(!active.get(zone)?.has(id))entries.delete(id);if(!entries.size)this.zones.delete(zone);}}
 clear(){this.zones.clear();}
}
