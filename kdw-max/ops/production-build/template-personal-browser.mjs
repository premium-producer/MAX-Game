import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {chromium} from 'playwright';
const root=process.cwd(),require=createRequire(import.meta.url),out=path.join(root,'.cache/template-personal');fs.mkdirSync(out,{recursive:true});
const fixture=fs.mkdtempSync(path.join(out,'fixture-'));fs.symlinkSync(path.join(root,'apps/max-game/www'),path.join(fixture,'www'),'junction');
const config={...JSON.parse(fs.readFileSync('apps/max-game/app.json')),production:true,port:19804};fs.writeFileSync(path.join(fixture,'app.json'),JSON.stringify(config));
const {DEFAULTS}=require('../../apps/STARTUP/tools/stand-settings.cjs');fs.mkdirSync(path.join(fixture,'settings'));fs.writeFileSync(path.join(fixture,'settings/stand.json'),JSON.stringify({...DEFAULTS,max:{...DEFAULTS.max,entryMode:'stella'}}));
let game,summary=null,reading=false;const errors=[],controls=[];
const output={operatorStatus:()=>({contentReady:!!summary,backgroundReady:true,active:true,frames:[100,100],ui:{game:summary},lidar:{bound:true},calibration:null}),gameControl:async input=>{controls.push(input);return game.evaluate(input=>window.__operatorHandler(input),input);}};
const {createPortableServer}=require('../../apps/max-game/launcher/portable-server.cjs'),host=createPortableServer({root:fixture,config,getOutput:()=>output});await host.listen();
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});let telemetry;
try{
 const context=await browser.newContext();game=await context.newPage();await game.setViewportSize({width:1536,height:768});
 await game.addInitScript(()=>{window.kdwStandOutput={active:()=>true,presenting:()=>true,tick(){},onGameControl(fn){window.__operatorHandler=fn;return()=>{window.__operatorHandler=null;};}};});
 game.on('pageerror',e=>errors.push(e.message));game.on('console',m=>{if(m.type()==='error')console.log('GAME',m.text());});
 await game.goto(host.origin+'/webgl-v5/client.html?view=pixel-map');await game.waitForFunction(()=>document.documentElement.dataset.gameReady==='true',null,{timeout:60000});
 telemetry=setInterval(async()=>{if(reading)return;reading=true;try{summary=await game.evaluate(()=>JSON.parse(document.documentElement.dataset.operatorGame??'null'));}finally{reading=false;}},150);
 const panel=await context.newPage();panel.on('pageerror',e=>errors.push(e.message));await panel.goto(host.origin+'/admin/index.html');
 await panel.waitForFunction(()=>!document.querySelector('#game-start').disabled,null,{timeout:15000});
 const waitScreen=id=>game.waitForFunction(id=>JSON.parse(window.render_game_to_text()).screen===id,id,{timeout:30000});
 const press=async id=>{const reply=panel.waitForResponse(r=>r.url().includes('/__kdw/operator/game/')&&r.request().method()==='POST',{timeout:30000});await panel.locator(id).click({timeout:30000});const response=await reply;assert.equal(response.status(),200,JSON.stringify(await response.json()));await panel.waitForFunction(()=>document.querySelector('#notice').textContent==='Готово');};
 await panel.selectOption('#game-mission','blogger');await press('#game-start');
 await game.waitForFunction(()=>JSON.parse(window.render_game_to_text()).status==='scan'&&JSON.parse(window.render_game_to_text()).mission==='blogger',null,{timeout:30000});

 await press('#game-next');await waitScreen('blogger.channel.chats');await press('#game-next');await waitScreen('blogger.channel.menu');await press('#game-back');await waitScreen('blogger.channel.chats');
 await game.route('**/assets/kdw-linked/**/conversation/visitor-avatar.svg',route=>route.fulfill({status:404,body:''}));
 await press('#game-next');await waitScreen('blogger.channel.menu');await press('#game-next');await waitScreen('blogger.channel.name');
 await game.waitForFunction(()=>{const b=document.querySelector('[data-pc-avatar="visitor"]');return b&&!b.disabled&&!b.closest('[inert]');});
 await game.locator('[data-pc-avatar="visitor"]').click({force:true});
 await game.waitForFunction(()=>{const i=document.querySelector('.pc-form-avatar img');return i?.dataset.mediaFallback==='true'&&i.naturalWidth>0&&i.src.startsWith('data:image/webp;base64,');});
 const pixels=await game.locator('.pc-form-avatar img').evaluate(i=>{const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.drawImage(i,0,0,64,64);const a=x.getImageData(0,0,64,64).data;let opaque=0;for(let n=3;n<a.length;n+=4)if(a[n]>200)opaque++;return opaque;});assert.ok(pixels>3500,'Portrait must be opaque, not an empty decoded SVG');await game.waitForTimeout(1000);await game.screenshot({path:path.join(out,'template-man.png')});

 await press('#game-close');await game.waitForFunction(()=>JSON.parse(window.render_game_to_text()).status==='menu'&&!document.documentElement.dataset.gameId&&document.documentElement.dataset.idleMenuReady,null,{timeout:30000});
 const foreign=await panel.request.post(host.origin+'/__kdw/operator/game/control',{headers:{Origin:'https://foreign.invalid'},data:{action:'next',token:'x'}});assert.equal(foreign.status(),403);
 assert.deepEqual(errors,[]);const report={monitoring:true,templateManInVisitorAvatar:true,failedPhotoUrl:true,opaquePortrait:true,closeReturnsToStandby:true,foreignOriginRejected:true,controls:controls.length,errors};
 fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){if(game)console.log(JSON.stringify({game:await game.evaluate(()=>window.render_game_to_text?.()),summary,errors}));throw error;}finally{clearInterval(telemetry);await browser.close();await host.close();}
