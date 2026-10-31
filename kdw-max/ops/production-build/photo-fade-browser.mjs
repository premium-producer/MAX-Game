// Focused GPU acceptance of the production media guard and opacity clock.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const root=path.resolve('apps/max-game/source/client'),out=path.resolve('docs/verification-photo-fade-20261028');
const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<div class="route-phone"></div>');return;}const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.json')?'application/json':'text/javascript');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 const report=await page.evaluate(async()=>{
  const {guardImage,requestImageSource,revealUploadedMedia,mediaGhostOpacity}=await import('/src/kdw-graceful-media.mjs');
  const T=await import('/node_modules/three/build/three.module.js');
  const uri=color=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="${color}"/></svg>`);
  document.documentElement.dataset.webglUi='true';const image=new Image();image.src=uri('blue');await image.decode();document.querySelector('.route-phone').append(image);
  let changed;const guard=guardImage(image,{onChange:()=>changed?.()});await guard.ready;
  const swapped=new Promise(r=>changed=r);requestImageSource(image,uri('red'));await swapped;await image.decode();const ghost=document.querySelector('[data-media-ghost]');await ghost.decode();
  if(!ghost||ghost.getAnimations().length)throw Error('Template faded before GPU upload');
  const renderer=new T.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(32,32);const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=2;
  const geometry=new T.PlaneGeometry(2,2),fresh=new T.Texture(image),old=new T.Texture(ghost);fresh.needsUpdate=old.needsUpdate=true;
  const material=new T.MeshBasicMaterial({map:old,transparent:true,depthWrite:false});const under=new T.Mesh(geometry,new T.MeshBasicMaterial({map:fresh})),over=new T.Mesh(geometry,material);over.position.z=.1;scene.add(under,over);renderer.initTexture(fresh);renderer.initTexture(old);
  const gl=renderer.getContext(),pixel=()=>{material.opacity=mediaGhostOpacity(ghost);renderer.render(scene,camera);const p=new Uint8Array(4);gl.readPixels(16,16,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return [...p];};
  const waiting=pixel();revealUploadedMedia(image);const animation=ghost.getAnimations()[0];animation.pause();const samples=[];
  for(const ms of [0,130,260,390,519]){animation.currentTime=ms;samples.push({ms,opacity:mediaGhostOpacity(ghost),rgba:pixel()});}
  animation.finish();await animation.finished;await new Promise(r=>setTimeout(r,0));const removed=!ghost.isConnected;guard.dispose();renderer.dispose();geometry.dispose();fresh.dispose();old.dispose();return{waiting,samples,removed,gpu:gl.getParameter(gl.RENDERER)};
 });
 assert.deepEqual(report.waiting,[0,0,255,255]);assert.equal(report.samples[0].rgba[2],255);assert.ok(report.samples[2].rgba[0]>100&&report.samples[2].rgba[2]>100);assert.ok(report.samples.at(-1).rgba[0]>250&&report.samples.at(-1).rgba[2]<10);assert.ok(report.removed);
 for(let i=1;i<report.samples.length;i++)assert.ok(report.samples[i].opacity<report.samples[i-1].opacity);
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify({passed:true,...report},null,2)+'\n');console.log(JSON.stringify({passed:true,...report}));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
