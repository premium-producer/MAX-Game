import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {COMPLETION_SCREENS,TASK_COMPLETIONS,MISSION_COMPLETIONS} from '../src/kdw-completion-copy.mjs';
import {sharedInstructionBody,sharedTaskMarkup} from '../src/kdw-shared-ui.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url)));
const banned=/Задание выполнено|Переходим к следующему заданию|Открываем следующую возможность/i;
test('every current task ending uses authored copy and every mission ends with whole-route learning',()=>{
 const before=structuredClone(base),c=createKdwCatalog(base);assert.deepEqual(base,before);
 for(const t of Object.values(c.tasks))for(const s of Object.values(t.screens))assert.doesNotMatch(s.instruction,banned,s.screenId);
 for(const [id,tid]of Object.entries(COMPLETION_SCREENS)){
  const s=c.tasks[tid].screens[id],m=Object.values(c.missions).find(m=>m.taskIds.includes(tid)),last=m.taskIds.at(-1)===tid;
  if(last)assert.equal(s.instruction,MISSION_COMPLETIONS[m.missionId]);
  else {assert.equal(s.instruction,TASK_COMPLETIONS[tid]);assert.equal(s.instruction.split('\n').length,2);assert.ok(s.instruction.split('\n')[0].endsWith('!'));}
  const snapshot={state:{status:'result',taskId:tid,screenId:id},view:{instruction:{text:'Задание выполнено.'},actions:[]}};
  assert.equal(sharedInstructionBody(snapshot),s.instruction);
  assert.doesNotMatch(sharedTaskMarkup(snapshot),banned);
 }
 for(const m of Object.values(c.missions))assert.match(m.completionText,/^Миссия пройдена!\nТеперь вы знаете, как /);
});
test('store summary appears at the actual score goal, not while playing or configuring',()=>{
 const s={state:{status:'task',taskId:'business.store',screenId:'business.store.start',progress:{business:{storeActivity:{published:[]}}}},view:{instruction:{text:'Подключим витрину'},actions:[]}},before=structuredClone(s);
 assert.equal(sharedInstructionBody(s),'Подключим витрину');assert.deepEqual(s,before);
 s.state.progress.business.storeActivity.published=Array.from({length:9},()=>({score:5}));
 assert.equal(sharedInstructionBody(s),MISSION_COMPLETIONS.business);
 s.state.screenId='business.store.settings';assert.equal(sharedInstructionBody(s),'Подключим витрину');
});
