import test from 'node:test';
import assert from 'node:assert/strict';
import base from './client/src/reviewed-content/mission-catalog.json' with {type:'json'};
import {KdwTaskJourney} from './client/src/kdw-task-journey.mjs';
import {sharedRevealContent} from './client/src/journey-shared-reveal.mjs';
import {createKdwCatalog} from './client/src/kdw-interactions-model.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from './client/src/core/mission-core.mjs';
const c={...createKdwCatalog(base),kdwDevelopment:true};
function driver(){
 let model=createMissionModel(c,{sessionId:'task-presentation',rulesRevision:'mission-rules-task-clock-v2'}),serial=0,now=1000;
 const send=(type,fields={},internal=false)=>{const r=dispatchMissionCommand(c,model,{schemaVersion:1,type,sessionId:model.state.sessionId,contentRevision:c.contentRevision,expectedRevision:model.state.revision,commandId:'replay.'+(++serial),...fields},{now:now++,internal});if(r.reply.ok)model=r.model;return r;};
 send('OWNER_CHANGED',{active:true},true);send('DEV_TIMER',{active:false});send('SELECT_MISSION',{missionId:'business'});send('HOLD_CONFIRMED',{},true);
 const snapshot=()=>{const state=structuredClone(model.state),p=state.progress.business,screen=c.tasks[state.taskId]?.screens[state.screenId],ids=c.missions.business.taskIds;return {state,view:{device:screen?{kind:screen.deviceKind,asset:c.assets[screen.assetId],annotations:screen.annotations}:null,instruction:{text:screen?.instruction??''},actions:screen?.actions??[],nodes:[{nodeId:'open-max',taskId:null,completed:p.scanned},...ids.map(id=>({nodeId:id,taskId:id,completed:p.completed.includes(id),skipped:p.skipped.includes(id)}))],edges:ids.map((id,i)=>({from:i?ids[i-1]:'open-max',to:id})),remainingMs:null}};};
 const facade={snapshot:snapshot(),profile:'local'},journey=new KdwTaskJourney(sharedRevealContent(c),facade);journey.configure(2000,1000,256);journey.resume(journey.activeId);
 const settle=()=>{for(let i=0;i<20&&!['task','complete'].includes(journey.phase);i++)journey.tick(.05,{active:true,reduced:true,settled:true,deviceReady:true,deviceShown:true,deviceHidden:true});assert.ok(['task','complete'].includes(journey.phase),journey.phase);};settle();
 const apply=(type,fields={},internal=false)=>{const r=send(type,fields,internal);if(r.reply.ok)journey.accept(snapshot());return r;};
 return {journey,apply,settle,snapshot,restore:()=>restoreMissionModel(c,model),get state(){return model.state}};
}
test('same task replay retains outgoing view/pose until handoff and absorbs newer snapshots',()=>{
 const d=driver(),j=d.journey,old=j.displaySnapshot,anchor=j.phoneAnchor,scene=j.sceneRunId;
 assert.equal(j.prepareTaskChange('RESTART_TASK',d.state.taskId),true);assert.equal(d.apply('RESTART_TASK',{taskId:d.state.taskId}).reply.ok,true);
 assert.equal(j.phase,'phone-exit');assert.equal(j.displayedState.runId,old.state.runId);assert.equal(j.snapshot.state.runId,old.state.runId+1);assert.equal(j.sceneRunId,scene);assert.equal(j.phoneAnchor,anchor);assert.equal(j.startup,null);
 d.apply('DEV_TIMER',{active:false});assert.equal(j.displayedState.runId,old.state.runId);assert.equal(j.prepareTaskChange('RESTART_TASK',d.state.taskId),false);
 d.settle();assert.equal(j.phase,'task');assert.equal(j.displayedState.runId,d.state.runId);assert.equal(j.displayedState.revision,d.state.revision);assert.equal(j.sceneRunId,scene);assert.equal(j.replayPending,false);assert.equal(d.restore().ok,true);
});
test('skip then replay previous task retain the scene; rejected future replay leaves it intact',()=>{
 const d=driver(),j=d.journey,first=d.state.taskId,scene=j.sceneRunId;j.prepareTaskChange('SKIP_TASK',first);d.apply('SKIP_TASK',{taskId:first});d.settle();assert.equal(j.activeId,'business.channel');assert.ok(j.nodes.find(n=>n.step===first).skipped);
 j.prepareTaskChange('RESTART_TASK',first);d.apply('RESTART_TASK',{taskId:first});d.settle();assert.equal(j.activeId,first);assert.equal(j.nodes.find(n=>n.step===first).skipped,false);assert.equal(j.sceneRunId,scene);
 const shown=j.displaySnapshot;j.prepareTaskChange('RESTART_TASK','business.store');assert.equal(d.apply('RESTART_TASK',{taskId:'business.store'}).reply.code,'TASK_UNAVAILABLE');j.cancelTaskChange();assert.equal(j.displayedState,shown.state);assert.equal(j.phase,'task');assert.equal(d.restore().ok,true);
});
test('whole mission restart holds outgoing presentation until commit, then automatic admission starts normally',()=>{
 const d=driver(),j=d.journey,old=j.snapshot;j.prepareMissionRestart();d.apply('RESTART_MISSION');assert.equal(j.snapshot,old);assert.equal(j.phase,'task');assert.equal(j.deferredMissionSnapshot.state.status,'scan');
 j.commitMissionRestart();assert.equal(j.snapshot.state.status,'scan');assert.equal(j.phase,'palm');assert.equal(j.sceneRunId,d.state.runId);d.apply('HOLD_CONFIRMED',{},true);assert.ok(j.startup);d.settle();assert.equal(j.phase,'task');assert.equal(j.startup,null);assert.equal(j.displayedState.runId,d.state.runId);assert.equal(d.restore().ok,true);
});
test('last skipped task reaches the finale without resetting the physical scene',()=>{
 const d=driver(),j=d.journey,scene=j.sceneRunId;
 for(let i=0;i<10&&d.state.status==='task';i++){const id=d.state.taskId;assert.equal(j.prepareTaskChange('SKIP_TASK',id),true);assert.equal(d.apply('SKIP_TASK',{taskId:id}).reply.ok,true);d.settle();}
 assert.equal(d.state.status,'incomplete');assert.equal(j.phase,'complete');assert.equal(j.sceneRunId,scene);assert.equal(j.replayPending,false);assert.equal(d.restore().ok,true);
});
test('replaying an earlier task hides later skipped icons and their links until handoff reaches them',()=>{
 const d=driver(),j=d.journey;
 for(const id of ['business.platform','business.channel','business.bot']){
  assert.equal(j.prepareTaskChange('SKIP_TASK',d.state.taskId),true);
  assert.equal(d.apply('SKIP_TASK',{taskId:d.state.taskId}).reply.ok,true);d.settle();
 }
 assert.equal(j.prepareTaskChange('RESTART_TASK','business.channel'),true);
 assert.equal(d.apply('RESTART_TASK',{taskId:'business.channel'}).reply.ok,true);d.settle();
 const later=j.nodes.filter(n=>j.nodes.indexOf(n)>j.nodes.indexOf(j.current));
 assert.ok(later.some(n=>n.skipped),'fixture must retain a later skipped task');
 for(const n of later){assert.equal(j.nodeAdmitted(n),false);assert.ok(j.edges().every(e=>e.a!==n.step&&e.b!==n.step));}
 assert.equal(j.prepareTaskChange('SKIP_TASK','business.channel'),true);
 d.apply('SKIP_TASK',{taskId:'business.channel'});d.settle();
 assert.equal(j.nodeAdmitted(j.current),true);
});
test('completion retains the displayed screen without a painted instruction, across all missions',()=>{
 for(const mission of Object.values(c.missions)){
  for(const taskId of mission.taskIds){
   const task=c.tasks[taskId],screen=Object.values(task.screens).find(s=>s.assetId&&c.assets[s.assetId]);
   if(!screen)continue;
   const d=driver(),j=d.journey,shown=structuredClone(d.snapshot());
   Object.assign(shown.state,{missionId:mission.missionId,taskId,screenId:screen.screenId,status:'task'});
   shown.state.progress[mission.missionId]??={completed:[],skipped:[],answers:{},currentTaskIndex:0,scanned:true};
   shown.view.device={kind:screen.deviceKind,asset:c.assets[screen.assetId]};
   shown.view.instruction={text:'Текущий экран'};
   j.accept(shown);j._activeId=taskId;j._displayState=shown.state;j._displayView=shown.view;j.change('task');
   j.presentedInstruction=null;
   const key=j.phoneContentKey,result=structuredClone(shown);
   result.state.status='result';result.state.revision++;
   result.view.instruction={text:'Задание выполнено.'};
   j.accept(result);
   assert.equal(j.phase,'result',taskId);
   assert.equal(j.phoneContentKey,key,taskId);
   assert.equal(j.displayedState.status,'result');
   assert.equal(j.descriptor.instruction.text,'Текущий экран');
   // Owner/timer snapshots during the result dwell must not restart appearance.
   result.state.revision++;j.accept(structuredClone(result));
   assert.equal(j.phoneContentKey,key);
  }
 }
});
test('a different result asset still changes the content key',()=>{
 const d=driver(),j=d.journey,key=j.phoneContentKey,result=structuredClone(d.snapshot());
 result.state.status='result';result.state.revision++;
 result.view.device.asset={...result.view.device.asset,path:'different-result.svg'};
 j.accept(result);assert.notEqual(j.phoneContentKey,key);
});
