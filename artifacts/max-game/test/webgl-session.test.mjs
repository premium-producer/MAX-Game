import test from 'node:test';
import assert from 'node:assert/strict';
import {MISSION_CATALOG as catalog} from '../src/content/mission-catalog.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
import {createWebGLSession,WEBGL_SHARED_KEY} from '../src/application/webgl-session.mjs';
import {SITE_SHARED_KEY,createSiteSession} from '../public/site-game/site-session.mjs';
import {createBrowserPersistence} from '../src/application/browser-persistence.mjs';

function fixture(persistence=createMemoryPersistencePort(),initialTime=1000){
 let time=initialTime;const app=createMissionSessionApplication({catalog,persistence,now:()=>time}),errors=[];
 const session=createWebGLSession({catalog,port:app,sessionId:'site-shared',onError:e=>errors.push(e)});
 return {app,session,errors,persistence,get time(){return time;},async advance(delta,options){time+=delta;await session.poll(time,options);}};
}
async function scan(f,missionId){await f.session.command('SELECT_MISSION',{missionId});await f.session.contact('p','down',true);await f.advance(800);assert.equal(f.session.snapshot.state.status,'task');}
async function play(f,publicChannel=false){
 for(let count=0;count<180;count++){
  const s=f.session.snapshot;
  if(['completed','incomplete'].includes(s.state.status))return s;
  if(s.state.status==='result'){await f.advance(800);continue;}
  assert.equal(s.state.status,'task');
  if(s.view.automaticMs!==null){await f.advance(s.view.automaticMs+100);continue;}
  let action=s.view.actions[0];
  if(s.state.screenId.endsWith('.privacy'))action=s.view.actions.find(a=>a.actionId===`channel.${publicChannel?'choose-public':'continue-private'}`);
  if(s.state.screenId.endsWith('.public-confirm'))action=s.view.actions.find(a=>a.actionId==='channel.use-new-link');
  assert.equal((await f.session.act(s.state.screenId,action.actionId,s.state.revision)).reply.ok,true);
 }
 assert.fail('Mission did not finish');
}
for(const missionId of Object.keys(catalog.missions))test(`WebGL SessionPort routes ${missionId} using shared descriptors`,async()=>{
 const f=fixture();await f.session.start();await scan(f,missionId);const s=await play(f);
 assert.equal(s.state.status,['business','business-test','communication'].includes(missionId)?'incomplete':'completed');
 assert.equal(new Set(s.state.progress[missionId].completed).size,s.state.progress[missionId].completed.length);
 assert.ok(s.view.qr);assert.deepEqual(f.errors,[]);await f.session.close();
});
test('WebGL repeated clicks and stale screen cannot advance a second time',async()=>{
 const f=fixture();await f.session.start();await scan(f,'blogger');const s=f.session.snapshot,action=s.view.actions[0];
 const [first,repeat]=await Promise.all([f.session.act(s.state.screenId,action.actionId,s.state.revision),f.session.act(s.state.screenId,action.actionId,s.state.revision)]);
 assert.equal(first.reply.ok,true);assert.equal(repeat,null);assert.equal(await f.session.act(s.state.screenId,action.actionId,s.state.revision),null);await f.session.close();
});
test('WebGL early release, owner loss, repeat hold and result drag pause',async()=>{
 const f=fixture();await f.session.start();await f.session.command('SELECT_MISSION',{missionId:'blogger'});
 await f.session.contact('p','down',true);await f.advance(300);await f.session.contact('p','up',true);await f.advance(800);assert.equal(f.session.snapshot.state.status,'scan');
 await f.session.contact('p','down',true);await f.session.owner(false);await f.advance(800);assert.equal(f.session.snapshot.state.status,'scan');
 await f.session.owner(true);await f.session.contact('p','down',true);await f.advance(800);assert.equal(f.session.snapshot.state.status,'task');
 while(f.session.snapshot.state.status==='task'){const s=f.session.snapshot,action=s.view.actions.find(a=>a.actionId==='channel.continue-private')??s.view.actions[0];await f.session.act(s.state.screenId,action.actionId);}
 await f.advance(1000,{pauseResult:true});assert.equal(f.session.snapshot.state.status,'result');await f.advance(100);assert.equal(f.session.snapshot.state.taskId,'blogger.comments');await f.session.close();
});
test('Site to WebGL switch retains public channel screen, answers and base layout',async()=>{
 assert.equal(WEBGL_SHARED_KEY,SITE_SHARED_KEY);
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},persistence=createBrowserPersistence({storage,key:`${WEBGL_SHARED_KEY}:${catalog.contentRevision}`});
 let time=1000;let app=createMissionSessionApplication({catalog,persistence,now:()=>time});const site=createSiteSession({catalog,port:app,sessionId:'site-shared'});await site.start();await site.command('SELECT_MISSION',{missionId:'blogger'});await site.contact('p','down',true);time+=800;await app.pollTime('site-shared');
 while(site.snapshot.state.screenId!=='blogger.channel.public-link'){
  const s=site.snapshot;let action=s.view.actions[0];if(s.state.screenId.endsWith('.privacy'))action=s.view.actions.find(a=>a.actionId==='channel.choose-public');if(s.state.screenId.endsWith('.public-confirm'))action=s.view.actions.find(a=>a.actionId==='channel.use-new-link');await site.act(s.state.screenId,action.actionId);
 }
 await site.layout({'blogger.channel':{x:423,y:510}});await site.close();time+=1000;
 app=createMissionSessionApplication({catalog,persistence,now:()=>time});const webgl=createWebGLSession({catalog,port:app,sessionId:'site-shared'});await webgl.start();
 assert.equal(webgl.snapshot.state.screenId,'blogger.channel.public-link');assert.equal(webgl.snapshot.state.progress.blogger.answers['channel-type'],'public');assert.deepEqual(webgl.snapshot.layouts.positions,{'blogger.channel':{x:423,y:510}});assert.equal(webgl.snapshot.state.scanned,true);await webgl.close();
});
test('WebGL late command response cannot notify disposed renderer',async()=>{
 let finish;
 const waiting=new Promise(resolve=>{finish=resolve;});let notifications=0;
 const g=fixture();const latePort={...g.app,async sendCommand(command){const result=await g.app.sendCommand(command);await waiting;return result;}};
 const session=createWebGLSession({catalog,port:latePort,sessionId:'site-shared',onSnapshot:()=>notifications++});await session.start();const pending=session.command('SELECT_MISSION',{missionId:'blogger'});await new Promise(resolve=>setImmediate(resolve));await session.close();const before=notifications;finish();assert.equal(await pending,null);assert.equal(notifications,before);await g.session.close();
});
test('server facade uses lease then snapshot; disconnected actions stop until reconnect',async()=>{
 const f=fixture();await f.session.start();let observer;const calls=[];
 const port={...f.app,async acquireInputOwner(){calls.push('acquire');return {leaseId:'lease'};},async releaseInputOwner(){calls.push('release');},async subscribe(id,cb){observer=cb;cb({snapshot:await f.app.getSnapshot(id),connected:true});return()=>{};},async reconnect(id){return f.app.getSnapshot(id);}};
 const session=createWebGLSession({catalog,port,sessionId:'site-shared',profile:'server'});await session.start();assert.equal(session.connected,true);assert.equal(session.snapshot.state.sessionId,'site-shared');observer({snapshot:session.snapshot,connected:false});assert.equal(session.connected,false);assert.equal(await session.command('SELECT_MISSION',{missionId:'blogger'}),null);await session.reconnect();assert.equal(session.connected,true);await session.close();assert.deepEqual(calls,['acquire','release']);
});

test('Restart waits for an in-flight answer and repeated restart has one confirmed run',async()=>{
 const f=fixture();await f.session.start();await scan(f,'blogger');const before=f.session.snapshot.state;
 let release;const gate=new Promise(resolve=>{release=resolve;});let sent=0;
 const port={...f.app,async sendCommand(c){sent++;if(c.type==='ACT')await gate;return f.app.sendCommand(c);}};
 const session=createWebGLSession({catalog,port,sessionId:'site-shared'});await session.start();
 const frame=session.snapshot;const answer=session.act(frame.state.screenId,frame.view.actions[0].actionId);
 const restart=session.restart(),repeat=session.restart();assert.equal(restart,repeat);assert.equal(sent,1);
 release();assert.equal((await answer).reply.ok,true);assert.equal((await restart).reply.ok,true);
 assert.equal(sent,2);assert.equal(session.snapshot.state.runId,before.runId+1);assert.equal(session.snapshot.state.status,'scan');
 assert.equal(session.snapshot.state.screenId,null);assert.equal(session.snapshot.view.remainingMs,180000);assert.deepEqual(session.snapshot.state.progress.blogger.answers,{});
 const restored=await f.app.getSnapshot('site-shared');assert.equal(restored.state.status,'scan');await session.close();
});