import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {activityRemaining} from '../src/kdw-development.mjs';
import {postsElapsed,visiblePosts} from '../src/kdw-posts-model.mjs';
const base=createKdwCatalog(JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))));
function driver(development=true){
 const catalog={...base,...(development?{kdwDevelopment:true}:{})};let model=createMissionModel(catalog,{sessionId:'dev-controls',rulesRevision:'mission-rules-task-clock-v2'}),now=1000000,serial=0;
 const send=(type,fields={},internal=false)=>{const c={schemaVersion:1,type,sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:model.state.revision,commandId:`dev.${++serial}`,...fields},r=dispatchMissionCommand(catalog,model,c,{now:now++,internal});if(r.reply.ok)model=r.model;return r;};
 function begin(){send('OWNER_CHANGED',{active:true},true);if(development)assert.equal(send('DEV_TIMER',{active:false}).reply.ok,true);send('SELECT_MISSION',{missionId:'business'});send('HOLD_CONFIRMED',{},true);}
 function reach(id){for(let i=0;i<100&&model.state.screenId!==id;i++){const s=model.state;if(s.status==='result'){now+=1000;send('ADVANCE_RESULT');continue;}const screen=catalog.tasks[s.taskId].screens[s.screenId],a=screen.actions.find(a=>a.outcome.kind!=='incorrect'&&a.outcome.screenId!==s.screenId);if(screen.automaticMs!==null)now+=screen.automaticMs;assert.equal(send(screen.automaticMs!==null?'AUTO_SCREEN':'ACT',{screenId:s.screenId,actionId:a.actionId},screen.automaticMs!==null).reply.ok,true);}assert.equal(model.state.screenId,id);}
 return {send,begin,reach,advance(ms){now+=ms;},get model(){return model;},get state(){return model.state;},get now(){return now;},restore(){return restoreMissionModel(catalog,model);}};
}
test('development countdown is off, can run for 60 seconds, switch off, and remain off across task changes',()=>{
 const d=driver();d.begin();assert.equal(d.state.deadlineAt,null);d.advance(180000);assert.equal(d.send('EXPIRE',{},true).reply.code,'TIMER_NOT_EXPIRED');
 d.send('DEV_TIMER',{active:true});const deadline=d.state.deadlineAt;assert.equal(deadline,d.now-1+60000);d.advance(10000);d.send('DEV_TIMER',{active:false});assert.equal(d.state.deadlineAt,null);d.advance(120000);
 d.reach('business.channel.result');assert.equal(d.state.deadlineAt,null);assert.equal(d.restore().ok,true);
 d.send('DEV_TIMER',{active:true});d.advance(60001);assert.equal(d.send('EXPIRE',{},true).reply.ok,true);assert.equal(d.state.status,'expired');
});
test('posts keep moving after a minute with countdown off; timer toggles and owner pauses do not jump their clock',()=>{
 const d=driver();d.begin();d.reach('business.channel.result');d.send('START_POSTS',{taskId:'business.channel',screenId:'business.channel.result'});d.advance(180000);
 const read=()=>postsElapsed(d.state.progress.business.postsActivity,activityRemaining(d.state,d.now));const before=read();assert.ok(before>=180000);assert.ok(visiblePosts(d.state.progress.business.postsActivity,before)[0].index>20);
 d.send('DEV_TIMER',{active:true});assert.ok(Math.abs(read()-before)<3);d.send('DEV_TIMER',{active:false});
 d.send('OWNER_CHANGED',{active:false},true);const paused=read();d.advance(50000);assert.equal(read(),paused);d.send('OWNER_CHANGED',{active:true},true);assert.ok(read()-paused<3);
 d.send('RETURN_MENU');d.advance(50000);d.send('SELECT_MISSION',{missionId:'business'});assert.ok(read()-paused<5);assert.equal(d.restore().ok,true);
});
test('restart a completed or current task clears only its own progress, rejects future tasks, and survives replay',()=>{
 const d=driver();d.begin();d.reach('business.channel.result');d.send('START_POSTS',{taskId:'business.channel',screenId:'business.channel.result'});
 const saved=d.state.progress.business.postsActivity;assert.ok(d.state.progress.business.completed.includes('business.platform'));
 assert.equal(d.send('RESTART_TASK',{taskId:'business.store'}).reply.code,'TASK_UNAVAILABLE');
 assert.equal(d.send('RESTART_TASK',{taskId:'business.platform'}).reply.ok,true);assert.equal(d.state.screenId,base.tasks['business.platform'].startScreenId);assert.ok(!d.state.progress.business.completed.includes('business.platform'));assert.deepEqual(d.state.progress.business.postsActivity,saved);
 const run=d.state.runId;assert.equal(d.send('RESTART_TASK',{taskId:'business.platform'}).reply.ok,true);assert.equal(d.state.runId,run+1);assert.equal(d.state.deadlineAt,null);
 d.reach('business.channel.result');assert.equal(d.send('RESTART_TASK',{taskId:'business.channel'}).reply.ok,true);assert.equal(d.state.progress.business.postsActivity,undefined);assert.ok(d.state.progress.business.completed.includes('business.platform'));assert.equal(d.state.screenId,base.tasks['business.channel'].startScreenId);assert.equal(d.restore().ok,true);
});
test('normal catalog rejects local development commands and retains its deadline',()=>{
 const d=driver(false);d.begin();const deadline=d.state.deadlineAt;assert.equal(d.send('DEV_TIMER',{active:false}).reply.code,'DEVELOPMENT_UNAVAILABLE');assert.equal(d.send('RESTART_TASK',{taskId:d.state.taskId}).reply.code,'DEVELOPMENT_UNAVAILABLE');assert.equal(d.state.deadlineAt,deadline);
 assert.equal(d.send('SKIP_TASK',{taskId:d.state.taskId}).reply.code,'DEVELOPMENT_UNAVAILABLE');
});

test('skip moves only the current task forward, records skipped rather than completed, restores and can be restarted',()=>{
 const d=driver();d.begin();const first=d.state.taskId;
 assert.equal(d.send('SKIP_TASK',{taskId:'business.channel'}).reply.code,'TASK_UNAVAILABLE');
 d.send('OWNER_CHANGED',{active:false},true);assert.equal(d.send('SKIP_TASK',{taskId:first}).reply.code,'TASK_UNAVAILABLE');d.send('OWNER_CHANGED',{active:true},true);
 assert.equal(d.send('SKIP_TASK',{taskId:first}).reply.ok,true);
 assert.equal(d.state.taskId,'business.channel');assert.equal(d.state.deadlineAt,null);
 assert.deepEqual(d.state.progress.business.skipped,[first]);assert.ok(!d.state.progress.business.completed.includes(first));
 assert.equal(d.send('SKIP_TASK',{taskId:first}).reply.code,'TASK_UNAVAILABLE');assert.equal(d.restore().ok,true);
 assert.equal(d.send('RESTART_TASK',{taskId:first}).reply.ok,true);assert.deepEqual(d.state.progress.business.skipped,[]);
 d.send('DEV_TIMER',{active:true});
 const skipped=[];
 for(let i=0;i<20&&d.state.status==='task';i++){const id=d.state.taskId;skipped.push(id);assert.equal(d.send('SKIP_TASK',{taskId:id}).reply.ok,true);if(d.state.status==='task')assert.equal(d.state.deadlineAt,d.now-1+60000);}
 assert.equal(d.state.status,'incomplete');assert.deepEqual(d.state.progress.business.skipped,skipped);assert.equal(d.state.deadlineAt,null);assert.equal(d.restore().ok,true);
});
