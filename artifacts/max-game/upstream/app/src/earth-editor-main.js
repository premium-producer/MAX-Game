import { saveDraft, loadDraft, clearDraft } from "./editor-storage.mjs";
import { ITEM_TYPES } from "./mission-game.mjs";
import { writableProjectBase, loadEditorProject, exportEditorJson, publishProjectChange, subscribeProjectChange } from "./project-editor-client.mjs";
import { DEFAULT_EARTH_STYLE, parseUiShellConfig, repairEarthStyleRelations } from "./ui-shell-config.mjs";
import { createWebGLField } from "./webgl-field.js";
import { loadEarthContours, earthContourById } from "./earth-contours.mjs";

export const EARTH_CONTROL_GROUPS = [
  { id: "surface", title: "01 · ПОВЕРХНОСТЬ И ВОДА", fields: [
    color("dayTint", "Дневной тон"), color("nightTint", "Ночной тон"),
    number("dayIntensity", "Яркость дня", 0, 3, .01), number("ambientIntensity", "Фоновый свет", 0, 1, .01),
    number("saturation", "Насыщенность текущего grade", 0, 2, .01),
    number("textureColorMix", "Примесь исходного цвета", 0, 1, .01), number("textureSaturation", "Насыщенность исходника", 0, 2, .01),
    number("surfaceExposure", "Экспозиция", 0, 2, .01),
    number("surfaceGamma", "Гамма", .5, 3, .01), number("surfaceContrast", "Контраст", .5, 2, .01),
    color("oceanColor", "Тон воды"), number("oceanIntensity", "Яркость воды", 0, 2, .01),
    number("specularIntensity", "Блик океана", 0, 2, .01), number("normalStrength", "Рельеф normal map", 0, 2, .01),
    number("terminatorSoftness", "Мягкость терминатора", .01, 1, .01), number("cloudHighlights", "Облака на diffuse", 0, 2, .01),
  ]},
  { id: "region", title: "02 · РОССИЯ И КОНТЕКСТ", fields: [
    select("russiaContour", "Вариант контура", []),
    number("russiaSurfaceBoost", "Освещение России", 0, 2, .01), number("outsideSurfaceDim", "Затемнение снаружи", 0, 1, .01),
    number("russiaMaskFeather", "Растушёвка маски", .25, 4, .05), color("borderColor", "Цвет контура"),
    number("borderIntensity", "Цветное ядро", 0, 2, .01), number("borderCoreIntensity", "Белое HDR-ядро", 0, 6, .01),
    number("borderCoreWidth", "Толщина ядра", .5, 6, .1), number("borderGlowIntensity", "Энергия glow", 0, 2, .01),
  ]},
  { id: "cities", title: "03 · ГОРОДСКИЕ ОГНИ", fields: [
    color("cityLightsColor", "Цвет огней"), color("cityLightsHotColor", "Цвет горячего ядра"),
    number("cityLightsIntensity", "Энергия огней", 0, 4, .01), number("cityLightsHotIntensity", "Белое HDR-ядро", 0, 6, .01),
    number("cityLightsGlowIntensity", "Энергия glow", 0, 2, .01), number("cityLightsCoreStart", "Порог ядра", 0, 1, .005),
    number("cityLightsGlowStart", "Порог glow", 0, 1, .005), number("cityLightsDayVisibility", "Видимость днём", 0, 1, .01),
    number("cityLightsBlackPoint", "Чёрная точка маски", 0, 1, .001), number("cityLightsWhitePoint", "Белая точка маски", 0, 1, .001),
    number("cityLightsGamma", "Гамма маски", .1, 4, .01), number("cityLightsHotPoint", "Порог горячих точек", 0, 1, .01),
    number("cityLightsLimbStart", "Край: начало", 0, 1, .005), number("cityLightsLimbEnd", "Край: конец", 0, 1, .005),
  ]},
  { id: "clouds", title: "04 · ОБЛАКА", fields: [
    color("cloudColor", "Цвет облаков"), number("cloudIntensity", "Яркость", 0, 2, .01),
    number("cloudOpacity", "Непрозрачность", 0, 1, .01), number("cloudBlackPoint", "Чёрная точка", 0, 1, .01),
    number("cloudWhitePoint", "Белая точка", 0, 1, .01), number("cloudAltitude", "Высота слоя", .003, .08, .001),
    number("cloudShadowIntensity", "Тень на поверхности", 0, 1, .01),
  ]},
  { id: "light", title: "05 · BLOOM, ДЫМКА И АТМОСФЕРА", fields: [
    number("emissiveBloomRadius", "Общий радиус bloom", 0, 64, 1), number("emissiveBloomStrength", "Общая сила bloom", 0, 2, .01),
    select("emissiveBloomQuality", "Качество bloom", [["high", "HIGH · 1920×1080"], ["medium", "MEDIUM · 1280×720"], ["off", "OFF · только ядро"]]),
    color("hazeColor", "Цвет дымки"), number("hazeIntensity", "Дымка поверхности", 0, 1, .01), number("hazePower", "Растяжка дымки", .5, 8, .05),
    color("atmosphereColor", "Цвет атмосферы"), number("atmosphereIntensity", "Сила атмосферы", 0, 2, .01),
    number("atmospherePower", "Плотность края", .5, 8, .05), number("atmosphereInnerFeather", "Внутренняя растушёвка", .001, .25, .001),
    number("atmosphereOuterFeather", "Внешняя растушёвка", .01, .5, .005), number("atmosphereSunBias", "Смещение к свету", 0, 1, .01),
  ]},
];

export const EARTH_TEXTURES = [
  ["Diffuse", "./earth/Earth_Diffuse_4K.jpg", "Базовый цвет суши и воды"],
  ["City mask", "./earth/Earth_Illumination_Core_4K.webp", "Чёткая data-mask городских огней"],
  ["Specular", "./earth/Earth_Specular_4K.webp", "Маска воды и океанического блика"],
  ["Normal", "./earth/Earth_Normal_4K.webp", "Микрорельеф поверхности"],
  ["Clouds", "./earth/Earth_Clouds_4K.webp", "Отдельный прозрачный слой облаков"],
];

const root = document.getElementById("earth-editor");
const preview = document.getElementById("earth-preview");
const controlsRoot = document.getElementById("earth-controls");
const textureGrid = document.getElementById("texture-grid");
const stateSelect = document.getElementById("preview-state");
const searchInput = document.getElementById("control-search");
const dirtyState = document.getElementById("dirty-state");
const saveState = document.getElementById("save-state");
const saveDetail = document.getElementById("save-detail");
const notice = document.getElementById("studio-notice");
const EARTH_EDITOR_SOURCE_ID = globalThis.crypto?.randomUUID?.() || `earth-editor-${Date.now()}-${Math.random()}`;

let apiBase = "";
let expected = {};
let draftKey = "";
let pendingDraft = null;
let shellConfig = null;
let savedEarth = null;
let earthStyle = null;
let field = null;
let saving = false;
let noticeTimer = 0;
let contours = null;
let contourLoading = false;
let styleRequest = 0;

bootstrap();

async function bootstrap() {
  try {
    apiBase = await writableProjectBase();
    draftKey = `earth-style:${apiBase}`;
    const project = await loadEditorProject(apiBase);
    const loadedShellConfig = parseUiShellConfig(project.shellConfig);
    expected = project.revisions;
    shellConfig = loadedShellConfig;
    savedEarth = structuredClone(shellConfig.rendering.earth);
    earthStyle = structuredClone(savedEarth);
    contours = await loadEarthContours();
    earthContourById(contours, earthStyle.russiaContour);
    fieldDefinition("russiaContour").options = contours.variants.map(({ id, label }) => [id, label]);
    renderTextures();
    renderControls();
    field = await createWebGLField({
      container: preview,
      placements: [],
      network: { links: [], states: {} },
      itemTypes: ITEM_TYPES,
      selectedItem: null,
      endpoints: {},
      initialView: shellConfig.states[stateSelect.value].cameraView,
      maxDrawingBufferPixels: shellConfig.rendering.maxDrawingBufferPixels,
      earthStyle,
      contourCatalog: contours,
      nodeIconBackdropStyle: shellConfig.rendering.nodeIconBackdrop,
      signalLinkStyle: shellConfig.rendering.signalLinks,
      earthOrbit: shellConfig.interaction.earthOrbit,
      freeOrbit: true,
      preciseOrbit: true,
      onPlace() {}, onMove() {}, onRemove() {},
    });
    bindEvents();
    updateStatus();
    await offerDraft();
    subscribeProjectChange(() => {
      if (isDirty() || saving) showNotice("Проект изменён в другой вкладке. Сохраните или верните профиль перед обновлением.", true, 10000);
      else location.reload();
    }, { ignoreSourceId: EARTH_EDITOR_SOURCE_ID });
  } catch (error) {
    root.classList.add("has-fatal-error");
    saveState.textContent = `ОШИБКА: ${error.message}`;
    console.error(error);
  }
}

function bindEvents() {
  controlsRoot.addEventListener("input", onControlInput);
  controlsRoot.addEventListener("change", onControlInput);
  searchInput.addEventListener("input", applySearch);
  stateSelect.addEventListener("change", () => field?.setViewState(shellConfig.states[stateSelect.value].cameraView, false, 500));
  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "save") save().catch((error) => showNotice(error.message, true, 9000));
    if (action === "export-draft") exportEditorJson({ earthStyle, expected }, "kosmos-na-svyazi-earth-draft.json");
    if (action === "reload") { if (isDirty()) persistDraft(); location.reload(); }
    if (action === "restore-draft") restoreDraft().catch((error) => showNotice(error.message, true));
    if (action === "discard-draft") { pendingDraft = null; clearDraft(draftKey).catch(() => {}); saveDetail.textContent = "Черновик удалён"; }
    if (action === "restore") restore(savedEarth, "Сохранённый профиль восстановлен в предпросмотре");
    if (action === "defaults") restore(DEFAULT_EARTH_STYLE, "Заводской профиль применён только в предпросмотре");
  });
  window.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save().catch((error) => showNotice(error.message, true)); } });
  window.addEventListener("beforeunload", (event) => { if (isDirty()) persistDraft(); if (isDirty() || saving) { event.preventDefault(); event.returnValue = ""; } });
  window.addEventListener("pagehide", () => field?.dispose(), { once: true });
}

function onControlInput(event) {
  const input = event.target.closest("[data-earth-style]");
  if (!input) return;
  const definition = fieldDefinition(input.dataset.earthStyle);
  if (!definition) return;
  let value = input.value;
  if (definition.type === "number") {
    value = Number(value);
    if (!Number.isFinite(value)) return;
    value = Math.min(definition.max, Math.max(definition.min, value));
  } else if (definition.type === "color") value = value.toLowerCase();
  earthStyle[definition.key] = value;
  earthStyle = repairEarthStyleRelations(earthStyle, definition.key);
  syncAllFields();
  applyPreviewStyle();
  updateStatus();
  persistDraft();
}

function renderControls() {
  controlsRoot.innerHTML = EARTH_CONTROL_GROUPS.map((group) => `<details class="control-group" data-control-group="${group.id}" open>
    <summary><span>${group.title}</span><b>${group.fields.length}</b></summary>
    <div class="control-grid">${group.fields.map(renderField).join("")}</div>
  </details>`).join("");
  syncAllFields();
}

function renderField(definition) {
  const search = `${definition.label} ${definition.key}`.toLowerCase();
  if (definition.type === "color") return `<label class="control-row is-color" data-control-row data-search="${search}"><span>${definition.label}<small>${definition.key}</small></span><input type="color" data-earth-style="${definition.key}"><output data-color-output="${definition.key}"></output></label>`;
  if (definition.type === "select") return `<label class="control-row is-select" data-control-row data-search="${search}"><span>${definition.label}<small>${definition.key}</small></span><select data-earth-style="${definition.key}">${definition.options.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")}</select></label>`;
  return `<label class="control-row" data-control-row data-search="${search}"><span>${definition.label}<small>${definition.key}</small></span><input type="range" data-earth-style="${definition.key}" min="${definition.min}" max="${definition.max}" step="${definition.step}"><input class="number-value" type="number" data-earth-style="${definition.key}" min="${definition.min}" max="${definition.max}" step="${definition.step}"></label>`;
}

function renderTextures() {
  const variant = earthContourById(contours, earthStyle.russiaContour);
  const textures = [...EARTH_TEXTURES, [variant.label, variant.fill, "Заливка выбранного контура"], [variant.label, variant.border, "Линия выбранного контура"]];
  textureGrid.innerHTML = textures.map(([name, source, description]) => `<a class="texture-card" href="${source}" target="_blank" rel="noopener"><span class="texture-card__image"><img src="${source}" alt=""></span><strong>${escapeHtml(name)}</strong><small>${description}</small><code>${source.replace("./earth/", "earth/")}</code></a>`).join("");
}

function applyPreviewStyle() {
  if (!field) return;
  const request = ++styleRequest;
  const changingContour = field.getEarthContourId() !== earthStyle.russiaContour;
  contourLoading = changingContour;
  updateStatus();
  Promise.resolve(field.setEarthStyle(earthStyle)).then((applied) => {
    if (request !== styleRequest || !applied) return;
    if (changingContour) renderTextures();
  }).catch((error) => {
    if (request !== styleRequest) return;
    earthStyle.russiaContour = field.getEarthContourId();
    syncAllFields(); renderTextures(); persistDraft();
    showNotice("Не удалось загрузить контур. Предыдущий вариант сохранён; попробуй ещё раз.", true);
    console.error(error);
  }).finally(() => {
    if (request !== styleRequest) return;
    contourLoading = false; updateStatus();
  });
}

function syncAllFields() {
  for (const definition of EARTH_CONTROL_GROUPS.flatMap((group) => group.fields)) syncField(definition.key, earthStyle[definition.key]);
}

function syncField(key, value, source = null) {
  for (const input of controlsRoot.querySelectorAll(`[data-earth-style="${key}"]`)) if (input !== source) input.value = String(value);
  const output = controlsRoot.querySelector(`[data-color-output="${key}"]`);
  if (output) output.textContent = String(value).toUpperCase();
}

function applySearch() {
  const query = searchInput.value.trim().toLowerCase();
  for (const group of controlsRoot.querySelectorAll("[data-control-group]")) {
    let visible = 0;
    for (const row of group.querySelectorAll("[data-control-row]")) {
      const match = !query || row.dataset.search.includes(query);
      row.hidden = !match;
      if (match) visible++;
    }
    group.hidden = visible === 0;
    if (query && visible) group.open = true;
  }
}

function restore(source, message) {
  earthStyle = structuredClone(source);
  syncAllFields();
  applyPreviewStyle();
  updateStatus();
  showNotice(message);
  persistDraft();
}

async function save() {
  if (saving || contourLoading || !isDirty()) return;
  saving = true;
  updateStatus();
  const submitted = repairEarthStyleRelations(structuredClone(earthStyle));
  const submittedSnapshot = JSON.stringify(earthStyle);
  try {
    const response = await fetch(`${apiBase}/api/earth-style/save`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ earthStyle: submitted, expected }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Не удалось сохранить визуальный профиль Земли.");
    savedEarth = structuredClone(result.earthStyle || submitted);
    expected = { ...expected, ...result.revisions };
    shellConfig = { ...shellConfig, rendering: { ...shellConfig.rendering, earth: structuredClone(savedEarth) } };
    // Controls remain live during a request; acknowledge only the submitted version.
    if (JSON.stringify(earthStyle) === submittedSnapshot) {
      earthStyle = structuredClone(savedEarth);
      syncAllFields(); applyPreviewStyle();
      await clearDraft(draftKey).catch(() => {});
    } else persistDraft();
    publishProjectChange(`${Date.now()}:${result.backupId}`, EARTH_EDITOR_SOURCE_ID);
    saveDetail.textContent = `Резервная копия ${result.backupId}`;
    showNotice(isDirty() ? "Профиль записан. Последующие изменения ещё нужно сохранить." : "Визуальный профиль сохранён. Открытая игра обновится автоматически.");
  } finally { saving = false; updateStatus(); }
}

function persistDraft() {
  return saveDraft({ earthStyle, expected }, draftKey).catch(() => showNotice("Черновик не записан. Экспортируйте профиль перед закрытием.", true));
}
async function offerDraft() {
  const stored = await loadDraft(draftKey);
  if (!stored?.catalog?.earthStyle || JSON.stringify(stored.catalog.earthStyle) === JSON.stringify(savedEarth)) return;
  pendingDraft = stored.catalog;
  saveDetail.innerHTML = 'Есть черновик <button data-action="restore-draft">Восстановить</button> <button data-action="discard-draft">Удалить</button>';
}
async function restoreDraft() {
  if (!pendingDraft) return;
  if (pendingDraft.expected?.earth !== expected.earth) {
    exportEditorJson(pendingDraft, "kosmos-na-svyazi-earth-conflict.json");
    throw new Error("Черновик от прежнего профиля. Он экспортирован в JSON; перенесите нужные значения в актуальный профиль.");
  }
  restore(pendingDraft.earthStyle, "Черновик восстановлен; нажмите «Сохранить» для применения в игре");
  pendingDraft = null;
  saveDetail.textContent = "Черновик восстановлен";
}

function updateStatus() {
  const dirty = isDirty();
  dirtyState.textContent = saving ? "СОХРАНЕНИЕ…" : dirty ? "ЕСТЬ ИЗМЕНЕНИЯ" : "СОХРАНЕНО";
  dirtyState.classList.toggle("is-dirty", dirty);
  saveState.textContent = contourLoading ? "Загружаем выбранный контур…" : saving ? "Записываем ui-shell.json…" : dirty ? "Изменения применены в live preview, но ещё не записаны в игру" : "Визуальный профиль синхронизирован с игрой";
  const button = root.querySelector('[data-action="save"]');
  if (button) button.disabled = saving || contourLoading || !dirty;
}

function isDirty() { return savedEarth && JSON.stringify(earthStyle) !== JSON.stringify(savedEarth); }
function fieldDefinition(key) { return EARTH_CONTROL_GROUPS.flatMap((group) => group.fields).find((field) => field.key === key); }
function color(key, label) { return { key, label, type: "color" }; }
function number(key, label, min, max, step) { return { key, label, type: "number", min, max, step }; }
function select(key, label, options) { return { key, label, type: "select", options }; }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function showNotice(message, error = false, duration = 5200) {
  clearTimeout(noticeTimer);
  notice.textContent = message;
  notice.hidden = false;
  notice.classList.toggle("is-error", error);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, duration);
}
