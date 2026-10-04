import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAssetAuditStore} from '../src/asset-audit/server-store.mjs';

const fixtureRoot = fileURLToPath(new URL('../../workspace/tests/', import.meta.url));
const stamp = '2026-10-03T12:00:00.000Z';
const screen = index => ({
  screenId: `screen-${index}`, assetId: `asset-${index}`,
  asset: {width: 400, height: 800, sha256: String(index).repeat(64)},
  actions: [{actionId: `action-${index}`, label: 'Далее', placement: 'hotspot', rect: [20, 600, 300, 60]}],
});
const catalog = {
  contentRevision: 'audit-fixture-v1',
  missions: [{missionId: 'mission-1', title: 'Миссия', tasks: [{taskId: 'task-1', title: 'Задание', screens: [screen(1), screen(2), screen(3)]}]}],
};
const record = (index = 1) => ({
  screenId: `screen-${index}`, assetId: `asset-${index}`, assetSha256: String(index).repeat(64),
  actionId: `action-${index}`, label: 'Далее', placement: 'hotspot', rect: [20, 600, 300, 60], reviewed: true, updatedAt: stamp,
});
const setting = (index, enabled = true, final = false) => ({
  taskId: 'task-1', screenId: `screen-${index}`, assetId: `asset-${index}`,
  assetSha256: String(index).repeat(64), enabled, final, updatedAt: stamp,
});
const document = (overrides = {}) => ({schemaVersion: 2, contentRevision: catalog.contentRevision, records: [record()], screens: [], ...overrides});

async function fixture(t) {
  await fs.mkdir(fixtureRoot, {recursive: true});
  const directory = await fs.mkdtemp(path.join(fixtureRoot, 'max-audit-store-'));
  t.after(async () => {
    const relative = path.relative(fixtureRoot, directory);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    await fs.rm(directory, {recursive: true, force: true});
  });
  const file = path.join(directory, 'data', 'audit.json');
  const catalogFile = path.join(directory, 'catalog.json');
  await fs.writeFile(catalogFile, JSON.stringify(catalog));
  const options = {file, catalogFile};
  return {...options, open: extra => createAssetAuditStore({...options, ...extra})};
}

test('real atomically write persists geometry and screen settings; a fresh store reads the same revision', async t => {
  const f = await fixture(t), store = f.open();
  assert.deepEqual(await store.read(), {...document({records: []}), revision: '0'});
  const input = document({screens: [setting(1, false), setting(3, true, true)]});
  const saved = await store.save({expectedRevision: '0', document: input});
  assert.match(saved.revision, /^[a-f0-9]{64}$/);
  assert.deepEqual(JSON.parse(await fs.readFile(f.file, 'utf8')), input);
  assert.deepEqual(await f.open().read(), saved);
  assert.deepEqual(saved.records[0].rect, [20, 600, 300, 60]);
});

test('subpixel rectangles remain positive and readable after durable normalization',async t=>{
 const f=await fixture(t),store=f.open(),r={...record(),rect:[399.999,799.999,.001,.001]};
 const saved=await store.save({expectedRevision:'0',document:document({records:[r]})});
 assert.deepEqual(saved.records[0].rect,[399.99,799.99,.01,.01]);
 assert.deepEqual(await f.open().read(),saved);
});

test('two simultaneous same-revision writes produce exactly one acknowledgement and one conflict', async t => {
  const f = await fixture(t), store = f.open();
  const alternatives = [document(), document({screens: [setting(2, false)]})];
  const results = await Promise.allSettled(alternatives.map(value => store.save({expectedRevision: '0', document: value})));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const rejected = results.find(r => r.status === 'rejected');
  assert.equal(rejected.reason.status, 409);
  const accepted = results.find(r => r.status === 'fulfilled').value;
  assert.deepEqual(await f.open().read(), accepted);
});

test('failed durable write leaves previous bytes and revision unchanged; subsequent save can recover', async t => {
  const f = await fixture(t), initial = await f.open().save({expectedRevision: '0', document: document()});
  const before = await fs.readFile(f.file);
  let calls = 0;
  const failed = f.open({write: async () => { calls++; throw Object.assign(Error('fixture disk full'), {code: 'ENOSPC'}); }});
  await assert.rejects(failed.save({expectedRevision: initial.revision, document: document({screens: [setting(2, false)]})}), {code: 'ENOSPC'});
  assert.equal(calls, 1);
  assert.deepEqual(await fs.readFile(f.file), before);
  assert.deepEqual(await failed.read(), initial);
  const recovered = await f.open().save({expectedRevision: initial.revision, document: document({screens: [setting(2, false)]})});
  assert.notEqual(recovered.revision, initial.revision);
});

test('corrupt persisted JSON fails closed for both read and save without replacing evidence', async t => {
  const f = await fixture(t);
  await fs.mkdir(path.dirname(f.file), {recursive: true});
  await fs.writeFile(f.file, '{broken JSON');
  const store = f.open();
  await assert.rejects(store.read(), {status: 409});
  await assert.rejects(store.save({expectedRevision: '0', document: document()}), {status: 409});
  assert.equal(await fs.readFile(f.file, 'utf8'), '{broken JSON');
});

test('foreign schema, content and asset identities are rejected before writing any file', async t => {
  const f = await fixture(t), store = f.open();
  const invalid = [
    document({schemaVersion: 77}),
    document({contentRevision: 'another-catalog'}),
    document({records: [{...record(), assetSha256: 'foreign'}]}),
    document({records: [{...record(), actionId: 'missing'}]}),
    document({screens: [{...setting(1), assetId: 'foreign'}]}),
    document({screens: [{...setting(1), taskId: 'another-task'}]}),
  ];
  for (const value of invalid) await assert.rejects(store.save({expectedRevision: '0', document: value}), {status: 400});
  await assert.rejects(fs.readFile(f.file), {code: 'ENOENT'});
  assert.equal((await store.read()).revision, '0');
});

test('disabled final, multiple task finals and disabling every screen are rejected atomically', async t => {
  const f = await fixture(t), store = f.open();
  const initial = await store.save({expectedRevision: '0', document: document()});
  const before = await fs.readFile(f.file);
  for (const screens of [
    [setting(1, false, true)],
    [setting(1, true, true), setting(2, true, true)],
    [setting(1, false), setting(2, false), setting(3, false)],
  ]) {
    await assert.rejects(store.save({expectedRevision: initial.revision, document: document({screens})}), {status: 400});
    assert.deepEqual(await fs.readFile(f.file), before);
  }
});

test('schema 1 imports migrate to schema 2 while preserving geometry and original timestamp', async t => {
  const f = await fixture(t), store = f.open();
  const old = {schemaVersion: 1, contentRevision: catalog.contentRevision, records: [record()]};
  const saved = await store.save({expectedRevision: '0', document: old});
  assert.equal(saved.schemaVersion, 2);
  assert.deepEqual(saved.screens, []);
  assert.deepEqual(saved.records, old.records);
  assert.deepEqual(await f.open().read(), saved);
  // An existing v1 file is readable without implicit rewriting.
  await fs.writeFile(f.file, JSON.stringify(old));
  const loaded = await f.open().read();
  assert.equal(loaded.schemaVersion, 2);
  assert.deepEqual(loaded.records, old.records);
  assert.deepEqual(loaded.screens, []);
  assert.equal(JSON.parse(await fs.readFile(f.file, 'utf8')).schemaVersion, 1);
});

test('invalid on-disk catalog revision fails closed and stale clients cannot overwrite it', async t => {
  const f = await fixture(t), store = f.open();
  const saved = await store.save({expectedRevision: '0', document: document()});
  const before = await fs.readFile(f.file);
  await fs.writeFile(f.catalogFile, JSON.stringify({...catalog, contentRevision: 'new-catalog'}));
  await assert.rejects(store.read(), {status: 409});
  await assert.rejects(store.save({expectedRevision: saved.revision, document: document()}), {status: 409});
  assert.deepEqual(await fs.readFile(f.file), before);
});
