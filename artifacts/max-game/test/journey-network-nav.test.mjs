import test from 'node:test';
import assert from 'node:assert/strict';
import {networkBackTarget,networkBackLimits,constrainBackMotion} from '../src/journey-network-nav.mjs';
import {MotionValue} from '../src/journey-motion.mjs';
import {INTERACTION_BAND,pixelToHeight,zonesForLayout} from '../src/circle-model.mjs';

test('back follows independent left and top extremes of the whole network',()=>{
 const size={width:1500,height:780,w:144,h:56};
 const nodes=[{x:700,y:220},{x:420,y:380},{x:950,y:300}];
 assert.deepEqual(networkBackTarget(nodes,size,0,true),{x:258,y:146});
 nodes[2].x=240;assert.deepEqual(networkBackTarget(nodes,size,0,true),{x:78,y:146});
 nodes[0].y=180;assert.deepEqual(networkBackTarget(nodes,size,0,true),{x:78,y:106});
 assert.equal(networkBackTarget([],size),null);
});

test('full back button stays at 1–1.8m through retargets and retained velocity',()=>{
 for(const layout of ['single','two'])for(const zone of zonesForLayout(layout))for(const fps of [30,60,120]){
  // Deliberately use a larger host: the physical band must override host bounds.
  const origin=500,size={width:zone.w-48,height:680,w:110,h:44,top:INTERACTION_BAND.top-origin,bottom:INTERACTION_BAND.bottom-origin};
  const limits=networkBackLimits(size),state={x:new MotionValue(50),y:new MotionValue(20)};
  state.y.velocity=-5000;
  for(let frame=0;frame<fps*3;frame++){
   const target=networkBackTarget([{x:frame%60<30?0:1500,y:frame%60<30?-300:900}],size,frame/fps);
   state.x.step(target.x,1/fps,10);state.y.step(target.y,1/fps,10);constrainBackMotion(state,limits);
   assert.ok(pixelToHeight(origin+state.y.value)<=1.8);
   assert.ok(pixelToHeight(origin+state.y.value+size.h)>=1);
  }
 }
});

test('safety guard preserves interior position and velocity',()=>{
 const state={x:new MotionValue(100),y:new MotionValue(200)};state.x.velocity=40;state.y.velocity=-80;
 constrainBackMotion(state,networkBackLimits({width:1000,height:500,w:110,h:44}));
 assert.equal(state.x.value,100);assert.equal(state.y.value,200);assert.equal(state.x.velocity,40);assert.equal(state.y.velocity,-80);
});
test('entire floating target stays inside each reachable zone at all edges',()=>{
 for(const width of [880,1832])for(const x of [0,20,width-76])for(const y of [0,20,360])for(let t=0;t<15;t+=.3){
  const p=networkBackTarget([{x,y}],{width,height:405,w:110,h:44},t);
  assert.ok(p.x>=0&&p.y>=0&&p.x+110<=width&&p.y+44<=405);
 }
});
