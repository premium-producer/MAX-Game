import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import MapExport from './map.cjs';
import summary from './summary.cjs';
import {createMaterialsStore} from '../max-material-collector/server-store.mjs';
let seq=0;
function node(type='FRAME',layoutMode='NONE',kids=[],text){const n={id:'n'+(++seq),type,layoutMode,name:'WRONG 99',visible:true,width:400,height:800,absoluteBoundingBox:{x:999,y:333,width:400,height:800},children:kids,characters:text,meta:{},getPluginData(k){return k==='meta'?JSON.stringify(this.meta):k==='key'?this.key||'':'';}};for(const c of kids)c.parent=n;return n;}
const txt=s=>node('TEXT','NONE',[],s),art=()=>{const n=node('RECTANGLE');n.fills=[{type:'IMAGE',imageHash:'hash'}];return n;};
function fixture(){
 const asset=art(),visual=node('FRAME','NONE',[asset]),help=node('FRAME','VERTICAL',[txt('  Финальный текст\n'),node('FRAME','VERTICAL',[txt('Второй блок'),txt('Третий блок')])]);
 const device=node('FRAME','VERTICAL',[txt('Неверная служебная подпись'),visual,node('FRAME','VERTICAL',[txt('Служебная кнопка')])]);
 device.children[2].key='actions';
 const row=node('FRAME','HORIZONTAL',[device,help]),stack=node('FRAME','VERTICAL',[txt('Игнорируемая подпись этапов'),row]);
 const symbol=node('VECTOR'),header=node('FRAME','VERTICAL',[symbol,txt('Новый канал')]),column=node('FRAME','VERTICAL',[header,stack]);
 const route=node('FRAME','HORIZONTAL',[column]),mission=node('FRAME','VERTICAL',[txt('Финальная миссия'),route]),root=node('FRAME','HORIZONTAL',[mission]),page=node('PAGE','NONE',[root]);
 return {page,root,mission,route,column,header,stack,row,device,visual,asset,help};
}
const all=n=>[n,...n.children.flatMap(all)];

test('preparation is cancellable inside a large visual before sending the export plan',async()=>{
 const f=fixture(),messages=[];f.page.selection=[f.root];
 for(let i=0;i<512;i++){const child=art();child.parent=f.visual;f.visual.children.push(child);}
 let figma;
 figma={currentPage:f.page,root:{name:'Fixture'},showUI(){},ui:{postMessage(m){messages.push(m);if(m.type==='status'&&m.text.includes('проверено слоёв: 64'))setTimeout(()=>figma.ui.onmessage({type:'cancel'}),0);}}};
 const ctx=vm.createContext({figma,__html__:'',setTimeout,clearTimeout,Uint8Array});
 vm.runInContext(await fs.readFile(new URL('code.js',import.meta.url),'utf8'),ctx);
 await figma.ui.onmessage({type:'scan',scope:'selection'});const scanned=messages.find(m=>m.type==='scan');
 await figma.ui.onmessage({type:'export',scanId:scanned.id,streaming:true,edits:scanned.records.map(r=>({id:r.id,include:true}))});
 assert.equal(messages.at(-1).status,'cancelled');
 assert.ok(messages.some(m=>m.type==='status'&&m.text.includes('Подготовка 2 / 2')));
 assert.ok(!messages.some(m=>m.type==='stream-plan'||m.type==='stream-frame'));
});

test('yielding content fingerprint equals the synchronous resume identity',async()=>{
 const f=fixture(),mapped=MapExport.scan(f.page,[],'page'),r=mapped.records[1];
 const fn=n=>JSON.stringify(all(n).map(x=>[x.id,x.characters]));
 assert.equal(await MapExport.fingerprintAsync(r,mapped.nodes,async n=>fn(n)),MapExport.fingerprint(r,mapped.nodes,fn,[]));
});

test('nested editable UI is never counted or exported as another mission',()=>{
 const f=fixture(),nested=fixture();nested.mission.parent=f.visual;f.visual.children.push(nested.mission);
 const r=MapExport.scan(f.page,[],'page');
 assert.equal(r.contentMap.missions.length,1);assert.equal(r.records.length,2);
 assert.throws(()=>MapExport.scan(f.page,[nested.mission.id],'selection'),/Выделите миссию/);
});

test('native audit never reads children or component properties of a task visual',async()=>{
 const f=fixture(),messages=[];f.page.selection=[f.root];
 Object.defineProperty(f.visual,'children',{get(){throw Error('Must not descend into task visual during audit');}});
 Object.defineProperty(f.visual,'componentProperties',{get(){throw Error('Must not fingerprint UI during audit');}});
 const figma={currentPage:f.page,root:{name:'Fixture'},showUI(){},ui:{postMessage:m=>messages.push(m)}};
 const code=await fs.readFile(new URL('code.js',import.meta.url),'utf8');
 vm.runInContext(code,vm.createContext({figma,__html__:'',setTimeout,clearTimeout,Uint8Array}));
 await figma.ui.onmessage({type:'scan',scope:'selection'});
 assert.equal(messages.filter(m=>m.type==='error').length,0,JSON.stringify(messages));
 const result=messages.find(m=>m.type==='scan');assert.ok(result);assert.equal(result.records.length,2);
 assert.equal(result.records[1].instruction.blocks.length,3);
});

test('audit summary counts task screens including gaps and separates screenless icons',()=>{
 const f=fixture(),r=MapExport.scan(f.page,[],'page');
 r.contentMap.missions[0].icons.push({order:2,text:'MAX',screens:[],status:'ready'});
 r.contentMap.missions[0].icons[0].screens.push({status:'ambiguous'});
 const text=summary(r.contentMap);
 assert.match(text,/Миссий: 1/);assert.match(text,/Финальная миссия — заданий: 1/);
 assert.match(text,/Новый канал — экранов: 2, визуалов: 1 \(не определено у 1 экранов\) — готовы: 1, требуют разбора: 1/);
 assert.match(text,/не включены в задания\): MAX/);
 assert.equal(summary({missions:[]}),'Миссий: 0');
});

test('task screen ignores text and named actions without plugin metadata; visual stays opaque',()=>{
 const f=fixture(),buttons=f.device.children[2];buttons.key='';buttons.name='Действия внутри устройства';
 Object.defineProperty(buttons,'children',{get(){throw Error('Do not inspect buttons');}});
 Object.defineProperty(f.visual,'children',{get(){throw Error('Do not inspect the visual');}});
 const r=MapExport.scan(f.page,[],'page');
 assert.equal(r.records.length,2);assert.equal(r.records[1].id,f.visual.id);
 assert.equal(r.contentMap.missions[0].icons[0].screens[0].visualCount,1);
 assert.match(summary(r.contentMap),/экранов: 1, визуалов: 1/);
 assert.doesNotThrow(()=>MapExport.auditFingerprint(r.records[1],r.nodes));
});

test('summary shows extra and missing visuals even when aggregate counts match screens',()=>{
 const f=fixture();const extra=node('FRAME');extra.parent=f.device;f.device.children.push(extra);
 const missing=node('FRAME','HORIZONTAL',[node('FRAME','VERTICAL',[txt('Нет материала')]),node('FRAME','VERTICAL',[txt('Справка')])]);missing.parent=f.stack;f.stack.children.push(missing);
 const r=MapExport.scan(f.page,[],'page');
 assert.deepEqual(r.contentMap.missions[0].icons[0].screens.map(s=>s.visualCount),[2,0]);
 assert.match(summary(r.contentMap),/экранов: 2, визуалов: 2 — готовы: 0, требуют разбора: 2/);
});
test('names and coordinates never select content: inner visual and every help text in child order',()=>{
 const f=fixture(),result=MapExport.scan(f.page,[f.root.id],'selection');assert.equal(result.records.length,2);
 const screen=result.records[1];assert.equal(screen.id,f.visual.id);assert.equal(screen.content.iconText,'Новый канал');assert.equal(screen.content.screenOrder,1);
 assert.deepEqual(screen.instruction.blocks.map(t=>t.text),['  Финальный текст\n','Второй блок','Третий блок']);
 const before=JSON.stringify(result);for(const n of all(f.page)){n.name='Misleading '+Math.random();n.x=-1000;}
 assert.equal(JSON.stringify(MapExport.scan(f.page,[f.root.id],'selection')),before);
 assert.ok(!JSON.stringify(screen.instruction).includes('Служебная'));
});
test('actual Auto Layout reorder wins over old metadata and selection click order; no parent-child duplicates',()=>{
 const f=fixture(),second=node('FRAME','HORIZONTAL',[node('FRAME','VERTICAL',[art()]),node('FRAME','VERTICAL',[txt('First now')])]);second.parent=f.stack;f.stack.children.unshift(second);f.row.meta={screenId:'old-1'};
 const r=MapExport.scan(f.page,[f.column.id,f.root.id],'selection');assert.equal(r.contentMap.missions.length,1);
 assert.deepEqual(r.records.filter(r=>r.content.kind==='screen').map(r=>r.instruction.text),['First now','  Финальный текст\n\nВторой блок\nТретий блок']);
 const planned=MapExport.plan(r.records,r.records.map((r,i)=>({id:r.id,include:true,order:99-i,task:'bogus',title:'bogus'})));assert.deepEqual(planned,r.records);
});
test('hidden rows excluded, missing and ambiguous visuals retained as gaps without guessing',()=>{
 const f=fixture();const missing=node('FRAME','HORIZONTAL',[node('FRAME','VERTICAL',[txt('Нет материала')]),node('FRAME','VERTICAL',[txt('Справка')])]);missing.parent=f.stack;f.stack.children.push(missing);
 const extra=node('FRAME','NONE',[art()]);extra.parent=f.device;f.device.children.push(extra);
 const r=MapExport.scan(f.page,[f.root.id],'selection');assert.equal(r.records.length,1);assert.deepEqual(r.contentMap.missions[0].icons[0].screens.map(s=>s.status),['ambiguous','missing-visual']);
 f.row.visible=false;assert.equal(MapExport.scan(f.page,[f.root.id],'selection').contentMap.missions[0].icons[0].screens.length,1);
});
test('no inferred mission from layer name alone',()=>{
 const page=node('PAGE','NONE',[node('FRAME')]);page.children[0].name='Миссия · иконка_задание · справка к заданию';assert.throws(()=>MapExport.scan(page,[],'page'),/Выделите миссию/);
});
test('help edits, icon text and sequence changes invalidate resume fingerprint',()=>{
 const f=fixture(),r=MapExport.scan(f.page,[],'page').records[1],nodes=new Map(all(f.page).map(n=>[n.id,n]));
 const fn=n=>JSON.stringify(all(n).map(n=>[n.id,n.characters]));const fp=()=>MapExport.fingerprint(r,nodes,fn,[]);
 const a=fp();f.help.children[0].characters='Client update';const b=fp();assert.notEqual(a,b);
 f.header.children[1].characters='Icon update';const c=fp();assert.notEqual(b,c);
 f.stack.children.reverse();assert.notEqual(c,fp());
});
test('shared disk store retains mission map, help blocks and PNG path; resume validates saved content',async()=>{
 const base=path.resolve('artifacts/workspace/tests/max-content-exporter');await fs.mkdir(base,{recursive:true});const dir=await fs.mkdtemp(path.join(base,'export-'));
 const f=fixture(),mapped=MapExport.scan(f.page,[],'page'),r={...mapped.records[1],fingerprint:'fixture-v1'},source={fileName:'Fixture',pageId:f.page.id,detection:'max-content-autolayout-v1',contentMap:mapped.contentMap};
 const store=createMaterialsStore(path.join(dir,'out'),path.join(dir,'work')),plan={source,frames:[r],options:{},context:[mapped.contentMap]};
 const run=await store.start(plan);const png=Buffer.from([137,80,78,71]).toString('base64');
 const packet={screens:[{...r,exportStatus:'ok',png,thumbnail:png,texts:r.instruction.blocks}],errors:[],images:[]};
 assert.equal((await store.put(run.id,r.id,packet,'0'.repeat(64))).verified,true);
 const catalog=JSON.parse(await fs.readFile(path.join(run.outputPath,'catalog.json')));assert.deepEqual(catalog.source.contentMap,mapped.contentMap);assert.deepEqual(catalog.screens[0].instruction,r.instruction);assert.ok(catalog.screens[0].pngFile.endsWith('screen.png'));
 assert.deepEqual((await store.start(plan)).completed,[r.id]);
});
test('native export passes ONLY visual to exportAsync, preserves instructions in the server packet',async()=>{
 const f=fixture(),exports=[],messages=[];f.page.selection=[f.root];
 for(const n of all(f.page))n.exportAsync=async settings=>{exports.push([n.id,settings.format]);return new Uint8Array([137,80,78,71]);};
 const figma={currentPage:f.page,root:{name:'Fixture'},showUI(){},base64Encode:b=>Buffer.from(b).toString('base64'),ui:{postMessage(m){messages.push(m);if(m.type==='stream-plan'||m.type==='stream-frame')queueMicrotask(()=>figma.ui.onmessage({type:'stream-ack',job:m.job,key:m.key,completed:[]}));}}};
 const code=await fs.readFile(new URL('code.js',import.meta.url),'utf8');const ctx=vm.createContext({figma,__html__:'',setTimeout,clearTimeout,Uint8Array});vm.runInContext(code,ctx);
 await figma.ui.onmessage({type:'scan',scope:'selection'});const scanned=messages.find(m=>m.type==='scan');assert.ok(scanned);
 await figma.ui.onmessage({type:'export',scanId:scanned.id,streaming:true,structure:false,images:false,edits:scanned.records.map(r=>({id:r.id,include:true}))});
 assert.equal(messages.at(-1).status,'complete');assert.ok(exports.every(([id])=>[f.visual.id,f.header.children[0].id].includes(id)));
 const out=messages.filter(m=>m.type==='stream-frame').at(-1).packet.screens[0];assert.equal(out.instruction.blocks.length,3);assert.equal(out.texts.filter(t=>t.contentRole==='instruction').length,3);
 assert.deepEqual(Object.keys(f.row.meta),[]); // No writes to the document.
});

test('actual builder v2 hierarchy is recognized for all six missions without consulting frame names',async()=>{
 const builderTest=await fs.readFile(new URL('../max-content-builder/plugin.test.mjs',import.meta.url),'utf8');
 const harnessSource=builderTest.slice(builderTest.indexOf('function harness('),builderTest.indexOf("\ntest('all six"));
 const {restoredCatalog}=await import('../max-content-builder/restored-content.mjs');const {ICON_SHAPES}=await import('../../../max-game/src/journey-icons.mjs');
 const builder=await fs.readFile(new URL('../max-content-builder/runtime.js',import.meta.url),'utf8');
 const createHarness=new Function('vm','MISSION_CATALOG','runtime','ICON_SHAPES','assert',harnessSource+';return harness;');
 const h=createHarness(vm,(await restoredCatalog()).catalog,builder,ICON_SHAPES,assert)();
 h.figma.createNodeFromSvg=()=>{const g=h.figma.createFrame(),v=h.figma.createRectangle();v.type='VECTOR';g.appendChild(v);return g;};
 await h.run('build(Object.keys(catalog.missions))');
 const root=h.original.children[0];for(const n of [root,...root.findAll(()=>true)])n.name='Renamed';
 const mapped=MapExport.scan(h.original,[root.id],'selection');
 assert.equal(mapped.contentMap.missions.length,6);
 const screens=mapped.contentMap.missions.flatMap(m=>m.icons.flatMap(i=>i.screens));assert.equal(screens.length,253);
 assert.ok(mapped.records.filter(r=>r.content.kind==='screen').length>180);
 assert.ok(mapped.records.some(r=>r.content.iconText==='Финал миссии'));
});
