// Local preview only. Bundle in memory so parallel production builds stay untouched.
import {chromium} from 'playwright';
import {build} from '../../apps/max-game/source/client/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=process.cwd();
const {createPortableServer}=require('../../apps/max-game/launcher/portable-server.cjs');
const source=path.join(root,'apps/max-game/source');
const bundle=process.env.KDW_ACTIVITY_BUNDLE?{outputFiles:[{text:await fs.readFile(process.env.KDW_ACTIVITY_BUNDLE,'utf8')}]}:await build({entryPoints:[path.join(source,'client/src/journey-guided-main.js')],nodePaths:[path.join(source,'vendor'),path.join(source,'client/node_modules')],bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,write:false});
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'max-selection-'));
const presentation=process.argv.includes('--full')?'full':'images';
const report=path.join(root,'docs/verification-positive-cards-20261028',process.env.KDW_ACTIVITY_BUNDLE?'deployment-'+presentation:presentation);
await fs.mkdir(report,{recursive:true});
await fs.symlink(path.join(root,'apps/max-game/www'),path.join(temp,'www'),'junction');
const server=createPortableServer({root:temp,config:{id:'selection-test',version:'local',port:19784,entry:'/'}});
let browser;const results=[];
try{
 await server.listen();browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--autoplay-policy=no-user-gesture-required']});
 for(const kind of (process.argv.includes('--store')?['store']:['posts','store'])){
  const page=await browser.newPage({viewport:{width:1536,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__kdw/settings',route=>route.fulfill({json:{production:false}}));
  await page.route('**/webgl-v5/app.js',route=>route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await page.goto(server.origin+`/webgl-v5/client.html?backend=local&view=pixel-map&interaction=${kind}&test=memory&activityRenderer=webgl&activityDebug=1&activityCards=${presentation}`);
  const selector=kind==='posts'?'#kdw-posts':'#kdw-webgl-store';
  await page.waitForFunction(s=>{
   const f=JSON.parse(document.querySelector(s)?.dataset.activityFrame??'{}');
   return f.interactive&&f.cards?.some(c=>c.y>90&&c.y+c.h<680);
  },selector,{timeout:45000});
  const frame=await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityFrame));
  const card=[...frame.cards].reverse().find(c=>c.y>90&&c.y+c.h<680);
  if(presentation==='images')for(const c of frame.cards)assert.ok(Math.abs(c.h/c.w-(kind==='posts'?210.17/315.25:5/8))<1e-6,'Hit area must match the image without the old text panel');
  else assert.ok(card.h/card.w>1,'Legacy complete cards remain available');
  await page.screenshot({path:path.join(report,kind+'-falling.png')});
  // Read again after the screenshot: cards continue moving during capture.
  const fresh=await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityFrame));
  const target=[...fresh.cards].reverse().find(c=>c.y>90&&c.y+c.h<680);
  assert.ok(target,'A card must remain on screen for selection');
  await page.mouse.click(target.x+target.w/2,target.y+target.h/2);
  await page.waitForFunction(s=>JSON.parse(document.querySelector(s).dataset.activityFrame).flights>0,selector,{timeout:5000});
  await page.waitForTimeout(140);
  await page.screenshot({path:path.join(report,kind+'-selection.png')});
  await page.waitForFunction(s=>{
   const f=JSON.parse(document.querySelector(s).dataset.activityFrame);return f.published===1&&f.flights===0;
  },selector,{timeout:10000});
  await page.screenshot({path:path.join(report,kind+'-selected.png')});
  assert.deepEqual(errors,[]);
  assert.equal((await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityFrame))).rimCount,0,'No rim after landing');
  let sawQueue=false,goalFrame=null;
  const deadline=Date.now()+60000;
  while(Date.now()<deadline){
   const f=await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityFrame));
   assert.ok(f.cards.every(c=>c.good),'Only positive cards may enter the stream');
   sawQueue ||= f.flightPoses.some(p=>p.phase==='queued');
   if(f.goal){goalFrame=f;break;}
   // Use the accessible equivalent of the same card action to build a backlog.
   await page.locator(selector+' [data-activity-list] button').first().evaluate(el=>el.click()).catch(()=>{});
   await page.waitForTimeout(30);
  }
  assert.ok(goalFrame,'Goal reached');assert.ok(sawQueue,'Queued picks exercised');
  assert.ok(goalFrame.dismissed.length>0,'Accepted queued cards are retired at the goal');
  const visible=goalFrame.visiblePublished;
  await page.waitForFunction(s=>{const f=JSON.parse(document.querySelector(s).dataset.activityFrame);return !f.goalExit&&f.flights===0;},selector,{timeout:4000}).catch(async e=>{console.log(JSON.stringify({goalFrame,current:await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityFrame))}));throw e;});
  const final=await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityFrame));
  assert.ok(final.time-goalFrame.time<650,'Completion must not drain the flight queue');
  assert.equal(final.visiblePublished,visible,'Cancelled queued picks must not pop into the feed');
  assert.equal(final.rimCount,0);assert.equal(final.cards.length,0);
  await page.waitForFunction(s=>!document.querySelector(s+' [data-activity-finish]').disabled,selector,{timeout:5000});
  await page.screenshot({path:path.join(report,kind+'-goal.png')});
  const metrics=await page.locator(selector).evaluate(el=>JSON.parse(el.dataset.activityMetrics));
  results.push({kind,presentation,published:final.published,visiblePublished:final.visiblePublished,dismissed:final.dismissed,goalExitMs:final.time-goalFrame.time,flightCompleted:true,resources:metrics.resources,errors});
  console.log(JSON.stringify(results.at(-1)));await page.close();
 }
 await fs.writeFile(path.join(report,'selection-browser.json'),JSON.stringify(results,null,2));
}finally{
 await browser?.close();await server.close();
 // Remove the junction itself first; never recurse into the shared www target.
 await fs.rmdir(path.join(temp,'www'));
 assert.equal(path.dirname(path.resolve(temp)),path.resolve(os.tmpdir()));
 assert.ok(path.basename(temp).startsWith('max-selection-'));
 await fs.rm(temp,{recursive:true,force:true});
}
