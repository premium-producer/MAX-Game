import test from 'node:test';
import assert from 'node:assert/strict';
import {MOVEMENT_BAND,INTERACTION_BAND,pixelToHeight,journeyFieldBounds} from '../src/circle-model.mjs';
import {resistedAxis} from '../src/journey-drag.mjs';
import {anchoredTaskBounds,instructionLayout} from '../src/journey-popup.mjs';

test('movement uses 0.8–2.2m while ordinary UX retains 1–1.8m',()=>{
 for(const [band,lo,hi]of [[MOVEMENT_BAND,.8,2.2],[INTERACTION_BAND,1,1.8]]){
  assert.ok(pixelToHeight(band.top)<=hi&&pixelToHeight(band.top)>hi-.003);
  assert.ok(pixelToHeight(band.bottom)>=lo&&pixelToHeight(band.bottom)<lo+.003);
 }
 for(const w of [816,1712]){
  const b=journeyFieldBounds(w,405,true);
  assert.equal(b.y+INTERACTION_BAND.top,MOVEMENT_BAND.top+18);
  assert.equal(b.y+b.h+INTERACTION_BAND.top,MOVEMENT_BAND.bottom-18);
  assert.ok(b.y<0&&b.y+b.h>405);
 }
});
test('resistance is continuous, slows to rest and never escapes either boundary',()=>{
 const eps=1e-6,b=.14;
 for(const p of [0,.01,b,.5,1-b,.99,1]){
  assert.equal(resistedAxis(p,0),p);
  assert.ok(Math.abs(resistedAxis(p,eps)-p)<eps*1.01);
  assert.ok(Math.abs(resistedAxis(p,-eps)-p)<eps*1.01);
  for(const d of [-100,-1,-.1,.1,1,100])assert.ok(resistedAxis(p,d)>=0&&resistedAxis(p,d)<=1);
 }
 assert.ok(resistedAxis(.99,.01)-.99<resistedAxis(.8,.01)-.8);
 assert.ok(resistedAxis(0,.01)>0);assert.ok(resistedAxis(1,-.01)<1);
 const a=resistedAxis(.5,-.5),c=resistedAxis(a,.02);
 assert.ok(c>a,'re-grabbing near the boundary responds without snapping');
 assert.ok(Math.abs((resistedAxis(b,eps)-resistedAxis(b,-eps))/(2*eps)-1)<1e-4);
});
test('off-band icons keep their pose while their text and phone remain reachable',()=>{
 for(const w of [816,1712])for(const x of [76,w/2,w-76])for(const y of [-150,-10,420,600]){
  const b=anchoredTaskBounds({x,y,radius:38},w,405);
  assert.equal(b.detached,true);assert.equal(b.x+b.originX,x);assert.equal(b.y+b.originY,y);
  for(const copyHeight of [60,140,250]){
   const r=instructionLayout(b,copyHeight);
   assert.ok(b.y+r.top>=8&&b.y+r.top+r.height<=397);
   assert.equal(r.height,copyHeight+36);
  }
 }
});
