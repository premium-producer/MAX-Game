import http from 'node:http';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {realpathSync} from 'node:fs';
import {createAssetAuditServer} from './asset-audit-base-server.mjs';
import {createAssetAuditStore} from './asset-audit-store.mjs';
export async function createVariantServer({catalogFile,file,flowFile,origin,allowLoopbackHttp=false}){
 const stores={},handlers={};
 for(const variant of ['cafe','flowers','auto']){
  const suffix=variant==='cafe'?'':'.'+variant;
  const store=createAssetAuditStore({catalogFile:catalogFile.replace(/\.json$/,suffix+'.json'),file:variant==='cafe'?file:file.replace(/\.json$/,suffix+'.json'),flowFile:variant==='cafe'?flowFile:flowFile.replace(/\.json$/,suffix+'.json')});
  await store.readFlow();stores[variant]=store;handlers[variant]=createAssetAuditServer({store,origin,allowLoopbackHttp});
 }
 const server=http.createServer((req,res)=>{const match=/^\/api\/(flowers|auto)(\/|$)/.exec(req.url),variant=match?.[1]||'cafe';if(match)req.url='/api/'+req.url.slice(match[0].length);handlers[variant].emit('request',req,res);});
 return{server,stores,close:async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));for(const store of Object.values(stores))await store.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(realpathSync(process.argv[1])).href){
 const env=process.env;for(const name of ['AUDIT_CATALOG','AUDIT_FILE','AUDIT_FLOW_FILE'])if(!env[name]||!path.isAbsolute(env[name]))throw Error('Missing absolute audit path');
 const app=await createVariantServer({catalogFile:env.AUDIT_CATALOG,file:env.AUDIT_FILE,flowFile:env.AUDIT_FLOW_FILE,origin:env.AUDIT_ORIGIN||'https://futuronika.pro'});
 await new Promise(r=>app.server.listen(Number(env.AUDIT_PORT||19431),'127.0.0.1',r));console.log('MAX asset audit variants ready');
 let closing=false;for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{if(closing)return;closing=true;app.close().finally(()=>process.exit());});
}
