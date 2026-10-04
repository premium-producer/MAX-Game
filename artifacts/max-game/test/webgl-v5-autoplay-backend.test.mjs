import test from 'node:test';
import assert from 'node:assert/strict';
import {V5_MISSION_CATALOG as original,createV5MissionSessionApplication} from '../src/journey-v5-backend.mjs';
import {V5_AUTOPLAY_MS,createV5AutomaticCatalog} from '../src/journey-v5-autoplay.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';

function fixture(catalog,{persistence=createMemoryPersistencePort(),sessionId='autoplay-test',time=1000}={}){
 let now=time,serial=0;
 const app=createV5MissionSessionApplication({catalog,persistence,now:()=>now});
 return {app,persistence,sessionId,get now(){return now;},
  snapshot:()=>app.getSnapshot(sessionId),
  async start(){await app.createSession({sessionId});await app.inputOwnerChanged(sessionId,{active:true});},
  async command(type,fields={}){const {state}=await app.getSnapshot(sessionId);return app.sendCommand({schemaVersion:1,type,commandId:`test.${++serial}`,sessionId,contentRevision:catalog.contentRevision,expectedRevision:state.revision,...fields});},
  async poll(ms){now+=ms;return app.pollTime(sessionId);},
  contact:(type,sequence)=>app.handleContact(sessionId,{contactId:'hand',type,sequence,inside:true})};
}

async function begin(f,missionId){
 assert.equal((await f.command('SELECT_MISSION',{missionId})).reply.ok,true);
 assert.equal((await f.command('HOLD_CONFIRMED')).reply.code,'TRUSTED_COMMAND_REQUIRED');
 await f.contact('down',0);
 await f.poll(799);
 assert.equal((await f.snapshot()).state.status,'scan','799 ms cannot confirm the hold');
 await f.poll(1);
 assert.equal((await f.snapshot()).state.status,'task','the host confirms a real 800 ms contact');
 await f.contact('up',1);
}

async function finish(f,catalog){
 const visited=[];
 for(let step=0;step<200;step++){
  const before=await f.snapshot(),s=before.state;
  if(s.status==='completed')return {snapshot:before,visited};
  if(s.status==='result'){
   await f.poll(799);
   assert.equal((await f.snapshot()).state.revision,s.revision,'result cannot advance before 800 ms');
   await f.poll(1);
   assert.ok((await f.snapshot()).state.revision>s.revision);
   continue;
  }
  assert.equal(s.status,'task');
  assert.equal(before.view.automaticMs,500);
  assert.deepEqual(before.view.actions,[],'automatic screens expose no interactive actions');
  const screen=catalog.tasks[s.taskId].screens[s.screenId];
  assert.equal((await f.command('AUTO_SCREEN',{screenId:s.screenId,actionId:screen.actions[0].actionId})).reply.code,'TRUSTED_COMMAND_REQUIRED');
  assert.equal((await f.command('ACT',{screenId:s.screenId,actionId:screen.actions[0].actionId})).reply.code,'AUTOMATIC_SCREEN');
  assert.ok(!visited.includes(s.screenId),`automatic route repeated ${s.screenId}`);
  visited.push(s.screenId);
  await f.poll(499);
  const waiting=await f.snapshot();
  assert.equal(waiting.state.screenId,s.screenId);
  assert.equal(waiting.state.revision,s.revision,'499 ms cannot advance an automatic screen');
  await f.poll(1);
  assert.equal((await f.snapshot()).state.revision,s.revision+1,'500 ms advances exactly one screen');
 }
 assert.fail('automatic mission failed to reach its final screen within 200 transitions');
}

test('automatic catalog preserves the original content and all assets without mutating it',()=>{
 const before=JSON.stringify(original),automatic=createV5AutomaticCatalog(original);
 assert.equal(V5_AUTOPLAY_MS,500);
 assert.notEqual(automatic.contentRevision,original.contentRevision);
 assert.deepEqual(Object.keys(automatic.missions),Object.keys(original.missions));
 assert.deepEqual(Object.keys(automatic.tasks),Object.keys(original.tasks));
 assert.deepEqual(automatic.assets,original.assets);
 for(const [id,mission]of Object.entries(original.missions)){
  assert.deepEqual(automatic.missions[id].taskIds,mission.taskIds);
  assert.deepEqual(automatic.missions[id].qr,mission.qr);
  assert.equal(automatic.missions[id].completionText,mission.completionText);
 }
 for(const [id,task]of Object.entries(original.tasks))for(const [screenId,screen]of Object.entries(task.screens)){
  const next=automatic.tasks[id].screens[screenId];
  assert.equal(next.automaticMs,500);
  assert.equal(next.assetId,screen.assetId);
  assert.equal(next.instruction,screen.instruction);
  assert.deepEqual([...next.actions].sort((a,b)=>a.actionId.localeCompare(b.actionId)),[...screen.actions].sort((a,b)=>a.actionId.localeCompare(b.actionId)),'alternative actions and their semantics remain intact');
 }
 assert.equal(JSON.stringify(original),before);
});

test('automatic catalog refuses a cyclic selected route or a missing approved public action',()=>{
 const cyclic=structuredClone(original),task=cyclic.tasks['blogger.comments'];
 const first=task.screens[task.startScreenId],nextId=first.actions.find(a=>a.outcome.kind==='navigate').outcome.screenId;
 task.screens[nextId].actions[0].outcome={kind:'navigate',screenId:first.screenId};
 assert.throws(()=>createV5AutomaticCatalog(cyclic),/AUTOPLAY_ROUTE_CYCLE: blogger\.comments/);
 const missing=structuredClone(original),privacy=missing.tasks['blogger.channel'].screens['blogger.channel.privacy'];
 privacy.actions=privacy.actions.filter(a=>a.actionId!=='channel.choose-public');
 assert.throws(()=>createV5AutomaticCatalog(missing),/AUTOPLAY_ACTION_UNAVAILABLE: blogger\.channel\.privacy/);
});

for(const missionId of ['blogger','digital-id','communication','business'])test(`automatic ${missionId}: trusted hold, 500 ms screens, complete progress and QR`,async t=>{
 const catalog=createV5AutomaticCatalog(original),f=fixture(catalog,{sessionId:`autoplay.${missionId}`});
 t.after(()=>f.app.close());await f.start();await begin(f,missionId);
 const {snapshot,visited}=await finish(f,catalog),progress=snapshot.state.progress[missionId];
 assert.equal(snapshot.state.status,'completed');
 assert.deepEqual(progress.completed,catalog.missions[missionId].taskIds);
 assert.deepEqual(progress.skipped,[]);
 assert.equal(snapshot.view.result.complete,true);
 assert.equal(snapshot.view.result.text,original.missions[missionId].completionText);
 assert.equal(snapshot.view.qr.asset.path,original.assets[original.missions[missionId].qr.assetId].path);
 assert.equal(snapshot.view.qr.url,original.missions[missionId].qr.url);
 if(missionId==='blogger'){
  assert.ok(visited.includes('blogger.channel.public-confirm'));
  assert.ok(visited.includes('blogger.channel.public-link'));
  assert.equal(progress.answers['channel-type'],'public');
  assert.equal(progress.answers['blogger.channel.privacy'],'channel.choose-public');
  assert.equal(progress.answers['blogger.channel.public-confirm'],'channel.use-new-link');
 }
 const finished=structuredClone(snapshot.state);
 await f.poll(10000);
 assert.deepEqual((await f.snapshot()).state,finished,'the final QR remains until explicit navigation');
});

test('automatic memory session cannot alter normal saved progress, even with the same session ID',async t=>{
 const persistence=createMemoryPersistencePort(),normal=fixture(original,{persistence,sessionId:'same-id'});
 t.after(()=>normal.app.close());await normal.start();await begin(normal,'blogger');
 const first=await normal.snapshot();
 assert.equal((await normal.command('ACT',{screenId:first.state.screenId,actionId:first.view.actions[0].actionId})).reply.ok,true);
 const saved=await persistence.load('same-id'),before=await normal.snapshot();
 const automatic=createV5AutomaticCatalog(original),demo=fixture(automatic,{sessionId:'same-id'});
 t.after(()=>demo.app.close());await demo.start();await begin(demo,'blogger');await finish(demo,automatic);
 assert.deepEqual(await persistence.load('same-id'),saved,'automatic playback must leave the normal persistence record byte-equivalent');
 assert.deepEqual(await normal.snapshot(),before);
 await normal.app.close();
 const restored=createV5MissionSessionApplication({catalog:original,persistence,now:()=>normal.now+100});
 t.after(()=>restored.close());
 const snapshot=await restored.getSnapshot('same-id');
 assert.equal(snapshot.state.screenId,before.state.screenId);
 // Restart recovery legitimately pauses the timer at its last committed host
 // checkpoint; completed tasks, answers and the current screen remain intact.
 const expectedProgress=structuredClone(before.state.progress);
 expectedProgress.blogger.remainingMs=before.view.remainingMs;
 assert.deepEqual(snapshot.state.progress,expectedProgress);
 assert.equal(snapshot.state.contentRevision,original.contentRevision);
});
