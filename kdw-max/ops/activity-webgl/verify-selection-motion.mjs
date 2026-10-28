// Targeted local browser regression: real pointer selection and renderer poses.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=process.cwd(),report=path.join(root,'docs/verification-activity-selection-20261028');
await fs.mkdir(report,{recursive:true});
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'max-selection-motion-'));
await fs.symlink(path.join(root,'apps/max-game/www'),path.join(temp,'www'),'junction');
const server=require('../../apps/max-game/launcher/portable-server.cjs').createPortableServer({root:temp,config:{id:'selection-test',version:'local',port:19786,entry:'/'}});
let browser;const results=[];
try{
 await server.listen();browser=await chromium.launch({headless:true,args:['--use-angle=d3d11']});
 for(const kind of ['posts','store']){
  const page=await browser.newPage({viewport:{width:1536,height:768}}),errors=[],selector=kind==='posts'?'#kdw-posts':'#kdw-webgl-store';
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
  await page.route('**/__kdw/settings',r=>r.fulfill({json:{production:false}}));
  await page.goto(server.origin+`/webgl-v5/client.html?backend=local&view=pixel-map&interaction=${kind}&test=memory&activityRenderer=webgl&activityDebug=1`);
  await page.waitForFunction(s=>JSON.parse(document.querySelector(s)?.dataset.activityFrame??'{}').cards?.some(c=>c.interactive&&c.y>120&&c.y+c.h<620&&c.vy>0),selector,{timeout:45000});
  const before=await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityFrame));
  const card=[...before.cards].reverse().find(c=>c.interactive&&c.y>120&&c.y+c.h<620&&c.vy>0);
  await page.evaluate(s=>{window.selectionFrames=[];const end=performance.now()+2400;function sample(){const raw=document.querySelector(s)?.dataset.activityFrame;if(raw)window.selectionFrames.push(JSON.parse(raw));if(performance.now()<end)requestAnimationFrame(sample);}requestAnimationFrame(sample);},selector);
  await page.mouse.click(card.x+card.w/2,card.y+card.h/2);
  await page.waitForTimeout(130);await page.screenshot({path:path.join(report,kind+'-braking.png')});
  await page.waitForTimeout(470);await page.screenshot({path:path.join(report,kind+'-flight.png')});
  await page.waitForTimeout(1900);
  const frames=await page.evaluate(()=>window.selectionFrames);
  const poses=frames.flatMap(frame=>(frame.flightPoses??[]).filter(f=>f.id===card.id).map(f=>({...f,time:frame.time})));
  const braking=poses.filter(p=>['pending','queued'].includes(p.phase));
  assert.ok(braking.length>=8,kind+' skipped smooth braking');assert.ok(braking.at(-1).y>braking[0].y,kind+' froze instead of braking');
  const speeds=braking.slice(1).filter((p,i)=>p.time>braking[i].time).map((p,i)=>(p.y-braking[i].y)/(p.time-braking[i].time));
  assert.ok(speeds.at(-1)<speeds[0]*.1,kind+' did not decelerate');
  assert.ok(poses.some(p=>p.phase==='flying')&&poses.some(p=>p.phase==='docking'));
  assert.ok(poses.every(p=>p.layerOrder===card.layerOrder),kind+' promoted the selected card');
  const reveals=poses.filter(p=>p.phase==='docking').map(p=>p.reveal);assert.ok(reveals.some(r=>r>.1&&r<.9),kind+' has no intermediate docking fade');
  const final=JSON.parse(await page.locator(selector).getAttribute('data-activity-frame'));assert.equal(final.published,1);assert.equal(final.flights,0);assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(report,kind+'-frames.json'),JSON.stringify({card,frames},null,2));await page.screenshot({path:path.join(report,kind+'-settled.png')});
  results.push({kind,passed:true,brakeFrames:braking.length,initialSpeed:speeds[0],finalSpeed:speeds.at(-1),layerOrder:card.layerOrder,dockingSamples:reveals.length,errors});console.log(JSON.stringify(results.at(-1)));await page.close();
 }
 await fs.writeFile(path.join(report,'result.json'),JSON.stringify({at:new Date().toISOString(),scope:'Local Chromium; no stand update',results},null,2));
}finally{await browser?.close();await server.close();await fs.rm(temp,{recursive:true,force:true});}
