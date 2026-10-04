import test from 'node:test';
import assert from 'node:assert/strict';
import {Texture,MeshBasicMaterial,Vector2} from 'three';
import {createBfmGradientMap} from '../src/journey-bfm-tile-paint.mjs';
import {createGradientController} from '../src/bfm-gradient-controller.mjs';

// Native Animation timing is supplied by the browser, not simulated here.
// Verify adapter seek/rate/pause and real Three texture matrix behaviour.
function fixture(){
 const clocks=[],seeds=[.2,.3,.8,.9];
 const controller=createGradientController({random:()=>seeds.shift(),createClock:()=>{
  const a={currentTime:0,rate:0,paused:false,cancelled:false,updatePlaybackRate(v){this.rate=v;},play(){this.paused=false;},pause(){this.paused=true;},cancel(){this.cancelled=true;}};
  clocks.push(a);return a;
 }});return {controller,clocks};
}
test('WebGL gradient clock keeps seeds, applies phase spread, rate and pause without reinitialization',()=>{
 const {controller:c,clocks}=fixture();const a=c.angle('a'),b=c.angle('b');assert.notEqual(a,b);
 assert.equal(c.angle('a'),a);assert.equal(clocks.length,2);
 clocks[0].currentTime+=90;const phase=c.angle('a');c.configure({speed:60});assert.equal(c.angle('a'),phase);
 c.configure({spread:0,phaseSpread:0,paused:true});assert.equal(c.angle('a'),c.angle('b'));assert.equal(clocks[0].rate,60/360);assert.ok(clocks.every(a=>a.paused));
 c.configure({phaseSpread:180});assert.notEqual(c.angle('a'),c.angle('b'));c.configure({paused:false});assert.ok(clocks.every(a=>!a.paused));
 c.dispose();assert.ok(clocks.every(a=>a.cancelled));
});
test('Three map rotation changes UVs while rounded alpha map remains stationary and no reupload requested',()=>{
 const gradient=new Texture(),mask=new Texture(),rotated=createBfmGradientMap(gradient);
 const material=new MeshBasicMaterial({map:rotated,alphaMap:mask,transparent:true});
 const before=rotated.version;rotated.updateMatrix();const original=rotated.matrix.clone(),clip=mask.matrix.clone();
 rotated.rotation=Math.PI/3;rotated.updateMatrix();assert.ok(!rotated.matrix.equals(original));
 assert.ok(material.alphaMap.matrix.equals(clip));assert.equal(rotated.version,before);assert.equal(rotated.source,gradient.source);
 material.dispose();rotated.dispose();gradient.dispose();mask.dispose();
});
test('rotating gradient covers all four tile corners throughout a complete revolution',()=>{
 const source=new Texture(),map=createBfmGradientMap(source);
 const old=source.clone();old.center.set(.5,.5);old.rotation=Math.PI/4;old.updateMatrix();
 assert.ok(new Vector2(0,0).applyMatrix3(old.matrix).x<0,'original mapping exceeds the texture at 45 degrees');
 for(let degrees=0;degrees<=360;degrees++){
  map.rotation=degrees*Math.PI/180;map.updateMatrix();
  for(const [x,y]of [[0,0],[0,1],[1,0],[1,1]]){
   const uv=new Vector2(x,y).applyMatrix3(map.matrix);
   assert.ok(uv.x>=-1e-12&&uv.x<=1+1e-12&&uv.y>=-1e-12&&uv.y<=1+1e-12,`outside texture at ${degrees}: ${uv.toArray()}`);
  }
 }
 map.dispose();source.dispose();old.dispose();
});
