import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {assertMissionCatalog} from '../src/contracts/mission-catalog.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {businessProfile} from '../src/kdw-business-profile.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url)));
const classic=createKdwCatalog(base,{businessScreens:'original'}),custom=createKdwCatalog(base);
test('original cafe iteration uses archived PNGs and correctly scales original hotspots',()=>{
 assertMissionCatalog(classic);assert.notEqual(classic.contentRevision,custom.contentRevision);
 assert.equal(classic.kdwBusinessNative,false);assert.equal(classic.kdwBusinessChoice,undefined);
 assert.equal(classic.tasks['business.platform'].startScreenId,'business.platform.login');
 assert.equal(classic.tasks['business.platform'].screens['business.platform.business-type'],undefined);
 let count=0;
 for(const id of ['business.platform','business.channel','business.bot'])for(const s of Object.values(classic.tasks[id].screens)){
  if(s.screenId==='business.channel.result')continue;
  const a=classic.assets[s.assetId];assert.equal(a.mimeType,'image/png');
  const bytes=fs.readFileSync(new URL('../../../www/'+a.path,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);count++;
  const before=base.tasks[id].screens[s.screenId],original=base.assets[before.assetId];
  s.actions.forEach((action,i)=>{assert.deepEqual(action.outcome,before.actions[i].outcome);if(action.rect)action.rect.forEach((v,j)=>assert.ok(Math.abs(v/(j%2?a.height:a.width)-before.actions[i].rect[j]/(j%2?original.height:original.width))<1e-10));});
 }
 assert.equal(count,16);
 assert.equal(classic.tasks['business.store'].startScreenId,'business.store.start');
 for(const [id,screen]of Object.entries(classic.tasks['business.store'].screens))assert.deepEqual(screen,custom.tasks['business.store'].screens[id]);
 assert.equal(classic.tasks['business.store'].screens['business.store.settings'],undefined);
 for(const id of ['blogger.channel','communication.calls','digital-id.create'].filter(id=>classic.tasks[id]))assert.deepEqual(classic.tasks[id],custom.tasks[id]);
 assert.equal(classic.kdwPostsActivity,custom.kdwPostsActivity);assert.equal(classic.kdwStoreActivity,custom.kdwStoreActivity);
 assert.equal(custom.kdwBusinessNative,2);
});
test('original route enters cafe without selection, completes registration and replays after reload',()=>{
 let model=createMissionModel(classic,{sessionId:'original'}),serial=0,now=100000;
 const send=(type,fields={},internal=false)=>{const r=dispatchMissionCommand(classic,model,{schemaVersion:1,type,commandId:'original.'+(++serial),sessionId:'original',contentRevision:classic.contentRevision,expectedRevision:model.state.revision,...fields},{now:now++,internal});assert.equal(r.reply.ok,true,r.reply.code);model=r.model;};
 send('OWNER_CHANGED',{active:true},true);send('SELECT_MISSION',{missionId:'business'});send('HOLD_CONFIRMED',{},true);
 assert.equal(model.state.screenId,'business.platform.login');assert.equal(businessProfile(model.state).id,'cafe');
 for(const id of ['login','profile','verification','ready']){assert.equal(model.state.screenId,'business.platform.'+id);const s=classic.tasks['business.platform'].screens[model.state.screenId];send('ACT',{screenId:s.screenId,actionId:s.actions[0].actionId});}
 assert.equal(model.state.status,'result');now+=1000;send('ADVANCE_RESULT');assert.equal(model.state.screenId,'business.channel.create');
 assert.deepEqual(restoreMissionModel(classic,structuredClone(model)).model,model);
});
