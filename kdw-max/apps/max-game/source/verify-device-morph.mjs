import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const packages=path.resolve(process.argv[2]);
const {build}=await import(pathToFileURL(path.join(packages,'esbuild/lib/main.js')));
const result=await build({stdin:{contents:`
 import assert from 'node:assert/strict';
 import {KdwDeviceMorph} from './client/src/kdw-device-morph.mjs';
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
 console.log('PASS: 8 resize/reduced-motion cases, resource gate, single commit, cancellation');
 `,resolveDir:path.dirname(fileURLToPath(import.meta.url)),loader:'js'},bundle:true,platform:'node',format:'esm',write:false,nodePaths:[packages]});
await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
