import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';
import {randomUUID,createHash} from 'node:crypto';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url),{createGameHub}=require('../../apps/STARTUP/tools/game-link.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-photo-browser-')),source=path.resolve('apps/max-game/source/client/src');
const dir=path.join(root,'www/assets/kdw-native/conversation');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'visitor-avatar.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"/>');
fs.writeFileSync(path.join(dir,'visitor-placeholder.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"/>');
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
 await page.evaluate(async()=>{const api=await import('/kdw-game-link.mjs');window.link=await api.loadGameLink(new URLSearchParams());window.stopPhotos=api.watchGameLink({link:window.link,getSession:()=>null});for(const a of window.link.assets){const img=new Image();img.id=a.original.endsWith('visitor-avatar.svg')?'avatar':'full';img.src='./'+a.path;document.body.append(img);await img.decode();}});
 const before=await page.locator('#avatar').getAttribute('src');await upload('avatar');
 await page.waitForFunction(old=>document.querySelector('#avatar').getAttribute('src')!==old,before,{timeout:8000});
 const result=await page.evaluate(async()=>{const sample=async id=>{const img=document.getElementById(id);await img.decode();const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.drawImage(img,0,0,512,512);return{center:[...x.getImageData(256,256,1,1).data],corner:[...x.getImageData(0,0,1,1).data]}};return{avatar:await sample('avatar'),full:await sample('full'),gameId:window.link.game.gameId,hasAvatar:window.link.game.hasAvatar};});
 assert.ok(result.avatar.center[0]>240&&result.avatar.center[2]<20);assert.equal(result.avatar.corner[3],0);assert.ok(result.full.center[2]>240&&result.full.center[0]<20);assert.equal(result.full.corner[3],255);assert.equal(result.gameId,m.gameId);assert.equal(result.hasAvatar,true);assert.deepEqual(errors,[]);
 await page.evaluate(()=>window.stopPhotos());const out='docs/verification-photo-transport-20261028';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/browser.json',JSON.stringify({passed:true,lateAvatarWithoutReload:true,realJpeg:true,result,errors},null,2));console.log('PASS real JPEG: late avatar refresh, circle mask, full photo isolation, same session');
}finally{await browser?.close();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
