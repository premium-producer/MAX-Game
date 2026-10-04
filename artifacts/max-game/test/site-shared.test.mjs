import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createSiteSession,SITE_SHARED_KEY} from '../public/site-game/site-session.mjs';
import {createBrowserPersistence} from '../public/site-game/browser-persistence.mjs';
import {DescriptorView} from '../public/site-game/descriptor-view.mjs';

const store=()=>{const values=new Map([['max-site-game:v1','old-progress']]);return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
function fixture(storage=store(),id='site-cpu',initialTime=1000){
 let time=initialTime;const persistence=createBrowserPersistence({storage,key:SITE_SHARED_KEY});const app=createMissionSessionApplication({catalog:MISSION_CATALOG,persistence,now:()=>time});
 const errors=[],session=createSiteSession({catalog:MISSION_CATALOG,port:app,sessionId:id,onError:e=>errors.push(e)});
 return {storage,app,session,errors,advance:async delta=>{time+=delta;await app.pollTime(id);}};
}
async function scan(f,missionId){await f.session.command('SELECT_MISSION',{missionId});await f.session.contact('p1','down',true);await f.advance(800);assert.equal(f.session.snapshot.state.status,'task');}
async function channel(f,type){for(let count=0;count<20&&f.session.snapshot.state.status==='task';count++){
 const snap=f.session.snapshot;let action=snap.view.actions[0];
 if(snap.state.screenId.endsWith('.privacy'))action=snap.view.actions.find(a=>a.actionId===(type==='private'&&snap.state.progress.blogger.answers['channel-type']==='private'?'channel.continue-private':`channel.choose-${type}`));
 if(snap.state.screenId.endsWith('.public-confirm'))action=snap.view.actions.find(a=>a.actionId==='channel.use-new-link');
 assert.ok(action);const result=await f.session.act(snap.state.screenId,action.actionId,snap.state.revision);assert.equal(result.reply.ok,true);
 }assert.equal(f.session.snapshot.state.status,'result');}
for(const type of ['private','public'])test(`Site SessionPort: ${type} channel, following tasks and reload`,async()=>{
 const f=fixture();await f.session.start();await scan(f,'blogger');const initial=f.session.snapshot;
 const action=initial.view.actions[0];const [accepted,repeated]=await Promise.all([f.session.act(initial.state.screenId,action.actionId,initial.state.revision),f.session.act(initial.state.screenId,action.actionId,initial.state.revision)]);
 assert.equal(accepted.reply.ok,true);assert.equal(repeated,null);assert.equal(await f.session.act(initial.state.screenId,action.actionId,initial.state.revision),null);
 await channel(f,type);await f.advance(800);assert.equal(f.session.snapshot.state.taskId,'blogger.comments');
 for(let count=0;count<8&&f.session.snapshot.state.taskId==='blogger.comments';count++){
  const s=f.session.snapshot;if(s.state.status==='result'){await f.advance(800);continue;}if(!s.view.actions.length){await f.advance(1600);continue;}assert.equal((await f.session.act(s.state.screenId,s.view.actions[0].actionId,s.state.revision)).reply.ok,true);
 }
 assert.equal(f.session.snapshot.state.taskId,'blogger.statistics');assert.ok(f.session.snapshot.state.progress.blogger.completed.includes('blogger.channel'));
 await f.session.close();const next=fixture(f.storage,'site-cpu',100000);await next.session.start();assert.equal(next.session.snapshot.state.taskId,'blogger.statistics');assert.equal(next.session.snapshot.state.scanned,true);assert.equal(f.storage.getItem('max-site-game:v1'),'old-progress');await next.session.close();
});
test('Site local persistence rejects CAS conflict and does not reset corrupted data',async()=>{
 const storage=store(),port=createBrowserPersistence({storage,key:'explicit'});await port.create('s',{value:1});await port.commit('s',0,{value:2});await assert.rejects(port.commit('s',0,{value:3}),{code:'STORE_CONFLICT'});assert.deepEqual((await port.load('s')).record,{value:2});storage.setItem('explicit','broken');await assert.rejects(port.load('s'),SyntaxError);assert.equal(storage.getItem('explicit'),'broken');
});
test('Site short release is not a scan and future screen action is refused',async()=>{
 const f=fixture();await f.session.start();await f.session.command('SELECT_MISSION',{missionId:'digital-id'});await f.session.contact('p1','down',true);await f.advance(300);await f.session.contact('p1','cancel',false);await f.advance(1000);assert.equal(f.session.snapshot.state.status,'scan');assert.equal(await f.session.act('digital-id.create-id.documents','unknown'),null);await f.session.close();
});
test('Site clock polling unwraps the SessionPort result envelope',async()=>{
 const f=fixture();await f.session.start();await f.session.command('SELECT_MISSION',{missionId:'blogger'});await f.session.contact('p','down',true);
 await f.session.poll(1000);assert.equal(f.session.snapshot.state.status,'scan');assert.deepEqual(f.errors,[]);
 await f.advance(800);await f.session.poll(1800);assert.equal(f.session.snapshot.state.status,'task');assert.deepEqual(f.errors,[]);await f.session.close();
});
test('Site persistence refuses malformed JSON records without replacing them',async()=>{
 for(const raw of ['[]','null','"text"','{"s":{"version":"0","record":{}}}','{"s":{"version":0,"record":[]}}']){const storage=store();storage.setItem('explicit',raw);const port=createBrowserPersistence({storage,key:'explicit'});await assert.rejects(port.load('s'),{code:'INVALID_SAVED_SESSION'});await assert.rejects(port.create('s',{}),{code:'INVALID_SAVED_SESSION'});assert.equal(storage.getItem('explicit'),raw);}
 const storage=store(),port=createBrowserPersistence({storage,key:'explicit'});assert.equal(await port.load('constructor'),null);await port.create('constructor',{value:1});assert.equal((await port.load('constructor')).record.value,1);
});
test('Site entry delegates all gameplay and storage to ports; uses one existing RAF',async()=>{
 const text=await fs.readFile(new URL('../public/site-game/app.mjs',import.meta.url),'utf8');assert.doesNotMatch(text,/ChannelTransition|applyReviewAction|completeChannel|localStorage\.(setItem|getItem|removeItem)/);assert.equal((text.match(/function tick\(/g)??[]).length,1);assert.match(text,/DescriptorView/);assert.match(text,/session\.contact/);assert.match(text,/session\.layout/);
});
test('Site reload during confirmed result progresses once, with no second credit',async()=>{
 const f=fixture();await f.session.start();await scan(f,'blogger');await channel(f,'private');await f.session.close();const next=fixture(f.storage,'site-cpu',100000);await next.session.start();assert.equal(next.session.snapshot.state.status,'result');await next.advance(800);assert.equal(next.session.snapshot.state.taskId,'blogger.comments');assert.deepEqual(next.session.snapshot.state.progress.blogger.completed,['blogger.channel']);await next.session.close();
});
class Element{
 constructor(){this.children=[];this.style={setProperty(){}};this.className='';this.isConnected=true;this.classList={toggle:()=>{},remove:name=>{this.className=this.className.replace(name,'').trim();}};}
 append(...elements){for(const element of elements){element.parent=this;this.children.push(element);}}
 replaceChildren(...elements){this.children=[];this.append(...elements);}
 remove(){this.parent.children=this.parent.children.filter(e=>e!==this);}
 querySelector(selector){return this.children.find(e=>selector.includes(':not')?!e.className.includes('incoming'):e.className.includes('incoming'))??null;}
 setAttribute(){}
}
function device(){const maps=Object.fromEntries(['.review-screen','.channel-images','.channel-targets','.channel-load','.channel-action'].map(key=>[key,new Element()]));const value=new Element();value.querySelector=key=>maps[key];return {value,maps};}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
const descriptor=()=>({device:{kind:'phone',asset:null,annotations:[]},instruction:null,actions:[],prepareNext:[],missing:'Нет кадра'});
test('Site crossfade coalesces rapid descriptors and retains at most two frames',async()=>{
 const saved=globalThis.document;globalThis.document={createElement:()=>new Element()};try{const {value,maps}=device(),aside=new Element();const view=new DescriptorView(value,aside,descriptor(),{screenId:'first',onAction:()=>{},onNotice:()=>{},reduced:()=>false});await flush();assert.equal(maps['.channel-images'].children.length,1);view.update(descriptor(),'second');await flush();view.tick(.35);const opacity=maps['.channel-images'].children[0].style.opacity;view.update(descriptor(),'third');view.update(descriptor(),'fourth');assert.equal(maps['.channel-images'].children[0].style.opacity,opacity);assert.equal(maps['.channel-images'].children.length,2);view.tick(.35);await flush();assert.equal(view.screenId,'fourth');assert.equal(maps['.channel-images'].children.length,2);view.tick(.7);assert.equal(maps['.channel-images'].children.length,1);assert.equal(view.busy,false);assert.equal(aside.hidden,true);view.dispose();}finally{globalThis.document=saved;}
});
test('Site disposed view never mounts a late decoded image',async()=>{
 const savedDocument=globalThis.document,savedImage=globalThis.Image,images=[];globalThis.document={createElement:()=>new Element()};globalThis.Image=class{constructor(){images.push(this);}decode(){return Promise.resolve();}};
 try{const {value,maps}=device();const desc=descriptor();desc.missing=null;desc.device.asset={path:'late-test.png',width:360,height:800};const view=new DescriptorView(value,new Element(),desc,{screenId:'first',onAction:()=>{},onNotice:()=>{},reduced:()=>false});view.dispose();images[0].onload();await flush();await flush();assert.equal(maps['.channel-images'].children.length,0);}finally{globalThis.document=savedDocument;globalThis.Image=savedImage;}
});
test('Site image deadline offers retry and rejects a late frame',async()=>{
 const savedDocument=globalThis.document,savedImage=globalThis.Image,images=[];globalThis.document={createElement:()=>new Element()};globalThis.Image=class{constructor(){images.push(this);}decode(){return Promise.resolve();}};
 try{const {value,maps}=device(),desc=descriptor();desc.missing=null;desc.device.asset={path:'timeout-test.png',width:360,height:800};const view=new DescriptorView(value,new Element(),desc,{screenId:'first',onAction:()=>{},onNotice:()=>{},reduced:()=>false});view.tick(12);assert.equal(view.error,true);assert.equal(maps['.channel-load'].children[1].textContent,'Повторить');images[0].onload();await flush();await flush();assert.equal(maps['.channel-images'].children.length,0);maps['.channel-load'].children[1].onclick();assert.equal(images.length,2);view.dispose();}finally{globalThis.document=savedDocument;globalThis.Image=savedImage;}
});
test('Site unavailable client frame shows its gap without loading a rejected original',async()=>{
 const savedDocument=globalThis.document,savedImage=globalThis.Image;let requests=0;globalThis.document={createElement:()=>new Element()};globalThis.Image=class{constructor(){requests++;}};
 try{const {value,maps}=device(),desc=descriptor();desc.device.asset={path:'client-rejected.png',width:360,height:800};const view=new DescriptorView(value,new Element(),desc,{screenId:'first',onAction:()=>{},onNotice:()=>{},reduced:()=>false});await flush();assert.equal(requests,0);assert.equal(maps['.channel-images'].children.length,1);assert.equal(maps['.channel-images'].children[0].children[0].textContent,'Нет кадра');assert.equal(view.busy,false);view.dispose();}finally{globalThis.document=savedDocument;globalThis.Image=savedImage;}
});
