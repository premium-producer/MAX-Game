import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {clientContent,CLIENT_TASKS} from '../src/journey-client.mjs';
import {taskMedia,mediaFrames,missionCoverage,coverageMarkup,taskMediaMarkup,turnMediaPage,taskDevice,preloadTaskMedia} from '../src/journey-media.mjs';
import {clientTaskMarkup} from '../src/journey-client-ui.mjs';
import {idTaskMarkup} from '../src/journey-id-ui.mjs';
import {ID_TASKS,ID_FLOW_VERSION} from '../src/journey-id.mjs';
import {MEDIA_ASSETS} from '../src/journey-media-assets.mjs';
const original=JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url)));
const content=clientContent(original);

test('ID stories contain exactly two scenes and two actions: next then ID',()=>{
 for(const [step,mission]of [['hotel','digital-id'],['benefit','digital-id'],['age','digital-id'],['demo-benefit','demo-benefit']]){
  assert.equal(CLIENT_TASKS[step].length,2);assert.deepEqual(CLIENT_TASKS[step][0].options,['Далее']);assert.match(CLIENT_TASKS[step][1].options[0],/через ID/);
  for(let stage=0;stage<2;stage++){
   const o={step,stage,answers:[],done:false},s={mission,task:step,runs:{[mission]:[o]}};
   assert.equal(taskMedia(o).ids.length,1);const html=clientTaskMarkup(s,content,{deviceAware:true});
   assert.doesNotMatch(html,/data-media-page/);assert.equal((html.match(/data-answer=/g)||[]).length,1);
   assert.match(html,new RegExp(stage===0?'01-arrival':'02-present-id'));
  }
 }
});
test('reference cards are informational at every client stage, including final native ID',()=>{
 for(const m of content.missions)for(const step of [...m.steps,...(m.branches||[]).map(b=>b.step)])for(let stage=0;stage<CLIENT_TASKS[step.id].length;stage++){
  const o={step:step.id,stage,answers:[0],done:false,idFlowVersion:ID_FLOW_VERSION},s={mission:m.id,task:o.step,runs:{[m.id]:[o]}};
  const html=clientTaskMarkup(s,content,{deviceAware:true}),info=html.split('<div class="instruction-copy"')[1].split('<span class="task-icon')[0];
  assert.doesNotMatch(info,/<button|data-answer|data-branch|data-page/,`${m.id}/${o.step}/${stage}`);
  if(!CLIENT_TASKS[step.id][stage].autoMs)assert.match(html.split('<div class="demo-app')[1],/data-answer=/,`${o.step}/${stage}`);
 }
 const final=idTaskMarkup({}, {step:'create-id',stage:ID_TASKS.length-1,done:false});assert.match(final,/<button class="pill id-final-action" data-answer="0"/);
});
test('Guided Reveal shows only task actions, including real choices, without gallery controls across six missions',()=>{
 for(const mission of content.missions)for(const step of [...mission.steps,...(mission.branches||[]).map(b=>b.step)])for(let stage=0;stage<CLIENT_TASKS[step.id].length;stage++){
  const o={step:step.id,stage,answers:[0],done:false,idFlowVersion:ID_FLOW_VERSION};
  const s={mission:mission.id,task:o.step,runs:{[mission.id]:[o]}};
  const html=clientTaskMarkup(s,content,{deviceAware:true,guidedReveal:true});
  assert.doesNotMatch(html,/media-navigation|media-counter|app-progress/,`${mission.id}/${o.step}/${stage}`);
  if(o.step==='channel'&&stage===0){
   assert.match(html,/class="media-hotspot channel-plus" data-media-page="1"/);
   assert.match(html,/class="media-hotspot channel-create" data-answer="0"/);
   assert.doesNotMatch(html,/class="client-actions"/);
  }else if(!['create-id','demo-id'].includes(o.step)){
   const choices=CLIENT_TASKS[o.step][stage].options.length;
   assert.equal((html.match(/data-answer=/g)||[]).length,choices,`${mission.id}/${o.step}/${stage}`);
   assert.match(html,/class="client-actions"/);
  }
 }
 assert.doesNotMatch(idTaskMarkup({}, {step:'create-id',stage:0,done:false},{guidedReveal:true}),/1 \/ 9/);
 assert.match(taskMediaMarkup({step:'channel',stage:0},{guidedReveal:false}),/media-navigation/,'older editions retain their gallery');
});
test('landscape client frames select a PC; portrait stories and native ID stay phones',()=>{
 for(const step of ['account','business-channel','business-bot','business-store','demo-account','demo-tool','business-tool'])assert.equal(taskDevice({step,stage:0}).kind,'pc',step);
 for(const step of ['hotel','benefit','age','create-id','channel','call'])assert.equal(taskDevice({step,stage:0}).kind,'phone',step);
 const o={step:'account',stage:0,answers:[]},s={mission:'business',task:'account',runs:{business:[o]}};
 assert.match(clientTaskMarkup(s,content,{deviceAware:true}),/data-device="pc"/);assert.match(clientTaskMarkup(s,content),/data-device="phone"/);
});

test('six mission badges cover every stage and business/format alternative',()=>{
 const complete=['blogger','digital-id','demo-benefit'];
 for(const m of content.missions){
  assert.equal(missionCoverage(m).complete,complete.includes(m.id),m.id);
  assert.match(coverageMarkup(m),complete.includes(m.id)?/Без заглушек/:/Есть заглушки/);
 }
 assert.ok(missionCoverage(content.missions.find(m=>m.id==='business')).missing.some(r=>r.includes('витрины')));
 for(const [step,tasks] of Object.entries(CLIENT_TASKS))for(let stage=0;stage<tasks.length;stage++)for(const choice of [0,1,2]){
  const media=taskMedia({step,stage,answers:[choice]});
  assert.ok(media.nativeId||media.missing||mediaFrames(media).length,`${step}:${stage}:${choice}`);
  assert.equal(mediaFrames(media).length,media.ids.length,`missing file ${step}:${stage}`);
 }
});

test('both narrative stills lead each ID scenario; results retain second still',()=>{
 for(const [step,name] of [['hotel','hotel'],['benefit','museum'],['age','age']]){
  assert.match(taskMedia({step,stage:0}).ids[0],new RegExp(`${name}-01-arrival`));
  assert.match(taskMedia({step,stage:1}).ids[0],new RegExp(`${name}-02-present-id`));
  assert.deepEqual(taskMedia({step,stage:2,done:true}),taskMedia({step,stage:1}));
 }
 assert.notDeepEqual(taskMedia({step:'message',stage:2,answers:[0]}).ids,taskMedia({step:'message',stage:2,answers:[1]}).ids);
 assert.match(taskMediaMarkup({step:'business-bot',stage:2}),/статус и изменение доставки/);
 assert.match(taskMediaMarkup({step:'business-bot',stage:2}),/Нет сцены принятия нового заказа/);
 assert.match(taskMediaMarkup({step:'group',stage:0}),/Заглушка:/);
});

test('every shipped frame preserves original pixels, hash, aspect and provenance',()=>{
 const records=JSON.parse(fs.readFileSync(new URL('../public/assets/client-media/sources.json',import.meta.url)));
 assert.equal(Object.keys(records).length,Object.keys(MEDIA_ASSETS).length);
 for(const [id,asset] of Object.entries(MEDIA_ASSETS)){
  const bytes=fs.readFileSync(new URL('../public/'+asset.src.slice(2),import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),records[id].sha256,id);
  assert.equal(bytes.readUInt32BE(16),asset.width,id);assert.equal(bytes.readUInt32BE(20),asset.height,id);
  assert.ok(records[id].source,id);
 }
 assert.ok(Object.values(MEDIA_ASSETS).some(a=>a.width>a.height));
 const renderer=fs.readFileSync(new URL('../src/journey-webgl-ui.mjs',import.meta.url),'utf8');
 assert.match(renderer,/Math\.min\(r\.w\/el\.naturalWidth,r\.h\/el\.naturalHeight\)/);
});

test('gallery decode cannot overwrite a closed or transitioning task',async()=>{
 const Original=globalThis.Image;let finish;
 globalThis.Image=class{decode(){return new Promise(resolve=>{finish=resolve;});}};
 const gallery={dataset:{mediaIds:'91504,91516',mediaIndex:'0'},isConnected:true,querySelector:()=>old};
 const old={},button={dataset:{mediaPage:'1'},closest:()=>gallery};
 let commits=0,busy=false;const foreground={busy:()=>busy,transitionContent:()=>{commits++;}};
 try{
  let request=turnMediaPage(button,foreground,{});
  assert.equal(await turnMediaPage(button,foreground,{}),false,'double click cannot start second decode');
  gallery.isConnected=false;finish();assert.equal(await request,false);assert.equal(commits,0);
  gallery.isConnected=true;request=turnMediaPage(button,foreground,{});busy=true;finish();
  assert.equal(await request,false);assert.equal(commits,0,'answer transition retains ownership');
  assert.equal(gallery.dataset.mediaIndex,'0');
 }finally{globalThis.Image=Original;}
});

test('blogger plus destination is decoded before the first interaction',async()=>{
 const Original=globalThis.Image,sources=[];
 globalThis.Image=class{set src(value){sources.push(value);}decode(){return Promise.resolve();}};
 try{
  await preloadTaskMedia();
  assert.ok(sources.includes(MEDIA_ASSETS[91504].src));
  assert.ok(sources.includes(MEDIA_ASSETS[91516].src),'the plus destination cannot load on click');
 }finally{globalThis.Image=Original;}
});
