import {V5RevealJourney} from './journey-v5-route-layout.mjs';
import {V5MotionValue} from './journey-v5-inertia.mjs';

// A local task replay is a new authority run, not a new physical scene.
// Retain the outgoing presentation until the normal device handoff packs the row.
export class KdwTaskJourney extends V5RevealJourney{
 get targetPhoneMetrics(){
  const metrics=super.targetPhoneMetrics;
  return this.descriptor?.device?.asset?.assetId==='kdw.posts.phone'?{...metrics,width:metrics.width*1.2,height:metrics.height*1.2}:metrics;
 }
 // Progress may retain completed/skipped tasks after replaying an earlier one.
 // Admit them only when the displayed route has actually reached their slot.
 nodeAdmitted(node){
  const current=this.nodes.indexOf(this.current),index=this.nodes.indexOf(node);
  if(current>=0&&index>current)return false;
  return super.nodeAdmitted(node);
 }
 edges(){
  const admitted=new Set(this.visibleNodes.map(node=>node.step));
  return super.edges().filter(edge=>admitted.has(edge.a)&&admitted.has(edge.b));
 }
 prepareMissionRestart(){this.deferMissionRestart=true;}
 cancelMissionRestart(){this.deferMissionRestart=false;this.deferredMissionSnapshot=null;}
 commitMissionRestart(){const next=this.deferredMissionSnapshot;this.cancelMissionRestart();if(next)this.accept(next);}
 prepareTaskChange(type,taskId){
  if(this.taskChange||this.replayPending||this.handoff||this.startup||!['task','result'].includes(this.phase))return false;
  this.taskChange={type,taskId,runId:this.snapshot.state.runId};return true;
 }
 cancelTaskChange(){this.taskChange=null;}
 syncTaskNodes(){
  const s=this.snapshot.state,p=s.progress[s.missionId];
  this.session.completed=Object.entries(s.progress).filter(([id,p])=>p.completed?.length&&!p.skipped?.length&&p.currentTaskIndex>=this.content.missions.find(m=>m.id===id)?.steps.length).map(([id])=>id);
  for(const n of this.nodes){const v=this.snapshot.view.nodes.find(v=>v.nodeId===n.step);n.done=v?.completed===true;n.skipped=v?.skipped===true;n.answers=p?.answers?.[n.step]||[];if(n.step===s.taskId)n.stage=0;}
  this.reached[s.missionId]=this.snapshot.view.nodes.filter(n=>n.taskId&&(n.completed||n.skipped)).map(n=>n.nodeId);
  this.revision++;
 }
 accept(snapshot){
  const prior=this.snapshot?.state,next=snapshot?.state,intent=this.taskChange;
  const displayed=this.displaySnapshot,presentationKey=this.phoneContentKey;
  // Completing the displayed screen changes authority/input, not its pixels.
  // Do not re-key and fade that same screen out/in for the short result dwell.
  // In particular, this must not depend on the instruction having been painted:
  // native activities hide it, and delayed GPU readiness can miss that marker.
  const retainCompletion=next?.status==='result'&&['task','result'].includes(this.phase)&&
   ['task','result'].includes(displayed?.state.status)&&
   ['runId','missionId','taskId','screenId'].every(k=>next[k]===displayed.state[k])&&
   !snapshot.view.missing&&!displayed.view.missing&&
   !!snapshot.view.device?.asset?.path&&
   snapshot.view.device?.asset?.path===displayed.view.device?.asset?.path;
  if(this.deferMissionRestart&&prior&&next?.missionId===prior.missionId&&next.runId!==prior.runId){this.deferredMissionSnapshot=snapshot;return;}
  if(this.replayPending&&prior?.runId===next?.runId&&prior?.missionId===next?.missionId&&['task','result','completed','incomplete'].includes(next?.status)){
   // Ownership/timer/save snapshots may arrive before the outgoing device exits.
   this.snapshot=snapshot;this._pending=snapshot;return;
  }
  const replay=intent&&prior?.runId===intent.runId&&next?.runId===prior.runId+1&&prior.missionId===next.missionId&&
   (intent.type==='RESTART_TASK'?next.taskId===intent.taskId:prior.taskId===intent.taskId)&&['task','completed','incomplete'].includes(next.status);
  if(replay){
   this.taskChange=null;this.replayPending=true;this.snapshot=snapshot;this._pending=snapshot;
   this.session.task=null;this.contact=null;this.epoch++;this.presentedInstruction=null;this.resultPresentationKey=null;
   this.completionPoses=next.status==='task'?null:Object.fromEntries(Object.entries(this.capturePoses()).map(([id,p])=>[id,{worldX:p.worldX,worldY:p.worldY}]));
   this.handoff=next.status==='task'?{stage:'unlink',link:new V5MotionValue(1),trace:new V5MotionValue(0)}:null;
   this.change('phone-exit');return;
  }
  if(!prior||prior.runId!==next?.runId||prior.missionId!==next?.missionId||next?.status==='menu'){
   this.sceneRunId=next?.runId;this.taskChange=null;this.replayPending=false;
  }
  super.accept(snapshot);
  if(next?.status==='result'&&next.screenId==='business.platform.ready')this._displayView={...this._displayView,preserveAuthoredCompletion:true};
  if(retainCompletion){
   this.resultPresentationKey=presentationKey;
   this._displayView={...snapshot.view,instruction:displayed.view.instruction,preserveAuthoredCompletion:true};
  }
 }
 tick(dt,options){
  // The confirmation is a genuine result. Give it the same 800 ms visible
  // dwell as other results, starting after decoding/morphing, not the command.
  const confirmation=this.displayedState?.screenId==='business.platform.ready'&&this.displayedState?.status==='result'&&
   this.snapshot?.state.status==='result'&&this.snapshot.state.screenId===this.displayedState.screenId&&this.snapshot.state.runId===this.displayedState.runId;
  const key=confirmation?`${this.displayedState.sessionId}:${this.displayedState.runId}:${this.displayedState.taskId}:${this.displayedState.screenId}`:null;
  if(key!==this.confirmationKey){this.confirmationKey=key;this.confirmationVisibleMs=0;}
  if(confirmation){
   const visible=options.active!==false&&!options.busy&&!options.dragging&&options.deviceReady&&options.deviceShown;
   if(visible)this.confirmationVisibleMs+=Math.max(0,Math.min(.1,dt))*1000;
   if(this.confirmationVisibleMs<(this.snapshot.state.standPolicy?.value.max.timings.resultSeconds??.8)*1000)options={...options,busy:true};
   this._displayView={...this._displayView,preserveAuthoredCompletion:true};
  }
  super.tick(dt,options);
  if(this.replayPending&&this.displayedState?.runId===this.snapshot.state.runId){this.replayPending=false;this.syncTaskNodes();}
 }
}
