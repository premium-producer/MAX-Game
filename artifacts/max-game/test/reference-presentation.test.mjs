import test from 'node:test';
import assert from 'node:assert/strict';
import {ReferenceRevealJourney} from '../src/journey-reference-presentation.mjs';
import {SharedRevealJourney,sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {referenceIcons} from '../src/journey-reference-icons.mjs';
import {referenceDrift,separateReferenceObjects,rectanglesOverlap} from '../src/journey-reference-motion.mjs';

test('scan owner never repels itself during hold and icon births, regardless of scene order',()=>{
 for(const hz of [30,60,120]){
  const palm={id:'palm',fixed:true,x:150,y:200,w:830,h:320};
  let palmOffset={x:0,y:0};
  for(let i=0;i<hz*3;i++){
   const moving={id:'max',x:500,y:250-i*200/hz,w:120,h:120};
   // Same renderer order: newly appearing icon before retained palm owner.
   const boxes=i<hz*.8?[palm]:[moving,palm];
   const offsets=separateReferenceObjects(boxes);
   palmOffset=offsets.get('palm');assert.deepEqual(palmOffset,{x:0,y:0});
   if(boxes.length>1){const shift=offsets.get('max');assert.ok(!rectanglesOverlap({...moving,x:moving.x+shift.x,y:moving.y+shift.y},palm,17.99));}
  }
 }
});

test('reference drift has no stationary intervals at 30/60/120 Hz; reduced motion is still',()=>{
 for(const hz of [30,60,120])for(let i=0;i<hz*8;i++){
  const a=referenceDrift(i/hz,1.4),b=referenceDrift((i+1)/hz,1.4);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>.02);
 }
 assert.deepEqual(referenceDrift(5,2,true),{x:0,y:0});
});

test('reference frame protection separates captions, tiles and moving phone at 30/60/120 Hz',()=>{
 for(const hz of [30,60,120])for(let i=0;i<hz*5;i++){
  const t=i/hz,phone={x:Math.sin(t)*300,y:-250,w:520,h:500};
  // Include coincident births and a drag straight through the phone.
  const boxes=Array.from({length:6},(_,id)=>({id,x:Math.sin(t+id*.6)*400,y:Math.cos(t+id*.5)*220,w:220,h:245}));
  const offsets=separateReferenceObjects(boxes,[phone]);
  const placed=boxes.map(b=>({...b,x:b.x+offsets.get(b.id).x,y:b.y+offsets.get(b.id).y}));
  for(let a=0;a<placed.length;a++){
   assert.ok(!rectanglesOverlap(placed[a],phone,17.99));
   for(let b=a+1;b<placed.length;b++)assert.ok(!rectanglesOverlap(placed[a],placed[b],17.99));
  }
 }
});

test('reference reveal progresses without waiting for decorative rest; readiness still gates task',()=>{
 const c=new ReferenceRevealJourney(sharedRevealContent(MISSION_CATALOG),{});
 c.session.mission='digital-id';c.scanned['digital-id']=true;c.configure(1543,804,120);c._activeId=c.steps[0].id;
 c.snapshot={state:{status:'task'}};c.change('burst');
 for(let i=0;i<65;i++)c.tick(.1,{settled:false});
 assert.equal(c.phase,'phone-enter');
 c.tick(.1,{settled:true,dragging:true});assert.equal(c.phase,'phone-enter');
 c.tick(.1,{settled:true});assert.equal(c.phase,'task');
 c.change('trace');assert.equal(c.phoneVisible,true);
 c.tick(.1,{active:false});assert.equal(c.elapsed,0);
});

test('third presentation keeps backend command methods and isolates its geometry',()=>{
 const content=sharedRevealContent(MISSION_CATALOG);
 for(const mission of content.missions){
  const c=new ReferenceRevealJourney(content,{}),old=new SharedRevealJourney(content,{});
  for(const v of [c,old]){v.session.mission=mission.id;v.scanned[mission.id]=true;v.configure(1543,897,120);v._activeId=mission.steps[0].id;}
  assert.equal(c.nodes.length,old.nodes.length);
  assert.equal(c.nodes[1].worldX-c.nodes[0].worldX,260);
  assert.notEqual(old.nodes[1].worldX-old.nodes[0].worldX,260);
  assert.equal(c.answer,old.answer);assert.equal(c.restart,old.restart);assert.equal(c.down,old.down);
  const p=c.phoneLayout,m=c.phoneMetrics;
  assert.equal(p.phone.x-m.width/2-(c.current.worldX+60),140);
  assert.equal(m.height,500);
  c._displayView={device:{kind:'pc'}};
  assert.equal(c.phoneMetrics.width,520);
  assert.ok(c.phoneMetrics.height<897);
 }
 for(const key of ['open-max','id','hotel','benefit','age'])assert.match(referenceIcons[key],/<path /);
});
