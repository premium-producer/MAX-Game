import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { loadMissionCatalog, parseMissionCatalog, serializeMissionCatalog } from '../src/mission-config.mjs';
import { evaluateMission } from '../src/mission-evaluation.mjs';
import { deriveMissionFeedback, applyMissionFeedback } from '../src/mission-feedback.mjs';
import { routeCandidates } from './route-fixture.mjs';

const root = new URL('../public/', import.meta.url);
const catalog = await loadMissionCatalog('./config/missions/index.json', async p => ({ ok: true, json: async () => JSON.parse(await readFile(new URL(p, root), 'utf8')) }));

function fixture(policy, removedIndex) {
  const raw = serializeMissionCatalog(catalog);
  raw.missions[2].topology.paths[0].connection.policy = policy;
  const parsed = parseMissionCatalog(raw), mission = parsed.byNumber[3];
  // Wide physical fields isolate count validation from range in the three policies.
  const all = routeCandidates(mission).map(p => ({ ...p, signalRadius: 10 }));
  let placements = all.filter((_, i) => i !== removedIndex);
  const evaluate = (now = 1000) => {
    const nodes = {};
    ['endpoint:A', ...placements.map(p => p.id), 'endpoint:B'].forEach((id, i) => {
      nodes[id] = { x: 100 + 85 * i, y: 500, radius: 60, iconRadius: 20, eligible: true };
    });
    const network = evaluateMission(mission, placements, parsed.objectSettings, now, 700, { nodes });
    const events = deriveMissionFeedback({ mission, run: { placements }, network });
    return { network, events, visible: applyMissionFeedback(network, events) };
  };
  return { mission, all, evaluate, setPlacements: next => { placements = next; } };
}

test('mission 3: both bounded two-satellite runs are red and report the authored error in every mechanic', () => {
  for (const policy of ['geographicCorridor', 'screenProjected', 'hybridProjected']) {
    for (const removed of [2, 8]) {
      const f = fixture(policy, removed), result = f.evaluate();
      const ids = (removed === 2 ? [2, 3, 4] : [8, 9, 10]).filter(id => id !== removed + 1);
      const diagnostics = result.network.diagnostics.filter(d => d.reason === 'run-count');
      assert.deepEqual(diagnostics.map(d => d.node), ids, policy);
      assert.ok(diagnostics.every(d => d.expectedCount === 3 && d.actualCount === 2));
      assert.equal(result.events.find(e => e.kind === 'error')?.title, 'ДАННЫЕ НЕ ПЕРЕДАНЫ');
      assert.ok(ids.every(id => result.visible.states[id] === 'wrong'));
      assert.ok(result.visible.links.some(link => ids.includes(link.a) && ids.includes(link.b) && link.negative));
      assert.ok(f.all.filter(p => !ids.includes(p.id) && p.id !== removed + 1).every(p => result.visible.states[p.id] !== 'wrong'));
      assert.equal(result.network.complete, false);
      // Adding the third clears the count error immediately; color follows activation.
      f.all[removed].droppedAt = 1000;
      f.setPlacements(f.all);
      const waking = f.evaluate();
      assert.ok(!waking.events.some(e => e.kind === 'error'));
      assert.equal(waking.network.complete, false);
      const complete = f.evaluate(1700);
      assert.equal(complete.network.complete, true);
      assert.ok(f.all.every(p => complete.visible.states[p.id] === 'link'));
    }
  }
});

test('a satellite run still being built or waking does not report a count error', () => {
  for (const policy of ['geographicCorridor', 'screenProjected', 'hybridProjected']) {
    const f = fixture(policy, 8);
    // Remove the eastern gateway: the pair no longer has both authored boundaries.
    f.setPlacements(f.all.filter((_, i) => i !== 8 && i !== 6));
    assert.ok(!f.evaluate().network.diagnostics.some(d => d.reason === 'run-count'));
    const pair = f.all.filter((_, i) => i !== 8);
    pair.find(p => p.id === 10).droppedAt = 1000;
    f.setPlacements(pair);
    assert.ok(!f.evaluate().network.diagnostics.some(d => d.reason === 'run-count'));
    assert.ok(f.evaluate(1700).network.diagnostics.some(d => d.reason === 'run-count'));
  }
});
