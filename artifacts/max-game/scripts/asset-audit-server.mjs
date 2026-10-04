import http from 'node:http';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {realpathSync,existsSync} from 'node:fs';

export const MAX_BODY_BYTES=1024*1024;
const failure=status=>Object.assign(Error('Request rejected'),{status});
const messages={400:'Некорректные данные разметки',403:'Запрос не разрешён',404:'Маршрут не найден',405:'Метод не разрешён',409:'Разметка уже изменена. Обновите страницу, сохранив копию правок.',413:'Документ слишком большой',415:'Требуется JSON',423:'Экран занят или право редактирования истекло',500:'Не удалось обработать разметку'};

function json(res,status,data){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(JSON.stringify(data));
}
function readJson(req){
 if(Number(req.headers['content-length'])>MAX_BODY_BYTES){req.resume();return Promise.reject(failure(413));}
 return new Promise((resolve,reject)=>{
  let size=0,chunks=[],settled=false;
  const rejectOnce=error=>{if(!settled){settled=true;chunks=[];reject(error);}};
  req.on('data',chunk=>{
   if(settled)return;
   size+=chunk.length;
   if(size>MAX_BODY_BYTES){rejectOnce(failure(413));return;}
   chunks.push(chunk);
  });
  req.on('end',()=>{
   if(settled)return;
   try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));settled=true;resolve(value);}
   catch{rejectOnce(failure(400));}
  });
  req.on('error',()=>rejectOnce(failure(400)));
  req.on('aborted',()=>rejectOnce(failure(400)));
 });
}

// Caddy owns TLS/authentication. This adapter exposes only audit data, on loopback.
export function createAssetAuditServer({store,origin='https://futuronika.pro',allowLoopbackHttp=false}){
 const parsed=new URL(origin);
 const loopback=allowLoopbackHttp===true&&parsed.protocol==='http:'&&['127.0.0.1','localhost'].includes(parsed.hostname);
 if((parsed.protocol!=='https:'&&!loopback)||parsed.origin!==origin)throw Error('AUDIT_ORIGIN must be an HTTPS origin');
 if(typeof store?.read!=='function'||typeof store?.save!=='function')throw Error('Audit store required');
 const csrf=randomBytes(32).toString('hex'),secret=Buffer.from(csrf);
 return http.createServer({requestTimeout:15_000,headersTimeout:10_000,maxHeaderSize:16*1024},async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   const state=url.pathname==='/api/state',audit=url.pathname==='/api/max-asset-audit',flow=url.pathname==='/api/max-asset-flow',merge=url.pathname==='/api/max-asset-flow/merge',locks=url.pathname==='/api/max-asset-locks';
   if(!state&&!audit&&!flow&&!merge&&!locks)throw failure(404);
   const clientId=req.headers['x-max-editor-id'];
   if(req.method==='GET'&&!merge){json(res,200,state?{csrf}:locks?await store.readCardLocks(clientId):flow?await store.readFlow():await store.read());return;}
   if(req.method!=='POST'||state){res.setHeader('Allow',state?'GET':merge?'POST':'GET, POST');throw failure(405);}
   const token=req.headers['x-vk-token'];
   if(req.headers.origin!==origin||typeof token!=='string'||Buffer.byteLength(token)!==secret.length||!timingSafeEqual(Buffer.from(token),secret))throw failure(403);
   if(!/^application\/json(?:\s*;.*)?$/i.test(req.headers['content-type']||'')||req.headers['content-encoding'])throw failure(415);
   const input=await readJson(req);
   if(!input||typeof input!=='object'||Array.isArray(input))throw failure(400);
   const context=clientId!==undefined||req.headers['x-max-card-id']!==undefined||req.headers['x-max-lock-token']!==undefined?{clientId,
    ...(req.headers['x-max-card-id']!==undefined?{screenId:req.headers['x-max-card-id']}:{}),...(req.headers['x-max-lock-token']!==undefined?{token:req.headers['x-max-lock-token']}:{})}:undefined;
   json(res,200,locks?await store.mutateCardLock(input,clientId):merge?await store.saveMergedFlow(input,context):flow?await store.saveFlow(input,context):await store.save(input,context));
  }catch(error){
   const status=Object.hasOwn(messages,error?.status)?Number(error.status):500;
   if(!req.complete)res.setHeader('Connection','close');
   const mergeDetails=status===409&&error.code==='FLOW_MERGE_CONFLICT'?{code:error.code,conflicts:error.conflicts,currentDocument:error.currentDocument}:{};
   const lockDetails=status===423&&['CARD_LOCKED','CARD_LEASE_LOST'].includes(error.code)?{code:error.code,screenIds:error.screenIds}:{};
   if(!res.headersSent&&!res.destroyed)json(res,status,{error:messages[status],...mergeDetails,...lockDetails});
  }
 });
}

async function main(){
 const env=process.env;
 for(const name of ['AUDIT_STORE_MODULE','AUDIT_CATALOG','AUDIT_FILE'])if(!env[name]||!path.isAbsolute(env[name]))throw Error('Missing absolute audit paths');
 if(env.AUDIT_FLOW_FILE&&!path.isAbsolute(env.AUDIT_FLOW_FILE))throw Error('AUDIT_FLOW_FILE must be absolute');
 const port=Number(env.AUDIT_PORT||19431);
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid audit port');
 const {createAssetAuditStore}=await import(pathToFileURL(env.AUDIT_STORE_MODULE).href);
 const store=createAssetAuditStore({file:env.AUDIT_FILE,catalogFile:env.AUDIT_CATALOG,...(env.AUDIT_FLOW_FILE?{flowFile:env.AUDIT_FLOW_FILE}:{})});
 await store.readFlow();
 const server=createAssetAuditServer({store,origin:env.AUDIT_ORIGIN||'https://futuronika.pro'});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 console.log(`MAX asset audit listening on 127.0.0.1:${port}`);
 let closing=false;
 const stop=()=>{if(closing)return;closing=true;server.close(async()=>{await store.close();process.exit(0);});setTimeout(()=>process.exit(1),20_000).unref();};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
}
if(process.argv[1]&&existsSync(process.argv[1])&&import.meta.url===pathToFileURL(realpathSync(process.argv[1])).href)main().catch(()=>{console.error('MAX asset audit failed to start; check configured paths, catalog and port.');process.exitCode=1;});
