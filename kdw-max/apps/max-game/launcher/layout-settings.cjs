'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {read,atomic,revision,compare,fail,json,body}=require('./operator-http.cjs');
const pose=()=>({x:0,y:0,scale:1});
const DEFAULTS={schemaVersion:1,standby:{logo:pose(),video:pose(),missions:pose()},game:{device:pose(),reference:pose(),button:pose()},devices:{},screens:{},keyboard:{x:0,y:0,width:1,height:1}};
const groups=['device','reference','button','relative'];
const relativeBounds={fallingCardScale:[.5,3],fallingSpawnRight:[0,1600],pcScale:[.1,2],cardsScale:[.1,2],deviceScale:[.35,2.5],centerX:[-200,200],centerY:[-200,200],iconWidth:[5,180],referenceWidth:[20,300],iconGap:[0,200],iconsDeviceGap:[0,200],deviceReferenceGap:[0,200],buttonGap:[0,100]};
function relative(v){object(v,[...Object.keys(relativeBounds),'centered']);const out={};for(const [k,value]of Object.entries(v)){if(k==='centered'){if(typeof value!=='boolean')throw fail('Некорректное центрирование');}else{const [min,max]=relativeBounds[k];if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw fail('Некорректный относительный размер или отступ: '+k);}out[k]=value;}return out;}
function object(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw fail('Некорректный профиль композиции');}
function validatePose(v){object(v,['x','y','scale']);for(const k of ['x','y','scale'])if(typeof v[k]!=='number'||!Number.isFinite(v[k])||v[k]<(k==='scale'?.35:-3072)||v[k]>(k==='scale'?2.5:3072))throw fail('Смещение: −3072…3072 px; масштаб: 35…250%');return{x:v.x,y:v.y,scale:v.scale};}
function group(v,keys,partial=false){object(v,keys);const out={};for(const k of keys)if(k in v)out[k]=k==='relative'?relative(v[k]):validatePose(v[k]);else if(!partial&&k!=='relative')throw fail('Неполный профиль композиции');return out;}
function validate(v){
 object(v,['schemaVersion','standby','game','devices','screens','keyboard']);if(v.schemaVersion!==1)throw fail('Неизвестная версия профиля');
 object(v.devices,['phone','pc']);object(v.screens,Object.keys(v.screens||{}));if(Object.keys(v.screens).length>150)throw fail('Слишком много экранов');
 let keyboard;if(v.keyboard!==undefined){object(v.keyboard,['x','y','width','height']);keyboard={};for(const [k,min,max]of [['x',-1536,1536],['y',-768,768],['width',.5,1.5],['height',.5,2]]){const n=v.keyboard[k];if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw fail('Некорректная настройка клавиатуры: '+k);keyboard[k]=n;}}
 const devices={},screens={};for(const [k,g]of Object.entries(v.devices))devices[k]=group(g,groups,true);
 for(const [k,g]of Object.entries(v.screens)){if(!/^[a-z0-9][a-z0-9._-]{0,100}$/.test(k)||['__proto__','constructor','prototype'].includes(k))throw fail('Некорректный ID экрана');screens[k]=group(g,groups,true);}
 return{schemaVersion:1,standby:group(v.standby,['logo','video','missions']),game:group(v.game,groups),devices,screens,...(keyboard?{keyboard}:{})};
}
function createLayoutSettings({root,origin,canEdit=()=>{}}){
 const file=path.join(root,'data/layout.local.json'),profilesFile=path.join(root,'data/layout-profiles.local.json');
 let preview=null,queue=Promise.resolve();const sessions=new Map(),streams=new Set();
 function library(){
  const book=fs.existsSync(profilesFile)?read(profilesFile,null):{schemaVersion:1,activeId:'default',profiles:[{id:'default',name:'Основной',value:validate(read(file,DEFAULTS)),updatedAt:null}]};
  if(book.schemaVersion!==1||!Array.isArray(book.profiles)||book.profiles.length<1||book.profiles.length>24)throw fail('Некорректная библиотека профилей');
  const ids=new Set();for(const p of book.profiles){if(!p||typeof p.id!=='string'||!/^[a-zA-Z0-9-]{1,64}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>64)throw fail('Некорректный профиль');ids.add(p.id);p.value=validate(p.value);}
  if(!ids.has(book.activeId))throw fail('Активный профиль не найден');return book;
 }
 const active=book=>book.profiles.find(p=>p.id===book.activeId);
 const saved=()=>active(library()).value;
 const state=()=>{const book=library(),p=active(book),value=p.value;if(preview&&preview.expiresAt<=Date.now())preview=null;return{value,effective:preview?.value??value,revision:revision(value),profilesRevision:revision(book),activeProfileId:p.id,activeProfileName:p.name,profiles:book.profiles.map(({id,name,updatedAt})=>({id,name,updatedAt})),defaults:DEFAULTS,preview:preview?{owner:preview.owner,profileId:preview.profileId,expiresAt:preview.expiresAt}:null};};
 function publish(){const data='data: '+JSON.stringify(state())+'\n\n';for(const res of streams){if(res.writableLength>262144){res.destroy();streams.delete(res);}else res.write(data);}}
 function write(book){atomic(profilesFile,book);try{atomic(file,active(book).value);}catch{/* The durable profile library owns the active settings; legacy mirror is optional. */}}
 function owner(v){if(typeof v!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(v))throw fail('Некорректный редактор');return v;}
 function own(v){owner(v);if(preview&&preview.expiresAt>Date.now()&&preview.owner!==v)throw fail('Предпросмотр на стене занят другим редактором',409);}
 function profileMatch(input){if(input.profileId&&input.profileId!==library().activeId)throw fail('Профиль переключён в другом окне. Перечитайте настройки',409);}
 function name(value){if(typeof value!=='string'||!value.trim()||value.trim().length>64)throw fail('Название профиля: 1–64 символа');return value.trim();}
 return{state,handle(req,res){const u=new URL(req.url,origin);if(!u.pathname.startsWith('/__kdw/layout/'))return false;
 const run=async()=>{try{
  if(req.headers.origin&&req.headers.origin!==origin)throw fail('Неверный Origin',403);
  const action=u.pathname.slice('/__kdw/layout/'.length);
  if(req.method==='GET'&&action==='state'){json(res,200,state());return;}
  if(req.method==='GET'&&action==='events'){
   res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});streams.add(res);res.write('data: '+JSON.stringify(state())+'\n\n');const timer=setInterval(()=>res.write(': heartbeat\n\n'),10000);timer.unref();res.on('close',()=>{clearInterval(timer);streams.delete(res);});return;
  }
  if(req.method==='GET'&&action==='preview-settings'){const until=sessions.get(u.searchParams.get('token'));if(!until||until<Date.now())throw fail('Предпросмотр истёк. Откройте его заново',403);json(res,200,{preview:true});return;}
  const input=await body(req,origin);
  if(action==='validate'){json(res,200,{value:validate(input.value)});return;}
  if(action==='session'){for(const [key,until]of sessions)if(until<Date.now())sessions.delete(key);if(sessions.size>=16)sessions.delete(sessions.keys().next().value);const token=crypto.randomBytes(24).toString('hex');sessions.set(token,Date.now()+3600000);json(res,200,{url:'/webgl-v5/client.html?view=pixel-map&layout-preview='+token});return;}
  if(action==='preview'){await canEdit();own(input.owner);profileMatch(input);compare(input.revision,saved());preview={owner:input.owner,profileId:library().activeId,value:validate(input.value),expiresAt:Date.now()+15000};publish();json(res,200,state());return;}
  if(action==='cancel'){owner(input.owner);if(preview?.owner===input.owner){preview=null;publish();}json(res,200,state());return;}
  if(action==='save'){await canEdit();own(input.owner);profileMatch(input);compare(input.revision,saved());const book=library();active(book).value=validate(input.value);active(book).updatedAt=new Date().toISOString();write(book);preview=null;publish();json(res,200,state());return;}
  if(action.startsWith('profiles/')){
   await canEdit();own(input.owner);const book=library();compare(input.revision,book);
   if(action==='profiles/create'){if(book.profiles.length>=24)throw fail('Можно сохранить до 24 профилей');const title=name(input.name);if(book.profiles.some(p=>p.name.toLowerCase()===title.toLowerCase()))throw fail('Такое название уже есть');const p={id:crypto.randomUUID(),name:title,value:validate(input.value),updatedAt:new Date().toISOString()};book.profiles.push(p);book.activeId=p.id;}
   else if(action==='profiles/switch'){if(!book.profiles.some(p=>p.id===input.id))throw fail('Профиль не найден',404);book.activeId=input.id;}
   else if(action==='profiles/save'){profileMatch({profileId:input.id});const p=active(book);p.value=validate(input.value);p.name=name(input.name??p.name);if(book.profiles.some(other=>other.id!==p.id&&other.name.toLowerCase()===p.name.toLowerCase()))throw fail('Такое название уже есть');p.updatedAt=new Date().toISOString();}
   else if(action==='profiles/delete'){if(book.profiles.length===1)throw fail('Нельзя удалить последний профиль');if(!book.profiles.some(p=>p.id===input.id))throw fail('Профиль не найден',404);book.profiles=book.profiles.filter(p=>p.id!==input.id);if(book.activeId===input.id)book.activeId=book.profiles[0].id;}
   else throw fail('Неизвестное действие',404);
   write(book);preview=null;publish();json(res,200,state());return;
  }
  throw fail('Неизвестное действие',404);
 }catch(e){json(res,e.status||400,{error:e.message});}};queue=queue.then(run,run);return true;
 }};
}
module.exports={DEFAULTS,validate,createLayoutSettings};
