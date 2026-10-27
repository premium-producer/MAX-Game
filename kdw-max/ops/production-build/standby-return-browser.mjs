import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {chromium} from 'playwright';
const root=process.cwd(),require=createRequire(import.meta.url),out=path.join(root,'.cache/standby-return');fs.mkdirSync(out,{recursive:true});
const fixture=fs.mkdtempSync(path.join(out,'fixture-'));fs.symlinkSync(path.join(root,'apps/max-game/www'),path.join(fixture,'www'),'junction');
const config={...JSON.parse(fs.readFileSync('apps/max-game/app.json')),production:true,port:19797};fs.writeFileSync(path.join(fixture,'app.json'),JSON.stringify(config));
const {DEFAULTS}=require('../../apps/STARTUP/tools/stand-settings.cjs');fs.mkdirSync(path.join(fixture,'settings'));fs.writeFileSync(path.join(fixture,'settings/stand.json'),JSON.stringify({...DEFAULTS,max:{...DEFAULTS.max,entryMode:'combined',timings:{...DEFAULTS.max.timings,palmWaitSeconds:2.5}}}));
const {createPortableServer}=require('../../apps/max-game/launcher/portable-server.cjs'),host=createPortableServer({root:fixture,config});await host.listen();
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1536,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.KDW_STANDBY_RETURN_BASE)await page.route('**/webgl-v5/app.js',route=>route.fulfill({path:path.resolve(process.env.KDW_STANDBY_RETURN_BASE),contentType:'text/javascript'}));
 await page.goto(host.origin+'/webgl-v5/client.html?view=pixel-map');await page.waitForFunction(()=>document.documentElement.dataset.idleMenuReady,null,{timeout:60000});
 const graphics=await page.evaluate(()=>document.documentElement.dataset.graphicsBootId);
 await page.evaluate(()=>{
  window.__returnSamples=[];let scanned=false,first=null;
  function sample(){const s=JSON.parse(window.render_game_to_text());if(s.status==='scan')scanned=true;const node=document.querySelector('[data-idle-mission="digital-id"]');if(scanned&&s.status==='menu'&&node){first??=node;window.__returnSamples.push({same:node===first,alpha:Number(node.dataset.pathPresence),phase:document.documentElement.dataset.sceneTransition});}if(!window.__returnStop)requestAnimationFrame(sample);}requestAnimationFrame(sample);
 });
 await page.locator('[data-idle-mission="digital-id"]').tap({force:true});
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).status==='scan'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:30000});
 const game=await page.evaluate(()=>document.documentElement.dataset.gameId);
 // Do not touch the palm; exercise the real no-show timeout and link release.
 await page.waitForFunction(()=>window.__returnSamples.length>0&&!document.documentElement.dataset.gameId&&document.documentElement.dataset.sceneTransition==='revealing'&&document.documentElement.dataset.idleMenuReady,null,{timeout:20000});
 await page.waitForTimeout(1400);
 const result=await page.evaluate(()=>{window.__returnStop=true;const frames=window.__returnSamples;let appeared=false,dropped=false;for(const f of frames){if(f.alpha>.97)appeared=true;else if(appeared&&f.alpha<.95)dropped=true;}return{frames:frames.length,replaced:frames.some(f=>!f.same),droppedAfterReveal:dropped,intermediateReveal:frames.some(f=>f.alpha>.02&&f.alpha<.95),graphics:document.documentElement.dataset.graphicsBootId};});
 fs.writeFileSync(path.join(out,process.env.KDW_STANDBY_RETURN_BASE?'before.json':'after.json'),JSON.stringify({...result,errors},null,2));
 assert.equal(result.replaced,false,'standby DOM must survive the release acknowledgment');assert.equal(result.droppedAfterReveal,false,'standby must not fade out after appearing');assert.equal(result.graphics,graphics);assert.equal(result.intermediateReveal,true);assert.deepEqual(errors,[]);
 await page.locator('[data-idle-mission="digital-id"]').tap({force:true});
 await page.waitForFunction(old=>{const s=JSON.parse(window.render_game_to_text());return s.status==='scan'&&document.documentElement.dataset.gameId&&document.documentElement.dataset.gameId!==old;},game,{timeout:15000});
 const report={...result,nextVisitorCanStart:true,errors};fs.writeFileSync(path.join(out,'after.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();await host.close();}
