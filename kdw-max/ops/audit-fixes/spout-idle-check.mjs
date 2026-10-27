import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='docs/verification-spout-idle-20261027';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:3072,height:1536}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__armed=false;window.kdwStandOutput={active:()=>window.__armed,tick:()=>{}};});
 await page.goto('http://127.0.0.1:18782/webgl-v5/client.html?backend=local&view=pixel-map');
 await page.waitForFunction(()=>document.documentElement.dataset.gameReady==='true',{},{timeout:60000});
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-idle-mission]')].length===4&&[...document.querySelectorAll('[data-idle-mission]')].every(e=>Number(e.dataset.pathPresence)>.97),{},{timeout:20000});
 const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));assert.equal((await state()).status,'menu');
 const button=page.locator('[data-idle-mission]').first();await button.dispatchEvent('click');assert.equal((await state()).status,'menu');
 await page.screenshot({path:out+'/disarmed-content.png',omitBackground:true});assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/checks.json',JSON.stringify({checks:['Spout-capability fixture with ARM=false','four idle icons fully revealed','menu remains menu after click while disarmed','transparent-background screenshot','no browser errors'],errors,scope:'Real Chromium renderer with simulated desktop preload; physical shared-texture transport not covered'},null,2));
 console.log('Spout idle: visible without ARM; input remains blocked');
}finally{await browser.close();}
