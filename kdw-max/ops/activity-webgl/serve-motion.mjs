import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=process.cwd(),report=path.join(root,'docs/verification-activity-webgl-iab-20261028');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'max-motion-iab-'));fs.symlinkSync(path.join(root,'apps/max-game/www'),path.join(temp,'www'),'junction');fs.mkdirSync(report,{recursive:true});
const {createPortableServer}=require('../../apps/max-game/launcher/portable-server.cjs');
const upstream=createPortableServer({root:temp,config:{id:'motion-local',version:'test',port:19785,production:false,entry:'/'}});await upstream.listen();
const server=http.createServer((req,res)=>{
 if(req.headers.host!=='127.0.0.1:19784'){res.writeHead(403).end();return;}
 if(req.url==='/__kdw/settings'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({production:false}));return;}
 if(req.url==='/__motion/probe.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(root,'ops/activity-webgl/motion-probe.js')));return;}
 const match=/^\/__motion\/report\/([a-z0-9-]{1,48})$/.exec(req.url);
 if(match&&req.method==='POST'){
  if(req.headers.origin!=='http://127.0.0.1:19784'){res.writeHead(403).end();return;}
  const chunks=[];let size=0;req.on('data',c=>{size+=c.length;if(size>5000000)req.destroy();else chunks.push(c);});req.on('end',()=>{try{const data=JSON.parse(Buffer.concat(chunks));fs.writeFileSync(path.join(report,match[1]+'.json'),JSON.stringify(data));console.log(JSON.stringify({saved:match[1],samples:data.samples.length,errors:data.errors.length}));res.end('OK');}catch{res.writeHead(400).end();}});return;
 }
 const proxy=http.request({hostname:'127.0.0.1',port:19785,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:19785'}},r=>{
  if((r.headers['content-type']||'').includes('text/html')&&req.url.startsWith('/webgl-v5/')&&new URL(req.url,'http://127.0.0.1:19784').searchParams.has('audit')){
   const chunks=[];r.on('data',c=>chunks.push(c));r.on('end',()=>{const html=Buffer.concat(chunks).toString().replace('<head>','<head><script src="/__motion/probe.js"></script>');res.writeHead(r.statusCode,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(html);});
  }else{res.writeHead(r.statusCode,r.headers);r.pipe(res);}
 });proxy.on('error',()=>res.writeHead(502).end());req.pipe(proxy);
});
server.listen(19784,'127.0.0.1',()=>console.log('Motion preview ready: http://127.0.0.1:19784'));
async function close(){server.close();await upstream.close();fs.rmSync(temp,{recursive:true,force:true});process.exit();}process.on('SIGTERM',close);process.on('SIGINT',close);
