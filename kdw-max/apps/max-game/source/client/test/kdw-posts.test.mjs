import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {POSTS_RULES,POSTS_SCREEN,postSpawn,visiblePosts,postsGoal,postBank,postWave} from '../src/kdw-posts-model.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))));
function driver(c=catalog,type='cafe'){
 let model=createMissionModel(c,{sessionId:'posts-test',rulesRevision:'mission-rules-task-clock-v2'}),time=1000000,serial=0;
 const send=(kind,fields={},internal=false)=>{const command={schemaVersion:1,type:kind,sessionId:model.state.sessionId,contentRevision:c.contentRevision,expectedRevision:model.state.revision,commandId:'posts.'+(++serial),...fields},r=dispatchMissionCommand(c,model,command,{now:time++,internal});if(r.reply.ok)model=r.model;return {...r,command};};
 send('OWNER_CHANGED',{active:true},true);send('SELECT_MISSION',{missionId:'business'});send('HOLD_CONFIRMED',{},true);
 for(let i=0;i<100&&model.state.screenId!==POSTS_SCREEN;i++){
  const s=model.state;if(s.status==='result'){time+=1000;assert.equal(send('ADVANCE_RESULT').reply.ok,true);continue;}
  const screen=c.tasks[s.taskId].screens[s.screenId],a=screen.actions.find(a=>a.actionId==='business.platform.choose-'+type)??screen.actions.find(a=>a.outcome.kind!=='incorrect'&&a.outcome.screenId!==s.screenId);
  if(screen.automaticMs!==null)time+=screen.automaticMs;
  assert.equal(send(screen.automaticMs!==null?'AUTO_SCREEN':'ACT',{screenId:s.screenId,actionId:a.actionId},screen.automaticMs!==null).reply.ok,true);
 }
 assert.equal(model.state.screenId,POSTS_SCREEN);
 const fields={taskId:'business.channel',screenId:POSTS_SCREEN};
 return {send,start(){return send('START_POSTS',fields);},publish(i,extra={}){const p=model.state.progress.business.postsActivity,spawn=postSpawn(p,i),elapsed=p.startRemainingMs-(model.state.deadlineAt-time);if(elapsed<spawn.start)time+=Math.ceil(spawn.start-elapsed);return send('PUBLISH_POST',{...fields,spawnId:spawn.spawnId,...extra});},finish(){return send('ACT',{screenId:POSTS_SCREEN,actionId:'business.channel.result.continue'});},advance(ms){time+=ms;},get time(){return time;},get model(){return model;},get posts(){return model.state.progress.business.postsActivity;}};
}
test('activity is a phone in the existing scene; three business banks contain useful and harmful copy',()=>{
 const screen=catalog.tasks['business.channel'].screens[POSTS_SCREEN];assert.equal(screen.deviceKind,'phone');assert.equal(screen.assetId,'kdw.posts.phone');
 for(const type of ['cafe','hotel','theater']){const d=driver(catalog,type);assert.equal(d.start().reply.ok,true);assert.equal(d.posts.businessType,type);assert.ok(postBank(type).some(p=>p.good)&&postBank(type).some(p=>!p.good));}
});
test('core requires a real goal; accepts good/bad, rejects duplicated publication and forged audience',()=>{
 const d=driver();assert.equal(d.finish().reply.code,'POSTS_GOAL_REQUIRED');assert.equal(d.start().reply.ok,true);assert.equal(d.start().reply.code,'POSTS_ALREADY_STARTED');
 let total=POSTS_RULES.initialAudience;
 for(let i=0;i<40&&!postsGoal(d.posts);i++){
  const spawn=postSpawn(d.posts,i);if(i>1&&!spawn.post.good)continue;
  const r=d.publish(i);assert.equal(r.reply.ok,true);total+=spawn.post.delta;assert.equal(d.posts.audience,total);
  const duplicate=dispatchMissionCommand(catalog,d.model,r.command,{now:d.time});assert.equal(duplicate.duplicate,true);assert.equal(duplicate.model.state.progress.business.postsActivity.audience,total);
  if(!postsGoal(d.posts))assert.equal(d.send('PUBLISH_POST',{taskId:'business.channel',screenId:POSTS_SCREEN,spawnId:spawn.spawnId}).reply.code,'POST_ALREADY_PUBLISHED');
 }
 assert.equal(postsGoal(d.posts),true);assert.equal(d.finish().reply.ok,true);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
 const forged=driver();forged.start();assert.equal(forged.publish(0,{audience:999999}).reply.code,'INVALID_COMMAND');
});
test('schedule is time-based, bounded and stable; stale/paused/late choices cannot change state',()=>{
 const d=driver();d.start();assert.deepEqual(visiblePosts(d.posts,6000),visiblePosts(structuredClone(d.posts),6000));assert.ok(visiblePosts(d.posts,50000).length<=10);
 assert.equal(d.send('PUBLISH_POST',{taskId:'business.channel',screenId:POSTS_SCREEN,spawnId:d.posts.runId+'.999'}).reply.code,'POST_NOT_AVAILABLE');
 d.send('OWNER_CHANGED',{active:false},true);const saved=JSON.stringify(d.model);assert.equal(d.publish(0).reply.code,'POSTS_PAUSED');assert.equal(JSON.stringify(d.model),saved);
 d.advance(10000);d.send('OWNER_CHANGED',{active:true},true);assert.equal(d.publish(0).reply.ok,true);
 d.advance(100000);assert.equal(d.publish(1).reply.code,'MISSION_EXPIRED');
});
test('accepted history restores exactly, tampering is rejected, and older completed channels remain valid',()=>{
 const d=driver();d.start();d.publish(0);const saved=structuredClone(d.model);assert.equal(restoreMissionModel(catalog,saved).ok,true);saved.state.progress.business.postsActivity.audience++;assert.equal(restoreMissionModel(catalog,saved).ok,false);
 const old=structuredClone(catalog);old.kdwPostsActivity=null;const legacy=driver(old);assert.equal(legacy.finish().reply.ok,true);const restored=restoreMissionModel(catalog,legacy.model);assert.equal(restored.ok,true);assert.deepEqual(restored.model,legacy.model);
 const unfinished=driver(old);assert.equal(restoreMissionModel(catalog,unfinished.model).ok,true);
});
test('return and resume preserve the activity and remaining budget instead of rerolling cards',()=>{
 const d=driver();d.start();d.publish(0);const p=structuredClone(d.posts);d.send('RETURN_MENU');d.advance(50000);d.send('SELECT_MISSION',{missionId:'business'});assert.deepEqual(d.posts,p);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
});
test('storage failure cannot award audience; reconciliation and retry commit once and survive reopening',async()=>{
 const d=driver();d.start();let now=d.time,fail=true;const store=createMemoryPersistencePort(),id=d.model.state.sessionId;
 await store.create(id,{schemaVersion:2,clockCheckpointAt:now,mission:d.model,layouts:{layoutRevision:0,positions:{},receipts:[]}});
 const persistence={load:(...a)=>store.load(...a),create:(...a)=>store.create(...a),async commit(id,version,record){if(fail&&record.mission.receipts.at(-1)?.command.type==='PUBLISH_POST')throw Error('disk full');return store.commit(id,version,record);}};
 const app=createMissionSessionApplication({catalog,persistence,now:()=>now++});await app.getSnapshot(id);await app.inputOwnerChanged(id,{active:true});const before=await app.getSnapshot(id),spawn=postSpawn(before.state.progress.business.postsActivity,0);
 now+=Math.ceil(Math.max(0,spawn.start))+5;
 const command={schemaVersion:1,type:'PUBLISH_POST',sessionId:id,contentRevision:catalog.contentRevision,expectedRevision:before.state.revision,commandId:'fault.retry',taskId:'business.channel',screenId:POSTS_SCREEN,spawnId:spawn.spawnId};
 await assert.rejects(app.sendCommand(command),e=>e.code==='STORAGE_UNAVAILABLE'&&e.cause?.message==='disk full');assert.equal((await app.getSnapshot(id)).state.progress.business.postsActivity.published.length,0);
 fail=false;assert.equal((await app.sendCommand(command)).reply.code,'REVISION_CONFLICT');await app.inputOwnerChanged(id,{active:true});now+=Math.ceil(Math.max(0,spawn.start))+5;const fresh=await app.getSnapshot(id),retry={...command,commandId:'fault.retry.confirmed',expectedRevision:fresh.state.revision};const accepted=await app.sendCommand(retry);assert.equal(accepted.reply.ok,true,accepted.reply.code);const duplicate=await app.sendCommand(retry);assert.equal(duplicate.duplicate,true,duplicate.reply.code);assert.equal(duplicate.snapshot.state.progress.business.postsActivity.published.length,1);
 await app.close();const reopened=createMissionSessionApplication({catalog,persistence,now:()=>now++}),restored=await reopened.getSnapshot(id);assert.deepEqual(restored.state.progress.business.postsActivity,accepted.snapshot.state.progress.business.postsActivity);await reopened.close();
});

test('legacy looped waves have 2–6 simultaneous posts on both sides, remain bounded and continue after twenty',()=>{
 for(let seed=0;seed<8;seed++){
  const p={version:2,seed,runId:1,businessType:'cafe',published:[]},counts=new Set();
  for(let wave=0;wave<20;wave++){
   const t=wave*POSTS_RULES.travel+1,rows=visiblePosts(p,t);counts.add(rows.length);
   assert.ok(rows.length>=2&&rows.length<=6);assert.equal(new Set(rows.map(r=>r.start)).size,1);
   assert.equal(new Set(rows.map(r=>r.lane)).size,2);assert.equal(new Set(rows.map(r=>`${r.lane}:${r.column}`)).size,rows.length);
   assert.ok(rows.every(r=>r.start===wave*POSTS_RULES.travel));
   assert.deepEqual(rows,visiblePosts(structuredClone(p),t));
   if(wave===19)assert.ok(rows[0].index>20);
  }
  assert.deepEqual([...counts].sort(),[2,3,4,5,6]);
 }
 const d=driver({...catalog,kdwPostsActivity:2});d.start();const first=postWave(d.posts,0);for(let i=0;i<first.count;i++)assert.equal(d.publish(i).reply.ok,true);
 assert.equal(restoreMissionModel(catalog,d.model).ok,true);
});
test('saved P1 activity keeps its original rules and replays under the new catalog',()=>{
 for(const version of [1,2,3,4,5,6,7,8,9,10,11]){
 const old={...catalog,kdwPostsActivity:version},d=driver(old);d.start();assert.equal(d.posts.version,version);
 for(let i=0;i<8&&!postsGoal(d.posts);i++)d.publish(i);
 assert.equal(d.finish().reply.ok,true);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
 }
});

