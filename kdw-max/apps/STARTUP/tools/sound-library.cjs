'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {read,atomic,revision,compare,fail,json,body}=require('./operator-http.cjs');
const catalogs=require('./sound-events.cjs');
const MIME={'.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.webm':'audio/webm'};
const LIMIT=50*1024*1024;
function filename(name){if(typeof name!=='string'||name.length>160||!name.trim()||/[<>:"/\\|?*\x00-\x1f]/.test(name)||name.startsWith('.')||/[. ]$/.test(name)||/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name)||!MIME[path.extname(name).toLowerCase()])throw fail('Допустимы WAV, MP3, OGG, WebM с обычным именем файла');return name;}
function signature(bytes,ext){return ext==='.wav'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE':ext==='.ogg'?bytes.toString('ascii',0,4)==='OggS':ext==='.webm'?bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):ext==='.mp3'&&(bytes.toString('ascii',0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224));}
function createSoundLibrary({root,origin,app,isBusy=()=>false}){
 const catalog=catalogs[app];if(!catalog)throw Error('Unknown sound application');
 const folder=path.join(root,'data/audio'),configFile=path.join(root,'data/sound-events.local.json');
 fs.mkdirSync(folder,{recursive:true});
 const seed=path.join(root,app==='max'?'www/webgl-v5/audio':'www/stella/soundtrack');
 // Seed once. Future builds never restore deliberately removed/renamed user files.
 const marker=path.join(folder,'.initialized');
 if(!fs.existsSync(marker)&&fs.existsSync(seed)){
  for(const entry of fs.readdirSync(seed,{withFileTypes:true}))if(entry.isFile()&&MIME[path.extname(entry.name).toLowerCase()]){
   const target=path.join(folder,entry.name);if(!fs.existsSync(target))fs.copyFileSync(path.join(seed,entry.name),target);
  }
  fs.writeFileSync(marker,'Local audio library; do not replace during application updates.\n');
 }
 const legacy=app==='stela'?read(path.join(root,'data/soundtrack.local.json'),{}):{};
 // New bundled music is imported once per filename, without restoring deleted
 // operator files or overwriting existing tracks/settings on an upgraded stand.
 if(app==='max'){
  const record=path.join(folder,'.music-seeded.json'),seeded=read(record,[]);let changed=false;
  for(const name of catalogs.maxMusicFiles)if(!seeded.includes(name)&&fs.existsSync(path.join(seed,name))){
   if(!fs.existsSync(path.join(folder,name)))fs.copyFileSync(path.join(seed,name),path.join(folder,name));
   seeded.push(name);changed=true;
  }
  if(changed)atomic(record,seeded);
 }
 const defaultMusic={mode:'single',when:'missions',tracks:catalogs.maxMusicFiles};
 const defaultVideo={standby:{enabled:true,volume:1},tasks:{enabled:true,volume:1}};
 const defaults={...(app==='max'?{video:defaultVideo}:{}),schemaVersion:1,enabled:legacy.enabled??true,masterVolume:1,fadeInMs:20,fadeOutMs:150,events:Object.fromEntries(catalog.map(e=>[e.id,{file:e.file,volume:app==='stela'?(e.loop?legacy.musicVolume:legacy.effectsVolume)??e.volume:e.volume}]))};
 const inside=name=>{const candidate=path.join(folder,filename(name));const real=fs.realpathSync(candidate);if(path.dirname(real)!==fs.realpathSync(folder)||!fs.statSync(real).isFile())throw fail('Файл вне папки аудио');return real;};
 const bank=()=>fs.readdirSync(folder).flatMap(name=>{try{const p=inside(name),s=fs.statSync(p);return[{name,bytes:s.size,version:`${s.size}-${s.mtimeMs}`,url:'/__kdw/sound/file/'+encodeURIComponent(name)+`?v=${s.size}-${s.mtimeMs}`}];}catch{return[];}}).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 function validate(v,checkFiles=false){
  if(!v||v.schemaVersion!==1||typeof v.enabled!=='boolean'||!v.events||Array.isArray(v.events))throw fail('Неверные настройки звука');
  for(const [key,max] of [['masterVolume',1],['fadeInMs',10000],['fadeOutMs',10000]])if(typeof v[key]!=='number'||!Number.isFinite(v[key])||v[key]<0||v[key]>max)throw fail(`Недопустимое значение ${key}`);
  if(Object.keys(v.events).sort().join('|')!==catalog.map(e=>e.id).sort().join('|'))throw fail('Список событий не совпадает с приложением');
  const events={};for(const e of catalog){const item=v.events[e.id];if(!item||typeof item.volume!=='number'||!Number.isFinite(item.volume)||item.volume<0||item.volume>1)throw fail('Громкость события должна быть от 0 до 100%');if(item.file!==null){filename(item.file);if(checkFiles)try{inside(item.file);}catch{throw fail('Файл отсутствует: '+item.file);}}events[e.id]={file:item.file,volume:item.volume};}
  let video;
  if(app==='max'){
   const input=v.video??(checkFiles?read(configFile,{}).video:undefined)??defaultVideo;
   if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join('|')!=='standby|tasks')throw fail('Неверные настройки звука видео');
   video={};for(const key of ['standby','tasks']){const item=input[key];if(!item||typeof item.enabled!=='boolean'||typeof item.volume!=='number'||!Number.isFinite(item.volume)||item.volume<0||item.volume>1)throw fail('Громкость видео должна быть от 0 до 100%');video[key]={enabled:item.enabled,volume:item.volume};}
  }
  let music;
  if(app==='max'){
   const input=v.music??(checkFiles?read(configFile,{}).music:undefined)??defaultMusic;
   if(!input||!['single','playlist'].includes(input.mode)||!['missions','always','standby'].includes(input.when)||!Array.isArray(input.tracks)||input.tracks.length>100||new Set(input.tracks).size!==input.tracks.length)throw fail('Неверные настройки фоновой музыки');
   for(const name of input.tracks){filename(name);if(checkFiles&&input.mode==='playlist')try{inside(name);}catch{throw fail('Файл музыки отсутствует: '+name);}}
   if(input.mode==='playlist'&&!input.tracks.length)throw fail('Добавьте хотя бы один трек в цикл');
   music={mode:input.mode,when:input.when,tracks:[...input.tracks]};
  }
  return{...(video?{video,music}:{}),schemaVersion:1,enabled:v.enabled,masterVolume:v.masterVolume,fadeInMs:v.fadeInMs,fadeOutMs:v.fadeOutMs,events};
 }
 if(!fs.existsSync(configFile))atomic(configFile,defaults);
 const settings=()=>validate(read(configFile,defaults));
 const state=()=>{const value=settings();return{app,folder,value,revision:revision(value),events:catalog,files:bank(),busy:isBusy(),maxUploadBytes:LIMIT};};
 let queue=Promise.resolve();
 async function upload(req,url){
  if(req.method!=='POST'||req.headers.origin!==origin||req.headers['content-type']!=='application/octet-stream')throw fail('Загрузка доступна только из локальной панели',403);
  const name=filename(url.searchParams.get('name'));const dest=path.join(folder,name);
  if(fs.readdirSync(folder).some(n=>n.toLowerCase()===name.toLowerCase()))throw fail('Файл уже существует. Загрузите новую версию под другим именем',409);
  if(Number(req.headers['content-length'])>LIMIT)throw fail('Максимальный размер файла — 50 МБ',413);
  const tmp=path.join(folder,'.upload-'+crypto.randomUUID());const handle=await fs.promises.open(tmp,'wx');let size=0,head=Buffer.alloc(0);
  try{
   for await(const chunk of req){size+=chunk.length;if(size>LIMIT)throw fail('Максимальный размер файла — 50 МБ',413);if(head.length<16)head=Buffer.concat([head,chunk.subarray(0,16-head.length)]);await handle.writeFile(chunk);}
   await handle.close();if(!size||!signature(head,path.extname(name).toLowerCase()))throw fail('Содержимое файла не соответствует аудиоформату');
   // Exclusive copy also protects against a manual file arriving during upload.
   fs.copyFileSync(tmp,dest,fs.constants.COPYFILE_EXCL);return state();
  }finally{await handle.close().catch(()=>{});fs.rmSync(tmp,{force:true});}
 }
 function stream(req,res,file,mime){
  const size=fs.statSync(file).size;let start=0,end=size-1,status=200;
  const headers={'Content-Type':mime,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
  if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]));if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;}
  headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);if(req.method==='HEAD'||!size){res.end();return;}const s=fs.createReadStream(file,{start,end});s.on('error',()=>res.destroy());res.on('close',()=>s.destroy());s.pipe(res);
 }
 return{state,folder,handle(req,res){
  const url=new URL(req.url,origin);if(!url.pathname.startsWith('/__kdw/sound/'))return false;
  const run=async()=>{try{
   if(req.headers.origin&&req.headers.origin!==origin)throw fail('Неверный Origin',403);
   const action=url.pathname.slice('/__kdw/sound/'.length);
   if(['GET','HEAD'].includes(req.method)&&action.startsWith('file/')){const name=decodeURIComponent(action.slice(5));stream(req,res,inside(name),MIME[path.extname(name).toLowerCase()]);return;}
   if(['GET','HEAD'].includes(req.method)&&['panel','panel.js','panel.css'].includes(action)){const name=action==='panel'?'index.html':action;stream(req,res,path.join(__dirname,'sound-panel',name),name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8');return;}
   if(action==='state'&&req.method==='GET'){json(res,200,state());return;}
   if(action==='settings'){const input=await body(req,origin);compare(input.revision,settings());atomic(configFile,validate(input.value,true));json(res,200,state());return;}
   if(action==='upload'){json(res,200,await upload(req,url));return;}
   throw fail('Неизвестное действие',404);
  }catch(e){if(!res.headersSent)json(res,e.status||400,{error:e.message});else res.destroy();}};
  // File streaming does not hold the mutation queue. Settings/upload are serialized.
  if(req.method==='GET'||req.method==='HEAD')void run();else queue=queue.then(run,run);return true;
 }};
}
module.exports={createSoundLibrary,filename,signature};
