import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {ImageLoader,LoadingManager,Mesh,PlaneGeometry,MeshBasicMaterial,Scene} from 'three';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {v5DeviceMetrics} from '../src/journey-v5-device-morph.mjs';
import {V5StartupAssets,v5StartupPlan,v5StartupScreen} from '../src/journey-v5-startup-assets.mjs';

test('startup covers every usable screen of all six missions, branches, QR; missing stays missing',()=>{
 const plan=v5StartupPlan(MISSION_CATALOG);
 assert.equal(Object.keys(MISSION_CATALOG.missions).length,6);
 assert.equal(plan.screens.length,65);assert.equal(plan.screens.filter(r=>r.screen.missing).length,8);
 const assets=new Set(plan.screens.filter(r=>r.asset).map(r=>r.asset.assetId));assert.equal(assets.size,57);
 for(const mission of Object.values(MISSION_CATALOG.missions))for(const id of mission.taskIds){
  assert.ok(plan.screens.some(row=>row.task.taskId===id));
  for(const s of Object.values(MISSION_CATALOG.tasks[id].screens))if(!s.missing)assert.ok(plan.urls.includes('./'+MISSION_CATALOG.assets[s.assetId].path));
 }
 assert.ok(plan.urls.includes('./'+MISSION_CATALOG.assets['official.max-qr'].path));
 const old=new Set(Object.values(MISSION_CATALOG.tasks).flatMap(t=>Object.values(t.screens).slice(0,2).filter(s=>!s.missing).map(s=>'./'+MISSION_CATALOG.assets[s.assetId].path)));
 assert.ok(plan.urls.filter(url=>!old.has(url)).length>10,'more than first two frames really covered');
});

test('startup markup retains device, annotations and source copy without advancing state',()=>{
 const plan=v5StartupPlan(MISSION_CATALOG),before=JSON.stringify(MISSION_CATALOG);
 for(const row of plan.screens){const frame=v5StartupScreen(row);
  assert.ok(frame.markup.includes(row.task.title));assert.ok(frame.markup.includes('instruction-copy'));
  if(row.asset)assert.ok(frame.markup.includes(row.asset.path));else assert.ok(frame.markup.includes('media-missing'));
  assert.deepEqual(frame.metrics,v5DeviceMetrics({kind:row.screen.deviceKind,asset:row.asset,actions:row.screen.actions}));
  assert.equal(frame.metrics.height,800);
  assert.equal(frame.paused,false);assert.equal(v5StartupScreen(row,true).paused,true);
 }
 assert.equal(JSON.stringify(MISSION_CATALOG),before);
});

// Actual Three ImageLoader/LoadingManager with a tiny host shim. This verifies
// loader ordering and lifecycle; image decoding/GPU remain browser acceptance.
class HostImage{
 constructor(control){this.control=control;this.listeners=new Map();this.attrs=new Map();this.dataset={};this.isConnected=false;this.complete=false;this.naturalWidth=0;}
 addEventListener(name,fn){this.listeners.set(name,fn);}
 removeEventListener(name){this.listeners.delete(name);}
 set crossOrigin(value){this.setAttribute('crossorigin',value);}
 set src(value){this.attrs.set('src',value);this.control.requests.push(value);queueMicrotask(()=>{
  if(this.control.fail===value){this.listeners.get('error')?.call(this,new Error('load failed'));return;}
  this.complete=true;this.naturalWidth=360;this.listeners.get('load')?.call(this);
 });}
 get src(){return this.attrs.get('src');}
 get attributes(){return [...this.attrs].map(([name,value])=>({name,value}));}
 setAttribute(name,value){this.attrs.set(name,value);}
 removeAttribute(name){this.attrs.delete(name);}
 decode(){this.control.decodes.push(this.src);return this.control.decodeWait??Promise.resolve();}
 replaceWith(image){this.replacement=image;this.isConnected=false;image.isConnected=true;}
}
async function withImageHost(fn){
 const original=globalThis.document,control={requests:[],decodes:[]};
 globalThis.document={createElementNS:()=>new HostImage(control)};
 try{await fn(control);}finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
}

test('actual ImageLoader deduplicated batch waits for decode before readiness',()=>withImageHost(async control=>{
 let release;control.decodeWait=new Promise(resolve=>{release=resolve;});
 let starts=0,ends=0;const manager=new LoadingManager(()=>ends++,()=>starts++),events=[];
 const loader=new ImageLoader(manager),assets=new V5StartupAssets('http://localhost/max-game/',{manager,loader});
 let done=false;const pending=assets.load(['./a.png','./a.png','./b.png'],(ready,total)=>events.push([ready,total])).then(()=>{done=true;});
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(done,false);assert.equal(control.requests.length,2);assert.equal(control.decodes.length,2);assert.equal(assets.images.size,0);
 release();await pending;assert.equal(done,true);assert.equal(assets.images.size,2);assert.deepEqual(events.at(-1),[2,2]);assert.ok(starts>0&&ends>0);
}));

test('prepared image is adopted without another load/decode; contact with live image is refused',()=>withImageHost(async control=>{
 const assets=new V5StartupAssets('http://localhost/max-game/');await assets.load(['a.png']);
 const template=new HostImage(control);template.attrs.set('src','http://localhost/max-game/a.png');template.attrs.set('class','task-media-image');
 const image=assets.images.get(template.src);image.attrs.set('data-old','stale');
 assert.equal(assets.takeImage(template),true);assert.equal(template.replacement,image);assert.equal(image.dataset.preparedPhone,'true');
 assert.equal(image.attrs.get('class'),'task-media-image');assert.equal(image.attrs.has('data-old'),false);assert.equal(image.attrs.get('crossorigin'),'anonymous');
 assert.equal(control.requests.length,1);assert.equal(control.decodes.length,1);
 assert.equal(assets.takeImage(template),false);image.isConnected=false;assert.equal(assets.takeImage(template),true);
}));

test('actual renderer draws repeated SVG states from one decoded source without moving the DOM image',()=>withImageHost(async control=>{
 const assets=new V5StartupAssets('http://localhost/max-game/');
 const url='webgl-v5/icon-glyphs/max-icon.channel.svg';await assets.load([url]);
 const source=assets.getImage(url);source.naturalHeight=120;source.isConnected=true;
 const code=await readFile(new URL('../src/journey-webgl-ui.mjs',import.meta.url),'utf8');
 const fn=code.slice(code.indexOf(' function image('),code.indexOf(' function cancelPlacement('));
 const draws=[],scene=new Scene(),plane=new PlaneGeometry(1,1);
 const context={startup:{assets},cachePixels:v=>v,THREE:{Mesh},plane,
  texture:(key,draw)=>{draw({drawImage:(...args)=>draws.push(args)});return null;},
  basic:()=>new MeshBasicMaterial(),add:(mesh,parent)=>{parent.add(mesh);return mesh;}};
 const paint=runInNewContext(fn+';image',context);
 for(let n=0;n<8;n++){
  // Four statuses plus the same channel icon in a second mission, all in one batch.
  const template=new HostImage(control);template.attrs.set('src',new URL(url,assets.baseURL).href);
  template.closest=()=>null;template.matches=()=>false;
  paint(template,{x:n*300,y:0,w:256,h:256},scene,{x:0,y:0},1);
  assert.equal(template.replacement,undefined);assert.equal(template.complete,false);
 }
 assert.equal(scene.children.length,8);assert.equal(draws.length,8);
 assert.ok(draws.every(args=>args[0]===source));assert.equal(source.isConnected,true);
 assert.equal(control.requests.length,1);assert.equal(control.decodes.length,1);
 assert.equal(assets.getImage('absent.svg'),null);
 for(const mesh of scene.children)mesh.material.dispose();plane.dispose();assets.dispose();
 assert.equal(assets.getImage(url),null);
}));

test('load failure blocks ready; late decode after disposal cannot populate cache',()=>withImageHost(async control=>{
 control.fail='http://localhost/max-game/bad.png';const assets=new V5StartupAssets('http://localhost/max-game/');
 await assert.rejects(assets.load(['bad.png']));assert.equal(assets.images.size,0);
 let release;control.decodeWait=new Promise(resolve=>{release=resolve;});
 const next=assets.load(['good.png']);await new Promise(resolve=>setTimeout(resolve,0));assets.dispose();release();
 await assert.rejects(next,/cancelled/);assert.equal(assets.images.size,0);
}));
