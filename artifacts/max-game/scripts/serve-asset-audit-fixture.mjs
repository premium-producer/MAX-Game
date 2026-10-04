// Isolated browser QA of the real editor/store/API. Never serves the project root.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAssetAuditServer} from './asset-audit-server.mjs';
import {createAssetAuditStore} from '../src/asset-audit/server-store.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const runtime=path.join(root,'apps/max-game');
const tests=await fs.realpath(path.join(root,'artifacts/workspace/tests'));
const data=await fs.realpath(path.resolve(process.argv[2]||path.join(tests,'flow-editor')));
if(!data.startsWith(tests+path.sep))throw Error('Fixture data must be inside workspace/tests');
const port=Number(process.argv[3]||19439),origin=`http://127.0.0.1:${port}`;
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid fixture port');
const store=createAssetAuditStore({file:path.join(data,'annotations.json'),flowFile:path.join(data,'flow-v3.json'),catalogFile:path.join(runtime,'asset-audit/catalog.json')});
await store.readFlow();
const api=createAssetAuditServer({store,origin,allowLoopbackHttp:true});
const handler=api.listeners('request')[0];
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,origin);
  if(url.pathname.startsWith('/editor/api/')){req.url=url.pathname.replace('/editor/api/','/api/')+url.search;return handler(req,res);}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const paths=[['/editor/',path.join(runtime,'asset-audit')],['/assets/',path.join(runtime,'assets')],['/brand/',path.join(runtime,'brand')]];
  const entry=paths.find(([prefix])=>url.pathname.startsWith(prefix));
  if(!entry){res.writeHead(404);res.end();return;}
  const [prefix,dir]=entry,relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
  const file=path.resolve(dir,relative),resolved=await fs.realpath(file);
  if(!file.startsWith(dir+path.sep)||!resolved.startsWith(dir+path.sep))throw Error('Forbidden fixture path');
  let bytes=await fs.readFile(file);
  if(prefix==='/editor/'&&relative==='index.html')bytes=Buffer.from(bytes.toString().replace('<head>','<head><meta name="max-audit-api" content="./api/">'));
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);
 }catch{if(!res.headersSent)res.writeHead(404);res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
console.log(`MAX isolated editor fixture: ${origin}/editor/`);
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.close(async()=>{await store.close();process.exit(0);});server.closeAllConnections();});
