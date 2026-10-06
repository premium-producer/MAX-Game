import {v5Text} from './journey-v5-ui-copy.mjs';
import {RevealJourney, REVEAL_TIMING, REVEAL_ELEMENT_GAP, revealBurstDuration, revealLayout} from './journey-guided-reveal.mjs';
import {TASK_DEVICES} from './journey-media.mjs';

export const webglLayoutKey=(missionId,nodeId)=>`renderer:webgl:${missionId}:${nodeId}`;
const ICONS={'blogger.channel':'channel','blogger.comments':'comments','blogger.statistics':'statistics','digital-id.create-id':'id','digital-id.hotel':'hotel','digital-id.benefit':'benefit','digital-id.age':'age','communication.call':'call','communication.message':'message','communication.reaction':'reaction','communication.story':'story','business.sector':'sector','business.platform':'id','business.channel':'channel','business.bot':'bot','business.store':'store'};

/** Compatibility projection for the existing scene. No rules or progress live here. */
export function sharedRevealContent(catalog){
 return {edition:'shared',contentRevision:catalog.contentRevision,missions:Object.values(catalog.missions).map((m,index)=>({
  id:m.missionId,number:index+1,title:v5Text(m.title),description:m.test?'Тестовая миссия':'Возможности MAX',presentation:m.test,
  result:v5Text(m.completionText),missing:[...m.missing],qr:{...m.qr,image:catalog.assets[m.qr.assetId]?.path?`./${catalog.assets[m.qr.assetId].path}`:null},
  steps:m.taskIds.map(id=>({id,label:v5Text(catalog.tasks[id].title),iconId:ICONS[id]||'comments',requires:[]}))
 }))};
}

/** RevealJourney supplies geometry and motion targets only. SessionPort owns semantics. */
export class SharedRevealJourney extends RevealJourney{
 constructor(content,facade){
  super(content);this.facade=facade;this.snapshot=null;this._activeId=null;this._pending=null;this._displayView=null;this._displayState=null;this._layoutRevision=-1;
  this.session.screen='missions';if(facade.snapshot)this.accept(facade.snapshot);
 }
 get descriptor(){return this._displayView||this.snapshot?.view;}
 get displayedState(){return this._displayState||this.snapshot?.state;}
 get displaySnapshot(){return this.snapshot?{...this.snapshot,state:this.displayedState,view:this.descriptor}:null;}
 get steps(){return this.mission?.steps||[];}
 get nodes(){return [this.session.starts[this.session.mission],...(this.session.runs[this.session.mission]||[])].filter(Boolean);}
 get current(){return this.nodes.find(n=>n.step===this._activeId);}
 get activeId(){return this._activeId;}
 set activeId(id){this._activeId=id;}
 get next(){const ids=this.steps.map(s=>s.id),i=ids.indexOf(this._activeId);return this.steps[i+1];}
 get secondsLeft(){const s=this.snapshot?.state;if(s?.deadlineAt!==null&&Number.isFinite(s?.deadlineAt)&&Number.isFinite(this._clockNow))return Math.max(0,s.deadlineAt-(s.pausedAt??this._clockNow))/1000;return (this.facade?.snapshot?.view.remainingMs??this.snapshot?.view.remainingMs??180000)/1000;}
 get phoneMetrics(){
  const device=this.descriptor?.device;
  if(device?.kind==='pc')return TASK_DEVICES.pc;
  return device?.asset?.width===360?TASK_DEVICES.id:TASK_DEVICES.phone;
 }
 get phoneContentKey(){const s=this._displayState||this.snapshot?.state;return `${s?.runId}:${this._activeId}:${s?.screenId}:${s?.status}`;}
 needsBranch(){return false;}
 populate(){
  const id=this.session.mission;if(!id||!this.scanned[id])return;
  const positions=revealLayout(id,this.steps,this.geometry.width,this.geometry.height,(this.nodeWidth??240)+REVEAL_ELEMENT_GAP),old=this.nodes;
  const node=(step)=>{
   const retained=old.find(n=>n.step===step)||{step,stage:0,answers:[],done:false,freePosition:true};
   if(!this.manualNodes[id]?.includes(step)){retained.worldX=positions[step].x;retained.worldY=positions[step].y-this.geometry.height/2;}
   return retained;
  };
  this.session.starts[id]=node('open-max');this.session.runs[id]=this.steps.map(step=>node(step.id));
 }
 accept(snapshot){
  if(!snapshot?.state||!snapshot.view)throw new TypeError('Mission snapshot required');
  const prior=this.snapshot?.state,s=snapshot.state,changedContext=prior?.missionId!==s.missionId||prior?.runId!==s.runId;
  this.snapshot=snapshot;
  if(changedContext){
   this.contact=null;this.epoch++;this._pending=null;this._displayView=null;this._displayState=null;this._activeId=null;this._layoutRevision=-1;this.expired=false;this.session.task=null;
   // These are presentation caches, rebuilt from the confirmed run and layout.
   // A restarted scan must not retain the previous path or departing phone.
   this.session.runs={};this.session.starts={};this.session.plans={};this.session.briefs={};
   this.scanned={};this.reached={};this.manualNodes={};this.manualPhones={};this.remaining={};this.toolPosition=null;this.cancelled=false;
  }
  this.session.completed=Object.entries(s.progress).filter(([id,p])=>p.completed?.length&&!p.skipped?.length&&p.currentTaskIndex>=this.content.missions.find(m=>m.id===id)?.steps.length).map(([id])=>id);
  this.session.mission=s.missionId;this.session.screen=s.status==='menu'?'missions':'field';this.session.notice='';
  if(s.status==='menu'){this._displayView=snapshot.view;this._displayState=s;this.changeIf('menu');return;}
  if(s.status==='expired'){this.expired=true;this.changeIf('paused');return;}
  this.scanned[s.missionId]=s.scanned;this.populate();
  const p=s.progress[s.missionId];
  for(const n of this.nodes){const v=snapshot.view.nodes.find(v=>v.nodeId===n.step);n.done=v?.completed===true;n.skipped=v?.skipped===true;n.answers=p?.answers?.[n.step]||[];if(n.step===s.taskId)n.stage=0;}
  // Drag offsets belong to this presentation step, never to the saved mission layout.
  // Historical coordinates stay in storage for other renderers/older editions.
  this.reached[s.missionId]=snapshot.view.nodes.filter(n=>n.taskId&&(n.completed||n.skipped)).map(n=>n.nodeId);
  if(s.status==='scan'){this._displayView=snapshot.view;this._displayState=s;this.changeIf(this.contact!==null?'holding':'palm');return;}
  if(!changedContext&&prior?.status==='scan'&&s.scanned){this._activeId=s.taskId;this._displayView=snapshot.view;this._displayState=s;this.contact=null;this.change('burst');return;}
  if(!this._activeId){
   this._activeId=s.taskId;this._displayView=snapshot.view;this._displayState=s;
   this.change(['completed','incomplete'].includes(s.status)?'complete':'paused');return;
  }
  if(['completed','incomplete'].includes(s.status)||s.taskId!==this._activeId){
   this._pending=snapshot;this.session.task=null;if(this.phase!=='phone-exit')this.change('phone-exit');return;
  }
  this._displayView=snapshot.view;this._displayState=s;
  if(s.status==='result'&&['task','result'].includes(this.phase)){this.session.task=this._activeId;this.changeIf('result');}
  if(prior?.screenId!==s.screenId||prior?.revision!==s.revision)this.revision++;
 }
 changeIf(phase){if(this.phase!==phase)this.change(phase);}
 select(id){if(!this.content.missions.some(m=>m.id===id))return false;this.facade.command('SELECT_MISSION',{missionId:id});return true;}
 menu(){this.cancelContact();this.facade.command('RETURN_MENU');return true;}
 restart(){if(!this.mission)return Promise.resolve(null);this.cancelContact();return this.facade.restart?.()??this.facade.command('RESTART_MISSION');}
 reset(){this.cancelContact();this.facade.command('RESET_PROGRESS');return true;}
 start(){return false;}
 down(id){if(this.phase!=='palm'||this.contact!==null)return false;this.contact=id;this.change('holding');this.facade.contact(String(id),'down',true);return true;}
 up(id,inside=true){if(this.contact!==id)return false;this.facade.contact(String(id),'up',inside);this.contact=null;this.changeIf(this.phase==='holding'?'palm':this.phase);return true;}
 cancelContact(id=this.contact){if(this.contact===null||id!==this.contact)return false;this.facade.contact(String(id),'cancel',false);this.contact=null;this.changeIf(this.phase==='holding'?'palm':this.phase);return true;}
 moveContact(id,inside){if(id!==this.contact)return false;this.facade.contact(String(id),'move',inside);if(!inside){this.contact=null;this.changeIf('palm');}return true;}
 resume(step){if(this.phase!=='paused'||step&&step!==this._activeId)return false;this.epoch++;this.change('trace');return true;}
 answer(actionId,token=this.token()){
  if(this.phase!=='task'||this.facade.busy||token!==this.token()||!this.descriptor?.actions.some(a=>a.actionId===actionId&&a.disabled!==true))return false;
  this.facade.act(this.snapshot.state.screenId,actionId,this.snapshot.state.revision);return true;
 }
 token(){const s=this.snapshot?.state;return `${this.epoch}:${s?.runId}:${s?.taskId}:${s?.screenId}:${s?.revision}`;}
 close(){return false;}
 choose(){return false;}
 move(step,x,y){const n=this.nodes.find(n=>n.step===step);if(!n||!Number.isFinite(x)||!Number.isFinite(y))return false;n.worldX=x;n.worldY=y;const manual=this.manualNodes[this.session.mission]??=[];if(!manual.includes(step))manual.push(step);return true;}
 saveLayout(){return Promise.resolve(null);}
 persistLayout(){return this.saveLayout();}
 serialize(){return null;}
 routeParent(id){return this.snapshot?.view.edges.find(e=>e.to===id)?.from||'open-max';}
 edges(){
  if(['palm','holding','burst','arrange'].includes(this.phase))return [];
  const reached=this.reached[this.session.mission]||[];
  return (this.snapshot?.view.edges||[]).filter(e=>reached.includes(e.to)||e.to===this._activeId&&['trace','phone-enter','task','result','phone-exit'].includes(this.phase)).map(e=>({a:e.from,b:e.to,...(e.to===this._activeId&&this.phase==='trace'?{revealing:true}:{})}));
 }
 captionVisible(node){if(['palm','holding','burst','arrange'].includes(this.phase))return false;return node.step==='open-max'||node.step===this._activeId||(this.reached[this.session.mission]||[]).includes(node.step);}
 tick(dt,{settled=false,busy=false,dragging=false,active=true,reduced=false}={}){
  this._clockNow=this.facade.profile==='server'?this.facade.presentationTime:Date.now();
  if(!active){this.cancelContact();return;}
  if((this.phase==='holding'||!dragging&&!busy)&&['palm','holding','task','result'].includes(this.phase))this.facade.poll?.(this._clockNow,{pauseResult:this.phase!=='result'});
  if((dragging||busy)&&this.phase!=='holding')return;
  if(this.phase==='phone-exit'&&(this.manualNodes[this.session.mission]?.length||this.manualPhones[this.session.mission]))this.resetStepLayout();
  this.elapsed+=Math.max(0,Math.min(.1,dt));const due=t=>reduced||this.elapsed+1e-9>=t;
  const timing=this.revealTiming??REVEAL_TIMING;
  // Hold duration and result completion come exclusively from backend snapshots.
  if(this.phase==='burst'&&due(revealBurstDuration(this.nodes.length))&&settled)this.change('arrange');
  else if(this.phase==='arrange'&&due(timing.arrange)&&settled)this.change('trace');
  else if(this.phase==='trace'&&due(timing.trace)){this.reach(this._activeId);this.change('phone-enter');}
  else if(this.phase==='phone-enter'&&settled&&due(timing.phoneEnter)){this.session.task=this._activeId;this.change(this.snapshot.state.status==='result'?'result':'task');}
  else if(this.phase==='phone-exit'&&settled&&due(timing.phoneExit)&&this._pending){
   const next=this._pending;this._pending=null;this._activeId=next.state.taskId;this._displayView=next.view;this._displayState=next.state;this.session.task=null;
   this.change(['completed','incomplete'].includes(next.state.status)?'complete':'trace');
  }
 }
}
