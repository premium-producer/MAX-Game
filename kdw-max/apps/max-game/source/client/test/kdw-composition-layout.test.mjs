import {projectBounds} from '../src/journey-scene-pose.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_LAYOUT,resolveComposition,affineRect,compositionRect} from '../src/kdw-composition-layout.mjs';
test('composition hierarchy: original, shared, device type, screen, missing group inherits',()=>{const p=structuredClone(DEFAULT_LAYOUT);p.game.device.x=50;p.devices.phone={device:{x:100,y:30,scale:.8}};p.screens['digital-id.start']={reference:{x:0,y:-20,scale:1.1}};const result=resolveComposition(p,'phone','digital-id.start');assert.equal(result.device.x,100);assert.equal(result.reference.y,30);assert.deepEqual(result.button,result.device);assert.deepEqual(result.reference,result.device);assert.equal(resolveComposition(p,'pc','other').device.x,50);assert.equal(DEFAULT_LAYOUT.game.device.x,0);});
test('GPU affine mapping follows the same DOM rectangle including descendant hit zones',()=>{const before={x:100,y:200,width:400,height:600},after={x:220,y:180,width:200,height:300};assert.deepEqual(affineRect({x:140,y:280,w:160,h:60},before,after),{x:240,y:220,w:80,h:30});});

test('device pose scales every member and inter-member gaps around one anchor; legacy separate poses are ignored',()=>{
 const device={x:1000,y:300,width:800,height:600},anchor={x:1400,y:600},p={x:80,y:-60,scale:.6};
 const ref={x:1860,y:450,width:500,height:200},button={x:1930,y:674,width:360,height:64},icon={x:700,y:520,width:200,height:260};
 const [d,r,b,i]=[device,ref,button,icon].map(v=>compositionRect(v,p,anchor));
 assert.equal(d.x+d.width/2,1480);assert.equal(d.y+d.height/2,540);
 for(const [v,old]of [[r,ref],[b,button],[i,icon]]){assert.ok(Math.abs(v.width-old.width*.6)<1e-6);assert.ok(Math.abs(v.x-(1480+(old.x-1400)*.6))<1e-6);}
 assert.ok(Math.abs((b.y-r.y-r.height)-24*.6)<1e-6);assert.ok(Math.abs((r.x-d.x-d.width)-60*.6)<1e-6);
 const value=structuredClone(DEFAULT_LAYOUT);value.game.device=p;value.game.reference={x:900,y:500,scale:2};value.devices.pc={button:{x:10,y:900,scale:.4}};
 assert.deepEqual(resolveComposition(value,'pc','any'),{device:p,reference:p,button:p});
});

test('composition preserves scene scale for finite tile hit areas and connector endpoints',()=>{
 const pose={x:140,y:280,w:160,h:240,scale:1.1},mapped=affineRect(pose,{x:100,y:200,width:400,height:600},{x:220,y:180,width:240,height:360});
 assert.equal(mapped.scale,.66);const child=projectBounds({x:5,y:8,w:100,h:100},mapped);assert.ok(Object.values(child).every(Number.isFinite));assert.equal(child.w,66);assert.equal(child.x,mapped.x+3.3);
});
