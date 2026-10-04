import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {planScreens,selectScreens} from './catalog.mjs';
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(await fs.readFile(new URL('catalog.json',root),'utf8'));
const code=await fs.readFile(new URL('code.js',root),'utf8');
const ui=await fs.readFile(new URL('ui.html',root),'utf8');
test('84 real screenshots; 20 core screens; all missions covered',()=>{
 assert.equal(catalog.length,84);assert.equal(new Set(catalog.map(s=>s.file)).size,84);
 assert.equal(selectScreens(catalog,{set:'core'}).length,20);
 for(const mission of ['blogger','id','communication','business'])assert.equal(selectScreens(catalog,{set:'core',mission}).length,5);
 assert.ok(catalog.every(s=>s.width>0&&s.height>0));
});
test('all layout options preserve ratio, containment, ordering and separation',()=>{
 for(const width of ['native','640','1280'])for(const columns of [3,4,5]){
  const groups=planScreens(catalog,{width,columns});let bottom=-1,count=0;
  for(const g of groups){assert.ok(g.y>bottom);bottom=g.y+g.h;let rowBottom=0;
   for(const r of g.rows){assert.ok(r.y>=rowBottom);rowBottom=r.y+r.h;assert.ok(rowBottom<g.h);assert.ok(r.x+r.w<g.w);
    for(const [i,e]of r.items.entries()){
     count++;assert.ok(Math.abs(e.w/e.h-e.width/e.height)<1e-8);assert.ok(e.x+e.w<=r.w);assert.ok(e.y+e.h+78<=r.h);
     for(const other of r.items.slice(i+1))assert.ok(e.x+e.w<=other.x||other.x+other.w<=e.x||e.y+e.h+78<=other.y||other.y+other.h+78<=e.y);
    }
   }
  }
  assert.equal(count,84);
 }
});
test('UI parses and contains all embedded screenshots unchanged',async()=>{
 const js=ui.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(js);
 const raw=js.match(/const DATA=(\[[\s\S]*?\]);\r?\nconst \$/)[1],data=JSON.parse(raw);
 for(const s of data){const file=await fs.readFile(new URL('../../../reports/max-client-screens-20260928/'+s.file,root));assert.deepEqual(Buffer.from(s.base64,'base64'),file);}
 assert.equal(data.length,84);
});
function environment(fontFailure=false){
 const nodes=[],messages=[];
 const node=type=>{const n={type,children:[],x:0,y:0,width:100,height:100,appendChild(child){if(child.parent)child.parent.children=child.parent.children.filter(c=>c!==child);this.children.push(child);child.parent=this;},resize(w,h){this.width=w;this.height=h;},resizeWithoutConstraints(w,h){this.resize(w,h);},setPluginData(){}};nodes.push(n);return n;};
 const original=node('PAGE');const figma={currentPage:original,showUI(){},ui:{postMessage(m){messages.push(m);}},loadFontAsync:async()=>{if(fontFailure)throw Error('Font unavailable');},createPage:()=>{throw Error('Must not create pages');},setCurrentPageAsync:async()=>{throw Error('Must not switch pages');},createSection:()=>node('SECTION'),createFrame:()=>node('FRAME'),createRectangle:()=>node('RECTANGLE'),createText:()=>node('TEXT'),createImage:()=>({hash:'image'}),viewport:{center:{x:500,y:300},scrollAndZoomIntoView(){}}};
 vm.runInNewContext(code,{figma,__html__:'',Uint8Array,Date,console});return {figma,nodes,messages,original};
}
test('sandbox imports 84 frames via sequential ACK on current page',async()=>{
 const env=environment();await env.figma.ui.onmessage({type:'start',id:'test',options:{}});
 for(let i=0;i<84;i++){
  const msg=env.messages.at(-1);assert.equal(msg.type,'need-image');assert.equal(msg.index,i);
  const bytes=await fs.readFile(new URL('../../../reports/max-client-screens-20260928/'+msg.file,root));
  await env.figma.ui.onmessage({type:'image',id:'test',index:i,file:msg.file,bytes});
 }
 assert.equal(env.messages.at(-1).type,'done');assert.equal(env.messages.at(-1).count,84);
 assert.equal(env.nodes.filter(n=>n.type==='FRAME').length,84);assert.equal(env.original.children.length,6);
 assert.equal(env.nodes.filter(n=>n.type==='PAGE').length,1);assert.equal(env.figma.currentPage,env.original);
 assert.equal(env.original.children[0].x,500);assert.equal(env.original.children[0].y,300);
 assert.equal(env.figma.currentPage.selection.length,6);
});
test('existing artwork and page name preserved; imports start beyond rendered bounds',async()=>{
 const env=environment();env.original.name='Existing page';
 const artwork={x:0,y:0,width:100,height:100,absoluteRenderBounds:{x:-50,y:-70,width:400,height:300},children:[]};env.original.appendChild(artwork);
 await env.figma.ui.onmessage({type:'start',id:'a',options:{set:'core'}});
 assert.equal(env.original.name,'Existing page');assert.equal(env.original.children[0],artwork);
 assert.equal(env.original.children[1].x,590);assert.equal(env.original.children[1].y,-70);
 await env.figma.ui.onmessage({type:'cancel'});
 const previousRight=Math.max(...env.original.children.map(n=>n.x+n.width));
 await env.figma.ui.onmessage({type:'start',id:'b',options:{mission:'blogger',set:'core'}});
 assert.ok(env.original.children.at(-1).x>=previousRight+240);
});
test('page captured before font loading; manual page change is respected',async()=>{
 const env=environment();let finishFont;env.figma.loadFontAsync=()=>new Promise(resolve=>{finishFont=resolve;});
 const start=env.figma.ui.onmessage({type:'start',id:'a',options:{set:'core'}});
 const other={children:[],selection:['keep']};env.figma.currentPage=other;finishFont();await start;
 assert.equal(env.original.children.length,4);assert.equal(other.children.length,0);
 await env.figma.ui.onmessage({type:'cancel'});assert.equal(env.figma.currentPage,other);assert.deepEqual(other.selection,['keep']);
});
test('cancel ignores late image and allows fresh run; font error creates no page',async()=>{
 const env=environment();await env.figma.ui.onmessage({type:'start',id:'a',options:{set:'core'}});
 const req=env.messages.at(-1);await env.figma.ui.onmessage({type:'cancel'});
 await env.figma.ui.onmessage({...req,type:'image',bytes:[1,2]});assert.equal(env.nodes.filter(n=>n.type==='FRAME').length,0);
 await env.figma.ui.onmessage({type:'start',id:'b',options:{mission:'blogger',set:'core'}});assert.equal(env.messages.at(-1).total,5);
 const failed=environment(true);await failed.figma.ui.onmessage({type:'start',id:'c',options:{}});assert.equal(failed.nodes.filter(n=>n.type==='PAGE').length,1);assert.equal(failed.messages.at(-1).type,'error');
});
