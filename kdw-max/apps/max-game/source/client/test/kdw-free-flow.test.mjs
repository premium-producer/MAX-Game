import test from 'node:test';
import assert from 'node:assert/strict';
import {createPostTimeline} from '../src/kdw-post-stream.mjs';
import {chooseFlightX,flightOverlap,createFlightPlacement} from '../src/kdw-flight-placement.mjs';
import {postBank} from '../src/kdw-posts-model.mjs';
import {storeBank} from '../src/kdw-store-rating.mjs';
const initial=seed=>({version:9,seed,runId:12,published:[]});
test('v11 starts empty and admits every card at the top, with sequential startup and deterministic refill',()=>{
 for(const bank of [postBank(),storeBank()])for(let seed=0;seed<12;seed++){
  const state={...initial(seed),version:11},stream=createPostTimeline(state,bank);
  assert.deepEqual(stream.at(0),[]);
  let previous=0;
  for(let i=0;i<10;i++){
   const row=stream.spawn(i);
   assert.ok(row.start-previous>=425&&row.start-previous<=675);
   assert.equal(stream.at(row.start).find(r=>r.index===i).progress,0);
   assert.ok(!stream.at(row.start-.01).some(r=>r.index===i));
   assert.ok(row.travel>=6250&&row.travel<=9250);previous=row.start;
  }
  for(let t=0;t<30000;t+=137)assert.ok(stream.at(t).length<=10);
  state.published=stream.at(6000).map(r=>({index:r.index,elapsedMs:6000}));
  const refill=createPostTimeline(state,bank);
  assert.deepEqual(refill.at(6000),[]);
  assert.ok(refill.at(8500).length>0);
  for(const row of refill.at(8500))assert.ok(row.start>6000);
  assert.deepEqual(refill.at(12000),createPostTimeline(state,bank).at(12000));
 }
});
test('v10 doubles fall and refill speed exactly, with accepted choices and legacy replay',()=>{
 for(const bank of [postBank(),storeBank()]){
  const original={...initial(4),published:[{index:0,elapsedMs:400},{index:2,elapsedMs:2200}]};
  const fast={...original,version:10,published:original.published.map(r=>({...r,elapsedMs:r.elapsedMs/2}))};
  const normal=createPostTimeline(original,bank),double=createPostTimeline(fast,bank);
  for(let time=0;time<60000;time+=173){
   const expected=normal.at(time*2).map(r=>({...r,start:r.start/2,travel:r.travel/2,velocity:r.velocity*2}));
   const actual=double.at(time);assert.deepEqual(actual,expected);assert.ok(actual.length<=10);
   for(const r of actual)assert.ok(r.travel>=6250&&r.travel<=9250);
  }
  assert.deepEqual(double.spawn(50),createPostTimeline(fast,bank).spawn(50));
 }
});
test('forecast catches a faster follower before contact and chooses the free horizontal interval',()=>{
 const card={y:-100,h:100,w:100,v:.15},peer={x:0,y:100,h:100,w:100,v:.05};
 assert.ok(flightOverlap(card,peer,900).area>0);
 const chosen=chooseFlightX(card,[peer],{left:0,right:300,height:900},0);
 assert.equal(chosen.cost,0);assert.ok(chosen.x>=100);
 // Equal speeds and separated heights never require a second column.
 assert.equal(flightOverlap({...card,v:.05},peer,900).area,0);
 assert.equal(chooseFlightX({...card,v:.05},[peer],{left:0,right:300,height:900},0).x,0);
});
test('unavoidable collision chooses minimum overlap rather than the preferred occupied position',()=>{
 const card={y:0,h:150,w:120,v:.1},peer={...card,x:0,w:160};
 const choice=chooseFlightX(card,[peer],{left:0,right:200,height:900},0);
 assert.equal(choice.x,80);assert.ok(choice.cost>0);
 const risk=flightOverlap(card,peer,900);
 assert.equal(choice.cost,80*risk.area);
});
test('continuous search is no worse than a dense pixel scan, including multiple unavoidable collisions',()=>{
 for(let seed=0;seed<20;seed++){
  const card={y:-120,h:180,w:155,v:.12},field={left:0,right:410,height:800};
  const peers=Array.from({length:6},(_,i)=>({x:(seed*43+i*71)%260,y:(seed*31+i*113)%650-80,
   h:130+i*12,w:140+i*9,v:.05+i*.016}));
  const choice=chooseFlightX(card,peers,field,.33);
  const risks=peers.map(p=>({p,...flightOverlap(card,p,800)}));
  for(let x=0;x<=255;x++){
   const cost=risks.reduce((sum,{p,area})=>sum+area*Math.max(0,Math.min(x+card.w,p.x+p.w)-Math.max(x,p.x)),0);
   assert.ok(choice.cost<=cost+1e-5);
  }
 }
});
test('ten-card admission is deterministic, diverse and refills without teleporting surviving cards',()=>{
 for(const bank of [postBank(),postBank('hotel'),postBank('theater'),storeBank(),storeBank('hotel'),storeBank('theater')]){
  for(let seed=0;seed<8;seed++){
   const p=initial(seed);let stream=createPostTimeline(p,bank),previous=new Map(),max=0;
   for(let ms=0;ms<180000;ms+=137){
    const rows=stream.at(ms);max=Math.max(max,rows.length);assert.ok(rows.length<=10);
    for(const row of rows){
     assert.equal(row.flow,'free');assert.equal(row.column,undefined);
     const old=previous.get(row.index);if(old)assert.ok(Math.abs(row.progress-old.progress-137/row.travel)<1e-9);
    }
    previous=new Map(rows.map(r=>[r.index,r]));
    if(ms%1370===0&&rows.length){p.published.push({index:rows[0].index,elapsedMs:ms});stream=createPostTimeline(p,bank);}
   }
   assert.equal(max,10);
   const before=stream.at(180000);p.published.push(...before.map(r=>({index:r.index,elapsedMs:180000})));
   stream=createPostTimeline(p,bank);assert.equal(stream.at(180000).length,0);
   assert.ok(stream.at(185000).length>=8,'burst replenished from the top within five seconds');
   const replay=createPostTimeline(p,bank);assert.deepEqual(replay.at(185000),stream.at(185000));
   assert.deepEqual(replay.at(90000),createPostTimeline(p,bank).at(90000));
  }
 }
});
test('placement is continuous across selections and never rearranges surviving flights',()=>{
 const stream=createPostTimeline(initial(7),postBank()),planner=createFlightPlacement(),field={left:0,right:650,height:1080};
 let old=new Map(),unique=new Set();
 for(let t=0;t<60000;t+=80){
  const cards=stream.at(t).map(r=>({id:r.spawnId,y:-240+r.progress*1380,v:1380/r.travel,w:190*r.size,h:220*r.size,offset:r.offset,entry:240}));
  const current=planner.layout(cards,field);
  for(const [id,r] of current){assert.ok(r.x>=0&&r.x+r.w<=650);if(old.has(id))assert.equal(r.x,old.get(id).x);unique.add(Math.round(r.x));}
  old=current;
 }
 assert.ok(unique.size>10,'continuous horizontal positions, not two fixed columns');
});
