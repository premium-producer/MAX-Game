import test from 'node:test';
import assert from 'node:assert/strict';
import {CLIENT_REVIEW_MISSIONS} from '../src/content/client-review.mjs';
import {REVIEW_FLOWS} from '../src/content/client-review-flows.mjs';
import {newReviewProgress,restoreReviewProgress,taskAt,applyReviewAction,completeChannel} from '../src/core/client-review-progress.mjs';

function runMission(missionId, branch='business.bot') {
  let state=newReviewProgress(missionId),serial=0;
  while(taskAt(state)) {
    const taskId=taskAt(state);
    if(taskId==='blogger.channel') {state=completeChannel(state,`channel-${serial++}`).state;continue;}
    const screen=REVIEW_FLOWS[taskId].screens[state.screen];
    const action=screen.actions.find(item=>item.branch===branch)??screen.actions[0];
    assert.ok(action,`${missionId}/${taskId}/${screen.id}`);
    const result=applyReviewAction(state,{commandId:`${missionId}-${serial++}`,taskId,screenId:screen.id,actionId:action.id,expectedRevision:state.revision});
    assert.equal(result.accepted,true,`${missionId}/${taskId}/${screen.id}`);
    state=result.state;
    assert.ok(serial<100,'flow must terminate');
  }
  assert.equal(state.step,CLIENT_REVIEW_MISSIONS.find(m=>m.id===missionId).taskIds.length);
  assert.deepEqual(restoreReviewProgress(JSON.stringify(state),missionId),state);
  return state;
}

test('historical projection follows the same six mandatory mission routes',()=>{
  for(const mission of CLIENT_REVIEW_MISSIONS) {
    const branches=mission.branchTaskIds.length?mission.branchTaskIds:[null];
    for(const branch of branches){
      const state=runMission(mission.id,branch);
      if(branch) assert.equal(state.branch,branch);
      if(mission.id==='id'||mission.id==='benefit-test'||mission.id==='blogger') assert.equal(state.skipped.length,0,mission.id);
      if(mission.id==='communication') assert.deepEqual(state.skipped,['communication.reaction','communication.story']);
      if(mission.id.includes('business')) assert.deepEqual(state.skipped,mission.taskIds);
    }
  }
});

test('duplicate, stale screen and stale revision cannot award an extra result',()=>{
  let state=newReviewProgress('id');
  const command={commandId:'first',taskId:'id.create',screenId:'start',actionId:'digital-id.create-id.start.action-1',expectedRevision:0};
  const accepted=applyReviewAction(state,command);assert.equal(accepted.accepted,true);state=accepted.state;
  assert.equal(applyReviewAction(state,command).duplicate,true);
  assert.equal(applyReviewAction(state,{...command,commandId:'new'}).reason,'stale-revision');
  assert.equal(applyReviewAction(state,{...command,commandId:'new',expectedRevision:1}).reason,'stale-screen');
  assert.equal(state.completed.length,0);
});

test('test business starts with sector and does not receive ID completion',()=>{
  assert.equal(taskAt(newReviewProgress('business-test')),'business.sector');
  const state=runMission('business-test','business.miniapp');
  assert.equal(state.answers.some(answer=>answer.taskId==='id.create'),false);
  assert.equal(state.completed.length,0);
});
