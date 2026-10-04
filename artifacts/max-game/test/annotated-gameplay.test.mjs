import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MISSION_CATALOG as base} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';
import {assertMissionCatalog} from '../vendor/backend-figma-v2/src/contracts/mission-catalog.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../vendor/backend-figma-v2/src/core/mission-core.mjs';
import {applyAssetAnnotations} from '../scripts/apply-asset-annotations.mjs';
import {applyAssetFlow} from '../scripts/apply-asset-flow.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {V5_MISSION_CATALOG,createV5MissionSessionApplication} from '../src/journey-v5-backend.mjs';

const document=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/annotations.json',import.meta.url),'utf8'));
const original=JSON.stringify(base),originalDocument=JSON.stringify(document);
const {catalog}=applyAssetAnnotations(base,document);
const disabled=new Set(document.screens.filter(s=>!s.enabled).map(s=>s.screenId));
const screensOf=c=>Object.values(c.tasks).flatMap(t=>Object.values(t.screens));
const findScreen=(c,id)=>screensOf(c).find(s=>s.screenId===id);

test('v5 generated catalog and application default use the exact reviewed content',async()=>{
 const flow=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/flow.json',import.meta.url),'utf8'));
 const rectCorrections=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/flow-corrections.json',import.meta.url),'utf8'));
 assert.deepEqual(V5_MISSION_CATALOG,applyAssetFlow(base,flow,{rectCorrections}).catalog);
 assert.ok(Object.isFrozen(V5_MISSION_CATALOG));
 const app=createV5MissionSessionApplication({persistence:createMemoryPersistencePort(),now:()=>1000});
 try{
  const snapshot=await app.createSession({sessionId:'annotations.wrapper'});
  assert.equal(snapshot.state.contentRevision,V5_MISSION_CATALOG.contentRevision);
 }finally{await app.close();}
});

test('actual export applies all surviving reviewed controls without changing the pinned release or input',()=>{
 assert.equal(document.records.length,73);
 assert.equal(document.screens.length,33);
 assert.equal(disabled.size,14);
 assert.equal(document.screens.filter(s=>s.final).length,15);
 assert.equal(screensOf(catalog).length,70);
 assert.equal(JSON.stringify(base),original);
 assert.equal(JSON.stringify(document),originalDocument);
 assert.notEqual(catalog.contentRevision,base.contentRevision);
 assert.doesNotThrow(()=>assertMissionCatalog(catalog));
 for(const id of disabled)assert.equal(findScreen(catalog,id),undefined,id);
 for(const record of document.records){
  if(disabled.has(record.screenId))continue;
  const screen=findScreen(catalog,record.screenId),action=screen.actions.find(a=>a.actionId===record.actionId);
  assert.ok(action,record.actionId);
  assert.equal(action.placement,record.placement,record.actionId);
  if(record.placement==='hotspot')assert.deepEqual(action.rect,record.rect,record.actionId);
  else assert.equal(action.rect,undefined,record.actionId);
 }
 for(const setting of document.screens.filter(s=>s.final)){
  const screen=findScreen(catalog,setting.screenId);
  assert.ok(screen.actions.some(a=>a.outcome.kind==='complete-task'),setting.screenId);
  assert.ok(screen.actions.every(a=>!['navigate','skip-screen'].includes(a.outcome.kind)),setting.screenId);
 }
 for(const task of Object.values(catalog.tasks))for(const screen of Object.values(task.screens)){
  for(const action of screen.actions){
   if(['navigate','skip-screen'].includes(action.outcome.kind))assert.ok(task.screens[action.outcome.screenId],action.actionId);
   const prior=base.tasks[task.taskId].screens[screen.screenId].actions.find(a=>a.actionId===action.actionId);
   assert.ok(prior,action.actionId);
   assert.deepEqual(action.outcome.answer,prior.outcome.answer,action.actionId);
   if(prior.outcome.kind==='incorrect')assert.deepEqual(action.outcome,prior.outcome);
  }
 }
});

test('channel presentation and nested authority use the same reviewed graph; reviewed automatic controls become manual',()=>{
 const channel=catalog.tasks['blogger.channel'];
 assert.deepEqual(channel.screens,channel.coreCatalog.screens);
 assert.equal(channel.startScreenId,channel.coreCatalog.startScreenId);
 assert.notEqual(channel.coreCatalog.contentRevision,base.tasks['blogger.channel'].coreCatalog.contentRevision);
 for(const id of ['digital-id.create-id.biometry','communication.message.voice-sent'])assert.equal(findScreen(catalog,id).automaticMs,null,id);
 for(const id of ['blogger.statistics.statistics','digital-id.age.result','communication.story.ready','business.store.result']){
  assert.deepEqual(findScreen(catalog,id).actions,findScreen(base,id).actions,id);
 }
});

function completeMission(missionId,{channelPath='private',biometry='enabled',checkIncorrect=false}={}){
 let model=createMissionModel(catalog,{sessionId:`annotated.${missionId}.${channelPath}.${biometry}`}),serial=0,now=1000;
 const visited=[],privacyVisits={count:0};
 const send=(type,fields={},internal=false)=>{
  const command={schemaVersion:1,type,commandId:`annotation.${++serial}`,sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:model.state.revision,...fields};
  const result=dispatchMissionCommand(catalog,model,command,{now,internal});
  assert.equal(result.reply.ok,true,`${model.state.screenId}: ${result.reply.code}`);
  model=result.model;
  return result;
 };
 send('OWNER_CHANGED',{active:true},true);
 send('SELECT_MISSION',{missionId});
 send('HOLD_CONFIRMED',{},true);
 while(model.state.status!=='completed'&&visited.length<100){
  if(model.state.status==='result'){now+=800;send('ADVANCE_RESULT',{},true);continue;}
  assert.equal(model.state.status,'task');
  const {taskId,screenId}=model.state,screen=catalog.tasks[taskId].screens[screenId];
  assert.ok(screen,screenId);assert.equal(disabled.has(screenId),false,screenId);visited.push(screenId);
  let action=screen.actions.find(a=>a.outcome.kind!=='incorrect');
  if(screenId==='blogger.channel.privacy'){
   const first=privacyVisits.count++===0;
   const id=channelPath==='public'?'channel.choose-public':channelPath==='return-private'&&first?'channel.choose-public':channelPath==='self-loop'&&first?'channel.choose-private':'channel.continue-private';
   action=screen.actions.find(a=>a.actionId===id);
  }
  if(screenId==='blogger.channel.public-confirm')action=screen.actions.find(a=>a.actionId===(channelPath==='return-private'?'channel.keep-old-link':'channel.use-new-link'));
  if(screenId==='digital-id.create-id.quick')action=screen.actions.find(a=>a.outcome.answer?.value===biometry);
  if(checkIncorrect&&screenId==='digital-id.create-id.confirm'){
   const wrong=screen.actions.find(a=>a.outcome.kind==='incorrect');assert.ok(wrong);
   const result=dispatchMissionCommand(catalog,model,{schemaVersion:1,type:'ACT',commandId:`incorrect.${++serial}`,sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:model.state.revision,screenId,actionId:wrong.actionId},{now});
   assert.equal(result.reply.code,'INCORRECT_ANSWER');assert.equal(result.reply.ok,false);assert.equal(result.model,model);
  }
  assert.ok(action,screenId);
  const automatic=screen.automaticMs!==null;
  now+=automatic?screen.automaticMs:1;
  send(automatic?'AUTO_SCREEN':'ACT',{screenId,actionId:action.actionId},automatic);
  if(taskId==='blogger.channel'&&model.state.status==='task')assert.equal(model.state.screenId,model.state.progress.blogger.channelModel.state.screenId);
  const restored=restoreMissionModel(catalog,JSON.stringify(model));
  assert.equal(restored.ok,true,`${screenId}: ${restored.message}`);assert.deepEqual(restored.model,model);
 }
 assert.equal(model.state.status,'completed');
 const progress=model.state.progress[missionId];
 assert.deepEqual(progress.skipped,[]);
 assert.deepEqual(progress.completed,catalog.missions[missionId].taskIds);
 assert.deepEqual(restoreMissionModel(catalog,JSON.stringify(model)).model,model);
 return {model,visited,progress};
}

for(const channelPath of ['private','public','return-private','self-loop'])test(`actual mission authority completes blogger/${channelPath} with replay restoration`,()=>{
 const {visited,progress}=completeMission('blogger',{channelPath});
 const expected=channelPath==='public'?'public':'private';
 assert.equal(progress.answers['channel-type'],expected);
 assert.equal(progress.channelModel.state.answers['channel-type'],expected);
 assert.equal(progress.channelModel.state.status,'completed');
 assert.equal(visited.includes('blogger.channel.public-link'),channelPath==='public');
 if(['return-private','self-loop'].includes(channelPath))assert.equal(visited.filter(id=>id==='blogger.channel.privacy').length,2);
});

for(const biometry of ['enabled','skipped'])test(`actual mission authority completes digital-id/${biometry} and rejects incorrect input`,()=>{
 const {visited,progress}=completeMission('digital-id',{biometry,checkIncorrect:true});
 assert.equal(progress.answers.biometry,biometry);
 assert.equal(visited.includes('digital-id.create-id.biometry'),biometry==='enabled');
});

for(const missionId of ['communication','business'])test(`actual mission authority completes every ${missionId} task and restores`,()=>{
 const {visited}=completeMission(missionId);
 if(missionId==='business'){
  for(const suffix of ['platform','channel','bot','store'])assert.ok(visited.some(id=>id.startsWith(`business.${suffix}.`)));
  assert.ok(visited.includes('business.platform.ready'));
 }
 if(missionId==='communication')assert.ok(visited.includes('communication.message.voice-sent'));
});

test('changed graph does not silently restore sessions from the pinned content revision',()=>{
 const saved=createMissionModel(base,{sessionId:'annotations.old-content'});
 assert.equal(restoreMissionModel(catalog,saved).ok,false);
});

test('disabled branching screens are rejected instead of silently choosing a path',()=>{
 const fixture=structuredClone(document),task=base.tasks['digital-id.create-id'],screen=task.screens['digital-id.create-id.quick'];
 fixture.screens.push({taskId:task.taskId,screenId:screen.screenId,assetId:screen.assetId,assetSha256:base.assets[screen.assetId].sha256,enabled:false,final:false,updatedAt:document.exportedAt});
 assert.throws(()=>applyAssetAnnotations(base,fixture));
});
