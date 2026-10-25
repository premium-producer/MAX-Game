import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const packages=path.resolve(process.argv[2]);
const {build}=await import(pathToFileURL(path.join(packages,'esbuild/lib/main.js')));
const result=await build({stdin:{contents:`
 import assert from 'node:assert/strict';
 import {KdwDeviceMorph} from './client/src/kdw-device-morph.mjs';
 import {RegistrationLinks} from './client/src/kdw-registration-links.mjs';
 for(const [from,to,fromHeight,toHeight] of [[372,449,800,960],[449,372,960,800],[392,392,800,960],[1200,392,800,800]]){
  for(const reduced of [false,true]){
   const m=new KdwDeviceMorph(),frames=[];let commits=0,ready=false;
   m.start(()=>{commits++},reduced,{from,to,fromHeight,toHeight,resize:(w,h)=>frames.push([w,h]),ready:()=>ready});
   for(let i=0;i<600&&m.phase!=='ready';i++)m.tick(1/60);
   assert.equal(m.phase,'ready');assert.equal(commits,1);assert.deepEqual(frames.at(-1),[to,toHeight]);
   for(const [w,h]of frames){assert.ok(w>=Math.min(from,to)&&w<=Math.max(from,to));assert.ok(h>=Math.min(fromHeight,toHeight)&&h<=Math.max(fromHeight,toHeight));if(to!==from&&toHeight!==fromHeight)assert.ok(Math.abs((w-from)/(to-from)-(h-fromHeight)/(toHeight-fromHeight))<1e-9);}
   if(!reduced&&toHeight!==fromHeight){assert.ok(frames.length>10);assert.ok(Math.abs(frames[0][1]-fromHeight)<Math.abs(toHeight-fromHeight)*.1);}
   for(let i=0;i<60;i++)m.tick(1/60);assert.equal(m.value,0);assert.equal(commits,1);
   ready=true;for(let i=0;i<600&&m.busy;i++)m.tick(1/60);assert.equal(m.value,1);assert.equal(m.busy,false);
  }
 }
 const cancel=new KdwDeviceMorph();let committed=false;cancel.start(()=>{committed=true},false,{from:1,to:2});cancel.cancel();cancel.tick(1);assert.equal(committed,false);
 const links=new RegistrationLinks(),old={x:10,y:20,w:1200,h:800},snack={x:100,y:300,w:600,h:100},frames=[];
 links.update(old,{screenId:'business.platform.verification',runKey:'one',time:0});
 for(let i=1;i<=90;i++)frames.push(links.update(snack,{screenId:'business.platform.ready',runKey:'one',time:i/60}));
 assert.ok(frames[0].opacity>.9);assert.ok(frames.some(f=>f.opacity>.1&&f.opacity<.9));assert.equal(frames.at(-1).opacity,0);
 frames.forEach((f,i)=>{assert.deepEqual(f.rect,old);if(i)assert.ok(f.opacity<=frames[i-1].opacity);});
 assert.equal(links.update(snack,{screenId:'business.platform.ready',runKey:'two',time:2}).opacity,0);
 assert.equal(links.update(old,{screenId:'business.channel.create',runKey:'two',time:2.1,reduced:true}).opacity,1);
 assert.equal(links.update(snack,{screenId:'business.platform.ready',runKey:'two',time:2.2,reduced:true}).opacity,0);
 console.log('PASS: 8 resize/reduced-motion cases, resource gate, single commit, cancellation');
 console.log('PASS: registration link fade, retained anchor, new run, reduced motion and restoration');
 `,resolveDir:path.dirname(fileURLToPath(import.meta.url)),loader:'js'},bundle:true,platform:'node',format:'esm',write:false,nodePaths:[packages]});
await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
