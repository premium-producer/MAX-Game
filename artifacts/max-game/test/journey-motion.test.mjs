import test from 'node:test';
import assert from 'node:assert/strict';
import {MotionValue,IconMotion,MotionRegistry,PlacementFlight} from '../src/journey-motion.mjs';
import {JourneyIntroBurst} from '../src/journey-intro-burst.mjs';

test('released palm jets finish their flight while a new touch emits independent jets',()=>{
 const burst=new JourneyIntroBurst(),host={dataset:{revealPhase:'holding'},isConnected:true,clientLeft:0,clientTop:0,querySelector:selector=>selector==='[data-palm]'?{}:null};
 const rect=()=>({x:0,y:0,w:1000,h:800});
 burst.startScan(host,{x:500,y:400},160,false);burst.step(.1,rect,false);
 assert.equal(burst.slots[0].mesh.visible,true);
 host.dataset.revealPhase='palm';host.querySelector=()=>null;burst.step(.1,rect,false);
 assert.equal(burst.slots[0].mesh.visible,true);
 const oldAge=burst.slots[0].elapsed;
 burst.startScan(host,{x:520,y:390},160,false);burst.step(1/60,rect,false);
 assert.equal(burst.slots[0].mesh.visible,true);
 assert.equal(burst.slots[1].mesh.visible,true);
 assert.ok(burst.slots[0].elapsed>oldAge);
 assert.ok(burst.slots[1].elapsed<burst.slots[0].elapsed);
 for(let i=0;i<60;i++)burst.step(1/60,rect,false);
 assert.equal(burst.slots[0].mesh.visible,false);
 assert.equal(burst.slots[1].mesh.visible,false);
 burst.dispose();
});

test('caption gate stays dark during motion and fades only after connection',()=>{
 for(const hz of [30,60,120]){
  const pose={x:100,y:100,size:128,radius:30},m=new IconMotion(pose);m.label.value=0;
  for(let n=0;n<hz;n++){m.step(1/hz,{...pose,x:100+n*3,labelVisible:false});assert.equal(m.label.value,0);}
  let previous=0;for(let n=0;n<hz;n++){m.step(1/hz,{...pose,labelVisible:true});assert.ok(m.label.value>=previous);previous=m.label.value;}
  assert.ok(m.label.value>.99);
  m.step(1/hz,{...pose,labelVisible:false,reduced:true});assert.equal(m.label.value,0);
  m.step(1/hz,{...pose,labelVisible:true,reduced:true});assert.equal(m.label.value,1);
 }
 const defaultMotion=new IconMotion({x:0,y:0,size:128,radius:30});defaultMotion.step(.1,{x:0,y:0,size:128,radius:30});assert.equal(defaultMotion.label.value,1);
});

test('connections hide through drag and settling, but idle bob never disconnects them',()=>{
 const pose={x:100,y:100,size:108,radius:30},m=new IconMotion(pose);
 for(let n=0;n<120;n++){m.step(1/60,{...pose,time:n/60});assert.equal(m.connectionsMoving,false);}
 const moved={...pose,x:520,y:320};
 m.step(1/60,{...moved,dragging:true});assert.equal(m.connectionsMoving,true);
 // A held pointer stays disconnected even after the icon reaches the pointer.
 for(let n=0;n<120;n++)m.step(1/60,{...moved,dragging:true,time:n/60});
 assert.equal(m.connectionsMoving,true);
 m.step(1/60,{...moved});assert.equal(m.connectionsMoving,true);
 for(let n=0;n<180;n++)m.step(1/60,{...moved,time:n/60});
 assert.equal(m.connectionsMoving,false);
 // Keyboard/swap retargets are detected without a pointer, including cancellation back home.
 m.step(1/60,{...pose});assert.equal(m.connectionsMoving,true);
 for(let n=0;n<180;n++)m.step(1/60,{...pose,time:n/60});
 assert.equal(m.connectionsMoving,false);
});

test('placement hides connections until adoption and reduced motion reconnects immediately at rest',()=>{
 const pose={x:100,y:100,size:108,radius:30},m=new IconMotion(pose);
 m.fly({...pose,x:400},[{x:400,y:100}]);
 for(let n=0;n<90;n++)m.step(1/60,{...pose,reduced:true});
 assert.equal(m.connectionsMoving,true);
 m.adopt();m.step(1/60,{...pose,x:400,reduced:true});assert.equal(m.connectionsMoving,false);
 m.step(1/60,{...pose,dragging:true,reduced:true});assert.equal(m.connectionsMoving,true);
 m.step(1/60,{...pose,reduced:true});assert.equal(m.connectionsMoving,false);
});

test('multi-corner placement is one uninterrupted flight, frame-rate independent and pausable',()=>{
 const samples=[30,60,120].map(fps=>{
  const flight=new PlacementFlight({x:0,y:0},[{x:180,y:0},{x:180,y:180},{x:360,y:180}]);
  let minCornerSpeed=Infinity,last;
  for(let i=0;i<fps;i++){
   last=flight.step(1/fps);
   if(flight.distance.value>150&&flight.distance.value<370)minCornerSpeed=Math.min(minCornerSpeed,Math.hypot(last.vx,last.vy));
  }
  assert.ok(minCornerSpeed>250,'no stop at either bend');
  assert.deepEqual(flight.step(0),last,'pause keeps the pose');
  assert.ok(flight.settled,'whole flight finishes within a second');return last;
 });
 for(const p of samples.slice(1))for(const k of ['x','y','vx','vy'])assert.ok(Math.abs(p[k]-samples[0][k])<1e-8);
});
test('flight inherits velocity, supports reduced motion and cancellation without delayed arrival',()=>{
 const m=new IconMotion({x:0,y:0,size:88,radius:27,menu:true});m.x.velocity=70;m.y.velocity=-25;
 const goal={x:300,y:120,size:108,radius:30};m.fly(goal,[{x:100,y:0},goal]);
 m.step(0,{});assert.equal(m.x.velocity,70);assert.equal(m.y.velocity,-25);
 m.step(.01,{});const p=m.x.value;m.cancel();assert.equal(m.flight,null);assert.equal(m.arrived(),false);assert.equal(m.x.value,p);
 m.fly(goal,[{x:100,y:0},goal]);m.step(.016,{reduced:true});assert.equal(m.arrived(),true);assert.equal(m.x.value,300);assert.equal(m.y.value,120);
 const before={...m.x};m.adopt();assert.deepEqual({...m.x},before);
});

test('task holds the actual moving pose and release resumes from it without teleporting',()=>{
 const m=new IconMotion({x:100,y:160,size:108,radius:30});
 const target={x:100,y:160,size:108,radius:30,hover:true};
 for(let n=0;n<10;n++)m.step(1/60,{...target,time:n/60});
 const pose=()=>['x','y','size','radius'].map(k=>m[k].value),before=pose();
 m.hold();for(let n=0;n<90;n++)m.step(1/30,{...target,time:n/30,expanded:true});
 assert.deepEqual(pose(),before);m.release();assert.deepEqual(pose(),before);
 m.step(1/60,{...target,hover:false,time:3});
 for(let i=0;i<4;i++)assert.ok(Math.abs(pose()[i]-before[i])<.15);
});

test('critical spring has the same position and velocity at 30/60/120 Hz',()=>{
 const states=[30,60,120].map(fps=>{const m=new MotionValue(-160);m.velocity=32;for(let i=0;i<fps;i++)m.step(240,1/fps);return m;});
 for(const m of states.slice(1)){assert.ok(Math.abs(m.value-states[0].value)<1e-10);assert.ok(Math.abs(m.velocity-states[0].velocity)<1e-10);}
});
test('spring stays finite across a long delta and converges without an Euler explosion',()=>{
 const m=new MotionValue(-200);m.velocity=100;for(const dt of [.016,.033,.12,.007,20])m.step(150,dt);
 assert.equal(m.value,150);assert.ok(Math.abs(m.velocity)<1e-100);
});
test('selection preserves velocity; arrival and field adoption preserve all channels',()=>{
 const m=new IconMotion({x:80,y:100,size:14,radius:4,menu:true});
 const menu={x:240,y:200,size:88,radius:27};for(let i=0;i<20;i++)m.step(1/60,{...menu,time:i/60});
 const before=structuredClone(m);m.place({x:500,y:300,size:108,radius:30});
 for(const k of ['x','y','size','radius','energy'])assert.deepEqual({...m[k]},before[k]);
 let frames=0;while(!m.arrived()&&frames<120){m.step(1/60,{...menu,time:(20+frames)/60});frames++;}
 assert.ok(frames<100);assert.ok(m.arrived());assert.ok(m.label.value<.004);
 const landed=structuredClone(m);m.adopt();
 for(const k of ['x','y','size','radius','energy','label','badge'])assert.deepEqual({...m[k]},landed[k]);
 assert.equal(m.phase,'field');assert.equal(m.badge.value,0);
 m.step(1/60,{x:500,y:300,size:108,radius:30,time:2});
 assert.ok(Math.abs(m.x.value-landed.x.value)<.1);assert.ok(Math.abs(m.y.value-landed.y.value)<.1);
 assert.equal(m.badge.value,0);assert.ok(m.label.value<.004);
 for(let i=0;i<12;i++)m.step(1/60,{x:500,y:300,size:108,radius:30,time:2+i/60});
 assert.ok(m.badge.value>0&&m.badge.value<.4);assert.ok(m.label.value>m.badge.value&&m.label.value<.6);
});
test('landing details reveal gradually on one clock, without flashing on restore or reduced motion',()=>{
 const samples=[30,60,120].map(fps=>{
  const m=new IconMotion({x:0,y:0,size:108,radius:30,menu:true});m.adopt();
  const pose={x:0,y:0,size:108,radius:30,expanded:true};let lastLabel=0,lastBadge=0,maxJump=0;
  for(let i=0;i<fps;i++){m.step(1/fps,pose);maxJump=Math.max(maxJump,m.label.value-lastLabel,m.badge.value-lastBadge);assert.ok(m.label.value>=lastLabel&&m.badge.value>=lastBadge);lastLabel=m.label.value;lastBadge=m.badge.value;}
  assert.ok(maxJump<.125);assert.ok(m.label.value>.99&&m.badge.value>.99);return [m.label.value,m.badge.value];
 });
 for(const sample of samples.slice(1))sample.forEach((v,i)=>assert.ok(Math.abs(v-samples[0][i])<1e-12));
 const restored=new IconMotion({x:0,y:0,size:108,radius:30});restored.step(.016,{x:0,y:0,size:108,radius:30});assert.equal(restored.label.value,1);assert.equal(restored.badge.value,1);
 const reduced=new IconMotion({x:0,y:0,size:108,radius:30,menu:true});reduced.adopt();reduced.step(.016,{x:0,y:0,size:108,radius:30,reduced:true});assert.equal(reduced.label.value,1);assert.equal(reduced.badge.value,1);
});
test('retarget while moving does not reset position or velocity; cancelled placement cannot arrive',()=>{
 const m=new IconMotion({x:0,y:0,size:88,radius:27,menu:true});m.place({x:300,y:100,size:108,radius:30});
 m.step(.12,{time:.12});const p=m.x.value,v=m.x.velocity;m.cancel();assert.equal(m.x.value,p);assert.equal(m.x.velocity,v);assert.equal(m.arrived(),false);
 m.step(.016,{x:-100,y:80,size:88,radius:27,time:.136});assert.ok(Number.isFinite(m.x.value));
});
test('same semantic icon adopts its original state across DOM identity; zones and cleanup stay independent',()=>{
 const registry=new MotionRegistry(),a={},b={},initial={x:10,y:20,size:88,radius:27,menu:true};
 const first=registry.get(a,'channel',initial);first.x.velocity=99;first.place({x:80,y:90,size:108,radius:30});
 assert.equal(registry.get(a,'channel',{...initial,x:999}),first);
 assert.notEqual(registry.get(b,'channel',initial),first);
 registry.prune(new Map([[a,new Set(['channel'])]]));assert.equal(registry.zones.size,1);
 registry.prune(new Map());assert.equal(registry.zones.size,0);
 assert.notEqual(registry.get(a,'channel',initial),first);registry.clear();assert.equal(registry.zones.size,0);
});
test('reduced motion reaches placement once without oscillation and preserves the final size',()=>{
 const m=new IconMotion({x:0,y:0,size:88,radius:27,menu:true});m.place({x:350,y:240,size:108,radius:30});m.step(.016,{reduced:true});
 assert.equal(m.arrived(),true);assert.equal(m.x.value,350);assert.equal(m.y.velocity,0);assert.equal(m.size.value,108);m.adopt();assert.equal(m.arrived(),false);
});
test('drag release keeps momentum and eases to the final point without replacing the object',()=>{
 const m=new IconMotion({x:100,y:100,size:108,radius:30});m.step(.1,{x:250,y:180,size:108,radius:30,dragging:true});
 const p=m.x.value,v=m.x.velocity;assert.ok(v>0);m.step(.001,{x:250,y:180,size:108,radius:30});
 assert.ok(Math.abs(m.x.value-p)<v*.0015);assert.ok(m.x.velocity>0);
 for(let i=0;i<120;i++)m.step(1/60,{x:250,y:180,size:108,radius:30,expanded:true});
 assert.ok(Math.abs(m.x.value-250)<.01);assert.ok(Math.abs(m.size.value-108)<.01);
});

test('placement has a softer acceleration and brake at 30/60/120 Hz',()=>{
 const samples=[30,60,120].map(fps=>{
  const m=new IconMotion({x:0,y:0,size:88,radius:27,menu:true});m.place({x:300,y:150,size:108,radius:30});
  let last=0,peak=0,atHalf;
  for(let n=1;n<=fps;n++){m.step(1/fps,{});assert.ok(m.x.value>=last&&m.x.value<=300);last=m.x.value;peak=Math.max(peak,m.x.velocity);if(n===fps/2)atHalf=m.x.value;}
  assert.ok(peak<1200);assert.ok(atHalf>285&&atHalf<295);const sample=[m.x.value,m.x.velocity];m.step(.2,{});assert.ok(m.arrived());return sample;
 });
 for(const sample of samples.slice(1))sample.forEach((v,i)=>assert.ok(Math.abs(v-samples[0][i])<1e-9));
});

test('next plus travels hidden, then fades gently; repeated hiding and reduced motion stay continuous',()=>{
 const m=new IconMotion({x:0,y:0,size:86,radius:43,menu:true,next:true});m.adopt();
 const pose={x:232,y:0,size:108,radius:54,expanded:true};
 for(let n=0;n<12;n++)m.step(1/60,pose);assert.equal(m.alpha.value,0);
 let previous=0,maxJump=0;
 for(let n=0;n<100;n++){m.step(1/60,pose);maxJump=Math.max(maxJump,m.alpha.value-previous);assert.ok(m.alpha.value>=previous);previous=m.alpha.value;}
 assert.ok(maxJump<.05);assert.ok(m.alpha.value>.99);assert.ok(m.label.value>.99);
 const before={...m.alpha};m.step(.001,{...pose,present:false});assert.ok(Math.abs(m.alpha.value-before.value)<.001);
 for(let n=0;n<90;n++)m.step(1/60,{...pose,present:false});assert.ok(m.alpha.value<.001);assert.ok(m.size.value<96);
 m.step(.016,{...pose,x:450,reduced:true});assert.equal(m.x.value,450);assert.equal(m.alpha.value,1);assert.equal(m.label.value,1);assert.equal(m.size.value,108);
});
