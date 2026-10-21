import test from 'node:test';
import assert from 'node:assert/strict';
import base from '../src/reviewed-content/mission-catalog.json' with {type:'json'};
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
const catalog=createKdwCatalog(base);
test('fresh standby entry resets only the selected mission and waits for palm, including durable replay',()=>{
 let model=createMissionModel(catalog,{sessionId:'fresh-entry',rulesRevision:'mission-rules-task-clock-v2'}),serial=0;
 const send=(type,fields={},internal=false)=>{
  const result=dispatchMissionCommand(catalog,model,{schemaVersion:1,type,sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:model.state.revision,commandId:`entry.${++serial}`,...fields},{now:serial*10,internal});
  assert.equal(result.reply.ok,true,result.reply.code);model=result.model;return result;
 };
 send('OWNER_CHANGED',{active:true},true);
 for(const missionId of Object.keys(catalog.missions)){
  send('SELECT_MISSION',{missionId});send('HOLD_CONFIRMED',{},true);send('RETURN_MENU');
 }
 for(const missionId of Object.keys(catalog.missions)){
  const previous=structuredClone(model.state.progress),run=model.state.runId;
  send('SELECT_MISSION',{missionId,fresh:true});
  const s=model.state,p=s.progress[missionId];
  assert.equal(s.runId,run+1);assert.equal(s.status,'scan');assert.equal(s.scanned,false);
  assert.equal(s.taskId,null);assert.equal(s.screenId,null);assert.equal(p.currentTaskIndex,0);
  assert.deepEqual(p.answers,{});assert.deepEqual(p.completed,[]);assert.deepEqual(p.skipped,[]);
  assert.equal(p.scanned,false);assert.equal(p.remainingMs,60000);
  for(const other of Object.keys(previous).filter(id=>id!==missionId))assert.deepEqual(s.progress[other],previous[other]);
  assert.equal(restoreMissionModel(catalog,model).ok,true);
  send('HOLD_CONFIRMED',{},true);
  assert.equal(model.state.taskId,catalog.missions[missionId].taskIds[0]);
  assert.equal(model.state.screenId,catalog.tasks[model.state.taskId].startScreenId);
  send('RETURN_MENU');
 }
});
