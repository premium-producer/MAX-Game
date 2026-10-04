import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import { MissionMenuReveal } from '../src/mission-menu-reveal.mjs';
import { applyMissionSurfaceReveal } from '../src/webgl-field.js';

test('bases wait for card entry and removal of all outgoing objects; waves wait for bases', () => {
  const reveal = new MissionMenuReveal();
  reveal.begin(450,450);
  reveal.update(5000,true); assert.equal(reveal.bases,0);
  reveal.cardsStarted=true;
  reveal.update(5000,false); assert.equal(reveal.bases,0);
  reveal.update(225,true); assert.equal(reveal.bases,.5); assert.equal(reveal.waves,0);
  reveal.update(225,true); assert.equal(reveal.bases,1); assert.equal(reveal.waves,0);
  reveal.update(225,true); assert.equal(reveal.waves,.5);
  reveal.update(225,true); assert.equal(reveal.waves,1); assert.equal(reveal.phase,'done');
});

test('interruption resets the sequence and reduced motion still respects outgoing cleanup', () => {
  const reveal=new MissionMenuReveal();
  reveal.begin(450,450);reveal.cardsStarted=true;reveal.update(100,true);
  reveal.cancel();reveal.begin(450,450);reveal.update(5000,true);
  assert.equal(reveal.bases,0);assert.equal(reveal.cardsStarted,false);
  reveal.cardsStarted=true;reveal.update(16,false,true);assert.equal(reveal.bases,0);
  reveal.update(16,true,true);assert.equal(reveal.bases,1);assert.equal(reveal.waves,1);
});

test('base and wave opacity are independent and preserve status materials', () => {
  const mat=()=>({opacity:1,userData:{baseOpacity:.8}});
  const group={userData:{statusVisibility:.8,statusMaterials:[mat()],beaconMaterial:mat(),broadcastMaterial:{uniforms:{uPresence:{value:1}}}}};
  applyMissionSurfaceReveal(group,0,0);assert.equal(group.visible,false);
  applyMissionSurfaceReveal(group,.5,0);assert.equal(group.visible,true);
  assert.ok(Math.abs(group.userData.statusMaterials[0].opacity-.32)<1e-9);
  assert.equal(group.userData.broadcastMaterial.uniforms.uPresence.value,0);
  applyMissionSurfaceReveal(group,1,.5);assert.equal(group.userData.broadcastMaterial.uniforms.uPresence.value,.5);
});

test('a cancelled old screen animation cannot release a new menu reveal', async () => {
  const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const block=source.slice(source.indexOf('function completeScreenTransition('),source.indexOf('function scheduleTypographyLayoutPass('));
  let finish,ready=0;
  const context=vm.createContext({missionMenuRevealToken:1,state:{screen:'MISSION_SELECT'},STATES:{MISSION_SELECT:'MISSION_SELECT'},
    webglField:{missionMenuCardsStarted(){ready++;}},renderedScreen:null,scheduleTypographyLayoutPass(){},prefersReducedMotion:()=>false,
    missionLayer:{},activeScreenTransition:null,screenEnterTargets:()=>[],motionOptions:()=>({}),
    animateElement:()=>({finished:new Promise(resolve=>{finish=resolve;})}),
  });
  context.outgoingGhost={remove(){}};
  vm.runInContext(block,context);vm.runInContext('completeScreenTransition(outgoingGhost,true,false)',context);
  context.missionMenuRevealToken=2;
  const next={ghost:null,animations:[]};context.activeScreenTransition=next;
  finish();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ready,1);assert.equal(context.activeScreenTransition,next);
  vm.runInContext('completeScreenTransition(null,true,true)',context);assert.equal(ready,2);
});

test('card entry ends at its CSS status opacity without freezing later status changes', async () => {
  const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const block=source.slice(source.indexOf('function completeScreenTransition('),source.indexOf('function scheduleTypographyLayoutPass('));
  const targets=['open','locked','completed','unlocking'].map(status=>({
    status, style:{},
    matches(selector){return selector==='.mission-marker' || (selector.includes('--locked') && ['locked','completed'].includes(status));},
  }));
  const calls=[], finishes=[];
  let ready=0, writesStarted=false;
  const resting={locked:'.8',completed:'.65'}; // Read CSS rather than duplicating a hard-coded .8.
  const context=vm.createContext({missionMenuRevealToken:1,state:{screen:'MISSION_SELECT'},STATES:{MISSION_SELECT:'MISSION_SELECT'},
    webglField:{missionMenuCardsStarted(){ready++;}},renderedScreen:null,scheduleTypographyLayoutPass(){},prefersReducedMotion:()=>false,
    missionLayer:{},activeScreenTransition:null,screenEnterTargets:()=>targets,shellConfig:{motion:{contentStaggerMs:20}},
    getComputedStyle(target){assert.equal(writesStarted,false); assert.ok(target.status in resting); return {opacity:resting[target.status]};},
    motionOptions:(durationKey,options)=>({durationKey,...options}),
    animateElement(target,keyframes,options){writesStarted=true;calls.push({target,keyframes,options});return {finished:new Promise(resolve=>finishes.push(resolve))};},
  });
  vm.runInContext(block,context);vm.runInContext('completeScreenTransition(null,true,false)',context);
  assert.equal(ready,1);
  assert.equal(calls.length,targets.length);
  assert.ok(calls.every(call=>targets.includes(call.target))); // No layer transform/opacity over the projected stems.
  for (const call of calls) {
    assert.equal(call.options.durationKey,'screenDurationMs');
    assert.equal(call.options.delay,calls.indexOf(call)*20);
    assert.equal(Number(call.keyframes.at(-1).opacity),Number(resting[call.target.status]??1));
    assert.equal(call.options.fill,'backwards');
    assert.deepEqual(call.target.style,{});
  }
  finishes.slice(0,-1).forEach(finish=>finish());
  await new Promise(resolve=>setImmediate(resolve));assert.equal(ready,1);
  finishes.at(-1)();await new Promise(resolve=>setImmediate(resolve));assert.equal(ready,1);
  for (const target of targets) assert.deepEqual(target.style,{});
});


test('bases start after a short lead, overlap the long card fade and retain their full fade duration', () => {
  const reveal=new MissionMenuReveal();
  reveal.begin(450,450,220);reveal.cardsStarted=true;
  reveal.update(200,true);assert.equal(reveal.bases,0);
  reveal.update(25,true);assert.ok(reveal.bases>0 && reveal.bases<.02);
  reveal.update(200,true);assert.equal(reveal.bases,.5);assert.equal(reveal.waves,0);
  reveal.update(225,true);assert.equal(reveal.bases,1);assert.equal(reveal.waves,0);
  // At 650 ms the bases are complete; the original 840 ms card fade is still running.
  reveal.begin(450,450,220);reveal.cardsStarted=true;
  reveal.update(1000,false);assert.equal(reveal.bases,0);
  reveal.update(16,true);assert.ok(reveal.bases>0 && reveal.bases<.01);
});


test('outgoing menu ghost cannot keep a stem after its WebGL base is removed', async () => {
  const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const block=source.slice(source.indexOf('function captureOutgoingScreen('),source.indexOf('function completeScreenTransition('));
  const stems=[{removed:false,remove(){this.removed=true;}},{removed:false,remove(){this.removed=true;}}];
  const ghost={removeAttribute(){},setAttribute(){},classList:{add(){}},querySelectorAll(selector){return selector==='.mission-marker-stem'?stems:[];}};
  let appended;
  const context=vm.createContext({missionLayer:{firstElementChild:{},cloneNode(){return ghost;}},prefersReducedMotion:()=>false,cancelActiveScreenTransition(){},stage:{append(value){appended=value;}}});
  vm.runInContext(block,context);vm.runInContext('captureOutgoingScreen()',context);
  assert.equal(appended,ghost);assert.ok(stems.every(stem=>stem.removed));
});
