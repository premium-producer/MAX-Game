import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MISSION_CATALOG as catalog} from '../src/content/mission-catalog.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
import {missionScreenMarkup,missionViewKey,decodeMissionImages,presentationAllowsPoll} from '../src/bfm-mission-screen.mjs';

for(const missionId of Object.keys(catalog.missions))for(const branch of missionId==='blogger'?['private','public']:['default'])test(`BFM descriptor + SessionPort complete path: ${missionId}/${branch}`,async()=>{
 let now=1000;const persistence=createMemoryPersistencePort();
 const port=createMissionSessionApplication({persistence,now:()=>now});
 const errors=[];const session=createWebGLSession({port,catalog,sessionId:'bfm-game',profile:'local',onError:e=>errors.push(e)});
 await session.start();await session.command('SELECT_MISSION',{missionId});await session.contact('palm','down',true);
 now+=800;await session.poll(now);assert.equal(session.snapshot.state.status,'task');
 const seen=new Set();let actions=0;
 while(!['completed','incomplete'].includes(session.snapshot.state.status)){
  assert.ok(actions++<140,'bounded actual mission');const snapshot=session.snapshot,{state,view}=snapshot;
  const markup=missionScreenMarkup(snapshot,catalog);assert.match(markup,/task-dialog/);
  assert.equal(presentationAllowsPoll(snapshot,{ready:false,visibleMs:99999}),false,'unshown screens cannot auto-advance');
  seen.add(state.taskId);
  if(state.status==='result'){
   if(state.progress[missionId].skipped.includes(state.taskId)){assert.match(markup,/Задание пропущено/);assert.doesNotMatch(markup,/Задание выполнено/);}
   assert.equal(view.actions.length,0);assert.equal(presentationAllowsPoll(snapshot,{ready:true,visibleMs:799}),false);
   now+=800;assert.equal(presentationAllowsPoll(snapshot,{ready:true,visibleMs:800}),true);await session.poll(now);continue;
  }
  const screen=catalog.tasks[state.taskId].screens[state.screenId];
  if(view.automaticMs!==null){now+=Math.max(100,view.automaticMs);await session.poll(now);continue;}
  let choice=view.actions[0];
  if(state.screenId.endsWith('.privacy'))choice=view.actions.find(a=>a.actionId===`channel.${branch==='public'?'choose-public':'continue-private'}`);
  if(state.screenId.endsWith('.public-confirm'))choice=view.actions.find(a=>a.actionId==='channel.use-new-link');
  assert.ok(markup.includes(`data-answer="${choice.actionId}"`));assert.ok(markup.includes(`data-answer-token="${missionViewKey(state)}"`));
  const original=state.screenId,revision=state.revision;now+=100;
  const result=await session.act(original,choice.actionId,revision);assert.equal(result.reply.ok,true);
  assert.equal(await session.act(original,choice.actionId,revision),null,'old press cannot advance twice');
 }
 const final=session.snapshot;assert.equal(final.state.status,['communication','business','business-test'].includes(missionId)?'incomplete':'completed');
 assert.deepEqual([...seen],catalog.missions[missionId].taskIds);assert.match(missionScreenMarkup(final,catalog),/mission-qr/);
 if(branch==='public')assert.equal(final.state.progress.blogger.answers['channel-type'],'public');
 assert.deepEqual(errors,[]);
 await session.restart();assert.equal(session.snapshot.state.status,'scan');assert.equal(session.snapshot.state.scanned,false);await session.close();
});
test('incoming frame waits for actual decode and aborts promptly on restart',async()=>{
 let finish;const decode=new Promise(resolve=>{finish=resolve;});
 const root={querySelectorAll:()=>[{decode:()=>decode}]};const controller=new AbortController();
 const pending=decodeMissionImages(root,controller.signal);controller.abort();
 await assert.rejects(pending,{name:'AbortError'});finish();
 const error=new Error('bad image');await assert.rejects(decodeMissionImages({querySelectorAll:()=>[{decode:()=>Promise.reject(error)}]},new AbortController().signal),/bad image/);
});
