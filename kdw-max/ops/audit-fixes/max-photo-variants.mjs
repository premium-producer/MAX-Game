import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';
import {randomUUID,createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {createKdwCatalog} from '../../apps/max-game/source/client/src/kdw-interactions-model.mjs';
const require=createRequire(import.meta.url),{createGameHub}=require('../../apps/STARTUP/tools/game-link.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-photo-browser-')),source=path.resolve('apps/max-game/source/client/src');
const dir=path.join(root,'www/assets/kdw-native/conversation');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'visitor-avatar.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"/>');
fs.writeFileSync(path.join(dir,'visitor-placeholder.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"/>');
// Exercise the shipped HQ templates, not source-only fixtures.
const built=path.resolve('apps/max-game/www'),hq=JSON.parse(fs.readFileSync('apps/max-game/source/client/src/kdw-hq-screen-assets.json'));
const hqPhotos=Object.values(hq.assets).filter(a=>a.mimeType==='image/svg+xml'&&fs.readFileSync(path.join(built,a.path),'utf8').includes('data-visitor-photo="true"'));
assert.equal(hqPhotos.length,8);
const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(path.join(source,'reviewed-content/mission-catalog.json'))));
const photoScreens=Object.values(catalog.tasks).flatMap(t=>Object.values(t.screens)).map(s=>({...catalog.assets[s.assetId],screenId:s.screenId})).filter(a=>a.mimeType==='image/svg+xml'&&fs.readFileSync(path.join(built,a.path),'utf8').includes('data-visitor-photo="true"'));
for(const a of photoScreens){const target=path.join(root,'www',a.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(built,a.path),target);}
// An unused invalid template must not block the visible avatar refresh.
fs.writeFileSync(path.join(dir,'unrelated-broken.svg'),'<svg data-visitor-photo="true">broken');
let hub,browser;const server=http.createServer((req,res)=>{
 if(hub?.handle(req,res))return;
 if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><html><head><base href="/"></head><body></body></html>');return;}
 const p=path.resolve(source,'.'+new URL(req.url,'http://local').pathname);
 if(p.startsWith(source+path.sep)&&fs.existsSync(p)&&/\.(mjs|json)$/.test(p)){res.writeHead(200,{'Content-Type':p.endsWith('.json')?'application/json':'text/javascript'});res.end(fs.readFileSync(p));return;}
 res.writeHead(404);res.end();
});
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 hub=createGameHub({root,origin,production:true});const m={schemaVersion:2,gameId:randomUUID(),voiceSessionId:randomUUID(),selectionRevision:1,missionId:'blogger',audience:'blogger',goal:null,photoExpected:true,remainingTtlMs:120000};
 const auth={'x-kdw-relay-key':hub.key};
 assert.equal((await fetch(origin+'/__kdw/link/v2/missions',{method:'POST',headers:{...auth,'content-type':'application/json'},body:JSON.stringify(m)})).status,200);
 browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);
 const photos=await page.evaluate(async()=>{const make=(w,h,color)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,w,h);return c.toDataURL('image/jpeg').split(',')[1]};return{full:make(1080,1920,'#0044ff'),avatar:make(512,512,'#ff2200')};});
 const upload=async variant=>{const bytes=Buffer.from(photos[variant],'base64');const r=await fetch(origin+`/__kdw/link/v2/missions/${m.gameId}/photo/1`,{method:'PUT',headers:{...auth,'content-type':'image/jpeg','x-kdw-voice-session':m.voiceSessionId,'x-kdw-photo-variant':variant,'x-kdw-photo-sha256':createHash('sha256').update(bytes).digest('hex')},body:bytes});assert.equal(r.status,200);return r.json();};
 await upload('full');
 await page.evaluate(async()=>{const api=await import('/kdw-game-link.mjs');window.link=await api.loadGameLink(new URLSearchParams());window.stopPhotos=api.watchGameLink({link:window.link,getSession:()=>null});for(const a of window.link.assets.filter(a=>/visitor-(avatar|placeholder)\.svg$/.test(a.original))){const img=new Image();img.id=a.original.endsWith('visitor-avatar.svg')?'avatar':'full';img.src='./'+a.path;document.body.append(img);await img.decode();}window.oldAvatar=document.querySelector('#avatar').src;});
 const before=await page.locator('#avatar').getAttribute('src');await upload('avatar');
 await page.waitForFunction(old=>document.querySelector('#avatar').getAttribute('src')!==old,before,{timeout:8000});
 const result=await page.evaluate(async()=>{const sample=async id=>{const img=document.getElementById(id);await img.decode();const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.drawImage(img,0,0,512,512);return{center:[...x.getImageData(256,256,1,1).data],corner:[...x.getImageData(0,0,1,1).data]}};return{avatar:await sample('avatar'),full:await sample('full'),gameId:window.link.game.gameId,hasAvatar:window.link.game.hasAvatar};});
 assert.ok(result.avatar.center[0]>240&&result.avatar.center[2]<20);assert.equal(result.avatar.corner[3],0);assert.ok(result.full.center[2]>240&&result.full.center[0]<20);assert.equal(result.full.corner[3],255);assert.equal(result.gameId,m.gameId);assert.equal(result.hasAvatar,true);assert.deepEqual(errors,[]);
 const manifest=await(await fetch(origin+`/__kdw/link/games/${m.gameId}/assets`)).json();
 const checked=[];
 for(const a of photoScreens){
  const linked=manifest.assets.find(x=>x.original===a.path);assert.ok(linked,a.path);
  const svg=await(await fetch(origin+'/'+linked.path)).text(),original=fs.readFileSync(path.join(built,a.path),'utf8');
  assert.ok(svg.includes('data:image/jpeg;base64,'+(original.includes('data-visitor-viewport="circle"')?photos.avatar:photos.full)),a.path);
  assert.deepEqual(svg.match(/data:image\/png;base64,[^"]+/g),original.match(/data:image\/png;base64,[^"]+/g));
  const decoded=await page.evaluate(async({url,w,h})=>{const img=new Image();img.src=url;await img.decode();return img.naturalWidth===w&&img.naturalHeight===h;},{url:origin+'/'+linked.path,w:a.width,h:a.height});assert.ok(decoded,a.path);checked.push({screenId:a.screenId,path:a.path,variant:original.includes('data-visitor-viewport="circle"')?'avatar':'full'});
  if(a.screenId==='digital-id.create-id.ready'){
   const pixel=await page.evaluate(async url=>{const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=360;c.height=800;const x=c.getContext('2d');x.drawImage(img,0,0,360,800);return [...x.getImageData(80,340,1,1).data];},origin+'/'+linked.path);
   assert.ok(pixel[0]>240&&pixel[2]<20,'ID portrait corners must contain visitor photo, not the old template');
  }
 }
 await page.evaluate(()=>{const img=new Image();img.id='late-mounted';img.src=window.oldAvatar;document.body.append(img);});
 await page.waitForFunction(()=>document.querySelector('#late-mounted').src===document.querySelector('#avatar').src);
 const business=await page.evaluate(async()=>{const {businessScreenMarkup}=await import('/kdw-business-all-ui.mjs');const results=[];for(const type of ['cafe','flowers','auto'])for(const screenId of ['business.platform.profile','business.platform.verification']){const div=document.createElement('div');div.innerHTML=businessScreenMarkup({state:{screenId,progress:{business:{answers:{businessType:type}}}},view:{actions:[{actionId:'test'}]}});const img=div.querySelector('.bn-source-photo img');results.push({type,screenId,currentAvatar:img?.src===document.querySelector('#avatar').src});}return results;});assert.ok(business.every(r=>r.currentAvatar));assert.deepEqual(errors,[]);
 await page.evaluate(()=>window.stopPhotos());const out='docs/verification-photo-transport-20261028';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/browser.json',JSON.stringify({passed:true,lateAvatarWithoutReload:true,lateMountedImage:true,unrelatedBrokenImageIgnored:true,realJpeg:true,photoScreens:checked,business,result,errors},null,2));console.log(`PASS real JPEG: late avatar, circle mask, full photo isolation, ${checked.length} built personalized screens including 8 HQ, 6 business avatars, broken unused template, future mounted avatar`);
}finally{await browser?.close();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
