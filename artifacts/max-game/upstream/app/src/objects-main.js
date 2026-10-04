import { parseMissionCatalog, serializeMissionCatalog } from "./mission-config.mjs";
import { toEditableCatalog, createHistory, commitHistory, undoHistory, redoHistory } from "./editor-state.mjs";
import { changeSystemField } from "./editor-mission-system.js";
import { applyEquipmentDefaults, createBankEntry, removeBankEntry, setBankSvg, setEquipmentCount } from "./object-bank.mjs";
import { bankEntries, renderBankList, renderBankDetail, sectionNames } from "./object-bank-view.mjs";
import { writableProjectBase, loadEditorProject, flushEditorInput, exportEditorJson, publishProjectChange, subscribeProjectChange } from "./project-editor-client.mjs";
import { saveDraft, loadDraft, clearDraft } from "./editor-storage.mjs";
import { validateIconSvg } from "./object-catalog.mjs";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { svgIconGeometry } from "./webgl-field.js";

const screenPage = new URLSearchParams(location.search).get("mode") === "screen";
if (screenPage) {
  document.title = "Объекты для ракурса — Космос на связи";
  document.querySelector(".brand span").textContent = "ОБЪЕКТЫ ДЛЯ РАКУРСА";
  document.querySelector(".bank-tabs").innerHTML = '<a href="./object.html">Обычный банк объектов</a><strong aria-current="page">Размеры для ракурса</strong>';
  document.querySelector('[data-command="create"]').hidden = true;
}
let DRAFT = "object-bank";
const SOURCE_ID = crypto.randomUUID();
let expected = {};
const list = document.getElementById("bank-list"), detail = document.getElementById("bank-detail");
const status = document.getElementById("save-state"), draftStatus = document.getElementById("draft-state");
const validation = document.getElementById("bank-validation"), search = document.getElementById("bank-search");
let history, shellConfig, apiBase, revision, saved = "", busy = false, externalChange = false, pendingFormEdit = false, draftTimer, noticeTimer;
let section = "objects", selected = "", pendingDraft;
const initialLocation = location.hash.slice(1).split("/");
if (Object.hasOwn(sectionNames, initialLocation[0])) { section = initialLocation[0]; selected = initialLocation[1] || ""; }
if (screenPage) section = "screen";
const catalog = () => history.present;
const snapshot = (value) => JSON.stringify(value);
const dirty = () => history && (pendingFormEdit || snapshot(catalog()) !== saved);
const notice = (message, error = false) => {
  const box = document.getElementById("bank-notice");
  box.textContent = message; box.classList.toggle("error", error); box.hidden = false;
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { box.hidden = true; }, error ? 12000 : 6500);
};
function getError() { try { parseMissionCatalog(catalog()); return ""; } catch (error) { return error.message; } }
function render() {
  if (!history) return;
  const entries = bankEntries(catalog(), section);
  if (!entries.some((entry) => entry.id === selected)) selected = entries[0]?.id || "";
  document.querySelectorAll("[data-section]").forEach((button) => {
    if (button.dataset.section === section) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  document.getElementById("list-title").textContent = sectionNames[section];
  list.innerHTML = renderBankList(catalog(), section, selected, search.value);
  detail.innerHTML = renderBankDetail(catalog(), section, selected);
  document.querySelectorAll(".bank-workspace input,.bank-workspace select,.bank-workspace button,[data-section]").forEach((control) => { control.disabled = busy; });
  const error = getError();
  validation.textContent = error ? `Сохранение пока недоступно: ${error}` : "";
  status.textContent = busy ? "Сохранение…" : externalChange ? "Проект изменён в другой вкладке. Перечитайте данные перед сохранением" : dirty() ? "Есть несохранённые изменения" : "Записано в игру";
  document.querySelector('[data-command="save"]').disabled = busy || Boolean(error) || externalChange || !dirty();
  document.querySelector('[data-command="undo"]').disabled = busy || !history.past.length;
  document.querySelector('[data-command="redo"]').disabled = busy || !history.future.length;
}
function commit(mutator) {
  const next = structuredClone(catalog()); mutator(next);
  pendingFormEdit = false;
  history = commitHistory(history, next); render(); scheduleDraft();
}
function draftPayload() { return { catalog: catalog(), revision, expected }; }
function scheduleDraft() {
  saveDraft(draftPayload(), DRAFT).then(() => { if (dirty()) draftStatus.textContent = "Черновик банка сохранён локально"; }).catch((error) => notice(`Черновик не записан: ${error.message}`, true));
}

async function load() {
  const project = await loadEditorProject(apiBase);
  history = createHistory(toEditableCatalog(project.catalog)); shellConfig = project.shellConfig;
  expected = project.revisions;
  revision = project.catalog.revision; saved = snapshot(catalog()); externalChange = false;
  pendingFormEdit = false;
  render();
}
async function save() {
  if (busy) return;
  flushEditorInput();
  if (!dirty()) return;
  const error = getError(); if (error) throw new Error(error);
  if (externalChange) throw new Error("Проект изменён в другой вкладке. Перечитайте данные; текущий черновик не удалён");
  const submitted = snapshot(catalog());
  const payload = { catalog: { ...serializeMissionCatalog(catalog()), revision }, scope: "catalog", expected };
  busy = true; render();
  try {
    const response = await fetch(`${apiBase}/api/editor/save`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Не удалось сохранить банк");
    revision = result.revision; expected = result.revisions; saved = submitted;
    clearTimeout(draftTimer);
    if (!dirty()) { await clearDraft(DRAFT).catch(() => {}); draftStatus.textContent = ""; }
    else scheduleDraft();
    publishProjectChange(revision, SOURCE_ID);
    notice(`Банк и наборы записаны в игру. Резервная копия: ${result.backupId}`);
  } finally { busy = false; render(); }
}
document.addEventListener("click", async (event) => {
  const sectionButton = event.target.closest("[data-section]");
  if (sectionButton && history) { section = sectionButton.dataset.section; selected = ""; search.value = ""; render(); return; }
  const entry = event.target.closest("[data-entry]");
  if (entry && history) { selected = entry.dataset.entry; render(); return; }
  const command = event.target.closest("[data-command]")?.dataset.command;
  if (command === "reload" && !history) { await bootstrap(); return; }
  if (!command || !history || busy) return;
  try {
    if (command === "save") await save();
    if (command === "export-draft") { flushEditorInput(); exportEditorJson(draftPayload(), "kosmos-na-svyazi-bank-draft.json"); }
    if (command === "undo" || command === "redo") { history = command === "undo" ? undoHistory(history) : redoHistory(history); render(); scheduleDraft(); }
    if (command === "apply-equipment-defaults") {
      const values = Object.fromEntries([...detail.querySelectorAll("[data-equipment-default]")].map((input) => [input.dataset.equipmentDefault, input.value === "" ? "" : Number(input.value)]));
      commit((next) => applyEquipmentDefaults(next, values));
      notice("Общие размер и радиус применены ко всему оборудованию. Нажмите «Сохранить изменения», чтобы записать их в игру");
    }
    if (["create", "duplicate"].includes(command)) {
      if (command === "duplicate" && !selected) return;
      const id = window.prompt("Стабильный ID новой записи (латиница, цифры, _ или -)");
      if (id === null) return;
      const copyId = command === "duplicate" ? selected : undefined;
      commit((next) => createBankEntry(next, section, id.trim(), copyId)); selected = id.trim(); render();
    }
    if (command === "delete" && selected && window.confirm("Удалить выбранную запись из банка? До сохранения действие можно отменить.")) commit((next) => removeBankEntry(next, section, selected));
    if (command === "reload") {
      if (dirty() && !window.confirm("Перечитать проект? Текущие правки останутся только в локальном черновике.")) return;
      clearTimeout(draftTimer);
      if (dirty()) await saveDraft(draftPayload(), DRAFT);
      await load(); await offerDraft();
    }
    if (command === "restore-draft" && pendingDraft) {
      if (pendingDraft.revision !== revision || pendingDraft.expected?.wording !== expected.wording) { exportEditorJson(pendingDraft, "kosmos-na-svyazi-bank-conflict.json"); throw new Error("Черновик от другой ревизии. Он сохранён локально, но не может перезаписать более новый проект автоматически. Черновик экспортирован в JSON"); }
      history = commitHistory(history, pendingDraft.catalog); pendingDraft = null; draftStatus.textContent = "Черновик восстановлен"; render();
    }
    if (command === "discard-draft") { await clearDraft(DRAFT); pendingDraft = null; draftStatus.textContent = ""; }
  } catch (error) { notice(error.message, true); }
});
document.addEventListener("change", async (event) => {
  if (!history) return;
  try {
    if (event.target.hasAttribute("data-bank-upload")) {
      const file = event.target.files?.[0]; if (!file) return;
      if (file.size > 131072) throw new Error("SVG: размер не больше 128 КБ");
      const stamp = history, id = selected, targetSection = section;
      const svg = validateIconSvg(await file.text());
      svgIconGeometry(new SVGLoader().parse(svg)).dispose();
      if (history !== stamp) throw new Error("Настройки изменились во время импорта. Выберите SVG ещё раз");
      commit((next) => setBankSvg(next, targetSection, id, svg));
      notice("SVG заменён. Нажмите «Сохранить изменения», чтобы записать его в игру");
    } else if (event.target.dataset.bankField) {
      const path = JSON.parse(event.target.dataset.bankField);
      const value = event.target.dataset.valueType === "boolean" ? event.target.value === "true" : event.target.type === "number" ? Number(event.target.value) : event.target.value;
      commit((next) => changeSystemField(next, path, value));
    } else if (event.target.dataset.setCount) {
      const type = event.target.dataset.setCount, count = Number(event.target.value);
      commit((next) => setEquipmentCount(next, selected, type, count));
    }
  } catch (error) { pendingFormEdit = false; notice(error.message, true); render(); }
});
document.addEventListener("input", (event) => {
  if (event.target.matches("[data-bank-field],[data-set-count],[data-bank-upload]")) pendingFormEdit = true;
});
search.addEventListener("input", () => { if (history) list.innerHTML = renderBankList(catalog(), section, selected, search.value); });
document.addEventListener("visibilitychange", () => { if (document.hidden && history) { flushEditorInput(); if (dirty()) scheduleDraft(); } });
window.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); if (history) save().catch((error) => notice(error.message, true)); } });
window.addEventListener("beforeunload", (event) => { flushEditorInput(); if (dirty()) scheduleDraft(); if (dirty() || busy) { event.preventDefault(); event.returnValue = ""; } });
async function offerDraft() {
  const stored = await loadDraft(DRAFT).catch(() => null);
  if (!stored?.catalog?.catalog || snapshot(stored.catalog.catalog) === saved) return;
  pendingDraft = stored.catalog;
  draftStatus.innerHTML = 'Есть черновик банка <button data-command="restore-draft">Восстановить</button> <button data-command="discard-draft">Удалить черновик</button>';
}
async function bootstrap() {
  try {
    apiBase = await writableProjectBase(); DRAFT = `${screenPage ? "object-bank-screen" : "object-bank"}:${apiBase}`;
    if (!screenPage && !await loadDraft(DRAFT)) { const legacyDraft = await loadDraft("object-bank"); if (legacyDraft) { await saveDraft(legacyDraft.catalog, DRAFT); await clearDraft("object-bank").catch(() => {}); } }
    await load(); await offerDraft();
    subscribeProjectChange(() => {
      if (dirty() || busy) { externalChange = true; notice("Проект сохранён в другой вкладке. Ваши правки оставлены; перед записью нужно перечитать проект", true); render(); }
      else load().catch((error) => notice(error.message, true));
    }, { ignoreSourceId: SOURCE_ID });
  } catch (error) { status.textContent = "Не удалось открыть банк"; detail.textContent = error.message; notice(error.message, true); }
}
bootstrap();
