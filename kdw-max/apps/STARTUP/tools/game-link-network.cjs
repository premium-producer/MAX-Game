// Dedicated HTTPS ingress for the two-PC kit. No UI, photo reads or admin API.
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
function pinnedFetch(url,options={},certificatePem){
 if(!certificatePem)return fetch(url,options);
 const endpoint=new URL(url);if(endpoint.protocol!=='https:')return Promise.reject(Error('TLS_REQUIRED'));
 const expected=new crypto.X509Certificate(certificatePem).fingerprint256;
 return new Promise((resolve,reject)=>{
  const request=https.request(endpoint,{method:options.method||'GET',headers:options.headers,ca:certificatePem,minVersion:'TLSv1.2',checkServerIdentity:(_host,certificate)=>certificate.fingerprint256===expected?undefined:Error('PAIR_CERTIFICATE_MISMATCH'),signal:options.signal},response=>{
   const chunks=[];let size=0;response.on('data',chunk=>{size+=chunk.length;if(size>65536){request.destroy(Error('RESPONSE_TOO_LARGE'));return;}chunks.push(chunk);});response.on('error',reject);response.on('end',()=>{const text=Buffer.concat(chunks).toString('utf8');resolve({ok:response.statusCode>=200&&response.statusCode<300,status:response.statusCode,json:async()=>JSON.parse(text)});});
  });request.on('error',reject);request.setTimeout(6000,()=>request.destroy(Error('LINK_TIMEOUT')));request.end(options.body);
 });
}
function createNetworkReceiver({root,hub}){
 const configFile=path.join(root,'data/game-link-network.local.json');let config={enabled:false};if(fs.existsSync(configFile))config=JSON.parse(fs.readFileSync(configFile,'utf8'));
 if(config.enabled!==true)return{enabled:false,listen:async()=>{},close:async()=>{}};
 if(!Number.isInteger(config.port)||config.port<1024||config.port>65535||!['0.0.0.0','127.0.0.1'].includes(config.host))throw Error('INVALID_LINK_NETWORK_CONFIG');
 const server=https.createServer({cert:fs.readFileSync(path.join(root,'data/link/server-cert.pem')),key:fs.readFileSync(path.join(root,'data/link/server-key.pem')),minVersion:'TLSv1.2',requestTimeout:15000,headersTimeout:10000},(req,res)=>{
  const respond=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
  if(req.headers.origin||req.headers['x-kdw-relay-key']!==hub.key)return respond(403,{error:'UNAUTHORIZED'});
  if(req.url==='/__kdw/settings'&&req.method==='GET')return respond(200,hub.settings());
  if(req.url==='/__kdw/link/status'&&req.method==='GET')return respond(200,{application:'kdw-max-link',protocol:1});
  if(req.url==='/__kdw/link/ingest'&&req.method==='POST'&&req.headers['content-type']==='application/json'){hub.handle(req,res);return;}
  respond(404,{error:'NOT_FOUND'});
 });
 return{enabled:true,port:config.port,server,listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port,config.host,()=>{server.off('error',reject);resolve();});}),close:()=>new Promise(resolve=>{server.closeAllConnections();server.close(()=>resolve());})};
}
module.exports={createNetworkReceiver,pinnedFetch};
