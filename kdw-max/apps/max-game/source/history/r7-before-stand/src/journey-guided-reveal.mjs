import {GuidedJourney} from './journey-guided.mjs';
import {objects,isDone,reduce,restoreSession} from './journey-state.mjs';
import {isIdTask,ID_FLOW_VERSION} from './journey-id.mjs';
import {LINE_PHONE} from './journey-guided-line.mjs';
import {taskDevice} from './journey-media.mjs';

export const REVEAL_STORAGE='max-journey:guided-reveal:v1';
export const REVEAL_SESSION_SECONDS=180;
export function revealTimerLabel(seconds){const value=Math.max(0,Math.ceil(seconds));return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;}
export const REVEAL_TIMING=Object.freeze({hold:.8,firstFlight:.9,firstFollow:.78,stagger:.25,appear:.58,burstSettle:.25,arrange:.85,trace:1.2,phoneEnter:.8,phoneSettleGuard:4,result:.55,phoneExit:.75});
export const REVEAL_MOTION=Object.freeze({fieldOmega:7.5,cameraOmega:7.5,phoneOmega:8});
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
export const revealTracePresence=progress=>{const t=Math.max(0,Math.min(1,progress));return t*t*(3-2*t);};
export const revealLaunchInterval=()=>REVEAL_TIMING.stagger;
export const revealLaunchTime=index=>index===0?0:REVEAL_TIMING.firstFollow+(index-1)*REVEAL_TIMING.stagger;
export const revealFlightDuration=index=>index===0?REVEAL_TIMING.firstFlight:REVEAL_TIMING.appear;
export const revealBurstDuration=count=>revealLaunchTime(Math.max(0,count-1))+revealFlightDuration(Math.max(0,count-1))+REVEAL_TIMING.burstSettle;
export const revealArrangeEnd=count=>revealBurstDuration(count)+REVEAL_TIMING.arrange;
const TOOL={id:'business-tool',label:'Выбрать инструмент'};
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);

// Only used to identify untouched coordinates in v1 saves. Custom positions survive.
function legacyRevealLayout(mission,steps,width,height){
 const cx=width/2,cy=height/2,points={},at=(id,x,y)=>points[id]={x:cx+x,y:cy+y};
 if(mission==='blogger'){
  [['open-max',0,-250],['channel',300,-20],['comments',0,200],['statistics',-300,-20]].forEach(v=>at(...v));
 }else if(mission==='digital-id'){
  at('open-max',0,-315);at('create-id',0,-90);['hotel','benefit','age'].forEach((id,i)=>at(id,(i-1)*340,170));
 }else if(mission==='communication'){
  ['open-max',...steps.map(s=>s.id)].forEach((id,i)=>{const a=-Math.PI/2+i*Math.PI/3;at(id,Math.cos(a)*370,Math.sin(a)*240-25);});
 }else if(mission==='business'){
  at('open-max',0,-240);at('account',-260,100);at(steps.at(-1).id,260,100);
 }else{
  const ids=['open-max',...steps.map(s=>s.id)],cells=ids.length===3?[[0,-240],[-260,100],[260,100]]:[[-260,-220],[260,-220],[260,120],[-260,120]];
  ids.forEach((id,i)=>at(id,...cells[i]));
 }
 return points;
}

export const REVEAL_ELEMENT_GAP=400;
export const REVEAL_ROUTE_SPACING=240+REVEAL_ELEMENT_GAP;
export function revealLayout(mission,steps,width,height,spacing=REVEAL_ROUTE_SPACING){
 const ids=['open-max',...steps.map(s=>s.id)],start=Math.max(140,(width-(Math.min(ids.length,4)-1)*spacing)/2);
 return Object.fromEntries(ids.map((id,i)=>[id,{x:start+i*spacing,y:height/2}]));
}
export function revealRing(index,count,width){
 // MAX always rises vertically to the crown; the remaining icons fill the
 // left, lower and right sides of the palm composition.
 const radiusX=Math.min(380,Math.max(0,(width-160)/2));
 const angles=count===3?[ -90,135,45 ]:count===4?[-90,180,90,0]:count===5?[-90,-140,130,50,-40]:[-90,-140,130,90,50,-40];
 const angle=angles[index]*Math.PI/180;
 return {worldX:width/2+Math.cos(angle)*radiusX,worldY:Math.sin(angle)*260};
}
export function revealLaunchPoint(index,count,width){return index===0?{worldX:width/2,worldY:0}:{worldX:width/2+(index-(count-1)/2)*24,worldY:(index%2?1:-1)*12};}
// Quintic time has zero endpoint velocity/acceleration. IconMotion remains the pose owner.
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

// A phone occupies an insertion gap, never changes saved node coordinates.
export function revealPhoneLayout(nodes,active,width,height,manual=null,scrolling=false,device=LINE_PHONE,nodeWidth=240){
 const box=n=>({left:n.worldX-nodeWidth/2,right:n.worldX+nodeWidth/2});
 const gap=REVEAL_ELEMENT_GAP,activeBox=box(active),right=activeBox.right+gap+device.width/2;
 const side=scrolling||right+device.width/2+gap<=width?1:-1;
 const phone=manual||{x:side>0?right:activeBox.left-gap-device.width/2,y:height/2};
 const offsets={},affected=nodes.filter(n=>n!==active&&(side>0?box(n).right>activeBox.right:box(n).left<activeBox.left));
 const shift=side>0?Math.max(0,...affected.map(n=>phone.x+device.width/2+gap-box(n).left)):Math.min(0,...affected.map(n=>phone.x-device.width/2-gap-box(n).right));
 for(const n of nodes)offsets[n.step]=affected.includes(n)?shift:0;
 return {phone,side,offsets};
}

export class RevealJourney extends GuidedJourney{
 constructor(content,value){
  super(content);this.activeId=null;this.reached={};this.manualPhones={};this.manualNodes={};this.toolPosition=null;this.placeholder={step:TOOL.id,worldX:0,worldY:0,stage:0,done:false};this.geometry={width:1552,height:952};this.cancelled=false;this.remaining={};this.expired=false;
  let saved;try{saved=typeof value==='string'?JSON.parse(value):value;}catch{}
  if(saved?.revealVersion===1){
   for(const m of content.missions){const t=saved.remaining?.[m.id];if(Number.isFinite(t))this.remaining[m.id]=Math.max(0,Math.min(REVEAL_SESSION_SECONDS,t));}
   this.session=restoreSession(JSON.stringify({...saved.session,version:1}),content);this.scanned=saved.scanned||{};this.reached=saved.reached||{};
   for(const m of content.missions)for(const o of [this.session.starts[m.id],...(this.session.runs[m.id]||[])].filter(Boolean)){const p=saved.positions?.[m.id]?.[o.step];if(finite(p)){o.worldX=p.x;o.worldY=p.y;o.freePosition=true;}}
   for(const [m,positions]of Object.entries(saved.manualPhones||{})){this.manualPhones[m]={};for(const [id,p]of Object.entries(positions))if(finite(p))this.manualPhones[m][id]={x:p.x,y:p.y};}
   const p=saved.positions?.business?.[TOOL.id];if(finite(p))this.toolPosition=p;
   if(saved.layoutVersion===2)this.manualNodes=saved.manualNodes||{};
   else for(const m of content.missions){
    const steps=[...m.steps,...(m.branches?[m.branches.find(b=>b.id===this.session.branch)?.step||TOOL]:[])];
    const legacy=legacyRevealLayout(m.id,steps,0,0),positions=saved.positions?.[m.id]||{};
    const centres=Object.entries(positions).filter(([id,p])=>finite(p)&&legacy[id]&&Math.abs(p.y-legacy[id].y)<.01).map(([id,p])=>p.x-legacy[id].x);
    const centre=centres.find(x=>centres.filter(y=>Math.abs(x-y)<.01).length>=2);
    this.manualNodes[m.id]=Object.entries(positions).filter(([id,p])=>finite(p)&&(centre===undefined||!legacy[id]||Math.abs(p.x-centre-legacy[id].x)>.01||Math.abs(p.y-legacy[id].y)>.01)).map(([id])=>id);
   }
   const selected=saved.session?.mission;if(saved.session?.screen==='field'&&content.missions.some(m=>m.id===selected))this.select(selected);else this.session.screen='missions';
  }
 }
 get steps(){return [...super.steps,...(this.mission?.branches&&!this.session.branch?[TOOL]:[])];}
 get nodes(){return [...super.nodes,...(this.scanned[this.session.mission]&&this.mission?.branches&&!this.session.branch?[this.placeholder]:[])];}
 get current(){return this.nodes.find(n=>n.step===this.activeId);}
 get secondsLeft(){return this.remaining[this.session.mission]??REVEAL_SESSION_SECONDS;}
 get phoneMetrics(){return taskDevice(this.current);}
 get phoneContentKey(){const o=this.current;return `${this.session.mission}:${o?.step}:${o?.stage}:${o?.done}:${this.session.notice}:${this.phase==='paused'}`;}
 get next(){return this.steps.find(s=>s.id!==this.activeId&&!objects(this.session).some(n=>n.step===s.id&&n.done));}
 get phoneVisible(){return ['phone-enter','task','branch','result','phone-exit'].includes(this.phase);}
 get spread(){return ['trace','phone-enter','task','branch','result','phone-exit'].includes(this.phase);}
 get phone(){if(!this.current)return null;const layout=this.phoneLayout;return {x:layout.phone.x,y:layout.phone.y-this.geometry.height/2};}
 get phoneLayout(){return revealPhoneLayout(this.nodes,this.current,this.geometry.width,this.geometry.height,this.manualPhones[this.session.mission]?.[this.activeId],true,this.phoneMetrics,this.nodeWidth);}
 resetStepLayout(){
  const id=this.session.mission;
  delete this.manualNodes[id];delete this.manualPhones[id];
  if(id==='business')this.toolPosition=null;
  this.populate();this.revision++;
 }
 configure(width,height,nodeWidth=240){this.geometry={width,height};this.nodeWidth=nodeWidth;this.populate();}
 populate(){
  if(!this.scanned[this.session.mission])return;
  const points=revealLayout(this.session.mission,this.steps,this.geometry.width,this.geometry.height,(this.nodeWidth??240)+REVEAL_ELEMENT_GAP);
  const init=o=>{if(!this.manualNodes[this.session.mission]?.includes(o.step)||!Number.isFinite(o.worldX)||!Number.isFinite(o.worldY)){o.worldX=points[o.step].x;o.worldY=points[o.step].y-this.geometry.height/2;}o.freePosition=true;};
  this.session.starts[this.session.mission]??={step:'open-max',x:.5,y:.5};init(this.session.starts[this.session.mission]);
  for(const step of super.steps){if(!objects(this.session).some(n=>n.step===step.id))this.session.runs[this.session.mission].push({step:step.id,x:.5,y:.5,stage:0,answers:[],done:false,...(isIdTask(step.id)?{idFlowVersion:ID_FLOW_VERSION}:{})});}
  objects(this.session).forEach(init);
  if(points[TOOL.id]){if(this.manualNodes.business?.includes(TOOL.id)&&this.toolPosition)Object.assign(this.placeholder,{worldX:this.toolPosition.x,worldY:this.toolPosition.y});else init(this.placeholder);this.placeholder.freePosition=true;}
 }
 select(id){
  if(!this.content.missions.some(m=>m.id===id))return false;
  this.cancelContact();this.epoch++;this.cancelled=false;this.placeholder={step:TOOL.id,worldX:0,worldY:0,stage:0,done:false};
  this.expired=false;if(!(this.remaining[id]>0))this.remaining[id]=REVEAL_SESSION_SECONDS;
  this.session={...this.session,screen:'field',mission:id,task:null,picker:null,notice:''};this.session.runs[id]??=[];this.session.plans[id]='playing';
  this.populate();this.activeId=this.steps.find(s=>!objects(this.session).some(n=>n.step===s.id&&n.done))?.id;
  this.change(isDone(this.session,this.content)?'complete':this.scanned[id]?'paused':'palm');return true;
 }
 start(){return false;}
 restart(){
  const id=this.session.mission;if(this.session.screen!=='field'||!this.mission)return false;
  for(const data of [this.session.runs,this.session.starts,this.session.plans,this.session.briefs,this.scanned,this.reached,this.manualNodes,this.manualPhones,this.remaining])delete data[id];
  this.session.completed=this.session.completed.filter(m=>m!==id);
  if(this.mission.branches){this.session.branch=null;this.session.branchChosen=false;this.toolPosition=null;}
  return this.select(id);
 }
 ensureNext(){return null;}
 pose(node){
  const {width}=this.geometry,i=this.nodes.indexOf(node),count=this.nodes.length,ring=revealRing(i,count,width);
  if(!this.manualNodes[this.session.mission]?.includes(node.step)){
   if(this.phase==='burst'){
    const time=this.elapsed,start=revealLaunchTime(i),landing=start+revealFlightDuration(i);
    if(time<=landing)return revealArc(revealLaunchPoint(i,count,width),ring,(time-start)/revealFlightDuration(i),0);
    // Landed icons remain gently alive while later icons are still flying.
    // The drift fades to zero before the settled gate and the circle hold.
    const drift=6*smooth((time-landing)/.16)*smooth((revealBurstDuration(count)-time)/.22);
    return {worldX:ring.worldX+Math.cos(time*3+i*1.9)*drift,worldY:ring.worldY+Math.sin(time*2.4+i*1.3)*drift};
   }
   if(this.phase==='arrange'){
    const t=this.elapsed/REVEAL_TIMING.arrange;
    // Clear the ring along the established arcs before spreading the row farther.
    const compact=revealLayout(this.session.mission,this.steps,width,this.geometry.height,400)[node.step];
    const goal={worldX:compact.x,worldY:node.worldY};
    const pose=i===0?revealMaxArc(ring,goal,t):revealArc(ring,goal,t,Math.max(110,Math.min(150,Math.abs(ring.worldY)*.62)));
    pose.worldX+=(node.worldX-goal.worldX)*smooth((t-.6)/.4);
    return pose;
   }
  }
  return {...node,worldX:node.worldX+(this.spread?this.phoneLayout.offsets[node.step]||0:0)};
 }
 presence(node){if(this.phase!=='burst')return 1;const i=this.nodes.indexOf(node);return smooth((this.elapsed-revealLaunchTime(i))/Math.min(.28,revealFlightDuration(i)));}
 captionVisible(node){
  if(['palm','holding','burst','arrange'].includes(this.phase))return false;
  const reached=this.reached[this.session.mission]||[];
  return node.step==='open-max'?reached.length>0:reached.includes(node.step);
 }
 routeParent(step){const index=this.steps.findIndex(s=>s.id===step);return index>0?this.steps[index-1].id:'open-max';}
 edges(){
  const edges=this.steps.filter(s=>(this.reached[this.session.mission]||[]).includes(s.id)).map(s=>({a:this.routeParent(s.id),b:s.id}));
  if(this.phase==='trace'&&this.current&&!edges.some(e=>e.b===this.activeId))edges.push({a:this.routeParent(this.activeId),b:this.activeId,revealing:true});
  return edges;
 }
 reach(id){const reached=this.reached[this.session.mission]??=[];if(id&&!reached.includes(id))reached.push(id);}
 movePhone(x,y){if(!this.current||!Number.isFinite(x)||!Number.isFinite(y))return false;(this.manualPhones[this.session.mission]??={})[this.activeId]={x,y:y+this.geometry.height/2};return true;}
 move(step,x,y){const ok=super.move(step,x,y);if(ok){const ids=this.manualNodes[this.session.mission]??=[];if(!ids.includes(step))ids.push(step);if(step===TOOL.id)this.toolPosition={x,y};}return ok;}
 choose(branch){
  if(this.phase!=='branch'||!this.mission.branches.some(b=>b.id===branch))return false;
  const slot={x:this.placeholder.worldX,y:this.placeholder.worldY};this.session.branch=branch;this.session.branchChosen=true;this.populate();
  const node=objects(this.session).find(n=>n.step===this.mission.branches.find(b=>b.id===branch).step.id);node.worldX=slot.x;node.worldY=slot.y;
  const reached=this.reached[this.session.mission]||[];this.reached[this.session.mission]=reached.map(id=>id===TOOL.id?node.step:id);
  const manual=this.manualPhones[this.session.mission]?.[TOOL.id];if(manual)this.manualPhones[this.session.mission][node.step]=manual;
  const ids=this.manualNodes[this.session.mission];if(ids?.includes(TOOL.id))this.manualNodes[this.session.mission]=ids.map(id=>id===TOOL.id?node.step:id);
  this.activeId=node.step;this.session.task=node.step;this.epoch++;this.change('task');return true;
 }
 answer(choice,token=this.token()){
  if(this.phase!=='task'||token!==this.token())return false;
  const step=this.activeId,next=reduce(this.session,{type:'ANSWER',choice},this.content);if(next===this.session)return false;
  this.session=next;this.session.task=step;this.revision++;if(this.current.done)this.change('result');return true;
 }
 close(){
  // This edition only exits a task through a confirmed answer or explicit navigation.
  return false;
 }
 resume(step){if(this.phase!=='paused'||step&&step!==this.activeId)return false;this.cancelled=false;this.epoch++;this.change('trace');return true;}
 tick(dt,{settled=false,busy=false,dragging=false,active=true,reduced=false}={}){
  if(!active){this.cancelContact();return;}
  if(this.session.screen==='field'&&this.phase!=='complete'&&!this.expired){
   this.remaining[this.session.mission]=Math.max(0,this.secondsLeft-(Number.isFinite(dt)?Math.max(0,dt):0));
   if(this.secondsLeft===0){this.expired=true;this.menu();return;}
  }
  if((dragging||busy)&&this.phase!=='holding')return;
  const delta=Math.max(0,Math.min(.1,dt));this.elapsed+=delta;const due=t=>reduced||this.elapsed+1e-9>=t;
  if(this.phase==='holding'){
   if(this.elapsed+1e-9>=REVEAL_TIMING.hold){this.contact=null;this.scanned[this.session.mission]=true;this.populate();this.activeId=this.steps[0].id;this.change('burst');}return;
  }
  if(this.phase==='burst'&&due(revealBurstDuration(this.nodes.length))&&settled)this.change('arrange');
  else if(this.phase==='arrange'&&due(REVEAL_TIMING.arrange)&&settled)this.change('trace');
  else if(this.phase==='trace'&&due(REVEAL_TIMING.trace)){this.reach(this.activeId);this.change('phone-enter');}
  else if(this.phase==='phone-enter'&&(settled||due(REVEAL_TIMING.phoneSettleGuard))&&due(REVEAL_TIMING.phoneEnter)){this.session.task=this.activeId===TOOL.id?'guided-business-choice':this.activeId;this.change(this.activeId===TOOL.id?'branch':'task');}
  else if(this.phase==='result'&&due(REVEAL_TIMING.result)){this.session.task=null;this.resetStepLayout();this.change('phone-exit');}
  else if(this.phase==='phone-exit'&&settled&&due(REVEAL_TIMING.phoneExit)){
   if(isDone(this.session,this.content))this.change('complete');
   else{this.activeId=this.steps.find(s=>!objects(this.session).some(n=>n.step===s.id&&n.done)).id;this.change(this.cancelled?'paused':'trace');}
  }
 }
 serialize(){const saved=JSON.parse(super.serialize());if(this.toolPosition)(saved.positions.business??={})[TOOL.id]=this.toolPosition;return JSON.stringify({...saved,revealVersion:1,layoutVersion:2,manualNodes:this.manualNodes,reached:this.reached,manualPhones:this.manualPhones,remaining:this.remaining});}
}
