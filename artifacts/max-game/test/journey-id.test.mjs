import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ID_TASKS,ID_IMAGES,ID_SOURCE_FRAMES,ID_FLOW_VERSION,IdPlayback} from '../src/journey-id.mjs';
import {idTaskMarkup} from '../src/journey-id-ui.mjs';
import {clientContent} from '../src/journey-client.mjs';
import {freshSession,reduce,restoreSession} from '../src/journey-state.mjs';
const original=JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url)));
const client=clientContent(original);
function session(content,mission,step){let s=freshSession();s.screen='field';s.mission=mission;s.plans[mission]='playing';s.runs[mission]=[{step,stage:0,done:false,answers:[],x:.5,y:.5,idFlowVersion:ID_FLOW_VERSION}];s.task=step;return s;}
test('all thirteen screens use prepared SVGs, preserve source vectors and contain no HTML',()=>{
 const sources=JSON.parse(fs.readFileSync(new URL('../public/assets/digital-id/sources.json',import.meta.url)));
 assert.equal(sources.length,13);for(const f of sources){
  const svg=fs.readFileSync(new URL('../public/assets/digital-id/'+f.file,import.meta.url));
  assert.equal(crypto.createHash('sha256').update(svg).digest('hex'),f.sha256);
  const text=svg.toString();assert.match(text,/viewBox="0 0 360 800"/);assert.match(text,/<path /);
  assert.doesNotMatch(text,/<foreignObject|<text\b|http[^"\s]*\.png/);
  assert.equal(ID_IMAGES.some(src=>src.endsWith(f.file)),ID_SOURCE_FRAMES.includes(Number(f.file.match(/\d+/)[0])));
  // Source exports are local-only; CI/runtime do not require the whole Figma archive.
  const sourceUrl=new URL('../../../'+f.source+'/screen.svg',import.meta.url);
  if(fs.existsSync(sourceUrl)){
   const original=fs.readFileSync(sourceUrl);assert.equal(crypto.createHash('sha256').update(original).digest('hex'),f.sourceSha256);
   const paths=[...original.toString().matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(m=>m[1]);
   for(const d of paths)assert(text.includes(`d="${d}"`),`${f.file}: source vector removed`);
  }
 }
});
for(const [content,mission,step]of [[original,'digital-id','create-id'],[client,'digital-id','create-id'],[client,'demo-benefit','demo-id'],[client,'demo-business','demo-id']])for(const skip of [false,true])test(`${content.edition||'current'} ${mission} all screens and biometric skip=${skip}`,()=>{
 let s=session(content,mission,step),seen=[];
 while(!s.runs[mission][0].done){const o=s.runs[mission][0];seen.push(o.stage);assert.match(idTaskMarkup(s,o),new RegExp(ID_IMAGES[o.stage].split('/').at(-1)));
  if([3,4,5].includes(o.stage)){const rejected=reduce(s,{type:'ANSWER',choice:1},content);assert.equal(rejected.runs[mission][0].stage,o.stage);assert.equal(rejected.runs[mission][0].done,false);assert(rejected.notice);}
  s=reduce(s,{type:'ANSWER',choice:skip&&o.stage===6?1:0},content);
  const restored=restoreSession(JSON.stringify({...s,version:1}),content);assert.deepEqual(restored.runs[mission],s.runs[mission]);
 }
 assert.equal(seen.length,skip?8:9);assert.equal(seen.includes(7),!skip);assert.equal(s.runs[mission][0].stage,9);
});
test('legacy completed ID remains completed; partial filler progress restarts ID only',()=>{
 for(const content of [original,client])for(const done of [false,true]){const s=session(content,'digital-id','create-id');const o=s.runs['digital-id'][0];delete o.idFlowVersion;o.stage=done?(content.edition?3:2):1;o.done=done;o.answers=[0];
 const restored=restoreSession(JSON.stringify({...s,version:1}),content).runs['digital-id'][0];assert.equal(restored.stage,done?9:0);assert.equal(restored.done,done);assert.equal(restored.x,.5);assert.equal(restored.idFlowVersion,2);}
});
test('playback advances once, stops on close/pause and restarts dwell when reopened',()=>{
 const p=new IdPlayback(),o={step:'create-id',stage:2,done:false};
 for(let i=0;i<5;i++)assert.equal(p.tick(0,o,.1,true),false);
 assert.equal(p.tick(0,o,.1,false),false);
 for(let i=0;i<10;i++)assert.equal(p.tick(0,o,.1,true),false);
 assert.equal(p.tick(0,o,.1,true),true);assert.equal(p.tick(0,o,10,true),false);
 p.tick(0,null,.1,true);assert.equal(p.tick(0,o,.1,true),false);
});


test('PIN screens are absent and the UI counts only the nine active screens',()=>{
 assert.deepEqual(ID_SOURCE_FRAMES,[1,2,3,4,5,6,11,12,13]);
 assert.doesNotMatch(JSON.stringify(ID_TASKS),/ПИН|клавиатур|Повторный ввод/);
 for(let stage=0;stage<9;stage++){const markup=idTaskMarkup({}, {stage,done:false});assert.match(markup,new RegExp(`${stage+1} / 9`));assert.doesNotMatch(markup,/create-0[789]|create-10/);}
});
test('version 1 progress maps every old stage without resetting completed work',()=>{
 for(const [content,mission,step] of [[original,'digital-id','create-id'],[client,'digital-id','create-id'],[client,'demo-benefit','demo-id'],[client,'demo-business','demo-id']]){
  for(let old=0;old<=13;old++){
   const s=session(content,mission,step),o=s.runs[mission][0];o.idFlowVersion=1;o.stage=old;o.done=old===13;o.answers=Array(old).fill(0);
   const restored=restoreSession(JSON.stringify({...s,version:1}),content).runs[mission][0];
   assert.equal(restored.stage,old<6?old:Math.max(6,old-4));assert.equal(restored.done,old===13);assert.equal(restored.x,.5);assert.equal(restored.idFlowVersion,2);
  }
 }
});
