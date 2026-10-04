import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import { BACK_CLICK_GAP_MS, createDebugGesture, initialControls, readDebugSession, saveDebugSession, DEBUG_SESSION_KEY } from '../src/production-controls.mjs';
const sequence=Array(10).fill('back');

test('production ignores stale URL and saved drag; authorized debug can change modes',()=>{
  assert.deepEqual(initialControls('?debug=1&connection=world&placement=drag',false,'drag'),{connection:'hybrid',placement:'tap'});
  assert.deepEqual(initialControls('',false),{connection:'hybrid',placement:'tap'});
  assert.deepEqual(initialControls('?connection=screen',true,'drag'),{connection:'screen',placement:'drag'});
  assert.equal(initialControls('?connection=bad',true).connection,'hybrid');
});

test('exact ten Back clicks toggles once and can be repeated',()=>{
  const step=createDebugGesture();let at=1000,enabled=false,toggles=0;
  for(let pass=0;pass<2;pass++){
    sequence.forEach((target,index)=>{const hit=step(target,at+=100);assert.equal(hit,index===9);if(hit){enabled=!enabled;toggles++;}});
    assert.equal(enabled,pass===0);
  }
  assert.equal(toggles,2);
});

test('wrong order, unrelated clicks, incomplete sequence and pauses do not unlock',()=>{
  for(const inputs of [['title',...sequence.slice(3)],['logo','logo','title','title','logo','logo','logo'],['logo','logo','logo',null,'title','title','logo','logo','logo']]){
    const step=createDebugGesture();assert.ok(inputs.every((target,index)=>!step(target,index*100)));
  }
  const step=createDebugGesture();sequence.slice(0,5).forEach((target,i)=>assert.equal(step(target,i*100),false));
  sequence.slice(5).forEach((target,i)=>assert.equal(step(target,6000+i*100),false));
});

test('debug session survives mode-link reload and disabling clears it; storage failure is safe',()=>{
  const values=new Map();const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  assert.equal(readDebugSession(storage),false);saveDebugSession(storage,true);assert.equal(readDebugSession(storage),true);
  saveDebugSession(storage,false);assert.equal(values.has(DEBUG_SESSION_KEY),false);
  const denied={getItem(){throw Error()},setItem(){throw Error()},removeItem(){throw Error()}};
  assert.equal(readDebugSession(denied),false);assert.doesNotThrow(()=>saveDebugSession(denied,true));
});

test('public HTML hides all six maintenance groups before JS and keeps navigation visible',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal((html.match(/data-debug-only hidden/g)||[]).length,6);
  assert.match(html, /data-game-action="debug-off">[\s\S]*?<\/button>\s*<nav class="connection-modes"/);
  const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
  assert.match(css, /\.debug\s*\{[^}]*bottom: 12px;[^}]*left: 12px;/);
  assert.doesNotMatch(css.match(/\.debug\s*\{[^}]*\}/)[0], /\btop:/);
  assert.match(html,/<button class="outline-button ui-copy-button" type="button" data-game-action="back">/);
  assert.match(html,/<div class="language-switcher" role="group"/);
  assert.doesNotMatch(html,/data-debug-trigger/);
  assert.doesNotMatch(readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),/data-debug-trigger/);
});

test('ten Back clicks toggle debug without navigation; a short series navigates once',()=>{
  const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const extract=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
  const controls=[{hidden:true},{hidden:true}];const classes=new Set();let clears=0,refreshes=0,reloads=0;
  let muted=true, navigations=0;
  const timers=new Map();let timerId=0;
  const ctx={BACK_CLICK_GAP_MS,backNavigationTimer:null,setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id),dispatch:()=>navigations++,audioDirector:{setMuted:value=>{muted=value}},syncAudioControl(){},appReady:true,languageTransitionPromise:null,debugEnabled:false,advanceDebugGesture:createDebugGesture(),saveDebugSession,sessionStorage:undefined,
    document:{documentElement:{classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}}},debug:{hidden:true},uiShell:{querySelectorAll:()=>controls},
    placementMode:'drag',placementSession:0,missionRun:{},state:{allMissionsAvailable:false},baseMissionCatalog:{missions:[{mode:'hybrid'}]},connectionMode:m=>m.mode,
    updateMission:()=>clears++,syncPlacementControls:()=>refreshes++,scheduleTypographyLayoutPass(){},location:{href:'http://localhost/?connection=world&lang=en',replace:()=>reloads++},URL};
  vm.createContext(ctx);vm.runInContext(extract('function syncDebugVisibility()', 'function startProjectConfigReloadListener()'),ctx);
  const click=target=>{let stopped=false;ctx.onDebugGestureClick({button:0,target:{closest:()=>target==='back'?{}:null},preventDefault(){},stopPropagation(){stopped=true}});assert.ok(stopped)};
  sequence.forEach(click);assert.equal(muted,true);assert.equal(ctx.debugEnabled,true);assert.ok(controls.every(c=>!c.hidden));assert.equal(ctx.debug.hidden,false);
  sequence.forEach(click);assert.equal(muted,false);assert.equal(ctx.debugEnabled,false);assert.equal(ctx.placementMode,'tap');assert.ok(controls.every(c=>c.hidden));assert.equal(clears,1);assert.equal(refreshes,2);assert.equal(reloads,0);
  assert.equal(navigations,0);assert.equal(timers.size,0);
  click('back');click('back');assert.equal(timers.size,1);
  [...timers.values()][0]();assert.equal(navigations,1);assert.equal(timers.size,0);
  click('back');ctx.onDebugGestureClick({target:{closest:()=>null}});assert.equal(timers.size,0);
  ctx.baseMissionCatalog.missions[0].mode='world';sequence.forEach(click);sequence.forEach(click);assert.equal(reloads,1);
});


test('production audio boot clears stale mute before preparation; debug retains its explicit setting', async () => {
  const { AudioEngine } = await import('../src/audio/audio-engine.mjs');
  const { AudioDirector } = await import('../src/audio/audio-director.mjs');
  const { manifest } = await import('./audio-runtime-fixture.mjs');
  const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const begin=source.indexOf('    if (audioManifest) {');
  const boot=source.slice(begin,source.indexOf('    const localizedMissionCatalog',begin));
  for (const debugEnabled of [false,true]) {
    const values=new Map([[manifest.settings.storageKey,'1']]);
    const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
    const engine=new AudioEngine(manifest,{storage});
    const ctx={debugEnabled,audioManifest:manifest,audioDirector:null,audioAdapter:null,
      AudioDirector:class extends AudioDirector {constructor(m){super(m,{engine});}},AudioAppAdapter:class {}};
    vm.createContext(ctx);vm.runInContext(boot,ctx);
    assert.equal(ctx.audioDirector.isMuted(),debugEnabled);
    assert.equal(values.get(manifest.settings.storageKey),debugEnabled?'1':'0');
    assert.equal(engine.context,null,'boot does not bypass browser gesture unlock');
    assert.equal(ctx.audioDirector.unlocked,false);
  }
});
