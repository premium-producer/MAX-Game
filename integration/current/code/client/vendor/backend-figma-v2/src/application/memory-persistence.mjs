/** Explicit volatile preview storage. Never selected as an automatic server fallback. */
export function createMemoryPersistencePort() {
  const records = new Map();
  const copy = value => structuredClone(value);
  const fail = code => { const error = new Error(code); error.code = code; throw error; };
  return {
    async load(sessionId) {
      const stored = records.get(sessionId);
      return stored ? copy(stored) : null;
    },
    async create(sessionId, record) {
      if (records.has(sessionId)) fail('SESSION_EXISTS');
      records.set(sessionId, {version:0, record:copy(record)});
      return 0;
    },
    async commit(sessionId, expectedVersion, record) {
      const previous = records.get(sessionId);
      if (!previous) fail('SESSION_NOT_FOUND');
      if (previous.version !== expectedVersion) fail('STORE_CONFLICT');
      const version = expectedVersion + 1;
      records.set(sessionId, {version, record:copy(record)});
      return version;
    },
  };
}
