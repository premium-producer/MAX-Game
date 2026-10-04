import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {screenCatalog,restoreSnapshot} from './catalog.mjs';
import {clientContent,CLIENT_TASKS} from '../../../../max-game/src/journey-client.mjs';
import {taskFor} from '../../../../max-game/src/journey-tasks.mjs';
import {taskMedia,mediaFrames} from '../../../../max-game/src/journey-media.mjs';
const original=JSON.parse(fs.readFileSync(new URL('../../../../max-game/public/config/client-missions.json',import.meta.url))),content=clientContent(original),list=screenCatalog(original);
test('all six missions have palm, complete ring and uncropped row followed by every task stage',()=>{
 assert.equal(new Set(list.map(s=>s.id)).size,list.length);assert.equal(content.missions.length,6);
 for(const m of content.missions){
  const screens=list.filter(s=>s.mission===m.id);assert.deepEqual(screens.slice(0,3).map(s=>s.kind),['palm','ring','line']);
  const start=restoreSnapshot(content,screens[0].state);assert.equal(start.phase,'palm');assert.equal(start.nodes.length,0);assert(!start.phoneVisible);
  for(const s of screens.slice(1,3)){
   const g=restoreSnapshot(content,s.state);assert.equal(g.nodes.length,1+m.steps.length+(m.branches?1:0));assert(!g.phoneVisible);assert.equal(g.edges().length,0);assert(g.nodes.every(n=>!g.captionVisible(n)&&g.presence(n)>.999999));
   if(s.kind==='line')for(const n of g.nodes)assert(n.worldX-120>=0&&n.worldX+120<s.width-48,m.id+' row is clipped');
  }
  for(const step of [...m.steps,...(m.branches||[]).map(b=>b.step)])for(let stage=0;stage<CLIENT_TASKS[step.id].length;stage++)assert(screens.some(s=>s.step===step.id&&s.stage===stage&&s.kind==='task'&&s.default),`${m.id}/${step.id}/${stage}`);
  assert(screens.some(s=>s.kind==='complete'&&s.state.phase==='complete'));
 }
});
test('snapshots preserve exact state and valid prerequisites, native ID and all business/format choices',()=>{
 for(const s of list){const g=restoreSnapshot(content,s.state);assert.deepEqual(g.session,s.state.session);assert.equal(g.phase,s.state.phase);assert.equal(g.activeId,s.state.activeId);
  if(['task','error','result'].includes(s.kind)){
   const o=g.current;assert.equal(o.step,s.step);assert.equal(o.stage,s.stage);assert(g.phoneVisible);const step=g.steps.find(step=>step.id===o.step);
   for(const id of step.requires||[])assert(g.nodes.some(n=>n.step===id&&n.done),`${s.name} missing ${id}`);
   if(s.kind==='task'){const task=taskFor(o,content);assert(task);assert.equal(g.session.task,o.step);}
  }
 }
 for(const branch of ['channel','bot','store'])assert(list.some(s=>s.branch===branch&&s.kind==='complete'&&s.state.session.completed.includes('business')));
 for(const step of ['message','reaction','demo-tool'])for(const choice of [0,1])assert(list.some(s=>s.step===step&&s.kind==='task'&&s.state.session.runs[s.mission].find(n=>n.step===step).answers[0]===choice),`${step}/${choice}`);
 for(const sector of [0,1,2])assert(list.some(s=>s.step==='account'&&s.stage===2&&s.state.session.runs.business.find(n=>n.step==='account').answers[1]===sector));
});
test('full mode covers every source gallery while default stories use exactly two photos',()=>{
 for(const s of list.filter(s=>s.kind==='task'&&!s.mediaIndex)){
  const g=restoreSnapshot(content,s.state),frames=mediaFrames(taskMedia(g.current));
  for(let index=1;index<frames.length;index++)assert(list.some(t=>t.step===s.step&&t.stage===s.stage&&t.mediaIndex===index));
 }
 for(const step of ['hotel','benefit','age','demo-benefit']){const scenes=list.filter(s=>s.step===step&&s.kind==='task');assert.equal(scenes.length,2);assert.match(scenes[1].media.ids[0],/02-present-id/);}
 for(const step of ['create-id','demo-id'])assert(list.filter(s=>s.step===step&&s.kind==='task').every(s=>s.device.width===360&&s.device.height===800));
 assert(list.filter(s=>s.mission==='demo-business').every(s=>s.group.endsWith('· тест')));
});
test('catalog is defensive and never changes client input',()=>{const before=JSON.stringify(original),a=screenCatalog(original);a[0].state.session.completed.push('bad');assert.equal(JSON.stringify(original),before);assert(!screenCatalog(original)[0].state.session.completed.includes('bad'));});

const html=fs.readFileSync(new URL('./ui.html',import.meta.url),'utf8'),code=fs.readFileSync(new URL('./code.js',import.meta.url),'utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1],payload=JSON.parse(script.match(/const DATA=([\s\S]*?);\r?\nconst \$/)[1]);
test('compiled UI and renderer parse, carry current CSS and original media with no external network',()=>{
 new vm.Script(script);new vm.Script(code);const game=Buffer.from(payload.html,'base64').toString('utf8'),scripts=[...game.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert.equal(scripts.length,2);for(const source of scripts)new vm.Script(source);
 assert.match(game,/data-reveal="true"/);assert.match(game,/data:font\/woff2;base64,/);assert.match(game,/assets\/digital-id\/create-13.svg/);assert.match(game,/hotel-02-present-id/);assert.match(game,/route-phone.id-task .demo-app\{width:100%/);assert(!game.includes('url("undefined")'));
 const manifest=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url)));assert.deepEqual(manifest.networkAccess.allowedDomains,['https://api.figma.com']);assert.equal(manifest.documentAccess,'dynamic-page');
 assert.equal(payload.catalogs.reveal.length,list.length);assert.equal(payload.catalogs.reveal.filter(s=>s.default).length,list.filter(s=>s.default).length);
});
test('source manifest matches the current files',()=>{const manifest=JSON.parse(fs.readFileSync(new URL('./source-manifest.json',import.meta.url)));for(const [name,sha]of Object.entries(manifest.files)){const bytes=fs.readFileSync(new URL('../../../../../'+name,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),sha,name);}});
test('Figma import preserves existing page, accepts wide rows, names metadata and cancel retains output',async()=>{
 class Node{constructor(type){this.type=type;this.children=[];this.width=1;this.height=1;this.data={};}appendChild(n){if(n.parent)n.parent.children=n.parent.children.filter(x=>x!==n);this.children.push(n);n.parent=this;}resize(w,h){assert(w>0&&h>0);this.width=w;this.height=h;}setPluginData(k,v){this.data[k]=v;}setRelaunchData(){}remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}}
 const messages=[],page=new Node('PAGE'),existing=new Node('RECTANGLE');existing.absoluteRenderBounds={x:50,y:-20,width:100,height:60};page.appendChild(existing);
 const figma={root:new Node('DOCUMENT'),currentPage:page,ui:{postMessage:m=>messages.push(m)},showUI(){},createRectangle:()=>new Node('RECTANGLE'),createFrame:()=>new Node('FRAME'),createNodeFromSvg:()=>new Node('FRAME'),createText:()=>new Node('TEXT'),createImage:b=>({hash:'mock'}),async listAvailableFontsAsync(){return [];},viewport:{center:{x:0,y:0},scrollAndZoomIntoView(){}},notify(){}};
 vm.runInNewContext(code,{figma,__html__:'test',Uint8Array,Number,String,Math,Map,JSON,Date,Error});await figma.ui.onmessage({type:'start',total:2,maxWidth:2048,editable:true,reference:true,revision:'test'});
 const png='data:image/png;base64,iVBORw0KGgo=';
 for(const [i,width]of [1600,2048].entries())await figma.ui.onmessage({type:'screen',screen:{id:'test'+i,group:'Миссия',name:'Экран',mission:'communication',kind:'line',width,height:1000,base:png,reference:png,layers:[{kind:'svg',svg:'<svg/>',x:10,y:20,w:30,h:30,opacity:1},{kind:'text',text:'MAX',png,x:50,y:20,w:30,h:30,opacity:1,weight:'400'}]}});
 assert.equal(messages.at(-1).type,'screen-added');const group=page.children[1];assert.equal(group.x,390);assert.equal(group.children[1].width,2048);assert.equal(group.children[1].x,2128);assert.equal(group.children[0].children.at(-1).visible,false);assert.equal(JSON.parse(group.children[0].data['max-source']).kind,'line');
 const other=new Node('PAGE');figma.currentPage=other;await figma.ui.onmessage({type:'cancel'});assert.equal(messages.at(-1).count,2);assert.equal(page.children[0],existing);assert.equal(group.children.length,2);assert.equal(figma.currentPage,other);
});

function uiHarness(){const elements=new Map(),sent=[],renderSent=[],listeners={};const element=id=>{if(!elements.has(id))elements.set(id,{value:'',hidden:false,checked:false,dataset:{},style:{},setAttribute(){},remove(){}});return elements.get(id);};element('edition').value='reveal';element('mission').value='common';element('scope').value='sample';element('preview').hidden=true;
 const parent={postMessage:m=>{if(m.pluginMessage.type!=='review-init')sent.push(m.pluginMessage);}},window={addEventListener:(type,fn)=>{(listeners[type]??=[]).push(fn);}};let renderer;const document={getElementById:element,body:{append(){}},createElement(){renderer={style:{},contentWindow:{postMessage:m=>renderSent.push(m)},setAttribute(){},remove(){}};return renderer;}};const context={document,parent,window,TextDecoder,Uint8Array,atob,setTimeout,clearTimeout};vm.runInNewContext(script,context);return {element,sent,renderSent,context,renderMessage:data=>listeners.message.forEach(fn=>fn({source:renderer.contentWindow,data})),figmaMessage:pluginMessage=>listeners.message.forEach(fn=>fn({source:null,data:{pluginMessage}}))};}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('UI waits for renderer, acknowledges one screen at a time and completes',async()=>{const h=uiHarness(),run=h.element('run').onclick();assert.equal(h.sent.length,0);h.renderMessage({type:'max-render-ready'});await tick();assert.equal(h.sent[0].type,'start');h.figmaMessage({type:'started',fontAvailable:false});await tick();const request=h.renderSent[0];assert.equal(request.type,'max-export-screen');h.renderMessage({type:'max-export-result',token:request.token,result:{id:request.screen.id,reference:'data:image/png;base64,abc'}});await tick();assert.equal(h.sent.at(-1).type,'screen');h.figmaMessage({type:'screen-added',id:request.screen.id});await run;assert.equal(h.element('progress').value,1);assert.equal(h.sent.at(-1).type,'finish');h.figmaMessage({type:'finished',count:1});assert.match(h.element('status').textContent,/Готово: 1/);});
test('UI shows renderer failures without creating output',async()=>{const h=uiHarness(),run=h.element('run').onclick();h.renderMessage({type:'max-render-error',error:'WebGL unavailable'});await run;assert(!h.sent.some(m=>m.type==='start'));assert.match(h.element('status').textContent,/WebGL unavailable/);assert.equal(h.element('run').disabled,false);});
