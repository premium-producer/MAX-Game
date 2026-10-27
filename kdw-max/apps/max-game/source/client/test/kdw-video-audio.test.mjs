import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';
import {configureVideoAudio,bindVideoAudio} from '../src/kdw-video-audio.mjs';
const require=createRequire(import.meta.url);
const {createSoundLibrary}=require('../../../../STARTUP/tools/sound-library.cjs');
const element=()=>({volume:1,muted:false,currentTime:17,paused:false,setAttribute(){},removeAttribute(){}});
test('video channels respect master, remain independent, and never restart playback',()=>{
 configureVideoAudio(null);const standby=element(),task=element(),a=bindVideoAudio(standby,{group:'standby'}),b=bindVideoAudio(task);
 assert.equal(standby.muted,true); // No burst before persisted settings arrive.
 const mix={enabled:true,masterVolume:.5,video:{standby:{enabled:true,volume:.4},tasks:{enabled:true,volume:.8}}};configureVideoAudio(mix);
 assert.equal(standby.volume,.2);assert.equal(task.volume,.4);assert.equal(standby.currentTime,17);assert.equal(standby.paused,false);
 configureVideoAudio({...mix,video:{...mix.video,standby:{enabled:false,volume:.4}}});assert.equal(standby.muted,true);assert.equal(task.muted,false);
 b.setMuted(true);configureVideoAudio(mix);assert.equal(task.muted,true);b.setMuted(false);assert.equal(task.volume,.4);
 configureVideoAudio({...mix,enabled:false});assert.equal(standby.muted,true);assert.equal(task.muted,true);
 a.dispose();b.dispose();configureVideoAudio(mix);assert.equal(standby.muted,true);
});
test('old sound settings gain video defaults without rewriting or losing event assignments',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kdw-video-mix-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 let library;const server=http.createServer((req,res)=>library.handle(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const origin='http://127.0.0.1:'+server.address().port;library=createSoundLibrary({root,origin,app:'max'});
 const file=path.join(root,'data/sound-events.local.json'),old=library.state().value;delete old.video;old.masterVolume=.32;for(const event of Object.values(old.events))event.file=null;fs.writeFileSync(file,JSON.stringify(old));
 const state=library.state();assert.equal(state.value.masterVolume,.32);assert.deepEqual(state.value.video,{standby:{enabled:true,volume:1},tasks:{enabled:true,volume:1}});assert.equal(JSON.parse(fs.readFileSync(file)).video,undefined);
 const post=async(value,revision)=>fetch(origin+'/__kdw/sound/settings',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({value,revision})});
 const next=structuredClone(state.value);next.video.standby.volume=.17;next.video.tasks.enabled=false;
 let response=await post(next,state.revision);assert.equal(response.status,200);const saved=await response.json();assert.deepEqual(saved.value.events,state.value.events);assert.equal(JSON.parse(fs.readFileSync(file)).video.standby.volume,.17);
 const bad=structuredClone(next);bad.video.tasks.volume=2;response=await post(bad,saved.revision);assert.equal(response.status,400);assert.equal(library.state().value.video.tasks.volume,1);
 response=await post(next,state.revision);assert.equal(response.status,409);
 // A still-open old admin panel omits video: preserve the current assignments.
 const legacy=structuredClone(saved.value);delete legacy.video;legacy.masterVolume=.6;response=await post(legacy,saved.revision);assert.equal(response.status,200);assert.equal((await response.json()).value.video.standby.volume,.17);
 const other=path.join(root,'stela');assert.equal(createSoundLibrary({root:other,origin,app:'stela'}).state().value.video,undefined);
});
