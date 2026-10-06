import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import {startMasterAudio} from '../master-audio/control/start-audio.mjs';
import {DatabaseSync} from 'node:sqlite';
import {pipeline} from 'node:stream/promises';
import {MaxAuthority} from './max-gateway.mjs';
import {presentationMasterRequest} from './presentation-master-request.mjs';
import {canonicalProxy} from './canonical-proxy.mjs';
import {identity, pin} from './fleet.mjs';
import {sendVkMedia,isVkMediaPath} from './vk-media.mjs';
import {VkAuthority} from './vk-gateway.mjs';
import {RenderIdleAuthority} from './render-idle-gateway.mjs';

const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const validId=value=>typeof value==='string'&&ID.test(value);
const PHOTO_ROUTE=/^\/stella\/vk\/sessions\/([A-Za-z0-9][A-Za-z0-9._:-]{0,127})\/photo$/;
export function businessRequestLimit(peer,method,target){return peer?.role==='STELLA'&&peer.stationId==='stella-main'&&method==='POST'&&typeof target==='string'&&PHOTO_ROUTE.test(target)?2900000:262144;}
const err=(code,status=403)=>Object.assign(Error(code),{code,status});
const canonical=v=>JSON.stringify(v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const reply=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};

// Existing FastAPI authority stays loopback-only. Node handles HTTP framing; no transparent proxy.
export function localMasterRequest(port,{method,path:target,body}) {
  if(!Number.isInteger(port)||port<1024||port>65535)throw err('INVALID_BACKEND_PORT',503);
  return new Promise((resolve,reject)=>{
    let size=0;const chunks=[];const payload=body===undefined?undefined:Buffer.from(JSON.stringify(body));
    const request=http.request({hostname:'127.0.0.1',port,path:target,method,agent:false,headers:{Accept:'application/json',...(payload?{'Content-Type':'application/json','Content-Length':payload.length}:{})}},response=>{
      if(!/^application\/json(?:;|$)/i.test(response.headers['content-type']||'')){response.destroy();return reject(err('BACKEND_RESPONSE_INVALID',503));}
      response.on('data',b=>{size+=b.length;if(size>1048576)response.destroy(err('BACKEND_RESPONSE_TOO_LARGE',503));else chunks.push(b);});
      response.on('error',reject);response.on('end',()=>{try{resolve({status:response.statusCode,body:JSON.parse(Buffer.concat(chunks).toString())});}catch{reject(err('BACKEND_RESPONSE_INVALID',503));}});
    });
    const deadline=setTimeout(()=>request.destroy(err('BACKEND_TIMEOUT',503)),4300);
    request.once('close',()=>clearTimeout(deadline));request.on('error',reject);request.end(payload);
  });
}

// Access ledger only: business state, scoring, leases and timers remain in F/DBOS.
export class StellaAuthority {
  constructor(file,upstream,{maxEnabled=false}={}){
    this.upstream=upstream;this.maxEnabled=maxEnabled;this.db=new DatabaseSync(file,{timeout:1000});
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS intents(dataset TEXT,node TEXT,request TEXT,session TEXT,visit TEXT,payload TEXT,
      PRIMARY KEY(dataset,request),UNIQUE(dataset,session),UNIQUE(dataset,visit)) STRICT;
      CREATE TABLE IF NOT EXISTS commands(dataset TEXT,node TEXT,session TEXT,command TEXT,payload TEXT,
      PRIMARY KEY(dataset,session,command)) STRICT;`);
    if(!this.db.prepare('PRAGMA table_info(intents)').all().some(c=>c.name==='protocol'))this.db.exec("ALTER TABLE intents ADD COLUMN protocol TEXT NOT NULL DEFAULT 'stella-vk-v1'");
  }
  close(){this.db.close();}
  async call(method,target,body){return this.upstream({method,path:target,...(body===undefined?{}:{body})});}
  async health(){const h=await this.call('GET','/health');if(h.status!==200||h.body?.service!=='stand-local-master'||h.body?.ready!==true||h.body?.stellaVkProtocol!=='stella-vk-v1'||!/^dataset-v1:[a-f0-9]{64}$/.test(h.body?.instanceKey||''))throw err('BACKEND_NOT_READY',503);return h;}
  intent(dataset,node,column,id){if(!['request','session','visit'].includes(column))throw Error('Invalid lookup');return this.db.prepare(`SELECT * FROM intents WHERE dataset=? AND node=? AND ${column}=?`).get(dataset,node,id);}
  save(dataset,node,body,protocol='stella-vk-v1'){this.db.prepare('INSERT INTO intents(dataset,node,request,session,visit,payload,protocol) VALUES(?,?,?,?,?,?,?)').run(dataset,node,body.requestId,body.sessionId,body.visitId,canonical(body),protocol);}
  async owned(dataset,node,session,expectedProtocol){
    let intent=this.intent(dataset,node,'session',session);
    const projection=await this.call('GET',`/sessions/${session}`);
    if(projection.status!==200)throw err('SESSION_UNAVAILABLE',projection.status===404?404:503);
    const r=projection.body?.registry;
    const protocol=projection.body.state?.protocol;
    if(!r||r.stationId!=='stella-main'||r.sessionId!==session||!Number.isSafeInteger(r.generation)||!['stella-vk-v1',...(this.maxEnabled?['stella-max-v1']:[])].includes(protocol)||(expectedProtocol&&protocol!==expectedProtocol))throw err('SESSION_NOT_OWNED');
    if(!intent){
      const station=await this.call('GET','/stations/stella-main');
      if(station.status!==200||station.body?.sessionId!==session||station.body?.visitId!==r.visitId||station.body?.generation!==r.generation)throw err('SESSION_NOT_OWNED');
      // Trusted current station can recover an existing accepted quiz after kiosk replacement.
      try{this.save(dataset,node,{requestId:r.requestId,sessionId:session,visitId:r.visitId,stationId:'stella-main',recovered:true},protocol);}
      catch{const winner=this.intent(dataset,node,'session',session);if(!winner||winner.request!==r.requestId||winner.visit!==r.visitId)throw err('SESSION_NOT_OWNED');}
      intent=this.intent(dataset,node,'session',session);
    }
    if(intent.request!==r.requestId||intent.visit!==r.visitId||intent.protocol!==protocol)throw err('SESSION_NOT_OWNED');
    return projection;
  }
  async handle(peer,{method,path:target,body}){
    if(peer?.role!=='STELLA'||peer.stationId!=='stella-main'||!validId(peer.nodeId))throw err('ROLE_NOT_ALLOWED');
    if(!['GET','POST'].includes(method)||typeof target!=='string'||!/^\/[A-Za-z0-9/._:-]+$/.test(target)||target.includes('//')||target.split('/').some(p=>p==='.'||p==='..'))throw err('ROUTE_NOT_ALLOWED');
    const maxRoute=this.maxEnabled&&(target==='/max/definition'||target==='/stella/max/queue-summary'||target==='/stella/max/admissions'||/^\/stella\/max\/admissions\/[^/]+$/.test(target)||/^\/stella\/max\/sessions\/[^/]+(?:\/commands(?:\/[^/]+)?)?$/.test(target));
    const allowed=(method==='POST'&&PHOTO_ROUTE.test(target))||maxRoute||target==='/health'||target==='/stations/stella-main'||/^\/(sessions|visits|admissions)\/[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(target)||/^\/sessions\/[^/]+\/acks\/[^/]+$/.test(target)||target==='/stella/vk/admissions'||/^\/stella\/vk\/sessions\/[^/]+\/commands$/.test(target);
    if(!allowed)throw err('ROUTE_NOT_ALLOWED');
    const h=await this.health(),dataset=h.body.instanceKey,node=peer.nodeId;
    if(method==='GET'&&target==='/health')return h;
    if(method==='GET'&&target==='/stations/stella-main')return this.call(method,target);
    if(maxRoute&&h.body.maxQuizProtocol!=='stella-max-v1')throw err('MAX_BACKEND_NOT_READY',503);
    if(method==='GET'&&target==='/max/definition')return this.call(method,target);
    if(method==='GET'&&target==='/stella/max/queue-summary'){
      const result=await this.call('GET','/max/state');
      if(result.status!==200||!Number.isSafeInteger(result.body?.queueCount)||result.body.queueCount<0||!Object.hasOwn(result.body,'current'))throw err('MAX_BACKEND_NOT_READY',503);
      return {status:200,body:{protocol:'stella-max-queue-v1',waitingCount:result.body.queueCount,gameBusy:result.body.current!==null}};
    }
    if(method==='POST'&&['/stella/vk/admissions','/stella/max/admissions'].includes(target)){
      const max=target==='/stella/max/admissions',protocol=max?'stella-max-v1':'stella-vk-v1';
      if(!body||Object.keys(body).sort().join(',')!==(max?'requestId,sessionId,stationId,visitId':'durationMs,requestId,sessionId,stationId,visitId')||!['requestId','sessionId','visitId'].every(k=>validId(body[k]))||body.stationId!=='stella-main'||(!max&&(!Number.isInteger(body.durationMs)||body.durationMs<1000||body.durationMs>120000)))throw err('ADMISSION_INVALID',400);
      const old=this.intent(dataset,node,'request',body.requestId);
      if(old){if(old.payload!==canonical(body)||old.protocol!==protocol)throw err('ADMISSION_ID_REUSED',409);}
      else{
        // Do not acquire a grant by submitting somebody else's existing identifier.
        for(const [route,id] of [['admissions',body.requestId],['sessions',body.sessionId],['visits',body.visitId]]){
          const existing=await this.call('GET',`/${route}/${id}`);
          if(existing.status!==404){const winner=this.intent(dataset,node,'request',body.requestId);if(existing.status<500&&winner?.payload===canonical(body))break;throw err(existing.status>=500?'BACKEND_NOT_READY':'IDENTIFIER_ALREADY_EXISTS',existing.status>=500?503:409);}
        }
        try{this.save(dataset,node,body,protocol);}catch{const winner=this.intent(dataset,node,'request',body.requestId);if(winner?.payload!==canonical(body)||winner.protocol!==protocol)throw err('IDENTIFIER_ALREADY_EXISTS',409);}
      }
      return this.call(method,target,body);
    }
    const photoMatch=target.match(PHOTO_ROUTE);
    if(method==='POST'&&photoMatch){
      if(!body||Object.keys(body).sort().join(',')!=='appearance,captureId,consent,expectedRevision,imageBase64'||!validId(body.captureId)||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0||!['male','female'].includes(body.appearance)||!body.consent||Object.keys(body.consent).sort().join(',')!=='accepted,version'||body.consent.accepted!==true||body.consent.version!=='poster-v1'||typeof body.imageBase64!=='string'||!body.imageBase64.length||body.imageBase64.length>2796204||! /^[A-Za-z0-9+/]*={0,2}$/.test(body.imageBase64)||body.imageBase64.length%4!==0||Buffer.from(body.imageBase64,'base64').toString('base64')!==body.imageBase64||Buffer.from(body.imageBase64,'base64').length>2097152)throw err('PHOTO_INVALID',400);
      const projection=await this.owned(dataset,node,photoMatch[1],'stella-vk-v1'),r=projection.body.registry,s=projection.body.state;
      if(s.phase!=='active'||s.screen!=='camera'||s.revision!==body.expectedRevision)throw err('PHOTO_STATE_CHANGED',409);
      const station=await this.call('GET','/stations/stella-main');
      if(station.status!==200)throw err('BACKEND_NOT_READY',503);
      if(station.body?.sessionId!==r.sessionId||station.body?.visitId!==r.visitId||station.body?.generation!==r.generation)throw err('SESSION_NOT_CURRENT',409);
      return this.call(method,target,body);
    }
    let match=target.match(/^\/(?:stella\/max\/)?admissions\/([^/]+)$/);
    if(method==='GET'&&match){const grant=this.intent(dataset,node,'request',match[1]);if(!grant||(target.startsWith('/stella/max/')&&grant.protocol!=='stella-max-v1'))throw err('ADMISSION_NOT_OWNED');return this.call(method,target);}
    match=target.match(/^\/stella\/max\/sessions\/([^/]+)(?:\/commands\/([^/]+))?$/);
    if(method==='GET'&&match){await this.owned(dataset,node,match[1],'stella-max-v1');return this.call(method,target);}
    match=target.match(/^\/sessions\/([^/]+)(?:\/acks\/([^/]+))?$/);
    if(method==='GET'&&match){const projection=await this.owned(dataset,node,match[1]);return match[2]?this.call(method,target):projection;}
    match=target.match(/^\/visits\/([^/]+)$/);
    if(method==='GET'&&match){const grant=this.intent(dataset,node,'visit',match[1]);if(!grant)throw err('VISIT_NOT_OWNED');await this.owned(dataset,node,grant.session);const result=await this.call(method,target);if(result.status===200)result.body.sessionIds=(result.body.sessionIds||[]).filter(id=>this.intent(dataset,node,'session',id));return result;}
    match=target.match(/^\/stella\/(?:vk|max)\/sessions\/([^/]+)\/commands$/);
    if(method==='POST'&&match){
      if(!body||!validId(body.commandId))throw err('COMMAND_INVALID',400);
      const projection=await this.owned(dataset,node,match[1],target.startsWith('/stella/max/')?'stella-max-v1':'stella-vk-v1'),r=projection.body.registry;
      const old=this.db.prepare('SELECT * FROM commands WHERE dataset=? AND session=? AND command=?').get(dataset,match[1],body.commandId);
      if(old&&(old.node!==node||old.payload!==canonical(body)))throw err('COMMAND_ID_REUSED',409);
      if(old){const ack=await this.call('GET',`/sessions/${match[1]}/acks/${body.commandId}`);if(ack.status!==404)return ack;}
      const station=await this.call('GET','/stations/stella-main');
      if(station.status!==200)throw err('BACKEND_NOT_READY',503);
      if(station.body?.sessionId!==r.sessionId||station.body?.visitId!==r.visitId||station.body?.generation!==r.generation)throw err('SESSION_NOT_CURRENT',409);
      if(!old){try{this.db.prepare('INSERT INTO commands VALUES(?,?,?,?,?)').run(dataset,node,r.sessionId,body.commandId,canonical(body));}
        catch{const winner=this.db.prepare('SELECT * FROM commands WHERE dataset=? AND session=? AND command=?').get(dataset,r.sessionId,body.commandId);if(winner?.node!==node||winner?.payload!==canonical(body))throw err('COMMAND_ID_REUSED',409);}}
      return this.call(method,target,body);
    }
    throw err('ROUTE_NOT_ALLOWED');
  }
}

export async function startBusinessGateway(root,{port,upstream,canonical,ownedMasterBootId=null}={}){
  const config=JSON.parse(fs.readFileSync(path.join(root,'config/business-gateway.json'),'utf8'));
  const renderEnabled=config.renderIdleEnabled===true;
  if(config.schemaVersion!==1||config.role!=='MASTER'||!['127.0.0.1','0.0.0.0'].includes(config.listen?.host)||!Number.isInteger(config.listen?.port)||config.listen.port<1024||config.listen.port>65535||!Array.isArray(config.peers)||config.peers.length<1||config.peers.length>(renderEnabled?4:2))throw err('GATEWAY_CONFIG_INVALID',503);
  const roles=new Set(),nodes=new Set(),pins=new Set();
  for(const peer of config.peers){
    const fingerprint=pin(peer.fingerprint);
    if(!validId(peer.nodeId)||!['STELLA','MAX_RIGHT',...(renderEnabled?['ARCH_RIBBON','VK_LEFT']:[])].includes(peer.role)||peer.role==='STELLA'&&peer.stationId!=='stella-main'||peer.role==='MAX_RIGHT'&&config.maxGameEnabled!==true&&!renderEnabled||!/^[A-F0-9]{64}$/.test(fingerprint)||roles.has(peer.role)||nodes.has(peer.nodeId)||pins.has(fingerprint))throw err('GATEWAY_CONFIG_INVALID',503);
    roles.add(peer.role);nodes.add(peer.nodeId);pins.add(fingerprint);
  }
  const credentials=identity(root,{identity:config.identity});
  fs.mkdirSync(path.join(root,'data'),{recursive:true});
  const authority=new StellaAuthority(path.join(root,'data/gateway-access.sqlite'),upstream||((request)=>localMasterRequest(config.backendPort,request)),{maxEnabled:config.stellaMaxEnabled===true});
  let maxAuthority,renderAuthority,vkAuthority,audio;
  try{
    if(renderEnabled)renderAuthority=new RenderIdleAuthority({health:()=>authority.health(),showState:()=>authority.call('GET','/max/show/state'),ownedMasterBootId,visualRevision:config.renderIdle?.visualRevision,policy:config.renderIdle?.policy});
    if(renderEnabled)vkAuthority=new VkAuthority({upstream:authority.upstream,health:()=>authority.health()});
    if(config.maxGameEnabled===true)maxAuthority=new MaxAuthority(authority.db,authority.upstream,{canonical:canonical||canonicalProxy(root,config.canonicalPort),presentationMaster:presentationMasterRequest(root,config.backendPort),ownedMasterBootId});
  }
  catch(error){authority.close();throw error;}
  try{audio=await startMasterAudio(root);}catch(error){console.error('[master-audio]',error.message);}
  const streams=new Map();
  const server=https.createServer({...credentials,requestCert:true,rejectUnauthorized:true,minVersion:'TLSv1.3',maxHeaderSize:16384},async(req,res)=>{
    try{
      if(req.headers.origin)throw err('BROWSER_NOT_ALLOWED');
      const peer=config.peers.find(p=>pin(p.fingerprint)===pin(req.socket.getPeerCertificate().fingerprint256));
      if(!peer||!req.socket.authorized)throw err('PEER_NOT_ALLOWED');
      if(isVkMediaPath(req.url)){await sendVkMedia({peer,path:req.url,method:req.method,port:config.backendPort,res,health:()=>authority.health()});return;}
      let body;
      if(['POST','PUT'].includes(req.method)){
        if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw err('JSON_REQUIRED',415);
        const limit=businessRequestLimit(peer,req.method,req.url);
        if(Number(req.headers['content-length'])>limit)throw err('BODY_TOO_LARGE',413);
        let size=0;const chunks=[];for await(const b of req){size+=b.length;if(size>limit)throw err('BODY_TOO_LARGE',413);chunks.push(b);}try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{throw err('INVALID_JSON',400);}
      }
      let binding;
      if(req.headers['x-stand-binding']!==undefined){const header=req.headers['x-stand-binding'];if(typeof header!=='string'||header.length>4096||!/^[A-Za-z0-9_-]+$/.test(header))throw err('BINDING_INVALID',400);try{binding=JSON.parse(Buffer.from(header,'base64url'));}catch{throw err('BINDING_INVALID',400);}}
      const routeAuthority=req.url==='/production/audio/snapshot'?audio?.authority:req.url==='/production/render/bootstrap'?renderAuthority:['ARCH_RIBBON','VK_LEFT'].includes(peer.role)?vkAuthority:peer.role==='MAX_RIGHT'?maxAuthority:peer.role==='STELLA'?authority:null;if(!routeAuthority)throw err('ROLE_NOT_ALLOWED');
      const result=await routeAuthority.handle(peer,{method:req.method,path:req.url,body,binding});
      if(!result.stream){reply(res,result.status,result.body);return;}
      streams.get(peer.nodeId)?.();
      const abort=new AbortController();const close=()=>{abort.abort();result.cleanup?.();result.stream.destroy();};streams.set(peer.nodeId,close);res.once('close',close);
      let checking=false;const watch=setInterval(async()=>{if(checking)return;checking=true;try{await maxAuthority.validate(peer,binding);}catch{close();}finally{checking=false;}},500);watch.unref();
      const leaseWatch=setInterval(()=>{try{maxAuthority.leaseRemaining(peer,binding);}catch{close();}},50);leaseWatch.unref();
      try{res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store'});res.flushHeaders();await pipeline(result.stream,res,{signal:abort.signal});}
      finally{clearInterval(watch);clearInterval(leaseWatch);close();if(streams.get(peer.nodeId)===close)streams.delete(peer.nodeId);}
    }catch(error){if(res.headersSent)res.destroy();else reply(res,error.status||503,{error:error.code||'GATEWAY_UNAVAILABLE'});}
  });
  server.requestTimeout=6000;server.headersTimeout=6000;
  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port??config.listen.port,config.listen.host,resolve);});}catch(error){authority.close();throw error;}
  let closing;
  return {server,authority,maxAuthority,renderAuthority,port:server.address().port,close:()=>closing??=(async()=>{
    renderAuthority?.close();vkAuthority?.close();await audio?.close();
    const drain=maxAuthority?.close();for(const close of streams.values())close();
    await Promise.all([drain,new Promise(resolve=>{const deadline=setTimeout(()=>server.closeAllConnections(),2000);server.close(()=>{clearTimeout(deadline);resolve();});server.closeIdleConnections();})]);
    authority.close();
  })()};
}
