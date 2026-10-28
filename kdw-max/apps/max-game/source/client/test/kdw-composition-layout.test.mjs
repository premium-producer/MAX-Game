import {projectBounds} from '../src/journey-scene-pose.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_LAYOUT,resolveComposition,affineRect,compositionRect,relativeCompositionRects,deviceClassScale} from '../src/kdw-composition-layout.mjs';
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
 assert.deepEqual(resolveComposition(value,'pc','any'),{device:p,reference:p,button:p,relative:{}});
});

test('composition preserves scene scale for finite tile hit areas and connector endpoints',()=>{
 const pose={x:140,y:280,w:160,h:240,scale:1.1},mapped=affineRect(pose,{x:100,y:200,width:400,height:600},{x:220,y:180,width:240,height:360});
 assert.equal(mapped.scale,.66);const child=projectBounds({x:5,y:8,w:100,h:100},mapped);assert.ok(Object.values(child).every(Number.isFinite));assert.equal(child.w,66);assert.equal(child.x,mapped.x+3.3);
});


test('device can grow independently; spacing and explicit sizes use the stable composition unit',()=>{
 const input={device:{x:800,y:200,width:400,height:800},reference:{x:1300,y:400,width:500,height:200},button:{x:1400,y:630,width:300,height:60},icons:[{x:250,y:500,width:100,height:140},{x:400,y:500,width:100,height:140}],timers:[{x:200,y:200,width:100,height:50}]};
 const original=structuredClone(input),v=relativeCompositionRects(input,{deviceScale:1.5,iconGap:10,iconsDeviceGap:20,deviceReferenceGap:15,buttonGap:5});
 assert.equal(v.device.width,600);assert.equal(cx(v.device),cx(input.device));assert.equal(v.icons[0].width,100);assert.equal(v.reference.width,500);
 assert.equal(v.device.x-v.icons[1].x-v.icons[1].width,78);assert.equal(v.icons[1].x-v.icons[0].x-v.icons[0].width,39);
 assert.equal(v.reference.x-v.device.x-v.device.width,58.5);assert.equal(v.button.y-v.reference.y-v.reference.height,19.5);assert.equal(cx(v.button),cx(v.reference));assert.equal((v.reference.y+v.button.y+v.button.height)/2,cy(v.device));
 const linked=relativeCompositionRects(input,{deviceScale:1.5,iconWidth:25,referenceWidth:80});assert.equal(linked.icons[0].width,97.5);assert.equal(linked.reference.width,312);assert.equal(linked.button.width,linked.reference.width);assert.ok(Math.abs(linked.button.height/linked.button.width-input.button.height/input.button.width)<1e-8);assert.deepEqual(input,original);
});
const cx=r=>r.x+r.width/2,cy=r=>r.y+r.height/2;
test('relative layout is resolution independent, supports centering, scopes and missing elements',()=>{
 const p=structuredClone(DEFAULT_LAYOUT);p.game.relative={iconGap:10,centerX:5};p.devices.phone={relative:{iconGap:15,deviceScale:.75}};p.screens.special={relative:{centerY:-10}};assert.deepEqual(resolveComposition(p,'phone','special').relative,{iconGap:15,centerX:5,deviceScale:.75,centerY:-10});
 const input={device:{x:300,y:100,width:200,height:400},reference:{x:600,y:200,width:300,height:100},button:{x:650,y:330,width:200,height:40},icons:[{x:100,y:250,width:80,height:110}]},rules={deviceScale:1.2,iconGap:12,iconsDeviceGap:20,deviceReferenceGap:10,buttonGap:7,iconWidth:30,referenceWidth:90,centerX:10,centerY:-5};
 const one=relativeCompositionRects(input,rules),scaled=Object.fromEntries(Object.entries(input).map(([k,r])=>[k,Array.isArray(r)?r.map(double):double(r)])),two=relativeCompositionRects(scaled,rules);for(const key of ['device','reference','button'])for(const n of ['x','y','width','height'])assert.ok(Math.abs(two[key][n]-one[key][n]*2)<1e-6);
 const centered=relativeCompositionRects({device:input.device},{centered:true,centerX:10,centerY:5},{x:900,y:500});assert.equal(cx(centered.device),919.5);assert.equal(cy(centered.device),520);assert.deepEqual(centered.icons,[]);
 assert.deepEqual(relativeCompositionRects(input),{...input,timers:[]});
});
function double(r){return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v*2]));}


test('wide device and separate device growth preserve icon size, reference size and center offset',()=>{
 const phone={x:800,y:100,width:390,height:800},pc={x:275,y:100,width:1440,height:800},icons=[{id:'open-max',x:100,y:400,width:200,height:240},{id:'task',x:400,y:400,width:200,height:240}],reference={x:1500,y:400,width:500,height:200};
 const rules={deviceScale:1.18,centerX:37.5,iconWidth:52.5,iconGap:30.5,iconsDeviceGap:32.5,referenceWidth:110};
 const a=relativeCompositionRects({device:phone,icons,reference},rules),b=relativeCompositionRects({device:pc,icons,reference},rules),larger=relativeCompositionRects({device:pc,icons,reference},{...rules,deviceScale:1.6});
 for(const v of [b,larger]){assert.equal(v.icons[0].width,a.icons[0].width);assert.equal(v.reference.width,a.reference.width);assert.equal(cx(v.device),cx(a.device));}
 const crossed=relativeCompositionRects({device:phone,icons:[{...icons[0],x:550},{...icons[1],x:250}]},rules);assert.equal(crossed.icons[0].id,'open-max');assert.ok(crossed.icons[0].x<crossed.icons[1].x);
});


test('enlarged activity device cannot increase neighbouring sizes or shift the chosen center',()=>{
 const device={x:700,y:200,width:390,height:800},icons=[{x:300,y:500,width:200,height:240}],reference={x:1200,y:400,width:500,height:180},rules={deviceScale:1.18,centerX:37.5,centerY:-10,iconWidth:52.5,referenceWidth:110};
 const a=relativeCompositionRects({device,icons,reference},rules,null,390),b=relativeCompositionRects({device:{x:661,y:120,width:468,height:960},icons,reference},rules,null,390);
 assert.equal(cx(a.device),cx(b.device));assert.equal(cy(a.device),cy(b.device));assert.equal(a.icons[0].width,b.icons[0].width);assert.equal(a.reference.width,b.reference.width);
});


test('computer and falling-card percentages are independent and ordinary phones stay at 100%',()=>{
 const rules={pcScale:.1,cardsScale:2};assert.equal(deviceClassScale(rules,'pc','business.platform.profile'),.1);assert.equal(deviceClassScale(rules,'phone','business.channel.result'),2);assert.equal(deviceClassScale(rules,'phone','business.store.start'),2);assert.equal(deviceClassScale(rules,'phone','communication.call.chat'),1);
 const input={device:{x:800,y:100,width:390,height:800},icons:[{x:300,y:400,width:200,height:240}],reference:{x:1300,y:400,width:500,height:180}},base={centerX:20,iconWidth:50,referenceWidth:120};
 for(const factor of [.1,.5,1,1.5,2]){const r=relativeCompositionRects(input,{...base,deviceScale:factor},null,390);assert.equal(r.device.width,390*factor);assert.equal(cx(r.device),cx(input.device)+78);assert.equal(r.icons[0].width,195);assert.equal(r.reference.width,468);}
});


test('buttons under a device follow its live scale and center, with or without reference',()=>{
 const device={x:800,y:200,width:390,height:800},button={x:800,y:1032,width:390,height:64},reference={x:1300,y:400,width:500,height:180};
 for(const deviceScale of [.65,1,1.4])for(const ref of [null,reference]){
  const r=relativeCompositionRects({device,reference:ref,button},{deviceScale,centerX:20},null,390,'device');
  assert.equal(cx(r.button),cx(r.device));assert.equal(r.button.width,r.device.width);
  assert.ok(Math.abs(r.button.y-r.device.y-r.device.height-32*deviceScale)<1e-8);
  if(ref)assert.equal(cy(r.reference),cy(r.device));
 }
});
