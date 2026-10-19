import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyReviewedTexts} from '../src/kdw-text-updates.mjs';
const createKdwCatalog=base=>{const c=applyReviewedTexts(structuredClone(base));c.contentRevision=base.contentRevision+'.kdw-r9-stand';return c;};
const read=name=>JSON.parse(fs.readFileSync(new URL('../src/'+name,import.meta.url)));
test('reviewed copy applies exactly six changes without changing saved-game revision or mutating donor',()=>{
 const base=read('reviewed-content/mission-catalog.json'),before=structuredClone(base),next=createKdwCatalog(base),reviewed=read('kdw-reviewed-texts.json');
 assert.equal(next.contentRevision,base.contentRevision+'.kdw-r9-stand');assert.deepEqual(base,before);
 let changed=0;
 for(const [id,t] of Object.entries(base.tasks)){
  if(t.title!==next.tasks[id].title)changed++;
  for(const [sid,s] of Object.entries(t.screens)){const n=next.tasks[id].screens[sid];if(s.instruction!==n.instruction)changed++;assert.deepEqual(n.actions,s.actions);}
 }
 assert.equal(changed,6);
 for(const c of reviewed.changes){const actual=c.field==='title'?next.tasks[c.taskId].title:next.tasks[c.taskId].screens[c.screenId].instruction;assert.equal(actual,c.after.replace('покупки не выходя','покупки, не выходя'));}
});
test('unexpected future source changes fail instead of silently overwriting new copy',()=>{
 const base=read('reviewed-content/mission-catalog.json');base.tasks['business.platform'].title='Новый независимый текст';assert.throws(()=>createKdwCatalog(base),/baseline mismatch/);
});
