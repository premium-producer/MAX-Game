import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import hq from '../src/kdw-hq-screen-assets.json' with {type:'json'};
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {applyHighQualityScreens,highQualityRasterScale} from '../src/kdw-conversation-model.mjs';
import {composeVisitorScreen,VISITOR_CAPTURE} from '../src/kdw-conversation-photo.mjs';
test('25 HQ assets are pinned, complete, and have full intrinsic pixel resolution',()=>{
 const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))));
 assert.equal(Object.keys(hq.screens).length,25);assert.equal(Object.keys(hq.screens).filter(k=>k.startsWith('communication.')).length,19);
 for(const [screen,id]of Object.entries(hq.screens)){
  const a=catalog.assets[id],b=fs.readFileSync(new URL('../public/'+a.path,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);
  assert.equal(a.width,1440);assert.ok([3200,3052].includes(a.height));
  assert.equal(catalog.tasks[screen.split('.').slice(0,2).join('.')].screens[screen].assetId,id);
  if(a.mimeType==='image/png'){assert.equal(b.readUInt32BE(16),a.width);assert.equal(b.readUInt32BE(20),a.height);}
  else assert.ok(b.toString().includes(`width="${a.width}" height="${a.height}"`));
 }
});
test('HQ mapping preserves action identities, outcomes, copy and normalized target rectangles',()=>{
 const before=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))),after=applyHighQualityScreens(structuredClone(before));
 for(const task of Object.values(before.tasks))for(const [id,s]of Object.entries(task.screens)){
  const n=after.tasks[task.taskId].screens[id];if(!hq.screens[id]){assert.deepEqual(n,s);continue;}
  assert.equal(n.instruction,s.instruction);assert.equal(n.actions.length,s.actions.length);
  s.actions.forEach((a,i)=>{const b=n.actions[i];assert.deepEqual({...b,rect:a.rect},{...a,rect:a.rect});if(a.rect){const old=before.assets[s.assetId],asset=after.assets[n.assetId];a.rect.forEach((v,j)=>assert.ok(Math.abs(v/(j%2?old.height:old.width)-b.rect[j]/(j%2?asset.height:asset.width))<1e-10));}});
 }
});
test('eight HQ photo screens retain template man and accept visitor photo without changing their PNG',()=>{
 let count=0;for(const a of Object.values(hq.assets))if(a.mimeType==='image/svg+xml'){
  const s=fs.readFileSync(new URL('../public/'+a.path,import.meta.url),'utf8');if(!s.includes('data-visitor-photo="true"'))continue;count++;
  const b=composeVisitorScreen(s,{...VISITOR_CAPTURE,dataUri:'data:image/jpeg;base64,YWJj'});
  assert.ok(b.includes('data:image/jpeg;base64,YWJj'));assert.equal(b.match(/data:image\/png;base64,[^"]+/)?.[0],s.match(/data:image\/png;base64,[^"]+/)?.[0]);
  assert.ok(s.includes('data:image/webp;base64,'));
 }assert.equal(count,8);
});
test('HQ texture budget preserves detail at low display density without unbounded GPU allocation',()=>{
 for(const [w,h]of [[349.2,776],[360,800],[360,763],[720,1600]]){
  const k=highQualityRasterScale(w,h,16);assert.ok((w+32)*k<=1440.0001);assert.ok((h+32)*k<=3200.0001);assert.ok((h+32)*k>2900);
  assert.ok(Math.ceil((w+32)*k)*Math.ceil((h+32)*k)<=1440*3200+3200);
 }
});

test('local build pins and ships every native dependency including all 25 HQ resources',()=>{
 const www=new URL('../../../www/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('webgl-v5/r9-build.json',www)));
 assert.ok(Object.keys(manifest.requiredAssets).length>=25);
 for(const [name,pin]of Object.entries(manifest.requiredAssets))assert.equal(createHash('sha256').update(fs.readFileSync(new URL(name,www))).digest('hex'),pin,name);
 for(const asset of Object.values(hq.assets))assert.equal(manifest.requiredAssets[asset.path],asset.sha256,asset.path);
});
