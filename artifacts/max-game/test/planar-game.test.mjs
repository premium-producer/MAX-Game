import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {BOARD, WAKE_MS, HOLD_MS, validateCatalog, missionSteps, createRun, placeNode, removeNode, evaluateRoute, tickRun} from '../src/planar-game.mjs';
const catalog = validateCatalog(JSON.parse(await fs.readFile(new URL('../public/config/client-missions.json',import.meta.url),'utf8')));
function solve(mission, branch) {
  let run = createRun(mission, branch);
  const steps = missionSteps(mission, run.branch);
  steps.forEach((s,i) => { run = placeNode(run,mission,s.id,{x:BOARD.margin + (BOARD.width-2*BOARD.margin)*(i+1)/(steps.length+1),y:BOARD.height/2},0); });
  return run;
}
for (const mission of catalog.missions) for (const branch of mission.branches || [{id:undefined}]) {
  test(`${mission.id}/${branch.id || 'main'}: continuous 2D route completes only after wake and hold`, () => {
    const run = solve(mission, branch.id);
    assert.equal(evaluateRoute(run,mission,WAKE_MS-1).ready,false);
    assert.equal(evaluateRoute(run,mission,WAKE_MS).ready,true);
    const holding = tickRun(run,mission,WAKE_MS);
    assert.equal(tickRun(holding,mission,WAKE_MS+HOLD_MS-1).status,'playing');
    assert.equal(tickRun(holding,mission,WAKE_MS+HOLD_MS).status,'complete');
  });
  test(`${mission.id}/${branch.id || 'main'}: missing, reversed and disconnected steps cannot win`, () => {
    const run = solve(mission,branch.id), steps = missionSteps(mission,run.branch), a = steps[0].id, b = steps[1].id;
    assert.equal(evaluateRoute(removeNode(run,a),mission,1000).ready,false);
    const reversed = {...run,placements:{...run.placements,[a]:run.placements[b],[b]:run.placements[a]}};
    assert.equal(evaluateRoute(reversed,mission,1000).ready,false);
    const distant = placeNode(run,mission,a,{x:BOARD.width-160,y:70},0);
    assert.equal(evaluateRoute(distant,mission,1000).ready,false);
  });
}
test('interaction, pause and hidden page invalidate a pending success hold', () => {
  const mission=catalog.missions[0],run=tickRun(solve(mission),mission,1000);
  for(const flag of ['interacting','paused','hidden']) {
    const blocked=tickRun(run,mission,1500,{[flag]:true});
    assert.equal(blocked.holdSince,null); assert.equal(blocked.status,'playing');
    const resumed=tickRun(blocked,mission,2000);
    assert.equal(resumed.status,'playing'); assert.equal(resumed.holdSince,2000);
  }
});
test('a committed move/remove invalidates hold; invalid coordinates cannot alter state',()=>{
  const mission=catalog.missions[0],run=tickRun(solve(mission),mission,1000),id=mission.steps[0].id;
  assert.equal(placeNode(run,mission,id,{x:NaN,y:200},1500),run);
  assert.equal(placeNode(run,mission,'unknown',{x:200,y:200},1500),run);
  assert.equal(placeNode(run,mission,id,{x:200,y:200},1500).holdSince,null);
  assert.equal(removeNode(run,id).holdSince,null);
  const before=structuredClone(run); placeNode(run,mission,id,{x:500,y:220},1500); assert.deepEqual(run,before);
});
test('all business branches require only the chosen tool and reject an unknown branch',()=>{
  const m=catalog.missions[3];
  for(const b of m.branches) assert.deepEqual(missionSteps(m,b.id).map(s=>s.id),[...m.steps.map(s=>s.id),b.step.id]);
  assert.throws(()=>createRun(m,'invalid'));
});
// Regression tests for the superseded DOM/SVG prototype. Active engine: client-webgl.test.mjs.
