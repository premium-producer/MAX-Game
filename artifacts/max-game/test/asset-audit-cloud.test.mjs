import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createAssetAuditServer,MAX_BODY_BYTES} from '../scripts/asset-audit-server.mjs';

async function fixture(t,store){
 let document={revision:'0',records:[],screens:[]},saves=0;
 const server=createAssetAuditServer({store:store||{
  read:async()=>document,
  save:async value=>{saves++;if(value.expectedRevision!==document.revision)throw Object.assign(Error('private CAS details'),{status:409});document={...value.document,revision:String(Number(document.revision)+1)};return document;}
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base=`http://127.0.0.1:${server.address().port}`;
 const {csrf}=await (await fetch(base+'/api/state')).json();
 const headers={'Content-Type':'application/json',Origin:'https://futuronika.pro','X-VK-Token':csrf};
 return {base,headers,saves:()=>saves,server};
}

test('cloud adapter exposes only its API, private responses and CSRF',async t=>{
 const f=await fixture(t),response=await fetch(f.base+'/api/max-asset-audit');
 assert.equal(response.status,200);assert.equal((await response.json()).revision,'0');
 assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('access-control-allow-origin'),null);
 assert.equal((await fetch(f.base+'/api/control')).status,404);
 assert.equal((await fetch(f.base+'/api/state',{method:'POST'})).status,405);
 assert.equal((await fetch(f.base+'/api/max-asset-audit',{method:'DELETE'})).status,405);
 assert.equal(f.server.address().address,'127.0.0.1');
});

test('cloud save delegates to store; stale revision is rejected without details',async t=>{
 const f=await fixture(t),body=JSON.stringify({expectedRevision:'0',document:{records:[{id:'example'}],screens:[]}});
 const first=await fetch(f.base+'/api/max-asset-audit',{method:'POST',headers:f.headers,body});
 assert.equal(first.status,200);assert.equal((await first.json()).revision,'1');
 const repeated=await fetch(f.base+'/api/max-asset-audit',{method:'POST',headers:f.headers,body});
 assert.equal(repeated.status,409);assert.doesNotMatch(await repeated.text(),/private CAS/);
 assert.deepEqual((await (await fetch(f.base+'/api/max-asset-audit')).json()).records,[{id:'example'}]);
});

test('missing/foreign origin and missing/incorrect CSRF cannot save',async t=>{
 const f=await fixture(t);
 for(const headers of [{...f.headers,Origin:'https://evil.example'},{...f.headers,Origin:''},{...f.headers,'X-VK-Token':''},{...f.headers,'X-VK-Token':'a'.repeat(64)}]){
  assert.equal((await fetch(f.base+'/api/max-asset-audit',{method:'POST',headers,body:'{}'})).status,403);
 }
 assert.equal(f.saves(),0);
});

test('invalid bodies and oversized Content-Length do not reach store',async t=>{
 const f=await fixture(t);
 for(const [headers,body,status] of [[{...f.headers,'Content-Type':'text/plain'},'{}',415],[f.headers,'{broken',400],[f.headers,'null',400],[f.headers,'[]',400],[{...f.headers,'Content-Encoding':'gzip'},'{}',415],[f.headers,JSON.stringify({large:'x'.repeat(MAX_BODY_BYTES)}),413]]){
  assert.equal((await fetch(f.base+'/api/max-asset-audit',{method:'POST',headers,body})).status,status);
 }
 assert.equal(f.saves(),0);
});

test('chunked oversized body is bounded even without Content-Length',async t=>{
 const f=await fixture(t);
 const status=await new Promise((resolve,reject)=>{
  const req=http.request(f.base+'/api/max-asset-audit',{method:'POST',headers:f.headers},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
  req.on('error',reject);req.write('"');req.write('x'.repeat(MAX_BODY_BYTES));req.end('"');
 });
 assert.equal(status,413);assert.equal(f.saves(),0);
});

test('store failures do not expose filesystem paths',async t=>{
 const f=await fixture(t,{read:async()=>{throw Error('/srv/private/path');},save:async()=>{throw Error('secret');}});
 const response=await fetch(f.base+'/api/max-asset-audit');
 assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/srv|private|secret/);
});
