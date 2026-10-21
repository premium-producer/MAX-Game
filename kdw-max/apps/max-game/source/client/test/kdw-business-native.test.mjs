import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {assertMissionCatalog} from '../src/contracts/mission-catalog.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {businessScreenMarkup} from '../src/kdw-business-native.mjs';
import {BUSINESS_NATIVE_SCREENS,BUSINESS_UI_ASSETS} from '../src/kdw-business-native-model.mjs';
import {CURRENT_BUSINESSES,businessProfile} from '../src/kdw-business-profile.mjs';
import {postBank,postsGoal} from '../src/kdw-posts-model.mjs';
import {storeBank} from '../src/kdw-store-rating.mjs';
import {businessSourceLayout} from '../src/kdw-business-source-ui.mjs';
import {createHash} from 'node:crypto';
const base=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))),catalog=createKdwCatalog(base);
test('every authored business position uses native components or an existing native activity; actions retain identity',()=>{
 assertMissionCatalog(catalog);assert.equal(Object.keys(BUSINESS_NATIVE_SCREENS).length,17);
 for(const [id,kind] of Object.entries(BUSINESS_NATIVE_SCREENS)){
  const task=id.split('.').slice(0,2).join('.'),s=catalog.tasks[task].screens[id],a=catalog.assets[s.assetId];
  assert.equal(a.assetId,businessSourceLayout(id)?.canvas??'kdw.business-ui.'+kind);assert.equal(a.mimeType,'image/svg+xml');
  const blank=fs.readFileSync(new URL('../public/'+a.path,import.meta.url),'utf8');assert.ok(!/<image|<path|<text/.test(blank));
  if(base.tasks[task].screens[id])assert.deepEqual(s.actions.map(a=>[a.actionId,a.outcome]),base.tasks[task].screens[id].actions.map(a=>[a.actionId,a.outcome]));
 }
 assert.equal(catalog.tasks['business.channel'].screens['business.channel.result'].assetId,'kdw.posts.phone');
 assert.ok(Object.values(catalog.tasks['business.store'].screens).every(s=>s.assetId==='kdw.native.store-phone'));
});
test('all three profiles bind only business data over the original client components',()=>{
 for(const type of CURRENT_BUSINESSES){const p=businessProfile(type);
  for(const id of Object.keys(BUSINESS_NATIVE_SCREENS)){
   const taskId=id.split('.').slice(0,2).join('.'),screen=catalog.tasks[taskId].screens[id];
   const html=businessScreenMarkup({state:{taskId,screenId:id,progress:{business:{answers:{businessType:type}}}},view:{actions:screen.actions}});
   assert.ok(!/figma-|screen_\d|Сатурн|М-Банк|915 123/.test(html));
   if(id==='business.platform.business-type')assert.equal((html.match(/bn-choice-card/g)??[]).length,3);
   if(['business.channel.type','business.bot.filled','business.bot.result'].includes(id))assert.ok(html.includes(p.name));
   if(id==='business.bot.result')assert.ok(html.includes(p.order));
   if(id==='business.channel.setup')assert.ok(html.includes('+7 912 000-00-00'));
   if(id!=='business.platform.business-type'){assert.ok(html.includes('data-bn-source='));assert.ok(!/bn-brand|bn-icon|bn-nav/.test(html));}
  }
  const posts=postBank(type),goods=storeBank(type);assert.equal(posts.length,8);assert.equal(posts.filter(p=>p.good).length,5);assert.equal(goods.filter(p=>p.good).length,4);assert.equal(goods.filter(p=>!p.good).length,2);
 }
 assert.equal(businessProfile('hotel').name,'Отель');assert.equal(businessProfile('theater').name,'Театр');
 for(const a of Object.values(BUSINESS_UI_ASSETS)){const bytes=fs.readFileSync(new URL('../public/'+a.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,a.path);}
});

test('immutable SVG geometry and source provenance are retained, including the original bank tile',()=>{
 for(const id of Object.keys(BUSINESS_NATIVE_SCREENS).filter(id=>businessSourceLayout(id))){const l=businessSourceLayout(id);assert.equal(l.components.length,3);for(const c of l.components){const a=BUSINESS_UI_ASSETS[c.assetId],svg=fs.readFileSync(new URL('../public/'+a.path,import.meta.url),'utf8');assert.ok(svg.includes('<path'));assert.ok(a.origin.file===l.source);assert.ok(a.origin.sha256);assert.ok(!svg.includes('<text'));}}
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
