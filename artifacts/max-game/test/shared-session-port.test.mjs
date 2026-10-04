import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHANNEL_CATALOG as catalog} from '../src/content/channel-catalog.mjs';
import {createSessionApplication, createLocalSessionPort} from '../src/application/session-port.mjs';
import {createMemoryPersistencePort} from '../src/application/memory-persistence.mjs';

let serial = 0;
const options = sessionId => ({sessionId, taskId:catalog.taskId, contentRevision:catalog.contentRevision});
const app = (persistence = createMemoryPersistencePort(), extra = {}) => createSessionApplication({catalogs:[catalog], persistence, ...extra});
function command(snapshot, actionId, overrides = {}) {
  const s = snapshot.state;
  return {schemaVersion:1, type:'ACT', commandId:`request-${++serial}`, sessionId:s.sessionId,
    contentRevision:s.contentRevision, missionId:s.missionId, taskId:s.taskId,
    screenId:s.screenId, expectedRevision:s.revision, actionId, ...overrides};
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return {promise, resolve}; };

test('SessionPort creates isolated sessions and projects renderer-independent content', async () => {
  const service = createLocalSessionPort({catalogs:[catalog]});
  const first = await service.createSession(options('first'));
  await service.createSession(options('second'));
  assert.equal(first.view.instruction.informational, true);
  assert.equal(first.view.device.kind, 'phone');
  assert.equal(first.view.actions[0].actionId, 'channel.open-create-menu');
  assert.deepEqual(first.view.actions[0].rect, [308, 54, 48, 48]);
  assert.equal(Object.hasOwn(first.view.actions[0], 'outcome'), false);
  assert.equal(first.view.prepareNext[0].assetId, 'client.frame-91516');
  assert.deepEqual(first.layouts, {});
  assert.equal(Object.hasOwn(first.state, 'layouts'), false);
  assert.equal(Object.hasOwn(first, 'receipts'), false);
  await service.sendCommand(command(first, 'channel.open-create-menu'));
  assert.equal((await service.getSnapshot('second')).state.revision, 0);
  await assert.rejects(service.createSession(options('first')), {code:'SESSION_EXISTS'});
  await assert.rejects(service.getSnapshot('missing'), {code:'SESSION_NOT_FOUND'});
  await assert.rejects(service.createSession({...options('third'), contentRevision:'unknown'}), {code:'CONTENT_UNAVAILABLE'});
  await service.close();
});

test('concurrent taps serialize: one transition and a stale-revision refusal', async () => {
  const service = app(), start = await service.createSession(options('rapid'));
  const first = command(start, 'channel.open-create-menu'), second = command(start, 'channel.open-create-menu');
  const replies = await Promise.all([service.sendCommand(first), service.sendCommand(second)]);
  assert.equal(replies[0].reply.ok, true);
  assert.equal(replies[1].reply.code, 'REVISION_CONFLICT');
  assert.equal((await service.getSnapshot('rapid')).state.revision, 1);
  await service.close();
});

test('concurrent identical retry acknowledges once and does not republish effects', async () => {
  const service = app(), start = await service.createSession(options('retry'));
  const events = [], unsubscribe = await service.subscribe('retry', event => events.push(event));
  const input = command(start, 'channel.open-create-menu');
  const [a, b] = await Promise.all([service.sendCommand(input), service.sendCommand(input)]);
  assert.equal(a.duplicate, false); assert.equal(b.duplicate, true);
  assert.deepEqual(a.reply, b.reply);
  assert.deepEqual(events.map(e => e.snapshot.state.revision), [0, 1]);
  unsubscribe();
  await service.close();
});

test('historical receipt is accompanied by the current snapshot, preventing a retry rollback', async () => {
  const service = app(), start = await service.createSession(options('current'));
  const input = command(start, 'channel.open-create-menu');
  const first = await service.sendCommand(input);
  await service.sendCommand(command(first.snapshot, 'channel.choose-create'));
  const retry = await service.sendCommand(input);
  assert.equal(retry.reply.snapshot.revision, 1);
  assert.equal(retry.snapshot.state.revision, 2);
  assert.equal(retry.snapshot.view.screenId, 'blogger.channel.name');
  await service.close();
});

test('commit gates notification, response and reads of confirmed state', async () => {
  const memory = createMemoryPersistencePort(), started = deferred(), release = deferred();
  const service = app({...memory, async commit(...args) { started.resolve(); await release.promise; return memory.commit(...args); }});
  const start = await service.createSession(options('slow'));
  const events = []; await service.subscribe('slow', event => events.push(event));
  let answered = false;
  const sending = service.sendCommand(command(start, 'channel.open-create-menu')).then(result => { answered = true; return result; });
  await started.promise;
  assert.equal(answered, false); assert.equal(events.length, 1);
  assert.equal((await memory.load('slow')).record.game.state.revision, 0);
  const reading = service.getSnapshot('slow');
  release.resolve();
  const result = await sending;
  assert.equal(result.reply.ok, true);
  assert.equal((await reading).state.revision, 1);
  assert.deepEqual(events.map(e => e.snapshot.state.revision), [0, 1]);
  await service.close();
});

test('failure before commit preserves old state, queue recovers, and retry may succeed', async () => {
  const memory = createMemoryPersistencePort(); let fail = true;
  const service = app({...memory, async commit(...args) { if (fail) throw Error('storage unavailable'); return memory.commit(...args); }});
  const start = await service.createSession(options('failed'));
  const events = []; await service.subscribe('failed', event => events.push(event));
  const input = command(start, 'channel.open-create-menu');
  await assert.rejects(service.sendCommand(input), {code:'STORAGE_UNAVAILABLE'});
  assert.equal((await service.getSnapshot('failed')).state.revision, 0);
  assert.equal(events.length, 1);
  fail = false;
  assert.equal((await service.sendCommand(input)).snapshot.state.revision, 1);
  await service.close();
});

test('commit followed by lost acknowledgement restores and retries without a second write', async () => {
  const memory = createMemoryPersistencePort(); let writes = 0;
  const service = app({...memory, async commit(...args) { writes++; await memory.commit(...args); throw Error('acknowledgement lost'); }});
  const start = await service.createSession(options('lost'));
  const input = command(start, 'channel.open-create-menu');
  await assert.rejects(service.sendCommand(input), {code:'STORAGE_UNAVAILABLE'});
  const retry = await service.sendCommand(input);
  assert.equal(retry.duplicate, true); assert.equal(retry.snapshot.state.revision, 1);
  assert.equal(writes, 1);
  const restarted = app(memory);
  const snapshot = await restarted.getSnapshot('lost');
  assert.equal(snapshot.state.screenId, 'blogger.channel.menu');
  assert.equal((await restarted.sendCommand(input)).duplicate, true);
  await service.close(); await restarted.close();
});

test('compare-and-swap stops another writer from overwriting accepted progress', async () => {
  const memory = createMemoryPersistencePort(), a = app(memory), b = app(memory);
  const start = await a.createSession(options('cas'));
  await b.getSnapshot('cas');
  const first = await a.sendCommand(command(start, 'channel.open-create-menu'));
  const stale = await b.sendCommand(command(start, 'channel.open-create-menu'));
  assert.equal(stale.reply.code, 'STORE_CONFLICT');
  assert.equal(stale.snapshot.state.revision, 1);
  assert.equal((await memory.load('cas')).record.game.state.revision, first.snapshot.state.revision);
  await a.close(); await b.close();
});

test('an invalid storage acknowledgement cannot publish unconfirmed progress', async () => {
  const memory = createMemoryPersistencePort();
  const service = app({...memory, async commit() { return undefined; }});
  const start = await service.createSession(options('invalid-ack'));
  const events = []; await service.subscribe('invalid-ack', event => events.push(event));
  await assert.rejects(service.sendCommand(command(start, 'channel.open-create-menu')), {code:'STORAGE_UNAVAILABLE'});
  assert.equal(events.length, 1);
  assert.equal((await service.getSnapshot('invalid-ack')).state.revision, 0);
  await service.close();
});

test('observer failures do not fail committed commands, other listeners or future commands', async () => {
  const errors = [], events = [], service = app(undefined, {onObserverError:e => errors.push(e.message)});
  const start = await service.createSession(options('observers'));
  await service.subscribe('observers', () => { throw Error('broken listener'); });
  await service.subscribe('observers', async () => { throw Error('broken async listener'); });
  const off = await service.subscribe('observers', e => events.push(e));
  const result = await service.sendCommand(command(start, 'channel.open-create-menu'));
  assert.equal(result.reply.ok, true); assert.equal(events.length, 2);
  assert.ok(errors.includes('broken listener')); assert.ok(errors.includes('broken async listener'));
  off();
  await service.sendCommand(command(result.snapshot, 'channel.choose-create'));
  assert.equal(events.length, 2);
  await service.close();
});

test('one blocked session does not block another; queued command input is captured immediately', async () => {
  const memory = createMemoryPersistencePort(), started = deferred(), release = deferred();
  const service = app({...memory, async commit(id, ...args) { if (id === 'blocked') { started.resolve(); await release.promise; } return memory.commit(id, ...args); }});
  const a = await service.createSession(options('blocked')), b = await service.createSession(options('free'));
  const input = command(a, 'channel.open-create-menu');
  const sending = service.sendCommand(input);
  input.actionId = 'channel.complete';
  await started.promise;
  assert.equal((await service.sendCommand(command(b, 'channel.open-create-menu'))).reply.ok, true);
  release.resolve();
  assert.equal((await sending).snapshot.state.screenId, 'blogger.channel.menu');
  await service.close();
});

test('close rejects queued operations, completes an in-flight write and emits no late event', async () => {
  const memory = createMemoryPersistencePort(), started = deferred(), release = deferred();
  const service = app({...memory, async commit(...args) { started.resolve(); await release.promise; return memory.commit(...args); }});
  const start = await service.createSession(options('close'));
  const events = []; await service.subscribe('close', event => events.push(event));
  const sending = service.sendCommand(command(start, 'channel.open-create-menu'));
  await started.promise;
  const queued = service.getSnapshot('close');
  const rejected = assert.rejects(queued, {code:'APPLICATION_CLOSED'});
  const closing = service.close();
  release.resolve();
  assert.equal((await sending).reply.ok, true);
  await rejected; await closing;
  assert.equal(events.length, 1);
  await assert.rejects(service.getSnapshot('close'), {code:'APPLICATION_CLOSED'});
  assert.equal((await memory.load('close')).record.game.state.revision, 1);
});

test('close during subscription load cannot resurrect a callback or observer', async () => {
  const memory = createMemoryPersistencePort(), setup = app(memory);
  await setup.createSession(options('loading')); await setup.close();
  const started = deferred(), release = deferred(), events = [];
  const service = app({...memory, async load(...args) { started.resolve(); await release.promise; return memory.load(...args); }});
  const subscribing = service.subscribe('loading', event => events.push(event));
  const rejected = assert.rejects(subscribing, {code:'APPLICATION_CLOSED'});
  await started.promise;
  const closing = service.close(); release.resolve();
  await rejected; await closing;
  assert.deepEqual(events, []);
});

test('invalid saved state never falls back to a fresh/completed session', async () => {
  const memory = createMemoryPersistencePort(), setup = app(memory);
  await setup.createSession(options('invalid')); await setup.close();
  const saved = await memory.load('invalid');
  saved.record.game.state.status = 'completed'; saved.record.game.state.completion = {taskId:catalog.taskId, commandId:'fake', revision:0};
  await memory.commit('invalid', saved.version, saved.record);
  const service = app(memory);
  await assert.rejects(service.getSnapshot('invalid'), {code:'INVALID_SAVED_SESSION'});
  assert.equal((await memory.load('invalid')).record.game.state.status, 'completed');
  await service.close();
});

test('public descriptor carries common annotations and completed task has no active buttons', async () => {
  const service = app(); let snapshot = await service.createSession(options('public'));
  const path = ['channel.open-create-menu','channel.choose-create','channel.fill-name-example','channel.create','channel.choose-public','channel.use-new-link'];
  for (const action of path) snapshot = (await service.sendCommand(command(snapshot, action))).snapshot;
  assert.equal(snapshot.view.device.annotations[0].text, 'Публичный канал создан');
  assert.deepEqual(snapshot.view.device.annotations[0].rect, [7.2,106,345.6,42]);
  for (const action of ['channel.fill-link-example','channel.save-public-link','channel.skip-invites','channel.complete']) snapshot = (await service.sendCommand(command(snapshot, action))).snapshot;
  assert.deepEqual(snapshot.view.actions, []); assert.deepEqual(snapshot.view.prepareNext, []);
  await service.close();
});

test('catalog registration, snapshots and memory records do not expose mutable authority', async () => {
  const input = structuredClone(catalog), memory = createMemoryPersistencePort();
  const service = createSessionApplication({catalogs:[input], persistence:memory});
  input.screens['blogger.channel.chats'].instruction = 'changed after registration';
  const snapshot = await service.createSession(options('immutable'));
  assert.equal(snapshot.view.instruction.text, catalog.screens['blogger.channel.chats'].instruction);
  assert.throws(() => { snapshot.state.status = 'completed'; }, TypeError);
  assert.throws(() => { snapshot.view.actions[0].rect[0] = 0; }, TypeError);
  const saved = await memory.load('immutable'); saved.record.game.state.status = 'completed';
  assert.equal((await memory.load('immutable')).record.game.state.status, 'active');
  assert.throws(() => createSessionApplication({catalogs:[catalog]}), /PersistencePort/);
  assert.throws(() => createSessionApplication({catalogs:[catalog,catalog], persistence:memory}), /Duplicate catalog/);
  await service.close();
});

test('application modules have no renderer, DOM, network, timers or browser storage dependencies', () => {
  for (const name of ['session-port','view-descriptor','memory-persistence']) {
    const code = readFileSync(new URL(`../src/application/${name}.mjs`, import.meta.url), 'utf8');
    assert.doesNotMatch(code, /^import.*(?:content|site-game|three|node:)/m);
    assert.doesNotMatch(code, /\b(?:localStorage|document|window|requestAnimationFrame|fetch|setTimeout)\b/);
  }
});
