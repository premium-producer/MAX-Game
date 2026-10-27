import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';

const root=process.cwd(),dir=path.join(root,'.cache/navigation-press');fs.mkdirSync(dir,{recursive:true});
const require=createRequire(import.meta.url),{build}=require(path.join(root,'apps/max-game/source/client/node_modules/esbuild'));
await build({stdin:{contents:`import {installNativeTouch} from './apps/max-game/source/client/src/kdw-native-touch.mjs';import {createTransitionLayout} from './apps/max-game/source/client/src/kdw-transition-layout.mjs';
installNativeTouch({document});const layout=createTransitionLayout({document,params:new URLSearchParams()});
const button=document.querySelector('.kdw-transition-button');window.samples=[];window.clicks=0;
button.addEventListener('click',()=>{window.clicks++;setTimeout(()=>button.disabled=true,80);setTimeout(()=>button.disabled=false,350);});
function frame(){layout();const r=button.getBoundingClientRect();window.samples.push({width:r.width,height:r.height,x:r.x,y:r.y,contact:button.dataset.transitionContact==='true'});requestAnimationFrame(frame);}requestAnimationFrame(frame);`,resolveDir:root,loader:'js'},bundle:true,format:'esm',nodePaths:[path.join(root,'apps/max-game/source/client/node_modules')],outfile:path.join(dir,'fixture.js')});
const css=fs.readFileSync(path.join(root,'apps/max-game/source/client/src/kdw-interactions.css'),'utf8');
const html=`<!doctype html><html data-pixel-map="true"><style>${css}
html,body{margin:0;background:#170c30}.route-phone{position:absolute;left:1000px;top:200px;width:390px;height:800px}.task-dialog .instruction{position:absolute;left:1700px;top:350px;width:500px;height:200px}.kdw-post-actions{left:1000px;top:1032px;width:390px}</style><div class="route-phone"></div><div class="task-dialog"><div class="instruction">Справка</div></div><section id="kdw-posts"><div class="kdw-post-actions"><button class="kdw-activity-button kdw-transition-button">Следующее задание</button></div></section><script type="module" src="/fixture.js"></script></html>`;
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'text/javascript':'text/html');res.end(req.url==='/fixture.js'?fs.readFileSync(path.join(dir,'fixture.js')):html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
const results=[];
try{browser=await chromium.launch({headless:true});for(const baseline of [true,false]){
 const page=await browser.newPage({viewport:{width:3072,height:1536},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.samples?.length>4);
 if(baseline)await page.addStyleTag({content:'.kdw-activity-button.kdw-transition-button{transition:filter .12s,transform .12s}.kdw-activity-button.kdw-transition-button:active:not(:disabled){transform:scale(.98)}'});
 const r=await page.locator('button').boundingBox(),cdp=await page.context().newCDPSession(page);
 await page.evaluate(()=>window.samples=[]);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});await page.waitForTimeout(550);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
 const result=await page.evaluate(()=>({clicks:window.clicks,widthRange:Math.max(...samples.map(s=>s.width))-Math.min(...samples.map(s=>s.width)),heightRange:Math.max(...samples.map(s=>s.height))-Math.min(...samples.map(s=>s.height)),contactFrames:samples.filter(s=>s.contact).length}));results.push({baseline,...result,errors});await page.close();
 }
 assert.ok(results[0].widthRange>5,'Baseline must reproduce changing button geometry');assert.ok(results[1].widthRange<.1);assert.ok(results[1].heightRange<.1);assert.equal(results[1].clicks,1);assert.deepEqual(results[1].errors,[]);
 fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
