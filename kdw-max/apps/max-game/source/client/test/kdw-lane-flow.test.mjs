import test from 'node:test';
import assert from 'node:assert/strict';
import {createPostTimeline,LANE_FLOW} from '../src/kdw-post-stream.mjs';
import {postBank} from '../src/kdw-posts-model.mjs';
import {storeBank} from '../src/kdw-store-rating.mjs';
const initial=seed=>({version:8,runId:'lanes',seed,published:[]});
function safe(rows){
 assert.ok(rows.length<=4);
 for(const column of [0,1]){
  const lane=rows.filter(r=>r.column===column).sort((a,b)=>a.progress-b.progress);
  assert.ok(lane.length<=2);
  if(lane.length===2)assert.ok(lane[1].progress-lane[0].progress>=LANE_FLOW.headway-1e-10);
 }
 assert.equal(new Set(rows.map(r=>r.post.id)).size,rows.length);
}
test('v8: all business banks preserve lane clearance, forward motion and four-card capacity for ten minutes',()=>{
 for(const bank of [postBank(),postBank('hotel'),postBank('theater'),storeBank(),storeBank('hotel'),storeBank('theater')]){
  for(let seed=0;seed<8;seed++){
   const timeline=createPostTimeline(initial(seed),bank);let previous=new Map();
   for(let ms=0;ms<600000;ms+=137){
    const rows=timeline.at(ms);safe(rows);assert.ok(rows.length>=2);
    const positions=[0,...rows.map(r=>r.progress).sort((a,b)=>a-b),1];
    assert.ok(Math.max(...positions.slice(1).map((p,i)=>p-positions[i]))<.32,'staggered lanes do not form empty horizontal bands');
    for(const row of rows){const before=previous.get(row.index);if(before!==undefined){assert.ok(row.progress>=before);assert.ok(row.progress-before<=137*.00018+1e-9);}}
    previous=new Map(rows.map(r=>[r.index,r.progress]));
   }
  }
 }
});
test('v8: repeated selections from one lane never invade the other; refill after a burst is bounded',()=>{
 for(let seed=0;seed<16;seed++){
  const p=initial(seed),bank=postBank();let timeline=createPostTimeline(p,bank);
  for(let ms=0;ms<30000;ms+=40){
   const rows=timeline.at(ms);safe(rows);
   if(ms>0&&ms%1400===0){
    const row=rows.find(r=>r.column===0&&r.progress>.2);
    if(row){p.published.push({index:row.index,elapsedMs:ms});timeline=createPostTimeline(p,bank);safe(timeline.at(ms));}
   }
  }
  const before=timeline.at(30000);
  p.published.push(...before.map(r=>({index:r.index,elapsedMs:30000})));
  timeline=createPostTimeline(p,bank);
  assert.equal(timeline.at(30000).length,0);
  for(let ms=30040;ms<=35000;ms+=40)safe(timeline.at(ms));
  assert.equal(timeline.at(35000).length,4,'all lanes refill within five seconds after clearing everything');
 }
});
test('v8: exact replay, backwards reads, and frame partition independence through selection',()=>{
 const p=initial(12),bank=storeBank();
 p.published=[{index:2,elapsedMs:4200}];
 const fast=createPostTimeline(p,bank),slow=createPostTimeline(p,bank);
 for(let ms=0;ms<30000;ms+=1000/120)fast.at(ms);
 for(let ms=0;ms<30000;ms+=1000/30)slow.at(ms);
 assert.deepEqual(fast.at(30000),slow.at(30000));
 assert.deepEqual(fast.at(12500),createPostTimeline(structuredClone(p),bank).at(12500));
});
