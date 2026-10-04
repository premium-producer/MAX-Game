import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createInitialState, reduceGame, missionStatus, nextMissionToPlay, MISSION_STATUSES, STATES } from '../src/game-state.mjs';

const source = await readFile(new URL('../src/main.js',import.meta.url),'utf8');
const renderers = source.slice(source.indexOf('function renderMissionSelect()'),source.indexOf('function syncMissionMarkers()'));

test('debug completion rebuilds the already-open mission map with all expanded completed cards', () => {
  let markup='', map=null, writes=0;
  let actionWrites=0, actionMarkup='', popup=null, popupWrites=0;
  const actions={dataset:{},get innerHTML(){return actionMarkup},set innerHTML(value){actionMarkup=value;actionWrites++;
    popup=value?{dataset:{},hidden:true,setAttribute(){},get innerHTML(){return this.content},set innerHTML(value){this.content=value;popupWrites++}}:null;
  },querySelector(){return popup}};
  const missionLayer={
    set innerHTML(value){markup=value;writes++;actions.dataset={};map={dataset:{allMissionsAvailable:value.match(/data-all-missions-available="([^"]*)"/)[1],completedMissions:value.match(/data-completed-missions="([^"]*)"/)[1]},querySelectorAll:()=>[]};},
    get innerHTML(){return markup;},
    querySelector(selector){return selector==='.mission-map'?map:actions;},
  };
  const order=[1,2,3];
  const missions=Object.fromEntries(order.map(number=>[number,{number,name:`Mission ${number}`,summary:`Description ${number}`,level:'Level',timeSeconds:120,unlock:{requiresCompleted:order.filter(n=>n<number)}}]));
  const context=vm.createContext({ state:{...createInitialState(),screen:STATES.MISSION_SELECT}, renderedScreen:STATES.MISSION_SELECT,
    MISSION_ORDER:order,MISSIONS:missions,STATES,MISSION_STATUSES,missionStatus,nextMissionToPlay,
    language:"ru",pendingUnlockedMission:null,missionLayer,clearInventory(){},setShellFooterContent(){},syncMissionMarkers(){},
    audioAdapter:null,positionOutcomePopup(){},escapeHtml:String,t:key=>key,formatTime:()=> '02:00',missionStatusLabel:status=>status,
  });
  vm.runInContext(renderers+source.slice(source.indexOf("function showOutcomePopup("),source.indexOf("function hideOutcomePopup(")),context);
  vm.runInContext('renderMissionSelect()',context);
  assert.equal((markup.match(/mission-status-icon--lock/g)||[]).length,2);
  assert.equal((markup.match(/class="mission-summary /g)||[]).length,1);
  assert.equal(actions.innerHTML,'','unfinished missions cannot show the popup');
  context.state=reduceGame(context.state,{type:'DEBUG_COMPLETE_ALL'},order);
  vm.runInContext('renderMissionSelect()',context);
  assert.equal(writes,2);
  assert.equal((markup.match(/mission-marker--completed/g)||[]).length,3);
  assert.equal((markup.match(/mission-status-icon--flag/g)||[]).length,3);
  assert.equal((markup.match(/class="mission-summary /g)||[]).length,3);
  assert.doesNotMatch(markup,/mission-status-icon--lock|mission-marker--locked/);
  assert.match(popup.innerHTML,/data-game-action="finish"/);
  assert.equal(popup.dataset.kind,"success");
  assert.equal(popup.hidden,false);
  assert.match(popup.innerHTML,/floating-dialog__handle/);
  assert.doesNotMatch(popup.innerHTML,/outcome-popup__close/);
  assert.match(actions.innerHTML,/role="dialog"/);
  assert.match(popup.innerHTML,/missionSelect.allCompleted/);
  assert.match(popup.innerHTML,/missionSelect.continue/);
  const previousActionWrites=actionWrites,previousPopupWrites=popupWrites;
  vm.runInContext('renderMissionSelect()',context);
  assert.equal(popupWrites,previousPopupWrites);
  assert.equal(actionWrites,previousActionWrites,'repeat render must not restart the popup or replace its focused button');
  assert.equal(reduceGame(context.state,{type:'FINISH'},order).screen,STATES.END);
  assert.equal(writes,2,'unchanged progress should retain the existing DOM');
  context.state=reduceGame(context.state,{type:'DEBUG_TOGGLE_UNLOCK'},order);
  vm.runInContext('renderMissionSelect()',context);
  assert.equal(writes,3,'access change must rebuild even when completion is unchanged');
  assert.equal((markup.match(/data-game-action="launch"/g)||[]).length,3);
  assert.doesNotMatch(markup,/disabled/);
  assert.equal((markup.match(/mission-status-icon--flag/g)||[]).length,3,'replay access preserves genuine completion flags');
  context.state=reduceGame(context.state,{type:'DEBUG_TOGGLE_UNLOCK'},order);
  vm.runInContext('renderMissionSelect()',context);
  assert.equal(writes,4);
  assert.doesNotMatch(markup,/data-game-action="launch"/);
  context.state={...createInitialState(),screen:STATES.MISSION_SELECT};
  vm.runInContext('renderMissionSelect()',context);
  assert.equal(actions.innerHTML,'','new session must remove the completion popup');
  context.state=reduceGame(context.state,{type:'DEBUG_TOGGLE_UNLOCK'},order);
  vm.runInContext('renderMissionSelect()',context);
  assert.equal((markup.match(/data-game-action="launch"/g)||[]).length,3);
  assert.doesNotMatch(markup,/disabled|mission-marker--locked|mission-status-icon--flag/);
  assert.deepEqual(context.state.completed,[],'unlock does not mark missions complete');
});
