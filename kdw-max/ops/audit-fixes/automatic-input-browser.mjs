import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const b=await chromium.launch({headless:true,args:['--use-angle=d3d11','--autoplay-policy=no-user-gesture-required']});
try{
 const p=await b.newPage({viewport:{width:3072,height:1536},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{globalThis.testInput=false;globalThis.kdwStandOutput={active:()=>globalThis.testInput,presenting:()=>true,tick(){}};});
 const origin=process.env.KDW_TEST_ORIGIN||'http://127.0.0.1:18782';
 const r=await p.request.post(origin+'/__kdw/link/manual',{headers:{Origin:origin},data:{missionId:'communication'}});assert.equal(r.status(),200,await r.text());
 await p.goto(origin+'/webgl-v5/client.html?backend=local&view=pixel-map');
 await p.waitForFunction(()=>document.documentElement.dataset.gameReady==='true',null,{timeout:60000});
 await p.waitForFunction(()=>Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.97,null,{timeout:30000});
 const before=await p.evaluate(()=>({state:JSON.parse(render_game_to_text()),input:kdwStandOutput.active(),visible:kdwStandOutput.presenting(),paused:document.querySelector('#circles')?.dataset.presentationPaused}));
 assert.equal(before.state.status,'scan');assert.equal(before.input,false);assert.equal(before.visible,true);
 await p.screenshot({path:'.cache/automatic-input-palm.png'});
 await p.evaluate(()=>{globalThis.testInput=true;window.dispatchEvent(new Event('kdw-output-state'));});
 const point=await p.locator('[data-palm]').evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
 await p.touchscreen.tap(point.x,point.y);
 await p.waitForFunction(()=>JSON.parse(render_game_to_text()).status==='task',null,{timeout:30000});
 const after=await p.evaluate(()=>JSON.parse(render_game_to_text()));assert.deepEqual(errors,[]);
 fs.writeFileSync('.cache/automatic-input-browser.json',JSON.stringify({before,after,errors},null,2));console.log(JSON.stringify({palmAppearedBeforeInput:true,taskStartedByTouch:true,errors}));
}finally{await b.close();}
