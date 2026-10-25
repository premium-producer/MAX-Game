import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {assertMissionCatalog} from '../src/contracts/mission-catalog.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {businessSourceMarkup as businessScreenMarkup} from '../src/kdw-business-source-ui.mjs';
import {businessAllLayout} from '../src/kdw-business-all-model.mjs';
import {BUSINESS_NATIVE_SCREENS,BUSINESS_UI_ASSETS,businessConfirmationLinkRect} from '../src/kdw-business-native-model.mjs';
import {CURRENT_BUSINESSES,businessProfile} from '../src/kdw-business-profile.mjs';
import {postBank,postsGoal} from '../src/kdw-posts-model.mjs';
import {storeBank} from '../src/kdw-store-rating.mjs';
import {businessSourceLayout} from '../src/kdw-business-source-ui.mjs';
import {createHash} from 'node:crypto';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))),catalog=createKdwCatalog(base);
test('every authored business position uses native components or an existing native activity; actions retain identity',()=>{
 assertMissionCatalog(catalog);assert.equal(Object.keys(BUSINESS_NATIVE_SCREENS).length,17);
 for(const [id,kind] of Object.entries(BUSINESS_NATIVE_SCREENS)){
  const task=id.split('.').slice(0,2).join('.'),s=catalog.tasks[task].screens[id],a=catalog.assets[s.assetId];
  assert.equal(a.assetId,(id==='business.platform.ready'?businessSourceLayout(id)?.canvas:businessAllLayout(id)?.canvas)??'kdw.business-ui.'+kind);assert.equal(a.mimeType,'image/svg+xml');
  const blank=fs.readFileSync(new URL('../public/'+a.path,import.meta.url),'utf8');assert.ok(!/<image|<path|<text/.test(blank));
  if(base.tasks[task].screens[id]&&id!=='business.platform.verification')assert.deepEqual(s.actions.map(a=>[a.actionId,a.outcome]),base.tasks[task].screens[id].actions.map(a=>[a.actionId,a.outcome]));
 }
 assert.equal(catalog.tasks['business.channel'].screens['business.channel.result'].assetId,'kdw.posts.phone');
 assert.ok(['start','publish','result'].every(id=>catalog.tasks['business.store'].screens['business.store.'+id].assetId==='kdw.native.store-phone'));
});
test('legacy component renderer retains dynamic business bindings and all resources keep their hashes',()=>{
 for(const type of CURRENT_BUSINESSES){const p=businessProfile(type);
  for(const id of Object.keys(BUSINESS_NATIVE_SCREENS)){
   const taskId=id.split('.').slice(0,2).join('.'),screen=catalog.tasks[taskId].screens[id];
   const html=businessScreenMarkup({state:{taskId,screenId:id,progress:{business:{answers:{businessType:type}}}},view:{actions:screen.actions}});
   assert.ok(!/figma-|screen_\d|Сатурн|М-Банк|915 123/.test(html));
   if(id==='business.platform.business-type')assert.equal((html.match(/bn-choice-card/g)??[]).length,3);
   if(['business.channel.type','business.bot.filled','business.bot.result'].includes(id))assert.ok(html.includes(p.name));
   if(id==='business.bot.result')assert.ok(html.includes(p.order));
   if(id==='business.channel.setup')assert.ok(!html.includes('+7 912 000-00-00')&&!html.includes('data-bn-binding="number"'));
   if(id!=='business.platform.business-type'){assert.ok(html.includes('data-bn-source='));assert.ok(!/bn-brand|bn-icon|bn-nav/.test(html));}
  }
  const posts=postBank(type,11),goods=storeBank(type,6);assert.equal(posts.length,8);assert.equal(posts.filter(p=>p.good).length,5);assert.equal(goods.filter(p=>p.good).length,4);assert.equal(goods.filter(p=>!p.good).length,2);
 }
 assert.equal(businessProfile('hotel').name,'Отель');assert.equal(businessProfile('theater').name,'Театр');
 for(const a of Object.values(BUSINESS_UI_ASSETS)){const bytes=fs.readFileSync(new URL('../public/'+a.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,a.path);}
});

test('immutable SVG geometry and source provenance are retained, including the original bank tile',()=>{
 for(const id of Object.keys(BUSINESS_NATIVE_SCREENS).filter(id=>businessSourceLayout(id))){const l=businessSourceLayout(id);assert.equal(l.components.length,id==='business.platform.ready'?1:3);for(const c of l.components){const a=BUSINESS_UI_ASSETS[c.assetId],svg=fs.readFileSync(new URL('../public/'+a.path,import.meta.url),'utf8');assert.ok(svg.includes('<path'));assert.ok(a.origin.file===l.source);assert.ok(a.origin.sha256);assert.ok(!svg.includes('<text'));}}
 const snack=BUSINESS_UI_ASSETS[businessSourceLayout('business.platform.ready').components[0].assetId];
 assert.deepEqual(fs.readFileSync(new URL('../public/'+snack.path,import.meta.url)),fs.readFileSync(new URL('../../../../../UI/new_screens/busines_no_sort/Snack Body.svg',import.meta.url)));
 const frame={x:100,y:200,w:447.5,h:279.5},port=businessConfirmationLinkRect(frame);
 assert.equal(port.x,frame.x);assert.equal(port.w,frame.w);assert.ok(Math.abs(port.y+port.h/2-frame.y-frame.h/2)<1e-10);assert.ok(Math.abs(port.h/port.w-78/455)<1e-12);
 assert.equal(businessSourceLayout('business.platform.ready').forward,false);
 const bank=businessSourceLayout('business.platform.verification').overlays[0];assert.equal(BUSINESS_UI_ASSETS[bank.assetId].origin.sha256,'98d2a4483c086caba7159b8497349f5d1b8c58f8aeebf511b842a380f0673274');
});
test('changing a new business resets downstream progress and replays the exact accepted history',()=>{
 const c={...catalog,kdwDevelopment:true};let m=createMissionModel(c,{sessionId:'native-test'}),serial=0,now=100000;
 const act=(type,extra={},internal=false)=>{const r=dispatchMissionCommand(c,m,{schemaVersion:1,type,commandId:'cmd.'+(++serial),sessionId:'native-test',contentRevision:c.contentRevision,expectedRevision:m.state.revision,...extra},{now:now++,internal});assert.equal(r.reply.ok,true,r.reply.code);m=r.model;};
 act('OWNER_CHANGED',{active:true},true);act('SELECT_MISSION',{missionId:'business'});act('HOLD_CONFIRMED',{},true);
 act('ACT',{screenId:m.state.screenId,actionId:'business.platform.choose-sports'});
 act('SKIP_TASK',{taskId:'business.platform'});act('SKIP_TASK',{taskId:'business.channel'});act('SKIP_TASK',{taskId:'business.bot'});
 act('RESTART_TASK',{taskId:'business.platform'});act('ACT',{screenId:m.state.screenId,actionId:'business.platform.choose-flowers'});
 assert.equal(m.state.progress.business.answers.businessType,'flowers');assert.deepEqual(m.state.progress.business.skipped,[]);assert.equal(restoreMissionModel(c,m).ok,true);
});
test('a presented channel with pending START_POSTS has no goal and never dereferences a missing activity',()=>{
 assert.equal(postsGoal(undefined),false);assert.equal(postsGoal(null),false);
});

test('standalone confirmation ends registration; both historical routes still replay',async()=>{
 assert.ok(catalog.tasks['business.platform'].screens['business.platform.ready']);
 assert.deepEqual(catalog.tasks['business.platform'].screens['business.platform.verification'].actions[0].outcome,{kind:'complete-task'});
 const old=structuredClone(catalog),legacy=catalog.kdwBusinessPlatformLegacy;old.kdwDevelopment=true;
 old.kdwBusinessConfirmation=null;
 Object.assign(old.tasks['business.platform'].screens,{'business.platform.verification':legacy.verification,'business.platform.ready':legacy.ready});
 const removed=structuredClone(catalog);removed.kdwBusinessConfirmation=null;delete removed.tasks['business.platform'].screens['business.platform.ready'];removed.tasks['business.platform'].screens['business.platform.verification'].actions[0].outcome={kind:'complete-task'};
 for(const [c,finalScreen] of [[catalog,'business.platform.ready'],[removed,'business.platform.verification'],[old,'business.platform.ready']]){
  let m=createMissionModel(c,{sessionId:'registration-final'}),serial=0,now=100000;
  const act=(type,extra={},internal=false)=>{const r=dispatchMissionCommand(c,m,{schemaVersion:1,type,commandId:'reg.'+(++serial),sessionId:m.state.sessionId,contentRevision:c.contentRevision,expectedRevision:m.state.revision,...extra},{now:now++,internal});assert.equal(r.reply.ok,true,r.reply.code);m=r.model;};
  act('OWNER_CHANGED',{active:true},true);act('SELECT_MISSION',{missionId:'business'});act('HOLD_CONFIRMED',{},true);
  for(let i=0;m.state.status==='task'&&i<10;i++){const screen=c.tasks[m.state.taskId].screens[m.state.screenId];act('ACT',{screenId:screen.screenId,actionId:screen.actions[0].actionId});}
  assert.equal(m.state.status,'result');assert.equal(m.state.screenId,finalScreen);assert.deepEqual(m.state.progress.business.completed,['business.platform']);
  assert.equal(restoreMissionModel(catalog,m).ok,true,'accepted registration history remains valid');
  if(c===catalog){
   const saved=m;
   act('ADVANCE_RESULT');assert.equal(m.state.taskId,'business.channel','click dismisses confirmation before the automatic deadline');assert.equal(restoreMissionModel(catalog,m).ok,true);m=saved;
  }
  now=m.state.resultReadyAt;act('ADVANCE_RESULT');assert.equal(m.state.taskId,'business.channel');assert.equal(m.state.screenId,'business.channel.create');
  assert.equal(restoreMissionModel(catalog,m).ok,true);
  if(c===old){
   const completed=m;
   act('RESTART_TASK',{taskId:'business.platform'});assert.equal(restoreMissionModel({...catalog,kdwDevelopment:true},m).ok,true,'replay registration restart after the removed screen');
   const persistence=createMemoryPersistencePort();await persistence.create(m.state.sessionId,{schemaVersion:2,mission:m,layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:now});
   for(let i=0;i<2;i++){const app=createMissionSessionApplication({catalog:{...catalog,kdwDevelopment:true},persistence,now:()=>now+10000+i});const snapshot=await app.getSnapshot(m.state.sessionId);assert.equal(snapshot.state.screenId,'business.platform.business-type');assert.equal(snapshot.state.progress.business.answers.businessType,'cafe');await app.close();}
   m=completed;c.kdwBusinessRestartRetainLegacy=true;delete c.tasks['business.platform'].screens['business.platform.ready'];act('RESTART_TASK',{taskId:'business.platform'});
   assert.ok(Object.hasOwn(m.state.progress.business.answers,'business.platform.ready'));
   assert.equal(restoreMissionModel({...catalog,kdwDevelopment:true},m).ok,true,'brief intermediate release also replays');
   const corrupt=structuredClone(m);corrupt.receipts.at(-1).reply.snapshot.runId+=5;assert.equal(restoreMissionModel({...catalog,kdwDevelopment:true},corrupt).ok,false,'corrupt history is not accepted');
  }
 }
});
