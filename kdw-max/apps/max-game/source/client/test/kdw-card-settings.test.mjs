import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {CARD_SETTINGS} from '../src/kdw-card-settings.mjs';
import {createPostTimeline,popupOpacity,popupAcceptsInput} from '../src/kdw-post-stream.mjs';
import {createRightCardLayout} from '../src/kdw-activity-stage.mjs';
import {postBank,visiblePosts,postsElapsed} from '../src/kdw-posts-model.mjs';
import {storeTimeline,storeElapsed} from '../src/kdw-store-rating.mjs';
import {activityRemaining} from '../src/kdw-development.mjs';
import {V5_MISSION_CATALOG as base} from '../src/journey-v5-backend.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel,TASK_CLOCK_RULES_REVISION} from '../src/core/mission-core.mjs';
const require=createRequire(import.meta.url),{DEFAULTS,CARD_DEFAULTS,validate}=require('../../../../STARTUP/tools/stand-settings.cjs');
const activity={version:17,seed:42,runId:2,businessType:'cafe',popup:CARD_SETTINGS,published:[]};
test('card timing and configurable opacity threshold apply on both fades',()=>{
 const r=createPostTimeline(activity,postBank()).spawn(0);assert.equal(r.travel,3600);
 for(const [time,opacity]of [[0,0],[400,.5],[800,1],[2800,1],[3200,.5],[3600,0]])assert.equal(popupOpacity(r,time),opacity);
 for(const time of [0,100,3500,3600])assert.equal(popupAcceptsInput(r,time),false);
 for(const time of [400,800,2800,3200])assert.equal(popupAcceptsInput(r,time),true);
 const strict={...r,popup:{...CARD_SETTINGS,minOpacityPercent:50}};
 assert.equal(popupAcceptsInput(strict,400),true);assert.equal(popupAcceptsInput(strict,399),false);
 assert.equal(popupAcceptsInput(strict,3200),true);assert.equal(popupAcceptsInput(strict,3201),false);
 assert.equal(popupAcceptsInput(strict,400,.9),false);
 assert.equal(popupAcceptsInput({...r,popup:{...CARD_SETTINGS,minOpacityPercent:0}},0),false);
});
test('settings accept old policies, preserve values, and reject invalid card settings',()=>{
 assert.deepEqual(CARD_SETTINGS,CARD_DEFAULTS);assert.deepEqual(validate(DEFAULTS),DEFAULTS);
 const value=structuredClone(DEFAULTS);value.max.cardActivity={...CARD_SETTINGS};assert.deepEqual(validate(value),value);
 for(const [k,v]of [['minOpacityPercent',-1],['minOpacityPercent',101],['maxOverlapPercent',16],['enterMs',0],['holdMs',Infinity],['exitMs',1.5],['pauseTaskTimer','true']])assert.throws(()=>validate({...value,max:{...value.max,cardActivity:{...CARD_SETTINGS,[k]:v}}}));
});
test('popup total occlusion stays below the limit, including motion envelopes, without rearranging live targets',()=>{
 for(const limit of [0,15])for(const width of [650,1100]){
 const timeline=createPostTimeline({...activity,popup:{...CARD_SETTINGS,maxOverlapPercent:limit}},postBank()),layout=createRightCardLayout();
 const g={rect:{width:390,right:600},playArea:{left:0,right:2100,height:1500},flowArea:{top:20,bottom:1450},fallingGeometry:{left:700,right:700+width,width:440},scale:1};
 let last=new Map(),count=0;
 for(let t=0;t<15000;t+=50){const rows=timeline.at(t),poses=layout.layout(g,rows,(_s,w)=>w*.625),all=[...poses.values()];
 for(const [id,p]of poses){if(last.has(id))assert.deepEqual(p,last.get(id));const covered=all.filter(q=>q!==p).reduce((n,q)=>n+Math.max(0,Math.min(p.x+p.w,q.x+q.w)-Math.max(p.x,q.x))*Math.max(0,Math.min(p.y+p.h+p.w*.09,q.y+q.h+q.w*.09)-Math.max(p.y,q.y)),0);assert.ok(covered<=p.w*p.h*limit/100+.001);count++;}last=poses;}
 assert.ok(count>100);
 }
});
function driver(pauseTaskTimer=true){const catalog={...base,kdwProduction:{production:true,revision:'cards',value:{...structuredClone(DEFAULTS),max:{...DEFAULTS.max,cardActivity:{...CARD_SETTINGS,pauseTaskTimer}}}}};let model=createMissionModel(catalog,{sessionId:'cards-test',rulesRevision:TASK_CLOCK_RULES_REVISION}),now=1000,serial=0;
 return {get s(){return model.state;},get now(){return now;},advance(ms){now+=ms;},send(type,fields={},internal=false){const r=dispatchMissionCommand(catalog,model,{schemaVersion:1,type,commandId:'card.'+(++serial),sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:model.state.revision,...fields},{now,internal});if(r.reply.ok)model=r.model;return r.reply;},restore(){assert.equal(restoreMissionModel(catalog,model).ok,true);}};
}
function start(d,kind,readyFirst=true){d.send('OWNER_CHANGED',{active:true},true);d.send('SELECT_MISSION',{missionId:'business'});const taskId=kind==='posts'?'business.channel':'business.store',screenId=kind==='posts'?'business.channel.result':'business.store.start';assert.equal(d.send('OPERATOR_GOTO',{missionId:'business',taskId,screenId},true).ok,true);if(readyFirst)d.send('STAND_READY',{screenId});d.advance(9000);assert.equal(d.send(kind==='posts'?'START_POSTS':'START_STORE',{taskId,screenId}).ok,true);return {taskId,screenId};}
test('both activities freeze only countdown, preserve card clock and inactivity, and replay',()=>{
 for(const kind of ['posts','store']){
 const d=driver(),ctx=start(d,kind);assert.equal(d.s.deadlineAt,null);assert.equal(d.s.cardTaskPause.remainingMs,51000);d.advance(70000);
 assert.equal(d.send('EXPIRE',{},true).code,'TIMER_NOT_EXPIRED');assert.equal(d.send('STAND_TOUCH').ok,true);
 const a=d.s.progress.business[kind==='posts'?'postsActivity':'storeActivity'],elapsed=kind==='posts'?postsElapsed(a,activityRemaining(d.s,d.now)):storeElapsed(a,d.s,d.now);
 assert.equal(elapsed,70000);const rows=kind==='posts'?visiblePosts(a,elapsed):storeTimeline(a).at(elapsed);assert.ok(rows.length);
 assert.equal(d.send(kind==='posts'?'PUBLISH_POST':'PICK_PRODUCT',{...ctx,spawnId:rows[0].spawnId}).ok,true);d.restore();
 d.advance(120000);assert.equal(d.send('STAND_IDLE',{},true).ok,true);assert.equal(d.s.status,'menu');assert.equal(d.s.cardTaskPause,undefined);d.restore();
 const timed=driver(false);start(timed,kind);assert.equal(timed.s.cardTaskPause,undefined);timed.advance(51000);assert.equal(timed.send('EXPIRE',{},true).ok,true);timed.restore();
 }
});
test('operator exit and timer tap clear paused countdown without contaminating next task or QR',()=>{
 const d=driver();start(d,'posts');d.advance(10000);assert.equal(d.send('OPERATOR_GOTO',{missionId:'business',taskId:'business.bot',screenId:base.tasks['business.bot'].startScreenId},true).ok,true);assert.equal(d.s.cardTaskPause,undefined);d.send('STAND_READY',{screenId:d.s.screenId});assert.equal(d.s.deadlineAt,d.now+60000);d.restore();
 const e=driver();start(e,'store');assert.equal(e.send('FINISH_MISSION',{missionId:'business'}).ok,true);assert.equal(e.s.cardTaskPause,undefined);e.send('STAND_READY',{screenId:e.s.status});assert.equal(e.s.deadlineAt,e.now+15000);e.restore();
});

test('activity started before visual readiness pauses after ready and uses the same animation origin',()=>{
 for(const kind of ['posts','store']){const d=driver(),ctx=start(d,kind,false);assert.equal(d.s.cardTaskPause,undefined);assert.equal(d.send('STAND_READY',{screenId:ctx.screenId}).ok,true);assert.equal(d.s.cardTaskPause.remainingMs,60000);d.advance(4000);const a=d.s.progress.business[kind==='posts'?'postsActivity':'storeActivity'];assert.equal(kind==='posts'?postsElapsed(a,activityRemaining(d.s,d.now)):storeElapsed(a,d.s,d.now),4000);d.restore();}
});
test('late dispatch of a visible card has a bounded 500ms grace; expired cards stay rejected',()=>{
 for(const kind of ['posts','store'])for(const age of [3900,4200]){const d=driver(),ctx=start(d,kind);d.advance(age);const reply=d.send(kind==='posts'?'PUBLISH_POST':'PICK_PRODUCT',{...ctx,spawnId:d.s.runId+'.0'});assert.equal(reply.ok,age===3900);d.restore();}
});
