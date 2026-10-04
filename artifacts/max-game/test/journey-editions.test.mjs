import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clientContent,CLIENT_TASKS,CLIENT_BRIEFS,CLIENT_DIFFERENCES,journeyStorageKey} from '../src/journey-client.mjs';
import {clientTaskMarkup} from '../src/journey-client-ui.mjs';
import {tasksFor,taskFor} from '../src/journey-tasks.mjs';
import {freshSession,reduce,objects,restoreSession,isDone,availableSteps} from '../src/journey-state.mjs';
const current=JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url))),client=clientContent(current);
const act=(s,a)=>reduce(s,a,client);
function plan(id,branch='channel'){
 let s=act(freshSession(),{type:'MISSION',id});s=act(s,{type:'BEGIN_ROUTE',x:.5,y:.5});
 for(const step of client.missions.find(m=>m.id===id).steps){
  s=act(s,{type:'PICK',x:.6,y:.5});assert.equal(s.task,null);assert.deepEqual(s.picker,{x:.6,y:.5});
  s=act(s,{type:'PLACE',step:step.id});
 }
 if(id==='business'){s=act(s,{type:'PICK',x:.6,y:.5});s=act(s,{type:'PLACE',step:'business-'+branch,branch});}
 return act(s,{type:'CONTINUE_ROUTE'});
}
function finish(s,step){
 s=act(s,{type:'OPEN',step});assert.equal(s.task,step);
 const list=CLIENT_TASKS[step];
 for(let i=0;i<list.length;i++){
  assert.match(clientTaskMarkup(s,client),step==='create-id'?/id-screen-image/:/task-media-image|media-placeholder/);
  const before=s;s=act(s,{type:'ANSWER',choice:i===0&&step==='message'?1:0});
  assert.notEqual(s,before);if(i<list.length-1)assert.equal(s.task,step,'intermediate steps keep popup');
 }
 assert.equal(objects(s).find(o=>o.step===step).done,true);
 if(!isDone(s,client)){assert.equal(s.task,step);assert.match(clientTaskMarkup(s,client),/Задание выполнено/);s=act(s,{type:'CLOSE'});}
 return s;
}
test('editions isolate saves and preserve current mission/task data',()=>{
 assert.equal(current.edition,undefined);assert.equal(current.missions[3].steps.length,2);assert.equal(client.missions[3].steps.length,1);
 assert.deepEqual(client.missions[2].steps.map(s=>s.id),['call','message','group','reaction','story']);
 assert.notEqual(tasksFor(client),tasksFor(current));assert.equal(tasksFor(current).channel.length,2);
 const keys=new Set();for(const edition of ['current','client'])for(const wall of [false,true])for(const mode of ['single','two'])keys.add(journeyStorageKey(edition,wall,mode));assert.equal(keys.size,8);
 assert.equal(journeyStorageKey('current',false,'single'),'max-journey-v1:web:single');
});
test('all four client missions and each business branch complete through scene actions',()=>{
 for(const id of ['blogger','digital-id','communication','business'])for(const branch of id==='business'?['channel','bot','store']:['channel']){
  let s=plan(id,branch);const ids=objects(s).map(o=>o.step);
  for(const step of ids)s=finish(s,step);
  assert.ok(isDone(s,client));assert.equal(s.task,null);assert.deepEqual(s.completed,[id]);
  const restored=restoreSession(JSON.stringify({...s,version:1}),client);restored.mission=id;
  assert.ok(isDone(restored,client));assert.equal(restored.briefs[id],undefined);
 }
});
test('client task prerequisites remain enforced without mandatory brief acknowledgement',()=>{
 let s=plan('digital-id');assert.equal(act(s,{type:'OPEN',step:'hotel'}),s);
 assert.deepEqual(availableSteps(s,client).map(s=>s.id),['create-id']);
 s=plan('business','bot');assert.equal(act(s,{type:'OPEN',step:'business-bot'}),s);
});

test('every next-step plus opens the picker even with an unread or dismissed client brief',()=>{
 for(const mission of client.missions)for(const read of [false,true]){
  let s=act(freshSession(),{type:'MISSION',id:mission.id});s=act(s,{type:'BEGIN_ROUTE',x:.5,y:.5});
  // Product copy remains available explicitly through the MAX node.
  s=act(s,{type:'OPEN',step:'open-max'});assert.equal(s.task,'open-max');assert.match(clientTaskMarkup(s,client),/Наметить путь/);
  s=act(s,{type:read?'BRIEF_DONE':'CLOSE'});
  for(let attempt=0;attempt<2;attempt++){
   s=act(s,{type:'PICK',x:.6,y:.5});assert.equal(s.task,null);assert.deepEqual(s.picker,{x:.6,y:.5});
   s=act(s,{type:'CLOSE'});
  }
 }
});
test('format choices and integrated business sector survive save/restore',()=>{
 let s=plan('communication');s=act(s,{type:'OPEN',step:'message'});s=act(s,{type:'ANSWER',choice:1});
 assert.equal(taskFor(objects(s).find(o=>o.step==='message'),client).media,'video');
 let restored=restoreSession(JSON.stringify({...s,version:1}),client);assert.equal(taskFor(restored.runs.communication.find(o=>o.step==='message'),client).media,'video');
 s=plan('business');s=act(s,{type:'OPEN',step:'account'});s=act(s,{type:'ANSWER',choice:0});s=act(s,{type:'ANSWER',choice:2});
 assert.match(clientTaskMarkup(s,client),/Сфера: Услуги/);restored=restoreSession(JSON.stringify({...s,version:1}),client);assert.equal(restored.runs.business[0].answers[1],2);
});
test('client discrepancies and all supplied briefs are present; missing media remains explicit placeholders',()=>{
 assert.equal(Object.keys(CLIENT_BRIEFS).length,4);
 for(const id of ['group','reaction','account'])assert.match(CLIENT_DIFFERENCES[id],/Расхождение/);
 for(const tasks of Object.values(CLIENT_TASKS))for(const task of tasks){assert.ok(task.scene);assert.ok(task.options.length);}
 const s=plan('communication');const opened=act(s,{type:'OPEN',step:'group'}),html=clientTaskMarkup(opened,client);
 assert.match(html,/Расхождение/);assert.match(html,/Заглушка:/);assert.doesNotMatch(html,/<video|<canvas|<iframe/);
});
