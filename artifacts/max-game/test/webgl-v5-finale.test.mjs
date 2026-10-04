import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {usesVideoFinale} from '../src/journey-v5-finale.mjs';
import {createGameServer} from '../start.mjs';

test('video finale requires opt-in, automatic mission and final completion',()=>{
 for(const enabled of [false,true])for(const automatic of [null,'communication'])for(const phase of ['palm','task','result','complete']){
  assert.equal(usesVideoFinale({enabled,automatic,phase}),!!(enabled&&automatic&&phase==='complete'));
 }
});
test('playlist contains every supplied clip in archive order, with exact output checksums',async()=>{
 const base=new URL('../public/webgl-v5/finale-videos/',import.meta.url);
 const manifest=JSON.parse(await fs.readFile(new URL('manifest.json',base)));
 assert.equal(manifest.items.length,11);assert.equal(manifest.loop,true);
 for(const [i,item] of manifest.items.entries()){
  assert.equal(item.id,String(i+1).padStart(2,'0'));
  const bytes=await fs.readFile(new URL(item.id+'.mp4',base));
  assert.equal(bytes.length,item.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
  assert.ok(bytes.indexOf(Buffer.from('moov'))<bytes.indexOf(Buffer.from('mdat')),'faststart metadata precedes media');
 }
});
test('video HTTP supports metadata, byte ranges, suffixes, seek rejection and cancellation',async t=>{
 const server=createGameServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>{server.closeAllConnections();server.close();});
 const url=`http://127.0.0.1:${server.address().port}/public/webgl-v5/finale-videos/01.mp4`;
 const original=await fs.readFile(new URL('../public/webgl-v5/finale-videos/01.mp4',import.meta.url));
 const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'video/mp4');assert.equal(Number(head.headers.get('content-length')),original.length);assert.equal(head.headers.get('accept-ranges'),'bytes');
 for(const [range,start,end] of [['bytes=0-127',0,127],['bytes=-32',original.length-32,original.length-1],['bytes=512-1023',512,1023]]){
  const response=await fetch(url,{headers:{Range:range}});assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),`bytes ${start}-${end}/${original.length}`);assert.deepEqual(Buffer.from(await response.arrayBuffer()),original.subarray(start,end+1));
 }
 const invalid=await fetch(url,{headers:{Range:'bytes=999999999-'}});assert.equal(invalid.status,416);assert.equal(invalid.headers.get('content-range'),`bytes */${original.length}`);
 const malformed=await fetch(url,{headers:{Range:'bad-range'}});assert.equal(malformed.status,200);await malformed.body.cancel();
 const blocked=await fetch(url.replace('01.mp4','%2Ehidden.mp4'));assert.equal(blocked.status,404);
 assert.equal((await fetch(url,{method:'HEAD'})).status,200);
});
