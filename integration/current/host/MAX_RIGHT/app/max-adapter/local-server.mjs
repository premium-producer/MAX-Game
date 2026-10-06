import {presentationState,presentationCommand} from './presentation-policy.mjs';

import {createLaunchLogger} from '../launch-diagnostics/launch-logger.mjs';

import {handleLaunchDiagnostics} from '../launch-diagnostics/http.mjs';

import http from 'node:http';

import {createProductionMobileEntry} from '../max-mobile/src/production-entry.mjs';

import {handleLocalAudio} from '../master-audio/control/local-audio-bridge.mjs';



import {createReadStream} from 'node:fs';



import {stat} from 'node:fs/promises';



import parseRange from './vendor/range-parser.cjs';



import path from 'node:path';



import {readFile, realpath} from 'node:fs/promises';



import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';



import {pipeline} from 'node:stream/promises';



import {classifyMaxRequest, managedEntryUrl, validMaxBinding, MAX_ENTRY_PATH} from './request-policy.mjs';







const PIN = JSON.parse(await readFile(new URL('./accepted-source.json', import.meta.url)));



const MIME={'.mp4':'video/mp4','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};



const HEADERS={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',



  // PreparedAssets fetches the catalog's embedded SVG bytes before image decoding.



  // data: is local content, not a network origin; external connections remain blocked.



  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self' http://127.0.0.1:9576"};



const fault=(code,status=503)=>Object.assign(Error(code),{code,status});



const identity=b=>JSON.stringify([b.active,b.datasetIdentity.instanceKey,b.nodeId,b.hostBootId,b.assignmentId,b.sessionId,b.contentRevision,b.leaseId,b.ownerGeneration]);



export function freshMaxBinding(b,now=Date.now()){



  return validMaxBinding(b)&&typeof b.datasetIdentity?.instanceKey==='string'&&/^dataset-v1:[a-f0-9]{64}$/.test(b.datasetIdentity.instanceKey)&&



    [b.nodeId,b.hostBootId].every(v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v))&&Number.isSafeInteger(b.expiresAtMs)&&b.expiresAtMs>now;



}



export function freshRoleBinding(b,now=Date.now()){



  return b?.role==='MAX_RIGHT'&&typeof b.active==='boolean'&&



    [b.nodeId,b.hostBootId,b.leaseId].every(v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v))&&



    Number.isSafeInteger(b.ownerGeneration)&&b.ownerGeneration>0&&



    /^dataset-v1:[a-f0-9]{64}$/.test(b.datasetIdentity?.instanceKey??'')&&



    Number.isSafeInteger(b.expiresAtMs)&&b.expiresAtMs>now&&(!b.active||freshMaxBinding(b,now));



}



const same=(a,b)=>identity(a)===identity(b);



const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;



function isManagedEntry(raw,url){



 if(url.pathname!==MAX_ENTRY_PATH||url.searchParams.size!==3||url.searchParams.get('backend')!=='server'||!['assignment','session'].every(k=>ID.test(url.searchParams.get(k)??'')))return false;



 return raw===MAX_ENTRY_PATH+'?'+new URLSearchParams({backend:'server',assignment:url.searchParams.get('assignment'),session:url.searchParams.get('session')});



}



const recoveryHtml='<!doctype html><html lang="ru"><meta charset="utf-8"><title>MAX — восстановление</title><body><main><h1>MAX · состояние миссии</h1><p id="recovery-status" role="status">Сверяем сохранённые запросы…</p><ul id="recovery-records"></ul><button id="recovery-refresh" type="button">Обновить состояние</button><p><a id="recovery-current" hidden>Открыть текущую миссию</a></p></main><script type="module" src="/max-recovery/page.mjs"></script></body></html>';







function send(res,status,body,type='application/json',extra={}){



  if(res.destroyed||res.writableEnded)return;



  const bytes=Buffer.isBuffer(body)?body:Buffer.from(type==='application/json'?JSON.stringify(body):body);



  res.writeHead(status,{...HEADERS,...extra,'Content-Type':type,'Content-Length':bytes.length});res.end(bytes);



}



async function bodyOf(req){



  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))throw fault('JSON_REQUIRED',415);



  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>65536)throw fault('BODY_LIMIT',413);chunks.push(chunk);}



  let value;try{value=JSON.parse(Buffer.concat(chunks));}catch{throw fault('INVALID_JSON',400);}



  if(!value||typeof value!=='object'||Array.isArray(value))throw fault('JSON_OBJECT_REQUIRED',400);return value;



}



function tokenMatches(header,token){if(typeof header!=='string'||!token)return false;const a=Buffer.from(header),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);}







/** Accepted MAX presentation only. Root supplies authenticated transports and binding resolver.



 * requestMaster({method,path,body?,binding,signal})->{status,data|body}.



 * subscribeEvents({path,binding,signal})->{status,headers,stream:NodeReadable}.



 * No upstream credentials, retry, business lifecycle or game state are owned here.



 */



// Observe existing canonical replies; never infer HOLD acceptance from HTTP200.
export function gameInputDiagnostic(body,data,b,status){
 const state=data?.state?.sessionId===b.sessionId?data.state:null;
 return {stage:'backend',assignmentId:b.assignmentId,sessionId:b.sessionId,contentRevision:b.contentRevision,
  contactId:body?.event?.contactId,sequence:body?.event?.sequence,inside:body?.event?.inside,
  phase:body?.event?.type??body?.command?.type??'snapshot',screen:state?.status,revision:state?.revision,
  httpStatus:status,code:data?.error?.code??data?.reply?.code??(state?.scanned===true?'SCAN_CONFIRMED':state?.scanned===false?'SCAN_PENDING':'UNKNOWN_STATE'),
  ...(typeof data?.reply?.accepted==='boolean'?{accepted:data.reply.accepted}:{})};
}

export async function startLocalMaxServer({packageRoot,getBinding,requestMaster,subscribeEvents,port=9430,now=Date.now,timeoutMs=5500,lidarEnabled=port===9573,makeLidarControl}={}){



  if(typeof getBinding!=='function'||typeof requestMaster!=='function'||typeof packageRoot!=='string')throw Error('MAX_HOST_DEPENDENCIES_REQUIRED');



  if(!Number.isInteger(port)||(port!==0&&(port<1024||port>65535))||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>6000)throw Error('INVALID_HOST_OPTIONS');



  const root=await realpath(path.join(packageRoot,'app/max-ui'));



  async function asset(relative){



    if(!Object.hasOwn(PIN.files,relative))throw fault('ASSET_NOT_ALLOWED',404);



    const target=await realpath(path.join(root,relative)),rel=path.relative(root,target);



    if(rel.startsWith('..')||path.isAbsolute(rel))throw fault('ASSET_PATH_REJECTED',403);



    const bytes=await readFile(target);



    if(createHash('sha256').update(bytes).digest('hex')!==PIN.files[relative])throw fault('ASSET_HASH_MISMATCH');return relative.endsWith('.html')?Buffer.from(bytes.toString().replace('<html','<html data-managed-audio="true"')):bytes;



  }



  const mediaCache=new Map();



  async function checkedMedia(relative){



    const target=await realpath(path.join(root,relative)),rel=path.relative(root,target);



    if(rel.startsWith('..')||path.isAbsolute(rel))throw fault('ASSET_PATH_REJECTED',403);



    const info=await stat(target),key=`${info.size}:${info.mtimeMs}`;



    if(mediaCache.get(relative)!==key){const hash=createHash('sha256');for await(const chunk of createReadStream(target))hash.update(chunk);if(hash.digest('hex')!==PIN.files[relative])throw fault('ASSET_HASH_MISMATCH');mediaCache.set(relative,key);}



    return {target,size:info.size};



  }



  await asset(MAX_ENTRY_PATH.slice(1));



  const logger=createLaunchLogger({root:packageRoot,role:'MAX_RIGHT'});logger.log('adapter-start');let bindingKey='',mobileStatusKey='';const diagnosticErrors=new Map(),inputResultDiagnostics=new Map();

  let origin,host,credential=null,closed=false,mobile=null;const controllers=new Set();

  let lidarControl=null,lidarStartError=null,presentationCache=null;

  const lidarRoleKey=b=>JSON.stringify([b.datasetIdentity.instanceKey,b.nodeId,b.hostBootId,b.leaseId,b.ownerGeneration]);

  const lidarScope=b=>JSON.stringify([lidarRoleKey(b),b.assignmentId??null,b.sessionId??null,b.active,b.show?.automatic===true]);

  function cachePresentationContextOnly(b,presentation){

    lidarControl?.setContext({bindingKey:lidarRoleKey(b),assignmentId:b.active?b.assignmentId:null,sessionId:b.active?b.sessionId:null,

      mode:presentation.desiredMode,modeEpoch:presentation.modeEpoch,automatic:b.show?.automatic===true,active:b.active});

  }

  function cachePresentation(b,presentation){

    presentationCache={scope:lidarScope(b),bindingIdentity:identity(b),at:now(),state:presentation};
    cachePresentationContextOnly(b,presentation);

    return presentation;

  }

  if(lidarEnabled){

    try{

      const make=makeLidarControl??(await import('../max-lidar/adapter/control.mjs')).createLidarControl;

      lidarControl=make({root:packageRoot,now,log:(event,fields={})=>logger.log(event,{...fields,stage:'lidar'})});

      await lidarControl.start();

    }catch(error){

      try{lidarControl?.close();}catch{}lidarControl=null;

      lidarStartError=/^[A-Z0-9_]{1,64}$/.test(error?.code??'')?error.code:'LIDAR_START_FAILED';

      logger.log('lidar-start-failed',{code:lidarStartError,stage:'lidar'});

    }

  }

  let mobileToken=null;

  try{mobileToken=(await readFile(path.join(packageRoot,'secrets/max-mobile.token'),'utf8')).trim();if(mobileToken.length<32)throw fault('MAX_MOBILE_TOKEN_INVALID');}

  catch(error){if(error.code!=='ENOENT')throw error;}

  // Phone gameplay is paused: do not expose pairing or acquire the game input owner.

  const mobileGameplayEnabled=false;

  const mobileEnabled=b=>mobileGameplayEnabled&&!!mobileToken&&b.active===true&&b.show?.automatic!==true&&!lidarControl?.isEnabled();

  async function entryAsset(b){const bytes=Buffer.from((await asset(MAX_ENTRY_PATH.slice(1))).toString().replace('</head>','<script type="module" src="/diagnostics/max/client.js"></script></head>'));return mobileEnabled(b)?Buffer.from(bytes.toString().replace('<html','<html data-max-mobile-control="true"')):bytes;}



  async function binding(signal){



    let timer,aborted;



    const value=await Promise.race([Promise.resolve().then(()=>getBinding({signal})),new Promise((_,reject)=>{



      aborted=()=>reject(fault('BINDING_UNAVAILABLE'));if(signal.aborted)return aborted();signal.addEventListener('abort',aborted,{once:true});timer=setTimeout(aborted,timeoutMs);



    })]).finally(()=>{clearTimeout(timer);signal.removeEventListener('abort',aborted);});



    if(!freshRoleBinding(value,now()))throw fault('MAX_BINDING_UNAVAILABLE');const fields={active:value.active,sessionId:value.sessionId,assignmentId:value.assignmentId,contentRevision:value.contentRevision,phase:value.show?.phase,stage:'binding'};const key=JSON.stringify(fields);if(key!==bindingKey){bindingKey=key;logger.log('binding-change',fields);}return structuredClone(value);



  }



  // Trusted root handle only; the browser cannot reach these mutations. Operator

  // commands refresh authority, while high-rate frames reuse the ordinary

  // /bridge/context presentation read (500 ms) rather than polling MASTER.

  async function lidarAuthority(){

    if(closed||!lidarControl)throw fault(lidarStartError??'LIDAR_DISABLED');

    const abort=new AbortController();let timer;

    const task=(async()=>{

      const b=await binding(abort.signal);

      const result=await requestMaster({method:'GET',path:'/production/max/presentation',binding:b,signal:abort.signal});

      const current=await binding(abort.signal);if(!same(b,current))throw fault('STALE_MAX_BINDING',409);

      const data=result?.data??result?.body;

      if(result?.status!==200)throw fault('MAX_PRESENTATION_UNAVAILABLE');

      if(closed||abort.signal.aborted)throw fault('MAX_PRESENTATION_UNAVAILABLE');

      cachePresentation(b,presentationState(data));return b;

    })();

    try{return await Promise.race([task,new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(fault('MAX_PRESENTATION_UNAVAILABLE'));},timeoutMs);})]);}

    finally{clearTimeout(timer);abort.abort();}

  }

  const lidar={
    async snapshot(){

      if(!lidarControl)return {protocol:'max-lidar-v1',enabled:false,unavailable:true,error:lidarStartError??'LIDAR_DISABLED'};

      await lidarAuthority();return lidarControl.snapshot();

    },

    async command(body){await lidarAuthority();return lidarControl.command(body);},

  };

  // GPU evidence comes only from the owned native renderer IPC callback. The
  // browser's /bridge/presented remains prepared-only and cannot call this handle.
  let nativeProof=null,nativePending=null,nativeRetry=null,nativeLastAttempt=-Infinity,nativeAccepted=null,nativeAcceptedProof=null,nativeAbort=null;
  const proofIdentity=p=>JSON.stringify([p.assignmentId,p.sessionId,p.contentRevision,p.datasetInstanceKey,p.rendererBootId,p.sender]);
  function nativeEligible(b,proof){
    const age=presentationCache?now()-presentationCache.at:Infinity;
    const proofAge=nativeProof?now()-nativeProof.at:Infinity;
    return nativeProof!==null&&proofIdentity(nativeProof)===proofIdentity(proof)&&proofAge>=0&&proofAge<=1500&&
      freshMaxBinding(b,now())&&b.show?.automatic!==true&&presentationCache?.scope===lidarScope(b)&&
      age>=0&&age<=1500&&presentationCache.state.desiredMode==='standard'&&presentationCache.state.effectiveMode==='standard'&&
      presentationCache.state.backgroundOnly!==true&&
      proof.assignmentId===b.assignmentId&&proof.sessionId===b.sessionId&&proof.contentRevision===b.contentRevision&&
      proof.datasetInstanceKey===b.datasetIdentity.instanceKey;
  }
  function scheduleNative(){
    if(closed||!nativeProof||nativePending)return;
    const delay=Math.max(0,500-(now()-nativeLastAttempt));
    if(nativeRetry){if(delay>0)return;clearTimeout(nativeRetry);nativeRetry=null;}
    nativeRetry=setTimeout(()=>{nativeRetry=null;void forwardNative();},delay);nativeRetry.unref?.();
  }
  function forwardNative(){
    if(closed||nativePending||!nativeProof)return nativePending??Promise.resolve(false);
    const proof=nativeProof,abort=new AbortController();nativeAbort=abort;controllers.add(abort);nativeLastAttempt=now();
    let timer,onAbort,retryWanted=false;
    const task=(async()=>{
      const b=await binding(abort.signal);
      if(closed||abort.signal.aborted||!nativeEligible(b,proof))return false;
      const stamp=JSON.stringify([identity(b),proof.rendererBootId]);
      if(nativeAccepted===stamp)return true;
      const body={assignmentId:proof.assignmentId,sessionId:proof.sessionId,contentRevision:proof.contentRevision,
        publishedFrame:proof.frameId,rendererBootId:proof.rendererBootId,sender:proof.sender};
      const result=await requestMaster({method:'POST',path:'/production/max/game/presented',body,binding:b,signal:abort.signal});
      const current=await binding(abort.signal);
      if(closed||abort.signal.aborted||!same(b,current)||!nativeEligible(current,proof))throw fault('STALE_NATIVE_PRESENTED',409);
      const data=result?.data??result?.body;
      if(result?.status!==200||data?.accepted!==true){
        const upstreamCode=data?.error?.code??data?.detail?.code??data?.reason??data?.error;
        const code=typeof upstreamCode==='string'&&/^[A-Za-z0-9_:.-]{1,160}$/.test(upstreamCode)?upstreamCode:'NATIVE_PRESENTED_UNCONFIRMED';
        throw fault(code,Number.isInteger(result?.status)&&result.status>=100&&result.status<=599?result.status:503);
      }
      nativeAccepted=stamp;nativeAcceptedProof=proof;logger.log('native-game-presented',{assignmentId:b.assignmentId,sessionId:b.sessionId,accepted:true,httpStatus:200,bootId:proof.rendererBootId,stage:'native'});
      return true;
    })();
    nativePending=Promise.race([task,new Promise((_,reject)=>{
      onAbort=()=>reject(fault('NATIVE_PRESENTED_CANCELLED'));abort.signal.addEventListener('abort',onAbort,{once:true});
      timer=setTimeout(()=>{reject(fault('NATIVE_PRESENTED_TIMEOUT'));abort.abort();},timeoutMs);
    })]).then(ok=>{retryWanted=ok!==true;return ok;})
      .catch(error=>{retryWanted=true;logger.log('native-game-presented-failed',{code:error?.code??'NATIVE_PRESENTED_FAILED',accepted:false,httpStatus:error?.status??503,bootId:proof.rendererBootId,stage:'native'});return false;})
      .finally(()=>{
        clearTimeout(timer);abort.signal.removeEventListener('abort',onAbort);controllers.delete(abort);abort.abort();
        if(nativeAbort===abort)nativeAbort=null;nativePending=null;
        if(nativeProof&&now()-nativeProof.at>=0&&now()-nativeProof.at<=1500&&
          (retryWanted||proofIdentity(nativeProof)!==proofIdentity(proof)))scheduleNative();
      });
    return nativePending;
  }
  function physicalPresented(frame){
    const mission=frame?.maxMission;
    if(closed||frame?.output!=='MAX_RIGHT')return false;
    if(frame.accepted!==true||frame.published!==true||frame.outputReady!==true||
      !Number.isSafeInteger(frame.frameId)||frame.frameId<1||!ID.test(frame.rendererBootId??'')||
      !['VKStand-max-right-MAX_RIGHT-content','VKStand-max-right-MAX_RIGHT-program','VK-PROD-MAX_RIGHT-content','VK-PROD-MAX_RIGHT-program'].includes(frame.sender)||
      !mission||![mission.assignmentId,mission.sessionId].every(v=>typeof v==='string'&&ID.test(v))||
      typeof mission.contentRevision!=='string'||!mission.contentRevision||mission.contentRevision.length>256||
      !/^dataset-v1:[a-f0-9]{64}$/.test(mission.datasetInstanceKey??'')){
      nativeProof=null;clearTimeout(nativeRetry);nativeRetry=null;nativeAbort?.abort();return false;
    }
    const next={assignmentId:mission.assignmentId,sessionId:mission.sessionId,contentRevision:mission.contentRevision,
      datasetInstanceKey:mission.datasetInstanceKey,rendererBootId:frame.rendererBootId,sender:frame.sender,frameId:frame.frameId,at:now()};
    if(nativeProof&&proofIdentity(nativeProof)!==proofIdentity(next)){nativeAbort?.abort();clearTimeout(nativeRetry);nativeRetry=null;}
    nativeProof=next;
    const cacheAge=presentationCache?now()-presentationCache.at:Infinity;
    if(nativeAcceptedProof&&proofIdentity(nativeAcceptedProof)===proofIdentity(next)&&cacheAge>=0&&cacheAge<=1500&&
      nativeAccepted===JSON.stringify([presentationCache.bindingIdentity,next.rendererBootId]))return true;
    // Coalesce frame-rate IPC into at most one attempt each 500 ms. Successful
    // bindings do not generate another POST; retries still require fresh authority.
    scheduleNative();return true;
  }


  const server=http.createServer(async(req,res)=>{



    if(await handleLaunchDiagnostics(req,res,{logger,origin,host}))return;

    if(await handleLocalAudio(req,res,{requestMaster}))return;

    const abort=new AbortController();controllers.add(abort);const deadline=setTimeout(()=>abort.abort(),timeoutMs);



    res.once('close',()=>abort.abort());



    const bounded=work=>{let aborted;return Promise.race([work,new Promise((_,reject)=>{aborted=()=>reject(fault('MASTER_UNAVAILABLE'));if(abort.signal.aborted)return aborted();abort.signal.addEventListener('abort',aborted,{once:true});})]).finally(()=>abort.signal.removeEventListener('abort',aborted));};



    let watch,cleanup;



    try{



      if(closed||req.headers.host!==host)throw fault('LOCAL_HOST_REQUIRED',403);



      const renderNavigation=req.method==='GET'&&req.headers['sec-fetch-dest']==='iframe'&&req.headers['sec-fetch-site']==='same-site'&&['/','/max-show/','/max-show/?warm=1','/max-mobile/'].includes(req.url);

      if(req.headers.origin&&req.headers.origin!==origin||req.headers['sec-fetch-site']&&!['same-origin','none'].includes(req.headers['sec-fetch-site'])&&!renderNavigation)throw fault('LOCAL_ORIGIN_REQUIRED',403);



      const raw=req.url;



      if(typeof raw!=='string'||raw.length>2048||!raw.startsWith('/')||/[\\\s\x00-\x1f#]/.test(raw)||raw.split('?')[0].includes('%')||raw.includes('//')||raw.split('?')[0].split('/').some(p=>p==='.'||p==='..'))throw fault('INVALID_PATH',400);



      // The immutable boot shell must load while MASTER is reconnecting.

      // Context, credentials, assets and presentation ACKs remain binding-gated.

      if(req.method==='GET'&&raw==='/max-mobile/'){

        return send(res,200,Buffer.from((await asset('max-mobile/index.html')).toString().replace('</head>','<script type="module" src="/diagnostics/max/client.js"></script></head>')),MIME['.html']);

      }

      if(req.method==='GET'&&['/max-mobile/host.mjs','/max-mobile/presentation.mjs'].includes(raw)){

        return send(res,200,await asset(raw.slice(1)),MIME['.mjs']);

      }

      const b=await binding(abort.signal),url=new URL(raw,origin);

      if(url.pathname.startsWith('/mobile-wall/')){

        if(!mobile||!mobileEnabled(b)){if(req.method==='GET'&&url.pathname==='/mobile-wall/control')return send(res,200,{projection:null,pairing:null,binding:null});throw fault('MOBILE_ASSIGNMENT_UNAVAILABLE');}

        const currentMobile=mobile.host.current();

        if(currentMobile&&(currentMobile.context.sessionId!==b.sessionId||currentMobile.context.assignmentId!==b.assignmentId||currentMobile.context.datasetIdentity.instanceKey!==b.datasetIdentity.instanceKey))throw fault('STALE_MOBILE_ASSIGNMENT',409);

        clearTimeout(deadline);

        if(await mobile.facade.handle(req,res))return;

        throw fault('MOBILE_ROUTE_NOT_FOUND',404);

      }



      const presentationOwner=createHash('sha256').update(JSON.stringify([b.datasetIdentity.instanceKey,b.nodeId,b.hostBootId,b.leaseId,b.ownerGeneration])).digest('hex');

      async function presentationRequest(method,suffix='',body){

        const result=await bounded(requestMaster({method,path:'/production/max/presentation'+suffix,...(body?{body}:{}),binding:b,signal:abort.signal}));

        const current=await binding(abort.signal);

        if(!same(b,current))throw fault('STALE_MAX_BINDING',409);

        const data=result?.data??result?.body;

        if(result?.status!==200)throw fault(data?.error?.code??data?.error??data?.detail?.code??'MAX_PRESENTATION_UNAVAILABLE',Number.isInteger(result?.status)&&result.status>=400&&result.status<=599?result.status:503);

        if(method==='POST'&&data?.accepted!==true)throw fault(typeof data?.reason==='string'?data.reason:'MAX_PRESENTATION_REJECTED',409);

        return cachePresentation(b,presentationState(method==='POST'?data.state:data));

      }

      if(req.method==='POST'&&['/bridge/presentation/attach','/bridge/presentation/ack'].includes(raw)){

        if(req.headers.origin!==origin||credential?.identity!==identity(b)||!tokenMatches(req.headers['x-local-player'],credential.token))throw fault('LOCAL_PLAYER_REQUIRED',403);

        const action=raw.endsWith('/attach')?'attach':'ack';

        const result=await presentationRequest('POST','/'+action,presentationCommand(action,await bodyOf(req)));

        logger.log('presentation-'+action,{revision:result.revision,phase:result.phase,stage:result.desiredMode});

        return send(res,200,result);

      }



      if(req.method==='GET'&&raw==='/bridge/context'){



        if(b.active&&(typeof b.contentRevision!=='string'||!b.contentRevision))throw fault('MAX_CONTEXT_UNAVAILABLE');



        return send(res,200,{schemaVersion:1,apiOrigin:origin,datasetIdentity:b.datasetIdentity,presentation:{...await presentationRequest('GET'),owner:presentationOwner},



          active:b.active,assignmentId:b.active?b.assignmentId:null,sessionId:b.active?b.sessionId:null,



          contentRevision:b.active?b.contentRevision:null,autoplay:b.autoplay??null,mobileControl:{enabled:mobileEnabled(b),facade:'/mobile-wall'},show:b.active&&b.show?{...b.show,screenDelayMs:b.show.screenDelayMs??1000}:null,entry:b.active?managedEntryUrl(b):null});

      }



      if(req.method==='GET'&&url.pathname==='/bridge/lidar/frame'){

        if(!lidarControl)throw fault(lidarStartError??'LIDAR_DISABLED');

        if(url.searchParams.size!==1||!url.searchParams.has('after')||!/^(0|[1-9][0-9]{0,15})$/.test(url.searchParams.get('after')))throw fault('LIDAR_CURSOR_INVALID',400);

        const after=Number(url.searchParams.get('after'));if(!Number.isSafeInteger(after))throw fault('LIDAR_CURSOR_INVALID',400);

        const fresh=presentationCache?.scope===lidarScope(b)&&now()-presentationCache.at<=1500&&now()>=presentationCache.at;

        if(fresh)cachePresentationContextOnly(b,presentationCache.state);

        const frame=lidarControl.frame(after);

        if(!fresh)return send(res,200,{...frame,ownerKey:JSON.stringify([lidarRoleKey(b),'authority-stale']),enabled:false,calibrating:false,cursor:null,rawCursor:null,events:[],reason:'authority_stale'});

        return send(res,200,frame);

      }



      // A historical receipt can only be read through the MASTER's immutable



      // node/dataset/session grant. It cannot authorize a mutation or rebind a session.



      if(req.method==='GET'&&/^\/api\/max-game\/v1\/sessions\/[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\/receipts\/[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(raw)){



        const result=await bounded(requestMaster({method:'GET',path:raw,binding:b,signal:abort.signal}));



        const current=await binding(abort.signal);



        if(current.datasetIdentity.instanceKey!==b.datasetIdentity.instanceKey||current.nodeId!==b.nodeId)throw fault('STALE_MAX_BINDING',409);



        const data=result?.data??result?.body;



        if(!Number.isInteger(result?.status)||result.status<200||result.status>599||result.status>=300&&result.status<400||!data||typeof data!=='object'||Buffer.byteLength(JSON.stringify(data))>1024*1024)throw fault('MASTER_RESPONSE_INVALID');



        return send(res,result.status,data);



      }



      // Immutable shell/assets and local credentials also serve a freshly bound idle role.



      // They confer no session input permission; every game route is checked below.



      if(req.method==='GET'&&raw==='/bridge/player'){



        if(!credential||credential.identity!==identity(b))credential={identity:identity(b),token:randomBytes(32).toString('hex')};



        return send(res,200,{token:credential.token});



      }



      if(req.method==='GET'&&raw==='/'){



        if(!b.active)return send(res,200,recoveryHtml,MIME['.html']);



        if(b.show)return send(res,302,'','text/plain',{Location:'/max-show/'});



        return send(res,302,'','text/plain',{Location:managedEntryUrl(b)});



      }



      if(req.method==='GET'&&['/max-show/','/max-show/?warm=1'].includes(raw)){return send(res,200,Buffer.from((await asset('max-show/index.html')).toString().replace('</head>','<script type="module" src="/diagnostics/max/client.js"></script></head>')),MIME['.html']);}



      if(req.method==='GET'&&url.pathname===MAX_ENTRY_PATH){

        // Idle role may prepare the immutable renderer without a visitor/session.

        // Session API authorization below is unchanged; the shell binds only

        // after reading a fresh, active /bridge/context.

        if(raw===MAX_ENTRY_PATH+'?backend=server&shell=1')return send(res,200,await entryAsset(b),MIME['.html']);

        if(!isManagedEntry(raw,url))throw fault('MANAGED_ENTRY_REQUIRED',409);

        if(!b.active||raw!==managedEntryUrl(b))return send(res,200,recoveryHtml,MIME['.html']);



        return send(res,200,await entryAsset(b),MIME['.html']);



      }



      if(['GET','HEAD'].includes(req.method)&&url.pathname.endsWith('.mp4')&&Object.hasOwn(PIN.files,url.pathname.slice(1))){



        const rel=url.pathname.slice(1),digest=PIN.files[rel];



        if(url.search&&url.search!=='?v='+digest)throw fault('ASSET_VERSION_INVALID',404);



        const media=await checkedMedia(rel);let range;



        if(req.headers.range){const ranges=parseRange(media.size,req.headers.range,{combine:true});



          if(ranges===-1){res.writeHead(416,{...HEADERS,'Content-Range':`bytes */${media.size}`});return res.end();}



          if(Array.isArray(ranges)&&ranges.type==='bytes'&&ranges.length===1)range=ranges[0];}



        clearTimeout(deadline);res.writeHead(range?206:200,{...HEADERS,'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':range?range.end-range.start+1:media.size,...(range?{'Content-Range':`bytes ${range.start}-${range.end}/${media.size}`}:{})});



        if(req.method==='HEAD')return res.end();await pipeline(createReadStream(media.target,range),res,{signal:abort.signal});return;



      }



      if(req.method==='GET'&&Object.hasOwn(PIN.files,url.pathname.slice(1))){



        if(url.search||url.pathname.endsWith('.html'))throw fault('ASSET_NOT_ALLOWED',404);



        return send(res,200,await asset(url.pathname.slice(1)),MIME[path.extname(url.pathname)]??'application/octet-stream');



      }



      if(!freshMaxBinding(b,now()))throw fault('MAX_BINDING_UNAVAILABLE');



      const p=classifyMaxRequest(req.method,raw,b);if(!p.allowed)throw fault(p.code,403);



      const mutating=!['GET','HEAD'].includes(req.method);



      if(mutating&&(req.headers.origin!==origin||credential?.identity!==identity(b)||!tokenMatches(req.headers['x-local-player'],credential.token)))throw fault('LOCAL_PLAYER_REQUIRED',403);



      const body=mutating?await bodyOf(req):undefined;



      const verify=async()=>{const current=await binding(abort.signal);if(!same(b,current))throw fault('STALE_MAX_BINDING',409);};



      if(p.kind==='browserPreparedOnly'){



        if(Object.keys(body).some(k=>!['assignmentId','sessionId'].includes(k))||body.assignmentId!==b.assignmentId||body.sessionId!==b.sessionId)throw fault('FOREIGN_PRESENTATION',409);



        await verify();return send(res,202,{accepted:false,browserPrepared:true,physicalPresented:false,requiresGpuEvidence:true});



      }



      await verify();



      if(p.kind==='canonicalEvents'){



        if(typeof subscribeEvents!=='function')throw fault('MASTER_EVENTS_UNAVAILABLE');



        const result=await bounded(subscribeEvents({path:p.upstream,binding:b,signal:abort.signal}));



        cleanup=result?.cleanup;



        if(result?.status!==200||!/^text\/event-stream(?:;|$)/i.test(result.headers?.['content-type']??'')||typeof result.stream?.pipe!=='function')throw fault('MASTER_EVENTS_INVALID');



        await verify();clearTimeout(deadline);



        // Pipeline supplies backpressure; guard revokes a long-lived stream after lease/owner change.



        let checking=false;watch=setInterval(async()=>{if(checking)return;checking=true;try{await verify();}catch{abort.abort();}finally{checking=false;}},500);watch.unref();



        res.writeHead(200,{...HEADERS,'Content-Type':'text/event-stream','Connection':'keep-alive'});res.flushHeaders();



        await pipeline(result.stream,res,{signal:abort.signal});return;



      }



      const result=await bounded(requestMaster({method:req.method,path:p.upstream,...(body===undefined?{}:{body}),binding:b,signal:abort.signal}));



      await verify();const data=result?.data??result?.body;



      if(!Number.isInteger(result?.status)||result.status<200||result.status>599||result.status>=300&&result.status<400||!data||typeof data!=='object'||Buffer.byteLength(JSON.stringify(data))>1024*1024)throw fault('MASTER_RESPONSE_INVALID');



      if(/^\/api\/max-game\/v1\/sessions\/[^/]+(?:\/(?:contacts|commands|input-owner))?$/.test(url.pathname)){
        const fields=gameInputDiagnostic(body,data,b,result.status),key=JSON.stringify([b.assignmentId,url.pathname]);
        const signature=JSON.stringify([fields.phase,fields.code,fields.screen,fields.inside,result.status]);
        const previous=inputResultDiagnostics.get(key),at=now();
        if(!previous||previous.signature!==signature||(mutating&&fields.phase!=='move')||at-previous.at>=1000){
          inputResultDiagnostics.set(key,{signature,at});if(inputResultDiagnostics.size>32)inputResultDiagnostics.delete(inputResultDiagnostics.keys().next().value);
          logger.log('game-input-result',fields);
        }
      }
      return send(res,result.status,data);



    }catch(error){const route=['/bridge/context','/mobile-wall/control'].includes(req.url)?req.url:req.url?.startsWith('/api/max-game/')?'/api/max-game':'/other';const fields={code:error.code??'MASTER_UNAVAILABLE',httpStatus:error.status??503,stage:'adapter',route,method:req.method};const key=JSON.stringify(fields),at=Date.now();if(req.method!=='GET'||!diagnosticErrors.has(key)||at-diagnosticErrors.get(key)>=30000){diagnosticErrors.set(key,at);if(diagnosticErrors.size>32)diagnosticErrors.delete(diagnosticErrors.keys().next().value);logger.log('request-error',fields);}if(res.headersSent)res.destroy();else send(res,error.status??503,{error:{code:error.code??'MASTER_UNAVAILABLE'}});}



    finally{clearTimeout(deadline);clearInterval(watch);abort.abort();try{cleanup?.();}catch{}controllers.delete(abort);}



  });



  server.requestTimeout=8000;server.headersTimeout=5000;server.keepAliveTimeout=1000;



  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});}

  catch(error){lidarControl?.close();logger.close();throw error;}

  host=`127.0.0.1:${server.address().port}`;origin=`http://${host}`;



  if(mobileGameplayEnabled&&mobileToken){

    try{mobile=await createProductionMobileEntry({adapterOrigin:origin,pendingDatabase:path.join(packageRoot,'data/mobile-control/pending.sqlite'),standToken:mobileToken,relayUrl:'https://futuronika.pro',assetOrigin:'https://futuronika.pro',onStatus:state=>{const key=JSON.stringify(state);if(key!==mobileStatusKey){mobileStatusKey=key;logger.log('mobile-status',state);}}});await mobile.start();}

    catch(error){await mobile?.close().catch(()=>{});lidarControl?.close();await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});logger.close();throw error;}

  }

  server.once('close',()=>{lidarControl?.close();logger.close();void mobile?.close().catch(()=>{});});

  return {server,origin,lidar,physicalPresented,entry:origin+'/',capabilities:{managedOnly:true,physicalPresented:false},async close(){await mobile?.close();closed=true;clearTimeout(nativeRetry);nativeRetry=null;nativeProof=null;lidarControl?.close();for(const c of controllers)c.abort();await nativePending;await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}};


}



