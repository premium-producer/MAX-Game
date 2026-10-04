import test from 'node:test';
import assert from 'node:assert/strict';
import {createTaskFlowRouter,createFlowRoutingProfile} from '../src/core/flow-router.mjs';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';

const taskId='digital-id.hotel';
const profile=(catalog=MISSION_CATALOG,revision='mission-flow-fe01-v1')=>createFlowRoutingProfile(catalog,{taskIds:[taskId],rulesRevision:revision});
// Retain real assets/task/actions; start a fixture mission directly at the
// supported task so the test exercises the actual SessionApplication/CAS path.
const catalog=structuredClone(MISSION_CATALOG);
catalog.missions['digital-id'].taskIds=[taskId];

async function start({persistence=createMemoryPersistencePort(),routingProfile=profile(catalog)}={}){
 let now=1000,serial=0;
 const app=createMissionSessionApplication({catalog,persistence,now:()=>now,routingProfile:await routingProfile});
 let snapshot=await app.createSession({sessionId:'flow-test'});
 const command=(type,fields={})=>({schemaVersion:1,type,commandId:`test.${++serial}`,sessionId:'flow-test',contentRevision:catalog.contentRevision,expectedRevision:snapshot.state.revision,...fields});
 const send=async(type,fields={})=>{const result=await app.sendCommand(command(type,fields));snapshot=result.snapshot;return result;};
 snapshot=await app.inputOwnerChanged('flow-test',{active:true});
 await send('SELECT_MISSION',{missionId:'digital-id'});
 await app.handleContact('flow-test',{type:'down',contactId:'hand',sequence:1,inside:true});
 now+=800;snapshot=(await app.pollTime('flow-test')).snapshot;
 return {app,persistence,command,send,get snapshot(){return snapshot;},get now(){return now;},async refresh(){snapshot=await app.getSnapshot('flow-test');return snapshot;}};
}

test('v3 pure routing permits independent button, hotspot and timer destinations',()=>{
 const interaction=(id,kind,destination,enabled=true)=>({interactionId:id,kind,enabled,target:{kind:'screen',screenId:destination}});
 const task={startScreenId:'first',screens:[
  {screenId:'first',enabled:true,interactions:[interaction('area','hotspot','second'),interaction('button','button','third'),interaction('auto','timer','first'),interaction('off','hotspot','third',false)]},
  {screenId:'second',enabled:true,interactions:[{interactionId:'finish',kind:'button',enabled:true,target:{kind:'complete-task'}}]},
  {screenId:'third',enabled:true,interactions:[]}
 ]};
 const router=createTaskFlowRouter(task);
 assert.deepEqual(router.resolve('first','area','hotspot'),{kind:'navigate',screenId:'second'});
 assert.deepEqual(router.resolve('first','button','button'),{kind:'navigate',screenId:'third'});
 assert.deepEqual(router.resolve('first','auto','timer'),{kind:'navigate',screenId:'first'});
 assert.equal(router.resolve('first','auto','button'),null);
 assert.equal(router.resolve('first','off','hotspot'),null);
 assert.deepEqual(router.resolve('second','finish','button'),{kind:'complete-task'});
 task.screens[0].interactions[0].target.screenId='third';
 assert.equal(router.resolve('first','area','hotspot').screenId,'second');
});

test('unsupported nested semantics/automatic task fails closed',async()=>{
 await assert.rejects(()=>createFlowRoutingProfile(catalog,{taskIds:['blogger.channel'],rulesRevision:'flow-v1'}),/UNSUPPORTED_TASK/);
 await assert.rejects(()=>createFlowRoutingProfile(catalog,{taskIds:['digital-id.create-id'],rulesRevision:'flow-v1'}),/UNSUPPORTED_TASK/);
 const changed=structuredClone(catalog);changed.tasks[taskId].title+=' changed';
 const p=await profile();assert.throws(()=>p.assertCatalog(changed),/CATALOG_CONFLICT/);
});

test('actual Application commits full source task; replay, duplicates and competing commands',async()=>{
 const d=await start();let count=0,first;
 while(d.snapshot.state.status==='task'){
  const screen=catalog.tasks[taskId].screens[d.snapshot.state.screenId];
  const c=d.command('ACT',{screenId:screen.screenId,actionId:screen.actions[0].actionId});
  const competing={...c,commandId:c.commandId+'.other'};
  const [a,b]=await Promise.all([d.app.sendCommand(c),d.app.sendCommand(competing)]);
  assert.equal(a.reply.ok,true);assert.equal(b.reply.code,'REVISION_CONFLICT');
  const duplicate=await d.app.sendCommand(c);assert.equal(duplicate.duplicate,true);assert.deepEqual(duplicate.reply,a.reply);
  first??=c;await d.refresh();assert.ok(++count<30);
 }
 assert.deepEqual(d.snapshot.state.progress['digital-id'].completed,[taskId]);
 const saved=await d.persistence.load('flow-test');
 assert.match(saved.record.mission.state.rulesRevision,/^mission-flow-fe01-v1\.[a-f0-9]{64}$/);
 await d.app.close();
 const app=createMissionSessionApplication({catalog,persistence:d.persistence,now:()=>d.now,routingProfile:await profile(catalog)});
 const restored=await app.getSnapshot('flow-test');
 assert.deepEqual(restored.state.progress,d.snapshot.state.progress);
 assert.equal((await app.sendCommand(first)).duplicate,true);
 await app.close();
 const wrong=createMissionSessionApplication({catalog,persistence:d.persistence,now:()=>d.now});
 await assert.rejects(()=>wrong.getSnapshot('flow-test'),{code:'INVALID_SAVED_SESSION'});await wrong.close();
 const alternate=await createFlowRoutingProfile(catalog,{taskIds:['digital-id.age'],rulesRevision:'mission-flow-fe01-v1'});
 const other=createMissionSessionApplication({catalog,persistence:d.persistence,now:()=>d.now,routingProfile:alternate});
 await assert.rejects(()=>other.getSnapshot('flow-test'),{code:'INVALID_SAVED_SESSION'});await other.close();
});

test('failed CAS/storage does not publish speculative effects or state',async()=>{
 const memory=createMemoryPersistencePort();let failure=null;
 const persistence={...memory,commit:async(...args)=>{if(failure)throw Object.assign(new Error(failure),{code:failure});return memory.commit(...args);}};
 const d=await start({persistence});let events=[];await d.app.subscribe('flow-test',e=>events.push(e));events=[];
 const screen=catalog.tasks[taskId].screens[d.snapshot.state.screenId],before=await memory.load('flow-test');
 const c=d.command('ACT',{screenId:screen.screenId,actionId:screen.actions[0].actionId});
 for(const code of ['STORE_CONFLICT','DISK_FAILURE']){
  failure=code;await assert.rejects(()=>d.app.sendCommand(c));
  assert.deepEqual(await memory.load('flow-test'),before);assert.equal(events.length,0);
 }
 await d.app.close();
});

test('legacy default retains legacy rules identity',async()=>{
 const d=await start({routingProfile:null});
 assert.equal(d.snapshot.state.rulesRevision,'mission-rules-v1');await d.app.close();
});
