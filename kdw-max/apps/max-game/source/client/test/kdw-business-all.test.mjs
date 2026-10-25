import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {BUSINESS_ALL_ROUTE,businessAllLayout,BUSINESS_ALL_ASSETS} from '../src/kdw-business-all-model.mjs';
import {businessScreenMarkup} from '../src/kdw-business-all-ui.mjs';
import {postBank} from '../src/kdw-posts-model.mjs';
import {storeBank} from '../src/kdw-store-rating.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))),catalog={...createKdwCatalog(base),kdwDevelopment:true};
test('three branches traverse 1–20, retain their business, and replay after each accepted command',()=>{
 for(const sector of ['cafe','flowers','auto']){
  let m=createMissionModel(catalog,{sessionId:'all-'+sector}),serial=0,now=100000;const seen=[];
  const send=(type,fields={},internal=false)=>{const r=dispatchMissionCommand(catalog,m,{schemaVersion:1,type,commandId:'all.'+(++serial),sessionId:m.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:m.state.revision,...fields},{now:now++,internal});assert.equal(r.reply.ok,true,r.reply.code);m=r.model;assert.equal(restoreMissionModel(catalog,m).ok,true);};
  send('OWNER_CHANGED',{active:true},true);send('SELECT_MISSION',{missionId:'business'});send('HOLD_CONFIRMED',{},true);send('ACT',{screenId:m.state.screenId,actionId:'business.platform.choose-'+sector});
  for(let guard=0;guard<30;guard++){
   const s=m.state,id=s.screenId,screen=catalog.tasks[s.taskId]?.screens[id];assert.equal(s.progress.business.answers.businessType,sector);
   if(id==='business.channel.result'){seen.push(13);send('SKIP_TASK',{taskId:s.taskId});continue;}
   if(id==='business.store.start'){seen.push(20);send('START_STORE',{taskId:s.taskId,screenId:id});assert.equal(m.state.progress.business.storeActivity.businessType,sector);break;}
   seen.push(BUSINESS_ALL_ROUTE[id].number);
   if(s.status==='result'){now+=1000;send('ADVANCE_RESULT');continue;}
   send('ACT',{screenId:id,actionId:screen.actions[0].actionId});
   if(id==='business.bot.result'){now+=1000;send('ADVANCE_RESULT');}
  }
  assert.deepEqual(seen,Array.from({length:20},(_,i)=>i+1));
 }
});
test('SVG hotspots stay within source geometry; shared dashboard has distinct actions',()=>{
 for(const type of ['cafe','flowers','auto'])for(const id of Object.keys(BUSINESS_ALL_ROUTE)){
  const l=businessAllLayout(id,type),a=BUSINESS_ALL_ASSETS[l.assetId];assert.ok(a.origin.sha256);assert.ok(a.path.includes(l.common?'general':type));
  for(const [x,y,w,h]of l.actions)assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=l.width&&y+h<=l.height,id);
  const html=businessScreenMarkup({state:{screenId:id,progress:{business:{answers:{businessType:type}}}},view:{actions:[{actionId:'test.continue'}]}});assert.ok(html.includes(l.assetId));
 }
 const ids=['business.channel.create','business.bot.create','business.store.dashboard'].map(id=>businessAllLayout(id,'auto'));
 assert.equal(new Set(ids.map(l=>l.assetId)).size,1);assert.equal(new Set(ids.map(l=>JSON.stringify(l.actions))).size,3);
 assert.equal(businessAllLayout('business.channel.setup').number,8);assert.equal(businessAllLayout('business.channel.details').number,9);
});
test('auto has distinct educational content; legacy sports and café semantics remain',()=>{
 assert.equal(postBank('auto').filter(p=>p.good).length,5);assert.equal(storeBank('auto',6).find(p=>p.id==='auto-oil').good,true);
 assert.equal(storeBank('auto',6).find(p=>p.id==='coffee').good,false);assert.equal(storeBank('cafe',6).find(p=>p.id==='engine-oil').good,false);
 assert.ok(storeBank('sports').some(p=>p.id==='ball'));assert.notDeepEqual(postBank('auto'),postBank('cafe'));
});
