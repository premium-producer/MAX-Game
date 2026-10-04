import { usesScreenConnections, screenReady, connectionMode } from "./screen-connectivity.mjs";
import { MISSIONS, ITEM_TYPES, configureMissions, activateMissionSettings, createMissionRun, reduceMission, deriveNetwork, availableCount, previewPlacementMove } from "./mission-game.mjs";
import { OBJECT_SETTINGS } from "./mission-game.mjs";
import { configurePlacementSurface, getPlacementRejection } from "./mission-game.mjs";
import { loadSurfaceMap } from "./surface-map.mjs";
import { createTranslator, parseWording } from "./wording.mjs";
import { missionInventory } from "./object-bank.mjs";
import { writableProjectBase, loadEditorProject, flushEditorInput, exportEditorJson, publishProjectChange, subscribeProjectChange } from "./project-editor-client.mjs";
import { catalogTypes } from "./editor-object-catalog.mjs";
import { iconSource } from "./object-catalog.mjs";



import { renderSystemInspector, renderTopology, changeSystemField, applySystemAction, pointIdsForRole, addPointFromBank } from "./editor-mission-system.js";
import { applyMissionFeedback, deriveMissionFeedback } from "./mission-feedback.mjs";
import { parseMissionCatalog } from "./mission-config.mjs";
import { resolveEndpointSafeArea, resolveMissionEarthOrbit, parseUiShellConfig, resolveEarthFrameOffset, resolveUiShellState } from "./ui-shell-config.mjs";
import { createWebGLField } from "./webgl-field.js";
import {
  appendMission,
  commitHistory,
  createHistory,
  deleteMission,
  moveArrayItem,
  redoHistory,
  reorderMissions,
  routeCounts,
  serializableCatalog,
  slugify,
  toEditableCatalog,
  undoHistory,
} from "./editor-state.mjs";
import { validateEditorCatalog } from "./editor-validation.mjs";
import {
  clearDraft,
  loadDraft,
  saveDraft,
} from "./editor-storage.mjs";

const app = document.getElementById("editor-app");
const worldElement = document.getElementById("editor-world");
const missionList = document.getElementById("mission-list");
const inspector = document.getElementById("inspector");
const inspectorTitle = document.getElementById("inspector-title");
const routePalette = document.getElementById("route-palette");
const routeSequence = document.getElementById("route-sequence");
const routeCountsElement = document.getElementById("route-counts");
const validationSummary = document.getElementById("validation-summary");
const dirtyDot = document.getElementById("dirty-dot");
const fileState = document.getElementById("file-state");
const draftState = document.getElementById("draft-state");
const mapLabels = document.getElementById("map-labels");
const mapHint = document.getElementById("map-hint");
const pointGroupMenu = document.getElementById("point-group-menu");
const previewHost = document.getElementById("preview-host");
const previewStage = document.getElementById("preview-stage");
const previewShell = document.getElementById("preview-shell");
const previewStateLabel = document.getElementById("preview-state-label");
const previewResolution = document.getElementById("preview-resolution");
const toastElement = document.getElementById("toast");
const cameraStateSelect = document.getElementById("camera-state");
const missionTextLayoutSelect = document.getElementById("mission-text-layout");
const cameraDistanceInput = document.getElementById("camera-distance");
const cameraFovInput = document.getElementById("camera-fov");
const cameraAxisInputs = [...document.querySelectorAll("[data-camera-axis]")];
const cameraTargetInputs = [...document.querySelectorAll("[data-camera-target]")];
const earthLimitInputs = [...document.querySelectorAll("[data-earth-limit]")];
const earthCenterRussiaInput = document.getElementById("earth-center-russia");
const earthCenteringPxInput = document.getElementById("earth-centering-px");
const EDITOR_SOURCE_ID = crypto.randomUUID();

let history = null;
let selectedMissionId = "";
let activeMapTool = "navigate";
let activePointGroup = "";
let webglField = null;
let shellConfig = null;
let savedSnapshot = "";
let savedShellSnapshot = "";
let selectedCameraState = "MISSION_SELECT";
let markerFrame = 0;
let toastTimer = 0;
let draggedRouteIndex = -1;
let previewResizeObserver = null;
let editorApiBase = "";
let projectRevision = "";
let expectedRevisions = {};
let pendingFormEdit = false;
let pendingCameraEdit = false;
let cameraDraftTimer = 0;
let draftKey = "";
let saveInFlight = false;
let testRun = null;
let screenTestActive = false, screenTestPreview = null, screenTestRevision = -1, screenTestAt = 0, screenTestSignature = "";
let testMissionId = "";
let testMode = false;
let testWakeTimer = 0;
let placementText = (key) => key;

bootstrap();

async function bootstrap() {
  try {
    await assertWritableEditorServer();
    draftKey = `mission-catalog:${editorApiBase}`;
    if (!await loadDraft(draftKey)) { const legacyDraft = await loadDraft(); if (legacyDraft) { await saveDraft(legacyDraft.catalog, draftKey); await clearDraft().catch(() => {}); } }
    const project = await loadEditorProject(editorApiBase);
    configurePlacementSurface(await loadSurfaceMap());
    placementText = createTranslator(parseWording(project.wording), "ru");
    const catalog = project.catalog, loadedShellConfig = parseUiShellConfig(project.shellConfig);
    expectedRevisions = project.revisions;
    configureMissions(catalog);
    projectRevision = catalog.revision || "";
    const editable = toEditableCatalog(catalog);
    shellConfig = editableShellConfig(loadedShellConfig);
    history = createHistory(editable);
    selectedMissionId = editable.missions[0].id;
    savedSnapshot = snapshot(editable);
    savedShellSnapshot = snapshot(shellConfig);
    fitPreviewStage();
    webglField = await createWebGLField({
      container: worldElement,
      placements: [],
      network: emptyNetwork(),
      itemTypes: ITEM_TYPES,
      endpoints: selectedMission().endpoints,
      initialView: shellConfig.states[selectedCameraState].cameraView,
      maxDrawingBufferPixels: loadedShellConfig.rendering.maxDrawingBufferPixels,
      earthStyle: loadedShellConfig.rendering.earth,
      nodeIconBackdropStyle: loadedShellConfig.rendering.nodeIconBackdrop,
      signalLinkStyle: loadedShellConfig.rendering.signalLinks,
      earthOrbit: resolveMissionEarthOrbit(loadedShellConfig.interaction.earthOrbit, selectedCameraState, selectedMission()?.number),
      freeOrbit: true,
      preciseOrbit: true,
      selectedItem: null,
      onOrbitGestureStart: () => { pendingCameraEdit = true; },
      onConnectionFrame: updateScreenTest,
      onPlace: (_item, geo) => placeMapPoint(geo),
      onMove: (id, geo) => testAction({ type: "MOVE", id, ...geo }),
      onMovePreview: (id, geo) => previewTestMove(id, geo),
      onMoveCancel: () => syncWebGL(),
      placementRejection: (type, geo) => testMode ? getPlacementRejection(type, geo) : null,
      onRemove: (id) => testAction({ type: "REMOVE", id }),
    });
    previewResizeObserver = new ResizeObserver(fitPreviewStage);
    previewResizeObserver.observe(previewHost);
    bindEvents();
    renderAll();
    markerFrame = requestAnimationFrame(syncMapLabels);
    await offerDraftRestore();
    subscribeProjectChange(() => {
      if (isDirty() || saveInFlight || document.activeElement?.matches("input,textarea,select")) {
        showToast("Банк или проект изменён в другой вкладке. Правки сохранены в черновике; перед записью перечитайте проект", true, 12000);
        scheduleAutosave();
      } else location.reload();
    }, { ignoreSourceId: EDITOR_SOURCE_ID });
  } catch (error) {
    app.classList.add("has-fatal-error");
    app.dataset.fatalError = error.message;
    fileState.textContent = `ОШИБКА: ${error.message}`;
    console.error(error);
  }
}

async function assertWritableEditorServer() {
  editorApiBase = await writableProjectBase();
}

function editorApiUrl(path) {
  return editorApiBase ? `${editorApiBase}${path}` : `.${path}`;
}

function bindEvents() {
  missionTextLayoutSelect.addEventListener("change", () => {
    shellConfig.typography.missionTextLayout = missionTextLayoutSelect.value;
    renderToolbar();
    scheduleAutosave();
  });
  app.addEventListener("click", onClick);
  app.addEventListener("change", onChange);
  app.addEventListener("input", (event) => { if (event.target.matches("[data-field],[data-v2-field],[data-objective-field]")) pendingFormEdit = true; });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { flushEditorInput(); if (pendingCameraEdit) storeCurrentCameraView(false); if (isDirty()) scheduleAutosave(); } });
  routeSequence.addEventListener("dragstart", onRouteDragStart);
  routeSequence.addEventListener("dragover", (event) => event.preventDefault());
  routeSequence.addEventListener("drop", onRouteDrop);
  cameraStateSelect.addEventListener("change", () => {
    storeCurrentCameraView(false);
    scheduleAutosave();
    selectedCameraState = cameraStateSelect.value;
    webglField.setViewState(shellConfig.states[selectedCameraState].cameraView, false);
    syncWebGL();
    syncCameraInputs();
    renderToolbar();
  });
  worldElement.addEventListener("pointerup", scheduleCameraDraft);
  worldElement.addEventListener("pointercancel", scheduleCameraDraft);
  worldElement.addEventListener("wheel", () => { pendingCameraEdit = true; scheduleCameraDraft(); }, { passive: true });
  cameraDistanceInput.addEventListener("input", applyCameraInputs);
  cameraFovInput.addEventListener("input", applyCameraInputs);
  for (const input of cameraAxisInputs) input.addEventListener("input", applyCameraInputs);
  for (const input of cameraTargetInputs) input.addEventListener("input", applyCameraInputs);
  for (const input of earthLimitInputs) input.addEventListener("input", applyEarthOrbitInputs);
  earthCenterRussiaInput.addEventListener("change", applyEarthOrbitInputs);
  earthCenteringPxInput.addEventListener("input", applyEarthOrbitInputs);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("beforeunload", (event) => {
    flushEditorInput();
    if (pendingCameraEdit) storeCurrentCameraView(false);
    if (!isDirty() && !saveInFlight) return;
    scheduleAutosave();
    event.preventDefault();
    event.returnValue = "";
  });
  window.addEventListener("pagehide", () => {
    clearTimeout(testWakeTimer);
    cancelAnimationFrame(markerFrame);
    previewResizeObserver?.disconnect();
    webglField?.dispose();
  }, { once: true });
}

async function onClick(event) {
  const deletePointButton = event.target.closest("[data-delete-point]");
  if (deletePointButton) {
    const pointId = deletePointButton.dataset.deletePoint;
    if (!window.confirm("Удалить эту точку? Если она используется маршрутом, маршрут будет переключён на другую точку той же роли.")) return;
    try {
      commit((next) => {
        const index = next.missions.findIndex((mission) => mission.id === selectedMissionId);
        applySystemAction(next, "delete-point", ["missions", index, "endpoints", pointId]);
      });
      if (activeMapTool === pointId) setMapTool("navigate");
      showToast("Точка удалена. Действие можно отменить кнопкой ↶.");
    } catch (error) { showToast(error.message, true); }
    return;
  }
  const addPointButton = event.target.closest("[data-add-point-role]");
  if (addPointButton) {
    const role = addPointButton.dataset.addPointRole;
    let pointId = "";
    commit((next) => {
      const index = next.missions.findIndex((mission) => mission.id === selectedMissionId);
      pointId = addPointFromBank(next, index, role, addPointButton.dataset.pointIcon);
    });
    activePointGroup = "";
    setMapTool(pointId);
    showToast(`${role === "start" ? "Стартовая" : "Завершающая"} точка добавлена. Кликните по Земле, чтобы поставить её.`);
    return;
  }
  const pointGroupButton = event.target.closest("[data-point-group]");
  if (pointGroupButton) {
    activePointGroup = activePointGroup === pointGroupButton.dataset.pointGroup ? "" : pointGroupButton.dataset.pointGroup;
    renderToolbar();
    return;
  }
  const testButton = event.target.closest("[data-test-action]");
  if (testButton) {
    if (testButton.dataset.testAction === "expand") { app.classList.toggle("is-topology-expanded"); return; }
    if (testButton.dataset.testAction === "toggle") {
      testMode = !testMode;
      if (testMode) { selectedCameraState = "MISSION_PLAY"; webglField.setViewState(shellConfig.states.MISSION_PLAY.cameraView, false); }
      activeMapTool = "navigate";
    } else if (testButton.dataset.testAction === "reset") testRun = null;
    else activeMapTool = `test:${testButton.dataset.testAction}`;
    renderAll(); return;
  }
  const systemButton = event.target.closest("[data-v2-action]");
  if (systemButton) {
    try {
      const action = systemButton.dataset.v2Action, path = JSON.parse(systemButton.dataset.v2Path);
      const needsId = ["rename-point", "add-type", "duplicate-type"].includes(action);
      const argument = needsId ? window.prompt("Новый стабильный ID (латиница, цифры, _ или -)") : undefined;
      if (needsId && argument === null) return;
      commit((next) => applySystemAction(next, action, path, argument));
    } catch (error) { showToast(error.message, true); }
    return;
  }
  const toolButton = event.target.closest("[data-map-tool]");
  if (toolButton) {
    setMapTool(toolButton.dataset.mapTool);
    return;
  }
  const missionButton = event.target.closest("[data-select-mission]");
  if (missionButton) {
    selectedMissionId = missionButton.dataset.selectMission;
    activeMapTool = "navigate";
    activePointGroup = "";
    renderAll();
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  try {
    if (action === "save-project") await saveProject();
    else if (action === "export-draft") { flushEditorInput(); if (pendingCameraEdit) storeCurrentCameraView(false); exportEditorJson(draftPayload(), "kosmos-na-svyazi-missions-draft.json"); }
    else if (action === "reload-project") { flushEditorInput(); if (pendingCameraEdit) storeCurrentCameraView(false); if (isDirty()) await saveDraft(draftPayload(), draftKey); location.reload(); }
    else if (action === "undo") applyHistory(undoHistory(history));
    else if (action === "redo") applyHistory(redoHistory(history));
    else if (action === "validate") showValidation(true);
    else if (action === "add-mission") addMission();
    else if (action === "duplicate-mission") duplicateMission();
    else if (action === "delete-mission") removeMission();
    else if (action === "mission-up") moveMission(-1);
    else if (action === "mission-down") moveMission(1);
    else if (action === "capture-view") captureView();
    else if (action === "capture-view-all") captureView(true);
    else if (action === "restore-view") webglField.setViewState(shellConfig.states[selectedCameraState].cameraView, false);
    else if (action === "add-route") addRouteItem(event.target.closest("[data-item]").dataset.item);
    else if (action === "remove-route") changeRouteItem(event, "remove");
    else if (action === "route-left") changeRouteItem(event, "left");
    else if (action === "route-right") changeRouteItem(event, "right");
    else if (action === "add-objective") addObjective();
    else if (action === "remove-objective") removeObjective(Number(event.target.closest("[data-objective-index]").dataset.objectiveIndex));
    else if (action === "generate-objectives") generateObjectives();
    else if (action === "restore-draft") await restoreDraft();
    else if (action === "dismiss-draft") await dismissDraft();
  } catch (error) {
    if (error?.name !== "AbortError") showToast(error.message, true);
  }
}

async function onChange(event) {
  pendingFormEdit = false;
  if (event.target.dataset.v2Field) {
    const path = JSON.parse(event.target.dataset.v2Field);
    const value = event.target.type === "number" ? (event.target.value === "" ? undefined : Number(event.target.value)) : event.target.value;
    try { commit((next) => changeSystemField(next, path, value)); }
    catch (error) { showToast(error.message, true); }
    return;
  }
  const field = event.target.dataset.field;
  if (field) {
    const value = event.target.type === "checkbox" ? event.target.checked : coerceValue(event.target);
    if (field === "id" && (!String(value).trim() || catalog().missions.some((mission) => mission.id === value && mission.id !== selectedMissionId))) {
      showToast("ID миссии должен быть непустым и уникальным.", true);
      renderInspector();
      return;
    }
    commit((next) => setPath(next.missions.find((mission) => mission.id === selectedMissionId), field, value), field === "id" ? String(value) : null);
    return;
  }
  if (event.target.matches("[data-dependency]")) {
    const number = Number(event.target.dataset.dependency);
    commit((next) => {
      const mission = next.missions.find((entry) => entry.id === selectedMissionId);
      const dependencies = new Set(mission.unlock.requiresCompleted);
      event.target.checked ? dependencies.add(number) : dependencies.delete(number);
      mission.unlock.requiresCompleted = [...dependencies].sort((a, b) => a - b);
    });
    return;
  }
  const objectiveIndex = Number(event.target.dataset.objectiveIndex);
  const objectiveField = event.target.dataset.objectiveField;
  if (Number.isInteger(objectiveIndex) && objectiveField) updateObjective(objectiveIndex, objectiveField, coerceValue(event.target));
}

function renderAll() {
  if (!history) return;
  const inspectorScroll = inspector.scrollTop;
  const openSections = [...inspector.querySelectorAll("details[open]")].map((el) => el.querySelector("summary")?.textContent);
  const topologyScroll = routeSequence.querySelector(".v2-topology")?.scrollTop || 0;
  if (!selectedMission()) selectedMissionId = catalog().missions[0]?.id || "";
  renderMissionList();
  renderInspector();
  renderRoute();
  renderValidation();
  renderToolbar();
  syncWebGL();
  for (const details of inspector.querySelectorAll("details")) details.open = openSections.includes(details.querySelector("summary")?.textContent);
  inspector.scrollTop = inspectorScroll;
  const topology = routeSequence.querySelector(".v2-topology");
  if (topology) topology.scrollTop = topologyScroll;
}

function renderMissionList() {
  const validation = validateEditorCatalog(catalog());
  missionList.innerHTML = catalog().missions.map((mission, index) => {
    const errors = validation.errors.filter((issue) => issue.path.startsWith(`missions.${index}`));
    const warnings = validation.warnings.filter((issue) => issue.path.startsWith(`missions.${index}`));
    const issues = [...errors, ...warnings];
    const issueLabel = issues.map((issue) => issue.message).join(" · ");
    return `<button type="button" class="mission-list-item ${mission.id === selectedMissionId ? "is-selected" : ""}" data-select-mission="${escapeHtml(mission.id)}">
      <span class="mission-list-number">${String(mission.number).padStart(2, "0")}</span>
      <span class="mission-list-copy"><strong>${escapeHtml(mission.name)}</strong><small>${escapeHtml(mission.id)}</small></span>
      ${issues.length ? `<span class="mission-list-issues ${errors.length ? "is-error" : "is-warning"}" title="${escapeHtml(issueLabel)}" aria-label="${escapeHtml(issueLabel)}"><b>!</b>${issues.length}</span>` : ""}
    </button>`;
  }).join("");
}

function renderInspector() {
  const mission = selectedMission();
  if (!mission) {
    inspectorTitle.textContent = "НЕТ МИССИЙ";
    inspector.innerHTML = '<div class="empty-state">Добавьте первую миссию.</div>';
    return;
  }
  inspectorTitle.textContent = `МИССИЯ №${mission.number}`;
  const missionIndex = catalog().missions.indexOf(mission);
  if (catalog().schemaVersion === 2) {
    inspector.innerHTML = `<section class="inspector-section"><h3>ОСНОВНОЕ</h3>${textField("ID", "id", mission.id)}${textField("Название", "name", mission.name)}${textareaField("Описание справа в игре", "description", mission.description)}${textareaField("Краткое описание в меню", "summary", mission.summary || "")}${textField("Уровень сложности", "level", mission.level || "")}${numberField("Время, сек", "timeSeconds", mission.timeSeconds, 1, 3600)}${textField("Текст успеха", "successText", mission.successText)}${geoFields("Маркер миссии", "mapPosition", mission.mapPosition)}<label class="toggle-field"><input type="checkbox" data-field="connectEndpointsOnComplete" ${mission.connectEndpointsOnComplete ? "checked" : ""}><span></span><b>Декоративное замыкание после победы</b></label></section>
    <section class="inspector-section"><h3>РАЗБЛОКИРОВКА</h3><div class="dependency-list">${catalog().missions.filter((m) => m.id !== mission.id).map((m) => `<label><input type="checkbox" data-dependency="${m.number}" ${mission.unlock.requiresCompleted.includes(m.number) ? "checked" : ""}>После миссии №${m.number}</label>`).join("")}</div></section>${renderSystemInspector(catalog(), missionIndex)}`;
    return;
  }
  inspector.innerHTML = `
    ${renderMissionIssues(missionIndex)}
    <section class="inspector-section">
      <h3>ОСНОВНОЕ</h3>
      ${textField("ID", "id", mission.id)}
      ${textField("Название", "name", mission.name)}
      ${textareaField("Описание", "description", mission.description)}
      <div class="field-grid">${numberField("Время, сек", "timeSeconds", mission.timeSeconds, 1, 3600)}${textField("Текст успеха", "successText", mission.successText)}</div>
    </section>
    <section class="inspector-section">
      <h3>КАРТА</h3>
      ${geoFields("Маркер миссии", "mapPosition", mission.mapPosition)}
      ${geoFields("Точка A", "endpoints.A", mission.endpoints.A, true)}
      ${geoFields("Точка Б", "endpoints.B", mission.endpoints.B, true)}
      <label class="toggle-field"><input type="checkbox" data-field="connectEndpointsOnComplete" ${mission.connectEndpointsOnComplete ? "checked" : ""}><span></span><b>Замкнуть A—Б после сборки</b></label>
    </section>
    <section class="inspector-section">
      <h3>РАЗБЛОКИРОВКА</h3>
      <div class="dependency-list">${catalog().missions.filter((entry) => entry.id !== mission.id).map((entry) => `<label><input type="checkbox" data-dependency="${entry.number}" ${mission.unlock.requiresCompleted.includes(entry.number) ? "checked" : ""}><span>После миссии №${entry.number} · ${escapeHtml(entry.name)}</span></label>`).join("") || "<small>Для первой миссии зависимости не нужны.</small>"}</div>
    </section>
    <section class="inspector-section">
      <div class="section-heading"><h3>ЗАДАЧИ</h3><div><button type="button" data-action="generate-objectives">ИЗ МАРШРУТА</button><button type="button" data-action="add-objective">＋</button></div></div>
      <div class="objective-list">${mission.objectives.map(renderObjective).join("")}</div>
    </section>`;
}

function renderMissionIssues(index) {
  const validation = validateEditorCatalog(catalog());
  const issues = [
    ...validation.errors.filter((issue) => issue.path.startsWith(`missions.${index}`)).map((issue) => ({ ...issue, kind: "error" })),
    ...validation.warnings.filter((issue) => issue.path.startsWith(`missions.${index}`)).map((issue) => ({ ...issue, kind: "warning" })),
  ];
  if (!issues.length) return "";
  return `<section class="mission-issues" aria-label="Проверка выбранной миссии">
    <strong>ТРЕБУЕТ ВНИМАНИЯ</strong>
    <ul>${issues.map((issue) => `<li class="is-${issue.kind}">${escapeHtml(issue.message)}</li>`).join("")}</ul>
  </section>`;
}

function renderObjective(objective, index) {
  const condition = objective.condition;
  return `<article class="objective-editor" data-objective-index="${index}">
    <div class="objective-header"><span>ЗАДАЧА ${index + 1}</span><button type="button" data-action="remove-objective" data-objective-index="${index}" aria-label="Удалить задачу">×</button></div>
    <div class="field-grid">${objectiveInput("ID", index, "id", objective.id)}${objectiveInput("Текст", index, "label", objective.label)}</div>
    <label class="editor-field"><span>Условие</span><select data-objective-index="${index}" data-objective-field="condition.type">${conditionOptions(condition.type)}</select></label>
    ${conditionFields(condition, index)}
  </article>`;
}

function conditionFields(condition, index) {
  if (condition.type === "connectedSequence") return `${objectiveInput("Цепочка через запятую", index, "condition.sequence", condition.sequence.join(", "))}<p class="condition-note">terminal, satellite, gateway, core, internet; endpoint:A в начале или endpoint:B в конце привязывают цепочку к краю маршрута. Все объекты должны быть соединены.</p>`;
  if (condition.type === "placed") return `<div class="field-grid">${objectiveSelect("Объект", index, "condition.object", condition.object)}${objectiveNumber("Количество", index, "condition.count", condition.count || 1)}</div>`;
  if (condition.type === "adjacent") return `<div class="field-grid field-grid--three">${objectiveSelect("Слева", index, "condition.first", condition.first)}${objectiveSelect("Справа", index, "condition.second", condition.second)}${objectiveNumber("Кол-во", index, "condition.count", condition.count || 1)}</div>`;
  return '<p class="condition-note">Дополнительные параметры не требуются.</p>';
}

function renderRoute() {
  const mission = selectedMission();
  if (mission && catalog().schemaVersion === 2) {
    routePalette.innerHTML = `<button type="button" data-test-action="expand">РАЗВЕРНУТЬ / СВЕРНУТЬ СХЕМЫ</button><button type="button" data-test-action="toggle">${testMode ? "ВЫЙТИ ИЗ ТЕСТА" : "ТЕСТ СЕТИ ВО ВЬЮПОРТЕ"}</button><button type="button" data-test-action="reset">СБРОСИТЬ ТЕСТ</button>${testMode ? Object.entries(catalogTypes(catalog())).filter(([type]) => missionInventory(catalog(), selectedMission())[type] > 0).map(([type, item]) => `<button type="button" data-test-action="${type}">${escapeHtml(item.short)}</button>`).join("") : ""}<p class="condition-note">Роли — в маршрутах справа. Инвентарь — отдельно в инспекторе. Тестовые объекты не записываются в миссию.</p><div id="test-diagnostics" class="condition-note"></div>`;
    routeSequence.innerHTML = renderTopology(catalog(), catalog().missions.indexOf(mission));
    routeCountsElement.textContent = `${mission.topology.paths.length} маршрутов · ${Object.values(missionInventory(catalog(), mission)).reduce((a, b) => a + b, 0)} объектов`;
    return;
  }
  routePalette.innerHTML = Object.entries(ITEM_TYPES).map(([type, item]) => `<button type="button" data-action="add-route" data-item="${type}"><img src="${item.icon}" alt=""><span>${escapeHtml(item.short)}</span><b>＋</b></button>`).join("");
  if (!mission) {
    routeSequence.innerHTML = "";
    routeCountsElement.innerHTML = "";
    return;
  }
  routeSequence.innerHTML = `<li class="route-endpoint">A</li>${mission.route.map((type, index) => {
    const item = ITEM_TYPES[type];
    return `<li class="route-item" draggable="true" data-route-index="${index}">
      <span class="route-index">${index + 1}</span><img src="${item?.icon || ""}" alt=""><strong>${escapeHtml(item?.short || type)}</strong>
      <span class="route-item-actions"><button type="button" data-action="route-left" aria-label="Сдвинуть влево">←</button><button type="button" data-action="route-right" aria-label="Сдвинуть вправо">→</button><button type="button" data-action="remove-route" aria-label="Удалить">×</button></span>
    </li>`;
  }).join("")}<li class="route-endpoint">Б</li>`;
  const counts = routeCounts(mission.route);
  routeCountsElement.innerHTML = Object.entries(counts).map(([type, count]) => `<span>${escapeHtml(ITEM_TYPES[type]?.short || type)} ×${count}</span>`).join("");
}

function renderValidation() {
  const validation = validateEditorCatalog(catalog());
  const parts = [];
  if (validation.valid) parts.push('<strong class="is-valid">✓ КАТАЛОГ КОРРЕКТЕН</strong>');
  else parts.push(`<strong class="is-invalid">${validation.errors.length} ${plural(validation.errors.length, "ОШИБКА", "ОШИБКИ", "ОШИБОК")}</strong>`);
  if (validation.warnings.length) parts.push(`<strong class="is-warning">${validation.warnings.length} ${plural(validation.warnings.length, "ПРЕДУПРЕЖДЕНИЕ", "ПРЕДУПРЕЖДЕНИЯ", "ПРЕДУПРЕЖДЕНИЙ")}</strong>`);
  validationSummary.innerHTML = parts.join("<span>·</span>");
}

function renderToolbar() {
  missionTextLayoutSelect.disabled = false;
  missionTextLayoutSelect.value = shellConfig.typography.missionTextLayout;
  const dirty = isDirty();
  app.querySelector('[data-action="save-project"]').disabled = saveInFlight;
  dirtyDot.classList.toggle("is-dirty", dirty);
  const dirtyParts = [isMissionDirty() ? "МИССИИ" : "", isShellDirty() ? "СЦЕНА" : ""].filter(Boolean);
  fileState.textContent = saveInFlight ? "СОХРАНЕНИЕ…" : dirtyParts.length ? `ИЗМЕНЕНО: ${dirtyParts.join(" + ")}` : "ИГРОВЫЕ JSON · СОХРАНЕНО";
  app.querySelector('[data-action="undo"]').disabled = !history.past.length;
  app.querySelector('[data-action="redo"]').disabled = !history.future.length;
  for (const button of app.querySelectorAll("[data-map-tool]")) button.classList.toggle("is-active", button.dataset.mapTool === activeMapTool);
  renderPointGroups();
  cameraStateSelect.value = selectedCameraState;
  applyPreviewShell();
  syncCameraInputs();
  syncEarthOrbitInputs();
  mapHint.textContent = activeMapTool === "navigate" ? "ЛКМ: X/Y · Alt+ЛКМ или ПКМ: Z · Shift+ЛКМ: камера · колесо: зум" : `Кликните по Земле: ${activeMapTool === "mission" ? "маркер миссии" : activeMapTool.startsWith("test:") ? (ITEM_TYPES[activeMapTool.slice(5)]?.short || activeMapTool.slice(5)) : `точка ${activeMapTool}`}`;
}

function renderPointGroups() {
  const mission = selectedMission();
  for (const button of app.querySelectorAll("[data-point-group]")) {
    const ids = mission ? pointIdsForRole(mission, button.dataset.pointGroup) : [];
    button.querySelector("b").textContent = ids.length;
    button.classList.toggle("is-active", button.dataset.pointGroup === activePointGroup);
  }
  if (!mission || !activePointGroup) {
    pointGroupMenu.hidden = true;
    pointGroupMenu.innerHTML = "";
    return;
  }
  const title = activePointGroup === "start" ? "СТАРТОВЫЕ ТОЧКИ" : "ЗАВЕРШАЮЩИЕ ТОЧКИ";
  const pointIds = pointIdsForRole(mission, activePointGroup);
  const icons = (catalog().system.pointIcons || []).map((id) => [id, catalog().system.icons[id]]).filter(([, icon]) => icon);
  pointGroupMenu.hidden = false;
  pointGroupMenu.innerHTML = `<div class="point-group-menu__head"><strong>${title}</strong><span>${pointIds.length}</span></div>
    <div class="point-group-current">${pointIds.map((id) => renderPointChoice(id, mission.endpoints[id])).join("") || "<small>Пока нет точек этой роли</small>"}</div>
    <span class="point-group-menu__label">ДОБАВИТЬ ИЗ БАНКА ИКОНОК</span>
    <div class="point-bank-grid">${icons.map(([id, icon]) => `<button type="button" data-add-point-role="${activePointGroup}" data-point-icon="${escapeHtml(id)}" title="Добавить ${escapeHtml(icon.label)}"><img src="${escapeHtml(iconSource(icon))}" alt=""><span>${escapeHtml(icon.label)}</span><b>＋</b></button>`).join("")}</div>
    <a href="./object.html#icons" target="_blank" rel="noopener">ОТКРЫТЬ БАНК ИКОНОК ↗</a>`;
}

function renderPointChoice(id, point) {
  const icon = point?.icon ? catalog().system.icons[point.icon] : null;
  return `<article class="point-choice ${activeMapTool === id ? "is-active" : ""}"><button type="button" data-map-tool="${escapeHtml(id)}" class="point-choice__select" title="Разместить или переместить ${escapeHtml(icon?.label || id)}">${icon ? `<img src="${escapeHtml(iconSource(icon))}" alt="">` : ""}<span><b>${escapeHtml(icon?.label || id)}</b><small>${escapeHtml(id)}</small></span></button><button type="button" class="point-choice__delete" data-delete-point="${escapeHtml(id)}" aria-label="Удалить точку ${escapeHtml(icon?.label || id)}" title="Удалить точку">×</button></article>`;
}

function fitPreviewStage() {
  if (!previewHost || !previewStage) return;
  const availableWidth = Math.max(1, previewHost.clientWidth - 2);
  const availableHeight = Math.max(1, previewHost.clientHeight - 2);
  const width = Math.max(1, Math.floor(Math.min(availableWidth, availableHeight * 16 / 9)));
  const height = Math.max(1, Math.floor(width * 9 / 16));
  previewStage.style.width = `${width}px`;
  previewStage.style.height = `${height}px`;
  applyPreviewShell();
  webglField?.resize();
}

function applyPreviewShell() {
  if (!shellConfig || !previewStage || !previewShell) return;
  const { designViewport, geometry } = shellConfig;
  const state = resolveUiShellState(shellConfig, selectedCameraState);
  const scale = previewStage.clientWidth / designViewport.width || 1;
  const values = {
    "--preview-scale": scale,
    "--preview-inset": geometry.outerInset * scale,
    "--preview-header-height": geometry.headerHeight * scale,
    "--preview-header-padding": geometry.headerPadding * scale,
    "--preview-frame-top": (geometry.headerHeight + geometry.frameGap) * scale,
    "--preview-frame-right": state.frameRight * scale,
    "--preview-frame-bottom": state.frameBottom * scale,
    "--preview-footer-right": state.footerRight * scale,
    "--preview-footer-height": geometry.footerHeight * scale,
    "--preview-footer-bottom": geometry.footerBottom * scale,
    "--preview-inventory-width": geometry.inventoryWidth * scale,
    "--preview-inventory-padding": 25 * scale,
    "--preview-border-width": Math.max(1, geometry.borderWidth * scale),
    "--preview-radius": Math.max(2, geometry.borderRadius * scale),
    "--preview-blur": state.backgroundBlur * scale,
    "--preview-dim": state.backgroundDim,
    "--preview-hint-top": (state.header ? geometry.headerHeight + geometry.frameGap + 12 : 18) * scale,
  };
  for (const [name, value] of Object.entries(values)) {
    previewStage.style.setProperty(name, typeof value === "number" && name !== "--preview-scale" && name !== "--preview-dim" ? `${value}px` : String(value));
  }
  previewStage.dataset.earthMask = state.earthMask;
  previewShell.dataset.header = state.header ? "visible" : "hidden";
  previewShell.dataset.frame = state.frame ? "visible" : "hidden";
  previewShell.dataset.footer = state.footer ? "visible" : "hidden";
  previewShell.dataset.inventory = state.inventory ? "visible" : "hidden";
  previewShell.dataset.footerStyle = state.footerStyle;
  previewStateLabel.textContent = selectedCameraState;
  previewResolution.textContent = `${designViewport.width} × ${designViewport.height}`;
  webglField?.setEarthOrbitPreferences(resolveMissionEarthOrbit(shellConfig.interaction.earthOrbit, selectedCameraState, selectedMission()?.number));
  webglField?.setEndpointSafeArea(resolveEndpointSafeArea(shellConfig, selectedCameraState));
  const earthOffset = resolveEarthFrameOffset(shellConfig, selectedCameraState);
  webglField?.setPresentationOffset(earthOffset.x * scale, earthOffset.y * scale, 0, true);
}

function syncWebGL() {
  screenTestActive = false; screenTestPreview = null; screenTestRevision = -1;
  if (!webglField) return;
  webglField.setScreenConnections(false);
  const mission = selectedMission();
  const missionSelectPreview = selectedCameraState === "MISSION_SELECT";
  const missionPlayPreview = selectedCameraState === "MISSION_PLAY";
  if (catalog().schemaVersion === 2) {
    try {
      const previousTypes = ITEM_TYPES, previousSettings = OBJECT_SETTINGS;
      configureMissions(parseMissionCatalog(catalog())); activateMissionSettings(mission.number);
      if (testRun?.placements.some((p) => !ITEM_TYPES[p.type] || previousTypes[p.type]?.behavior !== ITEM_TYPES[p.type].behavior || ["minAltitude", "maxAltitude"].some((key) => previousSettings[p.type]?.[key] !== OBJECT_SETTINGS[p.type]?.[key]))) {
        testRun = null; activeMapTool = "navigate";
        showToast("Тестовая сеть сброшена: изменилось размещение или высотные границы её оборудования");
      }
    }
    catch (error) {
      const diagnostics = document.getElementById("test-diagnostics");
      if (diagnostics) diagnostics.textContent = `Предпросмотр приостановлен: ${error.message}`;
      return; // Invalid edits remain editable; keep the last valid preview intact.
    }
  }
  if (testMode && missionPlayPreview && catalog().schemaVersion === 2) {
    if (!testRun || testMissionId !== mission.id) { testRun = createMissionRun(mission.number); testMissionId = mission.id; }
    screenTestActive = usesScreenConnections(MISSIONS[mission.number]);
    webglField.setScreenConnections(screenTestActive, connectionMode(MISSIONS[mission.number]) === "hybrid");
    if (screenTestActive) testRun = { ...testRun, status: "playing", connectionHold: null };
    const evaluationNetwork = deriveNetwork(testRun, Date.now());
    const feedbackEvents = deriveMissionFeedback({ mission, run: testRun, network: evaluationNetwork });
    const network = applyMissionFeedback(evaluationNetwork, feedbackEvents);
    webglField.setMissionMarkers([]);
    webglField.update({ placements: testRun.placements, network, selectedItem: activeMapTool.startsWith("test:") ? activeMapTool.slice(5) : activeMapTool === "navigate" ? null : "editor-anchor", endpoints: mission.endpoints });
    const diagnostics = document.getElementById("test-diagnostics");
    if (diagnostics) diagnostics.textContent = `${network.complete ? "✓ МИССИЯ ВЫПОЛНЕНА" : "Задачи: " + network.objectives.map((ok) => ok ? "✓" : "—").join(" ")}\n${network.diagnostics.slice(0, 6).map((d) => d.message).join("\n")}`;
    return;
  }
  webglField.setMissionMarkers(missionSelectPreview
    ? catalog().missions.map((entry) => ({ id: entry.id, ...entry.mapPosition, status: entry.id === selectedMissionId ? "completed" : "open" }))
    : []);
  webglField.update({
    placements: [],
    network: emptyNetwork(),
    selectedItem: activeMapTool === "navigate" ? null : "editor-anchor",
    endpoints: missionPlayPreview ? mission?.endpoints || {} : {},
  });
}

function syncMapLabels() {
  if (webglField && history) {
    const showMissionLabels = selectedCameraState === "MISSION_SELECT";
    const existing = new Map([...mapLabels.children].map((element) => [element.dataset.id, element]));
    for (const mission of catalog().missions) {
      let label = existing.get(mission.id);
      if (!label) {
        label = document.createElement("span");
        label.className = "map-mission-label";
        label.dataset.id = mission.id;
        mapLabels.append(label);
      }
      const projected = webglField.projectGeo(mission.mapPosition);
      label.textContent = `${mission.number} · ${mission.name}`;
      label.style.transform = `translate3d(${projected.x * worldElement.clientWidth}px, ${projected.y * worldElement.clientHeight}px, 0)`;
      label.hidden = !showMissionLabels || !projected.visible;
      label.classList.toggle("is-selected", mission.id === selectedMissionId);
      existing.delete(mission.id);
    }
    for (const element of existing.values()) element.remove();
    syncCameraInputs();
  }
  markerFrame = requestAnimationFrame(syncMapLabels);
}

function commit(mutator, nextSelectedMissionId = null) {
  const next = structuredClone(catalog());
  mutator(next);
  history = commitHistory(history, next);
  if (nextSelectedMissionId) selectedMissionId = nextSelectedMissionId;
  renderAll();
  scheduleAutosave();
}

function applyHistory(nextHistory) {
  if (nextHistory === history) return;
  history = nextHistory;
  renderAll();
  scheduleAutosave();
}

function addMission() {
  const result = appendMission(catalog());
  history = commitHistory(history, result.catalog);
  selectedMissionId = result.mission.id;
  renderAll();
  scheduleAutosave();
}

function duplicateMission() {
  const source = selectedMission();
  if (!source) return;
  const result = appendMission(catalog(), source);
  history = commitHistory(history, result.catalog);
  selectedMissionId = result.mission.id;
  renderAll();
  scheduleAutosave();
}

function removeMission() {
  const mission = selectedMission();
  if (!mission || catalog().missions.length === 1) {
    showToast("В каталоге должна остаться хотя бы одна миссия.", true);
    return;
  }
  if (!window.confirm(`Удалить миссию №${mission.number} «${mission.name}»?`)) return;
  const index = catalog().missions.findIndex((entry) => entry.id === mission.id);
  const next = deleteMission(catalog(), mission.id);
  selectedMissionId = next.missions[Math.min(index, next.missions.length - 1)].id;
  history = commitHistory(history, next);
  renderAll();
  scheduleAutosave();
}

function moveMission(direction) {
  const index = catalog().missions.findIndex((mission) => mission.id === selectedMissionId);
  const target = index + direction;
  if (target < 0 || target >= catalog().missions.length) return;
  commit((next) => Object.assign(next, reorderMissions(next, index, target)));
}

function setMapTool(tool) {
  if (!["navigate", "mission"].includes(tool) && !selectedMission()?.endpoints[tool]) { showToast("Такой точки нет. Выберите точку в инспекторе.", true); return; }
  activeMapTool = tool;
  activePointGroup = "";
  renderToolbar();
  syncWebGL();
}

function placeMapPoint(geo) {
  if (testMode && activeMapTool.startsWith("test:")) {
    testAction({ type: "PLACE", item: activeMapTool.slice(5), ...geo }); return;
  }
  if (activeMapTool === "navigate" || !selectedMission()) return;
  if (activeMapTool !== "mission" && !selectedMission().endpoints[activeMapTool]) return;
  const point = { latitude: round(geo.latitude, 4), longitude: round(geo.longitude, 4) };
  commit((next) => {
    const mission = next.missions.find((entry) => entry.id === selectedMissionId);
    if (activeMapTool === "mission") mission.mapPosition = point;
    else mission.endpoints[activeMapTool] = { ...mission.endpoints[activeMapTool], ...point };
  });
  showToast(`${activeMapTool === "mission" ? "Маркер миссии" : `Точка ${activeMapTool}`} установлен: ${point.latitude}, ${point.longitude}`);
}

function testAction(action) {
  if (!testMode || !testRun) return;
  if (action.type === "PLACE" && availableCount(testRun, action.item) < 1) { showToast("Инвентарь этого типа исчерпан", true); return; }
  const previous = { ...testRun, status: "playing" };
  testRun = reduceMission(previous, { ...action, now: Date.now() });
  syncWebGL();
  if (testRun === previous && ["PLACE", "MOVE"].includes(action.type)) {
    const type = action.item || previous.placements.find((p) => p.id === Number(action.id))?.type;
    const reason = getPlacementRejection(type, action);
    if (reason) showToast(placementText(`placement.${["water", "land"].includes(reason) ? reason : "unavailable"}.message`), true);
    return;
  }
  clearTimeout(testWakeTimer);
  testWakeTimer = setTimeout(syncWebGL, 720);
}

function updateScreenTest() {
  if (!screenTestActive || !testRun || document.hidden) return;
  const now = Date.now(), mission = MISSIONS[testRun.mission], run = screenTestPreview || testRun;
  const snapshot = webglField.captureConnections(run, mission, null, now, false, shellConfig.designViewport.width);
  if ((snapshot.revision === screenTestRevision && (testRun.status === "complete" || !screenReady(mission, testRun, now))) || now - screenTestAt < 33) return;
  screenTestRevision = snapshot.revision; screenTestAt = now;
  let evaluatedRun;
  if (screenTestPreview) evaluatedRun = { ...run, connectionProjection: snapshot };
  else {
    testRun = reduceMission({ ...testRun, status: "playing" }, { type: "CONNECTION_VIEW", snapshot, now });
    if (screenReady(mission, testRun, now)) testRun = reduceMission(testRun, { type: "CHECK", now });
    evaluatedRun = testRun;
  }
  const evaluation = deriveNetwork(evaluatedRun, now);
  const signature = JSON.stringify([evaluation.states, evaluation.objectives, evaluation.links.map((l) => [l.a, l.b, l.correct]), evaluation.diagnostics, evaluatedRun.status]);
  if (signature === screenTestSignature) return;
  screenTestSignature = signature;
  const network = applyMissionFeedback(evaluation, deriveMissionFeedback({ mission, run: evaluatedRun, network: evaluation }));
  webglField.update({ placements: run.placements, network, selectedItem: activeMapTool.startsWith("test:") ? activeMapTool.slice(5) : null, endpoints: mission.endpoints });
  const diagnostics = document.getElementById("test-diagnostics");
  if (diagnostics) diagnostics.textContent = `${evaluatedRun.status === "complete" ? "✓ РАКУРС СОБРАН" : "ПО РАКУРСУ · Задачи: " + network.objectives.map((ok) => ok ? "✓" : "—").join(" ")}\n${network.diagnostics.slice(0, 6).map((d) => d.message).join("\n")}\nПроверяй также в игре: там учитываются перекрывающие панели`;
}

function previewTestMove(id, geo) {
  if (!testMode || !testRun) return;
  const previewRun = previewPlacementMove(testRun, id, geo);
  if (previewRun === testRun) return;
  const mission = selectedMission();
  if (screenTestActive) { screenTestPreview = previewRun; testRun = { ...testRun, connectionHold: null }; }
  const evaluationNetwork = deriveNetwork(previewRun, Date.now());
  const feedbackEvents = deriveMissionFeedback({ mission, run: previewRun, network: evaluationNetwork });
  const network = applyMissionFeedback(evaluationNetwork, feedbackEvents);
  webglField.update({
    placements: previewRun.placements,
    network,
    selectedItem: activeMapTool.startsWith("test:") ? activeMapTool.slice(5) : null,
    endpoints: mission.endpoints,
  });
}

function captureView(applyToAll = false) {
  storeCurrentCameraView(applyToAll);
  renderToolbar();
  scheduleAutosave();
  showToast(applyToAll
    ? "Текущий ракурс назначен всем экранам. Нажмите «Сохранить изменения»."
    : `Ракурс ${selectedCameraState} запомнен. Нажмите «Сохранить изменения».`);
}

function scheduleCameraDraft() {
  if (!pendingCameraEdit) return;
  clearTimeout(cameraDraftTimer);
  cameraDraftTimer = setTimeout(() => { storeCurrentCameraView(false); renderToolbar(); scheduleAutosave(); }, 400);
}

function storeCurrentCameraView(applyToAll = false) {
  clearTimeout(cameraDraftTimer);
  pendingCameraEdit = false;
  const view = webglField.getViewState();
  const cameraView = {
    target: view.target.map((value) => round(value, 6)),
    rotation: view.rotation.map((value) => round(value, 8)),
    distance: round(view.distance, 6),
    fov: round(view.fov, 4),
  };
  if (applyToAll) {
    for (const state of Object.values(shellConfig.states)) state.cameraView = structuredClone(cameraView);
  } else shellConfig.states[selectedCameraState].cameraView = cameraView;
}

function addRouteItem(type) {
  if (!ITEM_TYPES[type]) return;
  commit((next) => next.missions.find((mission) => mission.id === selectedMissionId).route.push(type));
}

function changeRouteItem(event, action) {
  const index = Number(event.target.closest("[data-route-index]").dataset.routeIndex);
  commit((next) => {
    const route = next.missions.find((mission) => mission.id === selectedMissionId).route;
    if (action === "remove") route.splice(index, 1);
    else {
      const target = action === "left" ? index - 1 : index + 1;
      if (target >= 0 && target < route.length) next.missions.find((mission) => mission.id === selectedMissionId).route = moveArrayItem(route, index, target);
    }
  });
}

function onRouteDragStart(event) {
  draggedRouteIndex = Number(event.target.closest("[data-route-index]")?.dataset.routeIndex);
  if (!Number.isInteger(draggedRouteIndex)) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(draggedRouteIndex));
}

function onRouteDrop(event) {
  const target = Number(event.target.closest("[data-route-index]")?.dataset.routeIndex);
  if (!Number.isInteger(target) || !Number.isInteger(draggedRouteIndex) || target === draggedRouteIndex) return;
  commit((next) => {
    const mission = next.missions.find((entry) => entry.id === selectedMissionId);
    mission.route = moveArrayItem(mission.route, draggedRouteIndex, target);
  });
  draggedRouteIndex = -1;
}

function addObjective() {
  const mission = selectedMission();
  const ids = new Set(mission.objectives.map((objective) => objective.id));
  let suffix = mission.objectives.length + 1;
  while (ids.has(`objective-${suffix}`)) suffix += 1;
  commit((next) => next.missions.find((entry) => entry.id === selectedMissionId).objectives.push({ id: `objective-${suffix}`, label: "новая задача", condition: { type: "allPlaced" } }));
}

function removeObjective(index) {
  if (selectedMission().objectives.length === 1) {
    showToast("У миссии должна остаться хотя бы одна задача.", true);
    return;
  }
  commit((next) => next.missions.find((mission) => mission.id === selectedMissionId).objectives.splice(index, 1));
}

function updateObjective(index, field, value) {
  commit((next) => {
    const objective = next.missions.find((mission) => mission.id === selectedMissionId).objectives[index];
    if (field === "condition.type") {
      objective.condition = defaultCondition(value);
      return;
    }
    setPath(objective, field, field === "condition.sequence" ? String(value).split(",").map((type) => type.trim()).filter(Boolean) : value);
  });
}

function generateObjectives() {
  const mission = selectedMission();
  const objectives = [];
  if (mission.route[0]) objectives.push({ id: `place-${mission.route[0]}`, label: `размести ${ITEM_TYPES[mission.route[0]].label}`, condition: { type: "placed", object: mission.route[0], count: 1 } });
  const usedPairs = new Set();
  mission.route.slice(0, -1).forEach((type, index) => {
    const second = mission.route[index + 1];
    const key = `${type}-${second}`;
    if (usedPairs.has(key)) return;
    usedPairs.add(key);
    objectives.push({ id: `connect-${key}`, label: `соедини ${ITEM_TYPES[type].short.toLowerCase()} и ${ITEM_TYPES[second].short.toLowerCase()}`, condition: { type: "adjacent", first: type, second, count: 1 } });
  });
  objectives.push({ id: "finish-network", label: "собери связанную сеть", condition: { type: "networkConnected" } });
  const ids = new Set();
  for (const objective of objectives) {
    const base = slugify(objective.id);
    let id = base;
    let suffix = 2;
    while (ids.has(id)) id = `${base}-${suffix++}`;
    objective.id = id;
    ids.add(id);
  }
  commit((next) => { next.missions.find((entry) => entry.id === selectedMissionId).objectives = objectives; });
}

async function saveProject() {
  if (saveInFlight) return;
  flushEditorInput();
  saveInFlight = true;
  try {
  storeCurrentCameraView(false);
  renderToolbar();
  scheduleAutosave();
  const validation = validateEditorCatalog(catalog());
  if (!validation.valid) {
    showValidation(true);
    throw new Error("Исправьте ошибки перед сохранением.");
  }
  const parsedShell = editableShellConfig(parseUiShellConfig(shellConfig));
  const submittedSnapshot = snapshot(catalog());
  const submittedShellSnapshot = snapshot(shellConfig);
  let response;
  try {
    response = await fetch(editorApiUrl("/api/editor/save"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog: { ...serializableCatalog(catalog()), ...(catalog().schemaVersion === 2 ? { revision: projectRevision } : {}) }, shellConfig: parsedShell, expected: expectedRevisions }),
    });
  } catch (_) {
    throw new Error("Сервер сохранения недоступен. Запустите START-EDITOR-WINDOWS.bat и повторите сохранение.");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Локальный сервер не смог сохранить игровые JSON.");
  projectRevision = result.revision || projectRevision;
  expectedRevisions = result.revisions || expectedRevisions;
  savedSnapshot = submittedSnapshot;
  savedShellSnapshot = submittedShellSnapshot;
  renderToolbar();
  if (!isDirty()) await clearDraft(draftKey).catch(() => undefined);
  else scheduleAutosave();
  notifyRunningGame(result.backupId);
  draftState.textContent = `Сохранено в игру · резервная копия ${result.backupId}`;
  showToast(`Текущий ракурс ${selectedCameraState}, миссии и остальные настройки записаны. Открытая игра обновляется автоматически.`, false, 6200);
  } finally { saveInFlight = false; renderToolbar(); }
}

function notifyRunningGame(backupId) {
  publishProjectChange(`${Date.now()}:${backupId}`, EDITOR_SOURCE_ID);
}

function showValidation(forceDetails = false) {
  const validation = validateEditorCatalog(catalog());
  renderValidation();
  if (!forceDetails) return;
  const issues = [...validation.errors, ...validation.warnings];
  if (!issues.length) showToast("Каталог корректен и готов к сохранению.");
  else showToast(issues.slice(0, 3).map((issue) => issue.message).join(" · "), validation.errors.length > 0, 7000);
}

function draftPayload() { return { catalog: catalog(), shellConfig, revision: projectRevision, expected: expectedRevisions }; }
function scheduleAutosave() {
  const record = draftPayload();
  draftState.textContent = "Сохранение локального черновика…";
  saveDraft(record, draftKey).then(() => {
    if (isDirty()) draftState.textContent = "Черновик сохранён локально · для применения в игре нажмите «Сохранить изменения»";
  }).catch(() => { draftState.textContent = "Черновик не записан. Экспортируйте правки перед закрытием"; });
}

async function offerDraftRestore() {
  const draft = await loadDraft(draftKey).catch(() => null);
  if (!draft?.catalog) return;
  const sameCatalog = snapshot(draft.catalog.catalog || draft.catalog) === snapshot(catalog());
  const sameShell = !draft.catalog.shellConfig || snapshot(draft.catalog.shellConfig) === snapshot(shellConfig);
  if (sameCatalog && sameShell) return;
  draftState.innerHTML = `Найден черновик от ${new Date(draft.savedAt).toLocaleString("ru-RU")} <button type="button" data-action="restore-draft">ВОССТАНОВИТЬ</button> <button type="button" data-action="dismiss-draft">УДАЛИТЬ</button>`;
}

async function restoreDraft() {
  const draft = await loadDraft(draftKey);
  if (!draft?.catalog) throw new Error("Черновик не найден");
  const draftProject = draft.catalog.catalog ? draft.catalog : { catalog: draft.catalog, shellConfig: null };
  if ((draftProject.revision || draftProject.catalog.revision) !== projectRevision || (draftProject.expected && (draftProject.expected.wording !== expectedRevisions.wording || draftProject.expected.shell !== expectedRevisions.shell))) {
    exportEditorJson(draftProject, "kosmos-na-svyazi-conflicting-draft.json");
    throw new Error("Черновик относится к прежней версии проекта. Он экспортирован в JSON; перенесите нужные правки в актуальные данные.");
  }
  if (draftProject.catalog.schemaVersion !== catalog().schemaVersion) throw new Error("Этот черновик от старой структуры. Он не применён, чтобы не потерять правила v2.");
  const parsed = parseMissionCatalog(draftProject.catalog.schemaVersion === 2 ? draftProject.catalog : { schemaVersion: 1, missions: draftProject.catalog.missions, objectSettings: draftProject.catalog.objectSettings ?? catalog().objectSettings });
  configureMissions(parsed);
  history = createHistory(toEditableCatalog(parsed));
  if (draftProject.shellConfig) shellConfig = editableShellConfig(parseUiShellConfig({ ...draftProject.shellConfig, rendering: { ...draftProject.shellConfig.rendering, earth: shellConfig.rendering.earth } }));
  selectedMissionId = history.present.missions[0].id;
  webglField.setEarthOrbitPreferences(resolveMissionEarthOrbit(shellConfig.interaction.earthOrbit, selectedCameraState, selectedMission()?.number));
  webglField.setEarthStyle(shellConfig.rendering.earth);
  webglField.setViewState(shellConfig.states[selectedCameraState].cameraView, true);
  renderAll();
  draftState.textContent = "Локальный черновик восстановлен";
  showToast("Черновик восстановлен. Файл на диске не изменён.");
}

async function dismissDraft() {
  await clearDraft(draftKey);
  draftState.textContent = "Локальный черновик удалён";
}

function onKeyDown(event) {
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveProject().catch((error) => showToast(error.message, true));
  } else if (modifier && event.key.toLowerCase() === "z") {
    event.preventDefault();
    applyHistory(event.shiftKey ? redoHistory(history) : undoHistory(history));
  } else if (modifier && event.key.toLowerCase() === "y") {
    event.preventDefault();
    applyHistory(redoHistory(history));
  }
}

function catalog() { return history.present; }
function selectedMission() { return catalog()?.missions.find((mission) => mission.id === selectedMissionId); }
function snapshot(value) { return JSON.stringify(value); }
function isMissionDirty() { return history ? snapshot(catalog()) !== savedSnapshot : false; }
function isShellDirty() { return shellConfig ? snapshot(shellConfig) !== savedShellSnapshot : false; }
function isDirty() { return pendingFormEdit || pendingCameraEdit || isMissionDirty() || isShellDirty(); }
function emptyNetwork() { return { links: [], states: {} }; }
function round(value, digits) { const factor = 10 ** digits; return Math.round(Number(value) * factor) / factor; }

function editableShellConfig(config) {
  return {
    $schema: "./ui-shell.schema.json",
    schemaVersion: config.schemaVersion,
    designViewport: structuredClone(config.designViewport),
    typography: structuredClone(config.typography),
    rendering: structuredClone(config.rendering),
    interaction: structuredClone(config.interaction),
    geometry: structuredClone(config.geometry),
    motion: structuredClone(config.motion),
    states: structuredClone(config.states),
  };
}

function applyEarthOrbitInputs() {
  if (!webglField || !shellConfig?.interaction?.earthOrbit) return;
  const orbit = shellConfig.interaction.earthOrbit;
  for (const input of earthLimitInputs) {
    const value = Number(input.value);
    if (input.value !== "" && Number.isFinite(value)) orbit.limitsDegrees[input.dataset.earthLimit] = Math.min(180, Math.max(0, value));
  }
  orbit.centerRussia = earthCenterRussiaInput.checked;
  const centeringPx = Number(earthCenteringPxInput.value);
  if (earthCenteringPxInput.value !== "" && Number.isFinite(centeringPx)) orbit.verticalCenteringPx = Math.max(0, centeringPx);
  webglField.setEarthOrbitPreferences(resolveMissionEarthOrbit(orbit, selectedCameraState, selectedMission()?.number));
  renderToolbar();
  scheduleAutosave();
}

function syncEarthOrbitInputs() {
  const orbit = shellConfig?.interaction?.earthOrbit;
  if (!orbit) return;
  for (const input of earthLimitInputs) {
    const value = String(orbit.limitsDegrees[input.dataset.earthLimit]);
    if (document.activeElement !== input && input.value !== value) input.value = value;
  }
  earthCenterRussiaInput.checked = orbit.centerRussia;
  earthCenteringPxInput.disabled = !orbit.centerRussia;
  const centeringPx = String(orbit.verticalCenteringPx);
  if (document.activeElement !== earthCenteringPxInput && earthCenteringPxInput.value !== centeringPx) earthCenteringPxInput.value = centeringPx;
}

function applyCameraInputs() {
  if (!webglField) return;
  const current = webglField.getViewState();
  const rotation = cameraAxisInputs.map((input, index) => {
    const degrees = Number(input.value);
    return Number.isFinite(degrees) ? degrees * Math.PI / 180 : current.rotation[index];
  });
  const target = cameraTargetInputs.map((input, index) => {
    const value = Number(input.value);
    return Number.isFinite(value) ? value : current.target[index];
  });
  const distance = Number(cameraDistanceInput.value);
  const fov = Number(cameraFovInput.value);
  webglField.setViewState({
    target,
    rotation,
    distance: Number.isFinite(distance) ? Math.min(14, Math.max(4, distance)) : current.distance,
    fov: Number.isFinite(fov) ? Math.min(100, Math.max(15, fov)) : current.fov,
    exact: true,
  }, true);
  storeCurrentCameraView(false);
  renderToolbar();
  scheduleAutosave();
}

function syncCameraInputs() {
  if (!webglField) return;
  const view = webglField.getViewState();
  for (const [index, input] of cameraAxisInputs.entries()) {
    const value = String(round(view.rotation[index] * 180 / Math.PI, 2));
    if (document.activeElement !== input && input.value !== value) input.value = value;
  }
  for (const [index, input] of cameraTargetInputs.entries()) {
    const value = String(round(view.target[index], 3));
    if (document.activeElement !== input && input.value !== value) input.value = value;
  }
  const distance = String(round(view.distance, 2));
  if (document.activeElement !== cameraDistanceInput && cameraDistanceInput.value !== distance) cameraDistanceInput.value = distance;
  const fov = String(round(view.fov, 2));
  if (document.activeElement !== cameraFovInput && cameraFovInput.value !== fov) cameraFovInput.value = fov;
}

function setPath(target, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const owner = keys.reduce((object, key) => object[key], target);
  owner[last] = value;
}

function coerceValue(element) {
  return element.type === "number" ? Number(element.value) : element.value;
}

function defaultCondition(type) {
  if (type === "connectedSequence") return { type, sequence: ["terminal", "satellite"] };
  if (type === "placed") return { type, object: "terminal", count: 1 };
  if (type === "adjacent") return { type, first: "terminal", second: "satellite", count: 1 };
  return { type };
}

function textField(label, field, value) { return `<label class="editor-field"><span>${label}</span><input type="text" data-field="${field}" value="${escapeHtml(value)}"></label>`; }
function textareaField(label, field, value) { return `<label class="editor-field"><span>${label}</span><textarea data-field="${field}" rows="4">${escapeHtml(value)}</textarea></label>`; }
function numberField(label, field, value, min, max) { return `<label class="editor-field"><span>${label}</span><input type="number" data-field="${field}" value="${value}" min="${min}" max="${max}"></label>`; }
function geoFields(label, path, value, withLabel = false) { return `<fieldset class="geo-field"><legend>${label}</legend>${withLabel ? textField("Подпись", `${path}.label`, value.label) : ""}<div class="field-grid">${numberField("Широта", `${path}.latitude`, value.latitude, -82, 82)}${numberField("Долгота", `${path}.longitude`, value.longitude, -180, 180)}</div></fieldset>`; }
function objectiveInput(label, index, field, value) { return `<label class="editor-field"><span>${label}</span><input type="text" data-objective-index="${index}" data-objective-field="${field}" value="${escapeHtml(value)}"></label>`; }
function objectiveNumber(label, index, field, value) { return `<label class="editor-field"><span>${label}</span><input type="number" min="1" data-objective-index="${index}" data-objective-field="${field}" value="${value}"></label>`; }
function objectiveSelect(label, index, field, value) { return `<label class="editor-field"><span>${label}</span><select data-objective-index="${index}" data-objective-field="${field}">${Object.entries(ITEM_TYPES).map(([type, item]) => `<option value="${type}" ${type === value ? "selected" : ""}>${escapeHtml(item.short)}</option>`).join("")}</select></label>`; }
function conditionOptions(value) { return [["placed", "Объект размещён"], ["adjacent", "Объекты соседствуют"], ["connectedSequence", "Цепочка соединена"], ["allPlaced", "Все объекты размещены"], ["routeCorrect", "Маршрут правильный"], ["networkConnected", "Сеть связана"]].map(([type, label]) => `<option value="${type}" ${type === value ? "selected" : ""}>${label}</option>`).join(""); }

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
}

function plural(number, one, few, many) {
  const value = Math.abs(number) % 100;
  const last = value % 10;
  if (value > 10 && value < 20) return many;
  if (last > 1 && last < 5) return few;
  return last === 1 ? one : many;
}

function showToast(message, isError = false, duration = 3500) {
  clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.toggle("is-error", isError);
  toastElement.classList.add("is-visible");
  toastTimer = setTimeout(() => toastElement.classList.remove("is-visible"), duration);
}
