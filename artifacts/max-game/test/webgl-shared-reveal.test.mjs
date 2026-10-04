import test from 'node:test';
import assert from 'node:assert/strict';
import {SharedRevealJourney,sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createBrowserPersistence} from '../public/site-game/browser-persistence.mjs';

async function fixture(){
 let time=1000,serial=0;const data=new Map(),pending=[];
 const app=createMissionSessionApplication({catalog:MISSION_CATALOG,now:()=>time,persistence:createBrowserPersistence({storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},key:'webgl-test'})});
 await app.createSession({sessionId:'webgl'});const snapshot=await app.inputOwnerChanged('webgl',{active:true});
 const facade={snapshot,command(type,fields={}){const s=controller.snapshot.state;const promise=app.sendCommand({schemaVersion:1,type,commandId:`c${++serial}`,sessionId:s.sessionId,contentRevision:s.contentRevision,expectedRevision:s.revision,...fields});pending.push(promise);return promise;},act(screenId,actionId,revision){return this.command('ACT',{taskId:controller.snapshot.state.taskId,screenId,actionId,expectedRevision:revision});},contact(id,type,inside){const promise=app.handleContact('webgl',{contactId:id,sequence:++serial,type,inside});pending.push(promise);return promise;},layout(positions){return this.command('SET_LAYOUT',{layoutId:'base',expectedLayoutRevision:controller.snapshot.layouts.layoutRevision,positions});}};
 const controller=new SharedRevealJourney(sharedRevealContent(MISSION_CATALOG),facade);controller.configure(1552,952);
 const sync=async()=>{while(pending.length)await pending.shift();controller.accept(await app.getSnapshot('webgl'));};
 const advance=async(ms)=>{time+=ms;controller.accept((await app.pollTime('webgl')).snapshot);};
 return {app,facade,controller,sync,advance,jump:ms=>{time+=ms;}};
}
function finishMotion(c){for(let i=0;i<8;i++)c.tick(.1,{settled:true,reduced:true});}
async function scan(f,missionId){f.controller.select(missionId);await f.sync();f.controller.down('p1');await f.sync();await f.advance(800);finishMotion(f.controller);}
const nextAction=c=>c.descriptor.actions.find(a=>a.actionId==='channel.continue-private')||c.descriptor.actions.find(a=>a.actionId==='channel.choose-private')||c.descriptor.actions[0];

test('Common catalog projects six missions and canonical IDs without old business choice',()=>{
 const c=sharedRevealContent(MISSION_CATALOG);assert.equal(c.missions.length,6);
 for(const m of c.missions){assert.deepEqual(m.steps.map(s=>s.id),MISSION_CATALOG.missions[m.id].taskIds);assert.ok(m.steps.every(s=>s.iconId));assert.ok(m.qr.image.startsWith('./assets/'));assert.equal(m.branches,undefined);}
});
test('WebGL clock cannot confirm a hold; early cancellation permits another hold',async()=>{
 const f=await fixture(),c=f.controller;c.select('blogger');await f.sync();c.down('p1');await f.sync();for(let i=0;i<40;i++)c.tick(.1,{settled:true});assert.equal(c.phase,'holding');assert.equal(c.scanned.blogger,false);
 c.cancelContact('p1');await f.sync();await f.advance(900);assert.equal(c.phase,'palm');c.down('p2');await f.sync();await f.advance(800);assert.equal(c.phase,'burst');assert.equal(c.nodes.length,4);assert.equal(c.pose(c.nodes[0]).worldX,c.geometry.width/2);finishMotion(c);assert.equal(c.phase,'task');assert.equal(c.session.task,'blogger.channel');await f.app.close();
});
test('Reload restores the authoritative current step paused and keeps ID fan edges',async()=>{
 const f=await fixture();await scan(f,'digital-id');const copy=new SharedRevealJourney(sharedRevealContent(MISSION_CATALOG),{...f.facade,snapshot:f.controller.snapshot});copy.configure(1552,952);assert.equal(copy.phase,'paused');assert.equal(copy.current.step,'digital-id.create-id');assert.equal(copy.routeParent('digital-id.hotel'),'digital-id.create-id');assert.equal(copy.routeParent('digital-id.age'),'digital-id.create-id');assert.equal(copy.resume('digital-id.age'),false);assert.equal(copy.resume('digital-id.create-id'),true);finishMotion(copy);assert.equal(copy.phase,'task');await f.app.close();
});
test('Pointer up confirms the full trusted hold even before the next render poll',async()=>{
 const f=await fixture(),c=f.controller;c.select('blogger');await f.sync();c.down('p1');await f.sync();f.jump(800);assert.equal(c.up('p1'),true);await f.sync();assert.equal(c.snapshot.state.scanned,true);assert.equal(c.phase,'burst');assert.equal(c.cancelContact('p1'),false);await f.app.close();
});
test('Palm gesture keeps the hold clock and backend poll alive while pointer is captured',async()=>{
 const f=await fixture(),c=f.controller;c.select('blogger');await f.sync();c.down('p1');await f.sync();let polled=0;f.facade.poll=()=>{polled++;};c.tick(.1,{dragging:true,busy:true});assert.equal(polled,1);assert.equal(c.elapsed,.1);assert.equal(c.phase,'holding');await f.app.close();
});
test('Phone waits for settled poses and drag blocks presentation progression',async()=>{
 const f=await fixture();await scan(f,'blogger');const c=f.controller;c.change('phone-enter');for(let i=0;i<80;i++)c.tick(.1,{settled:false});assert.equal(c.phase,'phone-enter');c.tick(.1,{settled:true,dragging:true});assert.equal(c.phase,'phone-enter');c.tick(.1,{settled:true});assert.equal(c.phase,'task');await f.app.close();
});
test('No numeric legacy answers are accepted; command retains source screen and revision',async()=>{
 const f=await fixture();await scan(f,'blogger');const c=f.controller,token=c.token();assert.equal(c.answer(0,token),false);const old=c.snapshot.state.screenId;assert.equal(c.answer(c.descriptor.actions[0].actionId,token),true);await f.sync();assert.notEqual(c.snapshot.state.screenId,old);assert.equal(c.answer(c.descriptor.actions[0].actionId,token),false);await f.app.close();
});
test('All six missions follow common actions; missing content never becomes successful',async()=>{
 for(const missionId of Object.keys(MISSION_CATALOG.missions)){
  const f=await fixture();await scan(f,missionId);const c=f.controller;
  for(let guard=0;guard<140&&!['completed','incomplete'].includes(c.snapshot.state.status);guard++){
   finishMotion(c);
   if(c.snapshot.state.status==='result'){await f.advance(800);continue;}
   if(!c.descriptor.actions.length){await f.advance(1600);continue;}
   assert.equal(c.answer(nextAction(c).actionId,c.token()),true,`${missionId}: ${c.phase}`);await f.sync();
  }
  finishMotion(c);assert.equal(c.phase,'complete');assert.equal(c.snapshot.state.status,MISSION_CATALOG.missions[missionId].missing.length?'incomplete':'completed');await f.app.close();
 }
});
test('Next snapshot retains departing content until phone exit then uses new descriptor',async()=>{
 const f=await fixture();await scan(f,'blogger');const c=f.controller;
 for(let i=0;i<18&&c.snapshot.state.status!=='result';i++){c.answer(nextAction(c).actionId,c.token());await f.sync();}
 assert.equal(c.phase,'result');const descriptor=c.descriptor,key=c.phoneContentKey;await f.advance(800);assert.equal(c.snapshot.state.taskId,'blogger.comments');assert.equal(c.phase,'phone-exit');assert.equal(c.descriptor,descriptor);assert.equal(c.phoneContentKey,key);c.tick(.1,{settled:true,reduced:true});assert.equal(c.current.step,'blogger.comments');assert.notEqual(c.descriptor,descriptor);await f.app.close();
});
test('Drag stays temporary within a task and does not persist a mission layout',async()=>{
 const f=await fixture();await scan(f,'blogger');const c=f.controller;c.move('blogger.channel',400,55);await c.persistLayout();await f.sync();assert.equal(c.snapshot.layouts.positions['renderer:webgl:blogger:blogger.channel'],undefined);assert.equal(c.nodes.find(n=>n.step==='blogger.channel').worldX,400);assert.equal(c.snapshot.layouts.positions['renderer:webgl:blogger:blogger.comments'],undefined);await f.app.close();
});
test('Renderer layout validates mission membership and preserves existing Site coordinates',async()=>{
 const f=await fixture();await scan(f,'blogger');const c=f.controller;
 await f.facade.layout({'blogger.channel':{x:800,y:360}});await f.sync();
 assert.notEqual(c.current.worldX,800);c.move('blogger.channel',450,65);await c.persistLayout();await f.sync();
 assert.deepEqual(c.snapshot.layouts.positions['blogger.channel'],{x:800,y:360});
 assert.equal(c.snapshot.layouts.positions['renderer:webgl:blogger:blogger.channel'],undefined);
 const bad=await f.facade.layout({'renderer:webgl:blogger:business.bot':{x:1,y:2}});assert.equal(bad.reply.code,'INVALID_LAYOUT_COMMAND');await f.app.close();
});
test('Restored result stays paused when input ownership is refreshed',async()=>{
 const f=await fixture();await scan(f,'blogger');const c=f.controller;
 for(let i=0;i<18&&c.snapshot.state.status!=='result';i++){c.answer(c.descriptor.actions[0].actionId,c.token());await f.sync();}
 const restored=new SharedRevealJourney(c.content,{...f.facade,snapshot:c.snapshot});assert.equal(restored.phase,'paused');
 restored.accept(await f.app.inputOwnerChanged('webgl',{active:false}));restored.accept(await f.app.inputOwnerChanged('webgl',{active:true}));
 assert.equal(restored.phase,'paused');assert.equal(restored.session.task,null);await f.app.close();
});

test('Restart discards old path, exiting phone and hold; starts a fresh palm run',async()=>{
 const f=await fixture();await scan(f,'blogger');const c=f.controller;
 for(let i=0;i<18&&c.snapshot.state.status!=='result';i++){c.answer(nextAction(c).actionId,c.token());await f.sync();}
 await f.advance(800);assert.equal(c.phase,'phone-exit');assert.ok(c._pending);
 c.manualPhones.blogger={'blogger.channel':{x:600,y:20}};c.manualNodes.blogger=['blogger.channel'];
 const oldToken=c.token(),oldRun=c.snapshot.state.runId;
 const reply=await c.restart();assert.equal(reply.reply.ok,true);await f.sync();
 assert.equal(c.snapshot.state.runId,oldRun+1);assert.equal(c.phase,'palm');assert.equal(c.elapsed,0);
 assert.deepEqual(c.nodes,[]);assert.deepEqual(c.edges(),[]);assert.equal(c.phoneVisible,false);assert.equal(c.current,undefined);
 assert.equal(c._pending,null);assert.equal(c.contact,null);assert.deepEqual(c.manualPhones,{});assert.deepEqual(c.manualNodes,{});
 assert.equal(c.descriptor.device,null);assert.equal(c.session.task,null);assert.equal(c.scanned.blogger,false);
 assert.deepEqual(c.snapshot.state.progress.blogger.completed,[]);assert.deepEqual(c.snapshot.state.progress.blogger.answers,{});
 assert.equal(c.snapshot.view.remainingMs,180000);assert.equal(c.answer('channel.open-create-menu',oldToken),false);
 c.down('new-hand');await f.sync();await f.advance(800);assert.equal(c.phase,'burst');assert.equal(c.nodes.length,4);
 finishMotion(c);assert.equal(c.phase,'task');assert.equal(c.snapshot.state.screenId,'blogger.channel.chats');await f.app.close();
});
test('Restart during a partial hold cannot complete the next scan from the old contact',async()=>{
 const f=await fixture(),c=f.controller;c.select('digital-id');await f.sync();c.down('old-hand');await f.sync();await f.advance(400);
 await c.restart();await f.sync();await f.advance(1000);assert.equal(c.phase,'palm');assert.equal(c.snapshot.state.scanned,false);assert.deepEqual(c.nodes,[]);
 c.down('new-hand');await f.sync();await f.advance(799);assert.equal(c.phase,'holding');await f.advance(1);assert.equal(c.phase,'burst');await f.app.close();
});
for(const reduced of [false,true])test(`Task exit restores every node after drag release (reduced=${reduced})`,async()=>{
 const f=await fixture();await scan(f,'blogger');const c=f.controller;
 const initial=c.nodes.map(n=>({node:n,x:n.worldX,y:n.worldY}));
 for(const [i,n] of c.nodes.entries())c.move(n.step,100+i*50,100+i*30);
 c.movePhone(800,80);
 // Ordinary answers/screens retain the freely dragged positions.
 c.answer(nextAction(c).actionId,c.token());await f.sync();assert.equal(c.nodes[0].worldX,100);
 for(let i=0;i<18&&c.snapshot.state.status!=='result';i++){c.answer(nextAction(c).actionId,c.token());await f.sync();}
 await f.advance(800);assert.equal(c.phase,'phone-exit');
 c.tick(.1,{dragging:true,settled:false,reduced});assert.equal(c.nodes[0].worldX,100);
 c.tick(.1,{settled:false,reduced});assert.equal(c.phase,'phone-exit');
 for(const {node,x,y}of initial){assert.equal(c.nodes.find(n=>n.step===node.step),node);assert.equal(node.worldX,x);assert.equal(node.worldY,y);}
 assert.equal(c.manualPhones.blogger,undefined);assert.equal(c.manualNodes.blogger,undefined);
 finishMotion(c);assert.equal(c.current.step,'blogger.comments');assert.equal(c.phase,'task');
 await f.app.close();
});
test('Historical stored coordinates do not displace a newly restored step',async()=>{
 const f=await fixture();await scan(f,'blogger');const c=f.controller,original=c.current.worldX;
 await f.facade.layout({'renderer:webgl:blogger:blogger.channel':{x:-900,y:700}});await f.sync();
 const restored=new SharedRevealJourney(c.content,{...f.facade,snapshot:c.snapshot});restored.configure(1552,952);
 assert.equal(restored.current.worldX,original);assert.equal(restored.current.worldY,0);
 assert.deepEqual(c.snapshot.layouts.positions['renderer:webgl:blogger:blogger.channel'],{x:-900,y:700});await f.app.close();
});
