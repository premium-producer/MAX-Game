import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {chromium} from 'playwright';
const root=process.cwd(),require=createRequire(import.meta.url),out=path.join(root,'docs/verification-keyboard-reach-20261029');fs.mkdirSync(out,{recursive:true});
const fixture=fs.mkdtempSync(path.join(out,'fixture-'));fs.symlinkSync(path.join(root,'apps/max-game/www'),path.join(fixture,'www'),'junction');
const config={...JSON.parse(fs.readFileSync('apps/max-game/app.json')),production:false,port:19797};fs.writeFileSync(path.join(fixture,'app.json'),JSON.stringify(config));
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

 await page.evaluate(()=>{window.kdwStandOutput={contactRadius:()=>25};});
 const keys=[];
 async function tap(key,expect){
  const b=page.locator('[data-pc-key="'+key+'"]'),r=await b.boundingBox();assert.ok(r,'Missing '+key);
  const x=r.x+r.width*(key==='backspace'?.8:key==='language'?.2:.5),y=r.y+r.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  if(expect!==undefined)assert.equal(await page.locator('[data-pc-field="name"]').inputValue(),expect,key);
  keys.push(key);await page.waitForTimeout(260);
 }
 await tap('backspace','');await tap('shift');await tap('й','Й');await tap('language');
 assert.equal(await page.locator('[data-pc-key="q"]').count(),1);
 await tap('q','Йq');await tap('shift');await tap('q','ЙqQ');await tap('backspace','Йq');
 await tap('symbols');await tap('1','Йq1');await tap('backspace','Йq');await tap('symbols');await tap('language');
 assert.equal(await page.locator('[data-pc-key="й"]').count(),1);
 const geometry=[];
 for(const size of [{width:1920,height:1080},{width:3072,height:1536}]){
  await page.setViewportSize(size);await page.waitForTimeout(350);
  const v=await page.evaluate(()=>{
   const node=document.querySelector('.kdw-channel-scene'),panel=document.querySelector('.kdw-keyboard'),r=panel.getBoundingClientRect(),scale=Number(node.style.getPropertyValue('--kdw-scale'));
   const physical=Math.min(innerWidth/3072,innerHeight/1536),top=(innerHeight-1536*physical)/2;
   const safe={left:(innerWidth-3072*physical)/2+(560+1760*.07)*physical,right:(innerWidth-3072*physical)/2+(560+1760*.93)*physical,top:top+1536*.07*physical,bottom:top+1536*.93*physical,height:1536*.86*physical};
   return {width:innerWidth,rect:r.toJSON(),scale,safe,bottom:Number.parseFloat(node.style.bottom),keys:[...panel.querySelectorAll('button')].map(b=>({key:b.dataset.pcKey,rect:b.getBoundingClientRect().toJSON()}))};
  });
  assert.ok(Math.abs(v.rect.width-1544*v.scale*.85)<1,'Keyboard must be 15% narrower without reducing height');
  assert.ok(Math.abs(v.bottom-(size.height-v.safe.bottom+v.safe.height*.23))<1,'Keyboard lift');
  for(const k of v.keys){assert.ok(k.rect.x>=v.safe.left&&k.rect.right<=v.safe.right&&k.rect.y>=v.safe.top&&k.rect.bottom<=v.safe.bottom,'Key outside safe region: '+k.key);}
  geometry.push(v);await tap('backspace',size.width===1920?'Й':'');
 }
 await page.screenshot({path:path.join(out,'keyboard.png')});assert.deepEqual(errors,[]);
 const result={passed:true,lidarTouch:first,keys,geometry,errors};fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:true,keys,viewports:geometry.map(v=>v.width)}));
}finally{await browser.close();await host.close();}
