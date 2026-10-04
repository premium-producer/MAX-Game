import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindBFMPalm} from '../src/bfm-start-contact.mjs';
import {createBFMTransition} from '../vendor/bfm-native/screen-transition.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createBrowserPersistence} from '../src/application/browser-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';

class Button extends EventTarget{
 captures=new Set();
 getBoundingClientRect(){return {left:100,right:220,top:100,bottom:220};}
 setPointerCapture(id){this.captures.add(id);}
 hasPointerCapture(id){return this.captures.has(id);}
 releasePointerCapture(id){this.captures.delete(id);this.fire('lostpointercapture',{pointerId:id});}
 fire(type,fields={}){const e=new Event(type,{cancelable:true});Object.assign(e,{clientX:150,clientY:150,button:0,isPrimary:true,pointerId:1,...fields});this.dispatchEvent(e);}
}
test('BFM palm adapter + actual SessionPort: early release, second pointer, retry, restart',async()=>{
 let now=1000;const data=new Map();
 const port=createMissionSessionApplication({now:()=>now,persistence:createBrowserPersistence({key:'bfm-test',storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}})});
 const errors=[];const session=createWebGLSession({port,catalog:MISSION_CATALOG,sessionId:'bfm-test',profile:'local',onError:e=>errors.push(e)});
 await session.start();await session.command('SELECT_MISSION',{missionId:Object.keys(MISSION_CATALOG.missions)[0]});
 const button=new Button(),held=[];
 const contact=bindBFMPalm({button,session,enabled:()=>session.snapshot.state.status==='scan',onHeld:v=>held.push(v)});
 const flush=()=>port.getSnapshot('bfm-test');
 button.fire('pointerdown');await flush();now+=450;button.fire('pointerup');await flush();
 assert.equal(session.snapshot.state.scanned,false);
 button.fire('pointerdown');await flush();button.fire('pointerdown',{pointerId:2});button.fire('pointerup',{pointerId:2});await flush();
 assert.equal(button.hasPointerCapture(1),true);
 now+=799;await session.poll(now);assert.equal(session.snapshot.state.scanned,false);
 now+=101;await session.poll(now);assert.equal(session.snapshot.state.scanned,true);
 const revision=session.snapshot.state.revision;button.fire('pointerup');await flush();
 assert.equal(session.snapshot.state.revision,revision,'release cannot confirm twice');
 await session.restart();assert.equal(session.snapshot.state.scanned,false);
 button.fire('pointerdown');await flush();now+=100;button.fire('pointermove',{clientX:99});await flush();now+=1000;await session.poll(now);
 assert.equal(session.snapshot.state.scanned,false,'captured pointer outside cannot finish hold');
 button.fire('pointerdown');await flush();now+=300;contact.cancel();await flush();now+=1000;await session.poll(now);
 assert.equal(session.snapshot.state.scanned,false,'hidden/cancel cannot finish hold');
 assert.deepEqual(errors,[]);assert.equal(held.at(-1),false);
 contact.dispose();await session.close();
});
const classes=()=>({add(){},remove(){}});
const screen=name=>({dataset:{screen:name},classList:classes(),hidden:true});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('BFM native transition waits for finished; a cancelled snapshot cannot apply old state',async()=>{
 const screens=[screen('scan'),screen('reveal')],app={dataset:{},classList:classes()};
 const native=[];const document={startViewTransition:callback=>{const d=deferred();const item={callback,finished:d.promise,skipTransition(){d.resolve();},finish:d.resolve};native.push(item);return item;}};
 const entrances=[];
 const transition=createBFMTransition({document,app,screens,reduced:()=>false,entrance:s=>entrances.push(s.dataset.screen)});
 const commits=[];
 const old=transition.show('scan',{update:()=>commits.push('stale')}),latest=transition.show('reveal',{update:()=>commits.push('latest')});
 native[0].callback();assert.equal(app.dataset.state,undefined);
 native[1].callback();assert.equal(app.dataset.state,'reveal');assert.deepEqual(entrances,[]);
 native[1].finish();await Promise.all([old,latest]);assert.deepEqual(entrances,['reveal']);assert.equal(app.inert,false);assert.deepEqual(commits,['latest']);
 const refreshed=transition.show('reveal',{refresh:true,componentEntry:false,update:()=>commits.push('next-screen')});
 native[2].callback();native[2].finish();await refreshed;
 assert.deepEqual(commits,['latest','next-screen']);assert.deepEqual(entrances,['reveal'],'screen refresh has no second entrance');
});
test('BFM reduced motion and absent View Transitions use functional native fallback',async()=>{
 for(const reduced of [true,false]){
  const app={dataset:{},classList:classes()},screens=[screen('scan')],flags=[];
  const transition=createBFMTransition({document:{},app,screens,reduced:()=>reduced,entrance:(_s,options)=>flags.push(options.immediate)});
  await transition.show('scan');assert.equal(screens[0].hidden,false);assert.equal(app.inert,false);assert.deepEqual(flags,[reduced]);
  transition.dispose();await transition.show('scan',{immediate:true});assert.equal(flags.length,1);
 }
});
