const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {DEFAULTS,validate,createLayoutSettings}=require('../../apps/STARTUP/tools/layout-settings.cjs');

test('falling-card controls are independent from phone scale, scoped and strictly bounded',()=>{
 const p=structuredClone(DEFAULTS);p.game.relative={cardsScale:1.2,fallingCardScale:2.2,fallingSpawnRight:600};p.screens['business.store.start']={relative:{fallingCardScale:1.5,fallingSpawnRight:900}};
 assert.deepEqual(validate(p),p);
 for(const [key,value]of [['fallingCardScale',0],['fallingCardScale',3.1],['fallingSpawnRight',-1],['fallingSpawnRight',1601],['fallingCardScale',NaN],['fallingSpawnRight','600']]){const bad=structuredClone(p);bad.game.relative[key]=value;assert.throws(()=>validate(bad));}
 assert.deepEqual(validate(structuredClone(DEFAULTS)),DEFAULTS);
});
test('layout profile: strict bounds, inheritance input, invalid IDs and unknown fields',()=>{
 const p=structuredClone(DEFAULTS);p.devices.phone={device:{x:120,y:-70,scale:.8}};p.screens['business.platform.start']={reference:{x:0,y:50,scale:1.2}};assert.deepEqual(validate(p),p);
 for(const mutate of [p=>p.game.device.scale=NaN,p=>p.game.device.scale=0,p=>p.game.device.x=4000,p=>p.devices.tv={},p=>p.screens['../../secret']={},p=>p.game.device.color='red',p=>p.schemaVersion=2]){const p=structuredClone(DEFAULTS);mutate(p);assert.throws(()=>validate(p));}
});
test('named profiles migrate legacy settings; live SSE is transient; switch discards draft and survives restart',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'max-profiles-'));fs.mkdirSync(path.join(root,'data'));const legacy=structuredClone(DEFAULTS);legacy.game.device.x=32;delete legacy.keyboard;fs.writeFileSync(path.join(root,'data/layout.local.json'),JSON.stringify(legacy));let service;
 const server=http.createServer((req,res)=>{if(!service.handle(req,res)){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;service=createLayoutSettings({root,origin});
 const owner='profiles-editor-12345';async function api(action,data){const r=await fetch(origin+'/__kdw/layout/'+action,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({...data,owner})});return{status:r.status,value:await r.json()};}let reader;
 try{let s=service.state();assert.equal(s.activeProfileId,'default');assert.equal(s.value.game.device.x,32);assert.equal(fs.existsSync(path.join(root,'data/layout-profiles.local.json')),false);
  const v=structuredClone(DEFAULTS);v.game.device.x=80;v.keyboard={x:120,y:-80,width:.8,height:1.3};s=(await api('profiles/create',{name:'Второй',value:v,revision:s.profilesRevision})).value;const second=s.activeProfileId;
  const stream=await fetch(origin+'/__kdw/layout/events');reader=stream.body.getReader();assert.match(new TextDecoder().decode((await reader.read()).value),/Второй/);
  const draft=structuredClone(v);draft.game.device.x=500;draft.keyboard.width=1.2;await api('preview',{profileId:second,value:draft,revision:s.revision});const event=new TextDecoder().decode((await reader.read()).value);assert.match(event,/"x":500/);assert.equal(service.state().value.game.device.x,80);assert.equal(service.state().effective.keyboard.width,1.2);assert.equal(service.state().value.keyboard.width,.8);
  s=(await api('profiles/switch',{id:'default',revision:s.profilesRevision})).value;assert.equal(s.effective.game.device.x,32);assert.equal(s.preview,null);
  s=(await api('profiles/save',{id:'default',name:'Основной сохранённый',value:{...legacy,game:{...legacy.game,device:{x:77,y:0,scale:1}}},revision:s.profilesRevision})).value;
  s=(await api('profiles/switch',{id:second,revision:s.profilesRevision})).value;assert.equal(s.effective.game.device.x,80);assert.deepEqual(s.effective.keyboard,v.keyboard);assert.equal((await api('preview',{profileId:'default',value:draft,revision:s.revision})).status,409);
  s=(await api('profiles/switch',{id:'default',revision:s.profilesRevision})).value;service=createLayoutSettings({root,origin});assert.equal(service.state().activeProfileId,'default');assert.equal(service.state().effective.game.device.x,77);assert.equal(service.state().profiles.length,2);
 }finally{await reader?.cancel();server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
});
test('HTTP: draft lease rollback, CAS, edit guard, independent preview session, restart persistence and hostile Origin',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'max-layout-'));let service,blocked=false;const server=http.createServer((req,res)=>{if(!service.handle(req,res)){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 service=createLayoutSettings({root,origin,canEdit(){if(blocked)throw Object.assign(Error('busy'),{status:409});}});
 async function api(action,value,headers={}){const r=await fetch(origin+'/__kdw/layout/'+action,value===undefined?{}:{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(value)});return{status:r.status,value:await r.json()};}
 try{let state=(await api('state')).value;assert.deepEqual(state.value,DEFAULTS);assert.equal(fs.existsSync(path.join(root,'data/layout.local.json')),false);
  const p=structuredClone(DEFAULTS);p.standby.video.scale=.75;const data={owner:'editor-123456789012',value:p,revision:state.revision};
  assert.equal((await api('preview',data,{Origin:'https://evil.test'})).status,403);assert.equal((await api('save')).status,403);
  blocked=true;assert.equal((await api('save',data)).status,409);const session=await api('session',{});assert.equal(session.status,200);const token=new URL(session.value.url,origin).searchParams.get('layout-preview');assert.equal((await api('preview-settings?token='+token)).status,200);assert.equal((await api('preview-settings?token=invalid')).status,403);blocked=false;
  assert.equal((await api('preview',data)).status,200);state=(await api('state')).value;assert.equal(state.effective.standby.video.scale,.75);assert.equal(state.value.standby.video.scale,1);assert.equal((await api('preview',{...data,owner:'editor-999999999999'})).status,409);
  assert.equal((await api('cancel',{owner:'editor-999999999999'})).value.preview.owner,data.owner);
  await api('cancel',{owner:data.owner});assert.equal((await api('state')).value.effective.standby.video.scale,1);
  await api('preview',data);const now=Date.now;try{Date.now=()=>now()+16000;assert.equal(service.state().effective.standby.video.scale,1);assert.equal(service.state().preview,null);}finally{Date.now=now;}
  assert.equal((await api('save',data)).status,200);assert.equal((await api('save',data)).status,409);service=createLayoutSettings({root,origin});state=(await api('state')).value;assert.equal(state.value.standby.video.scale,.75);assert.equal(state.preview,null);
  const p2=structuredClone(p);p2.game.reference.y=80;await api('save',{...data,value:p2,revision:state.revision});assert.equal(JSON.parse(fs.readFileSync(path.join(root,'data/layout.local.json.backup'))).standby.video.scale,.75);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
});


test('relative composition is additive, bounded and merges with existing saved profiles',()=>{
 const old=structuredClone(DEFAULTS);assert.deepEqual(validate(old),old);
 const p=structuredClone(old);p.game.relative={deviceScale:1.4,centered:true,centerX:-10,centerY:5,iconWidth:24,referenceWidth:85,iconGap:12,iconsDeviceGap:15,deviceReferenceGap:18,buttonGap:7};p.devices.phone={relative:{deviceScale:.9}};p.screens['communication.call.result']={relative:{iconGap:20}};assert.deepEqual(validate(p),p);
 for(const bad of [{deviceScale:0},{iconGap:-1},{centered:'yes'},{referenceWidth:301},{centerY:Infinity},{x:20},{iconWidth:'30'}]){const p=structuredClone(old);p.game.relative=bad;assert.throws(()=>validate(p));}
});


test('independent computer/card multipliers accept 10–200 percent and reject out-of-range input',()=>{
 for(const scale of [.1,.5,1,1.2,2]){const p=structuredClone(DEFAULTS);p.game.relative={pcScale:scale,cardsScale:2.1-scale};assert.deepEqual(validate(p),p);}
 for(const bad of [.099,2.001,NaN,'100'])for(const key of ['pcScale','cardsScale']){const p=structuredClone(DEFAULTS);p.game.relative={[key]:bad};assert.throws(()=>validate(p));}
});

test('keyboard layout accepts legacy omission and strictly bounds all four controls',()=>{
 const old=structuredClone(DEFAULTS);delete old.keyboard;assert.deepEqual(validate(old),old);
 const p={...old,keyboard:{x:200,y:-100,width:.7,height:1.5}};assert.deepEqual(validate(p),p);
 for(const [key,v]of [['x',1537],['y',-769],['width',.49],['height',2.01],['width',NaN],['y','30'],['unknown',1]])assert.throws(()=>validate({...p,keyboard:{...p.keyboard,[key]:v}}));
});
