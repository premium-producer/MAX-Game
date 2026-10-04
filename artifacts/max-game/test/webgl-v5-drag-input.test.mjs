import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {IconMotion} from '../src/journey-motion.mjs';
import {enableV5Inertia,v5IconWorldPoint} from '../src/journey-v5-inertia.mjs';

// Exercise the shipped pointer handlers, not another implementation of drag.
// DOM/capture are fixtures; browser hit-testing/GPU still need user acceptance.
const source=fs.readFileSync(new URL('../src/journey-guided-main.js',import.meta.url),'utf8');
const handlers=source.slice(source.indexOf('function cancelGesture(){'),source.indexOf('// Keyboard parity'));
function fixture(){
 const listeners={},captures=new Set(),moves=[];
 const motion=enableV5Inertia(new IconMotion({x:-670,y:-124,size:261,radius:68}));
 const goal={worldX:-200,worldY:-400};
 const el={dataset:{object:'node'},closest:s=>s==='[data-object]'?el:null,
  setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
 const context={gesture:null,bfmVisual:true,inlinePhone:true,sharedBackend:true,revealMode:true,
  camera:{value:450,velocity:12},focusTarget:500,host:{clientHeight:952},size:{width:4096},
  arena:{getBoundingClientRect:()=>({width:2048})},root:{addEventListener:(name,fn)=>listeners[name]=fn},
  controller:{session:{screen:'field'},nodes:[{step:'node'}],pose:()=>goal,cancelContact(){},move:(id,x,y)=>moves.push({id,x,y}),persistLayout(){}},
  foreground:{busy:()=>false,captureObject:()=>{const actual=motion.captureDrag();return {x:actual.x-(goal.worldX-450),y:actual.y-(476+goal.worldY)};},releaseCapturedObject:()=>motion.releaseDrag()},
  bounds(){throw Error('v5 drag must not read DOM/border bounds');},updateTargets(){},changed(){},save(){},render(){},v5IconWorldPoint};
 vm.runInNewContext(handlers,context);
 const event=(type,x=120,y=200,id=7)=>listeners[type]({button:0,pointerId:id,clientX:x,clientY:y,target:el,preventDefault(){}});
 return {motion,context,captures,moves,el,event};
}

test('actual pointer path retains grab offset at wall scale and never clamps an outside icon',()=>{
 const f=fixture();f.event('pointerdown');assert.equal(f.captures.has(7),true);
 assert.deepEqual({...f.context.gesture.start},{x:-220,y:-600});
 f.event('pointermove',122,201);assert.equal(f.moves.length,0,'below threshold is not a drag');
 f.event('pointermove',128,204,9);assert.equal(f.moves.length,0,'other contact cannot move owner');
 f.event('pointermove',128,204);assert.deepEqual(f.moves,[{id:'node',x:-204,y:-592}]);
 assert.equal(f.context.focusTarget,450);assert.equal(f.context.camera.velocity,0);
 f.event('pointerup',128,204);assert.equal(f.context.gesture,null);assert.equal(f.motion.dragAnchor,null);
 assert.equal(f.captures.size,0);assert.equal(f.el.dataset.suppressClick,'true');
});

test('cancel/lost capture release stationary grab without moving or suppressing its click',()=>{
 for(const reason of ['pointercancel','lostpointercapture']){
  const f=fixture();f.event('pointerdown');assert.ok(f.motion.dragAnchor);
  f.event(reason);assert.equal(f.context.gesture,null);assert.equal(f.motion.dragAnchor,null);
  assert.equal(f.moves.length,0);assert.equal(f.captures.size,0);assert.equal(f.el.dataset.suppressClick,undefined);
 }
});

test('v5 wall/LiDAR viewport changes keep logical geometry and never reset the game/camera',()=>{
 const calls=[],params=new URLSearchParams('layout=wall');
 const context={params,bfmVisual:true,referenceVisual:false,service:false,size:null,arena:{style:{}},innerWidth:1600,innerHeight:900,
  cancelGesture:()=>calls.push('cancel'),v5Tools:{fit:()=>calls.push('viewport')},field:{resize:()=>calls.push('resize')},changed:()=>calls.push('changed'),
  host:{style:{}},controller:{configure(){throw Error('Viewport switch must not reconfigure game');}},focusCurrent(){throw Error('Viewport switch must not recenter camera');},render(){throw Error('Viewport switch must not rebuild UI');}};
 vm.runInNewContext(source.slice(source.indexOf('function sceneSize(){'),source.indexOf("window.addEventListener('resize',fit);")),context);
 for(const layout of ['wall','lidar','wall']){
  params.set('layout',layout);context.fit({viewportOnly:true});
  assert.deepEqual({...context.size},{width:4096,height:1280});
 }
 assert.deepEqual(calls,['cancel','viewport','resize','changed','cancel','viewport','resize','changed','cancel','viewport','resize','changed']);
});
