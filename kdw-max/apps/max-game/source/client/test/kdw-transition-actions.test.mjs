import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKdwCatalog} from '../src/kdw-interactions-model.mjs';
import {applyTransitionActions,externalAction} from '../src/kdw-transition-actions.mjs';
import {sharedTaskMarkup} from '../src/kdw-shared-ui.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url)));
test('all mission exits and task completions use semantic transition labels without changing outcomes or hotspots',()=>{
 const catalog=createKdwCatalog(base),before=structuredClone(catalog);applyTransitionActions(catalog);
 assert.deepEqual(catalog,before);
 let count=0;
 for(const m of Object.values(catalog.missions))for(const tid of m.taskIds)for(const s of Object.values(catalog.tasks[tid].screens))for(const a of s.actions){
  if(a.outcome.kind!=='complete-task'){assert.equal(a.transitionKind,undefined);continue;}
  const last=tid===m.taskIds.at(-1);assert.equal(a.transitionKind,last?'mission':'task');
  if(a.placement==='below-screen'){assert.equal(a.label,last?'Завершить миссию':'Следующее задание');count++;}
 }
 assert.ok(count>10);
 assert.equal(catalog.tasks['business.bot'].screens['business.bot.result'].actions[0].label,'С 10:00 до 16:00');
 assert.equal(catalog.tasks['business.store'].screens['business.store.start'].actions.find(a=>a.actionId.endsWith('publish-now')).label,'Завершить миссию');
});
test('shared markup marks only transition controls; private overlays reuse the same decision',()=>{
 const actions=[{actionId:'next',label:'Следующее задание',placement:'below-screen',transitionKind:'task'},{actionId:'done',label:'Завершить миссию',placement:'below-screen',transitionKind:'mission'},{actionId:'back',label:'Вернуться к посту',placement:'below-screen'}];
 const snapshot={state:{screenId:'screen',status:'task'},view:{actions}};
 const buttons=sharedTaskMarkup(snapshot).match(/<button\b[^>]*>[\s\S]*?<\/button>/g);
 assert.equal(buttons.length,3);assert.match(buttons[0],/kdw-transition-button/);assert.match(buttons[1],/kdw-transition-button/);assert.doesNotMatch(buttons[2],/kdw-transition-button/);
 assert.equal(externalAction(snapshot,'done','К следующему заданию').label,'Завершить миссию');
 assert.equal(externalAction(snapshot,'back','Вернуться к посту').className,'kdw-activity-button');
});
