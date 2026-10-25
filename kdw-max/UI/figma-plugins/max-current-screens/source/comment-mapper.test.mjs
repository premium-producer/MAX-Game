import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8'),ctx={};vm.runInNewContext(read('comment-mapper.js')+';globalThis.mapper=MaxCommentMapper;',ctx);const M=ctx.mapper,plain=v=>JSON.parse(JSON.stringify(v));
const screen=(nodeId,x,y,w=3072,h=1536)=>({nodeId,name:nodeId,width:w,height:h,transform:[[1,0,x],[0,1,y]],meta:{fixtureId:'business.cafe.'+nodeId,missionId:'business',taskId:'business.channel',screenId:'channel',sector:'cafe',variant:'screen'}});
const layout=()=>({fileKey:'fileA',page:{id:'1:1',name:'Page'},root:{nodeId:'2:1',name:'MAX',width:7000,height:4000,transform:[[1,0,-700],[0,1,800]]},screens:[screen('3:1',-700,800),screen('3:2',-700,2500),screen('3:3',2600,800)],nodes:{'2:1':{pageId:'1:1',inSelection:true,transform:[[1,0,-700],[0,1,800]]},'4:1':{pageId:'1:1',inSelection:true,screenNodeId:'3:2',transform:[[1,0,-700],[0,1,2500]]}}});
const comment=(id,meta,extra={})=>({id,message:'Текст <script> и\nновая строка',client_meta:meta,...extra});
const map=(comments,l=layout(),opts={absolutePageConfirmed:true})=>plain(M.map({comments},l,opts));
test('absolute points use actual moved frame geometry and capture pixel coordinates',()=>{
 const l=layout(),a=map([comment('a',{x:-600,y:900})],l);assert.equal(a.threads[0].screen.nodeId,'3:1');assert.deepEqual(a.threads[0].screenPosition.capturePixels,{x:100,y:100});
 l.screens[0].transform[0][2]+=10000;assert.equal(map([comment('a',{x:-600,y:900})],l).threads[0].status,'unmatched');
 assert.equal(map([comment('a',{x:9400,y:900})],l).threads[0].screen.nodeId,'3:1');
});
test('offsets on container resolve to screen; direct image anchors retain replies and resolved state',()=>{
 const rows=[comment('reply',null,{parent_id:'root',message:'Ответ',created_at:'2026-10-22T00:00:00Z'}),comment('root',{node_id:'4:1',node_offset:{x:25,y:40}},{resolved_at:'2026-10-23T00:00:00Z',created_at:'2026-10-21T00:00:00Z'})];
 const a=map(rows);assert.equal(a.threads.length,1);assert.equal(a.threads[0].screen.nodeId,'3:2');assert.equal(a.threads[0].comments[1].message,'Ответ');assert.ok(a.threads[0].resolvedAt);
 const b=map([comment('root',{node_id:'2:1',node_offset:{x:4000,y:200}})]);assert.equal(b.threads[0].screen.nodeId,'3:3');assert.equal(b.threads[0].reason,'point-inside');
});
test('scaled and rotated screens use inverse transforms, not bounding rectangles',()=>{
 const l=layout();l.screens=[screen('r',0,0,100,100)];l.screens[0].transform=[[0,-2,1000],[2,0,300]];
 const a=map([comment('a',{x:950,y:350})],l);assert.equal(a.threads[0].status,'matched');assert.deepEqual(a.threads[0].screenPosition.capturePixels,{x:768,y:384});
 assert.equal(map([comment('b',{x:1010,y:350})],l).threads[0].status,'unmatched');
});
test('region corner determines bounds; multi-screen and partly outside regions require review',()=>{
 for(const corner of ['top-left','top-right','bottom-left','bottom-right']){
  const x=-600+(corner.endsWith('right')?200:0),y=900+(corner.startsWith('bottom')?100:0);
  const a=map([comment('a',{x,y,region_width:200,region_height:100,comment_pin_corner:corner})]);assert.equal(a.threads[0].screen.nodeId,'3:1');assert.equal(Math.min(...a.threads[0].geometry.polygon.map(p=>p.x)),-600);
 }
 assert.equal(map([comment('a',{x:0,y:2700,region_width:200,region_height:500})]).threads[0].status,'ambiguous');
 assert.equal(map([comment('a',{x:-650,y:900,region_width:200,region_height:100})]).threads[0].status,'review');
});
test('gaps, overlapping screens, missing anchors, pages and wrong files never silently assign',()=>{
 assert.equal(map([comment('a',{x:0,y:2400})]).threads[0].status,'unmatched');
 const l=layout();l.screens.push({...l.screens[0],nodeId:'duplicate'});assert.equal(map([comment('a',{x:0,y:900})],l).threads[0].status,'ambiguous');
 assert.equal(map([comment('a',{x:0,y:900})],layout(),{}).threads[0].reason,'absolute-page-unverified');
 assert.equal(map([comment('a',{x:0,y:900},{page_id:'9:9'})]).threads[0].status,'outside');
 assert.equal(map([comment('a',{node_id:'missing',node_offset:{x:0,y:0}})]).threads[0].reason,'anchor-missing');
 l.nodes['else']={pageId:'1:1',inSelection:false,transform:[[1,0,0],[0,1,900]]};assert.equal(map([comment('a',{node_id:'else',node_offset:{x:0,y:0}})],l).threads[0].status,'outside');
 assert.throws(()=>map([comment('a',{x:0,y:900},{file_key:'fileB'})]),/другому файлу/);
});
test('malformed data and incomplete reply trees are explicit; MD groups by fixture, not screen name',()=>{
 assert.throws(()=>M.parse({comments:[{id:'a'}]}),/message/);assert.throws(()=>map([comment('a',null),comment('a',null)]),/уникальный/);
 const a=map([comment('a',null,{parent_id:'missing'}),comment('b',null,{parent_id:'c'}),comment('c',null,{parent_id:'b'}),comment('d',{x:0,y:900})]);
 assert.equal(a.threads[0].reason,'parent-missing');assert.equal(a.threads[1].reason,'parent-cycle');assert.match(M.markdown(a),/business.cafe.3:1/);assert.match(M.markdown(a),/Без однозначной привязки/);
});
test('runtime scans existing selected frames without pack, does not mutate, rejects invalid selection',async()=>{
 let events=[],lookups=0;const make=(id,type,meta,transform,width=3072,height=1536)=>({id,type,name:id,width,height,absoluteTransform:transform,children:[],getPluginData:()=>JSON.stringify(meta)});
 const page=make('1:1','PAGE',{},null),root=make('2:1','FRAME',{owner:'max-current-screens'},[[1,0,-500],[0,1,100]]),frame=make('3:1','FRAME',{role:'screen',fixtureId:'fixture',screenId:'screen'},[[1,0,-300],[0,1,200]]),photo=make('4:1','RECTANGLE',{},frame.absoluteTransform);
 page.children=[root];root.parent=page;root.children=[frame];frame.parent=root;frame.children=[photo];photo.parent=frame;page.selection=[root];
 const figma={currentPage:page,fileKey:'fileA',showUI(){},getNodeByIdAsync:async()=>{lookups++;return null;},ui:{postMessage:m=>events.push(m)}};
 vm.runInNewContext(read('../code.js'),{figma,__html__:'',setTimeout,clearTimeout,Uint8Array});
 const input={type:'comments-map',data:{comments:[comment('a',{node_id:'4:1',node_offset:{x:10,y:10}})]}};
 await figma.ui.onmessage(input);let result=events.at(-1);assert.equal(result.type,'comments-result');assert.equal(result.data.threads[0].screen.fixtureId,'fixture');assert.equal(lookups,0);assert.equal(frame.children.length,1);
 // Re-read positions after a manual move, not a cached creation-time grid.
 photo.absoluteTransform=[[1,0,700],[0,1,600]];frame.absoluteTransform=photo.absoluteTransform;
 await figma.ui.onmessage(input);assert.equal(events.at(-1).data.threads[0].geometry.pin.x,710);
 page.selection=[];await figma.ui.onmessage(input);assert.equal(events.at(-1).type,'comments-error');assert.match(events.at(-1).message,/Выделите/);
});
