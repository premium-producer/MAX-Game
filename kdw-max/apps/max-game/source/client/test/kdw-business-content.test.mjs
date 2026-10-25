import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {postBank,visiblePosts,reducePosts,postsGoal,POSTS_RULES} from '../src/kdw-posts-model.mjs';
import {storeBank,storeTimeline,reduceStore,storeGoal} from '../src/kdw-store-rating.mjs';
const rows=fs.readFileSync(new URL('../../../../../docs/BUSINESS_CONTENT_CARDS.md',import.meta.url),'utf8').split(/\r?\n/).filter(l=>/^\| (cafe|flowers|auto)-(post|product)-/.test(l)).map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));
test('all 60 approved cards reach live banks with exact copy, classification and prices',()=>{
 assert.equal(rows.length,60);
 for(const type of ['cafe','flowers','auto'])for(const kind of ['post','product']){
  const bank=kind==='post'?postBank(type):storeBank(type);
  assert.equal(bank.length,10);assert.equal(bank.filter(p=>p.good).length,5);
  for(const p of bank){
   const r=rows.find(r=>r[0]===p.id);assert.ok(r,p.id);assert.equal(p.title,r[2]);assert.equal(p.description,r[3]);
   assert.equal(p.good,r[0].includes('-good-'));assert.equal(p.reason,r[6]);
   assert.ok(p.title.split(/\s+/).length<=(kind==='post'?6:4));assert.ok(!/₽|рубл/.test(p.title));
   if(kind==='post')assert.equal(p.body,r[3]);else assert.equal(p.price,Number(r[4].replace(/\D/g,'')));
  }
 }
});
test('old activity versions retain original banks, IDs and order',()=>{
 for(const type of ['cafe','flowers','auto']){
  assert.equal(postBank(type,11).length,8);assert.equal(storeBank(type,6).length,6);
  const p={version:11,businessType:type,runId:1,seed:3,published:[]};
  assert.ok(visiblePosts(p,6000).every(s=>!s.post.id.includes('-post-')));
  assert.ok(visiblePosts({...p,version:POSTS_RULES.version},6000).every(s=>s.post.id.startsWith(type+'-post-')));
 }
});
test('each reviewed store can reach its goal after a mistake within the task time',()=>{
 for(const type of ['cafe','flowers','auto']){
  const s={status:'task',taskId:'business.store',screenId:'business.store.start',ownerActive:true,runId:1,deadlineAt:61000,progress:{business:{answers:{businessType:type}}}};
  const c={taskId:s.taskId,screenId:s.screenId};assert.equal(reduceStore(s,{...c,type:'START_STORE'},1000),null);
  let mistake=false;
  for(let elapsed=0;elapsed<60000&&!storeGoal(s.progress.business.storeActivity);elapsed+=100){
   const a=s.progress.business.storeActivity,available=storeTimeline(a).at(elapsed);
   const selected=available.find(r=>!mistake?!r.post.good:r.post.good);
   if(!selected)continue;
   assert.equal(reduceStore(s,{...c,type:'PICK_PRODUCT',spawnId:selected.spawnId},1000+elapsed),null);
   if(!selected.post.good)mistake=true;
  }
  assert.ok(mistake);assert.ok(storeGoal(s.progress.business.storeActivity),type);
 }
});
test('each reviewed channel reaches its audience goal after a mistake within the task time',()=>{
 for(const type of ['cafe','flowers','auto']){
  const s={sessionId:'content-test',missionId:'business',status:'task',taskId:'business.channel',screenId:'business.channel.result',ownerActive:true,runId:1,deadlineAt:61000,progress:{business:{answers:{businessType:type}}}};
  const c={taskId:s.taskId,screenId:s.screenId};assert.equal(reducePosts(s,{...c,type:'START_POSTS'},1000),null);
  let mistake=false;
  for(let elapsed=0;elapsed<60000&&!postsGoal(s.progress.business.postsActivity);elapsed+=100){
   const a=s.progress.business.postsActivity,available=visiblePosts(a,elapsed);
   const selected=available.find(r=>!mistake?!r.post.good:r.post.good);
   if(!selected)continue;
   assert.equal(reducePosts(s,{...c,type:'PUBLISH_POST',spawnId:selected.spawnId},1000+elapsed),null);
   if(!selected.post.good)mistake=true;
  }
  assert.ok(mistake);assert.ok(postsGoal(s.progress.business.postsActivity),type);
 }
});
