import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as model from '../public/site-game/model.mjs';
import * as reveal from '../public/site-game/site-reveal-motion.mjs';
import {CHANNEL_SCREENS,CHANNEL_SAVE_KEY,ChannelTransition,channelNext,restoreChannel} from '../public/site-game/channel-task.mjs';

function act(flow,action,reduced=false){const r=flow.request(action);assert.ok(r);if(r.to==='complete')return r;assert.equal(flow.prepared(r.id),true);for(let i=0;i<100&&flow.phase!=='idle';i++)flow.step(1/60,reduced);return r;}
test('private channel requires plus, channel menu, fields and actual creation before completion',()=>{
 const flow=new ChannelTransition();assert.equal(channelNext('chats','button'),null);
 for(const action of ['plus','channel','example','create','continue','skip-invites'])act(flow,action);
 assert.equal(flow.screen,'created');assert.equal(act(flow,'button').to,'complete');
 assert.equal(flow.request('button'),null); // only one completion
});
test('public channel keeps its branch through link, subscribers and completion',()=>{
 const flow=new ChannelTransition('privacy');
 for(const action of ['public','new','link-example','continue-public','skip-invites'])act(flow,action);
 assert.equal(flow.screen,'created');assert.equal(flow.type,'public');assert.equal(act(flow,'button').to,'complete');
 const saved=restoreChannel(JSON.stringify({version:2,screen:'created',completed:true,type:flow.type}));
 assert.equal(saved.type,'public');assert.equal(saved.completed,true);
});
 test('keeping old link returns to private; prior erroneous gap restores available link',()=>{
 const flow=new ChannelTransition('privacy');act(flow,'public');act(flow,'keep');
 assert.equal(flow.screen,'privacy');assert.equal(flow.type,'private');
 const saved=restoreChannel('{"version":2,"screen":"public-gap","completed":true}');
 assert.equal(saved.screen,'public-link');assert.equal(saved.type,'public');assert.equal(saved.completed,false);
 });
test('repeat input, stale decode and navigation cancellation never advance the incoming screen',()=>{
 const flow=new ChannelTransition();const r=flow.request('plus');assert.equal(flow.request('channel'),null);
 assert.equal(flow.prepared(r.id-1),false);assert.equal(flow.prepared(r.id),true);
 assert.equal(flow.request('channel'),null);flow.step(.3);assert.equal(flow.screen,'chats');
 flow.cancel();assert.equal(flow.prepared(r.id),false);assert.equal(flow.step(5),false);assert.equal(flow.screen,'chats');
});
test('decode failure retry changes request identity and preserves old semantic screen',()=>{
 const flow=new ChannelTransition();const a=flow.request('plus'),b=flow.retry();
 assert.equal(flow.screen,'chats');assert.equal(flow.prepared(a.id),false);assert.equal(flow.prepared(b.id),true);
 assert.equal(flow.step(.69),false);assert.equal(flow.step(.02),true);assert.equal(flow.screen,'menu');
});
test('transition and reduced motion agree at 30/60/120 Hz without animation state in save',()=>{
 for(const hz of [30,60,120]){const flow=new ChannelTransition();const r=flow.request('plus');flow.prepared(r.id);for(let i=0;i<hz;i++)flow.step(1/hz);assert.equal(flow.screen,'menu');}
 const reduced=new ChannelTransition();act(reduced,'plus',true);assert.equal(reduced.screen,'menu');
 assert.equal(restoreChannel('{'),null);assert.equal(restoreChannel('{"version":2,"screen":"bad"}'),null);
 assert.equal(restoreChannel('{"version":2,"screen":"public-gap","completed":true}').completed,false);
 assert.equal(restoreChannel('{"version":2,"screen":"created","completed":true}').completed,true);
});
test('every hotspot belongs to its full-resolution frame; shipped bytes match original',()=>{
 for(const s of Object.values(CHANNEL_SCREENS)){if(!s.frame)continue;const name=`frame-${s.frame}.png`;
  const local=new URL(`../public/site-game/client-media/${name}`,import.meta.url),original=new URL(`../public/assets/client-media/${name}`,import.meta.url);
  assert.ok(existsSync(local));assert.deepEqual(readFileSync(local),readFileSync(original));
  for(const {rect:[x,y,w,h]} of s.actions??[]){assert.ok(x>=0&&y>=0&&w>=48&&h>=48&&x+w<=360&&y+h<=800);}
 }
});
test('app boots menu, mounts channel, cancels on navigation and restores completed channel',()=>{
 const storage=new Map(),elements=new Map();let disposed=0,mounted=0;
 const element=key=>{if(!elements.has(key))elements.set(key,{isConnected:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},querySelector:child=>element(`${key}/${child}`),querySelectorAll:()=>[],getBoundingClientRect:()=>({width:1600}),textContent:'',innerHTML:''});return elements.get(key);};
 const sandbox={...model,...reveal,restoreChannel,CHANNEL_SAVE_KEY,assets:{logo:'logo'},Hold:model.Hold,performance:{now:()=>100},location:{search:''},innerWidth:1600,innerHeight:900,URLSearchParams,matchMedia:()=>({matches:false}),window:{addEventListener(){}},document:{querySelector:element,addEventListener(){},hidden:false},requestAnimationFrame(){},clearGlowTiming(){},applyGlowTiming(){},setGlowPaused(){},warmChannel(){},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},ChannelView:class{constructor(){mounted++;}dispose(){disposed++;}},MotionValue:class{},IconMotion:class{},MOTION:{},JOURNEY_LINK_STYLE:{},tileEdgeCurve(){},sampleTileEdgeCurve(){}};
 const context=vm.createContext(sandbox),source=readFileSync(new URL('../public/site-game/app.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
 vm.runInContext(source,context); // Executes actual initial menu/restore entry.
 vm.runInContext("start('blogger');phase='ready';openTask();menu();",context);
 assert.equal(mounted,1);assert.equal(disposed,1);
 storage.set(CHANNEL_SAVE_KEY,JSON.stringify({version:2,screen:'created',completed:true}));
 assert.equal(vm.runInContext("start('blogger');step",context),1);
 assert.equal(vm.runInContext("clearSave();start('blogger');step",context),0);
});
