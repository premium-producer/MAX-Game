import test from 'node:test';
import assert from 'node:assert/strict';
import {V5DeviceMorph,v5DeviceMetrics,V5_DEVICE_FRAME} from '../src/journey-v5-device-morph.mjs';
import {V5RevealJourney} from '../src/journey-v5-route-layout.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../src/journey-v5-backend.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
const flush=()=>new Promise(r=>setImmediate(r));
const screens=Object.values(catalog.tasks).flatMap(task=>Object.values(task.screens));
const deviceOf=screen=>({kind:screen.deviceKind,asset:catalog.assets[screen.assetId],actions:screen.actions});
const deviceFor=id=>deviceOf(screens.find(screen=>screen.screenId===id));

test('all 70 reviewed catalog screens preserve full image aspect independently of external controls',()=>{
 assert.equal(screens.length,70);
 const {height,insetX,insetY}=V5_DEVICE_FRAME;
 for(const screen of screens){
  const device=deviceOf(screen),metrics=v5DeviceMetrics(device);
  assert.ok(device.asset.width>0&&device.asset.height>0,screen.screenId);
  const viewport={width:metrics.width-2*insetX,height:metrics.height-2*insetY};
  assert.equal(metrics.height,height,screen.screenId);assert.ok(viewport.width>0&&viewport.height>0,screen.screenId);
  assert.ok(Math.abs(viewport.width/viewport.height-device.asset.width/device.asset.height)<1e-12,`${screen.screenId}: image must neither stretch nor crop`);
  assert.equal(viewport.height+2*insetY,800,`${screen.screenId}: shell contains only the image viewport`);
  const noControls=v5DeviceMetrics({...device,actions:screen.actions.filter(a=>a.placement==='hotspot')});
  assert.equal(metrics.width,noControls.width,`${screen.screenId}: external buttons must not resize the image`);
 }
});

test('asset aspect alone, never controls or semantic phone/PC kind, determines width',()=>{
 const phone=deviceFor('blogger.channel.chats'),wide=deviceFor('business.platform.login');
 const sameKindA=v5DeviceMetrics({...phone,kind:'phone',actions:[]}),sameKindB=v5DeviceMetrics({...wide,kind:'phone',actions:[]});
 assert.notEqual(sameKindA.width,sameKindB.width);
 const a=v5DeviceMetrics({...wide,kind:'phone'}),b=v5DeviceMetrics({...wide,kind:'pc'});
 assert.equal(a.width,b.width);assert.equal(a.height,b.height);assert.equal(a.kind,'phone');assert.equal(b.kind,'pc');
 const one=v5DeviceMetrics({...wide,actions:[{placement:'below-screen'}]}),two=v5DeviceMetrics({...wide,actions:[{placement:'below-screen'},{placement:'below-screen'}]});
 assert.equal(two.width,one.width,'extra control rows live outside the shell');
});

test('splash and absent or invalid asset dimensions use the 392×800 fallback',()=>{
 assert.deepEqual(v5DeviceMetrics(),{kind:'phone',width:392,height:800});
 for(const asset of [undefined,{}, {width:0,height:100},{width:100,height:0},{width:-1,height:100},{width:100,height:-1},{width:NaN,height:100},{width:100,height:Infinity},{width:'100',height:200}]){
  for(const kind of ['phone','pc'])assert.deepEqual(v5DeviceMetrics({kind,asset,actions:[{placement:'below-screen'}]}),{kind,width:392,height:800});
 }
});

for(const hz of [30,60,120])test(`real-asset phone/PC morph ${hz}Hz: invisible resize, fixed height, readiness, reverse`,()=>{
 const phone=v5DeviceMetrics(deviceFor('blogger.channel.chats')),pc=v5DeviceMetrics(deviceFor('business.platform.login'));
 assert.equal(phone.height,pc.height);assert.ok(pc.width>phone.width*2);
 const m=new V5DeviceMorph();let width=phone.width,ready=false,commits=0;
 for(const target of [pc,phone]){
  const start=width,direction=Math.sign(target.width-start);let previous=width,changed=0;
  const options={from:width,to:target.width,resize:w=>{assert.equal(m.value,0);assert.ok((w-previous)*direction>=0);assert.ok(Math.abs(w-previous)<Math.abs(target.width-start)*.15*30/hz,'no frame may consume more than 15% of the real width span at 30Hz');if(w!==previous)changed++;width=previous=w;},ready:()=>ready};
  assert.equal(m.start(()=>{commits++;assert.equal(width,target.width);assert.equal(m.value,0);},false,options),true);
  assert.equal(m.start(assert.fail),false);
  for(let i=0;i<hz*5&&m.phase!=='ready';i++)m.tick(1/hz);
  assert.equal(m.phase,'ready');assert.equal(width,target.width);assert.ok(changed>5);
  for(let i=0;i<hz;i++)m.tick(1/hz);assert.equal(m.value,0);
  const frozen=m.width.value;m.tick(0);assert.equal(m.width.value,frozen);
  ready=true;for(let i=0;i<hz*3&&m.busy;i++)m.tick(1/hz);
  assert.equal(m.busy,false);assert.equal(m.value,1);ready=false;
 }
 assert.equal(commits,2);
});

test('cancel removes stale commit; reduced motion still waits for prepared content',()=>{
 let commits=0,ready=false;const m=new V5DeviceMorph();
 m.start(()=>commits++,false,{from:392,to:983});m.tick(.02);m.cancel();for(let i=0;i<100;i++)m.tick(.05);assert.equal(commits,0);
 m.start(()=>commits++,true,{from:392,to:983,ready:()=>ready});m.tick(.01);m.tick(.01);m.tick(.01);
 assert.equal(commits,1);assert.equal(m.phase,'ready');assert.equal(m.value,0);
 ready=true;m.tick(.01);m.tick(.01);assert.equal(m.value,1);assert.equal(m.busy,false);
});

test('real business backend sequences task handoffs and retains within-task format directions',async()=>{
 let now=1000,c;const app=createApp({persistence:createMemoryPersistencePort(),now:()=>now});
 const session=createWebGLSession({catalog,port:app,sessionId:'device-morph-test',onSnapshot:s=>c?.accept(s),onError:assert.fail});
 await session.start();c=new V5RevealJourney(sharedRevealContent(catalog),session);
 c.configure(1760,1024,256);await session.command('SELECT_MISSION',{missionId:'business'});
 await session.contact('hand','down',true);now+=800;await session.contact('hand','up',true);
 const tick=()=>{for(let i=0;i<10;i++)c.tick(.1,{settled:true,deviceHidden:true,deviceReady:true,deviceShown:true,reduced:true});};
 let handoffs=0;const formats=new Set();let oldKind;
 for(let count=0;count<150&&session.snapshot.state.status!=='completed';count++){
  tick();const s=session.snapshot.state,kind=c.targetPhoneMetrics.kind;
  if(oldKind&&oldKind!==kind)formats.add(`${oldKind}>${kind}`);oldKind=kind;
  c.presentedDevice={...c.targetPhoneMetrics};assert.equal(c.phoneMetrics.height,800);
  if(s.status==='result'){
   const task=s.taskId;now+=1000;await app.pollTime('device-morph-test');
   if(session.snapshot.state.status==='task'&&session.snapshot.state.taskId!==task){handoffs++;assert.equal(c.phoneVisible,true);assert.equal(c.phase,'phone-exit');assert.equal(c.handoff.stage,'unlink');assert.equal(c.activeId,task);assert.equal(c.session.task,null);}
   continue;
  }
  const screen=catalog.tasks[s.taskId].screens[s.screenId];
  if(screen.automaticMs!==null){now+=screen.automaticMs+100;await app.pollTime('device-morph-test');continue;}
  assert.equal(c.answer(session.snapshot.view.actions[0].actionId),true);await flush();
 }
 assert.equal(session.snapshot.state.status,'completed');assert.ok(handoffs>=2);
 assert.ok(formats.has('pc>phone'));assert.ok(formats.has('phone>pc'));
 await session.close();await app.close();
});
