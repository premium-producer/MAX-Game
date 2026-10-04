import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshSession,reduce,objects,availableSteps,needsBusinessChoice,isDone,restoreSession,planningSteps,routePhase} from '../src/journey-state.mjs';
import {TASKS,taskFor} from '../src/journey-tasks.mjs';
const content=JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url)));
const act=(s,a)=>reduce(s,a,content);
const start=id=>act(freshSession(),{type:'MISSION',id});
function place(s,step){s=act(s,{type:'PICK',x:.4,y:.5});return act(s,{type:'PLACE',step});}
function plan(s,branch='channel'){
 s=act(s,{type:'BEGIN_ROUTE',x:.4,y:.5});
 for(const step of content.missions.find(m=>m.id===s.mission).steps)if(!objects(s).some(o=>o.step===step.id))s=place(s,step.id);
 if(s.mission==='business'){s=act(s,{type:'PICK',x:.6,y:.4});s=act(s,{type:'BRANCH',branch});s=place(s,'business-'+branch);}
 return act(s,{type:'CONTINUE_ROUTE'});
}
function finish(s,step,first=0){s=act(s,{type:'OPEN',step});for(let i=0;i<TASKS[step].length;i++)s=act(s,{type:'ANSWER',choice:i===0?first:0});return s;}

test('client ID quest has two levels; neither placement nor direct actions bypass creation',()=>{
 let s=start('digital-id');assert.deepEqual(availableSteps(s,content).map(x=>x.id),['create-id']);
 s=act(s,{type:'PICK',x:.4,y:.5});assert.equal(act(s,{type:'PLACE',step:'hotel'}),s);
 s=plan(s);assert.equal(act(s,{type:'OPEN',step:'hotel'}),s);
 s=finish(s,'create-id');assert.equal(objects(s)[0].done,true);
 assert.deepEqual(availableSteps(s,content).map(x=>x.id),['create-id','hotel','benefit','age']);
 for(const step of ['age','hotel','benefit'])s=finish(s,step);
 assert.ok(isDone(s,content));assert.deepEqual(s.completed,['digital-id']);
});
test('business can plan all three tools before tasks but execution still requires sphere and account',()=>{
 for(const branch of ['channel','bot','store']){
  let s=start('business');assert.equal(s.branch,null);assert.equal(act(s,{type:'BRANCH',branch}),s);
  s=act(s,{type:'BEGIN_ROUTE',x:.4,y:.5});s=place(s,'sector');assert.deepEqual(planningSteps(s,content).map(x=>x.id),['sector','account']);
  assert.deepEqual(availableSteps(s,content).map(x=>x.id),['sector']);
  s=place(s,'account');assert.ok(needsBusinessChoice(s));assert.equal(isDone(s,content),false);
  s=act(s,{type:'PICK',x:.6,y:.4});s=act(s,{type:'BRANCH',branch});assert.equal(s.branchChosen,true);
  s=place(s,'business-'+branch);assert.equal(routePhase(s),'ready');
  s=act(s,{type:'CONTINUE_ROUTE'});assert.equal(act(s,{type:'OPEN',step:'account'}),s);assert.equal(act(s,{type:'OPEN',step:'business-'+branch}),s);
  s=finish(s,'sector',2);assert.equal(objects(s)[0].answers[0],2);
  assert.equal(act(s,{type:'OPEN',step:'business-'+branch}),s);
  s=finish(s,'account');s=finish(s,'business-'+branch);assert.ok(isDone(s,content));
  const saved=restoreSession(JSON.stringify({...s,version:1}),content);assert.equal(saved.branch,branch);assert.equal(saved.runs.business[0].answers[0],2);
 }
});
test('voice/video and sticker/reaction choices change the next screen and survive restoration',()=>{
 for(const step of ['message','reaction'])for(const choice of [0,1]){
  let s=plan(start('communication'));s=act(s,{type:'OPEN',step});s=act(s,{type:'ANSWER',choice});
  const task=taskFor(objects(s).find(o=>o.step===step));
  const expected=step==='message'?(choice?'Видео-сообщение':'Голосовое сообщение'):(choice?'Реакции':'Стикеры');
  assert.equal(task.title,expected);
  const restored=restoreSession(JSON.stringify({...s,version:1}),content);
  assert.equal(taskFor(restored.runs.communication.find(o=>o.step===step)).title,expected);
  s=act(s,{type:'ANSWER',choice:0});assert.equal(objects(s).find(o=>o.step===step).done,true);
 }
});
test('legacy saves retain positions but cannot claim dependent completion or an unchosen branch',()=>{
 const value={version:1,branch:'channel',runs:{'digital-id':[{step:'hotel',x:.2,y:.3,stage:2}],business:[{step:'account',x:.7,y:.8,stage:2}]}};
 const s=restoreSession(JSON.stringify(value),content);
 assert.equal(s.branch,null);assert.equal(s.runs['digital-id'][0].stage,0);assert.equal(s.runs['digital-id'][0].x,.2);
 assert.equal(s.runs.business[0].stage,0);assert.deepEqual(s.completed,[]);
});
test('invalid saved choices are sanitized and unavailable restored objects cannot open',()=>{
 const value={version:1,runs:{communication:[{step:'message',x:.5,y:.5,stage:1,answers:[900]}],'digital-id':[{step:'age',x:.4,y:.4,stage:0}]}};
 let s=restoreSession(JSON.stringify(value),content);assert.equal(s.runs.communication[0].answers[0],0);
 s=act(s,{type:'MISSION',id:'digital-id'});assert.equal(act(s,{type:'OPEN',step:'age'}),s);
});
