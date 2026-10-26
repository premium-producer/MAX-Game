// Read-only audit of application modules. All mutable data goes to a temporary folder.
// These assertions document current defects, not the desired regression behavior.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { V5_MISSION_CATALOG } from '../../apps/max-game/source/client/src/journey-v5-backend.mjs';
import { createMissionSessionApplication } from '../../apps/max-game/source/client/src/application/mission-session.mjs';
import { createMemoryPersistencePort } from '../../apps/max-game/source/client/src/application/memory-persistence.mjs';
import { TASK_CLOCK_RULES_REVISION } from '../../apps/max-game/source/client/src/core/mission-core.mjs';
import { createWebGLSession } from '../../apps/max-game/source/client/src/application/webgl-session.mjs';
import { startProduction } from '../../apps/max-game/source/client/src/kdw-production.mjs';

const require = createRequire(import.meta.url);
const { DEFAULTS } = require('../../apps/STARTUP/tools/stand-settings.cjs');
const { createGameHub, createStelaRelay } = require('../../apps/STARTUP/tools/game-link.cjs');
const { Controller } = require('../../apps/stela/launcher/voice/controller.cjs');
const root = fileURLToPath(new URL('../../', import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdw-audit-'));
const results = [];
const policy = { production: true, revision: 'audit-policy', value: DEFAULTS };
const catalog = { ...V5_MISSION_CATALOG, contentRevision: V5_MISSION_CATALOG.contentRevision + '.audit', kdwProduction: policy };

async function driver(id) {
  let time = 1_000_000, serial = 0;
  const persistence = createMemoryPersistencePort();
  const make = () => createMissionSessionApplication({ catalog, persistence, now: () => time, missionRulesRevision: TASK_CLOCK_RULES_REVISION });
  const app = make(); await app.createSession({ sessionId: id });
  const snapshot = () => app.getSnapshot(id);
  const send = async (type, fields = {}) => {
    const s = (await snapshot()).state;
    const result = await app.sendCommand({ schemaVersion: 1, type, commandId: 'audit.' + ++serial, sessionId: id, contentRevision: catalog.contentRevision, expectedRevision: s.revision, ...fields });
    assert.equal(result.reply.ok, true, result.reply.code); return result;
  };
  await app.inputOwnerChanged(id, { active: true });
  await send('SELECT_MISSION', { missionId: 'business' });
  return { id, app, make, persistence, snapshot, send, get time() { return time; }, advance(ms) { time += ms; } };
}
function request(handler, url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = Readable.from([Buffer.from(JSON.stringify(payload))]);
    Object.assign(req, { url, method: 'POST', headers: { origin: 'http://127.0.0.1:1', 'content-type': 'application/json', ...headers } });
    const res = { destroyed: false, writableEnded: false, writeHead(status) { this.status = status; }, end(body) { resolve({ status: this.status, value: JSON.parse(body) }); } };
    try { assert.equal(handler.handle(req, res), true); } catch (error) { reject(error); }
  });
}
const inputFor = state => ({ schemaVersion: 1, gameId: state.gameId, voiceSessionId: state.sessionId, missionId: state.missionId, audience: state.audience, goal: state.goal, photo: null });
const source = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let relay;
try {
  // The production clock advances a result while the renderer explicitly isn't ready.
  const d = await driver('audit.result');
  await d.send('STAND_READY', { screenId: 'scan' });
  await d.app.handleContact(d.id, { contactId: 'palm', sequence: 0, type: 'down', inside: true });
  d.advance(800); await d.app.pollTime(d.id);
  await d.send('STAND_READY', { screenId: (await d.snapshot()).state.screenId });
  while ((await d.snapshot()).state.status === 'task') {
    const s = (await d.snapshot()).state;
    const screen = catalog.tasks[s.taskId].screens[s.screenId];
    await d.send('ACT', { taskId: s.taskId, screenId: s.screenId, actionId: screen.actions[0].actionId });
  }
  assert.equal((await d.snapshot()).state.screenId, 'business.platform.ready');
  const facade = createWebGLSession({ port: d.app, catalog, sessionId: d.id, initialOwnerActive: true });
  await facade.start();
  const realInterval = globalThis.setInterval, realClear = globalThis.clearInterval, realDocument = globalThis.document;
  let tick;
  globalThis.document = { addEventListener() {}, removeEventListener() {} };
  globalThis.setInterval = callback => { tick = callback; return 123; };
  globalThis.clearInterval = () => {};
  try {
    const stop = startProduction({ getSession: () => facade, ready: () => false });
    d.advance(900); tick();
    for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve));
    const s = (await d.snapshot()).state;
    assert.equal(s.taskId, 'business.channel');
    results.push({ id: 'AUD-03', observed: 'production advanced business.platform.ready after 900 ms despite ready=false', nextScreen: s.screenId });
    stop();
  } finally { globalThis.setInterval = realInterval; globalThis.clearInterval = realClear; globalThis.document = realDocument; }
  await facade.close();

  const stalled = await driver('audit.not-ready');
  stalled.advance(3600_000); await stalled.app.pollTime(stalled.id);
  const stuck = (await stalled.snapshot()).state;
  assert.equal(stuck.status, 'scan'); assert.equal(stuck.deadlineAt, null);
  results.push({ id: 'AUD-04', observed: 'scan stays active after one hour without STAND_READY', status: stuck.status, deadlineAt: stuck.deadlineAt });
  await stalled.app.close();

  let hubTime = Date.parse('2026-10-25T12:00:00Z');
  const hubRoot = path.join(temp, 'max'), relayRoot = path.join(temp, 'stela');
  const hub = createGameHub({ root: hubRoot, origin: 'http://127.0.0.1:1', production: true, now: () => hubTime });
  const c = new Controller(); let command = 0;
  const act = action => { c.ready(c.state.revision); const result = c.apply({ action }, c.state.revision, 'choice.' + ++command); assert.equal(result.accepted, true); };
  act('begin'); act('business'); act('skip-photo'); const first = inputFor(c.snapshot()); hub.ingest(first);
  hubTime += 100;
  act('back'); act('blogger'); act('skip-photo'); const second = inputFor(c.snapshot()); hub.ingest(second);
  assert.notEqual(first.gameId, second.gameId); assert.equal(hub.get(first.gameId).status, 'assigned'); assert.equal(hub.get(second.gameId).status, 'queued');
  results.push({ id: 'AUD-02', observed: 'choosing another mission in one voice session retains both assignments', statuses: [hub.get(first.gameId).status, hub.get(second.gameId).status], sameVisitorSession: first.voiceSessionId === second.voiceSessionId });

  fs.mkdirSync(path.join(relayRoot, 'data'), { recursive: true });
  fs.writeFileSync(path.join(relayRoot, 'data/game-link.local.json'), JSON.stringify({ gameOrigin: 'http://127.0.0.1:1', key: 'a'.repeat(64) }));
  hubTime += 100;
  const third = { ...second, gameId: randomUUID() };
  const authorization = { ...third, sessionId: third.voiceSessionId, hasPhoto: false };
  relay = createStelaRelay({ root: relayRoot, origin: 'http://127.0.0.1:1', authorize: () => authorization, now: () => hubTime, transport: async (_url, options) => ({ ok: true, json: async () => hub.ingest(JSON.parse(options.body)) }) });
  const payload = { gameId: third.gameId, revision: 1, photo: null };
  await request(relay, '/__kdw/link/submit', payload);
  for (let i = 0; i < 20; i++) { await relay.flush(); await new Promise(resolve => setImmediate(resolve)); }
  const before = await request(relay, '/__kdw/link/submit', payload);
  assert.equal(before.value.status, 'delivered'); assert.equal(before.value.receipt.status, 'queued');
  for (const id of [first.gameId, second.gameId]) {
    assert.equal(hub.active().gameId, id);
    const response = await request(hub, '/__kdw/link/games/' + id + '/progress', { gameId: id, revision: 1, runId: 1, status: 'menu', missionId: null, taskId: null, screenId: null, contentRevision: 'audit', endReason: 'qr' });
    assert.equal(response.status, 200);
  }
  assert.equal(hub.active().gameId, third.gameId);
  const after = await request(relay, '/__kdw/link/submit', payload);
  assert.equal(after.value.receipt.status, 'queued');
  results.push({ id: 'AUD-05', observed: 'delivery receipt remains queued after MAX assigns the visitor', actualStatus: hub.active().status, receiptStatus: after.value.receipt.status });
  hubTime += 3600_000;
  assert.equal(hub.active().gameId, third.gameId);
  results.push({ id: 'AUD-04-hub', observed: 'hub does not release assigned visitor after one hour without renderer progress' });
  relay.close(); relay = null;

  const clock = await driver('audit.clock'); clock.advance(-5000);
  let code; try { await clock.send('STAND_READY', { screenId: 'scan' }); } catch (e) { code = e.message; }
  assert.match(code, /INVALID_TRUSTED_TIME/);
  const restarted = clock.make(); await assert.rejects(() => restarted.getSnapshot(clock.id), { code: 'INVALID_SAVED_CLOCK' });
  results.push({ id: 'AUD-08', observed: '5-second backward wall-clock step rejects command and session restore', command: 'INVALID_TRUSTED_TIME', restore: 'INVALID_SAVED_CLOCK' });
  await clock.app.close(); await restarted.close();

  const omni = source('apps/stela/source/artifacts/stella-prototype/src/features/voice/OmniPrototype.tsx');
  const hook = source('apps/stela/source/artifacts/stella-prototype/src/features/voice/use-omni-prototype.ts');
  assert.ok(!omni.includes('voice.error')); assert.ok(hook.includes("setStatus('offline')"));
  results.push({ id: 'AUD-01', evidence: 'static cross-check only', observed: 'offline error is set by hook but OmniPrototype does not render voice.error; available screen buttons continue sending through closed socket' });
  console.log(JSON.stringify({ date: '2026-10-25', mode: 'source modules; in-memory session; temporary disk; mocked HTTP; no browser/hardware/network', checks: results }, null, 2));
} finally { relay?.close(); fs.rmSync(temp, { recursive: true, force: true }); }
