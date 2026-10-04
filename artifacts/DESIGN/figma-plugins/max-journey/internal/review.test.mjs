import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const core=vm.runInNewContext(read('review-core.js')+'\nMAXReview',{Date,Map,Set,Math,Number,Array,Error});
const screen=(id,x,y=0)=>({nodeId:id,pageId:'page',ancestorIds:['group','page'],width:1600,height:1000,bounds:{x,y,width:1600,height:1000},absoluteTransform:[[1,0,x],[0,1,y]],visible:true,source:{id:'same-screen',mission:'blogger'}});
const map=()=>({page:{id:'page',name:'MAX'},selectedNodeIds:['group'],screens:[screen('a',0),screen('b',1680)],anchors:{inside:{pageId:'page',ancestorIds:['a','group','page'],absoluteTransform:[[1,0,100],[0,1,100]]},outside:{pageId:'other',ancestorIds:['other-screen','other'],absoluteTransform:[[1,0,0],[0,1,0]]},group:{pageId:'page',ancestorIds:['page'],absoluteTransform:[[1,0,0],[0,1,0]]}},warnings:[]});
test('explicit node binding, container offset, outside selection and missing nodes',()=>{
 assert.equal(core.match({node_id:'inside',node_offset:{x:4,y:8}},map()).status,'bound');
 assert.equal(core.match({node_id:'group',node_offset:{x:100,y:100}},map()).status,'contained');
 assert.equal(core.match({node_id:'outside',node_offset:{x:1,y:1}},map()).status,'outside-selection');
 assert.equal(core.match({node_id:'deleted',node_offset:{x:1,y:1}},map()).reason,'unknown-node');
});
test('free points require explicit page assumption; shared gap and overlap stay ambiguous',()=>{
 assert.equal(core.match({x:100,y:100},map()).status,'unknown-page');
 assert.equal(core.match({x:100,y:100},map(),'page').status,'contained');
 assert.equal(core.match({x:1640,y:100},map(),'page').status,'ambiguous');
 assert.equal(core.match({x:1620,y:100},map(),'page').status,'nearby');
 assert.equal(core.match({x:10000,y:100},map(),'page').status,'unassigned');
 const overlap=map();overlap.screens[1]=screen('b',10);assert.equal(core.match({x:20,y:100},overlap,'page').status,'ambiguous');
});
test('region uses pin corner and preserves multiple affected screens',()=>{
 for(const corner of ['top-left','top-right','bottom-left','bottom-right']){
  const g=core.geometry({x:100,y:100,region_width:50,region_height:30,comment_pin_corner:corner},{});
  assert.equal(g.region[0].x,corner.endsWith('right')?50:100);assert.equal(g.region[0].y,corner.startsWith('bottom')?70:100);
 }
 const m=core.match({x:1700,y:200,region_width:200,region_height:100},map(),'page');assert.equal(m.status,'multi-screen');assert.equal(m.screenIds.length,2);
});
test('rotated and scaled screens use local geometry instead of shadow bounds',()=>{
 const m=map();m.screens=[{...screen('rotated',0),width:100,height:100,absoluteTransform:[[0,-2,200],[2,0,0]],bounds:{x:0,y:0,width:200,height:200}}];
 assert.equal(core.match({x:100,y:100},m,'page').status,'contained');assert.equal(core.match({x:210,y:100},m,'page').status,'nearby');
});
test('single JSON preserves source replies/status and every unmatched record',()=>{
 const raw=[{id:'root',file_key:'FileABC',message:'Правка',user:{id:'client'},resolved_at:'2026-10-01T00:00:00Z',client_meta:{x:100,y:100}},{id:'reply',parent_id:'root',message:'Ответ'},{id:'orphan',parent_id:'deleted',message:'Без корня'},{id:'empty',message:'Общее'}];
 const output=core.assemble(map(),raw,{fileKey:'FileABC',assumeCurrentPage:true});
 assert.equal(output.commentMap.length,4);assert.equal(output.threads.length,2);assert.equal(output.commentMap[1].association.inheritedFrom,'root');assert.equal(output.commentMap[0].resolved_at,raw[0].resolved_at);assert.equal(output.unassignedCommentIds.length,2);assert.equal(output.commentMap[2].association.reason,'missing-or-cyclic-parent');assert.equal(raw[0].association,undefined);
 assert.throws(()=>core.assemble(map(),[{id:'x',file_key:'wrong'}],{fileKey:'FileABC'}),/другому файлу/);
 assert.throws(()=>core.assemble(map(),[{id:'x'},{id:'x'}],{fileKey:'FileABC'}),/повторяющиеся/);
});
test('repeat screen source IDs retain distinct Figma nodes; cycles remain unassigned',()=>{
 const raw=[{id:'1',parent_id:'2'},{id:'2',parent_id:'1'}],out=core.assemble(map(),raw,{fileKey:'FileABC'});assert.equal(out.screenMap.length,2);assert.notEqual(out.screenMap[0].nodeId,out.screenMap[1].nodeId);assert.equal(out.unassignedCommentIds.length,2);
});
function sandbox(){
 const nodes=new Map(),messages=[];let created=0;
 class Node{constructor(id,type,name,x=0,y=0,w=1600,h=1000){Object.assign(this,{id,type,name,x,y,width:w,height:h,visible:true,children:[],data:{}});nodes.set(id,this);}appendChild(n){this.children.push(n);n.parent=this;}getPluginData(k){return this.data[k]||'';}setRelaunchData(){}get absoluteTransform(){const parent=this.parent?.type==='FRAME'?this.parent.absoluteTransform:[[1,0,0],[0,1,0]];return [[1,0,parent[0][2]+this.x],[0,1,parent[1][2]+this.y]];}get absoluteBoundingBox(){const m=this.absoluteTransform;return {x:m[0][2],y:m[1][2],width:this.width,height:this.height};}}
 const page=new Node('page','PAGE','MAX'),group=new Node('group','FRAME','Миссия',400,50,5000,2000);page.appendChild(group);const a=new Node('a','FRAME','Канал'),b=new Node('b','FRAME','Канал · дубль',1680);a.data['max-source']=JSON.stringify({id:'channel-task',mission:'blogger',stage:0});b.data['max-source']=a.data['max-source'];group.appendChild(a);group.appendChild(b);const layer=new Node('layer','RECTANGLE','Кнопка',100,100,20,20);a.appendChild(layer);page.selection=[group,a];
 const figma={root:{setRelaunchData(){}},currentPage:page,fileKey:'FileABC',ui:{postMessage:m=>messages.push(m)},showUI(){},async getNodeByIdAsync(id){return nodes.get(id)||null;},createFrame(){created++;throw Error('Unexpected mutation');}};
 vm.runInNewContext(read('code.js'),{figma,__html__:'test',Date,Map,Set,Math,Number,Array,JSON,Error,Uint8Array});return {figma,messages,page,a,b,nodes,get created(){return created;}};
}
test('compiled sandbox exports selected mission descendants without creating frames',async()=>{
 const h=sandbox();const selection=h.page.selection;h.a.x=300;
 await h.figma.ui.onmessage({type:'review-export',requestId:1,fileKey:'FileABC',comments:[{id:'r',client_meta:{node_id:'layer',node_offset:{x:1,y:1}}}],assumeCurrentPage:true});
 const result=h.messages.at(-1);assert.equal(result.type,'review-result');assert.equal(result.result.screenMap.length,2);assert.equal(result.result.screenMap[0].bounds.x,700);assert.equal(result.result.commentMap[0].association.status,'bound');assert.equal(h.created,0);assert.equal(h.page.selection,selection);
 await h.figma.ui.onmessage({type:'review-export',requestId:2,fileKey:'FileABC',comments:[]});assert.equal(h.messages.at(-1).type,'review-result');
});
test('sandbox fails visibly on empty selection or wrong file',async()=>{
 const h=sandbox();h.page.selection=[];await h.figma.ui.onmessage({type:'review-export',requestId:1,fileKey:'FileABC',comments:[]});assert.equal(h.messages.at(-1).type,'review-error');
 h.page.selection=[h.a];await h.figma.ui.onmessage({type:'review-export',requestId:2,fileKey:'wrongFile',comments:[]});assert.match(h.messages.at(-1).error,/открытому файлу/);
});
test('sandbox cancel during anchor lookup does not produce obsolete JSON',async()=>{
 const h=sandbox();let release;const lookup=h.figma.getNodeByIdAsync;h.figma.getNodeByIdAsync=id=>new Promise(resolve=>{release=()=>lookup(id).then(resolve);});
 const pending=h.figma.ui.onmessage({type:'review-export',requestId:5,fileKey:'FileABC',comments:[{id:'r',client_meta:{node_id:'layer',node_offset:{x:1,y:1}}}]});
 await h.figma.ui.onmessage({type:'review-cancel',requestId:5});release();await pending;assert.equal(h.messages.at(-1).type,'review-error');assert.match(h.messages.at(-1).error,/остановлен/);assert(!h.messages.some(m=>m.type==='review-result'));
});
test('UI fetches once, clears credential and downloads one JSON without renderer',async()=>{
 const elements=new Map(),sent=[],listeners={},blobs=[];let calls=0;
 const el=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:false,files:[],dataset:{},click(){this.clicked=true;}});return elements.get(id);};el('review-file').value='https://www.figma.com/design/FileABC/MAX';el('review-token').value='fixture-credential';
 class LocalURL extends URL{static createObjectURL(blob){blobs.push(blob);return 'blob:fixture';}static revokeObjectURL(){}}
 const context={$:el,active:false,isPreview:false,post:m=>sent.push(m),window:{addEventListener:(t,fn)=>listeners[t]=fn},URL:LocalURL,Blob,AbortController,Date,JSON,Error,setTimeout,clearTimeout,fetch:async(url,options)=>{calls++;assert.match(url,/api\.figma\.com\/v1\/files\/FileABC\/comments$/);assert.equal(options.headers['X-Figma-Token'],'fixture-credential');return {ok:true,async text(){return JSON.stringify({comments:[{id:'c',message:'Change'}]});}};}};
 vm.runInNewContext(read('review-ui.js'),context);await el('review-export').onclick();assert.equal(calls,1);assert.equal(el('review-token').value,'');assert.equal(sent.at(-1).type,'review-export');assert(!JSON.stringify(sent).includes('fixture-credential'));
 listeners.message({data:{pluginMessage:{type:'review-result',requestId:1,result:{summary:{screens:2,comments:1},unassignedCommentIds:[],commentMap:[]}}}});assert.equal(blobs.length,1);assert.equal(el('review-download').download,'max-review.json');assert(el('review-download').clicked);assert(!await blobs[0].text().then(t=>t.includes('fixture-credential')));assert.equal(el('run').disabled,false);
});
test('plugin-only build manifest matches sources and preserves archived game payload',()=>{
 const manifest=JSON.parse(read('plugin-build.json'));for(const [name,sha]of Object.entries(manifest.files)){const bytes=fs.readFileSync(new URL('../../../../../'+name,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),sha,name);}
 const html=read('ui.html'),start=html.indexOf('const DATA='),end=html.indexOf(';\nconst $=',start),crlf=html.indexOf(';\r\nconst $=',start),payload=JSON.parse(html.slice(start+'const DATA='.length,end>=0?end:crlf));assert.equal(createHash('sha256').update(Buffer.from(payload.html,'base64')).digest('hex'),manifest.retainedGameSha256);assert.match(html,/review-export/);new vm.Script(html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')));
});
test('existing screen-build UI retains renderer handshake with the new review listener',async()=>{
 const elements=new Map(),listeners=[],sent=[],renderSent=[];let renderer;
 const el=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:false,hidden:false,dataset:{},style:{},setAttribute(){}});return elements.get(id);};el('edition').value='reveal';el('mission').value='all';el('scope').value='sample';
 const data={html:Buffer.from('<html></html>').toString('base64'),catalogs:{reveal:[{id:'fixture',kind:'task',name:'Канал',group:'Блогер',width:1600,height:1000}]},sources:{},revision:'retained'};
 const source=read('ui.template.html').replace('/*__MAX_PAYLOAD__*/',()=>`const DATA=${JSON.stringify(data)};`).replace('/*__MAX_REVIEW_UI__*/',()=>read('review-ui.js'));
 const script=source.slice(source.indexOf('<script>')+8,source.lastIndexOf('</script>'));
 const parent={postMessage:m=>sent.push(m.pluginMessage)},window={addEventListener:(type,fn)=>listeners.push(fn)},document={getElementById:el,body:{append(){}},createElement(){renderer={style:{},contentWindow:{postMessage:m=>renderSent.push(m)},setAttribute(){},remove(){this.removed=true;}};return renderer;}};
 vm.runInNewContext(script,{document,parent,window,TextDecoder,Uint8Array,atob,setTimeout,clearTimeout});const turn=()=>new Promise(resolve=>setImmediate(resolve)),deliver=event=>listeners.forEach(fn=>fn(event));
 const pending=el('run').onclick();assert.equal(el('review-export').disabled,true);deliver({source:renderer.contentWindow,data:{type:'max-render-ready'}});await turn();assert.equal(sent.at(-1).type,'start');
 deliver({source:null,data:{pluginMessage:{type:'started',fontAvailable:false}}});await turn();const request=renderSent.at(-1);assert.equal(request.type,'max-export-screen');
 deliver({source:renderer.contentWindow,data:{type:'max-export-result',token:request.token,result:{id:'fixture',reference:'data:image/png;base64,AA=='}}});await turn();assert.equal(sent.at(-1).type,'screen');
 deliver({source:null,data:{pluginMessage:{type:'screen-added',id:'fixture'}}});await pending;assert.equal(sent.at(-1).type,'finish');deliver({source:null,data:{pluginMessage:{type:'finished',count:1}}});assert(renderer.removed);assert.equal(el('review-export').disabled,false);
});
