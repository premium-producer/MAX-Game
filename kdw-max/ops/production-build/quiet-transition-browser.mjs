import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';

const root=process.cwd(),require=createRequire(path.join(root,'package.json'));
const out=path.join(root,'.cache/graceful');fs.mkdirSync(out,{recursive:true});
const fixture=fs.mkdtempSync(path.join(out,'quiet-'));
fs.symlinkSync(path.join(root,'apps/max-game/www'),path.join(fixture,'www'),'junction');
const config={...JSON.parse(fs.readFileSync('apps/max-game/app.json')),port:19794};
fs.writeFileSync(path.join(fixture,'app.json'),JSON.stringify(config));
const {DEFAULTS}=require('./apps/STARTUP/tools/stand-settings.cjs');
fs.mkdirSync(path.join(fixture,'settings'));
fs.writeFileSync(path.join(fixture,'settings/stand.json'),JSON.stringify({...DEFAULTS,max:{...DEFAULTS.max,entryMode:'combined'}}));
const {createPortableServer}=require('./apps/max-game/launcher/portable-server.cjs');
const host=createPortableServer({root:fixture,config});await host.listen();
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
let release;const gate=new Promise(resolve=>release=resolve);
try{
 const page=await browser.newPage({viewport:{width:1536,height:768},hasTouch:true});
 const errors=[];let navigations=0,queueCount=3;page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('BROWSER',m.text());});
 await page.route('**/__kdw/link/active',async route=>{const response=await route.fetch();await route.fulfill({response,json:{...await response.json(),queueCount}});});
 page.on('request',request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame())navigations++;});
 await page.route('**/__kdw/link/games/*/assets',async route=>{await gate;await route.continue();});
 await page.goto(host.origin+'/webgl-v5/client.html?view=pixel-map');
 await page.waitForFunction(()=>document.documentElement.dataset.idleMenuReady,null,{timeout:60000});
 const before=await page.evaluate(()=>{
  window.__quietSamples=[];window.__quietBackground=document.querySelector('#ambient');
  window.__quietSampleTimer=setInterval(()=>window.__quietSamples.push({phase:document.documentElement.dataset.sceneTransition,alpha:Number(document.querySelector('[data-idle-mission="digital-id"]')?.dataset.pathPresence??0),loading:!!document.querySelector('#loading')?.checkVisibility()}),16);
  return document.documentElement.dataset.graphicsBootId;
 });
 await page.locator('[data-idle-mission="digital-id"]').tap({force:true});
 await page.waitForFunction(()=>document.documentElement.dataset.sceneTransition==='preparing');
 // The stalled manifest cannot introduce a loading screen or reveal a stale mission.
 await page.waitForTimeout(500);
 assert.equal(await page.locator('#loading').isVisible(),false);
 assert.ok(await page.evaluate(()=>Number(document.querySelector('[data-idle-mission="digital-id"]').dataset.pathPresence)<.01));
 await page.screenshot({path:path.join(out,'quiet-preparing.png')});
 release();
 await page.waitForFunction(()=>{const b=document.querySelector('[data-palm]'),s=JSON.parse(window.render_game_to_text());return s.status==='scan'&&s.ready&&b&&Number(b.dataset.pathPresence??0)>.97&&!b.closest('[inert]');},null,{timeout:30000});
 const after=await page.evaluate(()=>{
  clearInterval(window.__quietSampleTimer);
  return{graphicsBootId:document.documentElement.dataset.graphicsBootId,sameBackground:document.querySelector('#ambient')===window.__quietBackground,samples:window.__quietSamples};
 });
 assert.equal(after.graphicsBootId,before);assert.equal(after.sameBackground,true);assert.equal(navigations,1);
 assert.ok(after.samples.some(s=>s.alpha>.02&&s.alpha<.95),'standby must fade through intermediate alpha');
 assert.ok(!after.samples.some(s=>s.loading),'no loading overlay during transition');
 assert.equal(await page.locator('[data-scan-queue-count]').textContent(),'очередь: 3');
 // A real contact still starts the newly rebound mission.
 const palm=await page.locator('[data-palm]').boundingBox();
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:palm.x+palm.width/2,y:palm.y+palm.height/2,id:1}]});
 await page.waitForTimeout(200);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='task',null,{timeout:30000});
 await page.waitForFunction(()=>document.querySelector('[data-mission-queue-count]')?.textContent==='очередь: 3');
 const rects=await page.evaluate(()=>{const t=document.querySelector('[data-mission-timer]'),q=document.querySelector('[data-mission-queue-count]');return{timer:{x:parseFloat(t.style.left),y:parseFloat(t.style.top)},queue:{x:parseFloat(q.style.left),y:parseFloat(q.style.top)},opacity:[Number(t.dataset.pathPresence),Number(q.dataset.pathPresence)],pointerEvents:getComputedStyle(q).pointerEvents};});
 assert.ok(rects.queue.x<rects.timer.x);assert.equal(rects.queue.y,rects.timer.y);assert.equal(rects.opacity[0],rects.opacity[1]);assert.equal(rects.pointerEvents,'none');
 queueCount=1;await page.waitForFunction(()=>document.querySelector('[data-mission-queue-count]')?.textContent==='очередь: 1',null,{timeout:7000});
 await page.screenshot({path:path.join(out,'queue-task.png')});
 assert.deepEqual(errors,[]);
 const result={sameDocument:navigations===1,sameGraphics:before===after.graphicsBootId,sameBackground:after.sameBackground,loadingVisible:false,intermediateFade:true,contactStartedTask:true,queue:{scan:3,task:3,updated:1,leftOfTimer:true,sharedOpacity:true},errors};
 fs.writeFileSync(path.join(out,'quiet-transition.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){for(const page of browser.contexts().flatMap(c=>c.pages()))console.log(JSON.stringify({game:await page.evaluate(()=>window.render_game_to_text?.()),body:(await page.locator('body').innerText()).slice(-500)}));throw error;}finally{release();await browser.close();await host.close();}
