import test from 'node:test';
import assert from 'node:assert/strict';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {sharedTaskMarkup} from '../src/journey-shared-ui.mjs';
const snapshot=screen=>({state:{screenId:screen.screenId,status:'task'},view:{device:{kind:screen.deviceKind,asset:MISSION_CATALOG.assets[screen.assetId],annotations:screen.annotations},instruction:{text:screen.instruction},missing:screen.missing,actions:screen.actions.map(({outcome,...a})=>a)}});
test('All canonical screens expose actions inside the device, with read-only instructions',()=>{
 for(const task of Object.values(MISSION_CATALOG.tasks))for(const screen of Object.values(task.screens)){
  const markup=sharedTaskMarkup(snapshot(screen));const information=markup.slice(markup.indexOf('class="instruction '),markup.indexOf('class="demo-app"'));
  assert.doesNotMatch(information,/<button|data-answer=|media-counter/,screen.screenId);
  for(const action of screen.actions)assert.ok(markup.includes(`data-answer="${action.actionId}"`),action.actionId);
  assert.doesNotMatch(markup,/data-media-page|media-navigation/);
 }
});
test('Missing PC content remains an explicit gap, not a conflicting original screenshot',()=>{
 const screen=MISSION_CATALOG.tasks['business.platform'].screens['business.platform.verification'];
 const markup=sharedTaskMarkup(snapshot(screen));assert.match(markup,/data-device="pc"/);assert.match(markup,/СберБизнес/);assert.doesNotMatch(markup,/<img/);
});
test('Public-link correction and source hotspots retain canonical pixel geometry',()=>{
 const screen=MISSION_CATALOG.tasks['blogger.channel'].screens['blogger.channel.public-link'];
 const markup=sharedTaskMarkup(snapshot(screen));assert.match(markup,/Публичный канал создан/);assert.match(markup,/left:2%;top:13.25%/);assert.ok(Math.abs(Number(markup.match(/<span style="[^\"]*width:([\d.]+)%/)[1])-96)<1e-8);assert.match(markup,/data-answer="channel.fill-link-example"/);
});
