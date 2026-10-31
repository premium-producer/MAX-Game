import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {chromium} from 'playwright';
const root=process.cwd(),require=createRequire(import.meta.url),out=path.join(root,'docs/verification-keyboard-admin-20261029');fs.mkdirSync(out,{recursive:true});
const fixture=fs.mkdtempSync(path.join(out,'fixture-'));fs.symlinkSync(path.join(root,'apps/max-game/www'),path.join(fixture,'www'),'junction');
const config={...JSON.parse(fs.readFileSync('apps/max-game/app.json')),production:false,port:19803};fs.writeFileSync(path.join(fixture,'app.json'),JSON.stringify(config));
const {createPortableServer}=require('../../apps/max-game/launcher/portable-server.cjs'),host=createPortableServer({root:fixture,config});await host.listen();
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1536,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.KDW_KEYBOARD_SCOPED_WEB)for(const name of ['app.js','kdw-interactions.css'])await page.route('**/webgl-v5/'+name,route=>route.fulfill({path:path.resolve(process.env.KDW_KEYBOARD_SCOPED_WEB,name),contentType:name.endsWith('.css')?'text/css':'text/javascript'}));
 await page.goto(host.origin+'/webgl-v5/client.html?test=memory&link=0&interaction=channel&dev=1&view=pixel-map');
 await page.waitForFunction(()=>document.documentElement.dataset.gameReady==='true'&&JSON.parse(window.render_game_to_text()).phase==='task'&&!document.querySelector('.pc-phone')?.inert,null,{timeout:60000});
 await page.locator('[data-pc-field="name"]').click({force:true});
 await page.waitForFunction(()=>{const k=document.querySelector('.kdw-keyboard');return k&&!k.inert&&getComputedStyle(k).opacity==='1';});

 const dismiss=()=>page.locator('[data-pc-key="dismiss"]').first().click({force:true});
 const field=()=>page.locator('[data-pc-field="name"]').click({force:true});
 await page.locator('[data-pc-key="language"]').click({force:true});assert.equal(await page.locator('[data-pc-key="q"]').count(),1);
 await dismiss();await field();assert.equal(await page.locator('[data-pc-key="й"]').count(),1);
 await page.locator('[data-pc-key="symbols"]').click({force:true});await dismiss();await field();assert.equal(await page.locator('[data-pc-key="й"]').count(),1);
 const geometry=()=>page.evaluate(()=>{const r=document.querySelector('.kdw-keyboard').getBoundingClientRect(),k=document.querySelector('[data-pc-key="й"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.bottom,width:r.width,keyHeight:k.height};});
 await page.waitForTimeout(600);const before=await geometry();
 const admin=await browser.newPage();await admin.route('**/webgl-v5/client.html?**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await admin.goto(host.origin+'/admin/layout.html');await admin.locator('#keyboard-fields input[type=number]').first().waitFor();await admin.locator('#layout-live').check();
 async function set(key,value){const n=admin.locator('#keyboard-fields input[type=number][data-property="'+key+'"]');await n.fill(String(value));await n.dispatchEvent('input');}
 await set('width',80);await set('height',130);await set('x',100);await set('y',-50);
 await page.waitForFunction(w=>Math.abs(document.querySelector('.kdw-keyboard').getBoundingClientRect().width-w)<1,before.width*.8);
 const after=await geometry();assert.ok(Math.abs(after.keyHeight-before.keyHeight*1.3)<1);assert.ok(Math.abs(after.x-before.x-50)<1);assert.ok(Math.abs(after.y-before.y+25)<1);
 await admin.locator('#cancel-layout').click();await page.waitForFunction(w=>Math.abs(document.querySelector('.kdw-keyboard').getBoundingClientRect().width-w)<1,before.width);
 await set('width',90);await admin.locator('#save-layout').click();await admin.waitForFunction(()=>document.querySelector('#layout-notice').textContent.includes('сохранена'));
 assert.equal(host.server.listening,true);const saved=await(await page.request.get(host.origin+'/__kdw/layout/state')).json();assert.equal(saved.value.keyboard.width,.9);
 await admin.close();await dismiss();await page.locator('[data-pc-action="pc.create"]').click({force:true});
 const click=async id=>{await page.waitForFunction(id=>{const b=document.querySelector('[data-pc-action="'+id+'"]');return b&&!b.disabled&&!b.closest('[inert]');},id);await page.locator('[data-pc-action="'+id+'"]').click({force:true});};
 await click('channel.choose-public');await click('channel.use-new-link');
 await page.waitForFunction(()=>{const b=document.querySelector('[data-pc-field="slug"]');return b&&!b.disabled&&!b.closest('[inert]');});await page.locator('[data-pc-field="slug"]').click({force:true});assert.equal(await page.locator('[data-pc-key="q"]').count(),1);
 await page.locator('[data-pc-key="language"]').click({force:true});assert.equal(await page.locator('[data-pc-key="й"]').count(),1);
 await dismiss();await page.locator('[data-pc-field="slug"]').click({force:true});assert.equal(await page.locator('[data-pc-key="q"]').count(),1);
 assert.deepEqual(errors,[]);const result={passed:true,russianOnReopen:true,symbolReset:true,englishLinkOnReopen:true,liveAdminGeometry:{before,after},cancelRestores:true,savedWidth:saved.value.keyboard.width,errors};fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await host.close();}
