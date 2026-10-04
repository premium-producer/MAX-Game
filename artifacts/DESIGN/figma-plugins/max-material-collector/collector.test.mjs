import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import Collector from './core.cjs';
import {unpack} from './unpack.mjs';
const n=(id,type,x,y,w,h,extra={})=>({id,type,name:'Frame '+id,parent:'page',visible:true,bounds:{x,y,width:w,height:h},...extra});
const phone=(id,x,y,extra={})=>n(id,'FRAME',x,y,375,812,extra);
const heading=(id,text,x,y,extra={})=>n(id,'TEXT',x,y,500,70,{text,fontSize:40,...extra});

function structuredFixture(){return [
 n('section','SECTION',0,0,5000,3000,{name:'Комментарии'}),
 n('ten','FRAME',0,0,1600,900,{parent:'section',name:'Комментарий — 10 (отправлено)'}),
 phone('two',0,1000,{parent:'section',name:'Комментарий - 2 (фокус инпута)'}),
 phone('one',1000,1000,{parent:'section',name:'Комментарий — 1 (начало поста без комментариев)'}),
 phone('internal',1000,1000,{parent:'one',name:'Внутренняя карточка — 1'}),
 n('sub','SECTION',9000,9000,3000,2000,{parent:'section',name:'Ответы'}),
 phone('reply',0,0,{parent:'sub',name:'Ответ — 1 (поле ввода)'}),
 n('other','SECTION',0,0,5000,3000,{name:'Ответы'}),
 phone('other-screen',0,0,{parent:'other',name:'Новый экран — 1'}),
 heading('misleading','Статистика канала',0,-100,{parent:'section'}),
 phone('hidden',0,0,{parent:'section',name:'Комментарий — 0',visible:false})
];}
test('structured mode uses real sections, optional subsections, atomic frames and numeric names',()=>{
 const records=Collector.structured(structuredFixture());
 assert.deepEqual(records.map(r=>r.id),['one','two','ten','reply','other-screen']);
 assert.equal(records[0].name,'Комментарий — 1 (начало поста без комментариев)');
 assert.deepEqual(records[1].sequence,{series:'Комментарий',number:2,description:'фокус инпута'});
 assert.equal(records[2].bounds.width,1600);
 assert.equal(records[0].task,'blogger.comments');assert.deepEqual(records[0].nearbyHeadings,[]);
 assert.equal(records[3].groupName,'Комментарии / Ответы');assert.deepEqual(records[3].sectionPath.map(s=>s.id),['section','sub']);
 assert.notEqual(records[3].group,records[4].group);assert.equal(records[4].task,'unassigned');
});
test('structured selection deduplicates nested selections and preserves manual order across assignments',()=>{
 const records=Collector.structured(structuredFixture(),['sub','reply'],'selection');
 assert.deepEqual(records.map(r=>r.id),['reply']);
 const all=Collector.structured(structuredFixture());
 const edits=all.map((r,i)=>({...r,order:i+1,task:i===0?'unassigned':'blogger.comments'}));
 assert.deepEqual(Collector.plan(all,edits).map(r=>r.id),all.map(r=>r.id));
 edits[0].order=99;assert.equal(Collector.plan(all,edits).at(-1).id,'one');
});
test('structured groups and explicit frame containers do not export their nested UI twice',()=>{
 const nodes=[n('root','SECTION',0,0,5000,5000,{name:'MAX'}),n('group','GROUP',0,0,3000,2000,{parent:'root',name:'Сценарий'}),n('container','FRAME',0,0,3000,2000,{parent:'group',name:'Комментарии'}),phone('a',0,0,{parent:'container',name:'Комментарий — 1 (начало)'}),phone('nested',0,0,{parent:'a',name:'Подфрейм — 2'})];
 const records=Collector.structured(nodes);assert.equal(records.length,1);assert.equal(records[0].groupName,'MAX / Сценарий / Комментарии');
});
test('unnamed screens use heading above; same-level next heading resets the context',()=>{
 const nodes=[heading('title','Создание публичного канала',0,0),phone('a',0,150),phone('b',500,150),heading('stats','Статистика канала',0,1150),phone('c',0,1300),phone('d',500,1300)];
 const records=Collector.classify(nodes,Collector.candidates(nodes,[],'page'));
 assert.deepEqual(records.map(r=>r.task),['blogger.channel','blogger.channel','blogger.statistics','blogger.statistics']);assert.equal(records[2].evidence[0].id,'stats');
});
test('named section and selected container collect phones, not the whole board',()=>{
 const nodes=[n('section','SECTION',0,0,3000,2000,{name:'Публичный канал'}),n('group','GROUP',0,80,2400,1100,{parent:'section'}),phone('a',40,150,{parent:'group'}),phone('b',500,150,{parent:'group'})];
 const screens=Collector.candidates(nodes,['group'],'selection');assert.deepEqual(screens.map(s=>s.id),['a','b']);
 assert(Collector.classify(nodes,screens).every(s=>s.task==='blogger.channel'));
});
test('headings in sibling containers do not bleed into the selected section',()=>{
 const nodes=[n('left','SECTION',0,0,900,1400),n('right','SECTION',1000,0,900,1400),heading('stats','Статистика канала',0,10,{parent:'left'}),phone('x',1100,150,{parent:'right'})];
 assert.equal(Collector.classify(nodes,[nodes[3]])[0].task,'unassigned');
});
test('nested phone components deduplicated; hidden and raster screen handled',()=>{
 const nodes=[phone('outer',0,100),phone('inner',0,100,{type:'INSTANCE',parent:'outer'}),phone('hidden',800,100,{visible:false}),n('raster','RECTANGLE',1200,100,375,812,{hasImage:true})];
 assert.deepEqual(Collector.candidates(nodes,[],'page').map(s=>s.id),['outer','raster']);
});
test('unusual selected screen is supported and overlapping selection has no duplicate',()=>{
 const nodes=[n('landscape','FRAME',0,0,1600,900),n('child','RECTANGLE',20,20,30,30,{parent:'landscape'})];
 assert.equal(Collector.candidates(nodes,['landscape','child'],'selection').length,1);
});
test('tall presentation board is not mistaken for a phone containing all other phones',()=>{
 const nodes=[n('board','FRAME',0,0,3000,8000),phone('a',100,150,{parent:'board'}),phone('b',600,150,{parent:'board'})];
 assert.deepEqual(Collector.candidates(nodes,[],'page').map(n=>n.id),['a','b']);
});
test('photo prerequisite does not claim hotel/benefit task coverage',()=>{
 assert.deepEqual(Collector.matches('Добавление подтвержденного фото (нужно для льготы и заселения в отель)'),['digital-id.photo']);
});
test('conflicting explicit name and parent is flagged; unknown remains unknown',()=>{
 const nodes=[n('s','SECTION',0,0,2000,2000,{name:'Создание публичного канала'}),phone('a',0,100,{parent:'s',name:'Статистика канала'}),phone('b',3000,100)];
 const records=Collector.classify(nodes,[nodes[1],nodes[2]]);assert.equal(records[0].confidence,'review');assert.equal(records[1].task,'unassigned');
});
test('local semantic heading can override a stale container name, with conflict visible',()=>{
 const nodes=[n('board','SECTION',0,0,2000,2000,{name:'Создание публичного канала'}),heading('stats','Статистика канала',50,30,{parent:'board'}),phone('a',60,150,{parent:'board'})];
 const record=Collector.classify(nodes,[nodes[2]])[0];assert.equal(record.task,'blogger.statistics');assert.equal(record.confidence,'review');
});
test('lower handsfree row inherits the heading above a large unnamed backdrop',()=>{
 const nodes=[heading('title','Видеосообщения (кружки)',100,0),n('background','RECTANGLE',0,100,5000,6000),heading('sub','Handsfree',100,4000),phone('a',100,4300),phone('b',900,4300)];
 const records=Collector.classify(nodes,nodes.slice(3));assert(records.every(r=>r.task==='communication.video'));assert.equal(records[0].contextRegion.id,'background');
});
test('reading order is row-major despite slight vertical drift; manual assignments preserved',()=>{
 const records=Collector.order([phone('right',500,90),phone('left',0,100),phone('below',0,1000)]);
 assert.deepEqual(records.map(s=>s.id),['left','right','below']);
 const plan=Collector.plan(records,[{id:'right',include:true,task:'business.channel',reviewed:true,title:'Post',order:2}]);
 assert.equal(plan[0].manualTask,true);assert.equal(plan[0].reviewed,true);
 assert.throws(()=>Collector.plan(records,[{id:'bad',include:true,task:'unassigned'}]));
 assert.equal(Collector.coverage(plan).find(t=>t.id==='business.channel').status,'screens-found-content-not-verified');
});
async function runtimeMock({fail=false,onExport}={}){
 const messages=[],page={id:'page',name:'Client page',type:'PAGE',selection:[],children:[]};
 const h={...heading('heading','Статистика канала',0,0),absoluteBoundingBox:{x:0,y:0,width:500,height:70},characters:'Статистика канала',parent:page,children:undefined};
 delete h.children;
 const screen={id:'1:1',type:'FRAME',name:'Frame 1',visible:true,parent:page,width:375,height:812,absoluteBoundingBox:{x:0,y:150,width:375,height:812},children:[],fills:[],reactions:[],removed:false};
 screen.exportAsync=async options=>{if(onExport)await onExport(options);if(fail)throw Error('Export failed');return options.format==='JSON_REST_V1'?{document:{id:screen.id}}:new Uint8Array([137,80,78,71]);};
 const text={id:'1:2',type:'TEXT',name:'Title',visible:true,parent:screen,characters:'Статистика',fontName:{family:'Inter',style:'Regular'},fontSize:24,absoluteBoundingBox:{x:10,y:170,width:200,height:30},fills:[],getStyledTextSegments:()=>[]};screen.children=[text];page.children=[h,screen];
 const figma={currentPage:page,root:{name:'Client file'},fileKey:'test',showUI(){},ui:{postMessage:m=>messages.push(m)},base64Encode:b=>Buffer.from(b).toString('base64'),getImageByHash(){throw Error('Unexpected image lookup');}};
 const ctx=vm.createContext({figma,__html__:'',setTimeout,clearTimeout,Uint8Array,console});
 vm.runInContext(await fs.readFile(new URL('./code.js',import.meta.url),'utf8'),ctx);
 return {figma,messages,page,screen};
}
test('runtime scan/export is read-only, pinned to source page, returns text and REST structure',async()=>{
 const m=await runtimeMock();await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=m.messages.find(x=>x.type==='scan');assert.equal(scan.records.length,1);
 m.figma.currentPage={id:'other'};
 await m.figma.ui.onmessage({type:'export',scanId:scan.id,edits:scan.records.map(r=>({...r,reviewed:true})),structure:true});
 const out=m.messages.find(x=>x.type==='bundle').bundle;
 assert.equal(out.status,'complete');assert.equal(out.source.pageId,'page');assert.equal(out.source.detection,'structure');assert.equal(out.screens[0].detection,'structure');assert.equal(out.screens[0].texts[0].text,'Статистика');assert.equal(out.screens[0].document.document.id,'1:1');assert.equal(m.page.children.length,2);assert.equal(m.page.selection.length,0);
});

test('runtime exports section paths and rejects a renamed parent after scan',async()=>{
 const m=await runtimeMock();
 const section={id:'s',type:'SECTION',name:'Комментарии',visible:true,parent:m.page,children:[m.screen]};
 m.screen.parent=section;m.screen.name='Комментарий — 2 (фокус инпута)';m.page.children=[section];
 await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=m.messages.find(x=>x.type==='scan');
 assert.equal(scan.records[0].sectionPath[0].name,'Комментарии');assert.equal(scan.records[0].sequence.number,2);
 section.name='Другой сценарий';
 await m.figma.ui.onmessage({type:'export',scanId:scan.id,edits:scan.records});
 const bundle=m.messages.find(x=>x.type==='bundle').bundle;assert.equal(bundle.status,'partial');assert.match(bundle.screens[0].error,/иерархия/);
});
test('runtime export errors produce partial bundle, never false complete',async()=>{
 const m=await runtimeMock({fail:true});await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=m.messages.find(x=>x.type==='scan');
 await m.figma.ui.onmessage({type:'export',scanId:scan.id,edits:scan.records});const b=m.messages.find(x=>x.type==='bundle').bundle;
 assert.equal(b.status,'partial');assert.equal(b.unexported.length,1);assert.equal(b.screens[0].exportStatus,'error');
});
test('runtime cancellation after pending export preserves partial bundle',async()=>{
 let cancel;const m=await runtimeMock({onExport:async()=>{await cancel();}});cancel=()=>m.figma.ui.onmessage({type:'cancel'});
 await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=m.messages.find(x=>x.type==='scan');
 await m.figma.ui.onmessage({type:'export',scanId:scan.id,edits:scan.records});const b=m.messages.find(x=>x.type==='bundle').bundle;assert.equal(b.status,'cancelled');assert.equal(b.unexported.length,1);
});
test('runtime rejects changed frame geometry and invalid scan',async()=>{
 const m=await runtimeMock();await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=m.messages.find(x=>x.type==='scan');m.screen.name='Moved';
 await m.figma.ui.onmessage({type:'export',scanId:scan.id,edits:scan.records});assert.equal(m.messages.find(x=>x.type==='bundle').bundle.status,'partial');
 await m.figma.ui.onmessage({type:'export',scanId:-1,edits:[]});assert.equal(m.messages.at(-1).type,'error');
});
test('unpacker emits safe folders, original bytes and escaped HTML, refuses overwrite',async()=>{
 const base=path.resolve('artifacts/workspace/tests/max-material-collector');await fs.mkdir(base,{recursive:true});const tmp=await fs.mkdtemp(path.join(base,'run-')),out=path.join(tmp,'materials');
 const png=Buffer.from([137,80,78,71]),bundle={schema:'max-client-materials',version:1,source:{pageName:'Client'},status:'complete',screens:[{id:'1:2',task:'../bad',name:'<script>alert(1)</script>',order:1,exportStatus:'ok',png:png.toString('base64'),thumbnail:png.toString('base64')}],images:[],coverage:[]};
 const result=await unpack(bundle,out);assert.equal(result.screens,1);const cat=JSON.parse(await fs.readFile(path.join(out,'catalog.json'),'utf8'));assert.deepEqual(await fs.readFile(path.join(out,cat.screens[0].pngFile)),png);assert(!(await fs.readFile(path.join(out,'index.html'),'utf8')).includes('<script>'));await assert.rejects(unpack(bundle,out));
});

test('structured unpack keeps section hierarchy, Unicode names and sequence metadata',async()=>{
 const base=path.resolve('artifacts/workspace/tests/max-material-collector');await fs.mkdir(base,{recursive:true});const tmp=await fs.mkdtemp(path.join(base,'structured-'));
 const record=Collector.structured(structuredFixture()).find(r=>r.id==='reply');
 const bundle={schema:'max-client-materials',version:1,source:{},screens:[{...record,order:4,png:'iVBORw0KGgo='}],images:[],coverage:[]};
 await unpack(bundle,path.join(tmp,'materials'));
 const catalog=JSON.parse(await fs.readFile(path.join(tmp,'materials/catalog.json'),'utf8')),s=catalog.screens[0];
 assert.match(s.pngFile,/^section-Комментарии\/sub-Ответы\//);assert.equal(s.sequence.description,'поле ввода');assert.equal(s.name,record.name);
});
test('UI scan, group assignment and export messages share the runtime contract',async()=>{
 class Element {constructor(tag){this.tag=tag;this.children=[];this.value='';this.checked=false;}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}set textContent(v){this.text=v;}get textContent(){return this.text;}remove(){}click(){this.onclick?.();}}
 const ids=new Map(),document={getElementById:id=>{if(!ids.has(id))ids.set(id,new Element(id));return ids.get(id);},createElement:tag=>new Element(tag),body:new Element('body')},messages=[];
 const ctx=vm.createContext({document,parent:{postMessage:m=>messages.push(m.pluginMessage)},setTimeout,clearTimeout,Blob,URL,console,AbortController,TextEncoder,fetch:async()=>({ok:true,json:async()=>({service:'figma-frame-archive',capabilities:['max-materials-v1']})})});
 const html=await fs.readFile(new URL('./ui.html',import.meta.url),'utf8');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
 document.getElementById('scope').value='page';document.getElementById('scan').onclick();assert.equal(messages[0].type,'scan');
 const r={...phone('1',0,0),task:'unassigned',group:'h',confidence:'none',reviewed:false,include:true,order:1,evidence:[],ancestors:[],nearbyHeadings:[],warnings:[]};
 ctx.onmessage({data:{pluginMessage:{type:'scan',id:9,source:{pageName:'Test'},records:[r],tasks:Collector.tasks,warnings:[],layerCount:1}}});
 const box=document.getElementById('groups').children[0],tools=box.children[1];tools.children[0].value='blogger.statistics';tools.children[1].onclick();
 await document.getElementById('export').onclick();const msg=messages.at(-1);assert.equal(msg.type,'export');assert.equal(msg.streaming,true);assert.equal(msg.scanId,9);assert.equal(msg.edits[0].task,'blogger.statistics');assert.equal(msg.edits[0].reviewed,true);
 ctx.onmessage({data:{pluginMessage:{type:'stream-finished',status:'partial',error:'Обрыв связи'}}});assert.equal(document.getElementById('export').disabled,false);assert.match(document.getElementById('status').textContent,/продолжить/);
});

async function waitMessage(m,type,count=1){for(let i=0;i<200;i++){const matches=m.messages.filter(x=>x.type===type);if(matches.length>=count)return matches[count-1];await new Promise(r=>setTimeout(r,1));}throw Error('No message '+type);}
test('streaming exports one frame and waits for disk ACK before the next',async()=>{
 let exports=0;const m=await runtimeMock({onExport:()=>{exports++;}});
 m.page.children.push({...m.screen,id:'2:1',name:'Frame 2',children:[]});
 await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=m.messages.find(x=>x.type==='scan');
 const task=m.figma.ui.onmessage({type:'export',streaming:true,scanId:scan.id,edits:scan.records});
 const plan=await waitMessage(m,'stream-plan');assert.equal(exports,0);
 await m.figma.ui.onmessage({type:'stream-ack',job:plan.job,key:plan.key,completed:[]});
 const first=await waitMessage(m,'stream-frame'),before=exports;assert.equal(first.packet.screens.length,1);
 await new Promise(r=>setTimeout(r,10));assert.equal(exports,before);
 await m.figma.ui.onmessage({type:'stream-ack',job:first.job,key:first.key});
 const second=await waitMessage(m,'stream-frame',2);assert(exports>before);
 await m.figma.ui.onmessage({type:'stream-ack',job:second.job,key:second.key,error:'Диск недоступен'});await task;
 assert.equal(m.messages.at(-1).status,'partial');assert.equal(m.messages.some(x=>x.type==='bundle'),false);
});
test('resume skips disk-verified frames without rendering; cancellation releases ACK wait',async()=>{
 let exports=0;const m=await runtimeMock({onExport:()=>{exports++;}});
 await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=m.messages.find(x=>x.type==='scan');
 const task=m.figma.ui.onmessage({type:'export',streaming:true,scanId:scan.id,edits:scan.records});
 const plan=await waitMessage(m,'stream-plan');await m.figma.ui.onmessage({type:'stream-ack',job:plan.job,key:plan.key,completed:['1:1']});await task;
 assert.equal(exports,0);assert.equal(m.messages.at(-1).status,'complete');
 const next=m.figma.ui.onmessage({type:'export',streaming:true,scanId:scan.id,edits:scan.records});await waitMessage(m,'stream-plan',2);
 await m.figma.ui.onmessage({type:'cancel'});await next;assert.equal(m.messages.at(-1).status,'cancelled');
});

test('text changes invalidate the scan even when a server would skip the frame',async()=>{
 const m=await runtimeMock();await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=m.messages.find(x=>x.type==='scan');
 m.screen.children[0].characters='Изменённый текст';
 const task=m.figma.ui.onmessage({type:'export',streaming:true,scanId:scan.id,edits:scan.records});const plan=await waitMessage(m,'stream-plan');
 await m.figma.ui.onmessage({type:'stream-ack',job:plan.job,key:plan.key,completed:['1:1']});await task;
 assert.equal(m.messages.at(-1).status,'partial');assert.match(m.messages.at(-1).error,/изменился/);
});

test('broken componentProperties getter does not stop scan or sequential export; diagnostic survives',async()=>{
 const m=await runtimeMock(),broken={id:'broken:1',type:'INSTANCE',name:'Некорректный компонент',visible:true,parent:m.screen,children:[],fills:[]};
 Object.defineProperty(broken,'componentProperties',{get(){throw Error('in get_componentProperties: Component set for node has existing errors');}});
 m.screen.children.push(broken);
 m.page.children.push({...m.screen,id:'2:1',name:'Frame 2',children:[]});
 await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=await waitMessage(m,'scan');
 assert.equal(scan.records.length,2);assert.equal(scan.records[0].readWarnings[0].nodeId,'broken:1');assert.match(scan.warnings[0],/свойства компонентов/);assert.equal(scan.records[1].readWarnings,undefined);
 const task=m.figma.ui.onmessage({type:'export',streaming:true,scanId:scan.id,edits:scan.records});
 const plan=await waitMessage(m,'stream-plan');await m.figma.ui.onmessage({type:'stream-ack',job:plan.job,key:plan.key,completed:[]});
 const first=await waitMessage(m,'stream-frame');assert.equal(first.packet.screens[0].exportStatus,'ok');assert.equal(first.packet.screens[0].readWarnings[0].property,'componentProperties');assert(first.packet.screens[0].png);
 await m.figma.ui.onmessage({type:'stream-ack',job:first.job,key:first.key});
 const next=await waitMessage(m,'stream-frame',2);await m.figma.ui.onmessage({type:'stream-ack',job:next.job,key:next.key});await task;
 assert.equal(m.messages.at(-1).status,'complete');assert.equal(m.screen.children[1],broken);assert.equal(broken.type,'INSTANCE');
});

test('component getter recovery changes fingerprint and requires a fresh scan',async()=>{
 const m=await runtimeMock();let broken=true;
 Object.defineProperty(m.screen,'componentProperties',{get(){if(broken)throw Error('Component set for node has existing errors');return {Label:{type:'TEXT',value:'MAX'}};}});
 await m.figma.ui.onmessage({type:'scan',scope:'page'});const scan=await waitMessage(m,'scan');broken=false;
 await m.figma.ui.onmessage({type:'export',scanId:scan.id,edits:scan.records});
 const b=m.messages.find(x=>x.type==='bundle').bundle;assert.equal(b.status,'partial');assert.match(b.screens[0].error,/повторите сканирование/);
});

test('UI sends portable SHA-256 and acknowledges only a verified server receipt',async()=>{
 const messages=[],elements=new Map(),requests=[];let corrupt=false;
 const ctx=vm.createContext({onmessage:()=>{},busy:false,scan:{id:1,records:[{id:'1:1',include:true}]},$:id=>{if(!elements.has(id))elements.set(id,{value:'1'});return elements.get(id);},post:m=>messages.push(m),status:()=>{},lock:()=>{},setTimeout,clearTimeout,TextEncoder,AbortController,Uint8Array,fetch:async(url,options)=>{
  requests.push({url,options});let data={service:'figma-frame-archive',capabilities:['max-materials-v1']};
  if(url.endsWith('/api/max/exports'))data={id:'dated',token:'token',outputPath:'export-folder',completed:[]};
  if(options.method==='PUT')data={verified:true,screenId:'1:1',sha256:corrupt?'wrong':options.headers['X-Content-SHA256'],bytes:Buffer.byteLength(options.body)};
  return {ok:true,json:async()=>data};
 }});
 vm.runInContext(await fs.readFile(new URL('../pdf-export/internal/src/sha256.js',import.meta.url),'utf8'),ctx);
 vm.runInContext(await fs.readFile(new URL('./server-client.js',import.meta.url),'utf8'),ctx);
 await elements.get('export').onclick();assert.equal(messages.at(-1).streaming,true);
 ctx.onmessage({data:{pluginMessage:{type:'stream-plan',job:4,key:'plan',plan:{}}}});await waitMessage({messages},'stream-ack');
 const frame={type:'stream-frame',job:4,key:'1:1',packet:{screens:[{name:'Экран MAX'}]}};
 ctx.onmessage({data:{pluginMessage:frame}});await waitMessage({messages},'stream-ack',2);assert.equal(messages.at(-1).error,undefined);
 const put=requests.find(r=>r.options.method==='PUT');assert.equal(put.options.headers.Authorization,'Bearer token');assert.match(put.options.headers['X-Content-SHA256'],/^[a-f0-9]{64}$/);
 corrupt=true;ctx.onmessage({data:{pluginMessage:frame}});await waitMessage({messages},'stream-ack',3);assert.match(messages.at(-1).error,/целостность/);
});
