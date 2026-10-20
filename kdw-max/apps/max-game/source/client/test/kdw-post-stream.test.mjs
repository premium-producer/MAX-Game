import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createPostTimeline,postStreamRules} from '../src/kdw-post-stream.mjs';
import {postBank,createPostStreamReader,visiblePosts} from '../src/kdw-posts-model.mjs';
const initial=seed=>({version:4,seed,runId:1,businessType:'cafe',published:[]});
const POST_STREAM=postStreamRules(initial(0));

test('v6 keeps all new posts on the right with at most four live cards',()=>{
 for(let seed=0;seed<16;seed++){
  const p={...initial(seed),version:6},timeline=createPostTimeline(p,postBank());
  for(let time=0;time<180000;time+=373){
   const rows=timeline.at(time);
   assert.ok(rows.length<=4);
   assert.ok(rows.every(r=>r.lane===1&&r.column<2&&r.travel>=10000&&r.travel<=18000));
   assert.deepEqual(rows,visiblePosts(p,time));
  }
 }
});

test('v5 doubles launch intervals and varies travel time while respecting per-side capacity and expiry',()=>{
 let overtaking=false;
 for(let seed=0;seed<32;seed++){
  const p={...initial(seed),version:5},timeline=createPostTimeline(p,postBank()),rows=Array.from({length:80},(_,i)=>timeline.spawn(i));
  for(let i=1;i<8;i++)assert.ok(rows[i].start-rows[i-1].start>=600&&rows[i].start-rows[i-1].start<=1200);
  assert.ok(rows.every(r=>r.travel>=10000&&r.travel<=18000));assert.ok(new Set(rows.map(r=>r.travel)).size>60);
  const read=createPostStreamReader();
  for(let time=0;time<120000;time+=251){
   const live=read(p,time);
   for(const lane of [0,1])assert.ok(live.filter(r=>r.lane===lane).length<=4);
   assert.ok(live.every(r=>time<r.start+r.travel));
   if(live.some((r,i)=>live.slice(i+1).some(n=>n.progress>r.progress)))overtaking=true;
  }
  const first=rows[0];assert.ok(!visiblePosts(p,first.start+first.travel).some(r=>r.index===0));
  const chosen={...p,published:[{index:0,spawnId:first.spawnId,postId:first.post.id,elapsedMs:3500}]};
  for(const time of [3500,16000,45000])assert.deepEqual(read(chosen,time),visiblePosts(structuredClone(chosen),time));
 }
 assert.ok(overtaking);
 const legacy=createPostTimeline(initial(4),postBank());
 assert.equal(createHash('sha256').update(JSON.stringify(Array.from({length:50},(_,i)=>legacy.spawn(i)))).digest('hex'),'9f0effad29f87bb301ff7cf3f8072e5878a31971fe4378a2769ff8cadcab699b');
});

test('compact stream uses two columns, close staggered starts, and preserves the accepted v3 schedule',()=>{
 for(let seed=0;seed<32;seed++){
  const timeline=createPostTimeline(initial(seed),postBank());
  const rows=Array.from({length:80},(_,i)=>timeline.spawn(i));
  assert.ok(rows.every(row=>row.column===0||row.column===1));
  assert.equal(rows[0].lane,rows[1].lane);assert.notEqual(rows[0].column,rows[1].column);
  for(let i=1;i<4;i++)assert.ok(rows[i].start-rows[i-1].start>=300&&rows[i].start-rows[i-1].start<=600);
  for(let i=0;i<rows.length;i++){
   const previous=rows.slice(0,i).findLast(row=>row.lane===rows[i].lane&&row.column===rows[i].column);
   if(previous)assert.ok(rows[i].start-previous.start>=POST_STREAM.columnHeadway);
  }
 }
 const legacy=createPostTimeline({...initial(4),version:3},postBank());
 assert.equal(createHash('sha256').update(JSON.stringify(Array.from({length:50},(_,i)=>legacy.spawn(i)))).digest('hex'),'0ddc222e649841404ac904b97fdb62de22679d8efd23d00410a77ba62ec03e87');
});

test('global arrivals vary, never coincide, preserve vertical order and cap each side at four',()=>{
 for(let seed=0;seed<32;seed++){
  const p=initial(seed),timeline=createPostTimeline(p,postBank()),arrivals=[];
  for(let i=0;i<100;i++)arrivals.push(timeline.spawn(i));
  const gaps=new Set();
  for(let i=1;i<arrivals.length;i++){
   const gap=arrivals[i].start-arrivals[i-1].start;assert.ok(gap>=POST_STREAM.minGap);gaps.add(gap);
   assert.notEqual(arrivals[i].post.id,arrivals[i-1].post.id);
  }
  // Capacity/headway can repeat exit intervals in a narrower, denser stream.
  assert.ok(gaps.size>5);assert.ok(new Set(arrivals.map(row=>row.size.toFixed(2))).size>10);
  const read=createPostStreamReader();
  for(let t=0;t<120000;t+=137){
   const rows=read(p,t);assert.ok(rows.length<=8);
   for(const lane of [0,1])assert.ok(rows.filter(row=>row.lane===lane).length<=4);
   assert.equal(new Set(rows.map(row=>row.start)).size,rows.length);
   assert.equal(new Set(rows.map(row=>row.post.id)).size,rows.length);
   for(let i=1;i<rows.length;i++)assert.ok(rows[i-1].progress>rows[i].progress);
  }
 }
});

test('missed posts retire below the scene; full sides wait, accepted selections release capacity without bursts',()=>{
 const p=initial(4),base=createPostTimeline(p,postBank()),plan=Array.from({length:20},(_,i)=>base.spawn(i));
 const fullTime=plan[7].start+100;
 const full=visiblePosts(p,fullTime);assert.equal(full.length,8);
 const released={...p,published:[{index:full[0].index,spawnId:full[0].spawnId,postId:full[0].post.id,elapsedMs:fullTime}]};
 const next=createPostTimeline(released,postBank()).spawn(8);
 assert.ok(next.start<plan[8].start);assert.ok(next.start-plan[7].start>=POST_STREAM.minGap);
 assert.ok(!visiblePosts(released,fullTime).some(row=>row.spawnId===full[0].spawnId));
 assert.ok(!visiblePosts(p,plan[0].start+POST_STREAM.travel).some(row=>row.index===0));
 for(let t=fullTime;t<40000;t+=71)for(const lane of [0,1])assert.ok(visiblePosts(released,t).filter(row=>row.lane===lane).length<=4);
});

test('snapshot replay, different frame rates and backwards clock reads reproduce the same stream',()=>{
 const p=initial(6),read=createPostStreamReader();
 for(let t=0;t<80000;t+=333)read(p,t);
 assert.deepEqual(read(p,25000),visiblePosts(structuredClone(p),25000));
 const timeline=createPostTimeline(p,postBank()),first=timeline.spawn(0);
 const changed={...p,published:[{index:0,spawnId:first.spawnId,postId:first.post.id,elapsedMs:3000}]};
 for(const t of [3500,9000,27000,90000])assert.deepEqual(read(changed,t),visiblePosts(structuredClone(changed),t));
 const oldSurvivor={...p,published:[]};
 // Frequent early selections must not evict an older unselected card from
 // the bounded renderer lookup while it is still falling.
 for(let i=1;i<=10;i++){
  const row=createPostTimeline(oldSurvivor,postBank()).spawn(i);
  oldSurvivor.published.push({index:i,spawnId:row.spawnId,postId:row.post.id,elapsedMs:row.start+10});
 }
 assert.ok(visiblePosts(oldSurvivor,13000).some(row=>row.index===0));
});
