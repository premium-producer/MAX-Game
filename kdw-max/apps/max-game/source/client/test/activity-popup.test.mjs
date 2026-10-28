import test from 'node:test';
import assert from 'node:assert/strict';
import {createPostTimeline,POPUP_CARDS} from '../src/kdw-post-stream.mjs';
import {postBank,reducePosts} from '../src/kdw-posts-model.mjs';
import {storeBank,storeTimeline,reduceStore} from '../src/kdw-store-rating.mjs';
import {createRightCardLayout} from '../src/kdw-activity-stage.mjs';
import {createFlowEntry} from '../src/kdw-flow-entry.mjs';
const activity={version:14,seed:42,runId:2,businessType:'cafe',published:[]};
test('popup timeline expires at exactly 150ms and is deterministic across frames/reloads',()=>{
 const t=createPostTimeline(activity,postBank());
 for(let i=0;i<30;i++){
  const start=i*POPUP_CARDS.interval,row=t.at(start)[0];
  assert.equal(row.travel,150);assert.equal(row.velocity,0);assert.equal(row.flow,'popup');
  assert.equal(t.at(start+149.999)[0].spawnId,row.spawnId);assert.deepEqual(t.at(start+150),[]);
  assert.deepEqual(t.spawn(i),createPostTimeline(activity,postBank()).spawn(i));
 }
 assert.notDeepEqual(t.spawn(0).offset,t.spawn(1).offset);
 const accepted={...activity,published:[{spawnId:'2.0',index:0,elapsedMs:50}]};assert.deepEqual(createPostTimeline(accepted,postBank()).at(100),[]);
 assert.equal(storeTimeline({...activity,version:9}).at(0)[0].flow,'popup');
 assert.equal(createPostTimeline({...activity,version:13},postBank()).spawn(0).flow,'free');
 assert.equal(storeTimeline({...activity,version:8}).spawn(0).flow,'free');
});
test('popup images stay still, fit configured bounds, and bypass top-edge admission',()=>{
 const placement=createRightCardLayout(),t=createPostTimeline(activity,postBank());
 const g={rect:{width:390,right:600},playArea:{left:0,right:1300,height:768},flowArea:{top:20,bottom:740},fallingGeometry:{left:700,right:1200,width:440},scale:1};
 const measure=(_s,w)=>w*5/8,entry=createFlowEntry();
 for(let i=0;i<30;i++){
  const start=i*450,first=t.at(start),last=t.at(start+149),a=placement.layout(g,first,measure).get(first[0].spawnId),b=placement.layout({...g,rect:{...g.rect,right:610}},last,measure).get(first[0].spawnId);
  assert.deepEqual(a,b);assert.ok(a.x>=700&&a.x+a.w<=1200&&a.y>=20&&a.y+a.h<=740);
  assert.ok(entry.update(first,()=>a,true).has(first[0].spawnId));
 }
});
for(const posts of [true,false])test(`${posts?'posts':'store'} authority rejects expired popup but accepts live selection`,()=>{
 const taskId=posts?'business.channel':'business.store',screenId=posts?'business.channel.result':'business.store.start';
 const make=()=>({sessionId:'popup',missionId:'business',status:'task',taskId,screenId,ownerActive:true,runId:1,deadlineAt:61000,progress:{business:{answers:{businessType:'cafe'}}}});
 const reduce=posts?reducePosts:reduceStore,c={taskId,screenId},s=make();
 assert.equal(reduce(s,{...c,type:posts?'START_POSTS':'START_STORE'},1000),null);
 assert.equal(reduce(s,{...c,type:posts?'PUBLISH_POST':'PICK_PRODUCT',spawnId:'1.0'},1150),posts?'POST_NOT_AVAILABLE':'PRODUCT_NOT_AVAILABLE');
 assert.equal(reduce(s,{...c,type:posts?'PUBLISH_POST':'PICK_PRODUCT',spawnId:'1.0'},1149),null);
});
