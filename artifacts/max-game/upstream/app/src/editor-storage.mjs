const DATABASE_NAME = "x-sputnik-editor";
const STORE_NAME = "drafts";
const DRAFT_KEY = "mission-catalog";
let queue = Promise.resolve();
const localKey = (key) => `${DATABASE_NAME}:draft:${key}`;

export function saveDraft(catalog, key = DRAFT_KEY) {
  const record = { catalog: structuredClone(catalog), savedAt: Date.now() };
  // Synchronous recovery copy also covers closing the page before IndexedDB commits.
  let localSaved = false;
  try { localStorage.setItem(localKey(key), JSON.stringify(record)); localSaved = true; } catch { /* IndexedDB remains available for larger drafts. */ }
  return enqueue(() => transact("readwrite", (store) => store.put(record, key)).catch((error) => { if (!localSaved) throw error; }));
}

export async function loadDraft(key = DRAFT_KEY) {
  await queue;
  let local = null;
  try { local = JSON.parse(localStorage.getItem(localKey(key))); } catch { /* Browser storage may be disabled. */ }
  const stored = await transact("readonly", (store) => store.get(key)).catch(() => null);
  return local && (!stored || local.savedAt >= stored.savedAt) ? local : stored || null;
}

export function clearDraft(key = DRAFT_KEY) {
  try { localStorage.removeItem(localKey(key)); } catch { /* Clear IndexedDB below. */ }
  return enqueue(() => transact("readwrite", (store) => store.delete(key)));
}

function enqueue(operation) {
  const task = queue.then(operation);
  queue = task.catch(() => undefined);
  return task;
}

async function transact(mode, operation) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      let request;
      transaction.oncomplete = () => resolve(request?.result);
      transaction.onabort = () => reject(transaction.error || new Error("Запись черновика отменена"));
      transaction.onerror = () => reject(transaction.error || new Error("Не удалось записать черновик"));
      request = operation(transaction.objectStore(STORE_NAME));
    });
  } finally { database.close(); }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Хранилище черновиков занято другой вкладкой"));
  });
}
