import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, readFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {createSqlitePersistencePort} from './sqlite-persistence.mjs';
import {CHANNEL_CATALOG as catalog} from '../../max-game/src/content/channel-catalog.mjs';
import {createSessionApplication} from '../../max-game/src/application/session-port.mjs';

const root = resolve('artifacts/workspace/tests/max-shared-sqlite-20261002');
mkdirSync(root, {recursive:true});
const run = mkdtempSync(join(root, 'run-'));
let serial = 0;
const path = label => join(run, `${label}-${++serial}.sqlite`);
const record = revision => ({schemaVersion:1, game:{state:{revision}, receipts:[{commandId:`c-${revision}`}]}, layouts:{}});
const open = databasePath => createSqlitePersistencePort({databasePath});
const options = sessionId => ({sessionId, taskId:catalog.taskId, contentRevision:catalog.contentRevision});
const application = persistence => createSessionApplication({catalogs:[catalog], persistence});
function command(snapshot, actionId) {
  const state = snapshot.state;
  return {schemaVersion:1, type:'ACT', commandId:`cmd-${++serial}`, sessionId:state.sessionId,
    contentRevision:state.contentRevision, missionId:state.missionId, taskId:state.taskId,
    screenId:state.screenId, expectedRevision:state.revision, actionId};
}

test('explicit absolute file required; no implicit volatile fallback', async () => {
  await assert.rejects(createSqlitePersistencePort(), {code:'INVALID_DATABASE_PATH'});
  await assert.rejects(createSqlitePersistencePort({databasePath:':memory:'}), {code:'INVALID_DATABASE_PATH'});
  await assert.rejects(createSqlitePersistencePort({databasePath:path('bad-timeout'), busyTimeoutMs:Infinity}), {code:'INVALID_BUSY_TIMEOUT'});
});

test('create/load/commit persist snapshots and receipts across worker restart', async () => {
  const db = path('restart');
  let storage = await open(db);
  try {
    assert.equal(await storage.load('one'), null);
    assert.equal(await storage.create('one', record(0)), 0);
    assert.equal(await storage.commit('one', 0, record(1)), 1);
    await assert.rejects(storage.create('one', record(0)), {code:'SESSION_EXISTS'});
    await assert.rejects(storage.commit('absent', 0, record(1)), {code:'SESSION_NOT_FOUND'});
  } finally { await storage.close(); }
  storage = await open(db);
  try { assert.deepEqual(await storage.load('one'), {version:1, record:record(1)}); }
  finally { await storage.close(); }
});

test('two storage workers cannot both overwrite the same expected version', async () => {
  const db = path('writers'), first = await open(db), second = await open(db);
  try {
    await first.create('shared', record(0));
    const writes = await Promise.allSettled([first.commit('shared', 0, record(1)), second.commit('shared', 0, record(2))]);
    assert.equal(writes.filter(write => write.status === 'fulfilled').length, 1);
    assert.equal(writes.find(write => write.status === 'rejected').reason.code, 'STORE_CONFLICT');
    const saved = await second.load('shared');
    assert.equal(saved.version, 1);
    assert.ok([1, 2].includes(saved.record.game.state.revision));
    assert.equal(saved.record.game.receipts[0].commandId, `c-${saved.record.game.state.revision}`);
  } finally { await Promise.all([first.close(), second.close()]); }
});

test('invalid JSON and invalid version cannot change a committed record', async () => {
  const storage = await open(path('invalid'));
  try {
    await storage.create('one', record(0));
    for (const invalid of [{...record(1), hidden:undefined}, {...record(1), number:NaN}, {...record(1), object:new Date()}, {...record(1), array:new Array(2)}]) {
      await assert.rejects(storage.commit('one', 0, invalid), {code:'INVALID_RECORD'});
    }
    const cycle = record(1); cycle.self = cycle;
    await assert.rejects(storage.commit('one', 0, cycle), {code:'INVALID_RECORD'});
    await assert.rejects(storage.commit('one', -1, record(1)), {code:'INVALID_STORE_VERSION'});
    await assert.rejects(storage.load('../invalid'), {code:'INVALID_SESSION_ID'});
    assert.deepEqual(await storage.load('one'), {version:0, record:record(0)});
  } finally { await storage.close(); }
});

test('input/output are isolated copies and future mission record fields are preserved', async () => {
  const storage = await open(path('copy'));
  try {
    const input = {...record(0), game:{mission:{missionId:'digital-id', steps:['a','b']}, receipts:[]}, layouts:{base:{x:5,y:8}}};
    const expected = structuredClone(input), writing = storage.create('one', input);
    input.game.mission.steps.push('mutated');
    await writing;
    const loaded = await storage.load('one');
    assert.deepEqual(loaded.record, expected);
    loaded.record.layouts.base.x = 90;
    assert.deepEqual((await storage.load('one')).record, expected);
  } finally { await storage.close(); }
});

test('close drains accepted writes and rejects new operations', async () => {
  const db = path('close'), storage = await open(db);
  await storage.create('one', record(0));
  const commit = storage.commit('one', 0, record(1)), closing = storage.close();
  assert.equal(storage.close(), closing);
  await assert.rejects(storage.load('one'), {code:'PERSISTENCE_CLOSED'});
  assert.equal(await commit, 1);
  await closing;
  const restored = await open(db);
  try { assert.deepEqual(await restored.load('one'), {version:1, record:record(1)}); }
  finally { await restored.close(); }
});

test('online backup is queued, restores without WAL companions and cannot overwrite', async () => {
  const db = path('original'), destination = path('backup'), storage = await open(db);
  try {
    await storage.create('one', record(0));
    const first = storage.commit('one', 0, record(1));
    const backing = storage.backup(destination);
    const next = storage.commit('one', 1, record(2));
    await Promise.all([first, backing, next]);
    await assert.rejects(storage.backup(db), {code:'INVALID_BACKUP_PATH'});
    const before = readFileSync(destination);
    await assert.rejects(storage.backup(destination), {code:'BACKUP_EXISTS'});
    assert.deepEqual(readFileSync(destination), before);
    const restored = await open(destination);
    try { assert.deepEqual(await restored.load('one'), {version:1, record:record(1)}); }
    finally { await restored.close(); }
    assert.equal((await storage.load('one')).version, 2);
  } finally { await storage.close(); }
});

test('both channel branches recover confirmed completion and repeat without second credit', async () => {
  const prefix = ['channel.open-create-menu', 'channel.choose-create', 'channel.fill-name-example', 'channel.create'];
  for (const branch of ['private', 'public']) {
    const db = path(branch), storage = await open(db), service = application(storage);
    const choices = branch === 'private' ? ['channel.choose-private', 'channel.continue-private'] : ['channel.choose-public', 'channel.use-new-link', 'channel.fill-link-example', 'channel.save-public-link'];
    let snapshot = await service.createSession(options(branch)), accepted;
    try {
      for (const action of [...prefix, ...choices, 'channel.skip-invites', 'channel.complete']) {
        accepted = command(snapshot, action);
        snapshot = (await service.sendCommand(accepted)).snapshot;
      }
      assert.equal(snapshot.state.status, 'completed');
    } finally { await service.close(); await storage.close(); }
    const restoredStorage = await open(db), restored = application(restoredStorage);
    try {
      const reply = await restored.sendCommand(accepted);
      assert.equal(reply.duplicate, true);
      assert.deepEqual(reply.snapshot, snapshot);
      assert.equal(reply.snapshot.state.answers['channel-type'], branch);
      assert.equal((await restoredStorage.load(branch)).version, snapshot.state.revision);
    } finally { await restored.close(); await restoredStorage.close(); }
  }
});

test('lost response after actual SQLite commit restores and deduplicates command retry', async () => {
  const storage = await open(path('lost-response'));
  let drop = true;
  const unreliable = {...storage, async commit(...args) {
    const version = await storage.commit(...args);
    if (drop) { drop = false; throw new Error('Response lost after commit'); }
    return version;
  }};
  const service = application(unreliable);
  try {
    const initial = await service.createSession(options('retry')), input = command(initial, 'channel.open-create-menu');
    await assert.rejects(service.sendCommand(input), {code:'STORAGE_UNAVAILABLE'});
    const retry = await service.sendCommand(input);
    assert.equal(retry.duplicate, true);
    assert.equal(retry.snapshot.state.revision, 1);
    const saved = await storage.load('retry');
    assert.equal(saved.version, 1);
    assert.equal(saved.record.game.receipts.length, 1);
  } finally { await service.close(); await storage.close(); }
});

test('SQLite is imported exclusively in storage worker', () => {
  const host = readFileSync(new URL('./sqlite-persistence.mjs', import.meta.url), 'utf8');
  const worker = readFileSync(new URL('./sqlite-worker.mjs', import.meta.url), 'utf8');
  assert.equal(host.includes('node:sqlite'), false);
  assert.ok(worker.includes("await import('node:sqlite')"));
  assert.ok(worker.includes('PRAGMA synchronous=FULL'));
});

test('newer database schema refuses initialization without rewriting its metadata', async () => {
  const {DatabaseSync} = await import('node:sqlite');
  const db = path('newer-schema'), original = new DatabaseSync(db);
  original.exec('PRAGMA user_version=99; CREATE TABLE future_data (value TEXT); INSERT INTO future_data VALUES (\'keep\');');
  original.close();
  await assert.rejects(open(db), {code:'UNSUPPORTED_STORAGE_SCHEMA'});
  const restored = new DatabaseSync(db);
  try {
    assert.equal(restored.prepare('PRAGMA user_version').get().user_version, 99);
    assert.equal(restored.prepare('SELECT value FROM future_data').get().value, 'keep');
    assert.equal(restored.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='max_sessions'").get().n, 0);
  } finally { restored.close(); }
});

test('failed open and incompatible table fail factory before a usable port is exposed', async () => {
  await assert.rejects(open(run), error => typeof error.code === 'string');
  const {DatabaseSync} = await import('node:sqlite');
  const db = path('wrong-table'), incompatible = new DatabaseSync(db);
  incompatible.exec('PRAGMA user_version=1; CREATE TABLE max_sessions (session_id TEXT PRIMARY KEY, wrong TEXT);');
  incompatible.close();
  await assert.rejects(open(db), error => /record_json|version/.test(error.message));
});

test('versioned mission records are durable without assuming task-only game envelope', async () => {
  const db = path('mission-record'), storage = await open(db);
  const missionRecord = {schemaVersion:2, mission:{state:{missionId:'blogger',revision:0},receipts:[]}, layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:100};
  try {
    await storage.create('mission',missionRecord);
    const next=structuredClone(missionRecord);next.mission.state.revision=1;next.mission.receipts.push({commandId:'act'});
    assert.equal(await storage.commit('mission',0,next),1);
    await assert.rejects(storage.create('unknown-version',{...next,schemaVersion:99}),{code:'INVALID_RECORD'});
    assert.deepEqual((await storage.load('mission')).record,next);
  } finally { await storage.close(); }
  const reopened=await open(db);
  try {assert.equal((await reopened.load('mission')).record.mission.state.revision,1);}
  finally {await reopened.close();}
});

test('immutable import archive survives restart and cannot reuse ID for different source', async () => {
  const db=path('archive'),destination=path('archive-backup'),storage=await open(db);
  const artifact={schemaVersion:1,source:{raw:'Original JSON',answers:{second:2,first:1}}};
  try {
    assert.equal(await storage.saveOnce('import-one',artifact),'created');
    assert.equal(await storage.saveOnce('import-one',{source:{answers:{first:1,second:2},raw:'Original JSON'},schemaVersion:1}),'existing-identical');
    await assert.rejects(storage.saveOnce('import-one',{...artifact,source:{raw:'different'}}),{code:'IMPORT_ID_REUSED'});
    await storage.backup(destination);
  } finally {await storage.close();}
  const reopened=await open(db);
  try {assert.equal(await reopened.saveOnce('import-one',artifact),'existing-identical');}
  finally {await reopened.close();}
  const backup=await open(destination);
  try {assert.equal(await backup.saveOnce('import-one',artifact),'existing-identical');}
  finally {await backup.close();}
});

test('actual explicit import persists archive and confirmed target, retry survives worker restart', async () => {
  const {createExplicitImportArtifact,createSharedSessionExport,applyExplicitImport}=await import('../../max-game/src/migration/explicit-import.mjs');
  const {createGameModel,dispatchGameCommand}=await import('../../max-game/src/core/game-core.mjs');
  const source=createGameModel(catalog,{sessionId:'source'}),s=source.state;
  const moved=dispatchGameCommand(catalog,source,{schemaVersion:1,type:'ACT',commandId:'source-command',sessionId:s.sessionId,contentRevision:s.contentRevision,missionId:s.missionId,taskId:s.taskId,screenId:s.screenId,expectedRevision:s.revision,actionId:'channel.open-create-menu'}).model;
  const sourceExport=createSharedSessionExport({record:{schemaVersion:1,game:moved,layouts:{}},catalogs:[catalog]});
  const artifact=createExplicitImportArtifact({sourceProfileId:'chosen-source',source:sourceExport,targetSessionId:'target',catalogs:[catalog],taskId:catalog.taskId,contentRevision:catalog.contentRevision});
  const db=path('real-import');let storage=await open(db);
  try {
    const first=await applyExplicitImport({artifact,catalogs:[catalog],persistence:storage,archivePort:storage});
    assert.equal(first.created,true);
    assert.equal(first.record.game.state.screenId,'blogger.channel.menu');
    assert.equal(await storage.getImportTarget('target'),'target');
  } finally {await storage.close();}
  storage=await open(db);
  try {
    const retry=await applyExplicitImport({artifact,catalogs:[catalog],persistence:storage,archivePort:storage});
    assert.equal(retry.duplicate,true);
    assert.deepEqual(retry.record,artifact.record);
    assert.equal(await storage.getImportTarget('target'),'target');
    assert.equal((await storage.load('target')).version,0);
    await assert.rejects(storage.saveOnce('target',{...artifact,reason:'different'}),{code:'IMPORT_ID_REUSED'});
  } finally {await storage.close();}
});

test('foreign identical empty target stays a conflict on every import retry without a target claim', async () => {
  const {createExplicitImportArtifact,applyExplicitImport}=await import('../../max-game/src/migration/explicit-import.mjs');
  const artifact=createExplicitImportArtifact({sourceProfileId:'unproven-legacy',source:{numericStage:9},targetSessionId:'foreign',catalogs:[catalog],taskId:catalog.taskId,contentRevision:catalog.contentRevision});
  const db=path('foreign-import');let storage=await open(db);
  try {
    await storage.create('foreign',artifact.record);
    for(let i=0;i<2;i++)await assert.rejects(applyExplicitImport({artifact,catalogs:[catalog],persistence:storage,archivePort:storage}),{code:'IMPORT_TARGET_CONFLICT'});
    assert.equal(await storage.getImportTarget('foreign'),null);
    assert.deepEqual((await storage.load('foreign')).record,artifact.record);
  } finally {await storage.close();}
  storage=await open(db);
  try {
    await assert.rejects(applyExplicitImport({artifact,catalogs:[catalog],persistence:storage,archivePort:storage}),{code:'IMPORT_TARGET_CONFLICT'});
    assert.equal(await storage.getImportTarget('foreign'),null);
  } finally {await storage.close();}
});

test('atomic imported creation requires matching archive and commits a durable claim alongside the target', async () => {
  const storage=await open(path('atomic-import')),initial=record(0);
  const artifact={format:'max-explicit-import',targetSessionId:'one',record:initial,archive:{old:'source'}};
  try {
    await assert.rejects(storage.createImported('one',initial,{importId:'source'}),{code:'IMPORT_ARCHIVE_NOT_FOUND'});
    assert.equal(await storage.load('one'),null);
    assert.equal(await storage.getImportTarget('source'),null);
    await storage.saveOnce('source',artifact);
    await assert.rejects(storage.createImported('one',record(1),{importId:'source'}),{code:'IMPORT_ARCHIVE_MISMATCH'});
    assert.equal(await storage.load('one'),null);
    assert.equal(await storage.getImportTarget('source'),null);
    assert.equal(await storage.createImported('one',initial,{importId:'source'}),0);
    assert.deepEqual(await storage.load('one'),{version:0,record:initial});
    assert.equal(await storage.getImportTarget('source'),'one');
    await assert.rejects(storage.createImported('one',initial,{importId:'source'}),{code:'SESSION_EXISTS'});
  } finally {await storage.close();}
});
