import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clientContent,clientTaskFor} from '../src/journey-client.mjs';
import {PRESENTATION_MISSIONS,PRESENTATION_QR} from '../src/journey-presentation.mjs';
import {freshSession,reduce,restoreSession,isDone} from '../src/journey-state.mjs';
import {routeSlots,scenarioLayout,scenarioLinks} from '../src/journey-topology.mjs';
import {clientTaskMarkup} from '../src/journey-client-ui.mjs';
import {parseMissionCatalog} from '../src/mission-config.mjs';
const original=JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url))),content=clientContent(original);
const act=(s,a)=>reduce(s,a,content);
test('two isolated optional missions preserve the four originals and their final',()=>{
 assert.equal(original.missions.length,4);assert.equal(content.missions.length,6);
 const s=freshSession();s.completed=original.missions.map(m=>m.id);assert.equal(act(s,{type:'FINAL'}).screen,'final');
 assert.equal(content.missions.filter(m=>m.presentation).length,2);
 assert.equal(PRESENTATION_QR.url,'https://max.ru/');
 const png=fs.readFileSync(new URL('../public/assets/presentation/max-site-qr.png',import.meta.url));assert.equal(png.readUInt32BE(16),396);assert.equal(png.readUInt32BE(20),396);
});
test('built WebGL catalog contains each presentation node type used by syncScene',()=>{
 const catalog=parseMissionCatalog(JSON.parse(fs.readFileSync(new URL('../public/config/client-webgl.json',import.meta.url))));
 for(const m of PRESENTATION_MISSIONS){const steps=catalog.byNumber[m.number].topology.paths[0].steps;assert.equal(steps.length,m.steps.length);assert(steps.every(s=>s.type));}
});
for(const m of PRESENTATION_MISSIONS)for(const branch of m.id==='demo-business'?[0,1,2]:[0])test(`${m.id}, choice ${branch}: complete MAX → mandatory Gosuslugi → result; restore each action`,()=>{
 let s=act(freshSession(),{type:'MISSION',id:m.id});s=act(s,{type:'BEGIN_ROUTE',x:.5,y:.5});
 while(routeSlots(s).length){const slot=routeSlots(s)[0];s=act(s,{type:'PICK',slot:slot.id,x:.5,y:.5});s=act(s,{type:'PLACE',step:slot.allowed[0]});}
 assert.equal(s.plans[m.id],'ready');assert.equal(isDone(s,content),false);s=act(s,{type:'CONTINUE_ROUTE'});
 assert.equal(act(s,{type:'OPEN',step:m.steps.at(-1).id}),s);
 let gos=false;
 for(const step of m.steps){s=act(s,{type:'OPEN',step:step.id});let o=s.runs[m.id].find(o=>o.step===step.id);
  while(!o.done){const task=clientTaskFor(o),markup=clientTaskMarkup(s,content);assert(!markup.includes('СЦЕНА ???'));assert(!markup.includes('undefined'));
   if(task.title==='Согласие для Минцифры'){gos=true;assert.match(markup,/Реальной авторизации/);assert.match(markup,/Предоставить/);assert.equal(isDone(s,content),false);}
   if(step.id==='demo-tool'&&o.stage===1)assert.match(task.options[0],[/канал/,/бота/,/витрину/][branch]);
   s=act(s,{type:'ANSWER',choice:step.id==='demo-tool'&&o.stage===0?branch:0});o=s.runs[m.id].find(o=>o.step===step.id);
   const restored=restoreSession(JSON.stringify({...s,version:1}),content);assert.deepEqual(restored.runs[m.id],s.runs[m.id]);
  }s=act(s,{type:'CLOSE'});
 }
 assert(gos);assert(isDone(s,content));assert.deepEqual(s.completed,[m.id]);assert.equal(m.qr.url,'https://max.ru/');
});
test('demo slots retain positions and chain links for short wall and full browser',()=>{
 for(const m of PRESENTATION_MISSIONS)for(const [w,h,compact] of [[1712,405,true],[816,405,true],[1520,780,false]]){
  let s=act(act(freshSession(),{type:'MISSION',id:m.id}),{type:'BEGIN_ROUTE',x:.5,y:.5});
  while(routeSlots(s).length){const layout=scenarioLayout(s,w,h,compact),slot=layout.slots[0];assert(Number.isFinite(slot.x)&&slot.x>=0&&slot.x<=w&&slot.y>=0&&slot.y<=h);s=act(s,{type:'PICK',slot:slot.id,x:.5,y:.5});s=act(s,{type:'PLACE',step:slot.allowed[0]});}
  const nodes=Object.entries(scenarioLayout(s,w,h,compact).positions).map(([step,p])=>({id:step,step,...p}));assert.equal(nodes.length,m.steps.length+1);assert.equal(scenarioLinks(m.id,nodes).length,m.steps.length);
 }
});

test('presentation routes start with MAX and restore old progress without the removed stela task',()=>{
 for(const m of PRESENTATION_MISSIONS){
  assert.equal(m.start,'Открыть MAX');assert.equal(m.steps[0].id,'demo-id');
  assert.doesNotMatch(JSON.stringify(m),/стел|stela/i);
  const s=freshSession();s.starts[m.id]={step:'open-max',x:.5,y:.5};s.plans[m.id]='playing';
  s.runs[m.id]=[{step:'demo-stela',x:.2,y:.2,stage:2,done:true,answers:[0,0]},
   {step:'demo-id',x:.7,y:.7,stage:2,done:false,answers:[0,0],slot:'demo-1'}];
  const r=restoreSession(JSON.stringify({...s,version:1}),content);
  assert.deepEqual(r.runs[m.id].map(o=>o.step),['demo-id']);
  assert.equal(r.runs[m.id][0].stage,0);assert.deepEqual(r.runs[m.id][0].answers,[]);
  assert.deepEqual(r.starts[m.id],s.starts[m.id]);assert.equal(r.plans[m.id],'playing');
  r.mission=m.id;assert(scenarioLayout(r,816,405,true).positions['demo-id']);
 }
});
