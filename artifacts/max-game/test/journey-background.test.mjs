import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {maxFieldBackground,maxFieldTransition,MAX_WALL_COLORS} from '../../service/public/max-wall-atmosphere.js';
// Match the production bundler's explicit nodePaths for shared Ribbon modules.
const threeURL=import.meta.resolve('three');
const dependencies=registerHooks({resolve(specifier,context,next){return specifier==='three'?{url:threeURL,shortCircuit:true}:next(specifier,context);}});
const {JourneyBackgroundField}=await import('../src/journey-background-field.mjs');
dependencies.deregister();

test('MAX palette adaptation preserves global settings and both transition endpoints',()=>{
 const from=Object.freeze({blue:'#0077FF',deepBlue:'#0040FF',purple:'#471AFF',violet:'#9500FF',transitionX:.4,transitionWidth:2,purpleAmount:.8});
 const input=Object.freeze({from,to:from,epoch:123}),adapted=maxFieldTransition(input);
 assert.notEqual(adapted.from,from);assert.equal(adapted.epoch,123);
 for(const side of [adapted.from,adapted.to,maxFieldBackground(from)]){
  for(const key of ['blue','deepBlue','purple','violet'])assert.ok(MAX_WALL_COLORS.includes(side[key]));
  assert.equal(side.transitionX,.4);assert.equal(side.transitionWidth,2);assert.equal(side.purpleAmount,.8);
 }
 assert.equal(from.blue,'#0077FF');assert.equal(maxFieldTransition(undefined),undefined);
});

test('portable fluid is bounded after a long frame, pauses and releases GPU resources',()=>{
 const field=new JourneyBackgroundField();
 assert.ok(field.bytes.some(v=>v>0));
 field.update(10,0,1600,900);assert.ok(field.fluid.time<=2/30+1e-9);
 const time=field.fluid.time,bytes=field.bytes.slice();
 field.update(0,0,1600,900);assert.equal(field.fluid.time,time);assert.deepEqual(field.bytes,bytes);
 let textures=0,geometries=0,materials=0;
 field.texture.addEventListener('dispose',()=>textures++);
 field.pixels.mesh.geometry.addEventListener('dispose',()=>geometries++);
 field.pixels.mesh.material.addEventListener('dispose',()=>materials++);
 field.dispose();assert.deepEqual([textures,geometries,materials],[1,1,1]);
});

test('bullets stay square on wide and tall standalone viewports',()=>{
 const field=new JourneyBackgroundField();
 for(const [w,h] of [[4096,1280],[985,591],[600,1000]]){
  field.update(0,3,w,h);
  const rect=field.pixels.rect;
  for(let i=0;i<field.pixels.mesh.geometry.instanceCount;i++)assert.ok(Math.abs(rect.getZ(i)-rect.getW(i))<.001);
 }
 field.dispose();
});
