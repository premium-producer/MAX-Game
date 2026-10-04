import test from 'node:test';
import assert from 'node:assert/strict';
import {PopupFocus,InstructionMotion,TaskContentTransition} from '../src/journey-popup-motion.mjs';
import {objectContextPresence,taskContentPresence} from '../../service/public/max-panel-optics.js';

test('focus survives removal of the dialog and reverses without a value/velocity reset',()=>{
 const f=new PopupFocus();for(let i=0;i<50;i++)f.step('channel',false,1/60);
 const start=f.amount.value;f.step('channel',true,1/60);
 assert.ok(f.amount.value<start&&f.amount.value>.95);
 const closing=f.amount.value;f.step('',false,1/60);
 assert.ok(f.amount.value<closing&&f.amount.value>.9);assert.equal(f.object,'channel');
 const value=f.amount.value,velocity=f.amount.velocity;f.step('channel',false,0);
 assert.equal(f.amount.value,value);assert.equal(f.amount.velocity,velocity);
 for(let i=0;i<100;i++)f.step('',false,1/60);assert.equal(f.amount.value,0);
});
test('focus and resize agree at 30/60/120 Hz without stretching layout text',()=>{
 const results=[30,60,120].map(hz=>{
  const f=new PopupFocus(),r=new InstructionMotion({top:100,height:250});r.retarget({top:30,height:320});
  for(let i=0;i<hz/2;i++){f.step('channel',false,1/hz);r.step(1/hz);}
  return [f.amount.value,r.top.value,r.height.value];
 });
 for(const r of results)r.forEach((v,i)=>assert.ok(Math.abs(v-results[0][i])<1e-9));
});
test('adaptive resize preserves the pinned bottom and velocity when retargeted',()=>{
 const r=new InstructionMotion({top:100,height:250});r.retarget({top:30,height:320});
 for(let i=0;i<10;i++){r.step(1/60);assert.ok(Math.abs(r.top.value+r.height.value-350)<1e-9);}
 const h=r.height.value,v=r.height.velocity;r.retarget({top:150,height:200});
 assert.equal(r.height.value,h);assert.equal(r.height.velocity,v);
 r.step(1/60);assert.ok(Math.abs(r.height.value-h)<10);
 for(let i=0;i<100;i++)r.step(1/60);assert.ok(r.settled);
});
test('copy swap commits once at zero opacity; repeated answers cannot queue',()=>{
 const t=new TaskContentTransition();let commits=0;
 t.start(()=>{assert.equal(t.value,0);commits++;});
 assert.equal(t.start(()=>commits+=10),false);
 let last=1;
 while(t.phase==='out'){t.tick(1/60);assert.ok(t.value<=last);last=t.value;}
 assert.equal(commits,1);assert.equal(last,0);
 while(t.busy){t.tick(1/60);assert.ok(t.value>=last);last=t.value;}
 assert.equal(t.value,1);assert.equal(commits,1);
});
test('edge wave travels continuously through the hidden swap and the new image entrance',()=>{
 for(const hz of [30,60,120]){
  const t=new TaskContentTransition();let commits=0;
  t.start(()=>commits++);let previous=0,afterSwap=false;
  while(t.busy){
   t.tick(1/hz);
   if(t.phase==='idle')break;
   assert.ok(t.sweepProgress>=previous-1e-9);
   if(t.phase==='in'){afterSwap=true;assert.ok(t.sweepProgress>.35);}
   previous=t.sweepProgress;
  }
  assert.equal(commits,1);assert.equal(afterSwap,true);assert.ok(previous>.9);
 }
});
test('manual close/layout disposal cancels pending answers; reduced motion is immediate',()=>{
 const t=new TaskContentTransition();let commits=0;t.start(()=>commits++);
 t.tick(1/60);t.cancel();for(let i=0;i<50;i++)t.tick(1/60);assert.equal(commits,0);
 t.start(()=>commits++,true);assert.equal(commits,1);assert.equal(t.busy,false);
 const f=new PopupFocus();assert.equal(f.step('channel',false,1/60,true),1);assert.equal(f.step('',false,1/60,true),0);
 const r=new InstructionMotion({top:0,height:200});r.retarget({top:10,height:210});r.step(1/60,true);assert.equal(r.height.value,210);
});
test('restoring the borrowed tile never blanks it; copy and glass share content opacity',()=>{
 const zone={dataset:{objectFocus:'.7',focusObject:'channel',sharedTask:'',contentPresence:'.25'}};
 const object={dataset:{object:'channel'}};
 const element=caption=>({closest:s=>s==='[data-object]'?object:s==='.journey-zone'?zone:s==='.icon-caption'?caption?{}:null:null});
 assert.equal(objectContextPresence(element(false)),1);
 assert.ok(Math.abs(objectContextPresence(element(true))-.3)<1e-9);
 object.dataset.object='stats';assert.ok(Math.abs(objectContextPresence(element(false))-.615)<1e-9);
 const copy={closest:s=>s==='[data-task-content]'?{}:s==='.journey-zone'?zone:null};
 assert.equal(taskContentPresence(copy),.25);assert.equal(taskContentPresence(element(false)),1);
});
