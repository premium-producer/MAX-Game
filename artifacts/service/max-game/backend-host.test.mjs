import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {readMaxGameConfig,resolveMaxGameDatabase,createMaxGameBackend} from './backend.mjs';
import {makeTestDirectory} from '../test-workspace.mjs';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');

test('disabled host creates no database and refuses implicit non-SQLite profiles',async()=>{
  const root=makeTestDirectory('max-backend-disabled');
  assert.deepEqual(readMaxGameConfig(root),{enabled:false});
  assert.equal(await createMaxGameBackend({projectRoot:root}),null);
  assert.equal(fs.existsSync(path.join(root,'apps/stand-service/configs/runtime-data')),false);
  assert.throws(()=>resolveMaxGameDatabase(root,{profile:'memory'}),/SQLITE_PROFILE_REQUIRED/);
  for(const database of ['../../secrets/test','../stand-service.json','C:/outside.sqlite','/outside.sqlite',''])assert.throws(()=>resolveMaxGameDatabase(root,{profile:'sqlite',database}),/INVALID_MAX_GAME_DATABASE/);
});

test('Stand Service source wires MAX lazily and retains its existing Origin/Host guards',()=>{
  const source=fs.readFileSync(path.join(projectRoot,'artifacts/service/server.mjs'),'utf8');
  assert.ok(source.includes("from './max-game/backend.mjs'"));
  assert.ok(source.includes('maxBackendPromise??=createMaxGameBackend'));
  assert.ok(source.includes('MAX_BACKEND_DISABLED'));
  assert.ok(source.indexOf("req.headers.origin!==origin")<source.indexOf('return backend.handle(req,res,url)'));
  assert.ok(source.includes("p==='/api/journey'"));
  assert.ok(source.includes('await backend?.close()'));
});

test('packaged run backend opens a fixture SQLite and serves a mission through its actual API',async t=>{
  const root=makeTestDirectory('max-backend-packaged');
  const target=path.join(root,'apps/max-game/shared');fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.cpSync(path.join(projectRoot,'apps/max-game/shared'),target,{recursive:true});
  let time=0;
  const backend=await createMaxGameBackend({projectRoot:root,mode:'run',settings:{enabled:true,profile:'sqlite'},authorize:()=>true,now:()=>time});
  const server=createServer((req,res)=>backend.handle(req,res,new URL(req.url,'http://localhost')));
  await new Promise(resolve=>server.listen(0,'localhost',resolve));
  t.after(async()=>{await backend.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
  const url=`http://localhost:${server.address().port}/api/max-game/v1`;
  const request=async(route,body)=>{const response=await fetch(url+route,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});assert.ok(response.ok);return response.json();};
  const catalog=await request('/catalog');assert.equal(Object.keys(catalog.missions).length,6);
  await request('/sessions',{sessionId:'packaged-run'});
  const owner=await request('/sessions/packaged-run/input-owner',{action:'acquire',ownerId:'fixture-player',acquisitionId:'fixture-claim'});
  const snapshot=await request('/sessions/packaged-run');
  const selected=await request('/sessions/packaged-run/commands',{owner,command:{schemaVersion:1,type:'SELECT_MISSION',commandId:'select',sessionId:'packaged-run',expectedRevision:snapshot.state.revision,contentRevision:catalog.contentRevision,missionId:'blogger'}});
  assert.equal(selected.snapshot.state.status,'scan');
  await request('/sessions/packaged-run/contacts',{owner,event:{contactId:'pointer',sequence:0,type:'down',inside:true}});
  time=800;await new Promise(resolve=>setTimeout(resolve,130));
  const current=await request('/sessions/packaged-run');assert.equal(current.state.status,'task');assert.ok(current.view.device.asset);
  assert.ok(fs.existsSync(path.join(root,'apps/stand-service/configs/runtime-data/max-game.sqlite')));
});
