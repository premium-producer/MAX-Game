import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {personalProfile,personalDraft,validPersonalDraft,validSlug} from '../src/kdw-personal-channel-model.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))),catalog=createKdwCatalog(base);
const value={schemaVersion:2,name:'Мой <канал> & кино',description:'Новости\nи обсуждения',avatar:'cinema',visibility:'private',slug:''};
function driver(c=catalog){let model=createMissionModel(c,{sessionId:'personal-test',rulesRevision:'mission-rules-task-clock-v2'}),id=0,now=1000;const cmd=(type,fields={},internal=false)=>{const result=dispatchMissionCommand(c,model,{schemaVersion:1,type,commandId:'p.'+(++id),sessionId:'personal-test',contentRevision:c.contentRevision,expectedRevision:model.state.revision,...fields},{now:now++,internal});if(result.reply.ok)model=result.model;return result;};const act=actionId=>cmd('ACT',{screenId:model.state.screenId,actionId});const save=v=>cmd('SAVE_INTERACTION',{taskId:model.state.taskId,screenId:model.state.screenId,value:v});const begin=()=>{cmd('OWNER_CHANGED',{active:true},true);cmd('SELECT_MISSION',{missionId:'blogger'});cmd('HOLD_CONFIRMED',{},true);act('channel.open-create-menu');act('channel.choose-create');};const advance=()=>{now+=1000;return cmd('ADVANCE_RESULT');};return {cmd,act,save,begin,advance,get model(){return model},get now(){return now}};}
function create(d){d.begin();assert.equal(d.save(value).reply.ok,true);d.act('channel.fill-name-example');d.act('channel.create');}
function finishChannel(d){d.act('channel.continue-private');d.act('channel.skip-invites');d.act('channel.complete');d.advance();}
test('one custom profile, private/public setup, reply and returned post persist and restore',async()=>{
 const d=driver();create(d);const id=personalProfile(d.model.state).id;
 assert.equal(d.act('channel.choose-public').reply.ok,true);d.act('channel.use-new-link');
 assert.equal(d.act('channel.fill-link-example').reply.code,'CHANNEL_LINK_REQUIRED');
 assert.equal(d.save({...value,visibility:'public',slug:'my_channel_2026'}).reply.ok,true);d.act('channel.fill-link-example');d.act('channel.save-public-link');d.act('channel.skip-invites');d.act('channel.complete');d.advance();
 assert.equal(d.model.state.taskId,'blogger.comments');assert.equal(personalProfile(d.model.state).id,id);assert.equal(personalProfile(d.model.state).name,value.name);assert.equal(personalProfile(d.model.state).slug,'my_channel_2026');
 d.act('blogger.comments.post.action-1');assert.equal(d.save({schemaVersion:1,reply:''}).reply.ok,true);d.act('blogger.comments.input.action-1');assert.equal(d.act('blogger.comments.reply.action-1').reply.code,'COMMENT_REPLY_REQUIRED');
 d.save({schemaVersion:1,reply:'Ждём премьеру осенью!'});d.act('blogger.comments.reply.action-1');
 assert.equal(d.model.state.progress.blogger.personalComments.channelId,id);assert.equal(d.act('blogger.comments.result.continue').reply.ok,true);assert.equal(d.model.state.screenId,'blogger.comments.returned-post');
 const restore=restoreMissionModel(catalog,d.model);assert.equal(restore.ok,true,restore.message);assert.equal(restore.model.state.progress.blogger.personalComments.reply,'Ждём премьеру осенью!');
 const persistence=createMemoryPersistencePort();await persistence.create('personal-test',{schemaVersion:2,mission:d.model,layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:d.now});
 const app=createMissionSessionApplication({catalog,persistence,now:()=>d.now+100});assert.equal((await app.getSnapshot('personal-test')).state.progress.blogger.personalChannel.id,id);await app.close();
 d.act('blogger.comments.returned-post.continue');d.advance();assert.equal(d.model.state.taskId,'blogger.statistics');assert.equal(personalProfile(d.model.state).name,value.name);
});
test('invalid custom payloads, paused owner and stale context cannot change profile',()=>{
 const d=driver();d.begin();assert.equal(validPersonalDraft(value),true);assert.equal(validSlug('Канал'),false);
 for(const bad of [{...value,name:'x'.repeat(65)},{...value,avatar:'upload'},{...value,name:'line\nbreak'},{...value,other:true}])assert.equal(d.save(bad).reply.code,'INVALID_INTERACTION');
 d.cmd('OWNER_CHANGED',{active:false},true);assert.equal(d.save(value).reply.code,'OWNER_REQUIRED');d.cmd('OWNER_CHANGED',{active:true},true);d.save(value);d.act('channel.fill-name-example');d.act('channel.create');
 assert.equal(d.cmd('SAVE_INTERACTION',{taskId:'blogger.comments',screenId:'blogger.comments.reply',value:{schemaVersion:1,reply:'Late'}}).reply.code,'WRONG_CONTEXT');
});
test('restart comments clears only reply; restarting creation edits same channel identity',()=>{
 const c={...catalog,kdwDevelopment:true},d=driver(c);create(d);const id=personalProfile(d.model.state).id;finishChannel(d);d.act('blogger.comments.post.action-1');d.save({schemaVersion:1,reply:'Ответ'});d.act('blogger.comments.input.action-1');d.act('blogger.comments.reply.action-1');
 d.cmd('RESTART_TASK',{taskId:'blogger.comments'});assert.equal(d.model.state.progress.blogger.personalComments,undefined);assert.equal(personalProfile(d.model.state).id,id);
 d.cmd('RESTART_TASK',{taskId:'blogger.channel'});d.act('channel.open-create-menu');d.act('channel.choose-create');assert.equal(personalDraft(d.model.state).name,value.name);d.save({...value,name:'Новое название'});d.act('channel.fill-name-example');d.act('channel.create');assert.equal(personalProfile(d.model.state).id,id);assert.equal(personalProfile(d.model.state).name,'Новое название');assert.equal(restoreMissionModel(c,d.model).ok,true);
});
test('old completed comments replay unchanged under extended catalog; new reply tampering fails',()=>{
 const old=structuredClone(catalog);old.kdwPersonalChannel=0;delete old.tasks['blogger.comments'].screens['blogger.comments.returned-post'];old.tasks['blogger.comments'].screens['blogger.comments.result'].actions[0].outcome={kind:'complete-task'};
 const d=driver(old);d.begin();d.save({name:'Старый канал',description:'Сохранён',avatar:'heart'});d.act('channel.fill-name-example');d.act('channel.create');finishChannel(d);for(const a of ['blogger.comments.post.action-1','blogger.comments.input.action-1','blogger.comments.reply.action-1','blogger.comments.result.continue'])assert.equal(d.act(a).reply.ok,true);
 const restored=restoreMissionModel(catalog,d.model);assert.equal(restored.ok,true,restored.message);assert.equal(personalProfile(restored.model.state).name,'Старый канал');
 const n=driver();create(n);finishChannel(n);n.act('blogger.comments.post.action-1');n.save({schemaVersion:1,reply:'Свой ответ'});n.act('blogger.comments.input.action-1');n.act('blogger.comments.reply.action-1');const tampered=structuredClone(n.model);tampered.state.progress.blogger.personalComments.reply='Подмена';assert.equal(restoreMissionModel(catalog,tampered).ok,false);
});


test('native confirmation commits one transition per form and replays without legacy previews',()=>{
 const d=driver();d.begin();assert.equal(d.act('personal.channel.create').reply.code,'CHANNEL_NAME_REQUIRED');d.save(value);
 const revision=d.model.state.revision;assert.equal(d.act('personal.channel.create').reply.ok,true);assert.equal(d.model.state.revision,revision+1);assert.equal(d.model.state.screenId,'blogger.channel.privacy');assert.equal(d.model.state.progress.blogger.channelModel.state.screenId,'blogger.channel.privacy');assert.equal(personalProfile(d.model.state).name,value.name);
 const accepted=d.model.receipts.at(-1),duplicate=dispatchMissionCommand(catalog,d.model,accepted.command,{now:d.now});assert.equal(duplicate.duplicate,true);assert.equal(duplicate.model,d.model);assert.equal(d.act('personal.channel.create').reply.code,'ACTION_UNAVAILABLE');
 d.act('channel.choose-public');d.act('channel.use-new-link');assert.equal(d.act('personal.channel.save-public-link').reply.code,'CHANNEL_LINK_REQUIRED');d.save({...value,visibility:'public',slug:'my_channel'});assert.equal(d.act('personal.channel.save-public-link').reply.ok,true);assert.equal(d.model.state.screenId,'blogger.channel.subscribers');assert.equal(personalProfile(d.model.state).slug,'my_channel');
 d.act('channel.skip-invites');d.act('channel.complete');d.advance();d.act('blogger.comments.post.action-1');assert.equal(d.act('personal.comments.send').reply.code,'COMMENT_REPLY_REQUIRED');d.save({schemaVersion:1,reply:'Привет!'});assert.equal(d.act('personal.comments.send').reply.ok,true);assert.equal(d.model.state.screenId,'blogger.comments.result');assert.equal(d.model.state.progress.blogger.personalComments.reply,'Привет!');
 assert.ok(d.model.receipts.every(r=>!['blogger.channel.filled','blogger.channel.public-filled','blogger.comments.reply'].includes(r.reply.snapshot.screenId)));assert.equal(restoreMissionModel(catalog,d.model).ok,true);
});

test('native back from a saved legacy preview skips only the equivalent input screen',()=>{
 const d=driver();create(d);assert.equal(d.act('personal.back.blogger.channel.privacy').reply.ok,true);assert.equal(d.model.state.screenId,'blogger.channel.filled');assert.equal(d.act('personal.direct-back.blogger.channel.filled').reply.ok,true);assert.equal(d.model.state.screenId,'blogger.channel.menu');assert.equal(personalDraft(d.model.state).name,value.name);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
});
