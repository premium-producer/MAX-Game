import http from 'node:http';
import {handleLocalAudio} from '../master-audio/control/local-audio-bridge.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url));
export const ASSETS=Object.freeze({
 '/':'public/index.html','/fixture.js':'public/fixture.js',
 '/vendor/three.module.js':'public/vendor/three.module.js','/vendor/three.core.js':'public/vendor/three.core.js',
 '/transport/gpu-atlas.js':'upstream/public/gpu-atlas.js','/transport/gpu-sync.js':'upstream/public/gpu-sync.js','/transport/output-plan.js':'upstream/public/output-plan.js',
 '/native-output.js':'artistic-candidate/dist/native-output.js','/native-fixture.js':'public/native-fixture.js','/fonts/vk-sans-display-700.ttf':'public/fonts/vk-sans-display-700.ttf',
 '/master-views/content-entity-view.mjs':'public/master-views/content-entity-view.mjs','/master-views/vendor/qrcode.mjs':'public/master-views/vendor/qrcode.mjs',
 '/native-external.js':'public/native-external.js','/max-show-overlay.js':'public/max-show-overlay.js',
 '/lidar-overlay.js':'public/lidar-overlay.js',
});
export async function startAssetServer({port,host='127.0.0.1',sourceRoot=here,mode='arch-fixture',requestMaster,preparedAssets}) {
 if(host!=='127.0.0.1') throw Error('Fixture server must be loopback');
 const files=new Map(await Promise.all(Object.entries(ASSETS).map(async([url,relative])=>[url,await fs.readFile(path.join(sourceRoot,relative))])));
 if(['arch-artistic-fixture','role-artistic-fixture'].includes(mode))files.set('/',await fs.readFile(path.join(sourceRoot,'public/native.html')));
 if(mode==='role-artistic-external')files.set('/',Buffer.from((await fs.readFile(path.join(sourceRoot,'public/native.html'),'utf8')).replace('/native-fixture.js','/native-external.js')));
 files.set('/',Buffer.from(files.get('/').toString().replace('<html','<html data-managed-audio="true"')));
 const importMap=files.get('/').toString().match(/<script type="importmap">([^<]+)<\/script>/)?.[1];
 if(!importMap) throw Error('Missing local import map');
 const hash=createHash('sha256').update(importMap).digest('base64');
 const server=http.createServer({maxHeaderSize:8192},async(req,res)=>{
  if(await handleLocalAudio(req,res,{requestMaster}))return;
  const authority=`127.0.0.1:${server.address().port}`;
  if(req.headers.host!==authority) {res.writeHead(421).end();return;}
  if(preparedAssets?.serve(req,res))return;
  if(req.method!=='GET') {res.writeHead(405).end();return;}
  // Exact routes, no filesystem-derived URL and no credentials/config routes.
  const bytes=files.get(req.url);
  if(!bytes) {res.writeHead(404).end();return;}
  res.writeHead(200,{'content-type':req.url==='/'?'text/html; charset=utf-8':req.url.endsWith('.ttf')?'font/ttf':'text/javascript; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':`default-src 'none'; script-src 'self' 'sha256-${hash}'; style-src 'unsafe-inline'; font-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self'; frame-src http://127.0.0.1:9573; base-uri 'none'; frame-ancestors 'none'`});res.end(bytes);
 });
 server.requestTimeout=3000;server.headersTimeout=3000;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen({host,port,exclusive:true},resolve);});
 return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();})};
}
