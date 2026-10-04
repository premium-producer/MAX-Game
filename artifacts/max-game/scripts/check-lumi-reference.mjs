import {build} from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=await build({stdin:{resolveDir:root,contents:`
import assert from 'node:assert/strict';
import {Controller} from '../ribbon/vendor/lumicells/src/core/controller/controller.ts';
import {REFERENCE_CONFIG,referenceMetrics,referenceMotionDelta} from './src/journey-lumi-reference-profile.mjs';
for(const [w,h,dpr] of [[3591,1113,1],[1920,1080,1],[1280,720,2],[4096,1280,1]]){
  const m=referenceMetrics(w,h,dpr);
  const c=new Controller({config:REFERENCE_CONFIG,random:()=>.5});
  c.nativeResolution=true;c.nativeGridPitch=Math.round(m.pitch);
  c.setViewport({hostCssW:m.width,hostCssH:m.height,dpr:1,deviceW:m.width,deviceH:m.height});
  const f=c.update(0);
  assert.equal(f.canvasWidth,m.width);assert.equal(f.canvasHeight,m.height);
  assert.equal(f.pitchPx,Math.round(m.pitch),'DPR applied once');
  assert.ok(Math.abs(m.width/f.pitchPx-3591/35)<5,'reference column density preserved');
  assert.ok(f.cols<200&&f.rows<100,'bounded cell field');
  assert.ok([...f.params,...f.frame].every(Number.isFinite),'finite GPU uniforms');
  const previous=Array.from(f.frame);c.commitFrame();
  assert.deepEqual(Array.from(c.update(0).frame),previous,'static reference does not advance');
  c.destroy();
}
assert.throws(()=>referenceMetrics(0,100));
assert.equal(referenceMetrics(2543,1227).pitch,referenceMetrics(2543,788).pitch,'height must not enlarge or crop the lattice');
for(const hz of [30,60,120]){
 const c=new Controller({config:REFERENCE_CONFIG,random:()=>.5});
 c.setViewport({hostCssW:1280,hostCssH:720,dpr:1,deviceW:1280,deviceH:720});
 for(let i=0;i<hz*32;i++)c.update(referenceMotionDelta(1/hz));
 assert.ok(Math.abs(c.clock.seconds-32)<.0001,'same phase at '+hz+' Hz');
 const phase=c.clock.seconds;
 c.update(referenceMotionDelta(60,false));assert.equal(c.clock.seconds,phase,'hidden pause');
 c.update(referenceMotionDelta(60,true,true));assert.equal(c.clock.seconds,phase,'reduced motion');
 c.update(referenceMotionDelta(1/60));assert.ok(Math.abs(c.clock.seconds-phase-1/60)<.0001,'resume has no catch-up');
 c.clock.seconds=4096-1/60;c.update(referenceMotionDelta(1/60));
 assert.ok(Math.min(c.clock.seconds,4096-c.clock.seconds)<.0001,'bounded clock seam');
 c.destroy();
}
assert.equal(referenceMotionDelta(20),.05,'stall is bounded');
console.log('PASS: viewport/DPR4, motion30/60/120Hz, hidden/reduced pause, resume, wrap, bounded stall');
`},bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
