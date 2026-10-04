import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {IconMotion,MotionRegistry,ROUTE_INTRO} from '../src/journey-motion.mjs';
import {JourneyIntroBurst} from '../src/journey-intro-burst.mjs';

const initial={x:800,y:410,size:104,radius:52},target={x:684,y:390,size:108,radius:54};
test('MAX fully emerges, holds its tapped centre for half a second, then flies with frame-rate independent velocity',()=>{
 const samples=[30,60,120].map(fps=>{
  const m=new IconMotion(initial);m.presentStart();let holdFrames=0;
  for(let n=1;n<=fps;n++){
   m.step(1/fps,{...target,hover:true,time:n/fps});
   if(n/fps<=ROUTE_INTRO.reveal+ROUTE_INTRO.hold){assert.equal(m.x.value,800);assert.equal(m.y.value,410);assert.equal(m.x.velocity,0);}
   if(n/fps>=ROUTE_INTRO.reveal&&n/fps<=ROUTE_INTRO.reveal+ROUTE_INTRO.hold){assert.equal(m.logo,1);holdFrames++;}
  }
  assert.ok(holdFrames>=fps*.5-1);assert.ok(m.x.value<800&&m.x.value>684);assert.ok(m.x.velocity<0);
  return [m.x.value,m.x.velocity,m.y.value,m.label.value];
 });
 for(const sample of samples.slice(1))sample.forEach((v,i)=>assert.ok(Math.abs(v-samples[0][i])<1e-9));
});
test('hold/flight boundary has no jump; goal changes preserve momentum and landing releases presentation',()=>{
 const m=new IconMotion(initial);m.presentStart();m.step(.74,target);
 assert.equal(m.x.value,800);m.step(.0001,target);assert.ok(Math.abs(m.x.value-800)<.001);
 m.step(.08,target);const x=m.x.value,v=m.x.velocity;m.step(.0001,{...target,x:620});
 assert.ok(Math.abs(m.x.value-x-v*.0001)<.001);assert.ok(m.x.velocity<0);
 for(let n=0;n<180;n++)m.step(1/60,{...target,expanded:true});
 assert.equal(m.intro,null);assert.equal(m.phase,'field');assert.ok(m.x.at(target.x));assert.equal(m.logo,1);
});
test('zero delta pauses introduction; reduced motion skips hold, flight and burst; restored icons do not replay',()=>{
 const m=new IconMotion(initial);m.presentStart();m.step(.1,target);const before=structuredClone(m);
 m.step(0,target);assert.deepEqual(structuredClone(m),before);
 m.step(.016,{...target,reduced:true});assert.equal(m.intro,null);assert.equal(m.x.value,target.x);assert.equal(m.logo,1);assert.equal(m.label.value,1);
 const restored=new IconMotion(target);assert.equal(restored.intro,null);assert.equal(restored.logo,1);
 const burst=new JourneyIntroBurst();burst.start({},initial,104,true);assert.ok(burst.slots.every(s=>!s.host));burst.dispose();
});
test('semantic handoff retains introduction; independent zones and cancellation discard only transient state',()=>{
 const registry=new MotionRegistry(),a={},b={},m=registry.get(a,'open-max',initial);m.presentStart();m.step(.12,target);
 const same=registry.get(a,'open-max',target);assert.equal(same,m);assert.equal(same.intro.elapsed,.12);
 assert.equal(registry.get(b,'open-max',target).intro,null);
 registry.clear();assert.equal(registry.get(a,'open-max',target).intro,null);
});
test('radial burst is bounded, follows its host, survives UI rebuild and releases all GPU allocations',async()=>{
 const burst=new JourneyIntroBurst(),camera=new THREE.Camera();let compiled=0;
 await burst.prepareGPU({compileAsync:async scene=>{compiled++;assert.equal(scene.children.length,burst.slots.length);}},camera);assert.equal(compiled,1);
 const host=()=>({isConnected:true,clientLeft:1,clientTop:1,dataset:{},querySelector:()=>true});
 const a=host(),b=host(),scene=new THREE.Scene(),rect=()=>({x:100,y:50,w:600,h:700});
 burst.start(a,{x:200,y:150},104,false);burst.start(b,{x:100,y:100},84,false);burst.attach(scene);burst.step(.1,rect,false);
 assert.ok(burst.slots.slice(0,2).every(s=>s.mesh.visible));assert.equal(burst.slots[0].mesh.position.x,301);
 scene.clear();burst.attach(scene);assert.equal(scene.children.length,burst.slots.length);
 const elapsed=burst.slots[0].elapsed;burst.step(0,rect,false);assert.equal(burst.slots[0].elapsed,elapsed);
 a.isConnected=false;burst.step(.1,rect,false);assert.equal(burst.slots[0].host,null);assert.equal(burst.slots[1].host,b);
 burst.step(1,rect,false);assert.ok(burst.slots.every(s=>!s.host&&!s.mesh.visible));
 burst.start(b,initial,104,false);burst.clear();assert.ok(burst.slots.every(s=>!s.host));
 let geometries=0,materials=0;burst.geometry.addEventListener('dispose',()=>geometries++);for(const s of burst.slots)s.mesh.material.addEventListener('dispose',()=>materials++);
 burst.dispose();assert.equal(scene.children.length,0);assert.equal(geometries,1);assert.equal(materials,burst.slots.length);
});
