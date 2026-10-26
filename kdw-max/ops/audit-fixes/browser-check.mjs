import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const output='docs/verification-audit-fixes-20261026/browser';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const errors=[],checks=[];
function monitor(page,app){page.on('pageerror',e=>errors.push({app,message:e.message}));page.on('console',e=>{if(e.type()==='error')errors.push({app,message:e.text()});});}
try{
 const max=await browser.newPage({viewport:{width:3072,height:1536}});monitor(max,'max');
 await max.goto('http://127.0.0.1:18782/webgl-v5/client.html?backend=local&view=pixel-map');
 await max.waitForFunction(()=>document.documentElement.dataset.gameReady==='true',{},{timeout:60000});await max.waitForTimeout(5000);
 await max.screenshot({path:output+'/max-menu.png'});assert.equal(JSON.parse(await max.evaluate(()=>window.render_game_to_text())).status,'menu');checks.push('MAX actual production menu at 3072×1536');await max.setViewportSize({width:1536,height:768});await max.emulateMedia({reducedMotion:'reduce'});
 for(const stage of ['intro','audience','result']){
  const stela=await browser.newPage({viewport:{width:1080,height:1920},reducedMotion:'reduce',permissions:['camera','microphone']});monitor(stela,'stela-'+stage);
  await stela.addInitScript(()=>{const Base=window.WebSocket;window.__testSockets=[];window.WebSocket=class extends Base{constructor(...args){super(...args);window.__testSockets.push(this);}};});
  await stela.goto('http://127.0.0.1:18781/stella/?voice=off');await stela.getByRole('button',{name:'Начать разговор с MAX'}).click();
  await stela.locator('[data-screen="omni-intro"]').waitFor();
  if(stage!=='intro'){await stela.getByRole('button',{name:'Начать',exact:true}).click();await stela.locator('[data-screen="omni-audience"]').waitFor();}
  if(stage==='result'){
   await stela.getByRole('button',{name:'Развитие бизнеса',exact:true}).click();await stela.getByRole('button',{name:'Без фото',exact:true}).click();
   await stela.locator('p[data-game-link="delivered"]').waitFor({timeout:20000});await stela.screenshot({path:output+'/stela-delivered.png'});checks.push('Stella manual selection → no photo → delivery with current invitation');
  }
  await stela.evaluate(()=>window.__testSockets.filter(s=>s.readyState===WebSocket.OPEN).forEach(s=>s.close(1000,'audit recovery')));
  await stela.locator('[data-voice-recovery="offline"]').waitFor();assert.equal(await stela.locator('.voice-screen-content').evaluate(n=>n.inert),true);
  await stela.screenshot({path:output+'/stela-offline-'+stage+'.png'});await stela.getByRole('button',{name:'Начать сначала',exact:true}).click();await stela.locator('[data-screen="omni-entry"]').waitFor();
  await stela.getByRole('button',{name:'Начать разговор с MAX'}).click();await stela.locator('[data-screen="omni-intro"]').waitFor();checks.push('Stella '+stage+' disconnect → visible local recovery → new session');await stela.close();
 }
 await max.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).status==='scan',{},{timeout:60000});await max.waitForTimeout(3000);await max.screenshot({path:output+'/max-scan.png'});
 await max.bringToFront();await max.waitForFunction(()=>JSON.parse(window.render_game_to_text()).ready===true,{},{timeout:60000});
 const palm=await max.getByRole('button',{name:'Приложи ладонь, чтобы начать',exact:true}).boundingBox();assert.ok(palm);await max.mouse.move(palm.x+palm.width/2,palm.y+palm.height/2);await max.mouse.down();await max.waitForTimeout(1200);await max.mouse.up();
 await max.waitForFunction(()=>JSON.parse(window.render_game_to_text()).status==='task',{},{timeout:20000});
 const audio=await max.evaluate(()=>JSON.parse(document.documentElement.dataset.audio));assert.equal(audio.loaded,16);assert.equal(audio.active,true);assert.equal(audio.errors,0);checks.push('Portable audio: 16 resources loaded, active during scan/task, no load errors');
 await max.waitForFunction(()=>JSON.parse(window.render_game_to_text()).ready===true,{},{timeout:60000});await max.waitForTimeout(1500);await max.screenshot({path:output+'/max-task.png'});checks.push('Stella handoff → MAX palm claim → first business task');
 fs.writeFileSync(output+'/max-state.json',await max.evaluate(()=>window.render_game_to_text()));
 fs.writeFileSync(output+'/results.json',JSON.stringify({checks,errors},null,2));assert.deepEqual(errors,[]);
}catch(error){
 for(const context of browser.contexts())for(const page of context.pages()){
  if(page.url().includes(':18782')){await page.screenshot({path:output+'/failure-max.png'});console.error(JSON.stringify(await page.evaluate(()=>({state:window.render_game_to_text?.(),data:{...document.documentElement.dataset},hidden:document.hidden,text:document.body.innerText.slice(-3000)}))));}
 }
 console.error(JSON.stringify({errors}));throw error;
}finally{await browser.close();}
