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
const report=path.join(root,'docs/verification-popup-cards-20261028',process.env.KDW_ACTIVITY_BUNDLE?'deployment-'+presentation:presentation);
await fs.mkdir(report,{recursive:true});
await fs.symlink(path.join(root,'apps/max-game/www'),path.join(temp,'www'),'junction');
const server=createPortableServer({root:temp,config:{id:'selection-test',version:'local',port:19784,entry:'/'}});
let browser;const results=[];
try{
 await server.listen();browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--autoplay-policy=no-user-gesture-required']});
 for(const kind of ['posts','store']){
  const page=await browser.newPage({viewport:{width:1536,height:768}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__kdw/settings',route=>route.fulfill({json:{production:false}}));
  await page.route('**/webgl-v5/app.js',route=>route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await page.goto(server.origin+`/webgl-v5/client.html?backend=local&view=pixel-map&interaction=${kind}&test=memory&activityRenderer=webgl&activityDebug=1`);
  const selector=kind==='posts'?'#kdw-posts':'#kdw-webgl-store';
  await page.waitForFunction(s=>JSON.parse(document.querySelector(s)?.dataset.activityFrame??'{}').interactive,selector,{timeout:45000});
  const sample=await page.evaluate(async selector=>{
   const observations=new Map();const end=performance.now()+3000;
   while(performance.now()<end){await new Promise(requestAnimationFrame);
    const f=JSON.parse(document.querySelector(selector).dataset.activityFrame);
    for(const c of f.cards){const list=observations.get(c.id)??[];list.push({...c,time:f.time,age:f.elapsed-c.start});observations.set(c.id,list);}
   }
   return [...observations.values()];
  },selector);
  assert.ok(sample.length>=4,'Multiple random appearances observed');
  for(const frames of sample){
   for(const c of frames){assert.equal(c.flow,'popup');assert.equal(c.travel,150);assert.ok(c.age>=0&&c.age<150);assert.ok(c.good);assert.equal(c.vx,0);assert.equal(c.vy,0);assert.ok(Math.abs(c.x-frames[0].x)<.01&&Math.abs(c.y-frames[0].y)<.01,'No falling movement');}
  }
  assert.ok(new Set(sample.map(frames=>Math.round(frames[0].y))).size>2,'Random vertical positions');
  const result=await page.evaluate(async selector=>{
   const end=performance.now()+25000;let attempts=0;
   while(performance.now()<end){await new Promise(requestAnimationFrame);
    const el=document.querySelector(selector),f=JSON.parse(el.dataset.activityFrame);
    if(f.goal&&!f.goalExit&&f.flights===0)return {goal:true,published:f.published,rimCount:f.rimCount,attempts};
    const button=el.querySelector('[data-activity-list] button');if(button&&f.interactive){button.click();attempts++;}
   }
   return {goal:false,frame:JSON.parse(document.querySelector(selector).dataset.activityFrame)};
  },selector);
  assert.ok(result.goal,JSON.stringify(result));assert.equal(result.rimCount,0);assert.deepEqual(errors,[]);
  results.push({kind,appearances:sample.length,stationary:true,lifetimeMs:150,...result,errors});
  console.log(JSON.stringify(results.at(-1)));await page.close();
 }
 await fs.writeFile(path.join(report,'popup-browser.json'),JSON.stringify(results,null,2));
}finally{
 await browser?.close();await server.close();
 // Remove the junction itself first; never recurse into the shared www target.
 await fs.rmdir(path.join(temp,'www'));
 assert.equal(path.dirname(path.resolve(temp)),path.resolve(os.tmpdir()));
 assert.ok(path.basename(temp).startsWith('max-selection-'));
 await fs.rm(temp,{recursive:true,force:true});
}
