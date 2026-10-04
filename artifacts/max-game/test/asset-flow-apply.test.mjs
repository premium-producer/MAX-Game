import {applyReviewedAssets} from '../scripts/apply-reviewed-assets.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MISSION_CATALOG as base} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../vendor/backend-figma-v2/src/core/mission-core.mjs';
import {applyAssetFlow} from '../scripts/apply-asset-flow.mjs';
import {V5_MISSION_CATALOG} from '../src/journey-v5-backend.mjs';
const input=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/flow.json',import.meta.url),'utf8'));
const rectCorrections=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/flow-corrections.json',import.meta.url),'utf8'));
const validFixture=()=>{
 const d=structuredClone(input);
 // Test-only disambiguation. Never writes the user's file or server document.
 const s=d.tasks.find(t=>t.taskId==='digital-id.create-id').screens.find(s=>s.screenId==='digital-id.create-id.quick');
 for(const fix of rectCorrections)s.interactions.find(i=>i.interactionId===fix.interactionId).rect=[...fix.rect];
 return d;
};
test('original export is protected from publication with ambiguous overlapping targets',()=>{
 assert.throws(()=>applyAssetFlow(base,input),/Перекрывающиеся зоны/);
});
test('approved runtime equals compiled source; corrections never rewrite original document',()=>{
 const before=JSON.stringify(input),compiled=applyReviewedAssets(applyAssetFlow(base,input,{rectCorrections}));
 assert.deepEqual(compiled.catalog,V5_MISSION_CATALOG);assert.equal(JSON.stringify(input),before);
 const stale=structuredClone(input);stale.tasks.find(t=>t.taskId==='digital-id.create-id').screens.find(s=>s.screenId==='digital-id.create-id.quick').interactions[0].rect[0]++;
 assert.throws(()=>applyAssetFlow(base,stale,{rectCorrections}),/CORRECTION_STALE/);
});
test('strict bridge is deterministic, nonmutating and preserves every enabled action',()=>{
 const d=validFixture(),before=JSON.stringify(d),a=applyAssetFlow(base,d),b=applyAssetFlow(base,d);
 assert.deepEqual(a,b);assert.equal(JSON.stringify(d),before);
 assert.equal(a.metadata.effectiveScreens,70);assert.equal(a.metadata.activeInteractions,75);
 for(const t of d.tasks)for(const s of t.screens){
  const actual=a.catalog.tasks[t.taskId].screens[s.screenId];
  if(!s.enabled){assert.equal(actual,undefined);continue;}
  assert.equal(actual.automaticMs,null);
  for(const i of s.interactions.filter(i=>i.enabled)){
   const action=actual.actions.find(a=>a.actionId===i.interactionId);assert.ok(action);
   assert.equal(action.placement,i.kind==='hotspot'?'hotspot':'below-screen');
   if(i.kind==='hotspot')assert.deepEqual(action.rect,i.rect);
   assert.equal(action.label,i.kind==='hotspot'?i.name:i.label);
  }
 }
 assert.deepEqual(a.catalog.tasks['blogger.channel'].screens,a.catalog.tasks['blogger.channel'].coreCatalog.screens);
});
test('unsupported v3 features cannot be silently discarded by legacy runtime bridge',()=>{
 for(const change of [
  d=>d.tasks[0].screens[0].interactions.push({...d.tasks[0].screens[0].interactions[0],interactionId:'extra'}),
  d=>{const i=d.tasks[0].screens[0].interactions[0];i.kind='timer';i.delayMs=500;delete i.rect;},
  d=>d.tasks[0].screens[0].interactions[0].target={kind:'complete-task'},
  d=>d.tasks[0].screens[0].interactions[0].name='Other text',
  d=>d.tasks[0].screens[0].interactions[0].rect[0]+=0.001,
  d=>d.tasks[0].helpText='New help',
  d=>d.tasks[0].screens[0].interactions[0].enabled=false,
  d=>d.tasks[0].screens.at(-1).interactions[0].target={kind:'screen',screenId:d.tasks[0].startScreenId},
 ]){const d=validFixture();change(d);assert.throws(()=>applyAssetFlow(base,d));}
});
for(const [missionId,branch] of [['blogger','private'],['blogger','public'],['digital-id','enabled'],['digital-id','skipped'],['communication','default'],['business','default']]){
 test(`real backend: ${missionId}/${branch} completes and restores all receipts`,()=>{
  const {catalog}=applyAssetFlow(base,validFixture());
  let model=createMissionModel(catalog,{sessionId:`flow.${missionId}.${branch}`}),serial=0,now=1000;
  const send=(type,fields={},internal=false)=>{
   const c={schemaVersion:1,type,commandId:`flow.${++serial}`,sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:model.state.revision,...fields};
   const r=dispatchMissionCommand(catalog,model,c,{now,internal});assert.equal(r.reply.ok,true,`${model.state.screenId}: ${r.reply.code}`);model=r.model;
   return c;
  };
  send('OWNER_CHANGED',{active:true},true);send('SELECT_MISSION',{missionId});send('HOLD_CONFIRMED',{},true);
  let steps=0;
  while(model.state.status!=='completed'){
   assert.ok(steps++<100);
   if(model.state.status==='result'){now+=800;send('ADVANCE_RESULT',{},true);continue;}
   const screen=catalog.tasks[model.state.taskId].screens[model.state.screenId];
   let action=screen.actions.find(a=>a.outcome.kind!=='incorrect');
   if(screen.screenId==='blogger.channel.privacy')action=screen.actions.find(a=>a.actionId===(branch==='public'?'channel.choose-public':'channel.continue-private'));
   if(screen.screenId==='blogger.channel.public-confirm')action=screen.actions.find(a=>a.actionId==='channel.use-new-link');
   if(screen.screenId==='digital-id.create-id.quick')action=screen.actions.find(a=>a.outcome.answer?.value===branch);
   const c=send('ACT',{screenId:screen.screenId,actionId:action.actionId});
   const duplicate=dispatchMissionCommand(catalog,model,c,{now});assert.equal(duplicate.duplicate,true);
   assert.deepEqual(restoreMissionModel(catalog,JSON.stringify(model)).model,model);
  }
  assert.deepEqual(model.state.progress[missionId].completed,catalog.missions[missionId].taskIds);
  assert.deepEqual(model.state.progress[missionId].skipped,[]);
 });
}
