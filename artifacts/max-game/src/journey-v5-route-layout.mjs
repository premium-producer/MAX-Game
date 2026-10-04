import {SharedRevealJourney} from './journey-shared-reveal.mjs';
import {REVEAL_ELEMENT_GAP,revealLayout} from './journey-guided-reveal.mjs';
import {sine} from 'maath/easing/dist/maath-easing.esm.js';
import {v5DeviceMetrics} from './journey-v5-device-morph.mjs';
import {V5MotionValue} from './journey-v5-inertia.mjs';
import {V5_MOTION} from './journey-v5-motion-profile.mjs';
import {V5PathBatch} from './journey-v5-path.mjs';

export function v5MissionFinished(snapshot){
 const s=snapshot?.state;
 return ['completed','incomplete'].includes(s?.status)||s?.status==='result'&&snapshot.view.nodes.filter(n=>n.taskId).every(n=>n.completed||n.skipped);
}

// CSS Flexbox owns packing/alignment. This adapter only reads its measured centres.
export function createV5RouteMeasure(arena){
 const row=arena.ownerDocument.createElement('div');
 row.setAttribute('aria-hidden','true');row.inert=true;
 Object.assign(row.style,{position:'absolute',left:'0',top:'0',visibility:'hidden',pointerEvents:'none',display:'flex',flexDirection:'row',flexWrap:'nowrap',alignItems:'center',gap:`${REVEAL_ELEMENT_GAP}px`,width:'max-content'});
 arena.append(row);let stamp='',measured;
 return (nodes,active,device,nodeWidth)=>{
  const key=JSON.stringify([nodes.map(n=>n.step),active.step,device.width,device.height,nodeWidth]);
  if(key===stamp)return measured;
  const parts=[],elements=new Map();let phone;
  const cell=(width,height)=>{
   const el=arena.ownerDocument.createElement('div');
   Object.assign(el.style,{flex:'none',width:`${width}px`,height:`${height}px`});parts.push(el);return el;
  };
  for(const node of nodes){elements.set(node.step,cell(nodeWidth,nodeWidth));if(node===active)phone=cell(device.width,device.height);}
  row.replaceChildren(...parts);
  if(!phone)throw Error('V5 route has no active phone slot');
  const x=phone.offsetLeft+phone.offsetWidth/2,y=phone.offsetTop+phone.offsetHeight/2;
  measured=Object.fromEntries([...elements].map(([id,el])=>[id,{x:el.offsetLeft+el.offsetWidth/2-x,y:el.offsetTop+el.offsetHeight/2-y}]));
  stamp=key;return measured;
 };
}

// Presentation-only: confirmed answers, timer and progress remain in SessionPort.
export class V5RevealJourney extends SharedRevealJourney{
 constructor(content,facade,measureRow){super(content,facade);this.measureRow=measureRow;}
 get nodes(){const nodes=super.nodes;return nodes.length?nodes:this.startup?.nodes??[];}
 get current(){return super.current??(this.startup?this.nodes[1]:null);}
 get startupLogo(){return !!this.startup&&this.startup.stage!=='content';}
 get startupContentPresence(){return this.startup?.logo.value??1;}
 get startupKey(){return `startup:${this.snapshot?.state.runId}:${this.startup?.serial}`;}
 startStartup(device=this.previewDevice?.()){
  const layout=revealLayout(this.session.mission,this.steps,this.geometry.width,this.geometry.height,(this.nodeWidth??240)+REVEAL_ELEMENT_GAP);
  const nodes=['open-max',...this.steps.map(s=>s.id)].map(step=>({step,worldX:layout[step].x,worldY:layout[step].y-this.geometry.height/2,done:false,stage:0,answers:[]}));
  this.startup={stage:'shell',nodes,serial:this.startupSerial=(this.startupSerial??0)+1,logo:new V5MotionValue(0),fan:new V5MotionValue(0)};
  this.phoneAnchor=this.previewPhoneAnchor?.()??{x:this.geometry.width/2,y:0};
  this.presentedDevice=v5DeviceMetrics();
  const from=Object.fromEntries(this.nodes.map(n=>{const p=this.rowPose(n);return [n.step,{...p,worldY:p.worldY+64}];}));
  this.beginPaths(from,V5_MOTION.startupPath);
 }
 capturePoses(){return Object.fromEntries(this.nodes.map(n=>[n.step,this.readMotionPose?.(n)??this.pose(n)]));}
 beginPaths(from,profile){this.paths=new V5PathBatch(from,this.nodes.map(n=>this.rowPose(n)),profile);}
 change(phase){
  if(phase==='burst'&&this.startup){super.change('arrange');return;}
  if(this.startup&&['holding','palm'].includes(phase)){super.change(phase);return;}
  const from=phase==='arrange'?this.capturePoses():null;
  this.paths=null;super.change(phase);
  if(from)this.beginPaths(from,V5_MOTION.introPath);
 }
 configure(...args){
  if(args[0]===this.geometry.width&&args[1]===this.geometry.height&&(args[2]??240)===this.nodeWidth)return;
  const profile=this.paths&&(this.startup?V5_MOTION.startupPath:this.phase==='arrange'?V5_MOTION.introPath:V5_MOTION.repackPath),from=profile&&this.capturePoses();
  super.configure(...args);
  if(from)this.beginPaths(from,profile);
 }
 get targetPhoneMetrics(){return v5DeviceMetrics({...this.descriptor?.device,actions:this.descriptor?.actions});}
 get phoneMetrics(){return this.presentedDevice??this.targetPhoneMetrics;}
 get phoneVisible(){return !!this.startup||!!this.handoff||super.phoneVisible;}
 get spread(){return !!this.startup||this.phase==='arrange'||!!this.handoff||super.spread;}
 get revealTiming(){return {arrange:0,trace:V5_MOTION.traceSeconds,phoneEnter:0,phoneExit:0};}
 get deviceVisibilityTarget(){return this.startup?1:this.handoff?Number(['unlink','enter','link'].includes(this.handoff.stage)):Number(super.phoneVisible&&this.phase!=='phone-exit');}
 get deviceLinkPresence(){return this.startup?Number(['fan','content'].includes(this.startup.stage)):this.handoff?this.handoff.link.value:1;}
 get deviceLinkReveal(){return this.startup?this.startup.fan.value:this.handoff?.stage==='link'?this.handoff.link.value:null;}
 accept(snapshot){
  const prior=this.snapshot?.state,next=snapshot?.state;
  if(prior?.runId!==next?.runId||prior?.missionId!==next?.missionId||next?.status==='menu'){
   this.phoneAnchor=null;this.phoneAnchorManual=false;this.completionPoses=null;this.presentedDevice=null;this.handoff=null;this.paths=null;this.startup=null;
  }else if(!this.completionPoses&&v5MissionFinished(snapshot)){
   this.completionPoses=Object.fromEntries(this.nodes.map(n=>{const p=this.readCompletionPose?.(n)??this.pose(n);return [n.step,{worldX:p.worldX,worldY:p.worldY}];}));
  }
  // Repack only after a confirmed answer; final completion keeps the actual row.
  if(!this.completionPoses&&prior?.status==='task'&&next?.revision>prior.revision&&prior.runId===next.runId&&
    next.status==='task'&&prior.screenId!==next.screenId&&this.manualNodes[this.session.mission]?.length){
   delete this.manualNodes[this.session.mission];
  }
  if(prior?.status==='scan'&&next?.scanned&&!this.startup)this.startStartup(snapshot.view.device);
  const advanceTask=!this.startup&&this.phoneVisible&&prior?.runId===next?.runId&&prior?.missionId===next?.missionId&&next?.status==='task'&&prior?.taskId!==next?.taskId;
  super.accept(snapshot);
  if(advanceTask&&this._pending&&!this.handoff){
   this.handoff={stage:'unlink',link:new V5MotionValue(1),trace:new V5MotionValue(0)};
  }
 }
 edges(){
  if(this.startup&&['shell','row'].includes(this.startup.stage))return [];
  const edges=super.edges(),h=this.handoff;
  if(!h||['unlink','exit'].includes(h.stage))return edges;
  return edges.filter(e=>e.b!==this.activeId||h.stage!=='pack').map(e=>e.b===this.activeId?{...e,reveal:h.trace.value}:e);
 }
 tick(dt,options={}){
  if(this.startup){this.tickStartup(dt,options);return;}
  if(this.paths){
   const wasDone=this.paths.done,advance=options.active!==false&&!options.dragging&&!options.busy&&dt>0;
   if(advance)this.paths.tick(dt,options.reduced);
   // settled belongs to the previous prepared frame, not the new target.
   options={...options,settled:options.settled&&advance&&(wasDone||options.reduced===true)};
  }
  const h=this.handoff;if(!h)return super.tick(dt,options);
  if(options.active===false||options.dragging||options.busy||!(dt>0))return;
  const reduced=options.reduced??false;
  const settle=(motion,target)=>{motion.step(target,Math.min(dt,.05),V5_MOTION.presenceOmega,reduced);if(!motion.at(target,V5_MOTION.presenceDistance,V5_MOTION.presenceSpeed))return false;motion.value=target;motion.velocity=0;return true;};
  if(h.stage==='unlink'){
   if(settle(h.link,0)){h.stage='exit';this.revision++;}
  }else if(h.stage==='exit'){
   if(options.deviceHidden!==true)return;
   const next=this._pending;if(!next)return;
   const from=this.capturePoses();
   this._pending=null;this._activeId=next.state.taskId;this._displayView=next.view;this._displayState=next.state;
   this.presentedDevice={...this.targetPhoneMetrics};this.resetStepLayout();
   h.stage='pack';this.change('repack');
   this.beginPaths(from,V5_MOTION.repackPath);
  }else if(h.stage==='pack'){
   if(options.settled){h.stage='trace';this.change('trace');}
  }else if(h.stage==='trace'){
   if(settle(h.trace,1)&&options.deviceReady===true){this.reach(this.activeId);h.stage='enter';this.change('phone-enter');}
  }else if(h.stage==='enter'){
   if(options.settled&&options.deviceReady===true){h.stage='link';this.revision++;}
  }else if(settle(h.link,1)){
   this.handoff=null;this.session.task=this.activeId;this.change(this.snapshot.state.status==='result'?'result':'task');
  }
 }
 tickStartup(dt,options){
  if(options.active===false){this.cancelContact();return;}
  const s=this.startup;if(!s)return;
  if(!(dt>0)||options.busy||options.dragging)return;
  const delta=Math.min(dt,.05),reduced=options.reduced===true;
  if(s.stage==='shell'){
   // The persistent shell must be visible before either logo or icons enter.
   // Icon settlement is deliberately excluded: their groups do not exist yet.
   if(options.deviceShown===true&&options.deviceReady===true){s.stage='row';this.revision++;}
   return;
  }
  s.logo.step(1,delta,V5_MOTION.presenceOmega,reduced);
  if(s.stage==='row'){
   const done=this.paths?.done;this.paths?.tick(delta,reduced);
   if(this.snapshot.state.scanned&&(done||reduced)&&options.settled&&options.deviceReady){s.stage='trace';this.change('trace');}
  }else if(s.stage==='trace'){
   this.elapsed+=delta;
   if(reduced||this.elapsed>=V5_MOTION.traceSeconds){this.reach(this.activeId);s.stage='fan';this.change('phone-enter');}
  }else if(s.stage==='fan'){
   s.fan.step(1,delta,V5_MOTION.presenceOmega,reduced);
   if(s.fan.at(1,.005,.05)){s.fan.value=1;s.stage='content';this.revision++;}
  }else if(options.deviceReady&&options.settled){
   this.presentedDevice={...this.targetPhoneMetrics};
   this.startup=null;this.session.task=this.activeId;this.change(this.snapshot.state.status==='result'?'result':'task');
  }
 }
 presence(node){
  if(!this.startup)return super.presence(node);
  if(this.startup.stage==='shell')return 0;
  const path=this.paths?.paths.get(node.step);
  const appearance=path?sine.inOut(Math.max(0,Math.min(1,(this.paths.elapsed-path.delay)/.3))):1;
  return appearance;
 }
 captionVisible(node){return this.startup?this.presence(node)>.8:super.captionVisible(node);}
 resetStepLayout(){if(!this.completionPoses)super.resetStepLayout();}
 get phoneLayout(){
  if(!this.measureRow||!this.current)return super.phoneLayout;
  if(!this.phoneAnchor){const initial=super.phoneLayout.phone;this.phoneAnchor={x:initial.x,y:initial.y-this.geometry.height/2};}
  const phone={x:this.phoneAnchor.x,y:this.phoneAnchor.y+this.geometry.height/2};
  const row=this.measureRow(this.nodes,this.current,this.phoneMetrics,this.nodeWidth??240),offsets={},nodeY={};
  for(const node of this.nodes){
   const manual=this.manualNodes[this.session.mission]?.includes(node.step);
   offsets[node.step]=manual?0:phone.x+row[node.step].x-node.worldX;
   // Guided icon geometry places its row 100px above the device's centre.
   nodeY[node.step]=manual?node.worldY:this.phoneAnchor.y+row[node.step].y+100;
  }
  return {phone,side:1,offsets,nodeY};
 }
 pose(node){
  if(this.completionPoses?.[node.step])return {...node,...this.completionPoses[node.step]};
  const path=this.paths?.pose(node.step);if(path)return {...node,...path};
  if(!this.spread)return super.pose(node);
  return this.rowPose(node);
 }
 rowPose(node){
  const layout=this.phoneLayout;
  return {...node,worldX:node.worldX+layout.offsets[node.step],worldY:layout.nodeY?.[node.step]??node.worldY};
 }
 move(step,x,y){const moved=super.move(step,x,y);if(moved)this.paths?.paths.delete(step);return moved;}
 movePhone(x,y){
  if(!super.movePhone(x,y))return false;
  this.paths=null;
  this.phoneAnchor={x,y};this.phoneAnchorManual=true;return true;
 }
}
