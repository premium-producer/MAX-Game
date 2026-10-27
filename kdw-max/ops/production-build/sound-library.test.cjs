const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {createSoundLibrary}=require('../../apps/STARTUP/tools/sound-library.cjs');
const catalogs=require('../../apps/STARTUP/tools/sound-events.cjs');
const cache=path.resolve('.cache/sound-tests');fs.mkdirSync(cache,{recursive:true});
const wave=Buffer.alloc(48);wave.write('RIFF');wave.write('WAVE',8);
async function fixture(app){const root=fs.mkdtempSync(path.join(cache,app+'-'));const seed=path.join(root,app==='max'?'www/webgl-v5/audio':'www/stella/soundtrack');fs.mkdirSync(seed,{recursive:true});for(const e of catalogs[app])fs.writeFileSync(path.join(seed,e.file),wave);let library;const server=http.createServer((req,res)=>{if(!library.handle(req,res)){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;library=createSoundLibrary({root,origin,app});const request=async(action,data,headers={})=>{const r=await fetch(origin+'/__kdw/sound/'+action,data===undefined?{}:{method:'POST',headers:{origin,'Content-Type':'application/json',...headers},body:Buffer.isBuffer(data)?data:JSON.stringify(data)});return{status:r.status,value:await r.json()};};return{root,origin,library,request,close:async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));}};}
test('Independent applications, persistent event edits, CAS and no resetting operator files',async()=>{
 const a=await fixture('max'),b=await fixture('stela');try{const x=(await a.request('state')).value,y=(await b.request('state')).value;assert.equal(x.events.length,16);assert.equal(y.events.length,11);
 const value=structuredClone(x.value);value.masterVolume=.42;value.fadeInMs=500;value.fadeOutMs=750;value.events.click1={file:null,volume:.13};const saved=await a.request('settings',{revision:x.revision,value});assert.equal(saved.status,200);assert.equal((await a.request('settings',{revision:x.revision,value})).status,409);assert.deepEqual((await b.request('state')).value.value,y.value);
 const restart=createSoundLibrary({root:a.root,origin:a.origin,app:'max'});assert.equal(restart.state().value.masterVolume,.42);fs.unlinkSync(path.join(a.root,'data/audio/game_button_click_2.ogg'));createSoundLibrary({root:a.root,origin:a.origin,app:'max'});assert.equal(fs.existsSync(path.join(a.root,'data/audio/game_button_click_2.ogg')),false);assert(fs.existsSync(path.join(a.root,'data/sound-events.local.json.backup')));
 }finally{await a.close();await b.close();}
});
test('Uploads, audio range delivery, traversal/origin/content/volume rejection',async()=>{
 const f=await fixture('max');try{const audioHeaders={'Content-Type':'application/octet-stream'};
 assert.equal((await f.request('upload?name='+encodeURIComponent('Мой звук.wav'),wave,audioHeaders)).status,200);
 assert.equal((await f.request('upload?name='+encodeURIComponent('Мой звук.wav'),wave,audioHeaders)).status,409);
 assert.equal((await f.request('upload?name=../evil.wav',wave,audioHeaders)).status,400);
 assert.equal((await f.request('upload?name=bad.wav',Buffer.from('not audio'),audioHeaders)).status,400);
 assert.equal((await f.request('upload?name=evil.wav',wave,{...audioHeaders,origin:'http://evil.invalid'})).status,403);
 assert.equal(fs.readdirSync(f.library.folder).some(n=>n.startsWith('.upload-')),false);
 const s=(await f.request('state')).value,item=s.files.find(f=>f.name==='Мой звук.wav');const range=await fetch(f.origin+item.url,{headers:{range:'bytes=0-11'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,12);
 for(const [key,v]of [['masterVolume',2],['fadeInMs',-1],['fadeOutMs',10001]])assert.equal((await f.request('settings',{revision:s.revision,value:{...s.value,[key]:v}})).status,400);
 const value=structuredClone(s.value);value.events.click1.file='missing.wav';assert.equal((await f.request('settings',{revision:s.revision,value})).status,400);value.events.click1.file='Мой звук.wav';assert.equal((await f.request('settings',{revision:s.revision,value})).status,200);
 }finally{await f.close();}
});
