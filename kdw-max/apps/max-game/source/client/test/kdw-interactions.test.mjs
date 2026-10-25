import {storeTimeline,storeGoal,storeRating,storeElapsed} from '../src/kdw-store-rating.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKdwCatalog,emptyInteraction,keyboardEdit,placeProduct} from '../src/kdw-interactions-model.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
import {POSTS_SCREEN,POSTS_RULES,postSpawn,postsGoal} from '../src/kdw-posts-model.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url)));
const catalog=createKdwCatalog(base);
function driver(c=catalog,rulesRevision='mission-rules-task-clock-v2'){
 let model=createMissionModel(c,{sessionId:'test',rulesRevision}),serial=0,now=1000000;
 function act(type,fields={},internal=false){const command={schemaVersion:1,type,commandId:'test.'+(++serial),sessionId:'test',contentRevision:c.contentRevision,expectedRevision:model.state.revision,...fields};const result=dispatchMissionCommand(c,model,command,{now:now++,internal});if(result.reply.ok)model=result.model;return {...result,command};}
 function postsRound(){
  if(!c.kdwPostsActivity||model.state.screenId!==POSTS_SCREEN)return;
  const fields={taskId:'business.channel',screenId:POSTS_SCREEN};
  if(!model.state.progress.business.postsActivity)assert.equal(act('START_POSTS',fields).reply.ok,true);
  for(let i=0;i<8&&!postsGoal(model.state.progress.business.postsActivity);i++){
   const p=model.state.progress.business.postsActivity,spawn=postSpawn(p,i);if(!spawn.post.good)continue;
   const elapsed=p.startRemainingMs-(model.state.deadlineAt-now);if(elapsed<spawn.start)now+=Math.ceil(spawn.start-elapsed);
   assert.equal(act('PUBLISH_POST',{...fields,spawnId:spawn.spawnId}).reply.ok,true);
  }
  assert.equal(postsGoal(model.state.progress.business.postsActivity),true);
 }
 function storeRound(){
  const fields={taskId:'business.store',screenId:'business.store.start'};
  if(!model.state.progress.business.storeActivity)assert.equal(act('START_STORE',fields).reply.ok,true);
  for(let i=0;i<40&&!storeGoal(model.state.progress.business.storeActivity);i++){
   const activity=model.state.progress.business.storeActivity,elapsed=storeElapsed(activity,model.state,now),timeline=storeTimeline(activity);
   const spawn=timeline.at(elapsed).find(s=>s.post.good);
   if(!spawn){now+=1000;continue;}
   assert.equal(act('PICK_PRODUCT',{...fields,spawnId:spawn.spawnId}).reply.ok,true);
  }
  assert.ok(storeGoal(model.state.progress.business.storeActivity));
 }
 function reach(missionId,screenId){
  assert.equal(act('OWNER_CHANGED',{active:true},true).reply.ok,true);act('SELECT_MISSION',{missionId});act('HOLD_CONFIRMED',{},true);
  for(let i=0;i<150&&model.state.screenId!==screenId;i++){
   const s=model.state;if(s.status==='result'){now+=1000;assert.equal(act('ADVANCE_RESULT').reply.ok,true);continue;}
   postsRound();const screen=c.tasks[s.taskId].screens[s.screenId],action=screen.actions.find(a=>a.outcome.kind!=='incorrect'&&a.outcome.screenId!==s.screenId);
   assert.ok(action,`${s.taskId}/${s.screenId}`);if(screen.automaticMs!==null)now+=screen.automaticMs;
   assert.equal(act(screen.automaticMs!==null?'AUTO_SCREEN':'ACT',{taskId:s.taskId,screenId:s.screenId,actionId:action.actionId},screen.automaticMs!==null).reply.ok,true);
  }
  assert.equal(model.state.screenId,screenId);
 }
 return {act,reach,postsRound,storeRound,advance(ms){now+=ms;},get model(){return model;},get now(){return now;}};
}
test('real channel input required; commands preserve draft through creation and replay',()=>{
 const d=driver();d.reach('blogger','blogger.channel.name');
 assert.equal(d.act('ACT',{screenId:'blogger.channel.name',actionId:'channel.fill-name-example'}).reply.code,'CHANNEL_NAME_REQUIRED');
 const value={name:'Мой канал',description:'Новости и общение',avatar:'heart'};
 const saved=d.act('SAVE_INTERACTION',{taskId:'blogger.channel',screenId:'blogger.channel.name',value});assert.equal(saved.reply.ok,true);
 const duplicate=dispatchMissionCommand(catalog,d.model,saved.command,{now:d.now});assert.equal(duplicate.duplicate,true);
 assert.equal(d.act('ACT',{screenId:'blogger.channel.name',actionId:'channel.fill-name-example'}).reply.ok,true);
 assert.equal(d.act('ACT',{screenId:'blogger.channel.filled',actionId:'channel.create'}).reply.ok,true);
 assert.equal(d.model.state.screenId,'blogger.channel.privacy');
 const restored=restoreMissionModel(catalog,JSON.parse(JSON.stringify(d.model)));assert.equal(restored.ok,true);assert.deepEqual(restored.model.state.progress.blogger.interactions['blogger.channel'],value);
});
test('empty/invalid channel name cannot advance; stale and oversized edits rejected',()=>{
 const d=driver();d.reach('blogger','blogger.channel.name');
 const save=value=>d.act('SAVE_INTERACTION',{taskId:'blogger.channel',screenId:'blogger.channel.name',value});
 assert.equal(save({...emptyInteraction('channel'),name:'a'.repeat(65)}).reply.code,'INVALID_INTERACTION');
 assert.equal(save({...emptyInteraction('channel'),name:' '}).reply.ok,true);
 assert.equal(d.act('ACT',{screenId:'blogger.channel.name',actionId:'channel.fill-name-example'}).reply.code,'CHANNEL_NAME_REQUIRED');
 assert.equal(d.act('SAVE_INTERACTION',{taskId:'business.store',screenId:'business.store.start',value:emptyInteraction('store')}).reply.code,'WRONG_CONTEXT');
 d.act('RETURN_MENU');assert.equal(save({...emptyInteraction('channel'),name:'Поздний ответ'}).reply.code,'INTERACTION_UNAVAILABLE');
});
test('legacy store selections still validate and replay under the new catalog',()=>{
 const d=driver({...catalog,kdwStoreActivity:false});d.reach('business','business.store.start');
 assert.equal(d.act('ACT',{screenId:'business.store.start',actionId:'business.store.start.continue'}).reply.code,'STORE_PRODUCT_REQUIRED');
 const save=value=>d.act('SAVE_INTERACTION',{taskId:'business.store',screenId:'business.store.start',value});
 assert.equal(save({slots:['unknown',null,null,null,null,null]}).reply.code,'INVALID_INTERACTION');
 assert.equal(save({slots:['brazil','brazil',null,null,null,null]}).reply.code,'INVALID_INTERACTION');
 const slots=placeProduct(placeProduct(emptyInteraction('store').slots,'brazil',0),'ethiopia',1);
 assert.equal(save({slots}).reply.ok,true);
 for(const step of ['start','publish','result'])assert.equal(d.act('ACT',{screenId:`business.store.${step}`,actionId:`business.store.${step}.continue`}).reply.ok,true);
 assert.equal(d.model.state.status,'result');assert.ok(d.model.state.progress.business.completed.includes('business.store'));
 assert.deepEqual(restoreMissionModel(catalog,d.model).model.state.progress.business.interactions['business.store'].slots,slots);
});
test('removal/move and restart retain semantic ownership of the current run',()=>{
 let slots=placeProduct(emptyInteraction('store').slots,'brazil',0);slots=placeProduct(slots,'brazil',3);assert.equal(slots[0],null);assert.equal(slots[3],'brazil');
 const d=driver();d.reach('business','business.store.start');d.act('SAVE_INTERACTION',{taskId:'business.store',screenId:'business.store.start',value:{slots}});d.act('RESTART_MISSION');assert.equal(d.model.state.progress.business.interactions,undefined);
});
test('application persistence restores the draft after closing and reopening the authority',async()=>{
 const d=driver();d.reach('blogger','blogger.channel.name');d.act('SAVE_INTERACTION',{taskId:'blogger.channel',screenId:'blogger.channel.name',value:{name:'Сохранённый канал',description:'После перезапуска',avatar:'cat'}});
 const persistence=createMemoryPersistencePort();await persistence.create('test',{schemaVersion:2,mission:d.model,layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:d.now});
 const app=createMissionSessionApplication({catalog,persistence,now:()=>d.now+10000});const snapshot=await app.getSnapshot('test');assert.equal(snapshot.state.progress.blogger.interactions['blogger.channel'].name,'Сохранённый канал');await app.close();
 const reopened=createMissionSessionApplication({catalog,persistence,now:()=>d.now+20000});assert.equal((await reopened.getSnapshot('test')).state.progress.blogger.interactions['blogger.channel'].description,'После перезапуска');await reopened.close();
});

test('saved store selection from the separate scene restores in the native device without progress reset',()=>{
 const previous=structuredClone(catalog);previous.tasks['business.store']=structuredClone(base.tasks['business.store']);
 const d=driver(previous);d.reach('business','business.store.start');const value={slots:['brazil',null,'ethiopia',null,null,null]};
 assert.equal(d.act('SAVE_INTERACTION',{taskId:'business.store',screenId:'business.store.start',value}).reply.ok,true);
 const restored=restoreMissionModel(catalog,JSON.parse(JSON.stringify(d.model)));assert.equal(restored.ok,true);
 assert.deepEqual(restored.model.state.progress.business.interactions['business.store'],value);
 assert.deepEqual(restored.model.state.progress.business.completed,d.model.state.progress.business.completed);
 for(const screen of Object.values(catalog.tasks['business.store'].screens).filter(s=>['business.store.start','business.store.publish','business.store.result'].includes(s.screenId))){assert.equal(screen.deviceKind,'phone');assert.equal(screen.assetId,'kdw.native.store-phone');assert.ok(screen.actions.every(a=>a.placement==='below-screen'&&!a.rect));}
});

test('business registration begins with three explicit choices; every choice persists and advances to login',()=>{
 const task=catalog.tasks['business.platform'];assert.equal(task.startScreenId,'business.platform.business-type');assert.equal(Object.keys(task.screens)[0],task.startScreenId);
 assert.deepEqual(task.screens[task.startScreenId].actions.map(a=>a.label),['Кофейня','Цветочный магазин','Автомастерская','Спортивный магазин','Отель','Театр']);
 for(const type of ['cafe','flowers','auto','sports','hotel','theater']){
  const d=driver();d.reach('business',task.startScreenId);const deadline=d.model.state.deadlineAt;
  assert.equal(d.act('ACT',{screenId:task.startScreenId,actionId:'business.platform.choose-other'}).reply.code,'ACTION_UNAVAILABLE');
  assert.equal(d.act('ACT',{screenId:task.startScreenId,actionId:'business.platform.choose-'+type}).reply.ok,true);
  assert.equal(d.model.state.screenId,'business.platform.login');assert.equal(d.model.state.progress.business.answers.businessType,type);assert.equal(d.model.state.deadlineAt,deadline);
  const restored=restoreMissionModel(catalog,JSON.parse(JSON.stringify(d.model)));assert.equal(restored.ok,true);assert.equal(restored.model.state.progress.business.answers.businessType,type);
  assert.equal(d.act('RETURN_MENU').reply.ok,true);assert.equal(d.act('SELECT_MISSION',{missionId:'business'}).reply.ok,true);assert.equal(d.model.state.screenId,'business.platform.login');assert.equal(d.model.state.progress.business.answers.businessType,type);
 }
});

test('old accepted business receipts restore; a restarted run requires the new choice and mixed history remains valid',()=>{
 const previous=structuredClone(catalog);previous.kdwPostsActivity=null;delete previous.tasks['business.platform'].screens['business.platform.business-type'];previous.tasks['business.platform'].startScreenId='business.platform.login';delete previous.kdwBusinessChoice;
 const d=driver(previous);d.reach('business','business.store.start');const old=JSON.parse(JSON.stringify(d.model));
 const restored=restoreMissionModel(catalog,old);assert.equal(restored.ok,true);assert.deepEqual(restored.model,old);
 let model=restored.model;let now=d.now+1;
 for(const type of ['RESTART_MISSION','HOLD_CONFIRMED']){const command={schemaVersion:1,type,commandId:'upgrade.'+type,sessionId:'test',contentRevision:catalog.contentRevision,expectedRevision:model.state.revision};const result=dispatchMissionCommand(catalog,model,command,{now:now++,internal:type==='HOLD_CONFIRMED'});assert.equal(result.reply.ok,true);model=result.model;}
 assert.equal(model.state.screenId,'business.platform.business-type');assert.equal(restoreMissionModel(catalog,model).ok,true);
 old.receipts.find(r=>r.command.type==='HOLD_CONFIRMED').reply.snapshot.progress.business.answers.businessType='hotel';assert.equal(restoreMissionModel(catalog,old).ok,false);
});
test('keyboard edits at caret, replaces selection, handles emoji deletion and length',()=>{
 assert.deepEqual(keyboardEdit('Мой канал',4,9,'мир'),{value:'Мой мир',caret:7});
 assert.deepEqual(keyboardEdit('MAX♥',4,4,'backspace'),{value:'MAX',caret:3});
 assert.deepEqual(keyboardEdit('MAX😀',5,5,'backspace'),{value:'MAX',caret:3});
 assert.deepEqual(keyboardEdit('абв',1,1,'Я'),{value:'аЯбв',caret:2});
 assert.equal(keyboardEdit('abc',3,3,'d',{limit:3}).value,'abc');
});
test('legacy stand rules still replay without requiring KDW draft data',()=>{
 const d=driver(base,'mission-rules-v1');d.reach('blogger','blogger.channel.name');assert.equal(d.act('ACT',{screenId:'blogger.channel.name',actionId:'channel.fill-name-example'}).reply.ok,true);assert.equal(restoreMissionModel(base,d.model).ok,true);
});

test('installed task clock grants one minute per task, never per internal screen, and expires the mission',()=>{
 const d=driver();d.reach('blogger','blogger.channel.chats');assert.equal(d.model.state.deadlineAt-d.model.state.startedAt,60000);
 const deadline=d.model.state.deadlineAt;d.advance(5000);d.act('ACT',{screenId:'blogger.channel.chats',actionId:'channel.open-create-menu'});assert.equal(d.model.state.deadlineAt,deadline);
 d.advance(60000);assert.equal(d.act('EXPIRE',{},true).reply.ok,true);assert.equal(d.model.state.status,'expired');
});

test('all four stand missions and all fifteen tasks complete through the local authority',()=>{
 let total=0;
 for(const mission of Object.values(catalog.missions)){
  const d=driver(),first=catalog.tasks[mission.taskIds[0]];d.reach(mission.missionId,first.startScreenId);
  for(let i=0;i<300&&!['completed','incomplete'].includes(d.model.state.status);i++){
   const s=d.model.state;
   if(s.status==='result'){d.advance(3000);assert.equal(d.act('ADVANCE_RESULT').reply.ok,true);continue;}
   assert.equal(s.status,'task');
   d.postsRound();
   if(s.screenId==='blogger.channel.name')assert.equal(d.act('SAVE_INTERACTION',{taskId:s.taskId,screenId:s.screenId,value:{schemaVersion:2,name:'Канал MAX',description:'Проверка стендовой базы',avatar:'cat',visibility:'private',slug:'max_test'}}).reply.ok,true);
   if(s.screenId==='blogger.comments.input')assert.equal(d.act('SAVE_INTERACTION',{taskId:s.taskId,screenId:s.screenId,value:{schemaVersion:1,reply:'Ждём в следующем году!'}}).reply.ok,true);
   if(s.screenId==='business.store.start')d.storeRound();
   const screens=catalog.tasks[s.taskId].screens,screen=screens[s.screenId],queue=[{id:s.screenId,first:null}],seen=new Set();let action;
   while(queue.length&&!action){const node=queue.shift();if(seen.has(node.id))continue;seen.add(node.id);for(const candidate of screens[node.id].actions){if(candidate.outcome.kind==='incorrect')continue;const first=node.first??candidate;if(candidate.outcome.kind!=='navigate'){action=first;break;}queue.push({id:candidate.outcome.screenId,first});}}
   assert.ok(action,s.screenId);if(screen.automaticMs!==null)d.advance(screen.automaticMs);
   assert.equal(d.act(screen.automaticMs!==null?'AUTO_SCREEN':'ACT',{taskId:s.taskId,screenId:s.screenId,actionId:action.actionId},screen.automaticMs!==null).reply.ok,true,s.screenId);
  }
  assert.equal(d.model.state.status,'completed',mission.missionId);assert.deepEqual(d.model.state.progress[mission.missionId].completed,mission.taskIds);total+=mission.taskIds.length;
 }
 assert.equal(total,15);
});

test('rated store rejects early completion, scores wrong goods below four, recovers to4.9 and replays',async()=>{
 const d=driver();d.reach('business','business.store.start');const fields={taskId:'business.store',screenId:'business.store.start'},action={screenId:fields.screenId,actionId:fields.screenId+'.continue'};
 assert.equal(d.act('ACT',action).reply.code,'STORE_RATING_REQUIRED');
 assert.equal(d.act('START_STORE',fields).reply.ok,true);assert.equal(storeRating(d.model.state.progress.business.storeActivity),4);
 let bad;for(let i=0;i<30&&!bad;i++){const a=d.model.state.progress.business.storeActivity;bad=storeTimeline(a).at(storeElapsed(a,d.model.state,d.now)).find(s=>!s.post.good);if(!bad)d.advance(1000);}
 assert.ok(bad);assert.equal(d.act('PICK_PRODUCT',{...fields,spawnId:bad.spawnId}).reply.ok,true);assert.equal(storeRating(d.model.state.progress.business.storeActivity),3.9);
 assert.equal(d.act('PICK_PRODUCT',{...fields,spawnId:bad.spawnId}).reply.code,'PRODUCT_ALREADY_ADDED');assert.equal(d.act('PICK_PRODUCT',{...fields,spawnId:'999.99999999'}).reply.code,'PRODUCT_NOT_AVAILABLE');
 assert.equal(d.act('ACT',action).reply.code,'STORE_RATING_REQUIRED');d.storeRound();const a=d.model.state.progress.business.storeActivity;assert.ok(storeRating(a)>=4.9);assert.ok(a.published.some(r=>r.score===3)&&a.published.some(r=>r.score===5));
 assert.equal(restoreMissionModel(catalog,structuredClone(d.model)).ok,true);
 const persistence=createMemoryPersistencePort();await persistence.create('test',{schemaVersion:2,mission:d.model,layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:d.now});
 const app=createMissionSessionApplication({catalog,persistence,now:()=>d.now+1000});assert.deepEqual((await app.getSnapshot('test')).state.progress.business.storeActivity.published,a.published);await app.close();
 const reopened=createMissionSessionApplication({catalog,persistence,now:()=>d.now+2000});assert.equal(storeRating((await reopened.getSnapshot('test')).state.progress.business.storeActivity),storeRating(a));await reopened.close();
 assert.equal(d.act('ACT',action).reply.ok,true);
});

test('native store publishes directly from its current screen, once, with the same catalogue and replayable completion',()=>{
 for(const step of ['start','publish','result']){
  const d=driver();d.reach('business','business.store.start');
  const command={screenId:'business.store.start',actionId:'business.store.start.publish-now'};
  assert.equal(d.act('ACT',command).reply.code,'STORE_RATING_REQUIRED');
  d.storeRound();
  if(step!=='start')assert.equal(d.act('ACT',{screenId:'business.store.start',actionId:'business.store.start.continue'}).reply.ok,true);
  if(step==='result')assert.equal(d.act('ACT',{screenId:'business.store.publish',actionId:'business.store.publish.continue'}).reply.ok,true);
  command.screenId='business.store.'+step;
  command.actionId=command.screenId+'.publish-now';
  const published=structuredClone(d.model.state.progress.business.storeActivity.published),r=d.act('ACT',command);
  assert.equal(r.reply.ok,true);assert.equal(d.model.state.screenId,command.screenId);assert.equal(d.model.state.status,'result');
  assert.deepEqual(d.model.state.progress.business.storeActivity.published,published);
  assert.equal(d.model.state.progress.business.completed.filter(t=>t==='business.store').length,1);
  assert.equal(dispatchMissionCommand(catalog,d.model,r.command,{now:d.now}).duplicate,true);
  assert.equal(d.act('ACT',command).reply.code,'TASK_UNAVAILABLE');
  assert.equal(restoreMissionModel(catalog,d.model).ok,true);
  d.advance(900);assert.equal(d.act('ADVANCE_RESULT').reply.ok,true);assert.equal(d.model.state.status,'completed');
 }
});

test('saved v1 rated store receipts retain their old timeline after density upgrade',()=>{
 const d=driver({...catalog,kdwStoreActivity:1});d.reach('business','business.store.start');d.storeRound();
 assert.equal(d.model.state.progress.business.storeActivity.version,1);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
});
test('saved v2 store receipts retain the density timeline after lane upgrade',()=>{
 const d=driver({...catalog,kdwStoreActivity:2});d.reach('business','business.store.start');d.storeRound();
 assert.equal(d.model.state.progress.business.storeActivity.version,2);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
});
test('saved v3 store receipts retain the lane timeline after free-flight upgrade',()=>{
 const d=driver({...catalog,kdwStoreActivity:3});d.reach('business','business.store.start');d.storeRound();
 assert.equal(d.model.state.progress.business.storeActivity.version,3);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
});
test('saved v4 store receipts retain their speed after the double-speed upgrade',()=>{
 const d=driver({...catalog,kdwStoreActivity:4});d.reach('business','business.store.start');d.storeRound();
 assert.equal(d.model.state.progress.business.storeActivity.version,4);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
});
test('saved v5 store receipts retain prefilled history after empty-start upgrade',()=>{
 const d=driver({...catalog,kdwStoreActivity:5});d.reach('business','business.store.start');d.storeRound();
 assert.equal(d.model.state.progress.business.storeActivity.version,5);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
});
test('saved v6 store keeps its original products and scores after reviewed content update',()=>{
 const d=driver({...catalog,kdwStoreActivity:6});d.reach('business','business.store.start');d.storeRound();
 assert.equal(d.model.state.progress.business.storeActivity.version,6);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
 assert.ok(d.model.state.progress.business.storeActivity.published.every(p=>!p.postId.includes('-product-')));
});
