// Read-only CPU diagnostic. Inject the browser's documented origin-clean
// exception into the installed Three wrapper, then run the real UI adapter.
// This does not execute a browser, create a GPU context or prove browser state.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const project=new URL('../../../',import.meta.url);
const state=await fs.readFile(new URL('artifacts/max-game/node_modules/three/src/renderers/webgl/WebGLState.js',project),'utf8');
const results=[];
for(const profile of ['artifacts/max-game','integration/current/code/client','integration/current/code/stand']){
 const source=await fs.readFile(new URL(`${profile}/src/journey-webgl-ui.mjs`,project),'utf8');
 const render=source.slice(source.indexOf('  render(renderer){'),source.indexOf('  dispose(){',source.indexOf('  render(renderer){')));
 for(const api of ['texImage2D','texSubImage2D']){
  const start=state.indexOf(`\tfunction ${api}()`),end=state.indexOf('\n\tfunction ',start+1);
  let rejectedUploads=0,loggedErrors=0;
  const upload=vm.runInNewContext(`${state.slice(start,end)};${api}`,{
   gl:{[api](){rejectedUploads++;throw new DOMException('The canvas has been tainted.','SecurityError');}},
   error(){loggedErrors++;}
  });
  const key='run:blogger.comments.post:task';
  const screen={querySelectorAll:()=>[image]},phone={dataset:{sceneVersion:key,mediaReadyKey:key},querySelector:()=>screen};
  const image={tagName:'IMG',dataset:{},isConnected:true,closest:()=>phone},texture={};
  const uploadedPhoneTextures=new WeakSet(),failedPhoneTextures=new WeakSet();
  const materials=[{userData:{el:image},map:texture},{userData:{el:screen,deviceShell:true}}];
  const method=vm.runInNewContext(`({${render}}).render`,{
   disposed:false,warmPhoneUploads:new Map(),warmPhoneKeys:new Set(),cache:new Map(),uploadedPhoneTextures,failedPhoneTextures,materials,
   root:{querySelectorAll:s=>s.startsWith('.route-phone')?[phone]:[]},rect:()=>({w:360,h:800}),contextGlass:{render(){}},scene:{},camera:{},getSize:()=>({width:3200}),
   retiredMaterials:[],document:{documentElement:{dataset:{}}},finished:new Map(),console,queueMicrotask,flights:new Map(),
   timingFrame:null,arenaFrame:null,arena:{getBoundingClientRect:()=>({})},devicePixelScale:1,preparedDevices:new Map(),preparedDeviceKeys:new Set(),prepareDeviceQueue(){},
   performance,preparationStats:{uploads:0,uploadMs:0,maxUploadMs:0},reportPreparation(){},videoTextures:new Map()
  });
  method({domElement:{width:3200},initTexture(){upload();}});
  assert.equal(rejectedUploads,1);assert.equal(loggedErrors,1);
  const result={profile,api,rejectedUploads,loggedErrors,recordedUploaded:uploadedPhoneTextures.has(texture),publishedGpuReady:phone.dataset.gpuReadyKey===key,reportedGpuUploadError:phone.dataset.gpuUploadError??null};
  assert.equal(result.recordedUploaded,true);assert.equal(result.publishedGpuReady,true);assert.equal(result.reportedGpuUploadError,null);
  results.push(result);
 }
}
console.log(JSON.stringify({scope:'CPU exact-source adapter with injected origin-clean exception; no browser/GPU verification',sourceEvidence:'https://github.com/whatwg/html/issues/10641',conclusion:'The outer initTexture try/catch cannot detect the installed Three wrapper swallowing the upload exception. Remove the empty foreignObject wrappers from imported media; do not bypass readiness.',results},null,2));
