import test from 'node:test';
import assert from 'node:assert/strict';
import {scenePose,projectBounds} from '../src/journey-scene-pose.mjs';
import {publishGlassFrame,readGlassControls,clearGlassFrame} from '../../service/public/max-panel-optics.js';

test('tile centre and hit target share the animated pose at arbitrary scale',()=>{
 const layout={hostX:40,hostY:80,cx:85,cy:54,size:108};
 const m={x:{value:360},y:{value:270},size:{value:129.6}};
 const pose=scenePose(layout,m,170,160),tile=projectBounds({x:31,y:0,w:108,h:108},pose);
 assert.ok(Math.abs(tile.x+tile.w/2-400)<1e-9);assert.ok(Math.abs(tile.y+tile.h/2-350)<1e-9);
 assert.ok(Math.abs(tile.w-129.6)<1e-9);
});
test('DOM replacement cannot expose a hidden plus between published frames',()=>{
 const doc={querySelector(){throw Error('unprepared DOM must not be read');}};
 const old=[{rect:[10,20,100,100],radius:25,opacity:1}];
 publishGlassFrame(doc,old);assert.equal(readGlassControls(doc),old);
 // Simulate the new DOM existing while no new visual frame has been prepared.
 doc.newUnpreparedPlus={opacity:1};assert.equal(readGlassControls(doc),old);
 const next=[{rect:[10,20,100,100],radius:25,opacity:1},{rect:[200,20,100,100],radius:50,opacity:0}];
 publishGlassFrame(doc,next);assert.equal(readGlassControls(doc)[1].opacity,0);
 clearGlassFrame(doc);assert.throws(()=>readGlassControls(doc),/unprepared DOM/);
});
test('published arena coordinates convert to viewport without reading controls',()=>{
 const doc={querySelector:()=>({style:{width:'1600'},getBoundingClientRect:()=>({left:40,top:80,width:800})}),defaultView:{innerWidth:1000}};
 publishGlassFrame(doc,[{rect:[256,512,256,256],radius:64,opacity:.5}]);
 const [c]=readGlassControls(doc,{viewport:true});
 assert.deepEqual(c.rect,[368.64,737.28,204.8,204.8]);assert.equal(c.opacity,.5);assert.equal(c.radius,51.2);
});
