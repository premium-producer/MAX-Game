import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createArchiveServer} from '../pdf-export/internal/server.mjs';
let instance,base,roots;
const sha=b=>createHash('sha256').update(b).digest('hex');
const frames=[1,2].map(i=>({id:'1:'+i,name:`Комментарий — ${i} (экран)`,fingerprint:'fingerprint-'+i,containerPath:[{id:'section',name:'Комментарии'},{id:'sub',name:'Ответы'}]}));
const spec=()=>({source:{fileKey:'fixture',pageId:'p',pageName:'Страница'},frames,options:{structure:true,svg:true,images:true}});
const png=Buffer.from([137,80,78,71,13,10,26,10]).toString('base64');
const packet=i=>({screens:[{...frames[i],exportStatus:'ok',png,thumbnail:png,svg:Buffer.from('<svg/>').toString('base64'),document:{id:frames[i].id},texts:[{text:'MAX'}],imageHashes:['image']}],images:[{hash:'image',data:png}],errors:[]});
async function boot(){instance=createArchiveServer(roots);await new Promise(r=>instance.server.listen(0,'localhost',r));base='http://localhost:'+instance.server.address().port;}
before(async()=>{const root=path.resolve('artifacts/workspace/tests/max-material-collector');await mkdir(root,{recursive:true});const run=await mkdtemp(path.join(root,'server-'));roots={workRoot:path.join(run,'work'),outputRoot:path.join(run,'exports')};await boot();});
after(async()=>{await instance.close();});
function request(route,method='GET',body,run,extra={}){return fetch(base+route,{method,headers:{'X-Frame-Archive':'1',...(run?{Authorization:'Bearer '+run.token}:{}),...extra},body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});}
async function start(extra={}){const r=await request('/api/max/exports','POST',{...spec(),...extra});assert.equal(r.status,200,await r.clone().text());return r.json();}
async function upload(run,i,data=packet(i),headers={}){const body=JSON.stringify(data);return request('/api/max/exports/'+run.id+'/screens/'+encodeURIComponent(frames[i].id),'PUT',body,run,{'X-Content-SHA256':sha(body),...headers});}
test('sequential disk ACK, restart, lost ACK, one dated folder and no archive',async()=>{
 const run=await start();assert.match(run.id,/^\d{4}-\d\d-\d\d_\d\d-\d\d-\d\d/);
 const first=await upload(run,0);assert.equal(first.status,200);const ack=await first.json();assert.equal(ack.verified,true);assert.deepEqual(ack.completed,['1:1']);assert.equal(ack.bytes,Buffer.byteLength(JSON.stringify(packet(0))));
 const lost=await upload(run,0);assert.equal(lost.status,200);assert.deepEqual((await lost.json()).completed,['1:1']);
 await instance.close();await boot();
 const resumed=await start();assert.equal(resumed.id,run.id);assert.deepEqual(resumed.completed,['1:1']);
 const last=await upload(resumed,1);assert.equal(last.status,200);assert.equal((await last.json()).state,'complete');
 assert.deepEqual(await readdir(roots.outputRoot),[run.id]);
 const manifest=JSON.parse(await readFile(path.join(run.outputPath,'export.json'),'utf8'));
 assert.match(manifest.frames[0].folder,/^Комментарии\/Ответы\/Комментарий/);
 const all=await readdir(run.outputPath,{recursive:true});assert(!all.some(p=>/\.zip$|\.base64$/.test(p)));
 const catalog=JSON.parse(await readFile(path.join(run.outputPath,'catalog.json'),'utf8'));assert.equal(catalog.screens.length,2);assert.equal(catalog.screens[0].png,undefined);
 for(const entry of manifest.frames)for(const file of entry.files){const bytes=await readFile(path.join(run.outputPath,file.path));assert.equal(bytes.length,file.bytes);assert.equal(sha(bytes),file.sha256);}
});
test('damaged saved file is re-exported into the same folder',async()=>{
 const run=await start(),manifest=JSON.parse(await readFile(path.join(run.outputPath,'export.json'),'utf8'));
 await writeFile(path.join(run.outputPath,manifest.frames[0].folder,'screen.png'),'damaged');
 const resumed=await start();assert.equal(resumed.id,run.id);assert.deepEqual(resumed.completed,['1:2']);
 assert.equal((await upload(resumed,0)).status,200);assert.equal((await start()).state,'complete');
});
test('checksum, origin, token and missing requested assets block confirmation',async()=>{
 const run=await start({resume:false});
 assert.equal((await upload(run,0,packet(0),{'X-Content-SHA256':'0'.repeat(64)})).status,422);
 assert.equal((await upload({...run,token:'wrong'},0)).status,403);
 assert.equal((await request('/api/max/exports','POST',spec(),undefined,{Origin:'https://foreign.example'})).status,403);
 const missing=packet(0);delete missing.screens[0].svg;assert.equal((await upload(run,0,missing)).status,422);
 assert.deepEqual((await start()).completed,[]);
 const health=await (await request('/api/health')).json();assert(health.capabilities.includes('max-materials-v1'));assert.equal(health.activeJobs,0);
});
test('explicit new export and changed settings never overwrite a previous export',async()=>{
 const previous=await start(),fresh=await start({resume:false});assert.notEqual(fresh.id,previous.id);
 const changed=await start({options:{structure:false}});assert.notEqual(changed.id,fresh.id);
});
