import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID,createHash} from 'node:crypto';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url),{createGameHub}=require('../../apps/STARTUP/tools/game-link.cjs');
const root=fs.mkdtempSync(path.resolve('.cache/async-browser-')),native=path.join(root,'www/assets/kdw-native/conversation');fs.mkdirSync(native,{recursive:true});
fs.writeFileSync(path.join(native,'visitor-avatar.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"/>');
let hub,browser;
const server=http.createServer((req,res)=>{if(hub?.handle(req,res))return;if(req.url.endsWith('.mjs')){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.resolve('apps/max-game/source/client/src',path.basename(req.url))));return;}res.setHeader('Content-Type','text/html');res.end('<html><body><img id="photo"><script type="module">import * as link from "/kdw-game-link.mjs";window.api=link;</script></body></html>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
hub=createGameHub({root,origin,production:true});
try{
 const gameId=randomUUID(),voiceSessionId=randomUUID();
 const mission={schemaVersion:2,gameId,voiceSessionId,selectionRevision:1,missionId:'blogger',audience:'blogger',goal:null,photoExpected:true,remainingTtlMs:120000};
 const response=await fetch(origin+'/__kdw/link/v2/missions',{method:'POST',headers:{'Content-Type':'application/json','x-kdw-relay-key':hub.key},body:JSON.stringify(mission)});assert.equal(response.status,200);
 browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.waitForFunction(()=>window.api);
 const before=await page.evaluate(async()=>{window.binding=await api.loadGameLink(new URLSearchParams());document.querySelector('img').src=binding.avatar;await document.querySelector('img').decode();window.changes=0;window.invalidations=0;window.session={snapshot:{state:{sessionId:binding.game.gameId,status:'task',revision:7,runId:1,missionId:'blogger',taskId:null,screenId:null,contentRevision:'stable'}}};window.stop=api.watchGameLink({link:binding,getSession:()=>session,onChange:()=>changes++,onPhotoChange:()=>invalidations++});const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;canvas.getContext('2d').fillRect(0,0,1080,1920);window.jpeg=canvas.toDataURL('image/jpeg');return JSON.stringify(session);});
 const neutralUrl=await page.locator('#photo').getAttribute('src');
 const jpeg=Buffer.from((await page.evaluate(()=>window.jpeg)).split(',')[1],'base64'),sha=createHash('sha256').update(jpeg).digest('hex');
 const photo=await fetch(origin+`/__kdw/link/v2/missions/${gameId}/photo/1`,{method:'PUT',headers:{'Content-Type':'image/jpeg','x-kdw-relay-key':hub.key,'x-kdw-voice-session':voiceSessionId,'x-kdw-photo-sha256':sha},body:jpeg});assert.equal(photo.status,200);assert.equal((await fetch(new URL(neutralUrl,origin))).status,200);
 await page.waitForFunction(sha=>document.querySelector('img').src.includes(sha),sha);await page.locator('img').evaluate(el=>el.decode());
 assert.equal(await page.evaluate(()=>JSON.stringify(session)),before);assert.equal(await page.evaluate(()=>changes),0);assert(await page.evaluate(()=>invalidations>0));
 // Images mounted after delivery also receive the same visitor's decoded photo.
 await page.evaluate(()=>{const img=new Image();img.id='next';img.src=document.querySelector('img').src.replace(/\/[a-f0-9]{64}\//, '/none/');document.body.append(img);});await page.waitForFunction(sha=>document.querySelector('#next').src.includes(sha),sha);
 await page.evaluate(()=>stop());assert.deepEqual(errors,[]);
 const result={checks:['real JPEG stored and served in generated SVG','late photo decoded and applied','session/revision unchanged; no reload','later mounted image receives photo','no browser errors'],errors};fs.mkdirSync('docs/verification-async-link-20261027',{recursive:true});fs.writeFileSync('docs/verification-async-link-20261027/browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
