import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import {restoredCatalog} from './restored-content.mjs';
import {ICON_SHAPES} from '../../../max-game/src/journey-icons.mjs';


const review=JSON.parse(await fs.readFile(new URL('../../max-game/max-review.json',import.meta.url),'utf8'));
const {catalog:MISSION_CATALOG}=await restoredCatalog();

const runtime=await fs.readFile(new URL('runtime.js',import.meta.url),'utf8');
function harness({fontError=false,cancelAfter=Infinity}={}){
 let seq=0,last,requests=0;const nodes=new Map();
 class Node{
  constructor(type){this.type=type;this.id=String(++seq);this.children=[];this.data={};this.width=100;this.height=100;this.x=this.y=0;this.visible=true;this.name='';nodes.set(this.id,this);}
  appendChild(n){if(n.parent)n.parent.children.splice(n.parent.children.indexOf(n),1);this.children.push(n);n.parent=this;}
  getPluginData(k){return this.data[k]||'';}setPluginData(k,v){assert.ok(Buffer.byteLength(v,'utf8')<=100000,'pluginData entry exceeds 100 kB');this.data[k]=v;}
  resize(w,h){assert.ok(w>0&&h>0);this.width=w;this.height=h;}
  rescale(s){this.width*=s;this.height*=s;}
  findAll(fn){return this.children.flatMap(n=>[...(fn(n)?[n]:[]),...n.findAll(fn)]);}
  get absoluteBoundingBox(){return {x:this.x,y:this.y,width:this.width,height:this.height};}
  async loadAsync(){}
 }
 const root=new Node('DOCUMENT'),original=new Node('PAGE');original.name='Existing';root.appendChild(original);
 let context;const figma={root,currentPage:original,viewport:{},createFrame:()=>new Node('FRAME'),createRectangle:()=>new Node('RECTANGLE'),createText:()=>new Node('TEXT'),createPage:()=>{throw Error('Page creation forbidden');},createNodeFromSvg:svg=>{assert.ok(!svg.includes('undefined'));return new Node('FRAME');},createImage:bytes=>{assert.ok(bytes.length);return {hash:'image-'+(++seq)};},getNodeByIdAsync:async()=>null,setCurrentPageAsync:async n=>{figma.currentPage=n;},loadFontAsync:async()=>{if(fontError)throw Error('FONT_UNAVAILABLE');},showUI:()=>{},ui:{postMessage(m){last=m;if(m.type==='asset'){requests++;queueMicrotask(()=>figma.ui.onmessage({type:'asset-result',request:m.request,bytes:[137,80,78,71]}));}if(m.type==='status'&&!m.done&&requests>=cancelAfter)figma.ui.onmessage({type:'cancel'});}}};
 context=vm.createContext({figma,PACK:{catalog:structuredClone(MISSION_CATALOG),shapes:ICON_SHAPES,logo:'<svg/>'},__html__:'',setTimeout,clearTimeout,Uint8Array});vm.runInContext(runtime,context);
 return {figma,original,nodes,run:expression=>vm.runInContext(expression,context),last:()=>last};
}
test('all six missions: complete screen inventory, nested auto layout, PC and branches',async()=>{
 const h=harness();await h.run('build(Object.keys(catalog.missions))');assert.equal(h.last().done,true);assert.match(h.last().text,/Готово/);
 const page=h.original,all=page.findAll(()=>true),meta=n=>JSON.parse(n.getPluginData('meta')||'{}');
 assert.equal(all.filter(n=>meta(n).role==='mission').length,6);
 const screens=all.filter(n=>meta(n).role==='screen');
 const expected=Object.values(MISSION_CATALOG.missions).flatMap(m=>m.taskIds.flatMap(t=>Object.keys(MISSION_CATALOG.tasks[t].screens).map(s=>m.missionId+'/'+s)));
 assert.deepEqual(screens.map(n=>meta(n).missionId+'/'+meta(n).screenId).sort(),expected.sort());
 for(const n of screens){assert.equal(n.layoutMode,'HORIZONTAL');assert.equal(n.counterAxisAlignItems,'CENTER');assert.equal(n.children[0].layoutMode,'VERTICAL');}
 const pc=screens.find(n=>meta(n).deviceKind==='pc');assert.equal(pc.children[0].width,1064);
 const channel=screens.filter(n=>meta(n).taskId==='blogger.channel');assert.equal(channel.length,Object.keys(MISSION_CATALOG.tasks['blogger.channel'].screens).length);assert.equal(new Set(channel.map(n=>n.parent.id)).size,1);assert.equal(channel[0].parent.layoutMode,'VERTICAL');assert.equal(channel[0].parent.counterAxisAlignItems,'MIN');
 assert.ok(all.some(n=>n.type==='TEXT'&&n.characters?.includes('Нет материала:')));
 assert.equal(h.figma.root.children.length,1);assert.equal(h.figma.currentPage,h.original);
});
test('repeat build preserves IDs and manual instruction, export identifies edit',async()=>{
 const h=harness();await h.run("build(['blogger'])");const page=h.original;
 const text=page.findAll(n=>n.type==='TEXT'&&JSON.parse(n.getPluginData('meta')||'{}').field==='instruction')[0];text.characters='Правка клиента';const ids=page.findAll(()=>true).map(n=>n.id).sort();
 await h.run("build(['blogger'])");assert.deepEqual(page.findAll(()=>true).map(n=>n.id).sort(),ids);assert.equal(text.characters,'Правка клиента');
 await h.run('exportEdits()');assert.equal(h.last().type,'export');assert.ok(h.last().data.changes.some(r=>r.value==='Правка клиента'));assert.equal(h.last().data.changes.filter(r=>r.role==='hotspot').length,0);
});
test('cancel keeps completed nodes and subsequent run finishes without duplicates',async()=>{
 const h=harness({cancelAfter:2});await h.run("build(['blogger'])");assert.match(h.last().text,/Остановлено/);const page=h.original;assert.ok(page.children.length);
 const original=h.figma.ui.postMessage;h.figma.ui.postMessage=m=>{if(m.type==='asset')queueMicrotask(()=>h.figma.ui.onmessage({type:'asset-result',request:m.request,bytes:[1]}));};
 await h.run("build(['blogger'])");const rows=page.findAll(n=>JSON.parse(n.getPluginData('meta')||'{}').role==='screen');const count=MISSION_CATALOG.missions.blogger.taskIds.reduce((n,id)=>n+Object.keys(MISSION_CATALOG.tasks[id].screens).length,0);assert.equal(rows.length,count);assert.equal(new Set(rows.map(n=>n.getPluginData('key'))).size,count);h.figma.ui.postMessage=original;
});
test('font failure leaves original document untouched',async()=>{const h=harness({fontError:true});await h.run("build(['blogger'])");assert.match(h.last().text,/FONT_UNAVAILABLE/);assert.equal(h.figma.root.children.length,1);});
test('previous branch cards move into a single column without losing node IDs or edits',async()=>{
 const h=harness();await h.run("build(['blogger'])");
 const screen=h.original.findAll(n=>n.getPluginData('key')==='legacy.reveal-011')[0],stack=screen.parent;
 const branch=h.figma.createFrame();branch.setPluginData('key','branches');stack.appendChild(branch);branch.appendChild(screen);
 const copy=screen.findAll(n=>n.type==='TEXT'&&JSON.parse(n.getPluginData('meta')||'{}').field==='instruction')[0];copy.characters='Сохранить эту правку';const id=screen.id;
 await h.run("build(['blogger'])");assert.equal(screen.parent,stack);assert.equal(screen.id,id);assert.equal(copy.characters,'Сохранить эту правку');assert.equal(branch.visible,false);
 const cards=stack.children.filter(n=>JSON.parse(n.getPluginData('meta')||'{}').role==='screen');assert.deepEqual(cards.map(n=>n.getPluginData('key')),Object.keys(MISSION_CATALOG.tasks['blogger.channel'].screens));
});
test('large native screen uses compact fingerprint; recovery and old baseline migration',()=>{
 const h=harness();
 const result=h.run(`(()=>{const n=figma.createFrame();for(let i=0;i<300;i++){const t=figma.createText();t.characters='Большой нативный экран '.repeat(60);n.appendChild(t);}const first=signature(n);n.setPluginData('base',first);const same=signature(n);n.children[0].characters+='Правка';const changed=signature(n);n.setPluginData('base','');const recovered=assetBase(n);const recovery=n.getPluginData('baselineRecovered');const old='{"type":"FRAME","width":100}';n.setPluginData('base',old);const migrated=assetBase(n);return {first,same,changed,recovered,recovery,migrated,expected:fingerprint(old)};})()`);
 assert.ok(result.first.length<64);assert.equal(result.first,result.same);assert.notEqual(result.changed,result.first);assert.equal(result.recovered,result.changed);assert.equal(result.recovery,'true');assert.equal(result.migrated,result.expected);
});
test('current page is pinned; existing objects and manual container position survive',async()=>{
 const h=harness(),existing=h.figma.createFrame();existing.x=100;existing.y=50;existing.resize(600,300);h.original.appendChild(existing);
 const other=new h.original.constructor('PAGE');h.figma.root.appendChild(other);h.figma.root.appendChild(new h.original.constructor('PAGE'));
 h.figma.loadFontAsync=async()=>{h.figma.currentPage=other;};
 await h.run("build(['blogger'])");assert.match(h.last().text,/Готово/);assert.equal(h.figma.root.children.length,3);assert.equal(h.figma.currentPage,other);assert.equal(other.children.length,0);
 const container=h.original.children.find(n=>n.getPluginData('key')==='content-root-v2');assert.equal(container.x,940);assert.equal(container.y,50);assert.equal(existing.x,100);
 container.x=321;container.y=456;h.figma.currentPage=h.original;h.figma.loadFontAsync=async()=>{};
 await h.run("build(['blogger'])");assert.equal(container.x,321);assert.equal(container.y,456);
 h.figma.currentPage=other;await h.run('exportEdits()');assert.match(h.last().text,/текущей странице/);
});
test('built package is offline and assets match the canonical catalog',async()=>{
 const manifest=JSON.parse(await fs.readFile(new URL('manifest.json',import.meta.url),'utf8'));assert.deepEqual(manifest.networkAccess.allowedDomains,['none']);
 const index=JSON.parse(await fs.readFile(new URL('content-index.json',import.meta.url),'utf8'));assert.equal(index.assets.length,Object.keys(MISSION_CATALOG.assets).length);assert.equal(index.missions.length,6);assert.equal(index.revision,MISSION_CATALOG.contentRevision);
 const code=await fs.readFile(new URL('code.js',import.meta.url),'utf8');assert.ok(code.endsWith(runtime));
 const ui=await fs.readFile(new URL('ui.html',import.meta.url),'utf8');assert.ok(!ui.includes('/* EMBEDDED_MEDIA */'));assert.ok(!/fetch\(/.test(ui));
});

test('every historical state is retained exactly once, including results and removed content',async()=>{
 const old=JSON.parse(await fs.readFile(new URL('../max-journey/internal/screen-inventory.json',import.meta.url),'utf8'));
 const all=Object.values(MISSION_CATALOG.tasks).flatMap(t=>Object.values(t.screens));
 const legacy=all.filter(s=>s.source?.legacyId);
 assert.equal(legacy.length,216);assert.equal(new Set(legacy.map(s=>s.source.legacyId)).size,216);
 assert.deepEqual(legacy.map(s=>s.source.legacyId).sort(),old.map(s=>s.id).sort());
 assert.equal(legacy.filter(s=>s.kind==='result').length,27);
 const call=Object.values(MISSION_CATALOG.tasks['communication.call'].screens).filter(s=>!s.supplemental);
 assert.equal(call.length,4);assert.equal(MISSION_CATALOG.assets[call[2].assetId].path,'assets/client-media/frame-85835.png');
 assert.equal(MISSION_CATALOG.assets[call[3].assetId].path,'assets/client-media/frame-85835.png');
 assert.equal(call[2].instruction,'');assert.equal(call[3].instruction,'Задание выполнено. Открываем следующую возможность.');
 assert.equal(call[3].actions.length,0);
 for(const id of ['legacy.reveal-031','legacy.reveal-040','legacy.reveal-082'])assert.equal(all.find(s=>s.screenId===id).review.content,'remove');
 assert.equal(all.find(s=>s.screenId==='legacy.reveal-069').review.content,'unchanged','removing text must not remove its screen');
});

test('client text is exact; unchanged scene instructions are restored instead of duplicated',()=>{
 const all=Object.values(MISSION_CATALOG.tasks).flatMap(t=>Object.values(t.screens));
 for(const s of all){
  const src=s.instructionSource;if(src.kind==='client-comment'){
   const c=review.commentMap.find(c=>c.id===src.commentId);assert.ok(c);
   if(src.mode==='remove')assert.equal(s.instruction,'');
   if(src.mode==='exact')assert.equal(s.instruction,c.message);
   if(src.mode==='last-paragraph')assert.equal(s.instruction,c.message.split(/\n\s*\n/).at(-1).trim());
  }
 }
 const hotel=Object.values(MISSION_CATALOG.tasks['digital-id.hotel'].screens);
 assert.equal(hotel.length,3);assert.notEqual(hotel[0].instruction,hotel[1].instruction);
 assert.equal(hotel[1].instruction,hotel[1].originalInstruction);
 assert.match(hotel[1].instruction,/Предъявите Цифровой ID сотруднику/);
 const museum=Object.values(MISSION_CATALOG.tasks['digital-id.benefit'].screens);
 assert.equal(museum.length,3);assert.match(museum[1].instruction,/статус студента/);
 assert.equal(MISSION_CATALOG.commentLedger.length,80);
 assert.equal(MISSION_CATALOG.commentLedger.filter(c=>c.disposition==='outside-MAX-selection').length,26);
});

test('review colors, empty removed copy and missing client frames are distinct; all text hugs',async()=>{
 const h=harness();await h.run("build(['digital-id','business'])");
 const node=id=>h.original.findAll(n=>n.getPluginData('key')===id)[0];
 const removed=node('legacy.reveal-040');assert.equal(removed.fills[0].color.r,1);assert.equal(removed.fills[0].color.g,.9);
 const edited=node('legacy.reveal-037').children.find(n=>n.getPluginData('key')==='instruction');assert.equal(edited.fills[0].color.g,.96);
 const noText=node('legacy.reveal-039').children.find(n=>n.getPluginData('key')==='instruction');assert.equal(noText.visible,true);assert.ok(noText.children.some(n=>n.characters==='Текст справки удалён по комментарию клиента'));
 const added=node('added.business.sector');assert.equal(added.fills[0].color.g,.96);assert.equal(added.children[0].fills[0].color.g,.25);
 for(const n of h.original.findAll(n=>n.type==='TEXT')){assert.equal(n.textAutoResize,'HEIGHT');assert.equal(n.layoutSizingVertical,'HUG');}
 await h.run('exportEdits()');assert.equal(h.last().data.schemaVersion,2);assert.equal(h.last().data.legacyCoverage.length,216);
 assert.ok(h.last().data.screens.some(s=>s.review.content==='remove'&&s.source.legacyId==='reveal-040'));
});

test('all mission finals render QR instead of stale task assets, including existing v2 updates',async()=>{
 const h=harness();
 await h.run(`(async()=>{for(const task of Object.values(catalog.tasks))for(const s of Object.values(task.screens))if(s.kind==='complete'){
  const mid=Object.values(catalog.missions).find(m=>m.taskIds.includes(task.taskId)).missionId;
  await screen(figma.currentPage,s,mid,task.taskId);
 }})()`);
 const finals=h.original.children,missions=new Set();
 for(const row of finals){
  const m=JSON.parse(row.getPluginData('meta'));missions.add(m.missionId);
  const device=row.children.find(n=>n.getPluginData('key')==='device');
  const qr=device.children.find(n=>n.getPluginData('key')==='final-qr');
  assert.equal(qr.getPluginData('assetId'),MISSION_CATALOG.missions[m.missionId].qr.assetId);
  assert.ok(device.children.some(n=>n.characters==='Миссия выполнена'));
  assert.ok(device.findAll(n=>n.characters==='К миссиям').length);
  assert.ok(!device.children.some(n=>n.getPluginData('key')==='media'&&n.visible));
  const old=h.figma.createFrame();old.setPluginData('key','media');old.name='Manually edited old screenshot';device.appendChild(old);
 }
 assert.equal(missions.size,6);
 const ids=h.original.findAll(()=>true).map(n=>n.id).sort();
 await h.run(`(async()=>{for(const task of Object.values(catalog.tasks))for(const s of Object.values(task.screens))if(s.kind==='complete'){
  const mid=Object.values(catalog.missions).find(m=>m.taskIds.includes(task.taskId)).missionId;
  await screen(figma.currentPage,s,mid,task.taskId);
 }})()`);
 assert.deepEqual(h.original.findAll(()=>true).map(n=>n.id).sort(),ids);
 for(const row of finals){const d=row.children.find(n=>n.getPluginData('key')==='device');assert.equal(d.children.find(n=>n.getPluginData('key')==='media').visible,false);assert.equal(d.children.filter(n=>n.getPluginData('key')==='final-qr').length,1);}
});

test('v2 builds alongside v1, preserves manual positions and does not recreate pages',async()=>{
 const h=harness();const old=h.figma.createFrame();old.setPluginData('key','content-root');old.name='My existing v1';h.original.appendChild(old);
 await h.run("build(['communication'])");assert.equal(old.name,'My existing v1');assert.equal(old.children.length,0);
 const newer=h.original.children.find(n=>n.getPluginData('key')==='content-root-v2');assert.ok(newer);assert.notEqual(old,newer);
 assert.equal(h.figma.root.children.length,1);
 const count=newer.findAll(()=>true).length;await h.run("build(['communication'])");assert.equal(newer.findAll(()=>true).length,count);
});
