import { parseMissionCatalog } from "./mission-config.mjs";
const CHANNEL = "x-sputnik-project-config", STORAGE = "x-sputnik-project-config-revision";
export async function writableProjectBase(fetchImpl = fetch, origin = location.origin) {
  for (const base of new Set([origin, "http://127.0.0.1:4174"])) {
    try {
      const result = await fetchImpl(`${base}/api/editor/status`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      const status = result.ok ? await result.json() : {};
      if (status.writable === true && status.protocolVersion === 2) return base;
    } catch { /* Try the project server, never a static HTML response. */ }
  }
  throw new Error("Сервер сохранения недоступен или устарел. Перезапустите npm run dev (macOS/Linux) или START-EDITOR-WINDOWS.bat (Windows) и откройте нужный редактор на http://127.0.0.1:4174");
}
export async function loadEditorProject(base, fetchImpl = fetch) {
  const response = await fetchImpl(`${base}/api/editor/project`, { cache: "no-store" });
  const project = await response.json();
  if (!response.ok) throw new Error(project.error || "Не удалось прочитать проект");
  return { ...project, catalog: parseMissionCatalog(project.catalog) };
}

export function flushEditorInput() {
  const active = document.activeElement;
  if (active?.matches("input,textarea,select")) active.blur();
}

export function exportEditorJson(value, filename) {
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function publishProjectChange(revision, sourceId = "") {
  const message = { type: "project-config-saved", revision, sourceId };
  try { const channel = new BroadcastChannel(CHANNEL); channel.postMessage(message); channel.close(); }
  catch { try { localStorage.setItem(STORAGE, revision); } catch { /* Files have already been saved. */ } }
}
export function subscribeProjectChange(callback, { ignoreSourceId = "" } = {}) {
  let channel;
  try { channel = new BroadcastChannel(CHANNEL); channel.onmessage = (event) => {
    if (event.data?.type === "project-config-saved" && (!ignoreSourceId || event.data.sourceId !== ignoreSourceId)) callback(event.data);
  }; } catch { /* Storage fallback below. */ }
  const handler = (event) => { if (event.key === STORAGE && event.newValue) callback(); };
  window.addEventListener("storage", handler);
  return () => { channel?.close(); window.removeEventListener("storage", handler); };
}
