'use strict';
const crypto=require('node:crypto');
const PREFIX='/__kdw/screen/';
const safeId=v=>typeof v==='string'&&/^[a-zA-Z0-9_.-]{1,128}$/.test(v);
const optionalId=v=>v===null||safeId(v);

// Read-only observers never acquire a voice lease. Only the local renderer publishes.
function createScreenState({origin,now=()=>Date.now(),staleMs=6000,onState=()=>{}}){
 const instanceId=crypto.randomUUID(),clients=new Set();let owner=null,sequence=-1,lastSeen=0,revision=0,closed=false;
 let value={screenId:null,stage:null,missionId:null,taskId:null,phase:null,presentation:'unavailable',ready:false,visible:false,transitioning:false};
 let online=false,updatedAt=new Date(now()).toISOString();
 const snapshot=()=>({schemaVersion:1,instanceId,revision,online,stale:!online,updatedAt,lastSeenAt:lastSeen?new Date(lastSeen).toISOString():null,validForMs:staleMs,...value});
 const write=res=>{if(res.destroyed||res.writableLength>65536){clients.delete(res);res.destroy();return;}if(!res.write(`id: ${instanceId}:${revision}\nevent: screen\ndata: ${JSON.stringify(snapshot())}\n\n`)){clients.delete(res);res.destroy();}};
 function changed(){revision++;updatedAt=new Date(now()).toISOString();for(const res of clients)write(res);try{onState(snapshot());}catch{/* Observers cannot block game publication. */}}
 function expire(){if(online&&now()-lastSeen>=staleMs){online=false;value={...value,visible:false,ready:false,transitioning:false,presentation:'unavailable'};changed();}}
 const timer=setInterval(()=>{expire();for(const res of clients){if(res.writableLength>65536||!res.write(': heartbeat\n\n')){clients.delete(res);res.destroy();}}},2000);timer.unref();
 const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 async function publish(req,res){
  let size=0,parts=[];for await(const part of req){size+=part.length;if(size>2048){json(res,413,{error:'BODY_LIMIT'});return;}parts.push(part);}
  let b;try{b=JSON.parse(Buffer.concat(parts).toString());}catch{json(res,400,{error:'INVALID_JSON'});return;}
  if(!/^[a-f0-9-]{36}$/i.test(b.publisherId||'')||!Number.isSafeInteger(b.sequence)||b.sequence<0||!safeId(b.stage)||!safeId(b.screenId)||!safeId(b.phase)||!optionalId(b.taskId)||!['loading','hidden','transitioning','visible','paused'].includes(b.presentation)||typeof b.ready!=='boolean'||!optionalId(b.missionId)){json(res,400,{error:'INVALID_STATE'});return;}
  expire();
  if(owner!==b.publisherId){if(online){json(res,409,{error:'PUBLISHER_BUSY'});return;}owner=b.publisherId;sequence=-1;}
  if(b.sequence<=sequence){json(res,409,{error:'STALE_SEQUENCE'});return;}
  sequence=b.sequence;lastSeen=now();
  const next={screenId:b.screenId,stage:b.stage,missionId:b.missionId,taskId:b.taskId,phase:b.phase,presentation:b.presentation,ready:b.ready,visible:b.presentation==='visible',transitioning:b.presentation==='transitioning'};
  const different=!online||JSON.stringify(next)!==JSON.stringify(value);value=next;online=true;if(different)changed();json(res,200,{accepted:true,revision});
 }
 return{snapshot:()=>{expire();return snapshot();},handle(req,res){
  const pathname=new URL(req.url,origin).pathname;if(!pathname.startsWith(PREFIX))return false;
  if(closed){json(res,503,{error:'STOPPED'});return true;}
  if(req.headers.origin&&req.headers.origin!==origin){json(res,403,{error:'INVALID_ORIGIN'});return true;}
  expire();
  if(pathname===PREFIX+'state'&&req.method==='GET'){json(res,200,snapshot());return true;}
  if(pathname===PREFIX+'state.csv'&&req.method==='GET'){
   const s=snapshot(),cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
   res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(Object.keys(s).map(cell).join(',')+'\r\n'+Object.values(s).map(cell).join(',')+'\r\n');return true;
  }
  if(pathname===PREFIX+'events'&&req.method==='GET'){
   if(clients.size>=32){json(res,503,{error:'OBSERVER_LIMIT'});return true;}
   res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write('retry: 2000\n\n');clients.add(res);write(res);res.on('close',()=>clients.delete(res));return true;
  }
  if(pathname===PREFIX+'publish'&&req.method==='POST'){
   if(req.headers.origin!==origin||req.headers['content-type']!=='application/json'){json(res,403,{error:'INVALID_REQUEST'});return true;}
   req.setTimeout(3000,()=>req.destroy());void publish(req,res).catch(()=>{if(!res.headersSent&&!res.destroyed)json(res,400,{error:'INVALID_REQUEST'});});return true;
  }
  json(res,404,{error:'NOT_FOUND'});return true;
 },close(){closed=true;clearInterval(timer);for(const res of clients)res.end();clients.clear();}};
}
module.exports={createScreenState};
