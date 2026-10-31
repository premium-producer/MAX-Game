import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{validateLidarConfig}=require('../../apps/max-game/launcher/lidar.cjs');
const root='apps/max-game/source/operator/',html=fs.readFileSync(root+'index.html','utf8').replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),script=fs.readFileSync(root+'panel.js','utf8');
let state={settings:{max:{entryMode:'combined',timings:{}},stella:{timings:{}},defaults:{}},settingsRevision:'s',lidarRevision:'l',lidar:{enabled:true,bindAddress:'127.0.0.1',sourceAddress:'127.0.0.1',port:3000,timeoutMs:350,width:3072,height:1536,rawPoints:[[0,0],[1,0],[1,1],[0,1]],targetPoints:[[560,0],[2320,0],[2320,1536],[560,1536]]},presentation:{},output:{active:true,contentReady:true,frames:[10,10],lidar:{bound:true,filter:{options:{enabled:true},suppressed:0}}}};
let posted,errors=[];const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://127.0.0.1:19809/**',async route=>{const req=route.request();if(req.url().includes('/__kdw/operator/')){if(req.method()==='POST'){posted=req.postDataJSON();state.lidar=validateLidarConfig(posted.value);state.output.lidar.filter.options=state.lidar.inputFilter;}await route.fulfill({contentType:'application/json',body:JSON.stringify(state)});}else await route.fulfill({contentType:'text/html',body:html});});
 await page.goto('http://127.0.0.1:19809/');await page.addScriptTag({content:script});await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Подключено'));
 assert.equal(await page.locator('#filterStrength').inputValue(),'50');
 await page.locator('#filterStrength').fill('80');await page.locator('#filterEnabled').selectOption('false');
 await page.locator('#lidar-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent==='Готово');
 assert.equal(posted.value.inputFilter.enabled,false);assert(posted.value.inputFilter.minCutoff<1.2);assert.equal(posted.value.inputFilter.maxGapMs,250);assert.equal(posted.value.port,3000);
 await page.locator('#reload').click();await page.waitForFunction(()=>!busy);await page.waitForFunction(()=>document.querySelector('#filterStrength').value==='80');assert.equal(await page.locator('#filterEnabled').inputValue(),'false');
 await page.locator('#filterEnabled').selectOption('true');await page.locator('#lidar-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#filter-state').textContent.includes('включено'));assert.equal(posted.value.inputFilter.enabled,true);
 delete state.output.lidar.filter;await page.locator('#reload').click();await page.waitForFunction(()=>!busy);await page.waitForFunction(()=>document.querySelector('#filter-controls').disabled);assert.deepEqual(errors,[]);
 console.log('PASS: real panel toggle/strength/save/reload, runtime validator, legacy runtime disabled controls');
}finally{await browser.close();}
