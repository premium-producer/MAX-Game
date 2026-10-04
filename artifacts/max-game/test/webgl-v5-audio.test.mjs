import test from 'node:test';
import assert from 'node:assert/strict';
import {V5Audio,V5_SOUNDS} from '../src/journey-v5-audio.mjs';
class Sound {
 static next=0;
 constructor(options){this.options=options;this.live=new Set();this.calls=[];this.ready=true;}
 state(){return this.ready?'loaded':'loading';}
 play(){const id=++Sound.next;this.live.add(id);this.calls.push(['play',id]);return id;}
 playing(id){return this.live.has(id);}
 stop(id){id===undefined?this.live.clear():this.live.delete(id);this.calls.push(['stop',id]);}
 fade(){} volume(){} unload(){this.live.clear();this.unloaded=true;}
}
function setup(){const audio=new V5Audio({Sound,baseURL:new URL('http://localhost/webgl-v5/audio/'),random:()=>0,isRunning:()=>true,resume:()=>{}});return audio;}
const count=(audio,key)=>audio.sounds.get(key).calls.filter(c=>c[0]==='play').length;
test('No autoplay before user gesture; an activation starts one ambience across mission switches',()=>{
 const a=setup();a.sync({run:'a',stage:'startup:shell'});assert.equal(count(a,'hand'),0);assert.equal(count(a,'ambience'),0);
 a.activate();a.activate();a.sync({run:'b',stage:'startup:shell'});a.sync({run:'menu'});a.sync({run:'c',stage:'startup:shell'});
 assert.equal(count(a,'ambience'),1);assert.equal(count(a,'hand'),2);
});
test('Repeated snapshots produce one cue; next screen and new run produce the correct cue',()=>{
 const a=setup();a.activate();const state={run:'a',stage:'startup:row',nodes:['first','second']};
 for(let i=0;i<20;i++)a.sync(state);assert.equal(count(a,'row'),1);assert.equal(count(a,'pop'),2);
 a.sync({...state,screen:'screen1'});a.sync({...state,screen:'screen1'});assert.equal(count(a,'activate'),1);
 a.sync({...state,screen:'screen2'});assert.equal(count(a,'reactivate'),1);
 a.sync({...state,run:'b',screen:'screen1'});assert.equal(count(a,'activate'),2);
});
test('Release, hide, mute and dispose stop held loops; old events are not replayed on return',()=>{
 const a=setup();a.activate();a.sync({run:'a',holding:true});assert.ok(a.loops.has('hold'));
 a.release();assert.ok(!a.loops.has('hold'));a.grab('phone');a.setActive(false);assert.equal(a.loops.size,0);
 a.sync({run:'a',stage:'startup:fan',active:false});a.setActive(true);assert.equal(count(a,'fan'),0);assert.equal(a.loops.size,1);
 a.setMuted(true);a.click();assert.equal(a.loops.size,0);assert.equal(count(a,'click1'),0);
 a.dispose();a.activate();assert.ok([...a.sounds.values()].every(s=>s.unloaded));
});
test('Unloaded SFX are dropped, not queued; current voices are bounded',()=>{
 const a=setup();a.activate();a.sounds.get('click1').ready=false;assert.equal(a.click(),false);
 a.sounds.get('click1').ready=true;assert.equal(count(a,'click1'),0);
 for(let i=0;i<30;i++)a.click();assert.equal(a.voices.length,5);assert.equal(a.sounds.get('click1').live.size,5);
 assert.equal(Object.keys(V5_SOUNDS).length,16);
});

test('Accepted menu click may finish across mission switch, but is stopped by hiding',()=>{
 const a=setup();a.activate();a.click();a.play('fan');a.sync({run:'new'});
 assert.equal(a.sounds.get('click1').live.size,1);assert.equal(a.sounds.get('fan').live.size,0);
 a.setActive(false);assert.equal(a.sounds.get('click1').live.size,0);
});

test('Suspended context never queues stale SFX or loops for a later resume',()=>{
 let running=false;const a=new V5Audio({Sound,baseURL:new URL('http://localhost/audio/'),isRunning:()=>running,resume:()=>{}});
 a.activate();a.play('hand');a.sync({run:'a',stage:'startup:row',holding:true});
 assert.equal(count(a,'ambience'),0);assert.equal(count(a,'hand'),0);assert.equal(count(a,'row'),0);
 a.release();running=true;a.restoreLoops();assert.equal(count(a,'ambience'),1);assert.equal(count(a,'hold'),0);assert.equal(count(a,'row'),0);
});
