import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JourneyFiberGlass} from '../src/journey-fiber-glass.mjs';
import {readGlassControls,BUTTON_GLASS_REFERENCE as B,PANEL_GLASS_REFERENCE as P,BUTTON_GLASS_CALIBRATION as C} from '../../service/public/max-panel-optics.js';

test('render profiles stay tied to recorded references and explicit WEB calibration',async()=>{
 const p=JSON.parse(await fs.readFile(new URL('../../DESIGN/BRANDS/MAX/glass-profiles.json',import.meta.url),'utf8'));
 for(const [actual,record] of [[P,p.panel],[B,p.controls]]){
  for(const key of ['lightAngleDegrees','refraction','depth','dispersion','frost','splay'])assert.equal(actual[key],record[key]);
  assert.equal(actual.lightIntensity*100,record.lightIntensityPercent);
 }
 const w=p.controls.webCalibration;
 assert.equal(C.frostRadius,w.frostRadiusLogicalPx);assert.equal(C.samples,w.backgroundSamples);
 for(const key of ['transmission','violetTint','lodMax'])assert.equal(C[key],w[key]);
});

function fixture(){
 let x=200;const el={getBoundingClientRect:()=>({left:x,top:120,width:108*.5,height:108*.5}),closest:()=>null};
 const doc={documentElement:{dataset:{glassRevision:'1'}},querySelector:()=>({style:{width:'1600px'},getBoundingClientRect:()=>({left:100,top:40,width:800})}),querySelectorAll:()=>[el],defaultView:{getComputedStyle:()=>({borderTopLeftRadius:'30px'})}};
 return {doc,move(){x=300;doc.documentElement.dataset.glassRevision='2';}};
}
test('fiber mask and corner use the same standalone letterbox transform as optical controls',()=>{
 const {doc}=fixture(),[c]=readGlassControls(doc);
 assert.equal(c.radius,30*4096/1600);
 assert.deepEqual(c.rect,[100,80,54,54].map(n=>n*4096/800));
});

test('flying tile owns Frost above its round landing plus; invisible controls consume no masks',()=>{
 const {doc}=fixture();
 const control=(kind,opacity=1)=>({dataset:{uiFade:String(opacity)},getBoundingClientRect:()=>({left:200,top:120,width:54,height:54}),
  closest:s=>s==='.picker'&&kind==='flight'?{}:s==='[data-flight-active]'&&kind==='flight'?{}:null,kind});
 const plus=control('plus',.1),flying=control('flight');
 doc.defaultView.getComputedStyle=el=>({borderTopLeftRadius:el.kind==='plus'?'54px':'30px'});
 doc.querySelectorAll=()=>[plus,flying];
 assert.equal(readGlassControls(doc)[0].radius,30*4096/1600);
 plus.dataset.uiFade='0';assert.equal(readGlassControls(doc).length,1);
 doc.querySelectorAll=()=>[...Array.from({length:25},()=>control('plus',0)),flying];
 assert.equal(readGlassControls(doc).length,1);
});
test('compositor reuses resources, tracks movement and resize, caps mip level, releases resources',()=>{
 const f=fixture();let size={width:1600,height:900},bufferWidth=1280;
 const pass=new JourneyFiberGlass(()=>size,f.doc),draws=[];
 const renderer={getDrawingBufferSize:v=>v.set(bufferWidth,720),setRenderTarget:t=>draws.push(t),render:(s,c)=>draws.push([s,c])};
 const target={texture:{}};pass.render(renderer,target);
 assert.equal(pass.uniforms.source.value,target.texture);assert.equal(draws[0],null);
 const rect=pass.uniforms.controls.value[0],oldX=rect.x,geometry=pass.geometry;
 f.move();pass.render(renderer,target);assert.ok(rect.x>oldX);assert.equal(pass.geometry,geometry);
 size={width:4096,height:1280};bufferWidth=8192;pass.render(renderer,target);
 assert.equal(pass.uniforms.unit.value,1);assert.equal(pass.uniforms.lod.value,5);
 let released=0;pass.geometry.addEventListener('dispose',()=>released++);pass.material.addEventListener('dispose',()=>released++);pass.dispose();assert.equal(released,2);
});
