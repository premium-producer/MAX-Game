import {freezeTaskCatalog} from '../contracts/task-catalog.mjs';
import {createGameModel, dispatchGameCommand, restoreGameModel} from '../core/game-core.mjs';
import {projectTaskView} from './view-descriptor.mjs';
import {createMemoryPersistencePort} from './memory-persistence.mjs';

/**
 * @typedef {{schemaVersion:1,game:import('../core/game-core.mjs').GameModel,layouts:Record<string,never>}} SessionRecord
 * @typedef {{load:(id:string)=>Promise<{version:number,record:SessionRecord}|null>,create:(id:string,record:SessionRecord)=>Promise<number>,commit:(id:string,version:number,record:SessionRecord)=>Promise<number>}} PersistencePort
 * @typedef {{schemaVersion:1,state:import('../core/game-core.mjs').GameState,layouts:Record<string,never>,view:import('./view-descriptor.mjs').ViewDescriptor}} SessionSnapshot
 * @typedef {{createSession:(options:{sessionId:string,taskId:string,contentRevision:string,scenarioId?:string})=>Promise<SessionSnapshot>,getSnapshot:(id:string)=>Promise<SessionSnapshot>,sendCommand:(command:import('../contracts/game-command.mjs').GameCommand)=>Promise<{reply:object,duplicate:boolean,snapshot:SessionSnapshot}>,subscribe:(id:string,callback:(event:{snapshot:SessionSnapshot,effects:object[]})=>unknown)=>Promise<()=>void>,close:()=>Promise<void>}} SessionPort
 */
const token = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
const frozenCopy = value => {
  const freeze = object => { if (object && typeof object === 'object') { for (const child of Object.values(object)) freeze(child); Object.freeze(object); } return object; };
  return freeze(structuredClone(value));
};
const error = (code, cause) => Object.assign(new Error(code, cause ? {cause} : undefined), {code});
const catalogKey = (revision, taskId) => JSON.stringify([revision, taskId]);

/**
 * Application SessionPort; no renderer or browser storage. Persistence is mandatory.
 * load -> {version,record}|null, create/commit -> committed store version.
 * commit replaces game snapshot AND command receipts atomically.
 * @param {{catalogs:import('../contracts/task-catalog.mjs').TaskCatalog[],persistence:PersistencePort,onObserverError?:(cause:Error)=>void}} options
 * @returns {SessionPort}
 */
export function createSessionApplication({catalogs, persistence, onObserverError = () => {}}) {
  if (!persistence || ['load', 'create', 'commit'].some(name => typeof persistence[name] !== 'function')) throw new TypeError('PersistencePort required');
  if (!Array.isArray(catalogs) || !catalogs.length || typeof onObserverError !== 'function') throw new TypeError('Catalogs and error handler required');
  const registered = new Map(), cache = new Map(), queues = new Map(), listeners = new Map();
  let closed = false;
  for (const input of catalogs) {
    const catalog = freezeTaskCatalog(structuredClone(input)), key = catalogKey(catalog.contentRevision, catalog.taskId);
    if (registered.has(key)) throw new TypeError('Duplicate catalog revision/task');
    registered.set(key, catalog);
  }
  const lookup = (revision, taskId) => {
    const catalog = registered.get(catalogKey(revision, taskId));
    if (!catalog) throw error('CONTENT_UNAVAILABLE');
    return catalog;
  };
  function queue(sessionId, work) {
    if (closed) return Promise.reject(error('APPLICATION_CLOSED'));
    if (!token(sessionId)) return Promise.reject(error('INVALID_SESSION_ID'));
    const before = queues.get(sessionId) ?? Promise.resolve();
    const running = before.catch(() => {}).then(() => { if (closed) throw error('APPLICATION_CLOSED'); return work(); });
    const tail = running.catch(() => {});
    queues.set(sessionId, tail);
    tail.then(() => { if (queues.get(sessionId) === tail) queues.delete(sessionId); });
    return running;
  }
  async function load(sessionId) {
    if (cache.has(sessionId)) return cache.get(sessionId);
    let saved;
    try { saved = await persistence.load(sessionId); } catch (cause) { throw error('STORAGE_UNAVAILABLE', cause); }
    if (!saved) throw error('SESSION_NOT_FOUND');
    const record = saved.record;
    if (!Number.isSafeInteger(saved.version) || saved.version < 0 || record?.schemaVersion !== 1 || Object.keys(record).sort().join(',') !== 'game,layouts,schemaVersion' || !record.layouts || typeof record.layouts !== 'object' || Array.isArray(record.layouts)) throw error('INVALID_SAVED_SESSION');
    // Layout mutation/validation belongs to the later mission/layout slice.
    // Until then the application only supports an empty partition, not raw UI poses.
    if (Object.keys(record.layouts).length) throw error('UNSUPPORTED_LAYOUT_STATE');
    const catalog = lookup(record.game?.state?.contentRevision, record.game?.state?.taskId);
    const restored = restoreGameModel(catalog, record.game);
    if (!restored.ok || restored.model.state.sessionId !== sessionId) throw error('INVALID_SAVED_SESSION');
    const entry = {version:saved.version, record:Object.freeze({schemaVersion:1, game:restored.model, layouts:Object.freeze({})}), catalog};
    cache.set(sessionId, entry);
    return entry;
  }
  const snapshot = entry => frozenCopy({schemaVersion:1, state:entry.record.game.state, layouts:entry.record.layouts, view:projectTaskView(entry.catalog, entry.record.game.state)});
  function report(cause) { try { onObserverError(cause); } catch { /* Observer diagnostics cannot break a committed command. */ } }
  function deliver(callback, event) {
    try { Promise.resolve(callback(event)).catch(report); } catch (cause) { report(cause); }
  }
  function publish(sessionId, entry, effects) {
    if (closed) return;
    const event = frozenCopy({snapshot:snapshot(entry), effects});
    for (const callback of [...(listeners.get(sessionId) ?? [])]) deliver(callback, event);
  }
  const api = {
    createSession({sessionId, taskId, contentRevision, scenarioId = 'guided-reveal'}) {
      return queue(sessionId, async () => {
        const catalog = lookup(contentRevision, taskId);
        const game = createGameModel(catalog, {sessionId, scenarioId});
        const record = Object.freeze({schemaVersion:1, game, layouts:Object.freeze({})});
        let version;
        try { version = await persistence.create(sessionId, record); if (version !== 0) throw error('INVALID_STORE_ACK'); }
        catch (cause) { throw error(cause?.code === 'SESSION_EXISTS' ? 'SESSION_EXISTS' : 'STORAGE_UNAVAILABLE', cause); }
        const entry = {version, record, catalog};
        cache.set(sessionId, entry);
        return snapshot(entry);
      });
    },
    getSnapshot(sessionId) { return queue(sessionId, async () => snapshot(await load(sessionId))); },
    sendCommand(input) {
      // Capture before awaiting the queue: caller mutations cannot change queued intent.
      let command;
      try { command = structuredClone(input); } catch { return Promise.reject(error('INVALID_COMMAND')); }
      return queue(command?.sessionId, async () => {
        let entry = await load(command.sessionId);
        const result = dispatchGameCommand(entry.catalog, entry.record.game, command);
        if (result.reply.ok && !result.duplicate) {
          const record = Object.freeze({schemaVersion:1, game:result.model, layouts:entry.record.layouts});
          let version;
          try { version = await persistence.commit(command.sessionId, entry.version, record); if (!Number.isSafeInteger(version) || version !== entry.version + 1) throw error('INVALID_STORE_ACK'); }
          catch (cause) {
            cache.delete(command.sessionId);
            if (cause?.code === 'STORE_CONFLICT') {
              entry = await load(command.sessionId);
              return frozenCopy({reply:{ok:false, code:'STORE_CONFLICT', snapshot:entry.record.game.state}, duplicate:false, snapshot:snapshot(entry)});
            }
            throw error('STORAGE_UNAVAILABLE', cause);
          }
          entry = {version, record, catalog:entry.catalog};
          cache.set(command.sessionId, entry);
          publish(command.sessionId, entry, result.effects);
        }
        return frozenCopy({reply:result.reply, duplicate:result.duplicate, snapshot:snapshot(entry)});
      });
    },
    subscribe(sessionId, callback) {
      if (typeof callback !== 'function') return Promise.reject(new TypeError('Listener required'));
      return queue(sessionId, async () => {
        const entry = await load(sessionId);
        if (closed) throw error('APPLICATION_CLOSED');
        const group = listeners.get(sessionId) ?? new Set();
        // A separate wrapper makes multiple registrations of the same callback independent.
        const listener = event => callback(event);
        group.add(listener); listeners.set(sessionId, group);
        deliver(listener, frozenCopy({snapshot:snapshot(entry), effects:[]}));
        return () => { group.delete(listener); if (!group.size) listeners.delete(sessionId); };
      });
    },
    async close() {
      closed = true;
      listeners.clear();
      await Promise.allSettled([...queues.values()]);
      cache.clear();
    },
  };
  return Object.freeze(api);
}

/** Explicit headless, volatile preview profile; same SessionPort, no UI fixture. */
export function createLocalSessionPort({catalogs, onObserverError}) {
  return createSessionApplication({catalogs, persistence:createMemoryPersistencePort(), onObserverError});
}
