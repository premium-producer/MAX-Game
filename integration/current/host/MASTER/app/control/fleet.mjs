import fs from 'node:fs';
import {MaxLidarControl} from './max-lidar-control.mjs';
import {RenderOutputControl,handleOutputOperatorRoute} from './render-output-control.mjs';
import {localMasterRequest} from './local-master-request.mjs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import tls from 'node:tls';
import {isIP} from 'node:net';
import {randomBytes, randomUUID, createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createLanAccess,isPrivateIPv4} from './lan-access.mjs';

export const PROTOCOL='stand-node-v1';
const ROLES=new Set(['STELLA','MAX_RIGHT','ARCH_RIBBON','VK_LEFT','SENSOR_LEFT','SENSOR_CENTRE','SENSOR_RIGHT']);
const token=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(v);
export const pin=v=>String(v).replaceAll(':','').toUpperCase();
function fail(message,status=400){return Object.assign(new Error(message),{status});}
export function validAddress(host){
  if(isIP(host)!==4)return false;
  const [a,b]=host.split('.').map(Number);
  return a===127||a===10||(a===192&&b===168)||(a===172&&b>=16&&b<=31);
}
function validPort(n){return Number.isInteger(n)&&n>=1024&&n<=65535;}
export function validateFleet(c){
  if(c?.schemaVersion!==1||!token(c.releaseId)||!Number.isSafeInteger(c.revision)||c.revision<0)throw fail('Invalid fleet version');
  if(c.operator?.host!=='127.0.0.1'||!validPort(c.operator?.port))throw fail('Operator UI must use loopback');
  const lan=c.operator.lanAccess;
  if(lan&&(typeof lan.enabled!=='boolean'||!isPrivateIPv4(lan.host)))throw fail('Invalid operator LAN address');
  if(!['lan_only','auto'].includes(c.connectivityPolicy))throw fail('Invalid connectivity policy');
  if(!c.identity||['ca','cert','key'].some(k=>typeof c.identity[k]!=='string'))throw fail('Missing fleet identity');
  if(!Array.isArray(c.nodes)||c.nodes.length>7)throw fail('Invalid role registry');
  const ids=new Set(),roles=new Set(),pins=new Set(),addresses=new Set();
  for(const n of c.nodes){
    if(!token(n.nodeId)||!ROLES.has(n.role)||!validAddress(n.host)||!validPort(n.port)||!/^[A-F0-9]{64}$/.test(pin(n.fingerprint)))throw fail('Invalid node record');
    const address=`${n.host}:${n.port}`;
    if(ids.has(n.nodeId)||roles.has(n.role)||pins.has(pin(n.fingerprint))||addresses.has(address))throw fail('Duplicate node identity, role or endpoint');
    ids.add(n.nodeId);roles.add(n.role);pins.add(pin(n.fingerprint));addresses.add(address);
  }
  return c;
}
function secretPath(root,relative){
  const base=fs.realpathSync(path.join(root,'secrets'));
  const baseRelative=path.relative(fs.realpathSync(root),base);
  if(baseRelative.startsWith('..')||path.isAbsolute(baseRelative))throw fail('Secrets directory escapes package');
  if(path.isAbsolute(relative)||!relative.replaceAll('\\','/').startsWith('secrets/'))throw fail('Identity must be under secrets');
  const full=fs.realpathSync(path.resolve(root,relative));
  const rel=path.relative(base,full);
  if(rel.startsWith('..')||path.isAbsolute(rel)||!fs.statSync(full).isFile())throw fail('Invalid identity path');
  return full;
}
export function identity(root,c){return Object.fromEntries(['ca','cert','key'].map(k=>[k,fs.readFileSync(secretPath(root,c.identity[k]))]));}
export function requestHealth(node,credentials,{timeout=2000}={}){
  return new Promise((resolve,reject)=>{
    const req=https.request({host:node.host,port:node.port,path:'/node/v1/health',method:'GET',...credentials,
      agent:false,minVersion:'TLSv1.3',rejectUnauthorized:true,
      checkServerIdentity:(host,peer)=>tls.checkServerIdentity(host,peer)||(pin(peer.fingerprint256)===pin(node.fingerprint)?undefined:Error('Peer fingerprint mismatch'))},res=>{
      let size=0;const chunks=[];
      res.on('data',b=>{size+=b.length;if(size>65536)res.destroy(Error('Oversized node response'));else chunks.push(b);});
      res.on('error',reject);
      res.on('end',()=>{try{if(res.statusCode!==200)throw Error('Node refused health request');resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(e){reject(e);}});
    });
    const deadline=setTimeout(()=>req.destroy(Error('Node request timed out')),timeout);
    req.once('close',()=>clearTimeout(deadline));req.on('error',reject);req.end();
  });
}
export function verifyHealth(n,h,releaseId){
  if(h?.protocolVersion!==PROTOCOL||h.nodeId!==n.nodeId||h.role!==n.role||h.releaseId!==releaseId||!token(h.bootId))throw fail('Node identity/version mismatch',409);
  if(h.readiness?.host!=='ready')throw fail('Node host not ready',409);
  // Other readiness fields are deliberately not promoted to scene-ready.
  return {bootId:h.bootId,readiness:h.readiness,capabilities:Array.isArray(h.capabilities)?h.capabilities:[]};
}
export class Fleet {
  constructor(root,{healthRequest=requestHealth}={}){
    this.root=fs.realpathSync(root);this.rootId=createHash('sha256').update(this.root.toLowerCase()).digest('hex');this.file=path.join(this.root,'config/fleet.json');
    this.config=validateFleet(JSON.parse(fs.readFileSync(this.file,'utf8')));
    this.credentials=identity(this.root,this.config);this.request=healthRequest;this.status=new Map();this.pending=null;
  }
  state(){return {protocolVersion:PROTOCOL,releaseId:this.config.releaseId,revision:this.config.revision,connectivityPolicy:this.config.connectivityPolicy,
    scope:'production-foundation',rootId:this.rootId,businessConnected:false,external:{ai:'not-integrated',publication:'not-integrated'},
    nodes:this.config.nodes.map(n=>({nodeId:n.nodeId,role:n.role,host:n.host,port:n.port,...(this.status.get(n.nodeId)||{status:'not-checked'})}))};}
  async refresh(){
    if(this.pending){await this.pending;return this.state();}
    const revision=this.config.revision,nodes=structuredClone(this.config.nodes);
    this.pending=Promise.all(nodes.map(async n=>{
      let value;
      try{const h=await this.request(n,this.credentials);value={status:'connected',checkedAt:new Date().toISOString(),...verifyHealth(n,h,this.config.releaseId)};}
      catch(e){value={status:'unavailable',checkedAt:new Date().toISOString(),error:e.status===409?'identity-or-version-mismatch':'connection-or-trust-failed'};}
      if(this.config.revision===revision)this.status.set(n.nodeId,value);
    })).finally(()=>{this.pending=null;});
    await this.pending;return this.state();
  }
  address(nodeId,{host,port,expectedRevision}){
    if(expectedRevision!==this.config.revision)throw fail('Configuration changed; refresh first',409);
    if(!this.config.nodes.some(n=>n.nodeId===nodeId))throw fail('Unknown provisioned node',404);
    const next=validateFleet({...this.config,revision:this.config.revision+1,nodes:this.config.nodes.map(n=>n.nodeId===nodeId?{...n,host,port}:n)});
    const temp=this.file+'.'+randomUUID()+'.tmp';
    try{fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,this.file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
    this.config=next;this.status.clear();return this.state();
  }
}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function readBody(req){let n=0,chunks=[];for await(const b of req){n+=b.length;if(n>8192)throw fail('Body too large',413);chunks.push(b);}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw fail('Invalid JSON');}}
export function createFleetServer(root,{port,healthRequest}={}){
  const fleet=new Fleet(root,{healthRequest});const csrf=randomBytes(24).toString('hex'),bootId=randomUUID();
  fs.mkdirSync(path.join(fleet.root,'data'),{recursive:true});
  const outputControl=new RenderOutputControl(path.join(fleet.root,'data/gateway-access.sqlite'));
  const lidarControl=new MaxLidarControl(fleet,{verifyHealth});
  let origin='';
  const lanConfig=fleet.config.operator.lanAccess;
  const lan=lanConfig?.enabled?createLanAccess({host:lanConfig.host}):null;
  const gatewayFile=path.join(root,'config/business-gateway.json'); const gatewayConfig=fs.existsSync(gatewayFile)?JSON.parse(fs.readFileSync(gatewayFile,'utf8')):null;
  const showRequest=req=>{if(!gatewayConfig)throw fail('Business gateway not configured',503);return localMasterRequest(gatewayConfig.backendPort,req);};
  const server=http.createServer(async(req,res)=>{
    try{
      if(req.headers.host!==new URL(origin).host)throw fail('Host rejected',403);
      const url=new URL(req.url,origin);
      if(req.method==='GET'&&url.pathname==='/'){
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff'});
        return res.end(fs.readFileSync(new URL('./public/index.html',import.meta.url)));
      }
      if(req.method==='GET'&&['/app.js','/presentation-control.mjs','/assets-editor.mjs','/style.css','/render-output-panel.js','/max-lidar-panel.mjs','/selected-autoplay.mjs'].includes(url.pathname)){
        res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')||url.pathname.endsWith('.mjs')?'text/javascript':'text/css','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
        return res.end(fs.readFileSync(new URL('./public'+url.pathname,import.meta.url)));
      }
      if(req.method==='GET'&&url.pathname==='/fleet/v1/max-lidar'){const r=await lidarControl.handle('GET');return json(res,r.status,r.body);}
      if(req.method==='GET'&&url.pathname==='/fleet/v1/render-output')return json(res,200,outputControl.state());
      if(req.method==='GET'&&url.pathname==='/fleet/v1/state')return json(res,200,{...fleet.state(),bootId,csrf,lanAccess:lan?{enabled:true,url:`http://${lanConfig.host}:${fleet.config.operator.port}/`}:{enabled:false}});
      if(req.method==='GET'&&url.pathname==='/fleet/v1/max-presentation'){const r=await showRequest({method:'GET',path:'/max/presentation'});return json(res,r.status,r.body);}
      if(req.method==='GET'&&url.pathname==='/fleet/v1/max-presentation/catalog'){const r=await showRequest({method:'GET',path:'/max/presentation/catalog'});return json(res,r.status,r.body);}
      if(req.method==='GET'&&url.pathname==='/fleet/v1/max-autoplay'){const r=await showRequest({method:'GET',path:'/max/presentation/autoplay'});return json(res,r.status,r.body);}
      if(req.method==='GET'&&url.pathname==='/fleet/v1/max-show') {const r=await showRequest({method:'GET',path:'/max/show/state'});return json(res,r.status,r.body);}
      if(req.method==='POST'){
        if(req.headers.origin!==origin||req.headers['x-fleet-csrf']!==csrf||!String(req.headers['content-type']).startsWith('application/json'))throw fail('Operator authorization rejected',403);
        const body=await readBody(req);
        if(url.pathname==='/fleet/v1/max-lidar'){const r=await lidarControl.handle('POST',body);return json(res,r.status,r.body);}
        const outputResult=handleOutputOperatorRoute(outputControl,req.method,url.pathname,body);if(outputResult)return json(res,outputResult.status,outputResult.body);
        if(url.pathname==='/fleet/v1/max-presentation'){const r=await showRequest({method:'POST',path:'/max/presentation',body});return json(res,r.status,r.body);}
        if(url.pathname==='/fleet/v1/max-presentation/settings'){const r=await showRequest({method:'POST',path:'/max/presentation/settings',body});return json(res,r.status,r.body);}
        if(url.pathname==='/fleet/v1/max-autoplay'){const r=await showRequest({method:'POST',path:'/max/presentation/autoplay',body});return json(res,r.status,r.body);}
        if(url.pathname==='/fleet/v1/max-show'){const r=await showRequest({method:'POST',path:'/max/show-mode',body});return json(res,r.status,r.body);}
        if(url.pathname==='/fleet/v1/check')return json(res,200,await fleet.refresh());
        const m=/^\/fleet\/v1\/nodes\/([A-Za-z0-9._-]+)\/address$/.exec(url.pathname);
        if(m)return json(res,200,fleet.address(m[1],body));
        if(url.pathname==='/fleet/v1/stop'){
          if(body.bootId!==bootId)throw fail('Stale instance',409);
          json(res,200,{stopping:true});setImmediate(()=>server.close());return;
        }
      }
      throw fail('Not found',404);
    }catch(e){json(res,e.status||500,{error:e.status?e.message:'Internal error'});}
  });
  server.once('close',()=>outputControl.close());
  server.requestTimeout=5000;server.headersTimeout=5000;server.keepAliveTimeout=1000;
  server.on('close',()=>{void lan?.close();});
  return {server,fleet,close:async()=>{await lan?.close();server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));},start:async()=>{
   await new Promise((resolve,reject)=>{
    server.once('error',reject);server.listen({host:'127.0.0.1',port:port??fleet.config.operator.port,exclusive:true},()=>{
      origin=`http://127.0.0.1:${server.address().port}`;server.removeListener('error',reject);resolve({origin,bootId});
    });
   });
   try{await lan?.start();}catch(error){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));throw error;}
   return {origin,bootId,lanUrl:lan?`http://${lanConfig.host}:${fleet.config.operator.port}/`:null};
  }};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=process.argv[2];if(!root)throw Error('Usage: fleet.mjs ROLE_ROOT');
  const app=createFleetServer(root);console.log(JSON.stringify(await app.start()));
}
