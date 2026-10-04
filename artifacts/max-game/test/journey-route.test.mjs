import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshSession,reduce,objects,routePhase,routePlanned,restoreSession,planningSteps,routeStart} from '../src/journey-state.mjs';
import {routeLayout,nextStepLabel,routeStartCaption} from '../src/journey-route-layout.mjs';
import {journeyFieldBounds} from '../src/circle-model.mjs';
import {objectMetrics,placementAt,placementAnchor} from '../src/journey-radial.mjs';
import {IconMotion,MotionRegistry} from '../src/journey-motion.mjs';
const c=JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url)));
const act=(s,a)=>reduce(s,a,c);
const start=id=>act(freshSession(),{type:'MISSION',id});

test('planning, ready and playing survive saves independently per mission',()=>{
 let s=start('blogger');
 assert.equal(act(s,{type:'CONTINUE_ROUTE'}),s);
 s=act(s,{type:'BEGIN_ROUTE',x:.5,y:.5});
 assert.equal(routePhase(s),'building');assert.equal(act(s,{type:'OPEN',step:'channel'}),s);
 const first=structuredClone(routeStart(s));
 for(const id of ['channel','statistics','comments']){
  s=act(s,{type:'PICK',x:.6,y:.5});s=act(s,{type:'PLACE',step:id});
 }
 assert.equal(routePhase(s),'ready');assert.ok(routePlanned(s,c));assert.deepEqual(routeStart(s),first);
 assert.deepEqual(objects(s).map(o=>o.step),['channel','statistics','comments']);assert.equal(s.completed.length,0);
 assert.equal(act(s,{type:'ANSWER',choice:0}),s);assert.equal(act(s,{type:'PICK',x:.1,y:.1}),s);
 s=act(s,{type:'CLOSE'});assert.equal(routePhase(s),'ready','outside close never skips Continue');
 s=act(restoreSession(JSON.stringify({...s,version:1}),c),{type:'MISSION',id:'blogger'});
 assert.equal(routePhase(s),'ready');s=act(s,{type:'CONTINUE_ROUTE'});
 assert.equal(routePhase(s),'playing');assert.equal(act(s,{type:'CONTINUE_ROUTE'}),s);
 s=act(s,{type:'MISSION',id:'digital-id'});assert.equal(routePhase(s),'building');
 s=act(s,{type:'MISSION',id:'blogger'});assert.equal(routePhase(s),'playing');
 s=act(s,{type:'OPEN',step:'statistics'});assert.equal(s.task,'statistics');
});

test('all ID locations can be planned without falsely completing the ID task',()=>{
 let s=start('digital-id');s=act(s,{type:'BEGIN_ROUTE',x:.5,y:.5});
 assert.deepEqual(planningSteps(s,c).map(o=>o.id),['create-id']);s=act(s,{type:'PICK',x:.6,y:.5});s=act(s,{type:'PLACE',step:'create-id'});
 assert.equal(planningSteps(s,c).length,4);
 for(const id of ['age','benefit','hotel']){s=act(s,{type:'PICK',x:.6,y:.5});s=act(s,{type:'PLACE',step:id});}
 assert.equal(routePhase(s),'ready');assert.ok(objects(s).every(o=>!o.done&&o.stage===0));
 s=act(s,{type:'CONTINUE_ROUTE'});assert.equal(act(s,{type:'OPEN',step:'hotel'}),s);
});

test('legacy active task progress retains free positions and bypasses new onboarding',()=>{
 const s=restoreSession(JSON.stringify({version:1,runs:{blogger:[{step:'channel',x:.23,y:.87,stage:1,answers:[0]}]}}),c);
 const opened=act(s,{type:'MISSION',id:'blogger'});
 assert.equal(routePhase(opened),'playing');assert.equal(objects(opened)[0].x,.23);assert.equal(objects(opened)[0].y,.87);
 assert.equal(act(opened,{type:'OPEN',step:'channel'}).task,'channel');
});

test('a business tool is selected and placed in one action; cancellation never selects a default',()=>{
 for(const branch of ['channel','bot','store']){
  let s=start('business');s=act(s,{type:'BEGIN_ROUTE',x:.5,y:.5});
  s=act(s,{type:'PICK',x:.6,y:.5});s=act(s,{type:'PLACE',step:'sector'});
  s=act(s,{type:'PICK',x:.6,y:.5});s=act(s,{type:'PLACE',step:'account'});
  s=act(s,{type:'PICK',x:.7,y:.5});s=act(s,{type:'CLOSE'});assert.equal(s.branch,null);
  s=act(s,{type:'PICK',x:.7,y:.5});assert.equal(act(s,{type:'PLACE',step:'business-bot',branch:'channel'}),s);
  s=act(s,{type:'PLACE',step:'business-'+branch,branch});assert.equal(routePhase(s),'ready');
  assert.equal(s.branch,branch);assert.equal(s.branchChosen,true);assert.equal(objects(s).length,3);assert.equal(s.picker,null);
 }
});

test('route row fits one/two wall zones and narrow standalone, including caption gaps',()=>{
 for(const [w,h,compact]of [[1712,405,true],[816,405,true],[1520,780,false],[820,880,false]]){
  const metrics=objectMetrics(compact),field=journeyFieldBounds(w,h,compact);
  for(let count=1;count<=6;count++){
   const next=count<6,l=routeLayout(count,next,w,h,compact);
   assert.equal(l.centers.length,count+Number(next));
   l.centers.forEach((p,i)=>{
    assert.ok(p.x-metrics.tile/2>=0&&p.x+metrics.tile/2<=w);
    assert.ok(p.y-metrics.tile/2>=0&&p.y+metrics.tile/2+60<=h);
    if(i)assert.ok(p.x-l.centers[i-1].x>=l.captionWidth+15);
    const restored=placementAnchor(placementAt(p.x,p.y,field,metrics),field,metrics);
    assert.ok(Math.abs(restored.x-p.x)<1e-8&&Math.abs(restored.y-p.y)<1e-8,'stored coordinates preserve row centres');
   });
  }
  const first=routeLayout(1,true,w,h,compact);assert.ok(first.centers[0].x<w/2&&first.centers[1].x>w/2);
 }
 assert.equal(nextStepLabel(2),'Твой второй шаг');assert.equal(nextStepLabel(5),'Твой пятый шаг');
});

test('CTA ownership and subsequent row retarget preserve springs; badges wait for Continue',()=>{
 const registry=new MotionRegistry(),host={},initial={x:760,y:360,size:104,radius:52};
 const m=registry.get(host,'open-max',initial);m.label.value=0;m.badge.value=0;
 assert.equal(registry.get(host,'open-max',{x:600,y:300,size:108,radius:54}),m);
 for(let n=0;n<12;n++)m.step(1/60,{x:640,y:360,size:108,radius:54,badgeVisible:false,time:n/60});
 const before={...m.x};const adopted=registry.get(host,'open-max',{x:524,y:360,size:108,radius:54});
 assert.deepEqual({...adopted.x},before);assert.equal(m.badge.value,0);assert.ok(m.x.value<760&&m.x.value>640);
 m.step(1/60,{x:524,y:360,size:108,radius:54,badgeVisible:false,time:1});assert.ok(Math.abs(m.x.value-before.value)<12);
 m.step(1/60,{x:524,y:360,size:108,radius:54,badgeVisible:true,time:1});assert.ok(m.badge.value>0&&m.badge.value<.02);
 m.step(1/60,{x:524,y:360,size:108,radius:54,badgeVisible:true,reduced:true});assert.equal(m.badge.value,1);assert.equal(m.x.value,524);
});


test('all missions start with MAX independently of real tasks, including save and drag',()=>{
 for(const m of c.missions){
  let s=start(m.id);s=act(s,{type:'BEGIN_ROUTE',x:.45,y:.5});
  assert.equal(routeStart(s).step,'open-max');assert.equal(objects(s).length,0);
  assert.equal(s.task,null);assert.equal(s.picker,null);assert.equal(routePlanned(s,c),false);
  assert.equal(act(s,{type:'OPEN',step:'open-max'}),s);
  assert.equal(act(s,{type:'ANSWER',choice:0}),s);
  assert.match(routeStartCaption(m.id),/^Твой первый шаг к /);
  assert.ok(planningSteps(s,c).some(step=>step.id===m.steps[0].id));
  s=act(restoreSession(JSON.stringify({...s,version:1}),c),{type:'MISSION',id:m.id});
  assert.equal(routeStart(s).x,.45);assert.equal(objects(s).length,0);
  assert.equal(act(s,{type:'BEGIN_ROUTE',x:.8,y:.8}),s);
  s.plans[m.id]='playing';s=act(s,{type:'MOVE',step:'open-max',x:.7,y:.3});
  assert.equal(routeStart(s).x,.7);assert.equal(routeStart(s).y,.3);assert.equal(s.completed.length,0);
 }
 assert.equal(routeStartCaption('blogger'),'Твой первый шаг к блогу');
 assert.equal(nextStepLabel(6),'Твой шестой шаг');
});

test('legacy auto-placed first tasks survive adding the MAX starting point',()=>{
 const saved={version:1,plans:{blogger:'building'},runs:{blogger:[{step:'channel',x:.3,y:.5,stage:0}]}};
 let s=restoreSession(JSON.stringify(saved),c);s=act(s,{type:'MISSION',id:'blogger'});
 assert.equal(objects(s)[0].step,'channel');assert.equal(objects(s)[0].x,.3);
 assert.equal(routeStart(s).step,'open-max');assert.ok(routeStart(s).x<objects(s)[0].x);
 const again=act(restoreSession(JSON.stringify({...s,version:1}),c),{type:'MISSION',id:'blogger'});
 assert.deepEqual(routeStart(again),routeStart(s));assert.equal(objects(again).length,1);
});
