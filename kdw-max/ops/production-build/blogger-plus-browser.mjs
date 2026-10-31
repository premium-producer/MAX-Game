import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {chromium} from 'playwright';
const root=process.cwd(),require=createRequire(import.meta.url),out=path.join(root,'docs/verification-blogger-plus-20261029');fs.mkdirSync(out,{recursive:true});
const fixture=fs.mkdtempSync(path.join(out,'fixture-'));fs.symlinkSync(path.join(root,'apps/max-game/www'),path.join(fixture,'www'),'junction');
const config={...JSON.parse(fs.readFileSync('apps/max-game/app.json')),production:false,port:19802};fs.writeFileSync(path.join(fixture,'app.json'),JSON.stringify(config));
fs.mkdirSync(path.join(fixture,'data'),{recursive:true});fs.writeFileSync(path.join(fixture,'data/layout.local.json'),JSON.stringify(JSON.parse(fs.readFileSync(path.join(out,'layout-fixture.json'),'utf8'))));
const {createPortableServer}=require('../../apps/max-game/launcher/portable-server.cjs'),host=createPortableServer({root:fixture,config});await host.listen();
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1536,height:768},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.KDW_KEYBOARD_SCOPED_WEB)for(const name of ['app.js','kdw-interactions.css'])await page.route('**/webgl-v5/'+name,route=>route.fulfill({path:path.resolve(process.env.KDW_KEYBOARD_SCOPED_WEB,name),contentType:name.endsWith('.css')?'text/css':'text/javascript'}));
 await page.goto(host.origin+'/webgl-v5/client.html?test=memory&link=0&interaction=channel&dev=1&view=pixel-map');
 await page.waitForFunction(()=>document.documentElement.dataset.gameReady==='true'&&JSON.parse(window.render_game_to_text()).phase==='task'&&!document.querySelector('.pc-phone')?.inert,null,{timeout:60000});
 await page.locator('[data-pc-action="personal.back.blogger.channel.name"]').click({force:true});
 await page.waitForFunction(()=>document.querySelector('[data-pc-action="personal.back.blogger.channel.menu"]')&&!document.querySelector('.pc-phone').inert);
 await page.locator('[data-pc-action="personal.back.blogger.channel.menu"]').click({force:true});
 await page.waitForFunction(()=>document.querySelector('[data-pc-action="channel.open-create-menu"]')&&!document.querySelector('.pc-phone').inert);
 await page.waitForTimeout(700);
 await page.evaluate(()=>window.kdwStandOutput={contactRadius:()=>36});
 const b=page.locator('[data-pc-action="channel.open-create-menu"]'),r=await b.boundingBox(),cdp=await page.context().newCDPSession(page);
 const before=await page.evaluate(()=>{const b=document.querySelector('[data-pc-action="channel.open-create-menu"]'),r=b.getBoundingClientRect();return {state:window.render_game_to_text(),rect:r.toJSON(),top:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML,disabled:b.disabled,inert:b.closest('[inert]')?.className};});
 fs.writeFileSync(path.join(out,'before.json'),JSON.stringify(before,null,2));console.log('BEFORE',JSON.stringify(before));
 await page.screenshot({path:path.join(out,'expanded-before.png')});
 console.log('PICK',await page.evaluate(async source=>{const m=await import('data:text/javascript;base64,'+btoa(source)),b=document.querySelector('[data-pc-action="channel.open-create-menu"]'),r=b.getBoundingClientRect(),y=r.y+r.height*1.65,x=r.x+r.width/2,rr=m.missionHitRect(b);return {hit:rr,intersects:m.circleIntersectsRect(x,y,18,rr),edge:document.elementFromPoint(x,r.bottom-.01)?.outerHTML,center:document.elementFromPoint(x,r.y+r.height/2)?.outerHTML,pick:m.pickCircleControl(document,'#kdw-personal-channel button',x,y,18,el=>!el.disabled&&!el.closest('[hidden],[inert]')&&getComputedStyle(el).pointerEvents!=='none',m.missionHitRect)?.outerHTML};},fs.readFileSync('apps/max-game/source/client/src/kdw-contact-area.mjs','utf8')));

 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height*1.65,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForTimeout(500);
 console.log('AFTER',await page.evaluate(()=>({state:window.render_game_to_text(),feedback:document.querySelector('[data-pc-error]')?.textContent})));
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).screen==='blogger.channel.menu',null,{timeout:5000});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'expanded-touch.json'),JSON.stringify({passed:true,before,touch:{x:r.x+r.width/2,y:r.y+r.height*1.65},errors},null,2));console.log('EXPANDED_PLUS_TOUCH_PASS');
}finally{await browser.close();await host.close();}
