import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {filterUserText,containsDisallowedText,TEXT_POLICY} from '../src/kdw-text-policy.mjs';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../src/core/mission-core.mjs';
import {assertMissionCommand} from '../src/contracts/mission-command.mjs';
const clean=v=>filterUserText(v,{final:true}).value;
test('RU/EN dictionaries remove whole words, inflections, repetitions, homoglyphs and split forms',()=>{
 for(const v of ['блять','ЕБАТЬ','пиздец','нахуй','охуенный','ебанутый','е6aть','eбать','хyй','бляяяять','пиз.дец','х у й','е б а т ь','б*л*я*т*ь','ебать123','fuck','FUCKING','fυck','f*u*c*k','f.u.c.k','f u c k','sh1t','b!tch','motherfucker'])assert.equal(clean(v),'',v);
 assert.equal(clean('Привет, блять! Увидимся, fuck.'),'Привет, ! Увидимся, .');
 for(const s of ['fu fuck ck','Бот для магазина','пиздец','a '.repeat(100)])assert.equal(clean(clean(s)),clean(s));
});
test('normal text, names, emoji and channel vocabulary survive unchanged',()=>{
 for(const v of ['Наш бот для магазина','Школьник про рак и мусор','Херсон и херувим','Бляха и бляшки','страховка: подстрахуй друга','Канал об играх 🎮','Семён Semen','Сукачёв','Cassidy Class Classic','Assassin Cocktail Title','Кофейня — скидка 20%','my_channel_2026'])assert.equal(clean(v),v,v);
});
test('typing can complete ambiguous prefixes; paste, delimiters and blur finalize them',()=>{
 for(const word of ['бля','хер','ass','tit','cum','сука']){
  const r=filterUserText(word);assert.equal(r.value,word,word);assert.equal(r.pending,true,word);assert.equal(clean(word),'',word);assert.equal(filterUserText(word+' ').value,' ',word);
 }
 assert.equal(filterUserText('херсон').pending,false);
 assert.equal(filterUserText('еба').value,'еба');
 assert.equal(filterUserText('пизд').value,'пизд');
});
test('deletion maps selection offsets to original UTF-16 ranges without changing surrounding whitespace',()=>{
 const s='😀 до блять после';const from=s.indexOf('блять'),to=from+5;
 for(const caret of [0,2,from,from+2,to,s.length]){
  const r=filterUserText(s,{start:caret,end:caret,final:true});assert.equal(r.value,'😀 до  после');assert.equal(r.start,caret<=from?caret:caret<to?from:caret-5);assert.equal(r.end,r.start);
 }
 assert.deepEqual(filterUserText(s,{start:from+1,end:s.length,final:true}).ranges,[[from,to]]);
});
const base=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url))),catalog=createKdwCatalog(base);
const profile={schemaVersion:2,name:'Наш канал',description:'Наш бот',avatar:'cinema',visibility:'private',slug:''};
function driver(c=catalog,policy=true){let model=createMissionModel(c,{sessionId:'filter-test'}),n=0,now=1000;const cmd=(type,v={},internal=false)=>{const r=dispatchMissionCommand(c,model,{schemaVersion:1,type,commandId:'f.'+(++n),sessionId:'filter-test',contentRevision:c.contentRevision,expectedRevision:model.state.revision,...(policy&&['ACT','SAVE_INTERACTION'].includes(type)?{textPolicy:TEXT_POLICY}:{}),...v},{now:now++,internal});if(r.reply.ok)model=r.model;return r};const act=actionId=>cmd('ACT',{screenId:model.state.screenId,actionId});const save=value=>cmd('SAVE_INTERACTION',{taskId:model.state.taskId,screenId:model.state.screenId,value});const begin=()=>{cmd('OWNER_CHANGED',{active:true},true);cmd('SELECT_MISSION',{missionId:'blogger'});cmd('HOLD_CONFIRMED',{},true);act('channel.open-create-menu');act('channel.choose-create')};return {cmd,act,save,begin,get model(){return model},advance(){now+=1000;return cmd('ADVANCE_RESULT')}}}
test('authority rejects raw bad text in every field even without a client policy flag; clean data persists',()=>{
 for(const policy of [true,false]){const d=driver(catalog,policy);d.begin();for(const field of ['name','description','slug'])assert.equal(d.save({...profile,[field]:'блять'}).reply.code,'TEXT_NOT_ALLOWED',field);
  assert.equal(d.save(profile).reply.ok,true);d.act('personal.channel.create');d.act('channel.continue-private');d.act('channel.skip-invites');d.act('channel.complete');d.advance();d.act('blogger.comments.post.action-1');
  assert.equal(d.save({schemaVersion:2,reply:'Привет блять'}).reply.code,'TEXT_NOT_ALLOWED');assert.equal(d.save({schemaVersion:2,reply:'Привет!'}).reply.ok,true);assert.equal(d.act('personal.comments.send').reply.ok,true);assert.equal(restoreMissionModel(catalog,d.model).ok,true);
 }
});
test('old accepted names replay unchanged; new confirmation must clean the historical draft first',()=>{
 const old=driver({...catalog,kdwTextReplayLegacy:true},false);old.begin();old.save({...profile,name:'блять'});
 const restored=restoreMissionModel(catalog,old.model);assert.equal(restored.ok,true,restored.message);assert.equal(restored.model.state.progress.blogger.interactions['blogger.channel'].name,'блять');
 const state=restored.model.state,r=dispatchMissionCommand(catalog,restored.model,{schemaVersion:1,type:'ACT',commandId:'new.confirm',sessionId:state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:state.revision,screenId:state.screenId,actionId:'personal.channel.create',textPolicy:TEXT_POLICY},{now:5000});assert.equal(r.reply.code,'TEXT_NOT_ALLOWED');
 old.act('personal.channel.create');assert.equal(restoreMissionModel(catalog,old.model).ok,true);
});
test('invalid policy identifiers cannot bypass validation',()=>{
 const d=driver();d.begin();assert.throws(()=>assertMissionCommand({schemaVersion:1,type:'ACT',commandId:'x',sessionId:'x',contentRevision:'x',expectedRevision:0,screenId:'x',actionId:'x',textPolicy:'unknown'}));
 assert.equal(containsDisallowedText('бот'),false);
});
