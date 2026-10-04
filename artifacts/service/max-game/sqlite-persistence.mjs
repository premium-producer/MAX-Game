import {Worker} from 'node:worker_threads';
import {isAbsolute, resolve} from 'node:path';

const fail = (code, message = code) => Object.assign(new Error(message), {code});

/** Durable PersistencePort. The host never opens SQLite; all database work belongs to its worker. */
export async function createSqlitePersistencePort({databasePath, busyTimeoutMs = 5000} = {}) {
  if (typeof databasePath !== 'string' || !isAbsolute(databasePath)) throw fail('INVALID_DATABASE_PATH', 'An explicit absolute database path is required');
  if (!Number.isSafeInteger(busyTimeoutMs) || busyTimeoutMs < 0 || busyTimeoutMs > 60000) throw fail('INVALID_BUSY_TIMEOUT');
  const worker = new Worker(new URL('./sqlite-worker.mjs', import.meta.url), {
    workerData:{databasePath:resolve(databasePath), busyTimeoutMs},
    execArgv:process.execArgv.filter(argument => !argument.startsWith('--input-type')),
  });
  const pending = new Map();
  let sequence = 0, closing = false, failure, closePromise;
  let readyResolve, readyReject, exitResolve;
  const ready = new Promise((resolveReady, rejectReady) => { readyResolve = resolveReady; readyReject = rejectReady; });
  const exited = new Promise(resolveExit => { exitResolve = resolveExit; });
  function rejectAll(cause) {
    failure ??= cause;
    readyReject(cause);
    for (const request of pending.values()) request.reject(cause);
    pending.clear();
  }
  worker.on('message', message => {
    if (message.type === 'ready') { readyResolve(); return; }
    const cause = message.error ? fail(message.error.code, message.error.message) : null;
    if (message.type === 'fatal') { rejectAll(cause); return; }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (cause) request.reject(cause); else request.resolve(message.value);
  });
  worker.on('error', cause => rejectAll(fail('SQLITE_WORKER_FAILED', cause.message)));
  worker.on('exit', code => {
    if (!closing || code !== 0 || pending.size) rejectAll(fail('SQLITE_WORKER_EXITED', `Storage worker exited (${code})`));
    exitResolve();
  });
  function request(operation, args, allowClosing = false) {
    if (failure) return Promise.reject(failure);
    if (closing && !allowClosing) return Promise.reject(fail('PERSISTENCE_CLOSED'));
    return new Promise((resolveRequest, rejectRequest) => {
      const id = ++sequence;
      pending.set(id, {resolve:resolveRequest, reject:rejectRequest});
      try { worker.postMessage({id, operation, args}); }
      catch (cause) { pending.delete(id); rejectRequest(fail('INVALID_RECORD', cause.message)); }
    });
  }
  try { await ready; }
  catch (cause) { await worker.terminate(); throw cause; }
  return {
    load(sessionId) { return request('load', {sessionId}); },
    create(sessionId, record) { return request('create', {sessionId, record}); },
    commit(sessionId, expectedVersion, record) { return request('commit', {sessionId, expectedVersion, record}); },
    /** Durable immutable import archive. Existing IDs can only acknowledge identical JSON. */
    saveOnce(importId, artifact) { return request('archive-save-once', {importId, artifact}); },
    /** Atomically creates the imported session and a durable provenance claim. */
    createImported(sessionId, record, {importId} = {}) { return request('create-imported', {sessionId, record, importId}); },
    getImportTarget(importId) { return request('get-import-target', {importId}); },
    /** SQLite online backup; destination must be new and cannot overwrite an existing file. */
    backup(destinationPath) { return request('backup', {destinationPath}); },
    close() {
      if (!closePromise) {
        closing = true;
        closePromise = request('close', {}, true).then(() => exited);
      }
      return closePromise;
    },
  };
}
