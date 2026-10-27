const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root='C:/KDW-Stand/releases/KDW-Stand-20261027-RC4-1/apps/stela';
const {WebSocket}=require(root+'/launcher/voice/vendor/ws');
const {pinnedFetch}=require(root+'/launcher/game-link-network.cjs');
const config=JSON.parse(fs.readFileSync(root+'/data/game-link.local.json','utf8').replace(/^\uFEFF/,''));
const origin='http://127.0.0.1:18751',report={startedAt:new Date().toISOString(),synthetic:true,samples:[],checks:[],trace:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function local(route,body,token,extra={}){const r=await fetch(origin+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{'x-kdw-session-token':token}:{}),...extra},body:Buffer.isBuffer(body)?body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});const b=await r.json();if(!r.ok)throw Error('LOCAL_'+r.status+'_'+(b.error||''));return b;}
async function max(route,options={}){const r=await pinnedFetch(config.gameOrigin+'/__kdw/link/v2/'+route,{...options,headers:{'x-kdw-relay-key':config.key,...options.headers},signal:AbortSignal.timeout(10000)},config.certificatePem);return{status:r.status,body:await r.json()};}
async function run(index){
 const prior=await(await fetch(origin+'/__kdw/voice/status')).json();if(prior.busy)throw Error('VISITOR_SESSION_ACTIVE');
 const bytes=fs.readFileSync(path.join(__dirname,'sample-'+index+'.jpg')),sha=crypto.createHash('sha256').update(bytes).digest('hex');
 const session=await local('/__kdw/voice/session',{voiceEnabled:false,narrationMode:'generated'}),token=session.token;
 let state=session.state,ws,gameId,waiter;
 const next=()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiter=null;reject(Error('STATE_TIMEOUT'));},5000);waiter=value=>{clearTimeout(timer);resolve(value);};});
 try{
  const first=next();ws=new WebSocket(origin.replace('http:','ws:')+'/__kdw/voice/stream',{origin,headers:{'Sec-WebSocket-Protocol':token}});ws.on('message',(data,binary)=>{if(binary)return;const e=JSON.parse(data);report.trace.push({type:e.type,stage:e.state?.stage,revision:e.state?.revision,reason:e.outcome?.reason});if(e.type==='state'){state=e.state;if(waiter){const fn=waiter;waiter=null;fn(state);}}});ws.on('error',e=>report.trace.push({wsError:e.message}));ws.on('close',code=>report.trace.push({wsClose:code}));await first;
  const command=async action=>{ws.send(JSON.stringify({type:'ready',revision:state.revision,silent:true}));const p=next();ws.send(JSON.stringify({type:'command',command:{action},revision:state.revision,id:crypto.randomUUID()}));await p;};
  await command('begin');await command('digital-id');await command('take-photo');
  let p=next();ws.send(JSON.stringify({type:'photo.captured',requestId:state.photoRequestId,revision:state.revision,width:1080,height:1920}));await p;await command('confirm-photo');
  gameId=state.gameId;const start=performance.now();await local('/__kdw/link/v2/submit',{gameId,revision:state.revision},token);const submitted=performance.now();
  await local('/__kdw/link/v2/photo',bytes,token,{'Content-Type':'image/jpeg','x-kdw-game-id':gameId,'x-kdw-revision':String(state.revision)});const queued=performance.now();
  let status;const deadline=performance.now()+25000;while(performance.now()<deadline){status=await local('/__kdw/link/v2/status',{gameId,revision:state.revision},token);if(status.photoStatus==='stored')break;if(['failed','expired'].includes(status.photoStatus)||status.status==='failed')throw Error('DELIVERY_'+(status.error||status.photoStatus));await sleep(100);}
  if(status.photoStatus!=='stored')throw Error('PHOTO_DELIVERY_TIMEOUT');const done=performance.now();
  const received=await max('missions/'+gameId);if(received.status!==200||received.body.gameId!==gameId||received.body.photo.sha256!==sha)throw Error('PHOTO_BINDING_MISMATCH');
  const headers={'Content-Type':'image/jpeg','x-kdw-voice-session':state.sessionId,'x-kdw-photo-sha256':sha};
  const wrong=await max('missions/'+gameId+'/photo/1',{method:'PUT',headers:{...headers,'x-kdw-voice-session':crypto.randomUUID()},body:bytes});if(wrong.status!==409||wrong.body.error!=='PHOTO_CONTEXT_CONFLICT')throw Error('WRONG_SESSION_ACCEPTED');
  const repeat=await max('missions/'+gameId+'/photo/1',{method:'PUT',headers,body:bytes});if(repeat.status!==200||repeat.body.photo.sha256!==sha)throw Error('DUPLICATE_FAILED');
  report.samples.push({index,gameId,voiceSessionId:state.sessionId,bytes:bytes.length,sha256:sha,submitMs:Math.round(submitted-start),localPhotoQueueMs:Math.round(queued-submitted),fromSubmitToStoredMs:Math.round(done-start),fromPhotoUploadToStoredMs:Math.round(done-submitted),maxPhotoStatus:received.body.photo.status,assignment:received.body.assignment.status,wrongSessionStatus:wrong.status,duplicateStatus:repeat.status,observedAt:new Date().toISOString()});
 }finally{
  if(gameId){const cancel=await max('missions/'+gameId+'/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});report.checks.push({gameId,cancelStatus:cancel.status});}
  await local('/__kdw/voice/session/end',{token}).catch(()=>{});ws?.close();
 }
}
(async()=>{try{await run(0);await sleep(600);await run(1);report.passed=report.samples.length===2&&new Set(report.samples.map(x=>x.gameId)).size===2&&new Set(report.samples.map(x=>x.sha256)).size===2;}catch(e){report.error=e.message;process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(__dirname,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));setTimeout(()=>process.exit(process.exitCode||0),50);}})();
