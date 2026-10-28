import test from 'node:test';import assert from 'node:assert/strict';
import {V5_MISSION_CATALOG} from '../src/journey-v5-backend.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {operatorRoute,operatorPosition} from '../src/kdw-operator-model.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
const catalog={...V5_MISSION_CATALOG,kdwProduction:{value:{max:{timings:{palmWaitSeconds:30,taskDurationSeconds:60,resultSeconds:.8,qrDisplaySeconds:15,inactivitySeconds:120}},defaults:{businessType:'cafe'}}}};
test('operator can revisit every screen in all missions; receipts restore and visitor controls stay restricted',()=>{
 for(const missionId of Object.keys(catalog.missions)){let model=createMissionModel(catalog,{sessionId:'operator-'+missionId}),n=0;
  const send=(type,fields={},internal=false)=>{const r=dispatchMissionCommand(catalog,model,{schemaVersion:1,type,commandId:'op.'+(++n),sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:model.state.revision,...fields},{now:100000+n,internal});if(r.reply.ok)model=r.model;return r;};
  assert.equal(send('SELECT_MISSION',{missionId}).reply.ok,true);
  const route=operatorRoute(catalog,model.state);assert.ok(route.length>5);
  const target={missionId,taskId:route[1].taskId,screenId:route[1].screenId};assert.equal(send('OPERATOR_GOTO',target).reply.code,'TRUSTED_COMMAND_REQUIRED');
  for(const row of [...route,...route.toReversed()]){assert.equal(send('OPERATOR_GOTO',{missionId,taskId:row.taskId,screenId:row.screenId},true).reply.ok,true);assert.equal(operatorPosition(route,model.state),route.indexOf(row));}
  assert.equal(restoreMissionModel(catalog,model).ok,true);assert.equal(send('RESTART_MISSION').reply.code,'PRODUCTION_CONTROL_FORBIDDEN');
 }
});
test('operator targets are catalog-bound and rejected operations cannot alter game state',()=>{let model=createMissionModel(catalog,{sessionId:'operator-validation'});const c={schemaVersion:1,type:'SELECT_MISSION',commandId:'select',sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:0,missionId:'business'};model=dispatchMissionCommand(catalog,model,c,{now:1000}).model;
 for(const target of [{missionId:'blogger',taskId:'blogger.channel',screenId:'blogger.channel.name'},{missionId:'business',taskId:'business.store',screenId:'invented.screen'}]){const r=dispatchMissionCommand(catalog,model,{...c,...target,type:'OPERATOR_GOTO',commandId:'invalid',expectedRevision:model.state.revision},{now:1001,internal:true});assert.equal(r.reply.ok,false);assert.equal(r.model,model);}
 const route=operatorRoute(catalog,model.state),store=route.filter(r=>r.taskId==='business.store');assert.deepEqual(store.slice(0,3).map(r=>r.screenId),['business.store.dashboard','business.store.settings','business.store.start']);
});
test('trusted application entry is absent by default and regular sendCommand cannot escalate',async()=>{
 for(const enabled of [false,true]){const app=createMissionSessionApplication({catalog,persistence:createMemoryPersistencePort(),operatorControls:enabled,now:()=>1000});await app.createSession({sessionId:'operator-port'});let snap=await app.getSnapshot('operator-port');const command=(type,fields)=>({schemaVersion:1,type,commandId:type,sessionId:'operator-port',contentRevision:catalog.contentRevision,expectedRevision:snap.state.revision,...fields});await app.sendCommand(command('SELECT_MISSION',{missionId:'digital-id'}));snap=await app.getSnapshot('operator-port');const c=command('OPERATOR_GOTO',{missionId:'digital-id',taskId:'digital-id.hotel',screenId:'digital-id.hotel.present'});assert.equal((await app.sendCommand(c)).reply.code,'TRUSTED_COMMAND_REQUIRED');if(enabled)assert.equal((await app.operatorCommand(c)).reply.ok,true);else await assert.rejects(app.operatorCommand(c),/OPERATOR_UNAVAILABLE/);await app.close();}
});

test('operator-assisted task completion stays a skip instead of a visitor achievement',()=>{
 let model=createMissionModel(catalog,{sessionId:'operator-credit'}),serial=0;const send=(type,fields={},internal=false)=>{const result=dispatchMissionCommand(catalog,model,{schemaVersion:1,type,commandId:'credit.'+(++serial),sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:model.state.revision,...fields},{now:1000+serial,internal});assert.equal(result.reply.ok,true,result.reply.code);model=result.model;};
 send('SELECT_MISSION',{missionId:'digital-id'});send('OPERATOR_GOTO',{missionId:'digital-id',taskId:'digital-id.hotel',screenId:'digital-id.hotel.result'},true);
 const a=catalog.tasks['digital-id.hotel'].screens['digital-id.hotel.result'].actions.find(a=>a.outcome.kind==='complete-task');send('ACT',{screenId:'digital-id.hotel.result',actionId:a.actionId});
 assert.equal(model.state.progress['digital-id'].completed.includes('digital-id.hotel'),false);assert.equal(model.state.progress['digital-id'].skipped.includes('digital-id.hotel'),true);assert.equal(restoreMissionModel(catalog,model).ok,true);
});
