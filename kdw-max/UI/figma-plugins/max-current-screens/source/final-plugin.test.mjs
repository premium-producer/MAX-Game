import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const dir=new URL('.',import.meta.url),plugin=new URL('../',dir),read=p=>fs.readFileSync(new URL(p,dir),'utf8'),index=JSON.parse(read('../content-index.json')),fixtures=JSON.parse(read('final-fixtures.json')),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),sharp=createRequire(import.meta.url)('../../../../apps/max-game/source/client/node_modules/sharp');
function environment({delay=0,bad=false}={}){
 let serial=0,loads=0;const events=[];
 class Node{constructor(type){this.id=String(++serial);this.type=type;this.children=[];this.width=this.height=100;this.x=this.y=0;this.data={};this.fills=[];}
  appendChild(c){if(c.parent)c.parent.children=c.parent.children.filter(n=>n!==c);this.children.push(c);c.parent=this;}
  resize(w,h){assert.ok(w>0&&h>0);this.width=w;this.height=h;}
  setPluginData(k,v){this.data[k]=v}getPluginData(k){return this.data[k]??''}
  findAll(fn){return this.children.flatMap(c=>[...(fn(c)?[c]:[]),...c.findAll(fn)])}
  get absoluteBoundingBox(){return {x:this.x,y:this.y,width:this.width,height:this.height}}
 }
 const page=new Node('PAGE');page.selection=[];
 const figma={currentPage:page,viewport:{center:{x:50,y:80},scrollAndZoomIntoView(){}},showUI(){},createFrame:()=>new Node('FRAME'),createRectangle:()=>new Node('RECTANGLE'),createText(){throw Error('Screenshot mode must never reconstruct text')},createNodeFromSvg(){throw Error('Screenshot mode must never reconstruct SVG')},createImage(b){assert.deepEqual(Array.from(b.subarray(0,8)),[137,80,78,71,13,10,26,10]);return {hash:sha(b)}},ui:{postMessage(m){events.push(m);if(m.type==='asset'){loads++;setTimeout(()=>{const b=new Uint8Array(fs.readFileSync(new URL(index.assets[m.id].localPath,plugin)));if(bad)b[0]=0;figma.ui.onmessage({type:'asset-result',request:m.request,bytes:b});},delay);}}}};
 vm.runInNewContext(read('../code.js'),{figma,__html__:'',setTimeout,clearTimeout,console,Uint8Array});
 return {figma,page,events,Node,get loads(){return loads},ready(hash=index.transport.indexSha256){figma.ui.onmessage({type:'media-ready',indexSha256:hash})},async build(o={}){await figma.ui.onmessage({type:'build',missionIds:['blogger','digital-id','communication','business'],sectors:['cafe','flowers','auto'],shared:true,...o});return page.children.at(-1);}};
}
const metadata=n=>JSON.parse(n.getPluginData('maxClean')||'{}'),screens=n=>n.findAll(n=>metadata(n).role==='screen');
test('generated plugin imports every final capture as a single locked full-resolution PNG, no reconstruction',async()=>{
 const e=environment();e.ready();const root=await e.build();assert.match(e.events.at(-1).text,/Готово/);const frames=screens(root);assert.equal(frames.length,index.summary.frames);
 for(const n of frames){assert.equal(n.width,3072);assert.equal(n.height,1536);assert.equal(n.children.length,1);const photo=n.children[0];assert.equal(photo.type,'RECTANGLE');assert.equal(photo.width,3072);assert.equal(photo.height,1536);assert.equal(photo.x,0);assert.equal(photo.y,0);assert.equal(photo.locked,true);assert.equal(photo.fills[0].imageHash,metadata(n).sha256);assert.equal(photo.fills[0].scaleMode,'FILL');assert.equal(metadata(n).renderMode,'screenshot');}
 assert.equal(root.findAll(n=>n.type==='TEXT'||n.type==='INSTANCE'||n.type==='COMPONENT').length,0);assert.equal(e.loads,index.summary.assets);
 e.page.selection=[root];await e.figma.ui.onmessage({type:'export'});const data=e.events.at(-1).data;assert.equal(data.readOnly,true);assert.equal(data.changes.length,0);assert.equal(data.coverage.screens,index.summary.uniqueScreens);assert.equal(data.schema,'max-clean-screen-texts/v1');
});
test('current mission/business filters, repeat and empty selection preserve existing document',async()=>{
 const e=environment();e.ready();const old=new e.Node('FRAME');old.name='Сохранить';e.page.appendChild(old);const root=await e.build({missionIds:['business'],sectors:['auto'],shared:false});assert.ok(screens(root).length>20);assert.ok(screens(root).every(n=>metadata(n).sector==='auto'));assert.equal(old.name,'Сохранить');const next=await e.build({missionIds:['communication'],shared:false});assert.notEqual(next,root);assert.ok(screens(next).every(n=>metadata(n).missionId==='communication'));const count=e.page.children.length;await e.build({missionIds:[],sectors:[],shared:false});assert.equal(e.page.children.length,count);assert.match(e.events.at(-1).text,/Выберите/);
});
test('wrong pack blocks build, bad image has context, cancellation creates no empty screen and can restart',async()=>{
 const blocked=environment();blocked.ready('0'.repeat(64));await blocked.build();assert.equal(blocked.page.children.length,0);assert.match(blocked.events.at(-1).text,/Выберите screens/);
 const broken=environment({bad:true});broken.ready();const failed=await broken.build();assert.match(broken.events.at(-1).text,/shared.standby.png: Неверный формат PNG/);assert.equal(screens(failed).length,0);
 const e=environment({delay:20});e.ready();const p=e.build();setTimeout(()=>e.figma.ui.onmessage({type:'cancel'}),2);await p;assert.match(e.events.at(-1).text,/Остановлено/);assert.equal(screens(e.page.children.at(-1)).length,0);await e.build({missionIds:[],shared:true});assert.match(e.events.at(-1).text,/Готово: 1/);
});
test('all current routes and extra interaction states are covered with final projection and production provenance',()=>{
 assert.ok(fixtures.omittedTransitions.length>0);
 for(const omitted of fixtures.omittedTransitions){assert.ok(!index.frames.some(f=>f.id===omitted.id));assert.ok(index.frames.some(f=>f.id===omitted.representedBy));}
 for(const f of index.frames.filter(f=>f.variant==='result'))assert.equal(index.frames.filter(p=>p.screenId===f.screenId&&p.sector===f.sector).length,1,'No duplicate completion frame: '+f.id);
 for(const f of index.frames)for(const b of f.diagnostics?.actionButtons??[]){assert.ok(b.lines===1||(!b.transition&&b.lines===2));assert.equal(b.textOverflow,0);assert.ok(b.horizontalInset>=.04&&b.verticalInset>=.015);assert.ok(b.font.includes('Max Sans'));assert.ok(Math.abs(b.fontSize-23/390)<.001);assert.ok(Math.abs(b.height-(b.lines===2?96:64)/390)<.001);}
 for(const id of ['digital-id.benefit.present','digital-id.age.present'])assert.equal(index.frames.find(f=>f.screenId===id).diagnostics.actionButtons[0].lines,2);
 assert.equal(index.renderMode,'screenshot');assert.deepEqual(Object.keys(index.sectors).sort(),['auto','cafe','flowers']);assert.equal(index.frames.length,fixtures.fixtures.length+1);assert.equal(new Set(index.frames.map(f=>f.id)).size,index.frames.length);
 for(const f of fixtures.fixtures){const row=index.frames.find(r=>r.id===f.id);assert.ok(row,f.id);assert.equal(row.width,3072);assert.equal(row.height,1536);assert.equal(row.diagnostics.state.pixelMap,true);assert.equal(row.diagnostics.state.production,true);assert.equal(row.diagnostics.state.development,false);assert.deepEqual(row.diagnostics.forbidden,[]);assert.ok(!row.diagnostics.timer?.includes('--'));assert.equal(row.diagnostics.state.viewport.width,3072);assert.equal(row.diagnostics.state.viewport.height,1536);assert.ok(row.diagnostics.state.contentPresence>.995);}
 for(const sector of Object.keys(index.sectors))for(const taskId of ['business.channel','business.store'])for(const variant of ['activity','success'])assert.ok(index.frames.some(f=>f.sector===sector&&f.taskId===taskId&&f.variant===variant));assert.equal(index.frames.filter(f=>f.variant==='keyboard').length,2);
 const root=new URL('../../../../',dir),live=fs.readFileSync(new URL('apps/max-game/www/webgl-v5/app.js',root));assert.equal(sha(live),index.provenance.sourceBuild.bundleSha256);assert.equal(index.provenance.productionBundleSha256,index.provenance.sourceBuild.bundleSha256);
});
test('every PNG fully decodes at native size with alpha intact; bytes and SHA match source capture and binary',async()=>{
 const file=fs.readFileSync(new URL('../screens.maxscreens',dir)),start='MAXSCREENPACK1\n'.length+4,size=file.readUInt32LE(start-4),raw=file.subarray(start,start+size);assert.equal(sha(raw),index.transport.indexSha256);const base=start+size;
 for(const f of index.frames){const a=index.assets[f.image],b=file.subarray(base+a.offset,base+a.offset+a.bytes);assert.equal(sha(b),a.sha256,f.id);assert.equal(sha(fs.readFileSync(new URL(a.localPath,plugin))),a.sha256);const {info}=await sharp(b).raw().toBuffer({resolveWithObject:true});assert.equal(info.width,3072);assert.equal(info.height,1536);assert.ok(a.bytes<8*1024*1024);}
 assert.ok(fs.statSync(new URL('../ui.html',dir)).size<20000);assert.ok(fs.statSync(new URL('../code.js',dir)).size<1500000);assert.ok(!read('../ui.html').includes('data:image/'));
});
test('opaque-origin SHA fallback reads only index then one PNG, rejects stale/truncated/tampered input',async()=>{
 const context={Uint8Array,Int32Array,DataView,TextDecoder,console};vm.runInNewContext(read('pack-reader.js'),context);const {open}=context.MaxScreenPack,fd=fs.openSync(new URL('../screens.maxscreens',dir)),file={size:fs.fstatSync(fd).size,slice(a,b){return {arrayBuffer:async()=>{const bytes=Buffer.alloc(b-a);fs.readSync(fd,bytes,0,bytes.length,a);return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);}}}};
 try{const r=await open(file,index.transport.indexSha256);assert.ok(r.stats.totalRead<1024*1024);assert.equal(r.count,index.summary.frames);const id=Object.keys(index.assets)[0];assert.equal(sha(await r.read(id)),index.assets[id].sha256);assert.equal(r.stats.maxInFlight,1);assert.ok(r.stats.maxRead<8*1024*1024);await assert.rejects(open(file,'0'.repeat(64)),/другой версии/);await assert.rejects(open({...file,size:file.size-1},index.transport.indexSha256),/Неполный/);
 const bad={...file,slice(a,b){const row=file.slice(a,b);return {arrayBuffer:async()=>{const v=new Uint8Array(await row.arrayBuffer());if(a>1024*1024)v[0]^=1;return v.buffer;}}}};const corrupt=await open(bad,index.transport.indexSha256),last=Object.keys(index.assets).at(-1);await assert.rejects(corrupt.read(last),/Повреждён/);
 }finally{fs.closeSync(fd);}
});
