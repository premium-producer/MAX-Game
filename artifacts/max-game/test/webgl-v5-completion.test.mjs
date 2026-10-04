import test from 'node:test';
import assert from 'node:assert/strict';
import {V5MissionContinuation,continueV5Mission,nextV5Mission} from '../src/journey-v5-mission-continuation.mjs';
import {V5RevealJourney} from '../src/journey-v5-route-layout.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../src/journey-v5-backend.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const content=sharedRevealContent(catalog);

for(const hz of [30,60,120])test(`maath exit/commit/enter at ${hz}Hz, repeat, pause and delayed acknowledgement`,async()=>{
 let acknowledge,commits=0,reveals=0,done=0;
 const f=new V5MissionContinuation({commit:()=>{commits++;return new Promise(r=>acknowledge=r);},reveal:()=>{assert.equal(f.opacity.value,0);reveals++;},done:()=>done++,error:assert.fail});
 assert.equal(f.start(),true);assert.equal(f.start(),false);let previous=1;
 for(let n=0;n<hz*3&&f.phase==='leaving';n++){f.tick(1/hz);assert.ok(f.opacity.value<=previous);previous=f.opacity.value;}
 await flush();assert.equal(commits,1);assert.equal(f.phase,'committing');assert.equal(f.opacity.value,0);assert.equal(reveals,0);
 acknowledge();await flush();assert.equal(reveals,1);f.tick(1,{active:false});assert.equal(f.opacity.value,0);
 for(let n=0;n<hz*3&&f.active;n++)f.tick(1/hz);
 assert.equal(f.opacity.value,1);assert.equal(done,1);assert.equal(f.active,false);
});
test('cancel cannot send a queued command or reveal a late response; rejection restores visibility',async()=>{
 let commits=0,reveals=0;
 const f=new V5MissionContinuation({commit:()=>commits++,reveal:()=>reveals++,done:()=>{},error:assert.fail});
 f.start();f.tick(.01,{reduced:true});f.cancel();await flush();assert.equal(commits,0);
 let resolve;
 const late=new V5MissionContinuation({commit:()=>new Promise(r=>resolve=r),reveal:()=>reveals++,done:()=>{},error:assert.fail});
 late.start();late.tick(.01,{reduced:true});await flush();late.cancel();resolve();await flush();assert.equal(reveals,0);
 let errors=0,done=0;const failure=new V5MissionContinuation({commit:()=>Promise.reject(Error('offline')),reveal:assert.fail,error:()=>errors++,done:()=>done++});
 failure.start();failure.tick(.01,{reduced:true});await flush();failure.tick(.01,{reduced:true});assert.equal(errors,1);assert.equal(done,1);assert.equal(failure.opacity.value,1);
});

test('final row retains visible positions through result, phone exit and QR; continue starts next at hand',async()=>{
 let now=1000,c;const app=createApp({persistence:createMemoryPersistencePort(),now:()=>now});
 const session=createWebGLSession({catalog,port:app,sessionId:'completion-test',onSnapshot:s=>c?.accept(s),onError:assert.fail});
 await session.start();
 c=new V5RevealJourney(content,session,(nodes,active,device,width)=>Object.fromEntries(nodes.map((n,i)=>[n.step,{x:(i-nodes.indexOf(active))*(width+400)-(width+device.width)/2-400+(i>nodes.indexOf(active)?device.width+400:0),y:0}])));
 c.configure(1760,1024,256);await session.command('SELECT_MISSION',{missionId:'blogger'});
 await session.contact('hand','down',true);now+=800;await session.contact('hand','up',true);
 const tick=()=>{for(let i=0;i<10;i++)c.tick(.1,{settled:true,deviceHidden:true,deviceReady:true,deviceShown:true,reduced:true});};tick();
 c.readCompletionPose=n=>{const p=c.pose(n);return {worldX:p.worldX-37,worldY:p.worldY+15};};
 let expected;
 for(let count=0;count<80&&session.snapshot.state.status!=='completed';count++){
  tick();const s=session.snapshot.state;
  if(s.status==='result'){now+=1000;await app.pollTime('completion-test');continue;}
  const screen=catalog.tasks[s.taskId].screens[s.screenId];
  if(screen.automaticMs!==null){now+=screen.automaticMs+100;await app.pollTime('completion-test');continue;}
  const action=session.snapshot.view.actions.find(a=>a.actionId==='channel.continue-private')??session.snapshot.view.actions[0];
  if(s.taskId==='blogger.statistics'&&screen.actions.some(a=>a.outcome.kind==='complete-task')){
   c.move('open-max',-123,221);expected=Object.fromEntries(c.nodes.map(n=>[n.step,c.readCompletionPose(n)]));
  }
  assert.equal(c.answer(action.actionId),true);await flush();
 }
 tick();assert.equal(c.phase,'complete');assert.deepEqual(c.completionPoses,expected);
 for(let i=0;i<20;i++){tick();for(const n of c.nodes){const p=c.pose(n);assert.deepEqual({worldX:p.worldX,worldY:p.worldY},expected[n.step]);}}
 const completed=structuredClone(session.snapshot.state.progress.blogger.completed),old={...session.snapshot.state};
 await continueV5Mission(session,content,old);
 assert.equal(session.snapshot.state.missionId,'digital-id');assert.equal(session.snapshot.state.status,'scan');assert.equal(c.phase,'palm');assert.equal(c.completionPoses,null);
 assert.deepEqual(session.snapshot.state.progress.blogger.completed,completed);
 await assert.rejects(()=>continueV5Mission(session,content,old),/STALE/);
 assert.equal(nextV5Mission(content,'business'),null);assert.equal(nextV5Mission(content,'unknown'),null);
 await session.close();await app.close();
});

test('previously scanned next mission is restarted, last mission returns to menu',async()=>{
 for(const missionId of ['blogger','business']){
  const calls=[],session={snapshot:{state:{runId:7,missionId,status:'completed'}},async command(type,fields){calls.push([type,fields]);this.snapshot={state:{missionId:fields?.missionId,status:'task'}};return {reply:{ok:true}};},async restart(){calls.push(['RESTART_MISSION']);this.snapshot.state.status='scan';return {reply:{ok:true}};}};
  await continueV5Mission(session,content,{runId:7,missionId});
  assert.deepEqual(calls,missionId==='blogger'?[['SELECT_MISSION',{missionId:'digital-id'}],['RESTART_MISSION']]:[['RETURN_MENU',{}]]);
 }
});
