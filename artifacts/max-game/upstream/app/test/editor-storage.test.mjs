import assert from "node:assert/strict";
import test from "node:test";
import { saveDraft, loadDraft, clearDraft } from "../src/editor-storage.mjs";

function browserStorage(t, indexedDB) {
  const previous = { localStorage: globalThis.localStorage, indexedDB: globalThis.indexedDB };
  const local = new Map();
  globalThis.localStorage = { getItem: (key) => local.get(key) || null, setItem: (key, value) => local.set(key, value), removeItem: (key) => local.delete(key) };
  globalThis.indexedDB = indexedDB;
  t.after(() => { globalThis.localStorage = previous.localStorage; globalThis.indexedDB = previous.indexedDB; });
  return local;
}

test("draft has a synchronous recovery copy even if IndexedDB is unavailable", async (t) => {
  const local = browserStorage(t, { open() { throw new Error("disabled"); } });
  const draft = { name: "saved" }, saving = saveDraft(draft, "recovery");
  assert.equal(JSON.parse([...local.values()][0]).catalog.name, "saved");
  draft.name = "later";
  await saving;
  assert.equal((await loadDraft("recovery")).catalog.name, "saved");
  await clearDraft("recovery").catch(() => {});
  assert.equal(await loadDraft("recovery"), null);
});

test("IndexedDB save waits for transaction commit, and a later clear cannot be undone by an older write", async (t) => {
  let complete;
  const data = new Map();
  browserStorage(t, { open() {
    const request = {};
    queueMicrotask(() => { request.result = { close() {}, transaction() {
      const transaction = { objectStore: () => ({
        put(value, key) { const operation = {}; complete = () => { data.set(key, value); transaction.oncomplete(); }; return operation; },
        delete(key) { const operation = {}; queueMicrotask(() => { data.delete(key); transaction.oncomplete(); }); return operation; },
        get(key) { const operation = { result: data.get(key) }; queueMicrotask(() => transaction.oncomplete()); return operation; },
      }) }; return transaction;
    } }; request.onsuccess(); });
    return request;
  } });
  let resolved = false;
  const saving = saveDraft({ name: "draft" }, "transaction").then(() => { resolved = true; });
  await new Promise((done) => setImmediate(done));
  assert.equal(resolved, false);
  const clearing = clearDraft("transaction");
  complete(); await saving; await clearing;
  assert.equal(await loadDraft("transaction"), null);
});
