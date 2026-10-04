import test from 'node:test';
import assert from 'node:assert/strict';
import {JourneyIntent} from '../src/journey-intent.mjs';
import {JourneyTransition} from '../src/journey-transition.mjs';
import {TaskContentTransition} from '../src/journey-popup-motion.mjs';
import {suspendSignalLink,stepSignalLinkPresence} from '../src/journey-links.mjs';

test('latest navigation wins; a contextual click cannot overwrite it or leak into a new task',()=>{
 const q=new JourneyIntent(),a={},b={};
 q.offer({type:'ANSWER',choice:1},a);
 assert.equal(q.take(b),null);
 q.offer({type:'MISSION',id:'blogger'},a);q.offer({type:'MENU'},a);
 assert.equal(q.offer({type:'ANSWER',choice:0},a),'superseded');
 assert.deepEqual(q.take(b),{type:'MENU'});assert.equal(q.take(b),null);
 q.offer({type:'OPEN',step:'channel'},a);q.clear();assert.equal(q.take(a),null);
});
test('an answer pressed during entry waits; repeated accepted answers never answer the next stage',()=>{
 const q=new JourneyIntent(),state={};
 assert.equal(q.offer({type:'ANSWER',choice:1},state),'queued');
 assert.deepEqual(q.take(state),{type:'ANSWER',choice:1});
 assert.equal(q.offer({type:'ANSWER',choice:1},state,{contentBusy:true}),'acknowledged');
 assert.equal(q.take({}),null);
});
test('close during entry preserves value/velocity, cancels obsolete callback and commits once at zero at 30/60/120 Hz',()=>{
 for(const hz of [30,60,120]){
  const m=new JourneyTransition();let opened=0,closed=0,stale=0;
  m.start(()=>opened++,{enterOnly:true});for(let i=0;i<hz/10;i++)m.tick(1/hz);
  const value=m.value,velocity=m.velocity;
  m.start(()=>stale++,{exitOnly:true,interrupt:true});
  assert.equal(m.value,value);assert.equal(m.velocity,velocity);
  m.start(()=>{assert.equal(m.value,0);closed++;},{exitOnly:true,interrupt:true});
  for(let i=0;i<hz;i++){m.tick(1/hz);assert.ok(m.value>=0&&m.value<=1);}
  assert.equal(opened,1);assert.equal(closed,1);assert.equal(stale,0);assert.equal(m.busy,false);
 }
});
test('close during answer transition cannot revive the answer; reduced interruption is immediate',()=>{
 const shell=new JourneyTransition(),copy=new TaskContentTransition();let answer=0,close=0;
 copy.start(()=>answer++);copy.tick(.04);const visible=copy.value;copy.cancel();
 shell.start(()=>close++,{exitOnly:true});
 for(let i=0;i<40;i++){copy.tick(1/60);shell.tick(1/60);}
 assert.ok(visible>0);assert.equal(answer,0);assert.equal(close,1);
 shell.start(()=>answer++);shell.start(()=>close++,{interrupt:true,reduced:true});
 shell.tick(1);assert.equal(answer,0);assert.equal(close,2);
});
test('short drag must finish hiding old geometry before rebinding; repeated grab hides again',()=>{
 for(const hz of [30,60,120]){
  const e={opacity:1,group:{visible:true}};
  suspendSignalLink(e,true);assert.equal(stepSignalLinkPresence(e,1/hz),false);
  suspendSignalLink(e,false);let reset=false;
  for(let i=0;i<hz;i++){
   const ready=stepSignalLinkPresence(e,1/hz);
   if(ready&&!reset){assert.equal(e.opacity,0);reset=true;}
  }
  assert.ok(reset);assert.ok(e.opacity>.98);
  suspendSignalLink(e,true);assert.equal(stepSignalLinkPresence(e,1/hz),false);
  assert.equal(stepSignalLinkPresence(e,0,true),false);assert.equal(e.opacity,0);
 }
});
