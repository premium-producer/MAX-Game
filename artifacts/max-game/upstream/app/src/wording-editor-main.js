import { parseWording } from "./wording.mjs";
import { createHistory, commitHistory, undoHistory, redoHistory } from "./editor-state.mjs";
import { writableProjectBase, loadEditorProject, publishProjectChange, subscribeProjectChange, exportEditorJson } from "./project-editor-client.mjs";
import { saveDraft, loadDraft, clearDraft } from "./editor-storage.mjs";

const sourceId = crypto.randomUUID();
const list = document.getElementById("wording-list"), detail = document.getElementById("wording-detail");
const status = document.getElementById("save-state"), draftStatus = document.getElementById("draft-state");
const search = document.getElementById("wording-search"), reviewOnly = document.getElementById("review-only");
let apiBase, expected, draftKey, history, selected = "", saved = "", busy = false, pendingDraft, noticeTimer;
const value = () => history.present;
const snapshot = (data) => JSON.stringify(data);
const dirty = () => history && snapshot(value()) !== saved;
const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function notice(message, error = false) {
  const box = document.getElementById("wording-notice");
  box.textContent = message; box.classList.toggle("error", error); box.hidden = false;
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { box.hidden = true; }, 12000);
}
async function load() {
  const project = await loadEditorProject(apiBase);
  parseWording(project.wording);
  expected = project.revisions; history = createHistory(project.wording); saved = snapshot(value());
  render(); await offerDraft();
}
function renderList() {
  const query = search.value.toLowerCase(), review = new Set(value().translationReview || []);
  const entries = Object.entries(value().entries).filter(([key, entry]) => (!reviewOnly.checked || review.has(key)) && `${key} ${entry.ru} ${entry.en}`.toLowerCase().includes(query));
  document.getElementById("entry-count").textContent = `${entries.length} / ${Object.keys(value().entries).length}`;
  list.innerHTML = entries.map(([key, entry]) => `<button class="wording-entry" data-key="${escape(key)}" aria-current="${key === selected}"><strong>${escape(entry.ru)}</strong><small>${escape(key)}</small>${review.has(key) ? '<span class="translation-review">Проверьте английский перевод</span>' : ""}</button>`).join("") || "<p>Фразы не найдены</p>";
}
function render() {
  if (!history) return;
  if (!value().entries[selected]) selected = Object.keys(value().entries)[0];
  renderList();
  const entry = value().entries[selected], review = value().translationReview?.includes(selected);
  detail.innerHTML = `<h1 class="wording-key">${escape(selected)}</h1><p class="translation-note">Изменения применяются в игре после сохранения. Сохраняйте одинаковые параметры в фигурных скобках в обоих языках. Названия, задачи и сообщения миссий также доступны в редакторе миссий на русском.</p>${review ? '<p class="translation-review">Русская фраза изменена или добавлена. Английский текст требует проверки; для новой фразы временно используется русский текст.</p><button data-command="reviewed">ПЕРЕВОД EN ПРОВЕРЕН</button>' : ""}<div class="translation-fields">${["ru", "en"].map((language) => `<label>${language.toUpperCase()}<textarea data-language="${language}" spellcheck="true" lang="${language}">${escape(entry[language])}</textarea></label>`).join("")}</div>`;
  updateStatus();
}
function updateStatus() {
  status.textContent = busy ? "Сохранение…" : dirty() ? "Есть изменения · ещё не записаны в игру" : "Тексты записаны в игру";
  document.querySelector('[data-command="save"]').disabled = busy || !dirty();
  document.querySelector('[data-command="undo"]').disabled = busy || !history.past.length;
  document.querySelector('[data-command="redo"]').disabled = busy || !history.future.length;
}
function persistDraft() {
  return saveDraft({ wording: value(), expected }, draftKey).then(() => { if (dirty()) draftStatus.textContent = "Черновик сохранён локально"; }).catch(() => notice("Не удалось записать черновик. Экспортируйте JSON перед закрытием.", true));
}
async function offerDraft() {
  const stored = await loadDraft(draftKey);
  pendingDraft = stored?.catalog;
  if (!pendingDraft?.wording || snapshot(pendingDraft.wording) === saved) { pendingDraft = null; draftStatus.textContent = ""; return; }
  draftStatus.innerHTML = 'Найден черновик <button data-command="restore-draft">Восстановить</button> <button data-command="discard-draft">Удалить</button>';
}
async function save() {
  if (!history || busy || !dirty()) return;
  parseWording(value());
  const submitted = snapshot(value());
  busy = true; updateStatus();
  try {
    const response = await fetch(`${apiBase}/api/wording/save`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wording: value(), expected }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Не удалось сохранить тексты");
    expected = { ...expected, ...result.revisions }; saved = submitted;
    if (!dirty()) { await clearDraft(draftKey).catch(() => {}); draftStatus.textContent = ""; }
    else await persistDraft();
    publishProjectChange(result.revision, sourceId);
    notice(`Тексты записаны. Резервная копия: ${result.backupId}${dirty() ? ". Последующие правки ещё не сохранены" : ""}`);
  } finally { busy = false; updateStatus(); }
}
detail.addEventListener("input", (event) => {
  const language = event.target.dataset.language;
  if (!language) return;
  const next = structuredClone(value()); next.entries[selected][language] = event.target.value;
  if (language === "ru") next.translationReview = [...new Set([...(next.translationReview || []), selected])];
  history = commitHistory(history, next); updateStatus(); persistDraft(); renderList();
});
document.addEventListener("click", async (event) => {
  if (!history) return;
  const key = event.target.closest("[data-key]")?.dataset.key;
  if (key) { selected = key; render(); return; }
  const command = event.target.closest("[data-command]")?.dataset.command;
  if (!command || busy) return;
  try {
    if (command === "save") await save();
    if (command === "export") exportEditorJson({ wording: value(), expected }, "kosmos-na-svyazi-wording-draft.json");
    if (command === "reload") { if (dirty()) await persistDraft(); await load(); }
    if (command === "undo" || command === "redo") { history = command === "undo" ? undoHistory(history) : redoHistory(history); render(); persistDraft(); }
    if (command === "reviewed") { const next = structuredClone(value()); next.translationReview = (next.translationReview || []).filter((key) => key !== selected); history = commitHistory(history, next); render(); persistDraft(); }
    if (command === "restore-draft" && pendingDraft) {
      if (pendingDraft.expected?.wording !== expected.wording) { exportEditorJson(pendingDraft, "kosmos-na-svyazi-wording-conflict.json"); throw new Error("Черновик относится к прежней версии. Он экспортирован в JSON; перенесите нужные фразы в актуальный словарь."); }
      history = commitHistory(history, pendingDraft.wording); pendingDraft = null; draftStatus.textContent = "Черновик восстановлен"; render();
    }
    if (command === "discard-draft") { await clearDraft(draftKey); pendingDraft = null; draftStatus.textContent = ""; }
  } catch (error) { notice(error.message, true); }
});
search.addEventListener("input", () => { if (history) renderList(); });
reviewOnly.addEventListener("change", () => { if (history) renderList(); });
window.addEventListener("beforeunload", (event) => { if (dirty() || busy) { event.preventDefault(); event.returnValue = ""; } });
window.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save().catch((error) => notice(error.message, true)); } });
async function bootstrap() {
  try {
    apiBase = await writableProjectBase(); draftKey = `wording:${apiBase}`; await load();
    subscribeProjectChange(() => { if (dirty() || busy) notice("Проект изменён в другой вкладке. Правки остаются в черновике; перечитайте данные перед сохранением.", true); else load().catch((error) => notice(error.message, true)); }, { ignoreSourceId: sourceId });
  } catch (error) { status.textContent = "Не удалось загрузить тексты"; detail.textContent = error.message; }
}
bootstrap();
