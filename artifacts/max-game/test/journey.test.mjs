import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshSession,reduce,objects,stepsFor,isDone,restoreSession,showMissionCTA,routePhase,routeStart} from '../src/journey-state.mjs';
import {TASKS} from '../src/journey-tasks.mjs';
import {ICON_SHAPES,iconKey} from '../src/journey-icons.mjs';
import {dragPosition} from '../src/journey-drag.mjs';
const c=JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url)));
const act=(s,a)=>reduce(s,a,c);

test('answers keep a task open until completion, including wrong attempts',()=>{
 let s=plan(act(freshSession(),{type:'MISSION',id:'blogger'}));
 s=act(s,{type:'OPEN',step:'comments'});
 s=act(s,{type:'ANSWER',choice:1});assert.equal(s.task,'comments');assert.equal(objects(s).find(o=>o.step==='comments').stage,0);assert.ok(s.notice);
 s=act(s,{type:'ANSWER',choice:0});assert.equal(s.task,'comments');assert.equal(objects(s).find(o=>o.step==='comments').stage,1);
 s=act(s,{type:'ANSWER',choice:0});assert.equal(s.task,null);assert.equal(objects(s).find(o=>o.step==='comments').done,true);
 assert.equal(act(s,{type:'ANSWER',choice:0}),s,'late answers cannot reopen or advance another task');
});

test('mission CTA opens MAX without placing a task or opening a picker',()=>{
 assert.equal(showMissionCTA(freshSession(),c),false);
 for(const m of c.missions){
  let s=act(freshSession(),{type:'MISSION',id:m.id});assert.equal(showMissionCTA(s,c),true);
  assert.equal(act(s,{type:'PICK',x:.5,y:.4}),s,'first tap cannot open the picker');
  s=act(s,{type:'BEGIN_ROUTE',x:.5,y:.4});assert.equal(showMissionCTA(s,c),false);
  assert.equal(s.picker,null);assert.equal(routeStart(s).step,'open-max');assert.equal(objects(s).length,0);
  assert.equal(act(s,{type:'BEGIN_ROUTE',x:.5,y:.4}),s);
  s=act(s,{type:'PICK',x:.7,y:.4});s=act(s,{type:'CLOSE'});assert.equal(showMissionCTA(s,c),false);
  s=act(restoreSession(JSON.stringify({...s,version:1}),c),{type:'MISSION',id:m.id});assert.equal(showMissionCTA(s,c),false);
  assert.equal(routePhase(s),'building');
 }
});

test('fully placed mission never opens an empty picker or blocks remaining tasks and drag',()=>{
 let s=plan(act(freshSession(),{type:'MISSION',id:'blogger'}),false);
 assert.equal(routePhase(s),'ready');
 assert.equal(act(s,{type:'OPEN',step:'channel'}),s);
 assert.equal(act(s,{type:'MOVE',step:'channel',x:.7,y:.6}),s);
 s=act(s,{type:'CONTINUE_ROUTE'});
 assert.equal(isDone(s,c),false);
 assert.equal(act(s,{type:'PICK',x:.7,y:.6}),s);assert.equal(s.picker,null);
 assert.equal(act(s,{type:'MOVE',step:'channel',x:.7,y:.6}).runs.blogger[0].x,.7);
 assert.equal(act(s,{type:'OPEN',step:'channel'}).task,'channel');
});
test('drag preserves task completion, clamps the whole object and restores position',()=>{
 let s=act(freshSession(),{type:'MISSION',id:'blogger'});s=finish(s,'channel');const original=structuredClone(s);
 s=act(s,{type:'MOVE',step:'channel',x:4,y:-2});assert.equal(objects(s)[0].x,1);assert.equal(objects(s)[0].y,0);assert.equal(objects(s)[0].done,true);assert.equal(objects(s)[0].stage,2);assert.deepEqual(s.completed,original.completed);assert.equal(objects(original)[0].x,.3);
 const restored=restoreSession(JSON.stringify({...s,version:1}),c);assert.equal(restored.runs.blogger[0].x,1);
 assert.equal(act(s,{type:'MOVE',step:'channel',x:NaN,y:.3}),s);assert.equal(act(s,{type:'MOVE',step:'absent',x:.5,y:.3}),s);
 const task=act(s,{type:'OPEN',step:'channel'});assert.equal(act(task,{type:'MOVE',step:'channel',x:.2,y:.2}),task);
 const building=act(freshSession(),{type:'MISSION',id:'blogger'});assert.equal(act(building,{type:'MOVE',step:'channel',x:.2,y:.2}),building);
 const p=dragPosition({x:.3,y:.4},100,50,500,250);assert.equal(p.x,.5);assert.ok(Math.abs(p.y-.6)<1e-12);
 assert.deepEqual(dragPosition({x:.3,y:.4},-999,999,500,250),{x:0,y:1});
});
function plan(s,proceed=true){
 if(!objects(s).length)s=act(s,{type:'BEGIN_ROUTE',x:.3,y:.4});
 const mission=c.missions.find(m=>m.id===s.mission);
 for(const step of mission.steps){if(objects(s).some(o=>o.step===step.id))continue;s=act(s,{type:'PICK',x:.3,y:.4});s=act(s,{type:'PLACE',step:step.id});}
 if(mission.branches){
  s=act(s,{type:'PICK',x:.6,y:.4});if(!s.branch)s=act(s,{type:'BRANCH',branch:'channel'});
  s=act(s,{type:'PLACE',step:'business-'+s.branch});
 }
 return proceed?act(s,{type:'CONTINUE_ROUTE'}):s;
}
function finish(s,step){if(routePhase(s)!=='playing')s=plan(s);s=act(s,{type:'OPEN',step});for(const task of TASKS[step])s=act(s,{type:'ANSWER',choice:task.correct==='*'?0:task.correct});return act(s,{type:'CLOSE'});}
test('complete journey CTA → four missions → final; placement alone never completes',()=>{
 let s=freshSession();assert.equal(s.screen,'cta');assert.equal(act(s,{type:'FINAL'}),s);s=act(s,{type:'START'});
 for(const m of c.missions){s=act(s,{type:'MISSION',id:m.id});assert.equal(isDone(s,c),false);for(const step of stepsFor(c,m.id,s.branch))s=finish(s,step.id);if(m.branches){s=act(s,{type:'BRANCH',branch:'channel'});s=finish(s,'business-channel');}assert.equal(isDone(s,c),true);s=act(s,{type:'MENU'});}
 assert.equal(s.completed.length,4);assert.equal(act(s,{type:'FINAL'}).screen,'final');assert.deepEqual(act(s,{type:'RESET'}),freshSession());
});
test('each business branch works; shared progress survives switching; no premature completion',()=>{
 let s=act(freshSession(),{type:'MISSION',id:'business'});s=finish(s,'sector');s=finish(s,'account');
 for(const branch of ['channel','bot','store']){s=act(s,{type:'BRANCH',branch});assert.equal(isDone(s,c),false);s=finish(s,'business-'+branch);assert.ok(isDone(s,c));assert.equal(s.completed.length,1);}
 assert.equal(objects(s).length,5);
});
test('wrong task actions do not progress, duplicate placement rejected, state immutable',()=>{
 let s=plan(act(freshSession(),{type:'MISSION',id:'blogger'}));assert.equal(objects(s)[0].done,false);const before=JSON.stringify(s);
 assert.equal(act(s,{type:'ANSWER',choice:0}),s);s=act(s,{type:'OPEN',step:'channel'});s=act(s,{type:'ANSWER',choice:0});const wrong=act(s,{type:'ANSWER',choice:1});assert.equal(objects(wrong)[0].stage,1);assert.equal(wrong.completed.length,0);assert.ok(wrong.notice);assert.equal(JSON.parse(before).runs.blogger[0].stage,0);
 s=act(s,{type:'CLOSE'});s=act(s,{type:'PICK',x:.2,y:.3});assert.equal(act(s,{type:'PLACE',step:'channel'}),s);
});
test('independent sessions and recoverable validated progress',()=>{
 let a=act(freshSession(),{type:'MISSION',id:'communication'}),b=freshSession();a=finish(a,'call');assert.deepEqual(b,freshSession());const r=restoreSession(JSON.stringify({...a,version:1}),c);assert.equal(r.screen,'cta');assert.equal(r.runs.communication[0].done,true);assert.deepEqual(restoreSession('broken',c),freshSession());
 const malicious={version:1,runs:{communication:[{step:'call',x:999,y:-9,stage:2},{step:'call',x:0,y:0,stage:2},{step:'absent',x:0,y:0,stage:2}]},completed:['blogger']};const clean=restoreSession(JSON.stringify(malicious),c);assert.equal(clean.runs.communication.length,1);assert.equal(clean.runs.communication[0].x,1);assert.equal(clean.completed.length,0);
});
test('every client step has a semantic vector icon and executable task',()=>{
 for(const m of c.missions)for(const s of [...m.steps,...(m.branches||[]).map(b=>b.step)]){assert.ok(ICON_SHAPES[iconKey(s.id)],s.id);assert.ok(TASKS[s.id]?.length,s.id);for(const t of TASKS[s.id])assert.ok(t.correct==='*'||t.options[t.correct]);}
});
