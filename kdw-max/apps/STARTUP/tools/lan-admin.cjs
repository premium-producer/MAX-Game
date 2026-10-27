'use strict';
const http=require('node:http'),https=require('node:https'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net');
const privateIP=ip=>{ip=String(ip||'').replace(/^::ffff:/,'');if(net.isIP(ip)!==4)return false;const a=ip.split('.').map(Number);return a[0]===10||a[0]===127||a[0]===192&&a[1]===168||a[0]===172&&a[1]>=16&&a[1]<=31||a[0]===169&&a[1]===254;};
const addresses=()=>Object.values(os.networkInterfaces()).flat().filter(a=>(a.family==='IPv4'||a.family===4)&&!a.internal&&privateIP(a.address)&&!a.address.startsWith('169.254.')).map(a=>a.address);
function allowedPath(app,pathname,method){
 if(app==='stela'&&['/__kdw/screen/state','/__kdw/screen/state.csv','/__kdw/screen/events'].includes(pathname))return method==='GET';
 if(!['GET','HEAD','POST'].includes(method))return false;
 if(/^\/__kdw\/(operator|sound|runtime)\//.test(pathname))return true;
 if(pathname==='/__kdw/lan-admin/panel.js')return method==='GET';
 if(['/__kdw/settings','/__kdw/health','/__kdw/lan-admin'].includes(pathname))return method!=='POST';
 if(app==='max'&&pathname.startsWith('/__kdw/layout/'))return true;
 if(app==='stela'&&/^\/__kdw\/audio\/(config|describe|editor\/(open|finish)|bundle\/(import|export))$/.test(pathname))return true;
 if(method==='POST')return false;
 if(app==='max')return /^\/(admin|webgl-v5|assets|brand|config|earth|icons|audio|licenses)\//.test(pathname);
 return /^\/stella\/(admin|operator)\//.test(pathname);
}
/** Separate LAN admin ingress. The application and voice/data APIs stay loopback-only. */
function createLanAdmin({root,port,app}){
 let server=null,enabled=false,error=null,config;const directory=path.join(root,'data/lan-admin'),configFile=path.join(directory,'config.json'),adminPort=port+10;
 const entry=app==='max'?'/admin/':'/stella/admin/';
 const state=()=>({enabled,port:adminPort,protocol:'https',urls:enabled?addresses().map(ip=>`https://${ip}:${adminPort}${entry}`):[],error});
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 function request(req,res){
  try{
   if(!privateIP(req.socket.remoteAddress))return json(res,403,{error:'LOCAL_NETWORK_ONLY'});
   const host=String(req.headers.host||'').toLowerCase(),u=new URL('https://'+host);
   if(u.username||u.password||u.port!==String(adminPort)||![...addresses(),'127.0.0.1','localhost',os.hostname().toLowerCase()].includes(u.hostname))return json(res,403,{error:'INVALID_HOST'});
   const origin=u.origin;
   if(req.headers.origin&&req.headers.origin!==origin||req.method==='POST'&&req.headers.origin!==origin)return json(res,403,{error:'INVALID_ORIGIN'});
   const url=new URL(req.url,origin);if(url.origin!==origin)return json(res,403,{error:'INVALID_TARGET'});
   if(url.pathname==='/'){res.writeHead(302,{Location:entry});res.end();return;}
   if(!allowedPath(app,url.pathname,req.method))return json(res,404,{error:'ADMIN_ROUTE_ONLY'});
   const headers={...req.headers,host:'127.0.0.1:'+port};delete headers['x-forwarded-host'];delete headers['x-forwarded-for'];delete headers['x-forwarded-proto'];
   if(headers.origin)headers.origin='http://127.0.0.1:'+port;
   const upstream=http.request({hostname:'127.0.0.1',port,path:url.pathname+url.search,method:req.method,headers},response=>{
    const responseHeaders={...response.headers,'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin'};delete responseHeaders['access-control-allow-origin'];
    res.writeHead(response.statusCode,responseHeaders);response.pipe(res);
   });
   upstream.setTimeout(60000,()=>upstream.destroy(Error('ADMIN_TIMEOUT')));
   upstream.on('error',()=>{if(!res.headersSent)json(res,502,{error:'LOCAL_API_UNAVAILABLE'});else res.destroy();});
   req.on('aborted',()=>upstream.destroy());res.on('close',()=>upstream.destroy());req.pipe(upstream);
  }catch{json(res,400,{error:'INVALID_REQUEST'});}
 }
 return{state,handle(req,res){if(req.method==='GET'&&req.url==='/__kdw/lan-admin'){json(res,200,state());return true;}if(req.method==='GET'&&req.url==='/__kdw/lan-admin/panel.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(__dirname,'lan-admin-panel.js')));return true;}return false;},async listen(){
  if(!fs.existsSync(configFile))return;
  try{config=JSON.parse(fs.readFileSync(configFile,'utf8').replace(/^\uFEFF/,''));if(config.enabled!==true)return;
   if(typeof config.passphrase!=='string'||config.passphrase.length<16)throw Error('INVALID_LAN_TLS_CONFIG');
   server=https.createServer({pfx:fs.readFileSync(path.join(directory,'server.pfx')),passphrase:config.passphrase,minVersion:'TLSv1.2',requestTimeout:60000,headersTimeout:10000},request);
   server.on('upgrade',(_req,socket)=>socket.destroy());
   await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(adminPort,'0.0.0.0',()=>{server.off('error',reject);resolve();});});
   enabled=true;server.on('error',e=>{error=e.code||'LAN_LISTENER_FAILED';});
  }catch(e){error=e.code||'LAN_ADMIN_START_FAILED';server?.close();server=null;enabled=false;}
 },async close(){enabled=false;if(server){server.closeAllConnections();await new Promise(resolve=>server.close(()=>resolve()));server=null;}}};
}
module.exports={createLanAdmin,allowedPath,privateIP};
