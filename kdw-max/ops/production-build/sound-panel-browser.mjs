import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {chromium} from 'playwright';
import {build} from '../../apps/max-game/source/client/node_modules/esbuild/lib/main.js';
const require=createRequire(import.meta.url),{createSoundLibrary}=require('../../apps/STARTUP/tools/sound-library.cjs');
const out=path.resolve('docs/verification-sound-panel-20261027');fs.mkdirSync(out,{recursive:true});
const cache=path.resolve('.cache/sound-browser');fs.mkdirSync(cache,{recursive:true});
const tone=Buffer.alloc(44+48000*2);tone.write('RIFF');tone.writeUInt32LE(tone.length-8,4);tone.write('WAVEfmt ',8);tone.writeUInt32LE(16,16);tone.writeUInt16LE(1,20);tone.writeUInt16LE(1,22);tone.writeUInt32LE(48000,24);tone.writeUInt32LE(96000,28);tone.writeUInt16LE(2,32);tone.writeUInt16LE(16,34);tone.write('data',36);tone.writeUInt32LE(96000,40);for(let i=0;i<48000;i++)tone.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*440/48000)*4000),44+i*2);
const services=[];
async function fixture(app){
 const root=fs.mkdtempSync(path.join(cache,app+'-'));const seed=app==='max'?'www/webgl-v5/audio':'www/stella/soundtrack';fs.mkdirSync(path.dirname(path.join(root,seed)),{recursive:true});fs.cpSync(path.resolve('apps',app==='max'?'max-game':'stela',seed),path.join(root,seed),{recursive:true});
 const entry=app==='max'?`import {EventAudio} from './apps/max-game/source/client/src/kdw-event-audio.mjs';import {bindVideoAudio} from './apps/max-game/source/client/src/kdw-video-audio.mjs';window.videos=['standby','tasks'].map(group=>{const v=document.createElement('video');document.body.append(v);bindVideoAudio(v,{group});return v;});window.startEngine=async()=>{window.engine=new EventAudio({baseURL:new URL('/__kdw/sound/file/',location.origin)});engine.configure(await fetch('/__kdw/sound/state').then(r=>r.json()));engine.setActive(true);engine.activate();};`:`import {soundtrack} from './apps/stela/source/artifacts/stella-prototype/src/features/voice/soundtrack.ts';window.startEngine=async()=>{window.engine=soundtrack;engine.configureEvents(await fetch('/__kdw/sound/state').then(r=>r.json()));engine.update(true,'idle','intro');};`;
 const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'js'},bundle:true,write:false,format:'esm',define:{'import.meta.env.BASE_URL':'"/stella/"'},nodePaths:[path.resolve('apps/max-game/source/client/node_modules')]});let library;
 const server=http.createServer((req,res)=>{if(library.handle(req,res))return;if(req.url==='/harness.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents);return;}res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Audio engine check</title><button onclick="startEngine()">Start</button><script type="module" src="/harness.js"></script>');});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;library=createSoundLibrary({root,origin,app});const result={root,origin,library,server};services.push(result);return result;
}
let browser;const checks=[],errors=[];
try{
 const max=await fixture('max'),stela=await fixture('stela');browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 for(const [app,f,event]of [['max',max,'click1'],['stela',stela,'Click']]){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__starts=0;const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.__starts++;return start.apply(this,args)};});
  await page.goto(f.origin+'/__kdw/sound/panel');await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Подключено'));
  assert.equal(await page.locator('#video-settings').isVisible(),app==='max');if(app==='max'){await page.locator('#video-standby-volume').fill('25');await page.locator('#video-tasks-volume').fill('80');await page.locator('#video-tasks-enabled').uncheck();}
  await page.locator('#masterVolume').fill('60');await page.locator('#fadeInMs').fill('100');await page.locator('#fadeOutMs').fill('200');
  await page.locator('#files').setInputFiles({name:'Проверка звука.wav',mimeType:'audio/wav',buffer:tone});await page.locator('#upload').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Файлы загружены'));
  // Upload/list refresh must not discard unsaved master values.
  assert.equal(await page.locator('#masterVolume').inputValue(),'60');
  const label=f.library.state().events.find(e=>e.id===event).label;
  await page.getByLabel('Файл: '+label,{exact:true}).selectOption('Проверка звука.wav');await page.getByLabel('Громкость: '+label,{exact:true}).fill('37');await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.startsWith('Настройки сохранены'));
  assert.equal(f.library.state().value.events[event].file,'Проверка звука.wav');assert.equal(f.library.state().value.masterVolume,.6);
  await page.getByLabel('Файл: '+label,{exact:true}).locator('..').locator('..').getByRole('button',{name:'Прослушать'}).click();await page.waitForFunction(()=>window.__starts>0);await page.locator('#stop').click();
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(out,app+'-sound-panel.png'),fullPage:true});checks.push(app+': upload/decode, unsaved values retained, event file/volume save, actual preview AudioBufferSource.start');
  await page.reload();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Подключено'));assert.equal(await page.getByLabel('Громкость: '+label,{exact:true}).inputValue(),'37');await page.close();
  const runtime=await browser.newPage();runtime.on('pageerror',e=>errors.push(e.message));await runtime.goto(f.origin+'/');await runtime.getByRole('button',{name:'Start'}).click();
  if(app==='max'){
   await runtime.waitForFunction(()=>window.engine?.mix!==null&&window.engine?.mix!==undefined);
   const media=await runtime.evaluate(()=>videos.map(v=>({volume:v.volume,muted:v.muted})));assert.equal(media[0].volume,.15);assert.equal(media[0].muted,false);assert.equal(media[1].muted,true);checks.push('MAX video panel saves independent Standby/task channels; actual HTMLVideoElement gains follow event mix master');
   await runtime.waitForFunction(()=>engine.sounds.get('click1')?.state()==='loaded'&&engine.loops.has('ambience'));
   const result=await runtime.evaluate(async()=>{engine.play('click1');await new Promise(r=>setTimeout(r,160));const v=engine.voices.find(v=>v.key==='click1');return{volume:v.sound.volume(v.id),src:v.sound._src,playing:v.sound.playing(v.id)};});assert.equal(result.playing,true);assert(Math.abs(result.volume-.222)<.002);assert(result.src.includes(encodeURIComponent('Проверка звука.wav')));
   await runtime.waitForFunction(()=>{const v=engine.voices.find(v=>v.key==='click1');return v&&!v.sound.playing(v.id)});
   await runtime.evaluate(()=>engine.dispose());checks.push('MAX actual Howler voice: custom file, event × master gain, finite playback, cleanup');
  }else{
   await runtime.waitForFunction(()=>engine.loops.has('AmbienceMain'));
   const result=await runtime.evaluate(async()=>{engine.play('Click');await new Promise(r=>setTimeout(r,400));const node=[...engine.shots][0],e=engine.envelopes.get(node);return{eventGain:e.gain.gain.value,master:engine.effects.gain.value,duration:node.buffer.duration};});assert(Math.abs(result.eventGain-.37)<.002);assert(Math.abs(result.master-.6)<.02);assert.equal(result.duration,1);
   await runtime.waitForFunction(()=>engine.shots.size===0);await runtime.evaluate(()=>engine.stop());checks.push('Stella actual Web Audio source: custom file, independent event/master gains, natural end cleanup');
  }
  await runtime.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors,scope:'Local isolated HTTP services and real Chromium audio engines; no SSH or production PCs'},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser?.close();for(const f of services){f.server.closeAllConnections();await new Promise(r=>f.server.close(r));}}
