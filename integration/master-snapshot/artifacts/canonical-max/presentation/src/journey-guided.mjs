import {freshSession,reduce,restoreSession,objects,stepsFor,isDone} from './journey-state.mjs';
import {ID_FLOW_VERSION,isIdTask} from './journey-id.mjs';

export const GUIDED_STORAGE='max-journey:guided:v1';
export const GUIDED_TIMING=Object.freeze({hold:.8,open:.5,result:.8});
export const GUIDED_METRICS=Object.freeze({tile:128,palm:160,label:240,step:320,body:32,title:48,small:24});
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
export function nextGuidedPosition(nodes,widths={}){
 const x=nodes.length?Math.max(...nodes.map(n=>finite(n.worldX)+(widths[n.step]||240)/2))+200:0;
 return {worldX:x,worldY:0};
}
export function guidedCameraTarget(node,width){return finite(node?.worldX)-Math.min(width*.68,width-180);}
export function guidedEdges(nodes,mission){
 // ID applications demonstrate independent functions of the created ID.
 return nodes.slice(1).map((node,i)=>({a:mission==='digital-id'&&i>0?'create-id':nodes[i].step,b:node.step}));
}

/** Pure event/clock controller. Persist logical work, never pending callbacks or phases. */
export class GuidedJourney{
 constructor(content,value=null){
  this.content=content;this.session=freshSession();this.scanned={};this.phase='menu';this.elapsed=0;this.contact=null;this.revision=0;this.epoch=0;
  if(value){try{
   const saved=typeof value==='string'?JSON.parse(value):value;
   if(saved.guidedVersion!==1)return;
   this.session=restoreSession(JSON.stringify({...saved.session,version:1}),content);
   for(const m of content.missions){
    this.scanned[m.id]=saved.scanned?.[m.id]===true;
    const all=[this.session.starts[m.id],...(this.session.runs[m.id]||[])].filter(Boolean);
    for(const [index,o]of all.entries()){
     const p=saved.positions?.[m.id]?.[o.step];o.worldX=finite(p?.x,index*320);o.worldY=finite(p?.y);o.freePosition=true;
    }
   }
   if(saved.session.screen==='field'&&content.missions.some(m=>m.id===saved.session.mission))this.select(saved.session.mission);
   else this.session.screen='missions';
  }catch{/* A malformed guided save never consumes another edition's progress. */}}
 }
 get mission(){return this.content.missions.find(m=>m.id===this.session.mission);}
 get nodes(){return [this.session.starts[this.session.mission],...objects(this.session)].filter(Boolean);}
 get current(){return objects(this.session).find(o=>!o.done)||objects(this.session).at(-1);}
 get steps(){return stepsFor(this.content,this.session.mission,this.session.branch);}
 change(phase){this.phase=phase;this.elapsed=0;this.revision++;}
 select(id){
  if(!this.content.missions.some(m=>m.id===id))return false;
  this.cancelContact();this.epoch++;this.session={...this.session,screen:'field',mission:id,task:null,picker:null,notice:''};
  this.session.runs[id]??=[];this.session.plans[id]='playing';
  if(isDone(this.session,this.content))this.change('complete');
  else if(this.scanned[id]){this.ensureNext();this.change(this.needsBranch()?'branch-paused':'paused');}
  else this.change(this.session.starts[id]?'palm':'start');
  return true;
 }
 menu(){this.cancelContact();this.epoch++;this.session.screen='missions';this.session.task=null;this.change('menu');}
 start(){
  if(this.phase!=='start')return false;
  this.session.starts[this.session.mission]={step:'open-max',x:0,y:.5,worldX:0,worldY:0,freePosition:true};
  this.change('intro');return true;
 }
 needsBranch(){return !!this.mission?.branches&&!this.session.branch&&objects(this.session).some(o=>o.step==='account'&&o.done);}
 ensureNext(){
  const step=this.steps.find(step=>!objects(this.session).some(o=>o.step===step.id&&o.done));
  if(!step||objects(this.session).some(o=>o.step===step.id))return null;
  const position=nextGuidedPosition(this.nodes);if(this.nodes.length===1)position.worldX+=320;
  const o={step:step.id,x:0,y:.5,...position,stage:0,answers:[],done:false,freePosition:true,...(isIdTask(step.id)?{idFlowVersion:ID_FLOW_VERSION}:{})};
  this.session.runs[this.session.mission].push(o);return o;
 }
 down(id){if(this.phase!=='palm'||this.contact!==null)return false;this.contact=id;this.change('holding');return true;}
 cancelContact(id=this.contact){if(this.contact!==id)return false;this.contact=null;if(this.phase==='holding')this.change('palm');return true;}
 moveContact(id,inside){if(id===this.contact&&!inside)this.cancelContact(id);}
 close(){
  if(!['opening','task','result','delay','reveal','branch'].includes(this.phase))return false;
  this.session.task=null;this.epoch++;this.change(isDone(this.session,this.content)?'complete':this.needsBranch()?'branch-paused':'paused');return true;
 }
 resume(step){
  if(!['paused','branch-paused'].includes(this.phase))return false;
  if(this.needsBranch()){this.session.task='guided-business-choice';this.change('branch');return true;}
  const previous=this.current;if(step&&step!==previous?.step)return false;
  const added=this.ensureNext();if(added){this.change('reveal');return true;}
  const o=this.current;if(!o||o.done)return false;
  this.session.task=o.step;this.change('opening');return true;
 }
 answer(choice,token=this.token()){
  if(this.phase!=='task'||token!==this.token())return false;
  const step=this.session.task,next=reduce(this.session,{type:'ANSWER',choice},this.content);
  if(next===this.session)return false;
  this.session=next;this.session.task=step;this.revision++;
  if(objects(next).find(o=>o.step===step)?.done)this.change('result');
  return true;
 }
 token(){const o=objects(this.session).find(o=>o.step===this.session.task);return `${this.epoch}:${this.session.mission}:${this.session.task}:${o?.stage}`;}
 choose(branch){
  if(this.phase!=='branch'||!this.mission.branches.some(b=>b.id===branch))return false;
  this.session.branch=branch;this.session.branchChosen=true;this.session.task=null;this.change('exit');return true;
 }
 move(step,x,y){const o=this.nodes.find(o=>o.step===step);if(!o||!Number.isFinite(x)||!Number.isFinite(y))return false;o.worldX=x;o.worldY=y;o.freePosition=true;return true;}
 tick(dt,{settled=false,busy=false,dragging=false,active=true}={}){
  if(!active){this.cancelContact();return;}
  const delta=Math.max(0,Math.min(.1,dt));
  if(this.phase==='holding'){
   this.elapsed+=delta;
   if(this.elapsed+1e-9>=GUIDED_TIMING.hold){this.contact=null;this.scanned[this.session.mission]=true;this.ensureNext();this.change('reveal');}
   return;
  }
  if(dragging||busy)return;
  if(this.phase==='intro'&&settled)this.change('palm');
  else if(this.phase==='reveal'&&settled)this.change('delay');
  else if(this.phase==='delay'){
   if(!settled){this.change('reveal');return;}
   this.elapsed+=delta;if(this.elapsed+1e-9>=GUIDED_TIMING.open){this.session.task=this.current.step;this.change('opening');}
  }else if(this.phase==='opening')this.change('task');
  else if(this.phase==='result'){
   this.elapsed+=delta;if(this.elapsed+1e-9>=GUIDED_TIMING.result){this.session.task=null;this.change('exit');}
  }else if(this.phase==='exit'){
   if(this.needsBranch()){this.session.task='guided-business-choice';this.change('branch');}
   else if(isDone(this.session,this.content))this.change('complete');
   else{this.ensureNext();this.change('reveal');}
  }
 }
 serialize(){
  const positions={};for(const m of this.content.missions){positions[m.id]={};for(const o of [this.session.starts[m.id],...(this.session.runs[m.id]||[])].filter(Boolean))positions[m.id][o.step]={x:o.worldX,y:o.worldY};}
  return JSON.stringify({guidedVersion:1,session:{...this.session,task:null,picker:null},scanned:this.scanned,positions});
 }
}
