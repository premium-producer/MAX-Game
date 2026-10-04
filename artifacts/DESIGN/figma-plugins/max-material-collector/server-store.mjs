import {mkdir,readFile,writeFile,rename,readdir,stat,open} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID,randomBytes,timingSafeEqual} from 'node:crypto';
import {folderName,atomicJson} from '../pdf-export/internal/export-store.mjs';
import {hashFile,validFingerprint} from '../pdf-export/internal/receipts.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const json=v=>JSON.stringify(canonical(v));
const decode=s=>{if(typeof s!=='string'||!s.length||s.length>280*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw fail(400,'Некорректные данные файла');return Buffer.from(s,'base64');};
const inside=(root,file)=>{const target=path.resolve(root,file);if(!target.startsWith(path.resolve(root)+path.sep))throw fail(400,'Недопустимый путь');return target;};
const imageExt=b=>b.subarray(0,4).equals(Buffer.from([137,80,78,71]))?'png':b[0]===255&&b[1]===216?'jpg':b.subarray(8,12).toString()==='WEBP'?'webp':'bin';

const exportId=/^\d{4}-\d\d-\d\d_\d\d-\d\d-\d\d(?:-\d+)?$/;
const timestamp=d=>{const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;};
export function createMaterialsStore(outputRoot,workRoot=path.join(outputRoot,'.max-work')){
 const locks=new Map();
 const dir=id=>{if(typeof id!=='string'||!exportId.test(id))throw fail(400,'Неверный ID выгрузки');return path.join(outputRoot,id);};
 const read=id=>readFile(path.join(dir(id),'export.json'),'utf8').then(JSON.parse);
 async function locked(id,fn){const next=(locks.get(id)||Promise.resolve()).catch(()=>{}).then(fn);locks.set(id,next);try{return await next;}finally{if(locks.get(id)===next)locks.delete(id);}}
 const view=run=>({id:run.id,outputPath:dir(run.id),state:run.state,total:run.frames.length,completed:run.frames.filter(f=>f.status==='complete').map(f=>f.id)});
 async function intact(run,entry){
  if(!entry.files?.length)return false;
  try{for(const file of entry.files){const target=inside(dir(run.id),file.path);if((await stat(target)).size!==file.bytes||await hashFile(target)!==file.sha256)return false;}return true;}
  catch(e){if(['ENOENT','ENOTDIR'].includes(e.code))return false;throw e;}
 }
 async function summaries(run){
  const screens=[];
  for(const entry of run.frames)if(entry.status==='complete')screens.push(JSON.parse(await readFile(inside(dir(run.id),entry.folder+'/screen.json'),'utf8')));
  const data={schema:'max-client-materials-catalog',version:1,source:run.source,options:run.options,status:run.state,screens,links:run.links,context:run.context,requested:run.frames.map(f=>f.id),unexported:run.frames.filter(f=>f.status!=='complete').map(f=>f.id)};
  await atomicJson(path.join(dir(run.id),'catalog.json'),data);
  await atomicJson(path.join(dir(run.id),'texts.json'),screens.map(s=>({id:s.id,name:s.name,containerPath:s.containerPath,texts:s.texts})));
  await atomicJson(path.join(dir(run.id),'coverage.json'),run.coverage.map(t=>({...t,count:screens.filter(s=>s.task===t.id).length,status:screens.some(s=>s.task===t.id)?'screens-found-content-not-verified':'not-found-in-export'})));
  const cards=screens.map(s=>`<figure><img src="${escape(s.previewFile)}"><figcaption>${escape(s.groupName||s.task)}<br>${escape(s.order)} · ${escape(s.title||s.name)}</figcaption></figure>`).join('');
  await writeFile(path.join(dir(run.id),'index.html'),`<!doctype html><meta charset="utf-8"><title>MAX · материалы</title><style>body{font:15px Arial;padding:24px}main{display:flex;flex-wrap:wrap;gap:24px}figure{width:190px;margin:0}img{max-width:180px;max-height:400px}figcaption{overflow-wrap:anywhere}</style><h1>MAX · материалы клиента</h1><p>${screens.length} / ${run.frames.length} · ${escape(run.state)}</p><main>${cards}</main>`);
 }
 async function start(input){return locked('start',async()=>{
  const {source={},options={},frames,links=[],context=[],coverage=[],resume=true}=input;
  if(!Array.isArray(frames)||!frames.length||frames.length>500||new Set(frames.map(f=>f.id)).size!==frames.length||frames.some(f=>typeof f.id!=='string'||typeof f.name!=='string'||typeof f.fingerprint!=='string'))throw fail(400,'Неверный список экранов');
  const stableSource={fileKey:source.fileKey||null,fileName:source.fileName,pageId:source.pageId,pageName:source.pageName,detection:source.detection};
  const key=digest(json({source:stableSource,options,frames,links,context}));
  await mkdir(outputRoot,{recursive:true});
  if(resume){for(const entry of (await readdir(outputRoot)).filter(n=>exportId.test(n)).sort().reverse()){
   let old;try{old=await read(entry);}catch(e){if(e.code==='ENOENT')continue;throw e;}
   if(old.schema!=='max-material-export'||old.key!==key)continue;
   return locked(entry,async()=>{
    const run=await read(entry);
    for(const frame of run.frames)if(frame.status==='complete'&&!await intact(run,frame)){frame.status='pending';frame.error='Файл отсутствует или повреждён';}
    run.state=run.frames.every(f=>f.status==='complete')?'complete':'incomplete';
    await summaries(run);await atomicJson(path.join(dir(entry),'export.json'),run);return view(run);
   });
  }}
  const date=new Date(),base=timestamp(date);let id=base;
  for(let n=2;;n++){try{await mkdir(dir(id));break;}catch(e){if(e.code!=='EEXIST')throw e;id=base+'-'+n;}}
  const used=new Map([['',new Set(['export.json','catalog.json','texts.json','coverage.json','index.html'])]]),assigned=new Map();
  function folderFor(parent,id,name){const key=parent+'\0'+id;if(assigned.has(key))return assigned.get(key);if(!used.has(parent))used.set(parent,new Set());const names=used.get(parent),base=folderName(name);let folder=base;for(let n=2;names.has(folder.toLowerCase());n++)folder=base+'-'+n;names.add(folder.toLowerCase());const result=parent?parent+'/'+folder:folder;assigned.set(key,result);return result;}
  const entries=frames.map(frame=>{
   let parent='';for(const n of frame.containerPath||[])parent=folderFor(parent,'container:'+n.id,n.name);
   const folder=folderFor(parent,'screen:'+frame.id,frame.title||frame.name);
   return {id:frame.id,record:frame,folder,status:'pending'};
  });
  const run={schema:'max-material-export',version:1,id,key,source,options,links,context,coverage,startedAt:date.toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,state:'incomplete',frames:entries};
  await summaries(run);await atomicJson(path.join(dir(id),'export.json'),run);return view(run);
 });}
 async function put(id,screenId,packet,transportHash){return locked(id,async()=>{
  const run=await read(id),entry=run.frames.find(f=>f.id===screenId),screen=packet?.screens?.[0];
  if(!entry||!screen||packet.screens?.length!==1||screen.id!==screenId||screen.exportStatus!=='ok'||screen.fingerprint!==entry.record.fingerprint||!screen.png||!screen.thumbnail)throw fail(400,'Неверный или незавершённый экран');
  if(packet.errors?.length||screen.notes?.some(n=>/не выгружен/.test(n)))throw fail(422,'Не все запрошенные материалы экспортированы; повторите экран');
  if(run.options.structure&&!screen.document||run.options.svg&&!screen.svg)throw fail(422,'Отсутствует запрошенная структура или SVG');
  if(run.options.images&&(screen.imageHashes||[]).some(hash=>!packet.images?.some(i=>i.hash===hash)))throw fail(422,'Не все исходные изображения получены');
  if(entry.status==='complete'&&await intact(run,entry)){await summaries(run);return {...view(run),verified:true,screenId,sha256:transportHash};}
  const stage=path.join(workRoot,'pending-'+randomUUID());await mkdir(stage,{recursive:true});const inventory=[];
  async function file(name,bytes){const target=inside(stage,name);await mkdir(path.dirname(target),{recursive:true});const f=await open(target,'wx');try{await f.writeFile(bytes);await f.sync();}finally{await f.close();}const sha256=digest(bytes);if(await hashFile(target)!==sha256)throw fail(422,'Проверка файла с диска не пройдена');inventory.push({path:entry.folder+'/'+name,bytes:bytes.length,sha256});return entry.folder+'/'+name;}
  const {png,thumbnail,svg,document,...meta}=screen;
  meta.pngFile=await file('screen.png',decode(png));meta.previewFile=await file('preview.png',decode(thumbnail));
  if(svg)meta.svgFile=await file('screen.svg',decode(svg));
  if(document)meta.documentFile=await file('figma.json',Buffer.from(JSON.stringify(document,null,2)));
  meta.images=[];
  for(const img of packet.images||[]){const bytes=decode(img.data),name='images/'+digest(String(img.hash))+'.'+imageExt(bytes);meta.images.push({hash:img.hash,file:await file(name,bytes)});}
  await file('texts.json',Buffer.from(JSON.stringify(screen.texts||[],null,2)));
  await file('screen.json',Buffer.from(JSON.stringify(meta,null,2)));
  const destination=inside(dir(id),entry.folder);await mkdir(path.dirname(destination),{recursive:true});
  try{await stat(destination);await rename(destination,path.join(workRoot,'replaced-'+randomUUID()));}catch(e){if(e.code!=='ENOENT')throw e;}
  await rename(stage,destination);
  entry.files=inventory;entry.status='complete';entry.transportHash=transportHash;entry.verifiedAt=new Date().toISOString();delete entry.error;
  run.state=run.frames.every(f=>f.status==='complete')?'complete':'incomplete';
  await summaries(run);await atomicJson(path.join(dir(id),'export.json'),run);
  return {...view(run),verified:true,screenId,sha256:transportHash};
 });}
 return {start,put,read,view};
}

export function createMaterialsAPI(outputRoot,workRoot){
 const store=createMaterialsStore(outputRoot,workRoot),tokens=new Map();let active=0;
 return {get active(){return active;},async handle(req,res,url,reply,jsonBody){
  if(!url.pathname.startsWith('/api/max/'))return false;
  active++;
  try{
   if(req.method==='POST'&&url.pathname==='/api/max/exports'){
    const result=await store.start(await jsonBody(req,16*1024*1024));
    if(!tokens.has(result.id))tokens.set(result.id,randomBytes(24).toString('hex'));
    reply(res,200,{...result,token:tokens.get(result.id)});return true;
   }
   const match=url.pathname.match(/^\/api\/max\/exports\/([^/]+)(?:\/screens\/([^/]+))?$/);
   if(!match||!tokens.has(match[1]))throw fail(404,'Повторите подключение для продолжения выгрузки');
   const a=Buffer.from(req.headers.authorization?.replace(/^Bearer /,'')||''),b=Buffer.from(tokens.get(match[1]));
   if(a.length!==b.length||!timingSafeEqual(a,b))throw fail(403,'Неверный ключ');
   if(req.method==='GET'&&!match[2]){reply(res,200,store.view(await store.read(match[1])));return true;}
   if(req.method!=='PUT'||!match[2])throw fail(405,'Неверный метод');
   const expected=req.headers['x-content-sha256'];if(!validFingerprint(expected))throw fail(400,'Нужна SHA-256');
   const chunks=[];let size=0;const hash=createHash('sha256');
   for await(const chunk of req){size+=chunk.length;if(size>300*1024*1024)throw fail(413,'Один экран превышает 300 МБ');hash.update(chunk);chunks.push(chunk);}
   const actual=hash.digest('hex');if(actual!==expected)throw fail(422,'SHA-256 передачи не совпала');
   let packet;try{packet=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail(400,'Некорректный JSON экрана');}
   const result=await store.put(match[1],decodeURIComponent(match[2]),packet,actual);reply(res,200,{...result,bytes:size});return true;
  }finally{active--;}
 }};
}
