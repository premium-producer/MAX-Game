import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MISSION_CATALOG as c} from '../src/content/mission-catalog.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
import {assertMissionCatalog} from '../src/contracts/mission-catalog.mjs';
function driver(id='test'){let model=createMissionModel(c,{sessionId:id}),time=1000,serial=0;return {
 get model(){return model;},get time(){return time;},set time(v){time=v;},
 send(type,fields={},internal=false){const cmd={schemaVersion:1,type,commandId:`c.${++serial}`,sessionId:id,contentRevision:c.contentRevision,expectedRevision:model.state.revision,...fields};const r=dispatchMissionCommand(c,model,cmd,{now:time,internal});model=r.model;return {...r,command:cmd};},
 begin(missionId){this.send('OWNER_CHANGED',{active:true},true);this.send('SELECT_MISSION',{missionId});this.send('HOLD_CONFIRMED',{},true);},
 play(tool='channel',publicChannel=false){let count=0;while(!['completed','incomplete'].includes(model.state.status)&&count++<180){const s=model.state;
   if(s.status==='result'){time+=800;this.send('ADVANCE_RESULT');continue;}
   assert.equal(s.status,'task');const screen=c.tasks[s.taskId].screens[s.screenId];let action=screen.actions[0];
   if(s.screenId.endsWith('.privacy'))action=screen.actions.find(a=>a.actionId===`channel.${publicChannel?'choose-public':'continue-private'}`);
   if(s.screenId.endsWith('.public-confirm'))action=screen.actions.find(a=>a.actionId==='channel.use-new-link');
   if(s.taskId==='business.tool')action=screen.actions.find(a=>a.outcome.value===tool);
   if(screen.automaticMs!==null){time+=screen.automaticMs;assert.equal(this.send('AUTO_SCREEN',{screenId:s.screenId,actionId:action.actionId},true).reply.ok,true);}
   else assert.equal(this.send('ACT',{screenId:s.screenId,actionId:action.actionId}).reply.ok,true);
  }assert.ok(count<180);return model.state;
 }
};}
test('six missions with exact semantic paths; no ID in test business',()=>{
 assert.equal(Object.keys(c.missions).length,6);assert.deepEqual(c.missions['business-test'].taskIds,['business.sector','business.platform','business.channel','business.bot','business.store']);
 assert.deepEqual(c.missions.business.taskIds,c.missions['business-test'].taskIds);
 assert.ok(!c.tasks['business.tool']);assert.ok(!c.tasks['communication.group']);
 assert.equal(c.missions['benefit-test'].test,true);assert.equal(c.missions['business-test'].test,true);
 assert.equal(Object.keys(c.tasks['communication.message'].screens).length,11);
 assert.equal(Object.keys(c.tasks['digital-id.create-id'].screens).length,8);
 assert.ok(!Object.keys(c.tasks['digital-id.create-id'].screens).some(k=>/ministry|pin/.test(k)));
});
test('every resource hash matches original; SVG and story sources preserved',()=>{
 for(const a of Object.values(c.assets)){const data=readFileSync(new URL(`../public/${a.path}`,import.meta.url));assert.equal(createHash('sha256').update(data).digest('hex'),a.sha256,a.path);}
 for(const task of Object.values(c.tasks))for(const screen of Object.values(task.screens)){
  assert.ok(screen.missing||screen.assetId);if(screen.assetId)assert.ok(c.assets[screen.assetId]);
  for(const a of screen.actions)if(['navigate','skip-screen'].includes(a.outcome.kind))assert.ok(task.screens[a.outcome.screenId]);
 }
});
for(const missionId of ['blogger','digital-id','communication','business','benefit-test','business-test'])test(`mission ${missionId}: confirmed complete vs explicit gaps`,()=>{
 const d=driver();d.begin(missionId);const s=d.play();
 assert.equal(s.status,['communication','business','business-test'].includes(missionId)?'incomplete':'completed');
 assert.equal(restoreMissionModel(c,JSON.parse(JSON.stringify(d.model))).ok,true);
 const p=s.progress[missionId];assert.equal(new Set(p.completed).size,p.completed.length);assert.ok(!p.skipped.some(t=>p.completed.includes(t)));
});
for(const [index,sector] of ['coffee','shop','services'].entries())test(`business sector ${sector} is retained; all three tools are mandatory`,()=>{
 const d=driver();d.begin('business');let current=d.model.state;
 assert.equal(current.taskId,'business.sector');
 d.send('ACT',{screenId:current.screenId,actionId:c.tasks[current.taskId].screens[current.screenId].actions[index].actionId});
 const s=d.play(),p=s.progress.business;
 assert.equal(p.businessTool,null);assert.equal(p.answers['business-sector'],sector);
 assert.deepEqual(p.finished,c.missions.business.taskIds);assert.deepEqual(p.skipped,c.missions.business.taskIds);
 assert.ok(['business.channel','business.bot','business.store'].every(task=>!p.completed.includes(task)));
});
test('public channel uses existing task kernel and retains answer after receipt restoration',()=>{
 const d=driver();d.begin('blogger');const s=d.play('channel',true);
 assert.equal(s.progress.blogger.channelModel.state.answers['channel-type'],'public');
 const restored=restoreMissionModel(c,structuredClone(d.model));assert.equal(restored.ok,true);
 assert.equal(restored.model.state.progress.blogger.answers['channel-type'],'public');
});
test('dedup remains historical, stale clicks do not affect next screen',()=>{
 const d=driver();d.begin('blogger');const screen=d.model.state.screenId;const action=c.tasks['blogger.channel'].screens[screen].actions[0];const first=d.send('ACT',{screenId:screen,actionId:action.actionId});
 const repeated=dispatchMissionCommand(c,d.model,first.command,{now:d.time+40});assert.equal(repeated.duplicate,true);assert.deepEqual(repeated.reply,first.reply);assert.equal(repeated.model.state.revision,d.model.state.revision);
 assert.equal(d.send('ACT',{screenId:screen,actionId:action.actionId}).reply.code,'SCREEN_CONFLICT');
});
test('wrong consent stays current; client cannot confirm scan or automatic step',()=>{
 const d=driver();d.send('SELECT_MISSION',{missionId:'digital-id'});assert.equal(d.send('HOLD_CONFIRMED').reply.code,'TRUSTED_COMMAND_REQUIRED');d.send('HOLD_CONFIRMED',{},true);
 for(let i=0;i<2;i++){const s=d.model.state;d.send('ACT',{screenId:s.screenId,actionId:c.tasks[s.taskId].screens[s.screenId].actions[0].actionId});}
 let s=d.model.state;assert.equal(d.send('ACT',{screenId:s.screenId,actionId:c.tasks[s.taskId].screens[s.screenId].actions[0].actionId}).reply.code,'AUTOMATIC_SCREEN');d.time+=1100;d.send('AUTO_SCREEN',{screenId:s.screenId,actionId:c.tasks[s.taskId].screens[s.screenId].actions[0].actionId},true);
 s=d.model.state;assert.equal(d.send('ACT',{screenId:s.screenId,actionId:c.tasks[s.taskId].screens[s.screenId].actions[1].actionId}).reply.code,'INCORRECT_ANSWER');assert.equal(d.model.state.screenId,s.screenId);
});
test('result cannot advance before .8 second and is awarded once',()=>{
 const d=driver();d.begin('benefit-test');while(d.model.state.status==='task'){const s=d.model.state,screen=c.tasks[s.taskId].screens[s.screenId];if(screen.automaticMs!==null)d.time+=screen.automaticMs;d.send(screen.automaticMs!==null?'AUTO_SCREEN':'ACT',{screenId:s.screenId,actionId:screen.actions[0].actionId},screen.automaticMs!==null);}
 assert.equal(d.send('ADVANCE_RESULT').reply.code,'RESULT_NOT_READY');d.time+=800;assert.equal(d.send('ADVANCE_RESULT').reply.ok,true);assert.deepEqual(d.model.state.progress['benefit-test'].completed,['digital-id.create-id']);
});
test('timer pause resumes remaining time; restart and reset do not resurrect old callbacks',()=>{
 const d=driver();d.begin('blogger');d.time+=30000;d.send('OWNER_CHANGED',{active:false},true);const remaining=d.model.state.progress.blogger.remainingMs;d.time+=50000;d.send('OWNER_CHANGED',{active:true},true);assert.equal(d.model.state.deadlineAt-d.time,remaining);
 d.time=d.model.state.deadlineAt;assert.equal(d.send('ACT',{screenId:d.model.state.screenId,actionId:'channel.open-create-menu'}).reply.code,'MISSION_EXPIRED');d.send('EXPIRE',{},true);assert.equal(d.model.state.status,'expired');d.send('RESTART_MISSION');assert.equal(d.model.state.status,'scan');assert.equal(d.model.state.deadlineAt-d.time,180000);d.send('RESET_PROGRESS');assert.equal(d.model.state.status,'menu');assert.deepEqual(d.model.state.progress,{});
});
test('return to menu and resume retain screen and full proof; tamper fails restoration',()=>{
 const d=driver();d.begin('blogger');d.send('ACT',{screenId:d.model.state.screenId,actionId:'channel.open-create-menu'});const current=d.model.state.screenId;d.send('RETURN_MENU');d.send('SELECT_MISSION',{missionId:'blogger'});assert.equal(d.model.state.screenId,current);assert.equal(d.model.state.scanned,true);
 const bad=structuredClone(d.model);bad.state.progress.blogger.completed.push('blogger.statistics');assert.equal(restoreMissionModel(c,bad).ok,false);
});
async function appDriver(){let now=1000,serial=0;const persistence=createMemoryPersistencePort();let app=createMissionSessionApplication({persistence,now:()=>now});let snap=await app.createSession({sessionId:'application'});
 const send=async(type,fields={})=>{const r=await app.sendCommand({schemaVersion:1,type,commandId:`a.${++serial}`,sessionId:'application',contentRevision:c.contentRevision,expectedRevision:snap.state.revision,...fields});snap=r.snapshot;return r;};
 return {get app(){return app;},get snapshot(){return snap;},get time(){return now;},set time(v){now=v;},send,persistence,async refresh(){snap=await app.getSnapshot('application');return snap;},async reopen(){await app.close();app=createMissionSessionApplication({persistence,now:()=>now});return this.refresh();}};
}
test('contact early release, exit, repeat and owner loss; hold .8 clock retained',async()=>{
 const d=await appDriver();await d.app.inputOwnerChanged('application',{active:true});await d.refresh();await d.send('SELECT_MISSION',{missionId:'blogger'});
 let seq=0;const contact=(type,inside=true,id='p')=>d.app.handleContact('application',{contactId:id,sequence:seq++,type,inside},d.time);
 await contact('down');d.time+=799;await contact('up');await d.app.pollTime('application',d.time+10);assert.equal((await d.refresh()).state.status,'scan');
 await contact('down');d.time+=500;await contact('move',false);await d.app.pollTime('application',d.time+500);assert.equal((await d.refresh()).state.status,'scan');
 await contact('down');d.time+=300;await contact('down',true,'second');await d.app.inputOwnerChanged('application',{active:false},d.time);d.time+=900;await d.app.pollTime('application',d.time);assert.equal((await d.refresh()).state.status,'scan');
 await d.app.inputOwnerChanged('application',{active:true},d.time);await contact('down');d.time+=800;await d.app.pollTime('application',d.time);assert.equal((await d.refresh()).state.status,'task');assert.equal(d.snapshot.state.scanned,true);await d.app.close();
});
test('layout separate revision retains exact base positions and rejects temporary fields',async()=>{
 const d=await appDriver(),positions={'blogger.channel':{x:320,y:400}};const start=d.snapshot.state.revision;
 const r=await d.send('SET_LAYOUT',{layoutId:'base',expectedLayoutRevision:0,positions});assert.equal(r.reply.ok,true);assert.equal(d.snapshot.state.revision,start);assert.equal(d.snapshot.layouts.layoutRevision,1);
 assert.equal((await d.send('SET_LAYOUT',{expectedLayoutRevision:0,positions})).reply.code,'LAYOUT_REVISION_CONFLICT');
 assert.equal((await d.send('SET_LAYOUT',{expectedLayoutRevision:1,positions:{a:{x:2,y:3,shift:5}}})).reply.code,'INVALID_LAYOUT_COMMAND');
 await d.reopen();assert.deepEqual(d.snapshot.layouts.positions,positions);await d.app.close();
});
test('restore has informational instruction/actions inside device and semantic resume only',async()=>{
 const d=await appDriver();await d.app.inputOwnerChanged('application',{active:true});await d.refresh();await d.send('SELECT_MISSION',{missionId:'blogger'});await d.app.handleContact('application',{contactId:'p',sequence:0,type:'down',inside:true},d.time);d.time+=800;await d.app.pollTime('application',d.time);await d.refresh();await d.send('ACT',{screenId:d.snapshot.state.screenId,actionId:'channel.open-create-menu'});
 await d.reopen();assert.equal(d.snapshot.view.resumeRequired,true);assert.equal(d.snapshot.view.instruction.informational,true);assert.equal(d.snapshot.state.screenId,'blogger.channel.menu');assert.equal(d.snapshot.view.device.kind,'phone');assert.ok(!d.snapshot.view.actions[0].outcome);assert.ok(!d.snapshot.state.progress.blogger.channelModel);await d.app.close();
});
test('strict catalog catches late mutation, broken refs and arbitrary hotspot geometry',()=>{
 assert.equal(assertMissionCatalog(c),c);const bad=structuredClone(c);bad.tasks['digital-id.hotel'].screens['digital-id.hotel.arrival'].assetId='unknown';assert.throws(()=>assertMissionCatalog(bad));
 const invalid=structuredClone(c);invalid.tasks['blogger.channel'].screens['blogger.channel.chats'].actions[0].rect=[0,0,9999,5];assert.throws(()=>assertMissionCatalog(invalid));
});
test('application commit failure publishes no progress; uncertain ACK retry deduplicates',async()=>{
 const memory=createMemoryPersistencePort();let fail='before',notifications=0;
 const storage={...memory,async commit(...args){if(fail==='before')throw new Error('write unavailable');const version=await memory.commit(...args);if(fail==='after')throw new Error('reply lost');return version;}};
 let now=1000;const app=createMissionSessionApplication({persistence:storage,now:()=>now});const s=await app.createSession({sessionId:'failure'});await app.subscribe('failure',()=>notifications++);
 const cmd={schemaVersion:1,type:'SELECT_MISSION',commandId:'select',sessionId:'failure',contentRevision:c.contentRevision,expectedRevision:s.state.revision,missionId:'blogger'};
 await assert.rejects(app.sendCommand(cmd),{code:'STORAGE_UNAVAILABLE'});assert.equal(notifications,1);assert.equal((await app.getSnapshot('failure')).state.status,'menu');
 fail='after';await assert.rejects(app.sendCommand(cmd),{code:'STORAGE_UNAVAILABLE'});fail=null;const retry=await app.sendCommand(cmd);assert.equal(retry.duplicate,true);assert.equal(retry.snapshot.state.status,'scan');assert.equal(retry.snapshot.state.revision,1);assert.equal(notifications,1);await app.close();
});
test('pause suppresses automatic ID changes; resume compensates elapsed phase',()=>{
 const d=driver();d.begin('digital-id');for(let i=0;i<2;i++){const s=d.model.state;d.send('ACT',{screenId:s.screenId,actionId:c.tasks[s.taskId].screens[s.screenId].actions[0].actionId});}
 d.time+=300;d.send('OWNER_CHANGED',{active:false},true);d.time+=10000;d.send('OWNER_CHANGED',{active:true},true);const s=d.model.state,screen=c.tasks[s.taskId].screens[s.screenId];assert.equal(d.send('AUTO_SCREEN',{screenId:s.screenId,actionId:screen.actions[0].actionId},true).reply.code,'SCREEN_NOT_READY');d.time+=800;assert.equal(d.send('AUTO_SCREEN',{screenId:s.screenId,actionId:screen.actions[0].actionId},true).reply.ok,true);
});
test('release at exact threshold completes; transport cancellation resets contact sequence',async()=>{
 const d=await appDriver();await d.app.inputOwnerChanged('application',{active:true});await d.refresh();await d.send('SELECT_MISSION',{missionId:'blogger'});
 await d.app.handleContact('application',{contactId:'p',sequence:0,type:'down',inside:true},d.time);d.time+=800;await d.app.handleContact('application',{contactId:'p',sequence:1,type:'up',inside:true},d.time);assert.equal((await d.refresh()).state.status,'task');
 await d.send('RESTART_MISSION');await d.app.inputOwnerChanged('application',{active:false},d.time);await d.app.inputOwnerChanged('application',{active:true},d.time);await d.app.handleContact('application',{contactId:'p',sequence:0,type:'down',inside:true},d.time);await d.app.close();
});
test('restored active owner is revoked before snapshot and paused; final QR persists beyond timer',async()=>{
 const d=await appDriver();await d.app.inputOwnerChanged('application',{active:true});await d.refresh();await d.send('SELECT_MISSION',{missionId:'blogger'});d.time+=6000;await d.app.pollTime('application',d.time);const before=(await d.refresh()).state.revision;
 d.time+=900000;await d.reopen();assert.equal(d.snapshot.state.ownerActive,false);assert.equal(d.snapshot.state.progress.blogger.remainingMs,174000);assert.equal(d.snapshot.view.remainingMs,174000);assert.equal(d.snapshot.state.revision,before+1);d.time+=900000;await d.app.pollTime('application',d.time);assert.equal((await d.refresh()).state.status,'scan');await d.app.inputOwnerChanged('application',{active:true},d.time);assert.equal((await d.refresh()).view.remainingMs,174000);await d.app.close();
 const logic=driver('final');logic.begin('blogger');logic.play();assert.equal(logic.model.state.deadlineAt,null);logic.time+=900000;assert.equal(logic.send('EXPIRE',{},true).reply.code,'TIMER_NOT_EXPIRED');assert.equal(logic.model.state.status,'completed');
});
test('pure mission kernel has no content, renderer, storage or clock dependency',()=>{
 const source=readFileSync(new URL('../src/core/mission-core.mjs',import.meta.url),'utf8');assert.ok(!/from\s+['"][^'"]*(?:content|render|application)|\b(?:document|window|localStorage|setTimeout|setInterval|Date|performance)\b/.test(source));
});
test('accepted client sequence: subscriber reply, shortened statistics, full voice before video, no PIN/group',()=>{
 const assets=task=>Object.values(c.tasks[task].screens).map(s=>s.assetId);
 assert.deepEqual(assets('blogger.comments'),['media.91755','media.91944','media.91998','media.91854']);
 assert.deepEqual(assets('blogger.statistics'),['media.91497','media.91501']);
 assert.deepEqual(assets('communication.message'),[74200,74231,74262,74293,74215,73633,73648,73690,73731,73772,73617].map(id=>`media.${id}`));
 assert.equal(c.tasks['digital-id.create-id'].screens['digital-id.create-id.redirect'].instruction,'');
 assert.equal(c.tasks['digital-id.create-id'].screens['digital-id.create-id.quick'].instruction,c.tasks['digital-id.create-id'].screens['digital-id.create-id.biometry'].instruction);
 assert.deepEqual(c.missions.communication.taskIds,['communication.call','communication.message','communication.reaction','communication.story']);
});
test('snapshot hides repeated ID instruction and final never awards missing content',async()=>{
 const d=await appDriver();await d.app.inputOwnerChanged('application',{active:true});await d.refresh();await d.send('SELECT_MISSION',{missionId:'digital-id'});
 await d.app.handleContact('application',{contactId:'p',sequence:0,type:'down',inside:true},d.time);d.time+=800;await d.app.pollTime('application',d.time);await d.refresh();
 for(let i=0;i<2;i++){const s=d.snapshot.state;await d.send('ACT',{screenId:s.screenId,actionId:c.tasks[s.taskId].screens[s.screenId].actions[0].actionId});}
 assert.equal(d.snapshot.view.instruction,null);assert.equal(d.snapshot.view.actions.length,0);assert.equal(d.snapshot.view.device.asset.assetId,'media.id-03');await d.app.close();
 for(const missionId of ['blogger','business']){
  const logic=driver(`final.${missionId}`);logic.begin(missionId);logic.play();const persistence=createMemoryPersistencePort();await persistence.create(logic.model.state.sessionId,{schemaVersion:2,mission:logic.model,layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:logic.time});
  const app=createMissionSessionApplication({persistence,now:()=>logic.time}),snapshot=await app.getSnapshot(logic.model.state.sessionId);
  assert.equal(snapshot.view.result.complete,missionId==='blogger');assert.ok(snapshot.view.qr.asset);assert.equal(snapshot.view.qr.url,'https://max.ru/');
  if(missionId==='business')assert.ok(!snapshot.view.result.text.includes('стал успешным'));
  await app.close();
 }
});
test('content versions are explicit and incompatible saved receipts are not silently migrated',()=>{
 const d=driver();d.begin('blogger');const previous=structuredClone(c);previous.contentRevision='missions-20261002-v1';
 assert.equal(restoreMissionModel(previous,d.model).ok,false);
 assert.equal(c.contentRevision,'missions-20261002-v2');
});
