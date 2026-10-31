'use strict';
const http=require('node:http'),os=require('node:os');
const paths=new Set(['/__kdw/screen/state','/__kdw/screen/state.csv']);
const privateIP=ip=>{const p=String(ip||'').replace(/^::ffff:/,'').split('.').map(Number);return p.length===4&&p.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(p[0]===10||p[0]===127||p[0]===192&&p[1]===168||p[0]===172&&p[1]>=16&&p[1]<=31);};
const addresses=()=>Object.values(os.networkInterfaces()).flat().filter(a=>(a.family==='IPv4'||a.family===4)&&!a.internal&&privateIP(a.address)).map(a=>a.address);
// A separate read-only HTTP ingress: no settings, photos, session data or commands.
function createLanScreen({port,readPort=port+20}){
 let server=null,enabled=false,error=null;
 const state=()=>({enabled,port:server?.address()?.port??readPort,protocol:'http',urls:enabled?addresses().map(ip=>`http://${ip}:${server.address().port}/__kdw/screen/state.csv`):[],error});
 const reject=(res,code,message)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:message}));};
 function request(req,res){
  try{
   if(!privateIP(req.socket.remoteAddress))return reject(res,403,'LOCAL_NETWORK_ONLY');
   const base=new URL('http://'+req.headers.host);
   if(base.username||base.password||base.port!==String(server.address().port)||!['127.0.0.1','localhost',os.hostname().toLowerCase(),...addresses()].includes(base.hostname))return reject(res,403,'INVALID_HOST');
   if(req.headers.origin&&req.headers.origin!==base.origin)return reject(res,403,'INVALID_ORIGIN');
   const url=new URL(req.url,base);
   if(url.origin!==base.origin||!paths.has(url.pathname))return reject(res,404,'READ_ONLY_SCREEN_ROUTE');
   if(req.method!=='GET')return reject(res,405,'READ_ONLY');
   const upstream=http.get({hostname:'127.0.0.1',port,path:url.pathname,headers:{host:`127.0.0.1:${port}`}},response=>{
    res.writeHead(response.statusCode,{'Content-Type':response.headers['content-type']||'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.pipe(res);
   });
   upstream.setTimeout(3000,()=>upstream.destroy(Error('TIMEOUT')));
   upstream.on('error',()=>{if(!res.headersSent)reject(res,502,'LOCAL_API_UNAVAILABLE');else res.destroy();});
   req.on('aborted',()=>upstream.destroy());res.on('close',()=>upstream.destroy());
  }catch{reject(res,400,'INVALID_REQUEST');}
 }
 return{state,async listen(){
  if(server)return;
  server=http.createServer({requestTimeout:5000,headersTimeout:5000},request);server.maxConnections=64;server.on('upgrade',(_req,socket)=>socket.destroy());
  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(readPort,'0.0.0.0',()=>{server.off('error',reject);resolve();});});enabled=true;server.on('error',e=>{error=e.code||'LISTENER_ERROR';});}
  catch(e){error=e.code||'START_FAILED';server.close();server=null;}
 },async close(){enabled=false;if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));server=null;}}};
}
module.exports={createLanScreen};
