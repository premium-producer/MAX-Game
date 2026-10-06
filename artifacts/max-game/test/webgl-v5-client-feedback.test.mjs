import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {Group,Mesh,MeshBasicMaterial,PlaneGeometry,Scene,Texture,Vector3} from 'three';
import {v5Text,v5CopyMarkup,v5ButtonMarkup,syncV5InstructionVisibility} from '../src/journey-v5-ui-copy.mjs';
import {sharedTaskMarkup} from '../src/journey-shared-ui.mjs';
import {V5RevealJourney} from '../src/journey-v5-route-layout.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../src/journey-v5-backend.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
import {objectContextPresence,taskContentPresence,glassControlPresence,readGlassControls} from '../../service/public/max-panel-optics.js';

const renderer=await readFile(new URL('../src/journey-webgl-ui.mjs',import.meta.url),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));

for(const mission of Object.keys(catalog.missions))test(`future task icons enter only on their turn: ${mission}`,async()=>{
 let now=1000,c;
 const app=createApp({persistence:createMemoryPersistencePort(),now:()=>now});
 const session=createWebGLSession({catalog,port:app,sessionId:`feedback:${mission}`,onSnapshot:s=>c?.accept(s),onError:assert.fail});
 await session.start();
 c=new V5RevealJourney(sharedRevealContent(catalog),session,(nodes,active)=>Object.fromEntries(nodes.map((n,i)=>[n.step,{x:(i-nodes.indexOf(active))*700,y:0}])));
 c.configure(1760,1024,256);
 const settle=()=>{for(let i=0;i<12;i++)c.tick(.05,{settled:true,deviceHidden:true,deviceReady:true,deviceShown:true,reduced:true});};
 try{
  await session.command('SELECT_MISSION',{missionId:mission});
  await session.contact('hand','down',true);now+=800;await session.contact('hand','up',true);settle();
  assert.deepEqual(c.visibleNodes.map(n=>n.step),['open-max',c.activeId]);
  let reachedSecond=false;
  for(let count=0;count<120&&!['completed','incomplete'].includes(session.snapshot.state.status);count++){
   settle();
   const active=c.current;
   assert.ok(c.visibleNodes.includes(active));
   for(const n of c.nodes)if(n.step!=='open-max'&&n!==active&&!n.done&&!n.skipped)assert.ok(!c.visibleNodes.includes(n),`future ${n.step}`);
   for(const n of c.nodes)if(n.done||n.skipped)assert.ok(c.visibleNodes.includes(n));
   if(c.visibleNodes.length>2)reachedSecond=true;
   const s=session.snapshot.state;
   if(s.status==='result'){now+=1000;await app.pollTime(s.sessionId);continue;}
   const screen=catalog.tasks[s.taskId].screens[s.screenId];
   if(screen.automaticMs!==null){now+=screen.automaticMs+100;await app.pollTime(s.sessionId);continue;}
   const action=session.snapshot.view.actions.find(a=>a.actionId==='channel.continue-private')??session.snapshot.view.actions[0];
   assert.equal(c.answer(action.actionId),true);await flush();
  }
  settle();assert.equal(session.snapshot.state.status,'completed');assert.ok(reachedSecond);
  assert.equal(c.visibleNodes.length,c.nodes.length);
 }finally{await session.close();await app.close();}
});

for(const profile of ['source','client','stand'])test(`${profile}: nonempty copy seeds glyphs in a short shell and hidden→shown→hidden leaves no sharp or glass ghost`,async()=>{
 const url=profile==='source'?new URL('../src/journey-webgl-ui.mjs',import.meta.url):new URL(`../../../integration/current/code/${profile}/src/journey-webgl-ui.mjs`,import.meta.url);
 const source=await readFile(url,'utf8');
 const {V5_COPY_STYLES}=await import(new URL('journey-v5-ui-copy.mjs',url));
 assert.match(V5_COPY_STYLES,/\.instruction-copy\{[^}]*height:auto;flex-shrink:0\}/);
 const boundsSource=source.slice(source.indexOf('export function webglTextRasterBounds('),source.indexOf('export function createJourneyWebGLUI(')).replace('export ','');
 const textSource=source.slice(source.indexOf(' function text('),source.indexOf(' function vector('));
 const visitSource=source.slice(source.indexOf(' function visit('),source.indexOf(' function backTarget('));
 const alphaStart=source.indexOf('   for(const m of materials){',source.indexOf('   // Suppress a covered'));
 const alphaSource=source.slice(alphaStart,source.indexOf('   scene.traverse(mesh=>',alphaStart));
 let hidden=true,shellHeight=1,node,index;
 const scene=new Scene(),plane=new PlaneGeometry(1,1),groups=new Map(),materials=[],textures=[];
 const host={dataset:{contentPresence:'0',popupPresence:'1',uiPresence:'1'},querySelector:()=>null,parentElement:null};
 const instruction={tagName:'DIV',dataset:{},style:{removeProperty(){}},isConnected:true,parentElement:host,offsetWidth:760,childNodes:[]};
 const copy={tagName:'DIV',dataset:{},style:{removeProperty(){}},isConnected:true,parentElement:instruction,scrollHeight:187,childNodes:[]};
 const title={tagName:'H2',dataset:{},style:{},isConnected:true,parentElement:copy,childNodes:[],size:48,top:36};
 const body={tagName:'P',dataset:{},style:{},isConnected:true,parentElement:copy,childNodes:[],size:32,top:104};
 for(const el of [instruction,copy,title,body]){
  el.closest=selector=>selector==='[hidden]'?hidden?instruction:null:selector==='.journey-zone'?host:selector==='[data-task-content]'?(el===instruction?null:copy):selector==='.context-popup,.picker'?instruction:null;
  el.matches=selector=>selector.includes('[data-task-content]')||selector===movingSelector?el===instruction||el===copy:selector===surfaceSelector?el===instruction:false;
 }
 instruction.childNodes=[copy];copy.childNodes=[title,body];
 for(const [el,text] of [[title,catalog.tasks['business.platform'].title],[body,catalog.tasks['business.platform'].screens['business.platform.ready'].instruction]])el.childNodes=[{nodeType:3,textContent:text,length:text.length,parentElement:el}];
 body.textContent=body.childNodes[0].textContent;body.contains=()=>false;
 let currentBody=body;
 instruction.querySelector=selector=>selector==='.instruction-copy'?copy:null;copy.querySelector=selector=>selector==='p'?currentBody:null;
 copy.nodeType=title.nodeType=body.nodeType=1;
 const movingSelector=source.match(/const movingSelector='([^']+)'/)[1],surfaceSelector=source.match(/const surfaceSelector='([^']+)'/)[1];
 const rect=el=>({x:0,y:el.top??0,w:el===instruction?760:708,h:el===instruction?shellHeight:el===copy?copy.scrollHeight:(el.size??32)*1.1});
 const style=el=>({display:el===instruction&&hidden?'none':'block',visibility:'visible',opacity:'1',fontWeight:'500',fontSize:`${el.size??32}px`,fontFamily:'Max Sans',letterSpacing:'0px',color:'#fff',borderTopLeftRadius:'32px'});
 const arena={style:{width:'4096px'},getBoundingClientRect:()=>({left:0,top:0,width:4096})};
 instruction.getBoundingClientRect=()=>({left:0,top:0,width:760,height:hidden?0:shellHeight});
 const doc={createRange:()=>({setStart(n,j){node=n;index=j;},setEnd(){},getBoundingClientRect:()=>({left:index*20,right:(index+1)*20,top:node.parentElement.top,width:20,height:node.parentElement.size*1.1})}),defaultView:{getComputedStyle:style},querySelector:()=>arena,querySelectorAll:()=>[instruction]};
 const basic=(map,opacity)=>{const material=new MeshBasicMaterial({map,transparent:true,opacity});materials.push(material);return material;};
 const context={document:doc,arena,getSize:()=>({width:4096}),getComputedStyle:style,textMeasure:{letterSpacing:'',measureText:text=>({width:text.length*20})},cachePixels:v=>v,THREE:{Mesh,Group},plane,scene,groups,materials,retained:new Set(),previousGroups:new Map(),births:new WeakMap(),time:0,movingSelector,surfaceSelector,rect,Node:{TEXT_NODE:3,ELEMENT_NODE:1},basic,
  texture:(_key,draw)=>{draw({letterSpacing:'',fillText(){}});const texture=new Texture();textures.push(texture);return texture;},add:(mesh,parent,x,y,w,h)=>{mesh.position.set(x+w/2,y+h/2,0);mesh.scale.set(w,h,1);parent.add(mesh);return mesh;},
  surface:(el,r,parent)=>{parent.add(new Mesh(plane,basic(null,1)));},objectContextPresence,taskContentPresence,glassControlPresence,contentTransitions:new Map(),feedbacks:new Map(),bfmVisual:false};
 const visit=runInNewContext(`${boundsSource};${textSource};${visitSource};visit`,context);
 const applyAlpha=runInNewContext(`()=>{${alphaSource}}`,context);
 const readySource=source.slice(source.indexOf('  instructionReady('),source.indexOf('  canInterrupt('));
 const instructionReady=runInNewContext(`({${readySource}}).instructionReady`,context);
 visit(instruction);assert.equal(groups.size,0);assert.equal(materials.length,0);assert.deepEqual(readGlassControls(doc,{prepare:true}),[]);assert.equal(instructionReady(instruction),false);
 hidden=false;visit(instruction);
 assert.equal(groups.size,2,'nonempty copy must have a renderer owner despite the temporarily short old shell');
 const glyphs=materials.filter(material=>material.userData.el===title||material.userData.el===body);
 assert.equal(glyphs.length,2);
 for(const material of materials){material.userData.baseOpacity=material.opacity;material.userData.fade=1;}
 applyAlpha();assert.ok(glyphs.every(material=>material.opacity===0),'prepared copy waits for the existing content/media gate');assert.equal(instructionReady(instruction),false);
 shellHeight=239;host.dataset.contentPresence='1';applyAlpha();assert.ok(glyphs.every(material=>material.opacity===1));assert.equal(readGlassControls(doc,{prepare:true}).length,1);assert.equal(instructionReady(instruction),true);
 currentBody={textContent:body.textContent,contains:()=>false};assert.equal(instructionReady(instruction),false,'an old body mesh must not prove the new copy was displayed');currentBody=body;
 const liveCopy=groups.get(copy);groups.delete(copy);assert.equal(instructionReady(instruction),false,'DOM content without a renderer owner cannot be marked displayed');groups.set(copy,liveCopy);
 const bodyMaterial=glyphs.find(material=>material.userData.el===body),bodyMap=bodyMaterial.map;bodyMaterial.map=null;assert.equal(instructionReady(instruction),false,'the title alone must not count as rendered body');bodyMaterial.map=bodyMap;
 hidden=true;applyAlpha();assert.ok(materials.every(material=>material.opacity===0));assert.deepEqual(readGlassControls(doc,{prepare:true}),[]);assert.equal(instructionReady(instruction),false);
 const retention=source.match(/retained=new Set\(\[\.\.\.groups\][^\n]+/)[0];
 assert.equal(runInNewContext(`${retention};retained.size`,{groups,affected:()=>false}),0);
 for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();plane.dispose();
});

for(const profile of ['source','client','stand'])for(const hz of [30,60,120])test(`${profile}: business-account retained text keeps its proportions during shell resize and reversal at ${hz}Hz`,async()=>{
 const url=profile==='source'?new URL('../src/journey-webgl-ui.mjs',import.meta.url):new URL(`../../../integration/current/code/${profile}/src/journey-webgl-ui.mjs`,import.meta.url);
 const source=await readFile(url,'utf8');
 const {InstructionMotion}=await import(new URL('journey-popup-motion.mjs',url));
 const {V5MotionValue}=await import(new URL('journey-v5-inertia.mjs',url));
 const boundsSource=source.slice(source.indexOf('export function webglTextRasterBounds('),source.indexOf('export function createJourneyWebGLUI(')).replace('export ','');
 const textSource=source.slice(source.indexOf(' function text('),source.indexOf(' function vector('));
 const poseSource=source.slice(source.indexOf('    const r=visual||rect(el);group.position'),source.indexOf('    fade*=Number(el.dataset.pathPresence'));
 const group=new Group(),scene=new Scene(),plane=new PlaneGeometry(1,1);scene.add(group);
 const task=catalog.tasks['business.platform'],screen=task.screens['business.platform.ready'];
 assert.equal(task.title,'Бизнес-аккаунт');assert.match(screen.instruction,/Профиль подтвержд/);
 // Measured-layout fixture: the former one-line instruction leaves 147px for
 // a new 187px copy box. Children do not shrink; the copy's flex box temporarily
 // does. The actual renderer and InstructionMotion consume these measurements.
 const base={x:400,y:300,w:708,h:147},naturalHeight=187,padding=52;
 const motion=new InstructionMotion({top:274,height:base.h+padding},{Motion:V5MotionValue});
 motion.retarget({top:254,height:naturalHeight+padding});
 let currentRect={...base};
 const el={offsetWidth:708,matches:selector=>selector==='.task-dialog .instruction-copy'};
 const updatePose=runInNewContext(`()=>{${poseSource}}`,{visual:null,rect:()=>currentRect,el,group,base});
 let node,index;
 const range={setStart(n,j){node=n;index=j;},setEnd(){},getBoundingClientRect(){return {left:base.x+index*20,right:base.x+(index+1)*20,top:base.y+node.top,width:20,height:node.size*1.1};}};
 const style={fontWeight:'500',fontSize:'48px',fontFamily:'Max Sans',color:'#fff',letterSpacing:'0px'};
 const textMeasure={letterSpacing:'',measureText:text=>({width:text.length*20})};
 const paint=runInNewContext(`${boundsSource};${textSource};text`,{document:{createRange:()=>range},getComputedStyle:n=>({...style,fontSize:`${n.size}px`}),arena:{getBoundingClientRect:()=>({left:0,top:0,width:1760})},getSize:()=>({width:1760}),textMeasure,cachePixels:v=>v,THREE:{Mesh},plane,basic:()=>new MeshBasicMaterial(),texture:(_key,draw)=>{draw({letterSpacing:'',fillText(){}});return null;},add:(mesh,parent,x,y,w,h)=>{mesh.position.set(x+w/2,y+h/2,0);mesh.scale.set(w,h,1);parent.add(mesh);return mesh;}});
 for(const [text,size,top] of [[task.title,48,36],[screen.instruction,32,104]])paint({textContent:text,length:text.length,parentElement:{size},size,top},group,{x:base.x,y:base.y},1);
 const identity=group.id,dimensions=group.children.map(mesh=>mesh.scale.clone());
 let sawTemporaryShrink=false;
 for(let frame=0;frame<hz*3;frame++){
  if(frame===hz)motion.retarget({top:264,height:214});
  if(frame===Math.floor(hz*1.5))motion.retarget({top:254,height:naturalHeight+padding});
  motion.step(1/hz);
  currentRect={x:base.x,y:motion.top.value+26,w:base.w,h:Math.min(naturalHeight,motion.height.value-padding)};
  if(currentRect.h<178)sawTemporaryShrink=true;
  updatePose();scene.updateMatrixWorld(true);
  assert.equal(group.id,identity);assert.equal(group.scale.x,1);assert.equal(group.scale.y,1);
  group.children.forEach((mesh,i)=>{const world=mesh.getWorldScale(new Vector3());assert.ok(Math.abs(Math.abs(world.x)-Math.abs(dimensions[i].x))<1e-8);assert.ok(Math.abs(Math.abs(world.y)-Math.abs(dimensions[i].y))<1e-8);});
 }
 assert.ok(sawTemporaryShrink);assert.equal(group.children.length,2);assert.ok(motion.settled);
 assert.ok(currentRect.h/base.h>1.25,'old height-ratio scaling would stretch retained text');
 for(const mesh of group.children)mesh.material.dispose();plane.dispose();
});

test('blank instruction hides the whole card and later nonblank copy restores it',()=>{
 for(const body of ['',null,undefined,' \n\t ']){
  const html=sharedTaskMarkup({state:{status:'task'},view:{instruction:{text:body},actions:[]}},{title:'Голосовое / видео-сообщение'});
  assert.match(html,/<div class="instruction glass-control" hidden>/);
 }
 const instruction={hidden:false};
 assert.equal(syncV5InstructionVisibility(instruction,{hidden:true}),true);assert.equal(instruction.hidden,true);
 assert.equal(syncV5InstructionVisibility(instruction,{hidden:false}),true);assert.equal(instruction.hidden,false);
 const result=sharedTaskMarkup({state:{status:'result'},view:{instruction:{text:''},actions:[]}});
 assert.doesNotMatch(result,/<div class="instruction glass-control" hidden>/);
});

test('hidden instruction and nested content cannot survive renderer retention or repaint',()=>{
 const node=(hidden)=>({isConnected:true,dataset:{},closest:()=>hidden?{}:null});
 const shown=node(false),bubble=node(true),copy=node(true);
 const groups=new Map([shown,bubble,copy].map(el=>[el,{version:''}]));
 const expression=renderer.match(/retained=new Set\(\[\.\.\.groups\][^\n]+/)[0];
 const retained=runInNewContext(`${expression};retained`,{groups,affected:()=>false});
 assert.deepEqual([...retained],[shown]);
 const visitSource=renderer.slice(renderer.indexOf(' function visit('),renderer.indexOf(' function backTarget('));
 const visit=runInNewContext(`${visitSource};visit`,{scene:{},getComputedStyle:()=>assert.fail('hidden copy must never be painted')});
 visit(bubble);visit(copy);
});

test('video-message spelling has no hyphen and long title has no unbreakable video span',()=>{
 assert.equal(v5Text('Голосовое / видео-сообщение'),'Голосовое / видеосообщение');
 assert.equal(v5Text('Видео-сообщение'),'Видеосообщение');
 assert.equal(v5CopyMarkup('Голосовое / видео-сообщение'),'Голосовое / видеосообщение');
 assert.match(v5CopyMarkup('Цифровой ID'),/v5-copy-nowrap/);
});

test('hotel CTA preserves the explicit Russian declension through markup and accessibility copy',()=>{
 for(const suffix of ['ой','ого','ому','ым','ом']){
  const input=`Цифров${suffix} ID`,expected=`Цифров${suffix}\u00a0ID`;
  assert.equal(v5Text(input),expected);assert.equal(v5Text(expected),expected);
  assert.equal(v5CopyMarkup(input),`<span class="v5-copy-nowrap">${expected}</span>`);
 }
 assert.equal(v5Text('ID'),'Цифровой\u00a0ID');
 const label='Заселиться с Цифровым ID';
 const snapshot={state:{status:'task'},view:{instruction:{text:''},actions:[{actionId:'hotel',placement:'below',label}]}};
 assert.match(sharedTaskMarkup(snapshot),/Заселиться с <span class="v5-copy-nowrap">Цифровым\u00a0ID<\/span>/);
 assert.equal(v5Text(label),'Заселиться с Цифровым\u00a0ID');
});

test('button copy is a single text-flow owner, preserving the gap before the protected ID phrase',()=>{
 const label='Заселиться с Цифровым ID',markup=v5ButtonMarkup(label);
 assert.equal(markup,'<span class="v5-button-label">Заселиться с <span class="v5-copy-nowrap">Цифровым\u00a0ID</span></span>');
 assert.equal(markup.replace(/<[^>]+>/gu,''),v5Text(label));
 const snapshot={state:{status:'task',screenId:'hotel'},view:{instruction:{text:''},actions:[{actionId:'check-in',placement:'below',label}]}};
 const before=structuredClone(snapshot),html=sharedTaskMarkup(snapshot,{token:'unchanged'});
 assert.match(html,/data-answer="check-in" data-answer-token="unchanged" data-screen-id="hotel"><span class="v5-button-label">Заселиться с /);
 assert.deepEqual(snapshot,before);
});

test('requested message and completion line breaks preserve the original plain wording',()=>{
 const instruction='А теперь отправим сообщение! Выберем формат: голосовое сообщение или видеосообщение';
 const completion='Вы познакомились с возможностями общения в MAX.';
 const message=v5CopyMarkup(instruction),result=v5CopyMarkup(completion);
 assert.match(message,/сообщение! <br>Выберем формат:/);
 assert.match(result,/возможностями <br><span class="v5-copy-nowrap">общения в MAX\.<\/span>$/);
 assert.equal(message.replace(/<[^>]+>/gu,''),instruction);
 assert.equal(result.replace(/<[^>]+>/gu,''),completion);
 assert.equal(v5CopyMarkup('Выберем формат: голосовое сообщение'),'Выберем формат: голосовое сообщение');
});

for(const scale of [.5,1,2])test(`actual text painter includes glyph overhang and wrapped lines at arena scale ${scale}`,()=>{
 const boundsSource=renderer.slice(renderer.indexOf('export function webglTextRasterBounds('),renderer.indexOf('export function createJourneyWebGLUI(')).replace('export ','');
 const textSource=renderer.slice(renderer.indexOf(' function text('),renderer.indexOf(' function vector('));
 const lineText=['Голосовое /','видеосообщение'],value=lineText.join('');
 let index=0;const rows=[],scene=new Scene(),plane=new PlaneGeometry(1,1);
 const range={setStart(_node,j){index=j;},setEnd(){},getBoundingClientRect(){const second=index>=lineText[0].length,j=second?index-lineText[0].length:index;return {top:(second?54:0)*scale,left:j*20*scale,right:(j+1)*20*scale,width:20*scale,height:54*scale};}};
 const style={fontWeight:'500',fontSize:'48px',fontFamily:'Max Sans',color:'#fff',letterSpacing:'0px'};
 const measurements={width:480,actualBoundingBoxLeft:7,actualBoundingBoxRight:487,actualBoundingBoxAscent:36,actualBoundingBoxDescent:22};
 const textMeasure={letterSpacing:'',measureText:()=>measurements};
 const paint=runInNewContext(`${boundsSource};${textSource};text`,{
  document:{createRange:()=>range},getComputedStyle:()=>style,arena:{getBoundingClientRect:()=>({left:0,top:0,width:1760*scale})},getSize:()=>({width:1760}),
  textMeasure,cachePixels:v=>v,THREE:{Mesh},plane,basic:()=>new MeshBasicMaterial(),
  texture:(key,draw,w,h)=>{const row={w,h};rows.push(row);draw({letterSpacing:'',fillText:(text,x,y)=>Object.assign(row,{text,x,y})});return null;},
  add:(mesh,parent,x,y,w,h)=>{parent.add(mesh);Object.assign(rows.at(-1),{left:x,top:y});return mesh;}
 });
 paint({textContent:value,length:value.length,parentElement:{}},scene,{x:0,y:0},1);
 assert.deepEqual(rows.map(r=>r.text),lineText);
 for(const row of rows){assert.ok(row.x>=measurements.actualBoundingBoxLeft);assert.ok(row.x+measurements.actualBoundingBoxRight<=row.w);assert.ok(row.y>=measurements.actualBoundingBoxAscent);assert.ok(row.y+measurements.actualBoundingBoxDescent<=row.h);}
 assert.equal(rows[1].top-rows[0].top,54);
 for(const mesh of scene.children)mesh.material.dispose();plane.dispose();
});

for(const profile of ['source','client','stand'])test(`${profile}: actual painter preserves inline phrase spacing and excludes collapsed line-edge spaces`,async()=>{
 const url=profile==='source'?new URL('../src/journey-webgl-ui.mjs',import.meta.url):new URL(`../../../integration/current/code/${profile}/src/journey-webgl-ui.mjs`,import.meta.url);
 const source=await readFile(url,'utf8');
 const boundsSource=source.slice(source.indexOf('export function webglTextRasterBounds('),source.indexOf('export function createJourneyWebGLUI(')).replace('export ','');
 const textSource=source.slice(source.indexOf(' function text('),source.indexOf(' function vector('));
 const rows=[],scene=new Scene(),plane=new PlaneGeometry(1,1);
 const charWidth=char=>/\s/u.test(char)?6:14;
 let node,index;
 const range={setStart(n,j){node=n;index=j;},setEnd(){},getBoundingClientRect(){return node.rects[index];}};
 const textMeasure={letterSpacing:'',measureText:text=>({width:[...text].reduce((sum,char)=>sum+charWidth(char),0)})};
 const paint=runInNewContext(`${boundsSource};${textSource};text`,{
  document:{createRange:()=>range},getComputedStyle:()=>({fontWeight:'500',fontSize:'28px',fontFamily:'Max Sans',color:'#fff',letterSpacing:'0px'}),
  arena:{getBoundingClientRect:()=>({left:0,top:0,width:1760})},getSize:()=>({width:1760}),textMeasure,cachePixels:v=>v,THREE:{Mesh},plane,
  basic:()=>new MeshBasicMaterial(),texture:(_key,draw,w,h)=>{const row={w,h};rows.push(row);draw({letterSpacing:'',fillText:(text,x,y)=>Object.assign(row,{text,x,y})});return null;},
  add:(mesh,parent,x,y)=>{parent.add(mesh);Object.assign(rows.at(-1),{left:x,top:y});return mesh;}
 });
 const prefix='Заселиться с ',term='Цифровым\u00a0ID';let left=0;
 for(const value of [prefix,term,'.']){
  const rects=[...value].map(char=>{const width=charWidth(char),rect={left,right:left+width,top:0,width,height:32};left+=width;return rect;});
  paint({textContent:value,length:value.length,parentElement:{},rects},scene,{x:0,y:0},1);
 }
 assert.deepEqual(rows.map(row=>row.text),[prefix,term,'.']);
 const prefixStart=rows[0].left+rows[0].x,termStart=rows[1].left+rows[1].x;
 const prefixWidth=[...prefix].reduce((sum,char)=>sum+charWidth(char),0);
 assert.equal(termStart-prefixStart,prefixWidth);
 assert.equal(termStart-(prefixStart+prefixWidth-charWidth(' ')),6);
 assert.equal(rows[2].left+rows[2].x,termStart+[...term].reduce((sum,char)=>sum+charWidth(char),0));
 const value=' Выберем ';let x=0;
 const rects=[...value].map((char,j)=>{const width=j===0||j===value.length-1?0:charWidth(char),rect={left:x,right:x+width,top:54,width,height:32};x+=width;return rect;});
 paint({textContent:value,length:value.length,parentElement:{},rects},scene,{x:0,y:0},1);
 assert.equal(rows.at(-1).text,'Выберем');assert.equal(rows.at(-1).left+rows.at(-1).x,0);
 const before=rows.length;
 paint({textContent:' ',length:1,parentElement:{},rects:[{left:0,right:0,top:54,width:0,height:32}]},scene,{x:0,y:0},1);
 assert.equal(rows.length,before,'a collapsed text node beside BR must add no blank raster row');
 assert.equal(rows.at(-1).top-rows[0].top,54);
 for(const mesh of scene.children)mesh.material.dispose();plane.dispose();
});

for(const profile of ['source','client','stand'])test(`${profile}: renderer publishes zero content presence before base and joined invisible commits`,async()=>{
 const url=profile==='source'?new URL('../src/journey-webgl-ui.mjs',import.meta.url):new URL(`../../../integration/current/code/${profile}/src/journey-webgl-ui.mjs`,import.meta.url);
 const source=await readFile(url,'utf8');
 const {V5DeviceMorph}=await import(new URL('journey-v5-device-morph.mjs',url));
 const {joinTaskContentCommit,TaskContentTransition}=await import(new URL('journey-popup-motion.mjs',url));
 const methods=source.slice(source.indexOf('  joinContentTransition('),source.indexOf('  cancelInstruction('));
 const host={dataset:{contentPresence:'.41'}},options={from:392,to:620};
 let notifications=0,commits=0;const contentTransitions=new Map();
 const adapter=runInNewContext(`({${methods}})`,{contentTransitions,V5DeviceMorph,bfmVisual:true,reduced:{matches:false},onMotion:()=>notifications++,joinTaskContentCommit});
 const commit=()=>{assert.equal(host.dataset.contentPresence,'0');assert.equal(host.dataset.contentPhase,'ready');assert.equal(contentTransitions.get(host).value,0);commits++;};
 assert.equal(adapter.transitionContent(host,commit,options),true);
 assert.equal(adapter.joinContentTransition(host,commit),true);
 const motion=contentTransitions.get(host);
 for(let i=0;i<120&&motion.busy;i++){motion.tick(.05);host.dataset.contentPresence=String(motion.value);}
 assert.equal(motion.busy,false);
 assert.equal(commits,2);assert.equal(notifications,2);
 const immediate=runInNewContext(`({${methods}})`,{contentTransitions:new Map(),TaskContentTransition,bfmVisual:false,reduced:{matches:true},onMotion(){},joinTaskContentCommit});
 assert.equal(immediate.transitionContent(host,()=>assert.equal(host.dataset.contentPresence,'0')),true);
 assert.equal(host.dataset.contentPresence,'1');assert.equal(host.dataset.contentPhase,'idle');
});
