import test from 'node:test';
import assert from 'node:assert/strict';
import {V5AutoplayPresentation,v5MissionMenuEntries,v5AutoplayUrl} from '../src/journey-v5-autoplay.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
import {v5StartupScreen} from '../src/journey-v5-startup-assets.mjs';
import {V5_MISSION_CATALOG} from '../src/journey-v5-backend.mjs';

const shot=(screenId='first',status='task',runId=1)=>({state:{sessionId:'autoplay.gate',missionId:'blogger',taskId:'blogger.channel',screenId,status,runId,revision:1},layouts:{layoutRevision:0},view:{automaticMs:500}});
const visible={ready:true,active:true};
test('automatic polling waits 500 visible milliseconds after ready; hidden time and new screens cannot skip content',()=>{
 const gate=new V5AutoplayPresentation(),s=shot();
 gate.update(s,30,{ready:false,active:true});assert.equal(gate.allows(s),false);
 gate.update(s,30,visible);assert.equal(gate.visibleMs,0);
 for(let i=0;i<9;i++)gate.update(s,.05,visible);
 gate.update(s,.049,visible);assert.equal(gate.allows(s),false);
 gate.update(s,30,{ready:true,active:false});assert.equal(gate.allows(s),false);assert.equal(gate.visibleMs,499);
 gate.update(s,.001,visible);assert.equal(gate.allows(s),true);
 assert.equal(gate.allows(shot('second')),false);
 gate.update(shot('second'),.05,visible);assert.equal(gate.visibleMs,0);assert.equal(gate.allows(shot('second')),false);
 gate.update(shot('second'),.05,{ready:false,active:true});assert.equal(gate.visibleMs,0);
 gate.update(shot('second','task',2),.05,visible);assert.equal(gate.visibleMs,0);
});
test('scan follows owner activity; result gets its original 800ms; QR has no automatic exit',()=>{
 const gate=new V5AutoplayPresentation(),scan=shot(null,'scan');
 gate.update(scan,.05,{active:true});assert.equal(gate.allows(scan),true);
 gate.update(scan,.05,{active:false});assert.equal(gate.allows(scan),false);
 const result=shot('first','result');gate.update(result,0,visible);
 for(let i=0;i<15;i++)gate.update(result,.05,visible);
 gate.update(result,.049,visible);assert.equal(gate.allows(result),false);
 gate.update(result,.001,visible);assert.equal(gate.allows(result),true);
 const qr=shot(null,'completed');gate.update(qr,0,visible);
 for(let i=0;i<40;i++)gate.update(qr,.05,visible);
 assert.equal(gate.allows(qr),false);
});
test('facade enforces presentation gate before invoking backend poll',async()=>{
 const s=shot(),gate=new V5AutoplayPresentation();let calls=0;
 const port={getSnapshot:async()=>s,inputOwnerChanged:async()=>s,subscribe:async()=>()=>{},pollTime:async()=>{calls++;return s;},close:async()=>{}};
 const session=createWebGLSession({port,catalog:{contentRevision:'test-v1'},sessionId:s.state.sessionId,canPoll:snapshot=>gate.allows(snapshot)});
 await session.start();
 await session.poll(1000);assert.equal(calls,0);
 gate.update(s,0,visible);for(let i=0;i<10;i++)gate.update(s,.05,visible);
 await session.poll(1100);assert.equal(calls,1);
 gate.update(s,.05,{ready:false,active:true});await session.poll(1200);assert.equal(calls,1);
 await session.close();
});
test('menu retains four normal entries and adds four explicit copies; automatic URLs do not reuse manual session IDs',()=>{
 const missions=Object.values(V5_MISSION_CATALOG.missions).map(m=>({id:m.missionId,title:m.title}));
 const cards=v5MissionMenuEntries(missions,{automaticCopies:true});
 assert.equal(cards.length,8);assert.equal(cards.filter(c=>c.automatic).length,4);
 assert.deepEqual(cards.slice(0,4).map(c=>c.id),missions.map(m=>m.id));
 assert.equal(v5MissionMenuEntries(missions).length,4);
 const url=new URL(v5AutoplayUrl('https://example.test/webgl-v5/client.html?layout=wall&session=manual','business'));
 assert.equal(url.searchParams.get('autoplay'),'business');assert.equal(url.searchParams.get('session'),null);
 assert.equal(url.searchParams.get('layout'),'wall');assert.equal(url.searchParams.get('backend'),'local');
 assert.equal(new URL(v5AutoplayUrl(url.href,null)).searchParams.has('autoplay'),false);
});
test('startup prepares the same actionless device frame that the automatic backend presents',()=>{
 const task=Object.values(V5_MISSION_CATALOG.tasks)[0],screen=Object.values(task.screens)[0],asset=V5_MISSION_CATALOG.assets[screen.assetId];
 const frame=v5StartupScreen({task,screen:{...screen,automaticMs:500},asset});
 assert.equal(frame.markup.includes('data-answer'),false);
 assert.ok(frame.markup.includes(asset.path));
});
