import {parentPort, workerData} from 'node:worker_threads';
import {assertMissionAssignment} from '../../max-game/src/contracts/mission-assignment.mjs';
import {mkdirSync, openSync, closeSync} from 'node:fs';
import {dirname, isAbsolute, resolve} from 'node:path';

const fail = (code, message = code) => Object.assign(new Error(message), {code});
const describe = cause => ({code:cause.code || 'STORAGE_UNAVAILABLE', message:cause.message});
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
function encodeJson(record, canonical = false) {
  const ancestors = new Set();
  function check(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (!value || typeof value !== 'object' || ancestors.has(value)) throw fail('INVALID_RECORD', 'A finite JSON record is required');
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) throw fail('INVALID_RECORD');
    ancestors.add(value);
    for (const child of Object.values(value)) check(child);
    if (Array.isArray(value) && Object.keys(value).length !== value.length) throw fail('INVALID_RECORD');
    ancestors.delete(value);
  }
  check(record);
  function stable(value) {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
  }
  return canonical ? stable(record) : JSON.stringify(record);
}
function encodeRecord(record) {
  const encoded = encodeJson(record);
  const model = record?.schemaVersion === 1 ? record.game : record?.schemaVersion === 2 ? record.mission : null;
  if (!record || Array.isArray(record) || !model || typeof model !== 'object' || Array.isArray(model) || !record.layouts || typeof record.layouts !== 'object' || Array.isArray(record.layouts)) throw fail('INVALID_RECORD');
  // Meaningful game validation belongs to the Application/Core, not the storage driver.
  return encoded;
}

let database, onlineBackup, select, insert, update;
try {
  let sqlite;
  try { sqlite = await import('node:sqlite'); }
  catch (cause) { throw fail('SQLITE_UNAVAILABLE', `node:sqlite is unavailable in Node ${process.versions.node}: ${cause.message}`); }
  if (typeof sqlite.DatabaseSync !== 'function' || typeof sqlite.backup !== 'function') throw fail('SQLITE_UNAVAILABLE', `DatabaseSync/backup missing in Node ${process.versions.node}`);
  onlineBackup = sqlite.backup;
  mkdirSync(dirname(workerData.databasePath), {recursive:true});
  database = new sqlite.DatabaseSync(workerData.databasePath);
  const schema = database.prepare('PRAGMA user_version').get().user_version;
  if (![0, 1, 2].includes(schema)) throw fail('UNSUPPORTED_STORAGE_SCHEMA', `SQLite storage schema ${schema} is unsupported`);
  database.exec(`PRAGMA busy_timeout=${workerData.busyTimeoutMs}; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;`);
  database.exec(`BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS max_sessions (
      session_id TEXT PRIMARY KEY NOT NULL,
      version INTEGER NOT NULL CHECK(version >= 0),
      record_json TEXT NOT NULL CHECK(json_valid(record_json))
    ) STRICT;
    CREATE TABLE IF NOT EXISTS max_import_archives (
      import_id TEXT PRIMARY KEY NOT NULL,
      artifact_json TEXT NOT NULL CHECK(json_valid(artifact_json))
    ) STRICT;
    CREATE TABLE IF NOT EXISTS max_import_targets (
      import_id TEXT PRIMARY KEY NOT NULL REFERENCES max_import_archives(import_id),
      session_id TEXT UNIQUE NOT NULL REFERENCES max_sessions(session_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS max_assignments (
      assignment_id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT UNIQUE NOT NULL REFERENCES max_sessions(session_id),
      payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
      receipt_json TEXT NOT NULL CHECK(json_valid(receipt_json))
    ) STRICT;
    CREATE TABLE IF NOT EXISTS max_slots (
      slot_id TEXT PRIMARY KEY NOT NULL CHECK(slot_id = 'main'),
      generation INTEGER NOT NULL CHECK(generation >= 0),
      assignment_id TEXT UNIQUE REFERENCES max_assignments(assignment_id),
      session_id TEXT UNIQUE REFERENCES max_sessions(session_id),
      CHECK((assignment_id IS NULL AND session_id IS NULL AND generation = 0) OR
            (assignment_id IS NOT NULL AND session_id IS NOT NULL AND generation > 0))
    ) STRICT;
    INSERT OR IGNORE INTO max_slots(slot_id,generation,assignment_id,session_id) VALUES ('main',0,NULL,NULL);
    PRAGMA user_version=2;
    COMMIT;`);
  select = database.prepare('SELECT version, record_json FROM max_sessions WHERE session_id=?');
  insert = database.prepare('INSERT INTO max_sessions (session_id,version,record_json) VALUES (?,0,?)');
  update = database.prepare('UPDATE max_sessions SET version=?,record_json=? WHERE session_id=? AND version=?');
  parentPort.postMessage({type:'ready'});
} catch (cause) {
  try { database?.close(); } catch {}
  parentPort.postMessage({type:'fatal', error:describe(cause)});
  parentPort.close();
}

if (database?.isOpen) {
  function transaction(work) {
    database.exec('BEGIN IMMEDIATE');
    try { const value = work(); database.exec('COMMIT'); return value; }
    catch (cause) { try { database.exec('ROLLBACK'); } catch {} throw cause; }
  }
  async function execute(operation, args) {
    if (operation === 'close') { database.close(); return null; }
    if (operation === 'backup') {
      if (typeof args.destinationPath !== 'string' || !isAbsolute(args.destinationPath)) throw fail('INVALID_BACKUP_PATH');
      const destination = resolve(args.destinationPath);
      const normalize = value => process.platform === 'win32' ? value.toLowerCase() : value;
      if (normalize(destination) === normalize(workerData.databasePath)) throw fail('INVALID_BACKUP_PATH');
      mkdirSync(dirname(destination), {recursive:true});
      try { closeSync(openSync(destination, 'wx')); }
      catch (cause) { if (cause.code === 'EEXIST') throw fail('BACKUP_EXISTS'); throw cause; }
      await onlineBackup(database, destination);
      return {databasePath:destination, schemaVersion:2};
    }
    if (operation === 'get-assignment') {
      if (!validId(args.assignmentId)) throw fail('INVALID_ASSIGNMENT');
      const row = database.prepare('SELECT receipt_json FROM max_assignments WHERE assignment_id=?').get(args.assignmentId);
      if (!row) throw fail('ASSIGNMENT_NOT_FOUND');
      return {receipt:JSON.parse(row.receipt_json)};
    }
    if (operation === 'get-slot') {
      if (args.slotId !== 'main') throw fail('INVALID_SLOT');
      const row = database.prepare('SELECT generation,assignment_id,session_id FROM max_slots WHERE slot_id=?').get(args.slotId);
      return {slotId:args.slotId, generation:row.generation, assignmentId:row.assignment_id, sessionId:row.session_id};
    }
    if (operation === 'assign-mission') {
      const assignment = assertMissionAssignment(args.assignment), encodedPayload = encodeJson(assignment, true);
      return transaction(() => {
        const previous = database.prepare('SELECT payload_json,receipt_json FROM max_assignments WHERE assignment_id=?').get(assignment.assignmentId);
        if (previous) {
          if (previous.payload_json !== encodedPayload) throw fail('ASSIGNMENT_ID_REUSED');
          return {receipt:JSON.parse(previous.receipt_json), duplicate:true};
        }
        if (assignment.contentRevision !== args.contentRevision) throw fail('CONTENT_CONFLICT');
        if (args.missionAvailable !== true) throw fail('INVALID_MISSION');
        const slot = database.prepare('SELECT generation,assignment_id FROM max_slots WHERE slot_id=?').get(assignment.slotId);
        if (assignment.expectedGeneration !== slot.generation) throw fail('GENERATION_CONFLICT');
        if (slot.assignment_id !== null) throw fail('SLOT_BUSY');
        if (select.get(assignment.sessionId)) throw fail('SESSION_EXISTS');
        const encodedRecord = encodeRecord(args.record), state = args.record.mission?.state;
        if (args.record.schemaVersion !== 2 || state?.sessionId !== assignment.sessionId ||
            state.missionId !== assignment.missionId || state.contentRevision !== assignment.contentRevision ||
            state.status !== 'scan' || state.runId !== 1 || state.ownerActive !== false) throw fail('INVALID_RECORD');
        if (slot.generation >= Number.MAX_SAFE_INTEGER) throw fail('GENERATION_CONFLICT');
        const receipt = {schemaVersion:1, assignmentId:assignment.assignmentId, slotId:assignment.slotId,
          generation:slot.generation + 1, sessionId:assignment.sessionId, missionId:assignment.missionId,
          contentRevision:assignment.contentRevision, status:'accepted'};
        insert.run(assignment.sessionId, encodedRecord);
        database.prepare('INSERT INTO max_assignments(assignment_id,session_id,payload_json,receipt_json) VALUES (?,?,?,?)')
          .run(assignment.assignmentId, assignment.sessionId, encodedPayload, encodeJson(receipt));
        database.prepare('UPDATE max_slots SET generation=?,assignment_id=?,session_id=? WHERE slot_id=?')
          .run(receipt.generation, assignment.assignmentId, assignment.sessionId, assignment.slotId);
        return {receipt, duplicate:false};
      });
    }
    if (operation === 'archive-save-once') {
      if (!validId(args.importId) || !args.artifact || typeof args.artifact !== 'object' || Array.isArray(args.artifact)) throw fail('INVALID_IMPORT_ARCHIVE');
      const encoded = encodeJson(args.artifact, true);
      return transaction(() => {
        const previous = database.prepare('SELECT artifact_json FROM max_import_archives WHERE import_id=?').get(args.importId);
        if (previous) {
          if (previous.artifact_json !== encoded) throw fail('IMPORT_ID_REUSED');
          return 'existing-identical';
        }
        database.prepare('INSERT INTO max_import_archives (import_id,artifact_json) VALUES (?,?)').run(args.importId, encoded);
        return 'created';
      });
    }
    if (operation === 'get-import-target') {
      if (!validId(args.importId)) throw fail('INVALID_IMPORT_ARCHIVE');
      return database.prepare('SELECT session_id FROM max_import_targets WHERE import_id=?').get(args.importId)?.session_id ?? null;
    }
    if (operation === 'create-imported') {
      if (!validId(args.sessionId) || !validId(args.importId)) throw fail('INVALID_IMPORT_TARGET');
      const encoded = encodeRecord(args.record);
      return transaction(() => {
        const archive = database.prepare('SELECT artifact_json FROM max_import_archives WHERE import_id=?').get(args.importId);
        if (!archive) throw fail('IMPORT_ARCHIVE_NOT_FOUND');
        const artifact = JSON.parse(archive.artifact_json);
        if (artifact.format !== 'max-explicit-import' || artifact.targetSessionId !== args.sessionId || encodeJson(artifact.record, true) !== encodeJson(args.record, true)) throw fail('IMPORT_ARCHIVE_MISMATCH');
        const claim = database.prepare('SELECT session_id FROM max_import_targets WHERE import_id=?').get(args.importId);
        if (claim && claim.session_id !== args.sessionId) throw fail('IMPORT_TARGET_CONFLICT');
        if (select.get(args.sessionId)) throw fail('SESSION_EXISTS');
        if (claim) throw fail('IMPORT_TARGET_CORRUPT');
        insert.run(args.sessionId, encoded);
        database.prepare('INSERT INTO max_import_targets (import_id,session_id) VALUES (?,?)').run(args.importId, args.sessionId);
        return 0;
      });
    }
    if (!validId(args.sessionId)) throw fail('INVALID_SESSION_ID');
    if (operation === 'load') {
      const row = select.get(args.sessionId);
      return row ? {version:row.version, record:JSON.parse(row.record_json)} : null;
    }
    if (operation === 'create') {
      const encoded = encodeRecord(args.record);
      return transaction(() => {
        if (select.get(args.sessionId)) throw fail('SESSION_EXISTS');
        insert.run(args.sessionId, encoded);
        return 0;
      });
    }
    if (operation === 'commit') {
      if (!Number.isSafeInteger(args.expectedVersion) || args.expectedVersion < 0 || args.expectedVersion >= Number.MAX_SAFE_INTEGER) throw fail('INVALID_STORE_VERSION');
      const encoded = encodeRecord(args.record);
      return transaction(() => {
        const previous = select.get(args.sessionId);
        if (!previous) throw fail('SESSION_NOT_FOUND');
        if (previous.version !== args.expectedVersion) throw fail('STORE_CONFLICT');
        const next = args.expectedVersion + 1;
        if (update.run(next, encoded, args.sessionId, args.expectedVersion).changes !== 1) throw fail('STORE_CONFLICT');
        return next;
      });
    }
    throw fail('INVALID_STORAGE_OPERATION');
  }
  // Includes async online backups: no later write or close overtakes a backup.
  let tail = Promise.resolve();
  parentPort.on('message', ({id, operation, args}) => {
    tail = tail.then(async () => {
      try {
        const value = await execute(operation, args);
        parentPort.postMessage({id, value});
      } catch (cause) { parentPort.postMessage({id, error:describe(cause)}); }
      if (operation === 'close') parentPort.close();
    });
  });
}
