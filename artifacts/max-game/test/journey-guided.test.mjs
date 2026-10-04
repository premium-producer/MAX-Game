import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clientContent} from '../src/journey-client.mjs';
import {taskFor,tasksFor} from '../src/journey-tasks.mjs';
import {GuidedJourney,guidedEdges,nextGuidedPosition} from '../src/journey-guided.mjs';
const content=clientContent(JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url))));
const tick=(g,seconds,options={})=>{for(let t=0;t<seconds-1e-9;t+=1/120)g.tick(Math.min(1/120,seconds-t),{settled:true,...options});};
function begin(id){const g=new GuidedJourney(content);g.select(id);assert.equal(g.phase,'start');g.start();g.tick(0,{settled:true});assert.equal(g.phase,'palm');g.down(1);tick(g,.8);assert.equal(g.phase,'reveal');return g;}
function open(g){g.tick(0,{settled:true});assert.equal(g.phase,'delay');tick(g,.5);assert.equal(g.phase,'opening');g.tick(0,{settled:true});assert.equal(g.phase,'task');}
const variants=Array.from({length:Math.max(...Object.values(tasksFor(content)).flat().map(t=>t.correct==='*'?t.options.length:1))},(_,i)=>i);
for(const m of content.missions)for(const branch of m.branches?['channel','bot','store']:[null])for(const variant of variants)test(`${m.id} ${branch||''}: full guided run, answers variant ${variant}`,()=>{
 const g=begin(m.id);let steps=0;
 while(g.phase!=='complete'&&steps++<15){
  open(g);
  while(g.phase==='task'){
   const task=taskFor(g.current,content),choice=task.correct==='*'?Math.min(variant,task.options.length-1):task.correct;
   assert.equal(g.answer(choice),true);
  }
  assert.equal(g.phase,'result');tick(g,.79);assert.equal(g.phase,'result');tick(g,.01);assert.equal(g.phase,'exit');g.tick(0,{settled:true});
  if(g.phase==='branch'){assert.equal(g.choose(branch),true);assert.equal(g.choose(branch),false);tick(g,.01);}
 }
 assert.equal(g.phase,'complete');assert.equal(g.session.completed.filter(id=>id===m.id).length,1);
 assert.equal(g.nodes.length,g.steps.length+1);assert.ok(g.nodes.slice(1).every(o=>o.done));
 const restored=new GuidedJourney(content,g.serialize());assert.equal(restored.phase,'complete');assert.deepEqual(restored.session.runs[m.id].map(o=>o.answers),g.session.runs[m.id].map(o=>o.answers));
});
test('hold ownership, early release, leave, cancel, hidden and exact .8s independent of reduced motion',()=>{
 for(const hz of [30,60,120]){
  const g=new GuidedJourney(content);g.select('blogger');g.start();g.tick(.01,{settled:true});
  assert.ok(g.down(1));assert.equal(g.down(2),false);tick(g,.4);g.cancelContact(2);assert.equal(g.phase,'holding');g.moveContact(1,false);assert.equal(g.phase,'palm');
  g.down(2);tick(g,.5);g.tick(.01,{active:false});assert.equal(g.phase,'palm');
  g.down(3);for(let n=0;n<hz*.8-1;n++)g.tick(1/hz);assert.equal(g.phase,'holding');g.tick(1/hz);assert.equal(g.phase,'reveal');assert.equal(g.nodes.length,2);
 }
});
test('settling, drag and popup transitions gate automatic opening',()=>{
 const g=begin('blogger');tick(g,3,{settled:false});assert.equal(g.phase,'reveal');
 tick(g,.01);tick(g,.25);tick(g,3,{dragging:true});assert.equal(g.phase,'delay');tick(g,.1,{settled:false});assert.equal(g.phase,'reveal');
 g.tick(0,{settled:true});tick(g,.49);assert.equal(g.phase,'delay');tick(g,.01);assert.equal(g.phase,'opening');tick(g,2,{busy:true});assert.equal(g.phase,'opening');g.tick(0,{settled:true});assert.equal(g.phase,'task');
});
test('close cancels auto-open; stale answers and menu callbacks cannot advance',()=>{
 const g=begin('blogger');open(g);const token=g.token();g.close();tick(g,10);assert.equal(g.phase,'paused');assert.equal(g.session.task,null);assert.equal(g.answer(0,token),false);
 g.resume(g.current.step);tick(g,.01);assert.equal(g.answer(0,token),false);const current=g.token();assert.equal(g.answer(0,current),true);assert.equal(g.answer(0,current),false);
 g.menu();tick(g,10);assert.equal(g.phase,'menu');assert.equal(g.session.task,null);
});
test('wrong ID answer stays on original task; interrupted result restores next pending step without re-credit',()=>{
 const g=begin('digital-id');open(g);for(let i=0;i<3;i++)g.answer(0);const stage=g.current.stage;g.answer(1);assert.equal(g.current.stage,stage);assert.ok(g.session.notice);
 while(g.phase==='task')g.answer(0);g.close();const copy=new GuidedJourney(content,g.serialize());assert.equal(copy.phase,'paused');assert.equal(copy.current.step,'hotel');assert.equal(copy.scanned['digital-id'],true);
 assert.equal(copy.nodes.filter(o=>o.step==='create-id').length,1);
});
test('world positions survive restoring/panning; next node clears full previous captions',()=>{
 const g=begin('blogger');g.move('open-max',-1234,140);g.move('channel',2100,-60);
 const copy=new GuidedJourney(content,g.serialize());assert.deepEqual(copy.nodes.map(o=>[o.worldX,o.worldY]),[[-1234,140],[2100,-60]]);
 assert.equal(nextGuidedPosition(copy.nodes).worldX,2420);assert.equal(nextGuidedPosition(copy.nodes,{channel:400}).worldX,2500);
 assert.equal(copy.phase,'paused');assert.equal(copy.session.task,null);
});
test('ID demonstration has independent branches; other routes are linear',()=>{
 const nodes=['open-max','create-id','hotel','benefit','age'].map(step=>({step}));
 assert.deepEqual(guidedEdges(nodes,'digital-id').map(e=>e.a),['open-max','create-id','create-id','create-id']);
 assert.deepEqual(guidedEdges(nodes,'blogger').map(e=>e.a),['open-max','create-id','hotel','benefit']);
});
test('other edition or malformed save is never migrated',()=>{
 assert.equal(new GuidedJourney(content,JSON.stringify({version:1,screen:'field'})).session.mission,null);
 assert.equal(new GuidedJourney(content,'oops').session.mission,null);
});
test('closing a result cannot trap the mission; resume reveals next once, final close completes',()=>{
 const g=begin('blogger');open(g);while(g.phase==='task')g.answer(0);g.close();assert.equal(g.phase,'paused');
 assert.ok(g.resume('channel'));assert.equal(g.phase,'reveal');assert.equal(g.nodes.length,3);
 open(g);while(g.phase==='task')g.answer(0);tick(g,.8);g.tick(0,{settled:true});open(g);while(g.phase==='task')g.answer(0);
 assert.equal(g.phase,'result');g.close();assert.equal(g.phase,'complete');assert.equal(g.session.completed.filter(id=>id==='blogger').length,1);
});
test('closing during opening and restoring business choice do not auto-open',()=>{
 const g=begin('business');g.tick(0,{settled:true});tick(g,.5);assert.equal(g.phase,'opening');g.close();tick(g,2);assert.equal(g.phase,'paused');g.resume('account');g.tick(0,{settled:true});
 while(g.phase==='task')g.answer(0);tick(g,.8);g.tick(0,{settled:true});assert.equal(g.phase,'branch');g.close();
 const restored=new GuidedJourney(content,g.serialize());assert.equal(restored.phase,'branch-paused');tick(restored,3);assert.equal(restored.session.task,null);
 restored.resume('account');assert.equal(restored.phase,'branch');restored.choose('store');restored.tick(0,{settled:true});assert.equal(restored.current.step,'business-store');
});

