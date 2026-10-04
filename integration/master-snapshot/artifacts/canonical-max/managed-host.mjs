import {createServer} from 'node:http';
import {createHmac} from 'node:crypto';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSqlitePersistencePort} from './artifacts/service/max-game/sqlite-persistence.mjs';
import {createMaxGameApi} from './artifacts/service/max-game/http-api.mjs';
import {createMissionSessionApplication} from './artifacts/max-game/src/application/mission-session.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export const catalog=JSON.parse(await readFile(path.join(root,'catalog.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
export async function startManagedHost({port=0,dataDir,masterUrl,controlToken,now=Date.now,leaseMs=15000}={}){
 if(!dataDir||!/^http:\/\/127\.0\.0\.1:\d+$/.test(masterUrl)||typeof controlToken!=='string'||controlToken.length<24)throw Error('Explicit local data/master/token required');
 await mkdir(dataDir,{recursive:true});
 const persistence=await createSqlitePersistencePort({databasePath:path.resolve(dataDir,'max.sqlite')});
 const application=createMissionSessionApplication({catalog,persistence,now});
 const playerToken=createHmac('sha256',controlToken).update('local-max-player-v1').digest('hex');
 let origin,closed=false,sweeping=false;
 const api=createMaxGameApi({application,catalog,mode:'managed',now,leaseMs,authorize:req=>req.headers['x-local-player']===playerToken,authorizeControl:req=>req.headers['x-local-control']===controlToken});
 const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
 async function master(path,body){const r=await fetch(masterUrl+path,{signal:AbortSignal.timeout(1800),headers:{Origin:masterUrl,'Content-Type':'application/json','X-Local-Control':controlToken},...(body?{method:'POST',body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('MASTER_UNAVAILABLE');return r.json();}
 async function current(){return (await master('/max/state')).current;}
 const server=createServer(async(req,res)=>{
  try{
   if(req.headers.host!==new URL(origin).host||req.headers.origin&&req.headers.origin!==origin){json(res,403,{error:{code:'LOCAL_ORIGIN_REQUIRED'}});return;}
   const url=new URL(req.url,origin);
   if(!['GET','HEAD'].includes(req.method)&&req.headers.origin!==origin){json(res,403,{error:{code:'LOCAL_ORIGIN_REQUIRED'}});return;}
   if(url.pathname==='/health'){json(res,200,{ready:true,processId:process.pid,mode:'canonical-local-v1',catalog:catalog.contentRevision});return;}
   if(url.pathname==='/bridge/player'&&req.method==='GET'){json(res,200,{token:playerToken});return;}
   if(url.pathname==='/bridge/presented'&&req.method==='POST'){
    if(req.headers['x-local-player']!==playerToken){json(res,403,{error:{code:'PLAYER_REQUIRED'}});return;}
    let data='';for await(const chunk of req){data+=chunk;if(data.length>4096)throw Error('BODY_LIMIT');}
    const body=JSON.parse(data),a=await application.getAssignment(body.assignmentId);
    if(a.receipt.sessionId!==body.sessionId||a.lifecycle.status!=='active'){json(res,409,{error:{code:'ASSIGNMENT_CONTEXT_CONFLICT'}});return;}
    const w=await current();
    if(w?.assignmentId!==body.assignmentId||w.paused||!['delivery','awaiting_touch','playing'].includes(w.phase)){json(res,409,{error:{code:'MASTER_NOT_PRESENTABLE'}});return;}
    const evidence={assignmentId:body.assignmentId,sessionId:body.sessionId,contentRevision:a.receipt.contentRevision,generation:a.receipt.generation};
    json(res,200,await master('/max/canonical/presented',evidence));return;
   }
   const mutation=url.pathname.match(/^\/api\/max-game\/v1\/sessions\/([^/]+)\/(?:commands|contacts|input-owner|layouts\/[^/]+)$/);
   if(mutation&&!['GET','HEAD'].includes(req.method)){
    const w=await current();
    if(w?.schemaVersion!==4||w.canonical?.sessionId!==mutation[1]||w.paused||!w.presented||!['awaiting_touch','playing'].includes(w.phase)){
     await api.suspendSession(mutation[1]);json(res,409,{error:{code:'MASTER_GAME_GATE_CLOSED'}});return;
    }
   }
   if(await api.handle(req,res,url))return;
   if(req.method!=='GET'){json(res,405,{error:{code:'METHOD_NOT_ALLOWED'}});return;}
   const folder=path.join(root,'public'),relative=decodeURIComponent(url.pathname.slice(1))+(url.pathname.endsWith('/')?'index.html':'');
   const target=path.resolve(folder,relative);
   if(!target.startsWith(folder+path.sep)){json(res,404,{error:{code:'NOT_FOUND'}});return;}
   const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]??'application/octet-stream','Cache-Control':'no-store','Content-Security-Policy':`frame-ancestors 'self' ${masterUrl}`});res.end(data);
  }catch(error){json(res,error.code==='ENOENT'?404:503,{error:{code:error.message==='MASTER_UNAVAILABLE'?'MASTER_UNAVAILABLE':error.code??'BRIDGE_UNAVAILABLE'}});}
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
 const pulse=setInterval(async()=>{if(sweeping||closed)return;sweeping=true;try{
  const slot=await application.getSlot('main');
  if(slot.sessionId){let w;try{w=await current();}catch{}
   if(w?.canonical?.sessionId!==slot.sessionId||w.paused||!w.presented||!['awaiting_touch','playing'].includes(w.phase))await api.suspendSession(slot.sessionId);
  }
  await api.sweep();
 }catch{}finally{sweeping=false;}},200);pulse.unref();
 return {origin,application,persistence,async close(){if(closed)return;closed=true;clearInterval(pulse);try{await api.close();}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await persistence.close();}}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=name=>process.argv[process.argv.indexOf(name)+1];
 const instance=await startManagedHost({port:Number(arg('--port'))||0,dataDir:arg('--data'),masterUrl:arg('--master'),controlToken:process.env.LOCAL_MASTER_MAX_CONTROL_TOKEN});
 console.log(JSON.stringify({ready:true,origin:instance.origin,mode:'canonical-local-v1'}));
 const close=()=>instance.close().then(()=>process.exit(0));
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,close);
 if(process.argv.includes('--parent-stdio')){process.stdin.resume();process.stdin.once('end',close);process.stdin.once('error',close);}
}


