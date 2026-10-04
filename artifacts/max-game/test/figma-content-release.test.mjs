import test from 'node:test';
import assert from 'node:assert/strict';
import {loadFigmaContentRelease,REVISION} from '../scripts/figma-content-release.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {assertTaskCatalog} from '../src/contracts/task-catalog.mjs';
import {MISSION_CATALOG as old} from '../src/content/mission-catalog.mjs';
import {applyMaxIcons} from '../scripts/apply-max-icons.mjs';
const release=await loadFigmaContentRelease('artifacts/DESIGN/figma-exports/2026-10-03_15-19-16','artifacts/max-game/public');
const c=release.catalog;

function driver(missionId,branch='public'){
 let model=createMissionModel(c,{sessionId:`release.${missionId}.${branch}`}),now=1000,serial=0;
 const send=(type,fields={},internal=false)=>{
  const command={schemaVersion:1,type,commandId:`cmd.${++serial}`,sessionId:model.state.sessionId,contentRevision:REVISION,expectedRevision:model.state.revision,...fields};
  const r=dispatchMissionCommand(c,model,command,{now,internal});assert.equal(r.reply.ok,true,JSON.stringify(r.reply));
  const repeat=dispatchMissionCommand(c,r.model,command,{now,internal});assert.equal(repeat.duplicate,true);assert.deepEqual(repeat.model,r.model);
  model=r.model;return r;
 };
 send('OWNER_CHANGED',{active:true},true);send('SELECT_MISSION',{missionId});send('HOLD_CONFIRMED',{},true);
 const visited=[];
 while(model.state.status!=='completed'&&visited.length<150){
  if(model.state.status==='result'){now+=800;send('ADVANCE_RESULT');continue;}
  const state=model.state,screen=c.tasks[state.taskId].screens[state.screenId];visited.push(screen.screenId);
  let action=screen.actions[0];
  if(state.screenId==='blogger.channel.privacy')action=screen.actions.find(a=>a.actionId===(branch==='public'?'channel.choose-public':'channel.continue-private'));
  if(state.screenId==='blogger.channel.public-confirm')action=screen.actions.find(a=>a.actionId==='channel.use-new-link');
  const wrong=dispatchMissionCommand(c,model,{schemaVersion:1,type:'ACT',commandId:'wrong',sessionId:state.sessionId,contentRevision:REVISION,expectedRevision:state.revision,screenId:state.screenId,actionId:'not-an-action'},{now});
  assert.equal(wrong.reply.ok,false);assert.equal(wrong.model,model);
  if(screen.automaticMs!==null){now+=screen.automaticMs;send('AUTO_SCREEN',{screenId:state.screenId,actionId:action.actionId},true);}
  else send('ACT',{screenId:state.screenId,actionId:action.actionId});
  assert.equal(restoreMissionModel(c,JSON.stringify(model)).ok,true);
 }
 assert.equal(model.state.status,'completed');assert.deepEqual(model.state.progress[missionId].skipped,[]);
 assert.deepEqual(model.state.progress[missionId].completed,c.missions[missionId].taskIds);
 return {model,visited};
}

test('84 ordered screens preserve source text; all icons use the explicitly supplied SVG selection',()=>{
 assert.equal(Object.keys(c.missions).length,4);assert.equal(Object.keys(c.tasks).length,15);
 assert.equal(Object.values(c.tasks).reduce((n,t)=>n+Object.keys(t.screens).length,0),84);
 assert.equal(Object.keys(c.assets).length,103);assert.equal(release.files.size,103);
 assert.deepEqual(release.metadata.iconSelection.missing,[]);
 for(const t of Object.values(c.tasks))assert.equal(c.assets[t.iconAssetId].origin.kind,'provided-ui-icon');
 for(const m of Object.values(c.missions))assert.equal(c.assets[m.iconAssetId].origin.kind,'provided-ui-icon');
 assert.equal(c.assets[c.uiIcons.fallback].origin.kind,'explicit-missing-icon');
 assert.match(release.files.get(c.assets[c.uiIcons.fallback].path).toString(),/#FF3030/);
 assert.equal(release.metadata.reviewNotes.length,8);
 for(const t of Object.values(c.tasks))for(const s of Object.values(t.screens)){
  assert.ok(!s.missing);assert.ok(release.files.has(c.assets[s.assetId].path));
  assert.equal(s.deviceKind,c.assets[s.assetId].width>c.assets[s.assetId].height?'pc':'phone');
  const editorial=release.metadata.reviewNotes.some(n=>n.screenId===s.screenId);
  assert.equal(s.instruction,editorial?'':s.origin.instructionRaw);
 }
 assert.ok(c.tasks['business.channel'].screens['business.channel.create'].deviceKind==='pc');
 assert.ok(c.tasks['business.channel'].screens['business.channel.open'].deviceKind==='phone');
 assert.ok(!c.tasks['business.sector']);assert.equal(Object.keys(old.missions).length,6);
});
for(const [missionId,branch] of [['blogger','public'],['blogger','private'],['digital-id','public'],['communication','public'],['business','public']]){
 test(`new release completes ${missionId}/${branch} with duplicate protection and restore`,()=>{
  const {model,visited}=driver(missionId,branch);
  if(missionId==='blogger'){
   assert.equal(model.state.progress.blogger.channelModel.state.answers['channel-type'],branch);
   assert.ok(visited.includes('blogger.channel.result'));
   assert.equal(visited.includes('blogger.channel.public-link'),branch==='public');
  }
  if(missionId==='business')assert.equal(visited.length,26);
  if(missionId==='communication')assert.equal(visited.length,24);
 });
}
test('new revision rejects previous saves and unsafe Figma provenance',()=>{
 const model=createMissionModel(old,{sessionId:'old'});assert.equal(restoreMissionModel(c,model).ok,false);
 const invalid=structuredClone(release.channel);Object.values(invalid.assets)[0].origin.sourcePath='../screen.png';
 assert.throws(()=>assertTaskCatalog(invalid),/origin/);
});
test('an unassigned new task receives the explicit red question mark instead of an unrelated icon',async()=>{
 const sample=structuredClone(old),files=new Map();
 sample.tasks['blogger.channel'].taskId='unknown.task';
 const result=await applyMaxIcons(sample,files);
 assert.ok(result.missing.includes('unknown.task'));
 assert.equal(sample.tasks['blogger.channel'].iconAssetId,'max-icon.missing');
 assert.equal(sample.assets['max-icon.missing'].width,sample.assets['max-icon.missing'].height);
});
