import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {JourneyContextGlass} from '../src/journey-context-glass.mjs';
import {objectContextPresence,glassControlPresence,glassLayerPriority} from '../../service/public/max-panel-optics.js';

test('completion backdrop and its controls reveal together independently of closed task presence',()=>{
 const zone={dataset:{uiPresence:'.8',popupPresence:'0'}},popup={dataset:{popupReveal:'.5'}};
 const el={closest:s=>s==='.journey-zone'?zone:s==='.field-success'?popup:null};
 const doc={defaultView:{getComputedStyle:()=>({opacity:1})}};
 assert.equal(glassControlPresence(el,doc),.4);
 popup.dataset.popupReveal='1';assert.equal(glassControlPresence(el,doc),.8);
 popup.dataset.popupReveal='0';assert.equal(glassControlPresence(el,doc),0);
});

test('popup controls and surface have stable precedence over the underlying icon glass',()=>{
 const closest=s=>s==='.context-popup,.field-success'?{}:null;
 const object={closest:()=>null},popup={closest,matches:()=>false},button={closest,matches:()=>true};
 assert.ok(glassLayerPriority(button)>glassLayerPriority(popup));
 assert.ok(glassLayerPriority(popup)>glassLayerPriority(object));
 const ordered=[object,popup,button].sort((a,b)=>glassLayerPriority(b)-glassLayerPriority(a));
 assert.deepEqual(ordered,[button,popup,object]);
});

test('completion dims world icons and hides whole captions of covered objects',()=>{
 const popup={dataset:{popupReveal:'1'}},zone={dataset:{},querySelector:()=>popup},object={dataset:{completionCovered:'true'}};
 const el=caption=>({closest:s=>s==='[data-object]'?object:s==='.journey-zone'?zone:s==='.icon-caption'&&caption?{}:null});
 assert.equal(objectContextPresence(el(true)),0);
 assert.ok(Math.abs(objectContextPresence(el(false))-.45)<1e-9);
 object.dataset.completionCovered='false';assert.ok(Math.abs(objectContextPresence(el(true))-.45)<1e-9);
 popup.dataset.popupReveal='0';assert.equal(objectContextPresence(el(true)),1);
});

test('context focus retains borrowed glyph and optics during restoration; other nodes dim, popup stays sharp',()=>{
 const zone={dataset:{objectFocus:'1',focusObject:'hotel'}};
 const el=id=>({closest:s=>s==='.journey-zone'?zone:s==='[data-object]'?{dataset:{object:id}}:null});
 const doc={defaultView:{getComputedStyle:()=>({opacity:1})}};
 assert.equal(objectContextPresence(el('hotel')),1);
 assert.equal(glassControlPresence(el('hotel'),doc),1);
 assert.ok(Math.abs(objectContextPresence(el('id'))-.45)<1e-9);
 assert.equal(objectContextPresence({closest:()=>null}),1);
 zone.dataset.objectFocus='.5';assert.equal(objectContextPresence(el('hotel')),1);
 zone.dataset.objectFocus='0';assert.equal(objectContextPresence(el('hotel')),1);
});

test('UI backdrop target is lazy, reused, resized and disposed; render state is restored',()=>{
 const pass=new JourneyContextGlass(),scene=new THREE.Scene(),camera=new THREE.Camera();
 let w=1280,h=720,target=null;const calls=[];
 const renderer={autoClear:false,getDrawingBufferSize:v=>v.set(w,h),getRenderTarget:()=>target,
  setRenderTarget:v=>{target=v;},getClearColor:c=>c.set('#0D001A'),getClearAlpha:()=>0,
  setClearColor(){},clear(){},clearDepth(){},render:(s,c)=>calls.push([s,c.layers.mask,target])};
 pass.render(renderer,scene,camera,[],{width:1600,height:900});assert.equal(pass.target,null);
 const panes=[{x:200,y:100,w:320,h:300,radius:24,opacity:1}];
 const mask=camera.layers.mask;
 pass.render(renderer,scene,camera,panes,{width:1600,height:900});
 const first=pass.target;assert.equal(calls.at(-4)[1],1);assert.equal(calls.at(-2)[1],2);assert.equal(calls.at(-1)[1],4);
 assert.equal(target,null);assert.equal(camera.layers.mask,mask);assert.equal(renderer.autoClear,false);
 pass.render(renderer,scene,camera,panes,{width:1600,height:900});assert.equal(pass.target,first);
 w=960;h=300;pass.render(renderer,scene,camera,panes,{width:4096,height:1280});assert.equal(first.width,960);assert.equal(first.height,300);
 let released=0;first.addEventListener('dispose',()=>released++);pass.dispose();assert.equal(released,1);
});

test('shared task tile stays visible; only its caption follows popup presence',()=>{
 const zone={dataset:{objectFocus:'.5',focusObject:'hotel',sharedTask:'hotel'}};
 const el=caption=>({closest:s=>s==='.journey-zone'?zone:s==='[data-object]'?{dataset:{object:'hotel'}}:s==='.icon-caption'&&caption?{}:null});
 for(const p of ['0','.2','.8','1']){zone.dataset.objectFocus=p;assert.equal(objectContextPresence(el(false)),1);}
 assert.equal(objectContextPresence(el(true)),0);
 zone.dataset.objectFocus='0';assert.equal(objectContextPresence(el(true)),1);
});

test('context resources can be allocated and compiled during startup',async()=>{
 const pass=new JourneyContextGlass();let initialized,compiled=0;
 const renderer={getDrawingBufferSize:v=>v.set(800,450),initRenderTarget:t=>{initialized=t;},compileAsync:async()=>{compiled++;}};
 await pass.prepareGPU(renderer);assert.equal(initialized,pass.target);assert.equal(compiled,1);
 const target=pass.target;pass.resize(renderer);assert.equal(pass.target,target);pass.dispose();
});
