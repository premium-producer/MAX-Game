import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReferenceFrame,ReferenceStartTrace} from '../src/journey-reference-frame.mjs';
import {IconMotion} from '../src/journey-motion.mjs';
import {ReferenceRevealJourney} from '../src/journey-reference-presentation.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createBrowserPersistence} from '../public/site-game/browser-persistence.mjs';

const parts=[{kind:'tile',bounds:{x:0,y:0,w:120,h:120}},{kind:'caption',bounds:{x:-50,y:132,w:220,h:100}}];
function entry(id,role,x,y){
 const layout={x,y,size:120,radius:32,cx:60,cy:60,hostX:0,hostY:0};
 return {id,owner:{},role,layout,motion:new IconMotion(layout),width:120,height:200,presence:1,labelVisible:true,parts};
}

test('renderer frame advances each motion once; fixed palm and device are not duplicated',()=>{
 const palm=entry('palm','palm',566,402),tile=entry('max','icon',566,380),offsets=new WeakMap();
 const device={id:'device',owner:{},role:'device',presence:1,rect:{x:900,y:152,w:224,h:500}};
 const info={id:'instruction',owner:{},role:'instruction',presence:1,rect:{x:0,y:0,w:4000,h:1000}};
 let steps=0;const original=palm.motion.step.bind(palm.motion);palm.motion.step=(...args)=>{steps++;return original(...args);};
 const frames=prepareReferenceFrame([tile,palm,device,info],{delta:1/60,time:0,driftTime:0,offsets});
 assert.equal(steps,1);assert.equal(frames.size,2);assert.deepEqual(offsets.get(palm.owner),{x:0,y:0});
 assert.equal(frames.get(palm.owner).pose.x,506);
 const snapshot=JSON.stringify([...frames.values()]);assert.ok(!snapshot.includes('null'));
});

test('trace distinguishes restored scan from a new confirmation and is bounded',()=>{
 const trace=new ReferenceStartTrace(3),context={runId:'a',phase:'palm',scanned:false,contact:null};
 trace.record(context,[],new Map());
 assert.equal(trace.record({...context,scanned:true},[],new Map()).scanConfirmations,1);
 for(let i=0;i<10;i++)assert.equal(trace.record({...context,scanned:true},[],new Map()).scanConfirmations,1);
 assert.equal(trace.rows.length,3);
 assert.equal(trace.record({...context,runId:'restored',scanned:true},[],new Map()).scanConfirmations,0);
});

for(const hz of [30,60,120])test(`real backend hold/release/retry and renderer frame through reveal at ${hz} Hz`,async()=>{
 let now=1000,serial=0;const data=new Map(),pending=[];
 const app=createMissionSessionApplication({catalog:MISSION_CATALOG,now:()=>now,persistence:createBrowserPersistence({storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},key:`frame-${hz}`})});
 try{
  await app.createSession({sessionId:'frame'});const snapshot=await app.inputOwnerChanged('frame',{active:true});
  let c;
  const facade={snapshot,command(type,fields={}){const s=c.snapshot.state;const p=app.sendCommand({schemaVersion:1,type,commandId:`c${++serial}`,sessionId:s.sessionId,contentRevision:s.contentRevision,expectedRevision:s.revision,...fields});pending.push(p);return p;},contact(id,type,inside){const p=app.handleContact('frame',{contactId:id,sequence:++serial,type,inside});pending.push(p);return p;}};
  c=new ReferenceRevealJourney(sharedRevealContent(MISSION_CATALOG),facade);c.configure(1543,804,120);
  const sync=async()=>{while(pending.length)await pending.shift();c.accept(await app.getSnapshot('frame'));};
  c.select('digital-id');await sync();assert.equal(c.phase,'palm');
  const palm=entry('route-add:guided-palm','palm',566,402),icons=new Map(),offsets=new WeakMap(),trace=new ReferenceStartTrace(1200);
  palm.parts=[parts[0],{kind:'caption',bounds:{x:-355,y:148,w:830,h:220}}];
  const draw=()=>{
   const entries=[];
   if(['palm','holding','burst'].includes(c.phase))entries.push(palm);
   for(const node of c.nodes){
    const presence=c.presence(node);if(c.phase==='burst'&&presence===0)continue;
    const pose=c.pose(node);let e=icons.get(node.step);
    if(!e){e=entry(node.step,'icon',pose.worldX,402+pose.worldY);e.motion.size.value=105.6;e.motion.alpha.value=0;e.motion.label.value=0;icons.set(node.step,e);}
    e.layout={...e.layout,x:pose.worldX,y:402+pose.worldY};e.presence=presence;e.labelVisible=c.captionVisible(node);entries.push(e);
   }
   const frames=prepareReferenceFrame(entries,{delta:1/hz,time:now/1000,driftTime:now/1000,offsets});
   const row=trace.record({phase:c.phase,contact:c.contact,runId:c.snapshot.state.runId,scanned:c.snapshot.state.scanned},entries,frames);
   assert.deepEqual(row.duplicateIds,[]);
   for(const o of row.objects)for(const value of Object.values(o.pose))assert.ok(Number.isFinite(value));
   if(entries.includes(palm)){assert.deepEqual(offsets.get(palm.owner),{x:0,y:0});const p=frames.get(palm.owner).pose;assert.ok(566>=p.x&&566<=p.x+120&&402>=p.y&&402<=p.y+120,'original contact stays inside palm');}
   return row;
  };
  const advance=async(seconds)=>{for(let i=0;i<Math.round(seconds*hz);i++){now+=1000/hz;c.accept((await app.pollTime('frame')).snapshot);c.tick(1/hz,{settled:false,dragging:c.contact!==null});draw();}};
  draw();c.down('early');await sync();await advance(.4);c.up('early');await sync();await advance(.5);
  assert.equal(c.snapshot.state.scanned,false);assert.equal(c.phase,'palm');
  c.down('retry');await sync();await advance(.9);assert.equal(c.snapshot.state.scanned,true);assert.equal(c.phase,'burst');
  c.up('retry');await sync();await advance(2.5);
  assert.equal(trace.rows.at(-1).scanConfirmations,1);assert.ok(icons.has('open-max'));assert.ok(icons.size>1);
  assert.ok(trace.rows.some(r=>r.phase==='holding'&&r.contact==='early'));
  assert.ok(trace.rows.some(r=>r.phase==='holding'&&r.contact==='retry'));
  assert.ok(trace.rows.some(r=>r.phase==='burst'));
 }finally{await app.close();}
});
