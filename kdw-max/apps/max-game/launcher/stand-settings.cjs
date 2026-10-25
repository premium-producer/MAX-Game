// Public stand policy only. Credentials and visitor data never enter this file.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const DEFAULTS={schemaVersion:1,max:{entryMode:'stella',timings:{palmWaitSeconds:30,palmHoldSeconds:.8,taskDurationSeconds:60,inactivitySeconds:120,qrDisplaySeconds:15,standbyAfterIdleSeconds:3,resultSeconds:.8}},stella:{timings:{inactivitySeconds:30,deliveryRetrySeconds:2,resultReturnSeconds:15}},defaults:{businessType:'cafe',channelName:'Мой канал',channelDescription:'Новости и события',channelSlug:'my_channel',commentReply:'Спасибо за интерес!'}};
function validate(value){
 const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===keys.sort().join(',');
 if(!exact(value,['schemaVersion','max','stella','defaults'])||value.schemaVersion!==1||!exact(value.max,['entryMode','timings'])||!['stella','manual','combined'].includes(value.max.entryMode)||!exact(value.stella,['timings']))throw Error('Неверная структура или режим stand.json');
 for(const app of ['max','stella']){const t=value[app].timings,reference=DEFAULTS[app].timings;if(!exact(t,Object.keys(reference)))throw Error('Неверный список таймингов '+app);for(const [k,v]of Object.entries(t))if(typeof v!=='number'||!Number.isFinite(v)||v<.1||v>3600)throw Error(app+'.'+k+': ожидается число 0.1…3600 секунд');}
 if(value.max.timings.palmHoldSeconds>=value.max.timings.palmWaitSeconds)throw Error('palmHoldSeconds должен быть меньше palmWaitSeconds');
 const d=value.defaults;if(!exact(d,Object.keys(DEFAULTS.defaults))||!['cafe','flowers','auto'].includes(d.businessType)||!Object.values(d).every(v=>typeof v==='string'&&v.trim().length>0&&v.length<=160&&!/[\x00-\x1f]/.test(v))||d.channelName.length>64||!/^\w{4,32}$/.test(d.channelSlug)||!/^[a-z]/.test(d.channelSlug))throw Error('Неверные значения defaults');
 return structuredClone(value);
}
const revision=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,20);
function createSettings({root,enabled=false}){
 const file=path.join(root,'settings/stand.json'),lastFile=path.join(root,'data/stand-settings.accepted.json');let value=structuredClone(DEFAULTS),error=null,acceptedAt=null;
 try{const saved=JSON.parse(fs.readFileSync(lastFile,'utf8'));value=validate(saved.value);acceptedAt=saved.acceptedAt;}catch{}
 function snapshot(){
  try{const candidate=validate(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')));if(revision(candidate)!==revision(value)||!acceptedAt){value=candidate;acceptedAt=new Date().toISOString();fs.mkdirSync(path.dirname(lastFile),{recursive:true});const temp=lastFile+'.tmp';fs.writeFileSync(temp,JSON.stringify({value,acceptedAt},null,2));fs.renameSync(temp,lastFile);}error=null;}
  catch(e){error=e.code==='ENOENT'?'settings/stand.json отсутствует; используется последняя рабочая конфигурация':e.message;}
  return{production:enabled,revision:revision(value),acceptedAt,error,value:structuredClone(value)};
 }
 return{snapshot};
}
module.exports={DEFAULTS,validate,revision,createSettings};
