import {test} from 'node:test';
import assert from 'node:assert/strict';
import {referenceTransitionGeometry,layoutDeviceTransitions} from '../src/kdw-transition-layout.mjs';

test('reference plus button is centred for phone and landscape device, at any scale',()=>{
 for(const scale of [.5,1,1.75])for(const height of [800,420])for(const copyHeight of [180,300]){
  const device={top:140*scale,height:height*scale},reference={left:1100*scale,width:580*scale,height:copyHeight*scale},button={width:390*scale,height:64*scale},gap=24*scale;
  const p=referenceTransitionGeometry(device,reference,button,gap);
  assert.ok(Math.abs((p.referenceTop+p.buttonTop+button.height)/2-(device.top+device.height/2))<1e-8);
  assert.ok(Math.abs(p.buttonTop-p.referenceTop-reference.height-gap)<1e-8);
  assert.equal(p.buttonLeft+button.width/2,reference.left+reference.width/2);
 }
});
test('navigation stays centred under its reference when the help panel extends right',()=>{
 const p=referenceTransitionGeometry({top:100,height:800},{left:2100,width:500,height:200},{width:300,height:50},20,{left:560,right:2320});
 assert.equal(p.buttonLeft,2200);
});
test('iteration 1 restores placement without changing event ownership or transforms',()=>{
 const removed=[],node={style:{transform:'scale(.7)',removeProperty:p=>removed.push(p)},dataset:{referenceTransition:'true'}},nodes=new Set([node]);
 layoutDeviceTransitions(nodes);
 assert.deepEqual(removed,['translate']);assert.equal(node.style.transform,'scale(.7)');assert.equal(node.dataset.referenceTransition,undefined);assert.equal(nodes.size,0);
});
