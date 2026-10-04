import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuditCatalog} from '../scripts/build-asset-audit.mjs';
import {MISSION_CATALOG} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';

test('audit includes exact installed missions, task order, all screens and all assets', () => {
  const audit = createAuditCatalog();
  assert.equal(audit.contentRevision, MISSION_CATALOG.contentRevision);
  assert.deepEqual(audit.counts, {missions: 4, tasks: 15, screens: 84, uniqueScreens: 84, assets: 103});
  assert.deepEqual(audit.missions.map(m => m.missionId), Object.keys(MISSION_CATALOG.missions));
  for (const mission of audit.missions) {
    assert.deepEqual(mission.tasks.map(t => t.taskId), MISSION_CATALOG.missions[mission.missionId].taskIds);
    for (const task of mission.tasks) {
      const original = MISSION_CATALOG.tasks[task.taskId];
      assert.deepEqual(task.screens.map(s => s.screenId), Object.keys(original.screens));
      for (const screen of task.screens) {
        assert.deepEqual(screen.actions, original.screens[screen.screenId].actions);
        assert.equal(screen.instruction, original.screens[screen.screenId].instruction);
        const {url, thumbnailUrl, ...asset} = screen.asset;
        assert.deepEqual(asset, MISSION_CATALOG.assets[screen.assetId]);
        assert.match(thumbnailUrl, /^thumbs\/[a-zA-Z0-9._-]+\.webp$/);
        assert.equal(screen.asset.url, `../${screen.asset.path}`);
      }
    }
  }
  assert.deepEqual(audit.assets.map(a => a.assetId), Object.keys(MISSION_CATALOG.assets));
});

test('audit projection keeps source immutable and shared task IDs consistent across missions', () => {
  const source = structuredClone(MISSION_CATALOG);
  source.missions.extra = {...source.missions.blogger, missionId: 'extra'};
  const audit = createAuditCatalog(source);
  const original = audit.missions[0].tasks[0].screens[0];
  const repeated = audit.missions.at(-1).tasks[0].screens[0];
  assert.equal(original.screenId, repeated.screenId);
  assert.deepEqual(original.actions, repeated.actions);
  original.actions[0].rect[0] = -1;
  assert.notEqual(source.tasks['blogger.channel'].screens[original.screenId].actions[0].rect[0], -1);
  assert.notEqual(repeated.actions[0].rect[0], -1);
  assert.equal(audit.counts.uniqueScreens, 84);
});

test('audit refuses missing task references and unsafe asset paths', () => {
  const source = structuredClone(MISSION_CATALOG);
  source.missions.blogger.taskIds.push('missing-task');
  assert.throws(() => createAuditCatalog(source), /Unknown audit task/);
  source.missions.blogger.taskIds.pop();
  source.assets[Object.keys(source.assets)[0]].path = 'assets/../../secrets/file';
  assert.throws(() => createAuditCatalog(source), /Invalid audit asset path/);
});
