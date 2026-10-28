import test from 'node:test';
import assert from 'node:assert/strict';
import {postBank,visiblePosts,reducePosts,postsGoal,POSTS_RULES,catalogForPostsReceipt} from '../src/kdw-posts-model.mjs';
import {storeBank,storeTimeline,reduceStore,storeGoal,STORE_VERSION,catalogForStoreReceipt} from '../src/kdw-store-rating.mjs';
import {selectionRimOpacity} from '../src/activity-webgl/activity-model.mjs';
for(const type of ['cafe','flowers','auto','hotel','theater','sports'])test(`${type}: every new pick is positive and reaches the goal`,()=>{
 for(const kind of ['posts','store']){
  const posts=kind==='posts',taskId=posts?'business.channel':'business.store',screenId=posts?'business.channel.result':'business.store.start';
  const state={sessionId:'positive-only',missionId:'business',status:'task',taskId,screenId,ownerActive:true,runId:1,deadlineAt:61000,progress:{business:{answers:{businessType:type}}}};
  const command={taskId,screenId},reduce=posts?reducePosts:reduceStore,goal=posts?postsGoal:storeGoal;
  const bank=posts?postBank(type):storeBank(type);assert.ok(bank.length>=4);assert.ok(bank.every(p=>p.good));
  assert.equal(reduce(state,{...command,type:posts?'START_POSTS':'START_STORE'},1000),null);
  const activity=state.progress.business[posts?'postsActivity':'storeActivity'];assert.equal(activity.version,posts?POSTS_RULES.version:STORE_VERSION);
  for(let elapsed=0;elapsed<60000&&!goal(activity);elapsed+=100){
   const rows=posts?visiblePosts(activity,elapsed):storeTimeline(activity).at(elapsed);assert.ok(rows.every(r=>r.post.good));
   if(!rows.length)continue;
   assert.equal(reduce(state,{...command,type:posts?'PUBLISH_POST':'PICK_PRODUCT',spawnId:rows[0].spawnId},1000+elapsed),null);
   const result=activity.published.at(-1);assert.ok(posts?result.delta>0:result.score===5);
  }
  assert.ok(goal(activity));assert.equal(activity.published.length,posts?3:9);
 }
});
test('legacy mixed banks and receipt versions stay reproducible',()=>{
 assert.equal(postBank('cafe',12).filter(p=>!p.good).length,5);
 assert.equal(storeBank('cafe',7).filter(p=>!p.good).length,5);
 const receipt=(type,field,version)=>({command:{type},reply:{snapshot:{progress:{business:{[field]:{version}}}}}});
 assert.equal(catalogForPostsReceipt({},receipt('START_POSTS','postsActivity',12)).kdwPostsActivity,12);
 assert.equal(catalogForStoreReceipt({},receipt('START_STORE','storeActivity',7)).kdwStoreActivity,7);
});
test('rim acknowledges press smoothly and fades at launch, never persists in the device',()=>{
 assert.equal(selectionRimOpacity('pending',0),0);
 assert.equal(selectionRimOpacity('queued',70),.5);
 assert.equal(selectionRimOpacity('queued',140),1);
 assert.equal(selectionRimOpacity('flying',0),1);
 assert.equal(selectionRimOpacity('flying',70),.5);
 assert.equal(selectionRimOpacity('flying',140),0);
 assert.equal(selectionRimOpacity('docking',0),0);
 assert.equal(selectionRimOpacity('flying',0,true),0);
});
