import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {chromium} from 'playwright';
const root=process.cwd(),require=createRequire(import.meta.url),out=path.join(root,'.cache/keyboard-press');fs.mkdirSync(out,{recursive:true});
const fixture=fs.mkdtempSync(path.join(out,'fixture-'));fs.symlinkSync(path.join(root,'apps/max-game/www'),path.join(fixture,'www'),'junction');
const config={...JSON.parse(fs.readFileSync('apps/max-game/app.json')),production:false,port:19796};fs.writeFileSync(path.join(fixture,'app.json'),JSON.stringify(config));
const {createPortableServer}=require('../../apps/max-game/launcher/portable-server.cjs'),host=createPortableServer({root:fixture,config});await host.listen();
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.KDW_KEYBOARD_SCOPED_WEB)for(const name of ['app.js','kdw-interactions.css'])await page.route('**/webgl-v5/'+name,route=>route.fulfill({path:path.resolve(process.env.KDW_KEYBOARD_SCOPED_WEB,name),contentType:name.endsWith('.css')?'text/css':'text/javascript'}));
 await page.goto(host.origin+'/webgl-v5/client.html?test=memory&link=0&interaction=channel&dev=1&view=pixel-map');
 await page.waitForFunction(()=>document.documentElement.dataset.gameReady==='true'&&JSON.parse(window.render_game_to_text()).phase==='task'&&!document.querySelector('.pc-phone')?.inert,null,{timeout:60000});
 await page.locator('[data-pc-field="name"]').click({force:true});
 await page.waitForFunction(()=>{const k=document.querySelector('.kdw-keyboard');return k&&!k.inert&&getComputedStyle(k).opacity==='1';});
 await page.evaluate(()=>window.__firstKey=document.querySelector('[data-pc-key="й"]'));
 const r=await page.locator('[data-pc-key="й"]').boundingBox(),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});
 const first=await page.evaluate(()=>({same:document.querySelector('[data-pc-key="й"]')===window.__firstKey,pressed:window.__firstKey.dataset.keyboardPressed,value:document.querySelector('[data-pc-field="name"]').value,animations:window.__firstKey.getAnimations().length}));
 assert.equal(first.same,true);assert.equal(first.pressed,'true');assert.equal(first.value,'Й');assert.ok(first.animations>0);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const tested=await page.evaluate(()=>{
  const checks=[];
  function hit(value,klass){const b=[...document.querySelectorAll('[data-pc-key]')].find(k=>k.dataset.pcKey===value&&(!klass||k.classList.contains(klass)));if(!b||b.disabled)throw Error('Missing key '+value);b.click();if(!b.isConnected||b.dataset.keyboardPressed!=='true')throw Error('Lost press '+value);checks.push(value);}
  hit('backspace');hit('shift');hit('й');hit(' ');hit('language');hit('q');hit('symbols');hit('1');hit('@');hit('symbols');hit('q');hit('shift');hit('backspace');
  hit('dismiss','kdw-key-enter');return checks;
 });
 await page.waitForTimeout(300);assert.equal(await page.locator('[data-keyboard-pressed]').count(),0);
 await page.locator('[data-pc-field="name"]').click({force:true});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.kdw-keyboard')).opacity==='1');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const reduced=await page.evaluate(()=>{const b=document.querySelector('[data-pc-key="q"]');b.click();return{pressed:b.dataset.keyboardPressed,animations:b.getAnimations().filter(a=>a.constructor.name==='Animation'&&a.playState==='running'&&a.effect?.getKeyframes().some(k=>k.transform)).length,details:b.getAnimations().map(a=>({type:a.constructor.name,state:a.playState,time:a.currentTime,frames:a.effect?.getKeyframes()}))};});
 console.log(JSON.stringify({reduced}));assert.equal(reduced.pressed,'true');assert.equal(reduced.animations,0);assert.deepEqual(errors,[]);
 const result={lidarTouch:first,keys:tested,reducedMotion:reduced,errors};fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await host.close();}
