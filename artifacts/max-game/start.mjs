import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import parseRange from 'range-parser';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.MAX_GAME_PORT||8785),origin=`http://localhost:${port}`;
const types={'.mp4':'video/mp4','.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.bin':'application/octet-stream','.webm':'audio/webm','.ogg':'audio/ogg','.mp3':'audio/mpeg','.md':'text/plain','.txt':'text/plain'};
function open(){if(!process.argv.includes('--no-open')&&process.platform==='win32')spawn('rundll32.exe',['url.dll,FileProtocolHandler',origin],{windowsHide:true,stdio:'ignore'}).unref();}
const identity={application:'max-space-game',version:'0.1.0'};
export function resolveAsset(requested){
 const relative=decodeURIComponent(new URL(requested,origin).pathname).slice(1)||'index.html';
 if(relative.includes('\\')||relative.split('/').some(s=>s.startsWith('.')||s.includes(':')))throw Error('Invalid path');
 const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!types[path.extname(file)])throw Error('Invalid path');return file;
}
export function createGameServer(){return http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(req.method==='HEAD'?undefined:JSON.stringify(identity));}
 try{
  const file=resolveAsset(req.url),stat=fs.statSync(file);if(!stat.isFile())throw Error('Not a file');
  const video=path.extname(file)==='.mp4';
  const headers={'Content-Type':types[path.extname(file)],'Content-Length':stat.size,'Accept-Ranges':'bytes','Cache-Control':video?'public, max-age=3600':'no-store'};
  let range;
  if(req.method==='GET'&&req.headers.range){
   const ranges=parseRange(stat.size,req.headers.range,{combine:true});
   if(ranges===-1){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}
   if(Array.isArray(ranges)&&ranges.type==='bytes'&&ranges.length===1)range=ranges[0];
  }
  if(range){headers['Content-Range']=`bytes ${range.start}-${range.end}/${stat.size}`;headers['Content-Length']=range.end-range.start+1;}
  res.writeHead(range?206:200,headers);if(req.method==='HEAD')return res.end();
  const stream=fs.createReadStream(file,range);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!Number.isInteger(port)||port<1024||port>65535)throw Error('MAX_GAME_PORT must be 1024–65535');
 const server=createGameServer();
 server.on('error',async error=>{if(error.code==='EADDRINUSE'){try{const r=await fetch(origin+'/health',{signal:AbortSignal.timeout(2000)});if((await r.json()).application===identity.application){console.log('Already running: '+origin);open();return;}}catch{}console.error(`Port ${port} belongs to another service. Choose MAX_GAME_PORT.`);}else console.error(error.message);process.exitCode=1;});
 server.listen(port,'localhost',()=>{console.log(origin);open();});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.closeAllConnections();server.close();});
}
