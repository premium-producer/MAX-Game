import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {CLIENT_REVIEW_MISSIONS, CLIENT_REVIEW_TASKS, siteMenuMissions} from '../src/content/client-review.mjs';

test('six reviewed missions reference stable tasks and known client assets', async () => {
  assert.equal(CLIENT_REVIEW_MISSIONS.length, 6);
  assert.equal(siteMenuMissions.length, 6);
  for (const mission of CLIENT_REVIEW_MISSIONS) {
    assert.ok(mission.taskIds.length, mission.id);
    for (const id of [...mission.taskIds, ...mission.branchTaskIds]) assert.ok(CLIENT_REVIEW_TASKS[id], `${mission.id}: ${id}`);
  }
  for (const task of Object.values(CLIENT_REVIEW_TASKS)) {
    if (task.coverage !== 'complete') assert.ok(task.gap, task.taskId);
    for (const path of task.media) await access(new URL(`../public/${path}`, import.meta.url));
  }
});

test('client corrections: test business excludes ID, messages are sequential, stories and business remain incomplete', () => {
  const testBusiness = CLIENT_REVIEW_MISSIONS.find(m => m.id === 'business-test');
  assert.deepEqual(testBusiness.taskIds, ['business.sector', 'business.platform', 'business.channel', 'business.bot', 'business.miniapp']);
  assert.deepEqual(testBusiness.branchTaskIds, []);
  assert.ok(CLIENT_REVIEW_TASKS['communication.messages'].media.indexOf('assets/client-media/frame-74215.png') <
    CLIENT_REVIEW_TASKS['communication.messages'].media.indexOf('assets/client-media/frame-73633.png'));
  assert.equal(CLIENT_REVIEW_TASKS['communication.story'].coverage, 'partial');
  assert.equal(CLIENT_REVIEW_TASKS['communication.group'], undefined);
  assert.ok(Object.values(CLIENT_REVIEW_TASKS).filter(task => task.taskId.startsWith('business.')).every(task => task.device === 'pc'));
});
