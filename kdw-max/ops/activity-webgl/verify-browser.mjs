// Local only: real portable server + memory sessions, no stand/SSH access.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=process.cwd();
const {createPortableServer}=require('../../apps/max-game/launcher/portable-server.cjs');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'max-activity-webgl-'));
const report=path.join(root,'docs/verification-activity-webgl-20261027');await fs.mkdir(report,{recursive:true});
await fs.symlink(path.join(root,'apps/max-game/www'),path.join(temp,'www'),process.platform==='win32'?'junction':'dir');
const server=createPortableServer({root:temp,config:{id:'activity-test',version:'local',port:19783,entry:'/'}});
let browser;const results=[];
try {
 await server.listen();browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--autoplay-policy=no-user-gesture-required']});
 for(const kind of ['posts','store']){
  const page=await browser.newPage({viewport:{width:1536,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  // Prevent fixture settings from removing the isolated preview parameters.
  await page.route('**/__kdw/settings',route=>route.fulfill({json:{production:false}}));
  await page.goto(server.origin+`/webgl-v5/client.html?backend=local&view=pixel-map&interaction=${kind}&test=memory&activityRenderer=webgl&activityDebug=1`);
  const selector=kind==='posts'?'#kdw-posts':'#kdw-webgl-store';
  await page.waitForFunction(s=>document.querySelector(s)?.dataset.ready==='true',selector,{timeout:45000});
  const read=()=>page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityFrame));
  const attempted=new Set();let flightObserved=false,badPicked=false,lastPublished=0,goal=false,motionShot=false;
  const deadline=Date.now()+90000;
  while(Date.now()<deadline){
   const f=await read();flightObserved ||= f.flights>0;
   if(f.published>=1&&!motionShot){motionShot=true;await page.screenshot({path:path.join(report,kind+'-playing.png')});continue;}
   assert.ok(f.published>=lastPublished,'Published entries must never disappear');lastPublished=f.published;
   if(f.goal&&f.flights===0){goal=true;break;}
   const c=[...f.cards].reverse().find(c=>c.interactive&&!attempted.has(c.id)&&c.y>70&&c.y+c.h<700&&(c.good||(kind==='posts'&&!badPicked)));
   if(c&&f.flights<2){attempted.add(c.id);if(!c.good)badPicked=true;await page.mouse.click(c.x+c.w/2,c.y+c.h*.65);}
   await page.waitForTimeout(130);
  }
  assert.ok(goal,kind+' did not reach goal');assert.ok(flightObserved,'Selection flight was not observed');
  assert.equal(await page.locator('.kdw-falling-post,.kdw-product-stream .kdw-product').count(),0,'Moving cards must not exist in DOM');
  const before=await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityMetrics));assert.ok(before.resources.bytes<64*1024*1024);
  await page.screenshot({path:path.join(report,kind+'-complete.png')});
  // Resize retains publications and updates the one viewport geometry.
  const prior=await read();await page.setViewportSize({width:1920,height:1080});await page.waitForTimeout(800);
  assert.equal((await read()).published,prior.published);assert.notEqual((await read()).phone.w,prior.phone.w);
  await page.setViewportSize({width:1536,height:768});await page.waitForTimeout(500);
  if(kind==='posts'){
   await page.evaluate(()=>{const gl=document.querySelector('.webgl-canvas').getContext('webgl2'),extension=gl.getExtension('WEBGL_lose_context');if(!extension)throw Error('Context-loss extension unavailable');extension.loseContext();setTimeout(()=>extension.restoreContext(),250);});
   await page.waitForFunction(s=>{const m=JSON.parse(document.querySelector(s).dataset.activityMetrics??'{}');return m.resources?.uploads>=m.resources?.rasters*2;},selector,{timeout:15000});
   assert.equal((await read()).published,prior.published);
  }
  const finish=page.locator(selector+' [data-activity-finish]');await finish.waitFor({state:'visible'});
  await page.waitForFunction(s=>!document.querySelector(s+' [data-activity-finish]').disabled,selector);
  await finish.click();await page.waitForFunction(s=>document.querySelector(s).hidden,selector,{timeout:15000});
  await page.waitForFunction(s=>JSON.parse(document.querySelector(s).dataset.activityMetrics).resources.bytes===0,selector,{timeout:5000});
  assert.deepEqual(errors,[]);
  results.push({kind,goal,published:prior.published,flightObserved,badPicked,metrics:before,errors});console.log(JSON.stringify({kind,passed:true,published:prior.published,textureMiB:before.resources.bytes/1048576}));await page.close();
 }
 for(const business of ['flowers','auto'])for(const kind of ['posts','store']){
  const page=await browser.newPage({viewport:{width:1536,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/__kdw/settings',route=>route.fulfill({json:{production:false}}));
  await page.goto(server.origin+`/webgl-v5/client.html?backend=local&view=pixel-map&interaction=${kind}&preview-business=${business}&test=memory&activityRenderer=webgl&activityDebug=1`);
  const selector=kind==='posts'?'#kdw-posts':'#kdw-webgl-store';
  await page.waitForFunction(s=>{const f=JSON.parse(document.querySelector(s)?.dataset.activityFrame??'{}');return f.cards?.some(c=>c.interactive&&c.y>80&&c.y+c.h<650);},selector,{timeout:45000});
  const frame=await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityFrame));
  assert.ok(frame.cards.every(c=>c.postId.startsWith(business+'-')),'Wrong business bank');
  const c=[...frame.cards].reverse().find(c=>c.interactive&&c.y>80&&c.y+c.h<650);
  await page.mouse.click(c.x+c.w/2,c.y+c.h/2);
  await page.waitForFunction(s=>JSON.parse(document.querySelector(s).dataset.activityFrame).published===1,selector,{timeout:5000});
  const metrics=await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityMetrics));assert.ok(metrics.resources.bytes<64*1024*1024);assert.equal(metrics.resources.fallbacks,0);assert.deepEqual(errors,[]);
  results.push({kind,business,passed:true,metrics,errors});console.log(JSON.stringify({kind,business,passed:true}));await page.close();
 }
 const page=await browser.newPage({viewport:{width:1536,height:768}});
 await page.route('**/__kdw/settings',route=>route.fulfill({json:{production:false}}));
 await page.goto(server.origin+'/webgl-v5/client.html?backend=local&view=pixel-map&interaction=posts&test=memory&activityRenderer=dom');
 await page.waitForFunction(()=>document.querySelector('#kdw-posts')?.dataset.ready==='true',null,{timeout:45000});
 assert.equal(await page.locator('.kdw-post-phone').count(),1);results.push({kind:'dom-fallback',passed:true});await page.close();
 await fs.writeFile(path.join(report,'browser.json'),JSON.stringify({at:new Date().toISOString(),scope:'Local Chromium, not Electron/Spout',results},null,2));
}catch(e){await fs.writeFile(path.join(report,'failure.json'),JSON.stringify({error:e.stack,results},null,2));throw e;}
finally{await browser?.close();await server.close();await fs.rm(temp,{recursive:true,force:true});}
