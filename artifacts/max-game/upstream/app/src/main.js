import { usesScreenConnections, screenReady, connectionMode } from "./screen-connectivity.mjs";
import { parseMissionCatalog, serializeMissionCatalog } from "./mission-config.mjs";
import { PreparedAssets, collectAssetSources, prepareFonts, prepareTasks, withTimeout } from "./asset-preparation.mjs";
import { LoadingScreen } from "./loading-screen.mjs";
import { brandTitleHtml } from "./brand-title.mjs";
import { createInitialState, missionStatus, MISSION_STATUSES, nextMissionToPlay, reduceGame, restoreGameState, STATE_ORDER, STATES } from "./game-state.mjs";
import { activateMissionSettings, availableCount, configureMissions, createMissionRun, deriveNetwork, ITEM_TYPES, MISSION_ORDER, MISSIONS, NODE_WAKE_DELAY_MS, objectiveProgress, orderedPlacements, previewPlacementMove, reduceMission, routeIsConnected } from "./mission-game.mjs";
import { pointIconSource, isOrbitalType, altitudeSettingsFor } from "./mission-game.mjs";
import { loadMissionCatalog } from "./mission-config.mjs";
import { applyMissionFeedback, createMissionFeedbackSession, deriveMissionFeedback, FEEDBACK_POPUP_DELAY_MS, markMissionFeedbackSeen, nextUnseenMissionFeedback } from "./mission-feedback.mjs";
import { resolveEndpointSafeArea, resolveMissionEarthOrbit, loadUiShellConfig, resolveEarthFrameOffset, resolveUiShellState } from "./ui-shell-config.mjs";
import { createWebGLField } from "./webgl-field.js";
import { createTranslator, loadWording, localizeMissionCatalog, persistLanguage, storedLanguage } from "./wording.mjs";
import { auditTypographyLayout, balanceShortSentenceStarts, resolveMissionTextLayout } from "./typography.mjs";
import { adaptMissionCopy } from "./adaptive-mission-copy.mjs";
import { AudioAppAdapter } from "./audio/audio-app-adapter.mjs";
import { AudioDirector } from "./audio/audio-director.mjs";
import { loadAudioManifest } from "./audio/audio-manifest.mjs";
import { loadSurfaceMap } from "./surface-map.mjs";
import { loadEarthContours } from "./earth-contours.mjs";
import { configurePlacementSurface, getPlacementRejection } from "./mission-game.mjs";
import { buildRouteLayout } from "./route-layout.mjs";
import { updateRouteTrack, disposeRouteTrack, ROUTE_FADE_MS } from "./route-view.mjs";
import { loadPlacementMode, steppedAltitude, PLACEMENT_MODE_KEY } from "./placement-input.mjs";
import { createInventoryScroll } from "./inventory-scroll.mjs";
import { BACK_CLICK_GAP_MS, createDebugGesture, initialControls, readDebugSession, saveDebugSession } from "./production-controls.mjs";

const stage = document.getElementById("stage");
const worldLayer = document.getElementById("world-layer");
const missionLayer = document.getElementById("mission-layer");
const uiShell = document.getElementById("ui-shell");
const shellFooterContent = document.getElementById("shell-footer-content");
const shellInventoryList = document.getElementById("shell-inventory-list");
const inventoryScroll = createInventoryScroll({ list: shellInventoryList, canSwipe: () => uiShell.dataset.placementMode === "tap" });
const loading = document.getElementById("loading");
const debug = document.getElementById("debug");
const debugState = document.getElementById("debug-state");
const bootScreen = new LoadingScreen(document.getElementById("boot-screen"));
let preparedAssets = null;
let appReady = false;
const PROJECT_CONFIG_CHANNEL = "x-sputnik-project-config";
const PROJECT_CONFIG_STORAGE_KEY = "x-sputnik-project-config-revision";
const LANGUAGE_MOTION_DURATION_SCALE = 1.72;
const LANGUAGE_MOTION_MIN_MS = 320;
const LANGUAGE_MOTION_MAX_MS = 440;
const LANGUAGE_MOTION_EASING = "cubic-bezier(.42, 0, .2, 1)";

let state = createInitialState();
let missionRun = null;
let timerId = 0;
let nodeStateTimerId = 0;
let webglField = null;
let webglMission = null;
let suppressPointerClick = false;
let missionMarkerFrame = 0;
let shellConfig = null;
let designViewport = null;
let renderedScreen = null;
let activeScreenTransition = null;
let missionFeedbackSession = null;
let activeMissionFeedback = null;
let pendingMissionFeedbackKey = "";
let pendingMissionFeedbackTimerId = 0;
let projectConfigChannel = null;
let selectedPathId = "";
let baseMissionCatalog = null;
let wording = null;
let language = "ru";
let t = (key) => key;
let queuedLanguage = null;
let languageTransitionPromise = null;
let activeLanguageAnimations = [];
let activeLanguageGhosts = [];
let missionMenuRevealToken = 0;
let pendingUnlockedMission = null;
let audioDirector = null;
let audioAdapter = null;
let typographyLayoutFrame = 0;
let placementError = null;
let placementErrorSequence = 0;
let placementSession = 0;
let savedPlacementMode = "tap";
let debugEnabled = false;
try {
  savedPlacementMode = loadPlacementMode(location.search, localStorage);
  debugEnabled = readDebugSession(sessionStorage);
} catch { /* Production defaults apply when storage is unavailable. */ }
const startupControls = initialControls(location.search, debugEnabled, savedPlacementMode);
let placementMode = startupControls.placement;
const connectionOverride = startupControls.connection;
const advanceDebugGesture = createDebugGesture();
let backNavigationTimer = null;

let connectionPreview = null;
let connectionRevision = -1, connectionFrameAt = 0, connectionUiSignature = "";
let progressStorageKey = "x-sputnik-state";
const search = new URLSearchParams(location.search);
syncDebugVisibility();
stage.addEventListener("click", onDebugGestureClick, { capture: true });

fitStage();
bootstrap();

window.addEventListener("resize", fitStage);
window.addEventListener("orientationchange", fitStage);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("pointerdown", unlockAudio, { capture: true, passive: true });
window.addEventListener("keydown", unlockAudio, { capture: true });
document.addEventListener("visibilitychange", onVisibilityChange);
window.addEventListener("pagehide", () => { void audioDirector?.dispose(); }, { once: true });
window.addEventListener("pagehide", () => inventoryScroll.dispose(), { once: true });
startProjectConfigReloadListener();

debug.addEventListener("click", (event) => {
  if (!debugEnabled) return;
  const command = event.target.closest("[data-debug]")?.dataset.debug;
  if (command === "previous") navigateRelative(-1);
  if (command === "next") navigateRelative(1);
  if (command === "fullscreen") toggleFullscreen();
});
missionLayer.addEventListener("click", onMissionLayerClick);
missionLayer.addEventListener("pointerdown", onMissionLayerPointerDown);
missionLayer.addEventListener("pointerover", onMissionLayerPointerOver);
uiShell.addEventListener("click", onMissionLayerClick);
uiShell.addEventListener("pointerdown", onMissionLayerPointerDown);
uiShell.addEventListener("change", (event) => {
  if (event.target.matches("[data-game-path]")) { selectedPathId = event.target.value; renderMission(); }
});

function syncDebugVisibility() {
  document.documentElement.classList.toggle("is-debug", debugEnabled);
  debug.hidden = !debugEnabled;
  for (const control of uiShell.querySelectorAll("[data-debug-only]")) control.hidden = !debugEnabled;
}

function cancelBackNavigation() {
  clearTimeout(backNavigationTimer);
  backNavigationTimer = null;
  advanceDebugGesture(null);
}

function onDebugGestureClick(event) {
  const back = event.target.closest('[data-game-action="back"]');
  if (!appReady || languageTransitionPromise || (event.button != null && event.button !== 0) || !back) {
    cancelBackNavigation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  clearTimeout(backNavigationTimer);
  backNavigationTimer = null;
  if (advanceDebugGesture("back")) {
    setDebugEnabled(!debugEnabled);
    return;
  }
  backNavigationTimer = setTimeout(() => {
    cancelBackNavigation();
    dispatch({ type: "BACK" });
  }, BACK_CLICK_GAP_MS);
}

function setDebugEnabled(enabled) {
  debugEnabled = enabled;
  try { saveDebugSession(sessionStorage, enabled); } catch { /* Session storage is optional. */ }
  syncDebugVisibility();
  if (!enabled) {
    audioDirector?.setMuted(false);
    syncAudioControl();
    placementMode = "tap";
    placementSession++;
    if (missionRun) updateMission({ type: "CLEAR_SELECTION" });
    if (state.allMissionsAvailable) dispatch({ type: "DEBUG_TOGGLE_UNLOCK" });
    // Returning from a diagnostic connection policy starts the normal hybrid session.
    if (baseMissionCatalog?.missions.some((mission) => connectionMode(mission) !== "hybrid")) {
      const url = new URL(location.href);
      for (const key of ["debug", "connection", "placement"]) url.searchParams.delete(key);
      location.replace(url.href);
      return;
    }
  }
  syncPlacementControls();
  scheduleTypographyLayoutPass();
}

function startProjectConfigReloadListener() {
  const reloadForSavedProject = (event) => {
    if (event?.data?.type === "project-config-saved") location.reload();
  };
  try {
    projectConfigChannel = new BroadcastChannel(PROJECT_CONFIG_CHANNEL);
    projectConfigChannel.addEventListener("message", reloadForSavedProject);
  } catch (_) {
    projectConfigChannel = null;
  }
  window.addEventListener("storage", (event) => {
    if (event.key === PROJECT_CONFIG_STORAGE_KEY && event.newValue) location.reload();
  });
  window.addEventListener("pagehide", () => projectConfigChannel?.close(), { once: true });
}

async function bootstrap() {
  try {
    loading.hidden = true;
    const [missionCatalog, loadedShellConfig, loadedWording, audioManifest, surfaceMap, contours] = await prepareTasks([
      () => withTimeout(() => loadMissionCatalog(), 60000, "Mission configuration"),
      () => withTimeout(() => loadUiShellConfig(), 60000, "Shell configuration"),
      () => withTimeout(() => loadWording(), 60000, "Wording"),
      () => withTimeout(() => loadAudioManifest(), 60000, "Audio configuration"),
      () => withTimeout(() => loadSurfaceMap(), 60000, "Gameplay surface mask"),
      () => withTimeout(() => loadEarthContours(), 60000, "Earth contours"),
    ], bootScreen.phase("config"));
    baseMissionCatalog = missionCatalog;
    if (["screen", "world", "hybrid"].includes(connectionOverride)) {
      const raw = serializeMissionCatalog(missionCatalog);
      for (const mission of raw.missions) for (const path of mission.topology.paths) {
        path.connection = { ...path.connection, policy: ({ screen: "screenProjected", hybrid: "hybridProjected", world: "geographicCorridor" })[connectionOverride] };
      }
      baseMissionCatalog = parseMissionCatalog(raw);
    }
    const policies = baseMissionCatalog.missions.map(connectionMode);
    if (policies.some((policy) => policy !== "world")) progressStorageKey += `:connections:${policies.join("-")}`;
    wording = loadedWording;
    language = storedLanguage(wording);
    t = createTranslator(wording, language);
    bootScreen.localize(t, language);
    if (audioManifest) {
      audioDirector = new AudioDirector(audioManifest);
      // Production must not inherit a mute preference from earlier debug sessions.
      if (!debugEnabled) audioDirector.setMuted(false);
      audioAdapter = new AudioAppAdapter(audioDirector);
    }
    const localizedMissionCatalog = localizeMissionCatalog(baseMissionCatalog, t);
    configureMissions(localizedMissionCatalog);
    configurePlacementSurface(surfaceMap);
    shellConfig = loadedShellConfig;
    applyStaticWording();
    applyShellConfiguration();
    state = loadState();
    preparedAssets = new PreparedAssets();
    await preparedAssets.load(collectAssetSources(baseMissionCatalog, ITEM_TYPES, contours, shellConfig.rendering.earth.russiaContour), bootScreen.phase("images"));
    uiShell.querySelector(".brand-logo").src = assetUrl(brandLogoSource());
    await prepareFonts(document.fonts, bootScreen.phase("fonts"));
    await audioDirector?.prepare(bootScreen.phase("audio"));
    bootScreen.phase("scene");
    webglField = await createWebGLField({
      preparedAssets,
      startPaused: true,
      container: worldLayer,
      placements: [],
      network: emptyNetwork(),
      itemTypes: ITEM_TYPES,
      endpoints: {},
      initialView: shellConfig.states[state.screen].cameraView,
      maxDrawingBufferPixels: shellConfig.rendering.maxDrawingBufferPixels,
      earthStyle: shellConfig.rendering.earth,
      nodeIconBackdropStyle: shellConfig.rendering.nodeIconBackdrop,
      signalLinkStyle: shellConfig.rendering.signalLinks,
      earthOrbit: resolveMissionEarthOrbit(shellConfig.interaction.earthOrbit, state.screen, state.activeMission),
      cameraIdleMotion: shellConfig.motion.cameraIdle,
      onOrbitGestureStart: () => audioAdapter?.onEarthOrbitGesture(),
      onConnectionFrame: updateConnectionView,
      selectedItem: null,
      onPlace: (item, geo) => { if (missionRun) updateMission({ type: "PLACE", item, ...geo, now: Date.now() }); },
      onSelectPlacement: (id) => { if (missionRun) updateMission({ type: "SELECT_PLACEMENT", id }); },
      onMove: (id, geo) => { if (missionRun) updateMission({ type: "MOVE", id, ...geo, clearSelection: true, now: Date.now() }); },
      onMovePreview: (id, geo) => { if (missionRun) previewMissionMove(id, geo); },
      onMoveCancel: () => { if (missionRun) renderMission({ routeReleased: true }); },
      placementRejection: getPlacementRejection,
      onRemove: (id) => { if (missionRun) updateMission({ type: "REMOVE", id }); },
    });
    await webglField.prepareGPU(bootScreen.phase("gpu"));
    bootScreen.phase("ready");
    audioDirector?.enterScreen(state.screen);
    await render({ immediate: true });
    webglField.start();
    appReady = true;
    stage.inert = false;
    window.__xSputnikStartup = Object.freeze({ ready: true, ...bootScreen.finish(), visualResources: preparedAssets.entries.size, audioAssets: audioManifest.assets.length });
  } catch (error) {
    clearInterval(timerId);
    webglField?.dispose();
    webglField = null;
    await audioDirector?.dispose();
    preparedAssets?.dispose();
    bootScreen.fail(error);
  }
}

function dispatch(action) {
  if (!appReady) return;
  if (action.type === "PRIMARY" && state.screen === STATES.MISSION_SELECT) {
    action = { ...action, requiresCompleted: MISSIONS[state.activeMission].unlock.requiresCompleted };
  }
  const previousState = state;
  const nextState = reduceGame(previousState, action, MISSION_ORDER);
  if (nextState === previousState) return;
  if (nextState.screen === STATES.CTA || action.type === "DEBUG_COMPLETE_ALL") {
    pendingUnlockedMission = null;
    selectedPathId = "";
  }
  if (action.type === "MISSION_COMPLETE" && nextState.screen === STATES.MISSION_SELECT) {
    pendingUnlockedMission = nextMissionToPlay(nextState.completed, MISSION_ORDER);
  }
  audioAdapter?.afterShellTransition(previousState, nextState, action);
  state = nextState;
  sessionStorage.setItem(progressStorageKey, JSON.stringify(state));
  render({ immediate: false });
}

async function render({ immediate }) {
  const screenChanged = renderedScreen !== state.screen;
  const outgoingScreen = screenChanged && !immediate ? captureOutgoingScreen() : null;
  const mission = MISSIONS[state.activeMission] || MISSIONS[MISSION_ORDER[0]];
  clearInterval(timerId);
  clearTimeout(nodeStateTimerId);
  cancelAnimationFrame(missionMarkerFrame);
  debugState.textContent = `${state.screen} · completed: ${state.completed.join(",") || "—"}`;
  document.title = t("app.titleWithScreen", { screen: screenTitle(mission) });
  uiShell.querySelector('[data-game-action="debug-complete-all"]').disabled = MISSION_ORDER.every((number) => state.completed.includes(number));
  uiShell.querySelector('[data-game-action="debug-toggle-unlock"]').setAttribute("aria-checked", String(Boolean(state.allMissionsAvailable)));
  missionLayer.hidden = false;
  webglField.setEarthOrbitPreferences(resolveMissionEarthOrbit(shellConfig.interaction.earthOrbit, state.screen, mission.number));
  setShellState(state.screen, immediate);
  missionRun = state.screen === STATES.MISSION_PLAY && missionRun?.mission === mission.number ? missionRun : null;
  if (screenChanged) webglField.setViewState(shellConfig.states[state.screen].cameraView, immediate, shellConfig.motion.screenDurationMs);
  if (screenChanged) {
    missionMenuRevealToken++;
    if (state.screen === STATES.MISSION_SELECT) {
      webglField.beginMissionMenuReveal(shellConfig.motion.fadeDurationMs, shellConfig.motion.fadeDurationMs, shellConfig.motion.microDurationMs,
        (presence) => missionLayer.style.setProperty("--mission-bases-presence", String(presence)));
    } else {
      webglField.cancelMissionMenuReveal();
      missionLayer.style.removeProperty("--mission-bases-presence");
    }
  }
  const broadcastingMission = state.allMissionsAvailable ? state.activeMission : nextMissionToPlay(state.completed, MISSION_ORDER);
  webglField.setMissionMarkers(state.screen === STATES.MISSION_SELECT
    ? MISSION_ORDER.map((number) => ({
      id: number,
      ...MISSIONS[number].mapPosition,
      status: missionStatus(MISSIONS[number], state.completed, state.allMissionsAvailable),
      active: number === broadcastingMission,
    }))
    : []);

  if (state.screen === STATES.MISSION_PLAY) {
    if (!missionRun || missionRun.mission !== mission.number) { missionRun = createMissionRun(mission.number); placementSession++; }
    renderMission();
    startTimer();
    loading.hidden = true;
    completeScreenTransition(outgoingScreen, screenChanged, immediate);
    return;
  }

  webglMission = null;
  missionRun = null;
  placementSession++;
  resetMissionFeedbackRuntime();
  webglField.update({ placements: [], network: emptyNetwork(), selectedItem: null, endpoints: {} });
  if (state.screen === STATES.CTA) renderCta();
  else if (state.screen === STATES.ONBOARDING) renderOnboarding();
  else if (state.screen === STATES.MISSION_SELECT) renderMissionSelect();
  else if (state.screen === STATES.END) renderEnd();
  else dispatch({ type: "RESET" });
  if (immediate) missionLayer.classList.add("is-immediate");
  requestAnimationFrame(() => missionLayer.classList.remove("is-immediate"));
  loading.hidden = true;
  completeScreenTransition(outgoingScreen, screenChanged, immediate);
}

function renderMission({ routeReleased = false, routeImmediate = false } = {}) {
  connectionPreview = null;
  connectionRevision = -1;
  const mission = MISSIONS[missionRun.mission];
  missionRun = withProjectedLayout(missionRun);
  const isNewMission = webglMission !== missionRun.mission;
  if (isNewMission) {
    selectedPathId = mission.topology?.paths[0]?.id || "";
    webglMission = missionRun.mission;
    renderMissionShell(mission);
  }
  const now = Date.now();
  const evaluationNetwork = deriveNetwork(missionRun, now);
  if (missionRun.status !== "complete" && missionRun.status !== "timeout" && (!usesScreenConnections(mission) || screenReady(mission, missionRun, now)) && (mission.engineVersion === 2 ? evaluationNetwork.complete : routeIsConnected(missionRun, now))) {
    missionRun = reduceMission(missionRun, { type: "CHECK", now });
    if (missionRun.status === "complete") clearInterval(timerId);
  }
  const feedbackEvents = deriveMissionFeedback({ mission, run: missionRun, network: evaluationNetwork });
  const network = applyMissionFeedback(evaluationNetwork, feedbackEvents);
  audioAdapter?.syncNetwork(network);
  const progress = network.objectives || objectiveProgress(missionRun, now);
  const itemOrder = Object.keys(ITEM_TYPES).filter((type) => mission.inventory ? mission.inventory[type] > 0 : mission.route.includes(type));
  const message = {
    playing: t("mission.feedback.playing"),
    incomplete: t("mission.feedback.incomplete"),
    error: t("mission.feedback.error"),
    disconnected: t("mission.feedback.disconnected"),
    complete: mission.successText,
    timeout: t("mission.feedback.timeout"),
  }[missionRun.status];

  webglField.update({ placements: missionRun.placements, network, selectedItem: missionRun.selected, endpoints: mission.endpoints });

  // Release must use the committed mesh positions, not the previous drag projection.
  if (routeReleased && usesScreenConnections(mission) && !["complete", "timeout"].includes(missionRun.status)) {
    updateConnectionView(true);
    return;
  }
  renderMissionStatus(mission, progress, itemOrder, message, network, { immediate: routeReleased || routeImmediate });
  renderOutcomePopup(mission, evaluationNetwork, feedbackEvents);
  scheduleNodeWakeup(now);
}

function renderMissionShell(mission) {
  setShellFooterContent(`mission:${mission.number}`, `
    <div class="route-sequence" data-route></div>`);
  missionLayer.innerHTML = `
    <section class="game-screen" aria-label="${escapeHtml(mission.name)}">
      <section class="mission-board">
        <article class="mission-card">
          <div class="mission-card-content" tabindex="0">
          <p class="ui-copy-badge">${escapeHtml(t("mission.number", { number: mission.number }))}</p>
          <h2 class="ui-copy-heading">${escapeHtml(mission.name)}</h2>
          ${mission.level ? `<p class="mission-level ui-copy-badge">${escapeHtml(mission.level)}</p>` : ""}
          ${usesScreenConnections(mission) ? `<p class="connection-instruction ui-copy-instruction" data-connection-hint>${escapeHtml(t(connectionMode(mission) === "hybrid" ? "connection.hybridHint" : "connection.hint"))}</p>` : ""}
          <ul data-objectives></ul>
          </div>
          <div class="mission-card-footer">
            <div class="mission-time" data-copy-profile="badge"><span data-time-label>${escapeHtml(t("mission.time"))} </span><strong data-timer></strong></div>
            <button class="mission-restart-button" type="button" data-game-action="restart" aria-label="${escapeHtml(t("mission.restart"))}" title="${escapeHtml(t("mission.restart"))}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7" /></svg>
            </button>
            <span class="mission-completion-flag" aria-hidden="true">⚑</span>
          </div>
        </article>
        <p class="mission-description ui-copy-body">${missionDescriptionHtml(mission)}</p>
        <div class="game-feedback ui-copy-instruction" data-feedback role="status"></div>
      </section>
      <div class="outcome-popup" data-outcome-popup role="dialog" aria-modal="false" hidden></div>
    </section>`;
  resetMissionFeedbackRuntime(mission.number);
}

function renderCta() {
  setShellFooterContent("cta", "");
  clearInventory();
  missionLayer.innerHTML = `
    <section class="flow-screen flow-screen--cta" aria-label="${escapeHtml(t("cta.aria"))}">
      ${language === "en" ? "" : `<img src="${assetUrl(brandLogoSource())}" alt="${escapeHtml(t("app.aria.logo"))}" class="brand-logo cta-brand-logo" />`}
      <div class="cta-content">
        <h1 class="ui-copy-heading">${language === "en" ? `<img class="cta-title-logo" src="${assetUrl(brandLogoSource())}" alt="${escapeHtml(t("app.aria.logo"))}" />` : escapeHtml(t("cta.title"))}</h1>
        <button class="hero-button ui-copy-button" type="button" data-game-action="continue">${escapeHtml(t("cta.primary"))}</button>

      </div>
    </section>`;
}

function renderOnboarding() {
  clearInventory();
  setShellFooterContent("onboarding", "");
  missionLayer.innerHTML = `
    <section class="flow-screen flow-screen--onboarding" aria-label="${escapeHtml(t("onboarding.aria"))}">
      <h2 class="onboarding-title ui-copy-heading">${escapeHtml(t("onboarding.title"))}</h2>
      <div class="onboarding-steps">
        ${onboardingStep(1, t("onboarding.steps.1.title"), t("onboarding.steps.1.body"))}
        ${onboardingStep(2, t("onboarding.steps.2.title"), t("onboarding.steps.2.body"))}
        ${onboardingStep(3, t("onboarding.steps.3.title"), t("onboarding.steps.3.body"))}
        <button class="hero-button ui-copy-button onboarding-action" type="button" data-game-action="continue">${escapeHtml(t("onboarding.primary"))}</button>
      </div>
    </section>`;
}

function renderMissionSelect() {
  const allCompleted = MISSION_ORDER.every((number) => state.completed.includes(number));
  const playableMission = state.allMissionsAvailable ? state.activeMission : nextMissionToPlay(state.completed, MISSION_ORDER);
  const unlockingMission = pendingUnlockedMission;
  clearInventory();
  const finishAction = allCompleted ? `<div class="outcome-popup" data-outcome-popup role="dialog" aria-modal="false" hidden></div>` : "";
  setShellFooterContent("select", "");
  const existingMap = renderedScreen === STATES.MISSION_SELECT && missionLayer.querySelector(".mission-map");
  if (existingMap && existingMap.dataset.completedMissions === state.completed.join(",") && existingMap.dataset.allMissionsAvailable === String(Boolean(state.allMissionsAvailable))) {
    for (const selector of existingMap.querySelectorAll("[data-select-mission]")) {
      const selected = Number(selector.dataset.selectMission) === playableMission;
      selector.closest(".mission-marker")?.classList.toggle("is-selected", selected);
      if (selected) selector.setAttribute("aria-current", "true");
      else selector.removeAttribute("aria-current");
    }
  } else {
    missionLayer.innerHTML = `
      <section class="flow-screen flow-screen--missions" aria-label="${escapeHtml(t("missionSelect.aria"))}">
        <div class="mission-map" data-completed-missions="${state.completed.join(",")}" data-all-missions-available="${Boolean(state.allMissionsAvailable)}" aria-label="${escapeHtml(t("missionSelect.mapAria"))}">
          ${MISSION_ORDER.map((number) => renderMissionMarker(MISSIONS[number], playableMission, unlockingMission)).join("")}
        </div>
        <div class="mission-select-actions"></div>
      </section>`;
  }
  const actions = missionLayer.querySelector(".mission-select-actions");
  // Preserve the open popup and its animation/focus on repeated menu renders.
  const finishKey = allCompleted ? `complete:${language}` : "pending";
  if (actions.dataset.finishKey !== finishKey) {
    actions.dataset.finishKey = finishKey;
    actions.innerHTML = finishAction;
  }
  if (allCompleted) showOutcomePopup(actions.querySelector("[data-outcome-popup]"), null, {
    key: `all-missions:${language}`, kind: "success", action: "finish", title: t("missionSelect.allCompleted"),
  });
  pendingUnlockedMission = null;
  syncMissionMarkers();
}

function renderMissionMarker(mission, playableMission, unlockingMission) {
  const status = missionStatus(mission, state.completed, state.allMissionsAvailable);
  const playable = state.allMissionsAvailable || status === MISSION_STATUSES.OPEN && mission.number === playableMission;
  const selected = playable && mission.number === state.activeMission;
  const unlocking = playable && mission.number === unlockingMission;
  const action = playable ? `<button class="mission-preview-action" data-copy-profile="button" type="button" data-game-action="launch">${escapeHtml(t("missionSelect.start"))}</button>` : "";
  const statusIcon = status === MISSION_STATUSES.COMPLETED ? '<i class="mission-status-icon mission-status-icon--flag" aria-hidden="true">⚑</i>' : status === MISSION_STATUSES.LOCKED ? '<i class="mission-status-icon mission-status-icon--lock" aria-hidden="true"></i>' : "";
  return `<div class="mission-marker-anchor mission-marker-anchor--${status}" data-mission-anchor="${mission.number}">
    <span class="mission-marker-stem" aria-hidden="true"></span>
    <article class="mission-marker mission-marker--${status} ${selected ? "is-selected" : ""} ${unlocking ? "is-unlocking" : ""}">
      <button class="mission-marker__select" type="button" data-select-mission="${mission.number}" aria-label="${escapeHtml(t("missionSelect.markerAria", { number: mission.number, name: mission.name, status: missionStatusLabel(status) }))}" ${selected ? 'aria-current="true"' : ""} ${playable ? "" : "disabled"}></button>
      <span class="mission-card-number ui-copy-badge">${escapeHtml(t("mission.number", { number: mission.number }))}</span>
      <strong class="ui-copy-heading">${escapeHtml(mission.name)}</strong>
      ${mission.level ? `<span class="mission-level ui-copy-badge">${escapeHtml(mission.level)}</span>` : ""}
      ${status !== MISSION_STATUSES.LOCKED && mission.summary ? `<p class="mission-summary ui-copy-body">${escapeHtml(mission.summary)}</p>` : ""}
      ${action}
      <span class="mission-preview-footer"><small class="ui-copy-badge">${status === MISSION_STATUSES.LOCKED ? missionStatusLabel(status) : `${escapeHtml(t("mission.time"))} ${formatTime(mission.timeSeconds)}`}</small>${statusIcon}</span>
    </article>
  </div>`;
}

function updateMissionMarkerSafeArea() {
  if (!webglField || !designViewport || state.screen !== STATES.MISSION_SELECT) return;
  const shell = resolveUiShellState(shellConfig, STATES.MISSION_SELECT);
  const scale = Math.min(window.innerWidth / designViewport.width, window.innerHeight / designViewport.height);
  const padding = shellConfig.geometry.borderWidth + Math.max(50, shellConfig.interaction.earthOrbit.missionMarkerSafePaddingPx) / Math.max(0.001, scale);
  const cards = [...missionLayer.querySelectorAll("[data-mission-anchor]")].map(anchor => {
    const card = anchor.querySelector(".mission-marker");
    return { id: anchor.dataset.missionAnchor, width: card.offsetWidth, height: card.offsetHeight,
      stem: Math.abs(parseFloat(getComputedStyle(card).top)) || 56 };
  });
  webglField.setMissionMarkerSafeArea({
    left: shellConfig.geometry.outerInset + padding, right: designViewport.width - shell.frameRight - padding,
    top: shellConfig.geometry.headerHeight + shellConfig.geometry.frameGap + padding,
    bottom: designViewport.height - shell.frameBottom - padding,
  }, cards);
}

function syncMissionMarkers() {
  if (state.screen !== STATES.MISSION_SELECT || !webglField) return;
  for (const marker of missionLayer.querySelectorAll("[data-mission-anchor]")) {
    const mission = MISSIONS[Number(marker.dataset.missionAnchor)];
    const point = webglField.projectGeo(mission.mapPosition);
    marker.style.left = `${point.x * 100}%`;
    marker.style.top = `${point.y * 100}%`;
    marker.classList.toggle("is-behind-earth", !point.visible);
  }
  missionMarkerFrame = requestAnimationFrame(syncMissionMarkers);
}

function renderEnd() {
  clearInventory();
  setShellFooterContent("end", `<button class="hero-button ui-copy-button" type="button" data-game-action="continue">${escapeHtml(t("end.primary"))}</button>`);
  missionLayer.innerHTML = `
    <section class="flow-screen flow-screen--end" aria-label="${escapeHtml(t("end.aria"))}">
      <div class="end-content">
        <h1 class="ui-copy-heading">${escapeHtml(t("end.title"))}</h1>
        <div class="end-grid">
          <article class="qr-card">
            <h2 class="ui-copy-heading">${escapeHtml(t("end.telegram"))}</h2>
            <img class="native-qr" src="${assetUrl("./assets/qr/tg.svg")}" alt="${escapeHtml(t("end.telegramQrAlt"))}" />
          </article>
          <article class="qr-card">
            <h2 class="ui-copy-heading">${escapeHtml(t("end.max"))}</h2>
            <img class="native-qr" src="${assetUrl("./assets/qr/max.svg")}" alt="${escapeHtml(t("end.maxQrAlt"))}" />
          </article>
        </div>
      </div>
    </section>`;
}

function renderOutcomePopup(mission, network, feedbackEvents = deriveMissionFeedback({ mission, run: missionRun, network })) {
  const popup = missionLayer.querySelector("[data-outcome-popup]");
  if (!popup) return;
  if (missionRun.status === "timeout") {
    placementError = null;
    clearPendingMissionFeedback();
    activeMissionFeedback = null;
    showOutcomePopup(popup, mission, {
      key: `timeout:${mission.number}`,
      kind: "error",
      action: "timeout",
      title: t("popup.timeout.title"),
    });
    return;
  }
  if (missionRun.status === "complete") {
    placementError = null;
    clearPendingMissionFeedback();
    activeMissionFeedback = null;
    const finalEvent = feedbackEvents.find((event) => event.kind === "success" && event.action === "complete");
    if (finalEvent) showOutcomePopup(popup, mission, finalEvent);
    else hideOutcomePopup(popup);
    return;
  }

  if (placementError) {
    showOutcomePopup(popup, mission, { ...placementError,
      title: t(`placement.${placementError.reason}.title`), message: t(`placement.${placementError.reason}.message`) });
    return;
  }
  if (activeMissionFeedback && !feedbackEvents.some((event) => event.key === activeMissionFeedback.key)) activeMissionFeedback = null;
  if (activeMissionFeedback) {
    showOutcomePopup(popup, mission, activeMissionFeedback);
    return;
  }

  const candidate = nextUnseenMissionFeedback(missionFeedbackSession, feedbackEvents);
  if (!candidate) {
    clearPendingMissionFeedback();
    hideOutcomePopup(popup);
    return;
  }
  if (candidate.kind === "error") {
    if (pendingMissionFeedbackKey !== candidate.key) scheduleMissionFeedback(mission, candidate);
  } else {
    clearPendingMissionFeedback();
    activeMissionFeedback = markMissionFeedbackSeen(missionFeedbackSession, candidate);
    showOutcomePopup(popup, mission, candidate);
    return;
  }
  hideOutcomePopup(popup);
}

function showOutcomePopup(popup, mission, outcome) {
  const kind = outcome.kind;
  const isTimeout = outcome.action === "timeout";
  popup.hidden = false;
  popup.dataset.kind = kind;
  popup.dataset.position = "floating";
  popup.dataset.action = outcome.action || "";
  popup.setAttribute("aria-live", outcome.action === "placement" ? "assertive" : "off");
  popup.setAttribute("aria-label", t(isTimeout ? "popup.timeout.aria" : kind === "success" ? "popup.success.aria" : "popup.error.aria"));
  if (popup.dataset.outcomeKey === outcome.key) return;
  popup.dataset.outcomeKey = outcome.key;
  audioAdapter?.onFeedbackShown(outcome);
  delete popup.dataset.userPosition;
  const close = ["complete", "finish", "timeout"].includes(outcome.action) ? "" : `<button class="outcome-popup__close" type="button" data-game-action="dismiss-outcome" aria-label="${escapeHtml(t("popup.close"))}">×</button>`;
  const actions = isTimeout
    ? `<div class="outcome-popup__actions">
        <button class="outcome-popup__action outcome-popup__action--retry ui-copy-button" type="button" data-game-action="restart">${escapeHtml(t("popup.retry"))}</button>
        <button class="outcome-popup__action outcome-popup__action--leave ui-copy-button" type="button" data-game-action="leave-mission">${escapeHtml(t("popup.leave"))}</button>
      </div>`
    : ["complete", "finish"].includes(outcome.action) ? `<button class="hero-button ui-copy-button" type="button" data-game-action="${outcome.action === "finish" ? "finish" : "success"}">${escapeHtml(t(outcome.action === "finish" ? "missionSelect.continue" : "popup.continue"))}</button>` : "";
  const message = outcome.message ? `<p class="outcome-popup__message ui-copy-body">${escapeHtml(outcome.message)}</p>` : "";
  popup.innerHTML = `<div class="floating-dialog__handle" data-popup-drag-handle><h2 class="ui-copy-heading">${escapeHtml(outcome.title)}</h2>${close}</div>${message}${actions}`;
  positionOutcomePopup(popup, mission, kind, outcome.anchorId, outcome.action);
  if (outcome.action === "placement" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Each rejected attempt gets its own entrance, even when the prior popup is open.
    popup.getAnimations().forEach((animation) => animation.cancel());
    popup.animate([{ opacity: 0, transform: "translate3d(-50%, calc(-50% + 18px), 0)" },
      { opacity: 1, transform: "translate3d(-50%, -50%, 0)" }],
    { duration: Math.min(260, shellConfig.motion.microDurationMs || 220), easing: "cubic-bezier(.18,.82,.24,1)" });
  }
}

function hideOutcomePopup(popup) {
  popup.hidden = true;
  popup.replaceChildren();
  delete popup.dataset.outcomeKey;
  delete popup.dataset.userPosition;
  delete popup.dataset.position;
}

function scheduleMissionFeedback(mission, feedback) {
  clearPendingMissionFeedback();
  pendingMissionFeedbackKey = feedback.key;
  pendingMissionFeedbackTimerId = window.setTimeout(() => {
    pendingMissionFeedbackTimerId = 0;
    pendingMissionFeedbackKey = "";
    if (!missionRun || missionRun.mission !== mission.number || missionRun.status === "complete" || missionRun.status === "timeout") return;
    const currentNetwork = deriveNetwork(missionRun, Date.now());
    const currentFeedback = deriveMissionFeedback({ mission, run: missionRun, network: currentNetwork }).find((item) => item.key === feedback.key);
    if (!currentFeedback || missionFeedbackSession?.missionNumber !== mission.number) return;
    activeMissionFeedback = markMissionFeedbackSeen(missionFeedbackSession, currentFeedback);
    renderMission();
  }, FEEDBACK_POPUP_DELAY_MS);
}

function clearPendingMissionFeedback() {
  clearTimeout(pendingMissionFeedbackTimerId);
  pendingMissionFeedbackTimerId = 0;
  pendingMissionFeedbackKey = "";
}

function resetMissionFeedbackRuntime(missionNumber = null) {
  placementError = null;
  clearPendingMissionFeedback();
  missionFeedbackSession = missionNumber === null ? null : createMissionFeedbackSession(missionNumber);
  activeMissionFeedback = null;
}

function positionOutcomePopup(popup, mission, kind, anchorId, action = "") {
  if (action === "finish") {
    const shellState = resolveUiShellState(shellConfig, STATES.MISSION_SELECT);
    const centerX = (shellConfig.geometry.outerInset + designViewport.width - shellState.frameRight) / 2;
    const centerY = shellConfig.geometry.headerHeight + shellConfig.geometry.frameGap + 24 + popup.offsetHeight / 2;
    setOutcomePopupPosition(popup, centerX, centerY);
    return;
  }
  if (action === "timeout" || action === "placement") {
    const shellState = resolveUiShellState(shellConfig, STATES.MISSION_PLAY);
    const centerX = (shellConfig.geometry.outerInset + designViewport.width - shellState.frameRight) / 2;
    const centerY = (shellConfig.geometry.headerHeight + shellConfig.geometry.frameGap + designViewport.height - shellState.frameBottom) / 2;
    setOutcomePopupPosition(popup, centerX, centerY);
    return;
  }
  if (kind === "success" && mission.number === 2) {
    const shell = resolveUiShellState(shellConfig, STATES.MISSION_PLAY);
    const top = shellConfig.geometry.headerHeight + shellConfig.geometry.frameGap;
    const bottom = designViewport.height - shell.frameBottom;
    const centerX = (shellConfig.geometry.outerInset + designViewport.width - shell.frameRight) / 2;
    setOutcomePopupPosition(popup, centerX, top + (bottom - top) * 0.68);
    return;
  }
  const path = mission.topology?.paths.find((p) => p.id === selectedPathId) || mission.topology?.paths[0];
  const anchor = kind === "success"
    ? mission.endpoints[path?.to || "B"]
    : missionRun.placements.find((placement) => placement.id === anchorId) || orderedPlacements(missionRun)[0] || mission.endpoints[path?.from || "A"];
  const projected = webglField?.projectGeo(anchor) || { x: .5, y: .5 };
  const preferredX = projected.x * designViewport.width + (kind === "success" ? -250 : 0);
  const preferredY = projected.y * designViewport.height + (kind === "success" ? -40 : -130);
  setOutcomePopupPosition(popup, preferredX, preferredY);
}

function setOutcomePopupPosition(popup, x, y) {
  const shellState = resolveUiShellState(shellConfig, popup.dataset.action === "finish" ? STATES.MISSION_SELECT : STATES.MISSION_PLAY);
  const halfWidth = Math.max(215, popup.offsetWidth / 2);
  const halfHeight = Math.max(94, popup.offsetHeight / 2);
  const left = shellConfig.geometry.outerInset + halfWidth + 12;
  const right = designViewport.width - shellState.frameRight - halfWidth - 12;
  const top = shellConfig.geometry.headerHeight + shellConfig.geometry.frameGap + halfHeight + 12;
  const bottom = designViewport.height - shellState.frameBottom - halfHeight - 12;
  const safeX = clamp(x, Math.min(left, right), Math.max(left, right));
  const safeY = clamp(y, Math.min(top, bottom), Math.max(top, bottom));
  popup.dataset.popupX = String(safeX);
  popup.dataset.popupY = String(safeY);
  popup.style.setProperty("--outcome-x", `${safeX}px`);
  popup.style.setProperty("--outcome-y", `${safeY}px`);
}

function onboardingStep(number, title, body) {
  return `<article class="onboarding-step"><strong class="ui-copy-heading">${escapeHtml(title)}</strong><div class="step-symbol ui-copy-badge">${escapeHtml(t("onboarding.step", { number }))}</div><p class="ui-copy-instruction">${escapeHtml(body)}</p></article>`;
}

function missionStatusLabel(status) {
  return t({ [MISSION_STATUSES.LOCKED]: "mission.status.locked", [MISSION_STATUSES.OPEN]: "mission.status.open", [MISSION_STATUSES.COMPLETED]: "mission.status.completed" }[status]);
}

function updateMissionNetworkPanels(mission, progress, network, routeOptions) {
  const placements = network?.paths?.[selectedPathId]?.ordered || orderedPlacements(missionRun);
  updateObjectives(mission, progress);
  updateRouteSequence(shellFooterContent.querySelector("[data-route]"), mission, placements, network, routeOptions);
  const hint = missionLayer.querySelector("[data-connection-hint]");
  if (hint) {
    const hidden = ["complete", "timeout"].includes(missionRun.status);
    const text = t(missionRun.connectionHold ? "connection.hold" : connectionMode(mission) === "hybrid" ? "connection.hybridHint" : "connection.hint");
    hint.hidden = hidden;
    if (hint.textContent !== text) hint.textContent = text;
  }
}

function renderMissionStatus(mission, progress, itemOrder, message, network, routeOptions) {
  missionLayer.querySelector(".mission-card")?.classList.toggle("is-complete", missionRun.status === "complete");
  updateMissionNetworkPanels(mission, progress, network, routeOptions);
  updateInventory(itemOrder);
  syncTapTools();
  const feedback = missionLayer.querySelector("[data-feedback]");
  const feedbackKey = `${missionRun.status}:${message}`;
  if (feedback.dataset.motionKey !== feedbackKey) {
    feedback.dataset.motionKey = feedbackKey;
    feedback.className = `game-feedback game-feedback--${missionRun.status} ui-copy-instruction`;
    feedback.textContent = message;
    animateElement(feedback, [
      { opacity: 0, transform: "translate3d(0, 8px, 0) scale(.99)" },
      { opacity: ["playing", "complete", "timeout"].includes(missionRun.status) ? 0 : 1, transform: "translate3d(0, 0, 0) scale(1)" },
    ], motionOptions("microDurationMs"));
  }
  const timer = missionLayer.querySelector("[data-timer]");
  timer.textContent = formatTime(missionRun.seconds);
  timer.closest(".mission-time")?.classList.toggle("is-timeout", missionRun.status === "timeout");
  scheduleTypographyLayoutPass();
}

function withProjectedLayout(run) {
  if (MISSIONS[run?.mission]?.engineVersion === 2) return run;
  if (!webglField || !run?.placements.length) return run;
  return {
    ...run,
    placements: run.placements.map((placement) => ({
      ...placement,
      screenX: webglField.projectGeo(placement).x,
    })),
  };
}

function setShellState(screen, immediate = false) {
  webglField?.setTapControls?.({ enabled: screen === STATES.MISSION_PLAY && placementMode === "tap", selectedId: null });
  connectionPreview = null; connectionRevision = -1;
  webglField?.setScreenConnections(screen === STATES.MISSION_PLAY && usesScreenConnections(MISSIONS[state.activeMission]), connectionMode(MISSIONS[state.activeMission]) === "hybrid");
  const shellState = resolveUiShellState(shellConfig, screen);
  const earthOffset = resolveEarthFrameOffset(shellConfig, screen);
  webglField?.setEndpointSafeArea(resolveEndpointSafeArea(shellConfig, screen));
  if (screen !== STATES.MISSION_SELECT) webglField?.setMissionMarkerSafeArea(null);
  uiShell.className = `ui-shell ui-shell--${screen.toLowerCase().replaceAll("_", "-")}${immediate ? " is-immediate" : ""}`;
  uiShell.dataset.header = shellState.header ? "visible" : "hidden";
  uiShell.dataset.frame = shellState.frame ? "visible" : "hidden";
  uiShell.dataset.footer = shellState.footer ? "visible" : "hidden";
  uiShell.dataset.inventory = shellState.inventory ? "visible" : "hidden";
  uiShell.dataset.footerStyle = shellState.footerStyle;
  stage.dataset.earthMask = shellState.earthMask;
  stage.style.setProperty("--shell-frame-right", `${shellState.frameRight}px`);
  stage.style.setProperty("--shell-frame-bottom", `${shellState.frameBottom}px`);
  stage.style.setProperty("--shell-footer-right", `${shellState.footerRight}px`);
  stage.style.setProperty("--shell-background-blur", `${shellState.backgroundBlur}px`);
  stage.style.setProperty("--shell-background-dim", String(shellState.backgroundDim));
  webglField?.setPresentationOffset(earthOffset.x, earthOffset.y, shellConfig.motion.layoutDurationMs, immediate);
  requestAnimationFrame(() => uiShell.classList.remove("is-immediate"));
}

function applyShellConfiguration() {
  const { geometry, motion } = shellConfig;
  stage.dataset.missionTextLayout = resolveMissionTextLayout(shellConfig, search.get("textLayout"));
  const languageDuration = languageMotionDuration(motion.microDurationMs);
  designViewport = shellConfig.designViewport;
  stage.style.width = `${designViewport.width}px`;
  stage.style.height = `${designViewport.height}px`;
  const variables = {
    "--shell-inset": geometry.outerInset,
    "--shell-header-height": geometry.headerHeight,
    "--shell-frame-gap": geometry.frameGap,
    "--shell-header-padding": geometry.headerPadding,
    "--shell-header-side-column": geometry.headerSideColumn,
    "--shell-footer-height": geometry.footerHeight,
    "--shell-footer-bottom": geometry.footerBottom,
    "--shell-inventory-width": geometry.inventoryWidth,
    "--shell-column-gap": geometry.columnGap,
    "--shell-border-width": geometry.borderWidth,
    "--shell-border-radius": geometry.borderRadius,
    "--shell-layout-duration": `${motion.layoutDurationMs}ms`,
    "--shell-fade-duration": `${motion.fadeDurationMs}ms`,
    "--screen-motion-duration": `${motion.screenDurationMs}ms`,
    "--screen-motion-exit-duration": `${motion.screenExitDurationMs}ms`,
    "--content-stagger": `${motion.contentStaggerMs}ms`,
    "--micro-motion-duration": `${motion.microDurationMs}ms`,
    "--language-motion-duration": `${languageDuration}ms`,
    "--language-motion-easing": LANGUAGE_MOTION_EASING,
    "--ambient-motion-duration": `${motion.ambientDurationMs}ms`,
    "--shell-easing": motion.easing,
    "--motion-spring-easing": motion.springEasing,
  };
  for (const [name, value] of Object.entries(variables)) stage.style.setProperty(name, typeof value === "number" ? `${value}px` : value);
  fitStage();
}

function captureOutgoingScreen() {
  if (!missionLayer.firstElementChild || prefersReducedMotion()) return null;
  cancelActiveScreenTransition();
  const ghost = missionLayer.cloneNode(true);
  ghost.removeAttribute("id");
  ghost.hidden = false;
  ghost.setAttribute("aria-hidden", "true");
  ghost.classList.add("screen-transition-ghost");
  // Surface bases are removed on screen exit; their DOM stems must not linger in the ghost.
  for (const stem of ghost.querySelectorAll(".mission-marker-stem")) stem.remove();
  for (const element of ghost.querySelectorAll("[id]")) element.removeAttribute("id");
  stage.append(ghost);
  return ghost;
}

function completeScreenTransition(ghost, screenChanged, immediate) {
  const revealToken = missionMenuRevealToken;
  const markCardsStarted = () => {
    if (revealToken === missionMenuRevealToken && state.screen === STATES.MISSION_SELECT) webglField.missionMenuCardsStarted();
  };
  renderedScreen = state.screen;
  scheduleTypographyLayoutPass();
  if (!screenChanged || immediate || prefersReducedMotion()) {
    if (screenChanged || immediate) markCardsStarted();
    ghost?.remove();
    return;
  }
  // Read resting status opacity before starting animations. Open cards can
  // already be running the unlock effect, whose transient opacity is not a target.
  const enterTargets = screenEnterTargets().map((target) => ({
    target,
    opacity: target.matches(".mission-marker--locked, .mission-marker--completed")
      ? getComputedStyle(target).opacity : 1,
  }));
  const animations = [];
  if (ghost) animations.push(animateElement(ghost, [
    { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)", filter: "blur(0)" },
    { opacity: 0, transform: "translate3d(0, -12px, 0) scale(.997)", filter: "blur(5px)" },
  ], motionOptions("screenExitDurationMs", { fill: "forwards" })));
  // Projected stems must stay at their WebGL base coordinates throughout entry.
  // Cards have their own reveal; moving/fading the shared layer would detach the stems.
  if (state.screen !== STATES.MISSION_SELECT) animations.push(animateElement(missionLayer, [
    { opacity: 0, transform: "translate3d(0, 18px, 0) scale(.996)", filter: "blur(6px)" },
    { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)", filter: "blur(0)" },
  ], motionOptions("screenDurationMs")));
  enterTargets.forEach(({ target, opacity }, index) => {
    const keyframes = target.matches(".mission-marker") ? [
      { opacity: 0, filter: "blur(5px) brightness(.8)" },
      { opacity, filter: "blur(0) brightness(1)" },
    ] : [
      { opacity: 0, transform: "translate3d(0, 16px, 0) scale(.985)" },
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
    ];
    animations.push(animateElement(target, keyframes, motionOptions("screenDurationMs", {
      delay: index * shellConfig.motion.contentStaggerMs,
      fill: "backwards",
    })));
  });
  // Let bases overlap the tail of the card reveal, not wait for every animation to finish.
  markCardsStarted();
  const transition = { ghost, animations };
  activeScreenTransition = transition;
  Promise.all(animations.filter(Boolean).map((animation) => animation.finished.catch(() => undefined)))
    .finally(() => {
      if (activeScreenTransition === transition) activeScreenTransition = null;
      ghost?.remove();
    });
}

function scheduleTypographyLayoutPass() {
  cancelAnimationFrame(typographyLayoutFrame);
  typographyLayoutFrame = requestAnimationFrame(() => {
    typographyLayoutFrame = 0;
    balanceShortSentenceStarts(stage);
    adaptMissionCopy(stage);
    updateMissionMarkerSafeArea();
    if (!debugEnabled) return;
    const issues = auditTypographyLayout(stage, language);
    if (issues.length) console.warn("[copy-layout]", issues.map(({ code, profile, word, message }) => ({ code, profile, word, message })));
  });
}

function screenEnterTargets() {
  const selectors = [
    ".cta-brand-logo",
    ".cta-content > *",
    ".onboarding-title",
    ".onboarding-step",
    ".mission-marker-anchor:not(.is-behind-earth) .mission-marker",
    ".mission-card",
    ".mission-description",
    ".end-content > h1",
    ".qr-card",
    ".end-copy",
  ];
  return [...missionLayer.querySelectorAll(selectors.join(","))];
}

function cancelActiveScreenTransition() {
  if (!activeScreenTransition) return;
  for (const animation of activeScreenTransition.animations) animation?.cancel?.();
  activeScreenTransition.ghost?.remove();
  activeScreenTransition = null;
}

function setShellFooterContent(key, html) {
  if (shellFooterContent.dataset.contentKey === key) return;
  disposeRouteTrack(shellFooterContent.querySelector("[data-route-track]"));
  const hadContent = shellFooterContent.childElementCount > 0;
  let ghost = null;
  if (hadContent && !prefersReducedMotion()) {
    ghost = shellFooterContent.cloneNode(true);
    ghost.removeAttribute("id");
    ghost.removeAttribute("data-content-key");
    ghost.setAttribute("aria-hidden", "true");
    ghost.classList.add("shell-footer-content-ghost");
    shellFooterContent.parentElement.append(ghost);
  }
  shellFooterContent.innerHTML = html;
  shellFooterContent.dataset.contentKey = key;
  if (ghost) {
    const animation = animateElement(ghost, [
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
      { opacity: 0, transform: "translate3d(0, -8px, 0)" },
    ], motionOptions("microDurationMs", { fill: "forwards" }));
    animation?.finished.catch(() => undefined).finally(() => ghost.remove());
  }
  [...shellFooterContent.children].forEach((child, index) => animateElement(child, [
    { opacity: 0, transform: "translate3d(0, 10px, 0) scale(.98)" },
    { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
  ], motionOptions("microDurationMs", { delay: index * shellConfig.motion.contentStaggerMs, fill: "backwards" })));
}

function updateObjectives(mission, progress) {
  const list = missionLayer.querySelector("[data-objectives]");
  const progressSignature = progress.map(Number).join("");
  const contentSignature = JSON.stringify(mission.objectives.map((objective, index) => [objective.id, objective.label, progressSignature[index]]));
  if (list.dataset.motionKey === contentSignature) return;
  const previous = list.dataset.progressKey || "";
  list.dataset.motionKey = contentSignature;
  list.dataset.progressKey = progressSignature;
  list.innerHTML = mission.objectives
    .map((objective, index) => `<li class="${progress[index] ? "is-done" : ""}"><span class="objective-check" aria-hidden="true"></span><span class="objective-label ui-copy-instruction">${escapeHtml(objective.label)}</span></li>`)
    .join("");
  [...list.children].forEach((item, index) => {
    if (progress[index] && previous[index] !== "1") animateElement(item, [
      { opacity: .58, transform: "translate3d(-5px, 0, 0) scale(.985)" },
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
    ], motionOptions("microDurationMs"));
  });
}

function updateInventory(itemOrder) {
  const signature = itemOrder.map((type) => `${type}:${availableCount(missionRun, type)}:${missionRun.selected === type}:${ITEM_TYPES[type].short}`).join("|");
  if (shellInventoryList.dataset.motionKey === signature && shellInventoryList.childElementCount === itemOrder.length) return;
  shellInventoryList.dataset.motionKey = signature;
  const cards = [...shellInventoryList.children];
  const structureChanged = cards.length !== itemOrder.length || cards.some((card, index) => card.dataset.item !== itemOrder[index]);
  if (structureChanged) {
    shellInventoryList.innerHTML = itemOrder.map((type) => renderInventoryItem(type)).join("");
    [...shellInventoryList.children].forEach((item, index) => animateElement(item, [
      { opacity: 0, transform: "translate3d(12px, 0, 0)" },
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
    ], motionOptions("microDurationMs", { delay: index * Math.min(28, shellConfig.motion.contentStaggerMs), fill: "backwards" })));
    return;
  }
  // Placement, selection, move and restart keep the same buttons and focus.
  // Only a new equipment list uses the entrance animation above.
  for (const card of cards) {
    const type = card.dataset.item, count = availableCount(missionRun, type), title = ITEM_TYPES[type].short;
    card.classList.toggle("is-selected", missionRun.selected === type);
    card.setAttribute("aria-pressed", String(missionRun.selected === type));
    if (card.disabled !== (count < 1)) card.disabled = count < 1;
    const counter = card.querySelector(".object-card-count");
    if (counter && counter.textContent !== `×${count}`) counter.textContent = `×${count}`;
    const label = card.querySelector(".object-card-title");
    const displayTitle = objectCardTitle(title);
    if (label && label.textContent !== displayTitle) label.textContent = displayTitle;
    card.title = title;
    card.setAttribute("aria-label", t("app.inventory.itemAria", { item: title, count }));
  }
}

function clearInventory() {
  shellInventoryList.replaceChildren();
  delete shellInventoryList.dataset.motionKey;
}

function objectCardTitle(title) {
  const words = title.trim().split(/\s+/u);
  return words.length === 2 ? words.join("\n") : title;
}

function updateRouteSequence(route, mission, placements, network, { immediate = false } = {}) {
  if (!route) return;
  const path = mission.topology?.paths.find((p) => p.id === selectedPathId);
  const resolvedPath = network?.paths?.[selectedPathId];
  const fromId = resolvedPath?.from || path?.from || "A";
  const toId = resolvedPath?.to || path?.to || "B";
  const types = path?.steps.map((s) => s.type) || mission.route;
  const layout = resolvedPath?.layout || buildRouteLayout(placements, network?.links || [], fromId, toId, types.length);
  const structureKey = `${mission.number}:${path?.id || ""}:${types.length}`;
  if (route.dataset.structureKey !== structureKey) {
    disposeRouteTrack(route.querySelector("[data-route-track]"));
    route.dataset.structureKey = structureKey;
    route.innerHTML = `
      ${mission.topology?.paths.length > 1 ? `<select data-game-path aria-label="${escapeHtml(t("mission.routeAria"))}">${mission.topology.paths.map((p) => `<option value="${escapeHtml(p.id)}" ${p.id === selectedPathId ? "selected" : ""}>${escapeHtml(p.id)}</option>`).join("")}</select>` : ""}
      <span class="route-endpoint-wrap" data-route-point-from>${renderRoutePoint(mission.endpoints[fromId])}</span>
      <span class="route-arrow route-endpoint-arrow" data-route-from aria-hidden="true">→</span>
      <div class="route-track" data-route-track style="--route-count:${layout.count}"></div>
      <span class="route-arrow route-endpoint-arrow" data-route-to aria-hidden="true">→</span>
      <span class="route-endpoint-wrap" data-route-point-to>${renderRoutePoint(mission.endpoints[toId])}</span>`;
  }
  // Feedback can recolor links without changing the authoritative grouping.
  const links = new Map((network?.links || []).map((link) => [JSON.stringify([link.a, link.b]), link]));
  const viewLayout = { ...layout, connections: layout.connections.map((link) => ({ ...link, ...links.get(JSON.stringify([link.a, link.b])) })) };
  updateRouteTrack(route.querySelector("[data-route-track]"), viewLayout, network,
    (type) => deviceIcon(type, "route-icon"), (content, frames) => animateElement(content, frames,
      motionOptions("microDurationMs", { duration: ROUTE_FADE_MS, fill: "forwards" })), {
      identity: `${fromId}:${toId}`,
      immediate: immediate || network?.complete === true || missionRun?.status === "timeout" || layout.items.length === 0,
      onCommit: (snapshot) => {
        for (const [side, id] of [["from", fromId], ["to", toId]]) {
          const point = route.querySelector(`[data-route-point-${side}]`);
          if (point && point.dataset.pointId !== id) {
            point.dataset.pointId = id;
            point.innerHTML = renderRoutePoint(mission.endpoints[id]);
          }
        }
        route.querySelector("[data-route-from]")?.classList.toggle("is-connected", snapshot.connections.some((link) => link.active !== false && link.a === `endpoint:${fromId}`));
        route.querySelector("[data-route-to]")?.classList.toggle("is-connected", snapshot.connections.some((link) => link.active !== false && link.b === `endpoint:${toId}`));
      },
    });
}

function motionOptions(durationKey, extra = {}) {
  return {
    duration: shellConfig?.motion?.[durationKey] ?? 240,
    easing: shellConfig?.motion?.springEasing || shellConfig?.motion?.easing || "ease-out",
    ...extra,
  };
}

function animateElement(element, keyframes, options) {
  if (!element || prefersReducedMotion() || typeof element.animate !== "function") return null;
  return element.animate(keyframes, options);
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function renderInventoryItem(type) {
  const count = availableCount(missionRun, type);
  const selected = missionRun.selected === type;
  return `<button type="button" class="inventory-item piece-source ${selected ? "is-selected" : ""}" data-item="${type}" aria-pressed="${selected}" ${count < 1 ? "disabled" : ""} aria-label="${escapeHtml(t("app.inventory.itemAria", { item: ITEM_TYPES[type].short, count }))}" title="${escapeHtml(ITEM_TYPES[type].short)}">
    ${objectCard(type, count)}
  </button>`;
}

function scheduleNodeWakeup(now) {
  clearTimeout(nodeStateTimerId);
  const delays = missionRun.placements
    .map((placement) => NODE_WAKE_DELAY_MS - (now - placement.droppedAt))
    .filter((delay) => delay > 0);
  if (!delays.length) return;
  nodeStateTimerId = window.setTimeout(() => {
    if (missionRun) renderMission();
  }, Math.min(...delays) + 20);
}

function onMissionLayerClick(event) {
  if (!debugEnabled && event.target.closest("[data-debug-only]")) { event.preventDefault?.(); return; }
  // The shell also carries data-placement-mode for styling; only its buttons are commands.
  const requestedPlacementMode = event.target.closest("button[data-placement-mode]")?.dataset.placementMode;
  if (requestedPlacementMode && !languageTransitionPromise) {
    if (placementMode !== requestedPlacementMode) {
      placementMode = requestedPlacementMode;
      placementSession++;
      try { localStorage.setItem(PLACEMENT_MODE_KEY, placementMode); } catch { /* Storage is optional. */ }
      if (missionRun) updateMission({ type: "CLEAR_SELECTION" });
      syncPlacementControls();
    }
    return;
  }
  const audioToggle = event.target.closest("[data-audio-toggle]");
  if (audioToggle) {
    audioDirector?.toggleMuted();
    syncAudioControl();
    return;
  }
  const requestedLanguage = event.target.closest("[data-language]")?.dataset.language;
  if (requestedLanguage) {
    void changeLanguage(requestedLanguage);
    return;
  }
  if (languageTransitionPromise) return;
  const nodeAction = event.target.closest("[data-node-action]")?.dataset.nodeAction;
  if (nodeAction) { applyTapNodeAction(nodeAction); return; }
  const action = event.target.closest("[data-game-action]")?.dataset.gameAction;
  if (action === "debug-off") { setDebugEnabled(false); return; }
  else if (action === "back") dispatch({ type: "BACK" });
  else if (action === "debug-complete-all") dispatch({ type: "DEBUG_COMPLETE_ALL" });
  else if (action === "debug-toggle-unlock") dispatch({ type: "DEBUG_TOGGLE_UNLOCK" });
  else if (action === "launch" || action === "continue") dispatch({ type: "PRIMARY" });
  else if (action === "success") dispatch({ type: "MISSION_COMPLETE", mission: missionRun.mission });
  else if (action === "finish") dispatch({ type: "FINISH" });
  else if (action === "restart") updateMission({ type: "RESTART" });
  else if (action === "leave-mission") dispatch({ type: "BACK" });
  else if (action === "dismiss-outcome") {
    const popup = event.target.closest("[data-outcome-popup]");
    if (popup) { activeMissionFeedback = null; placementError = null; }
    if (popup) popup.hidden = true;
  }
  const marker = event.target.closest("[data-select-mission]");
  if (marker) {
    const mission = MISSIONS[Number(marker.dataset.selectMission)];
    if (!marker.disabled) audioAdapter?.onMissionCardPress();
    dispatch({ type: "SELECT_MISSION", mission: mission.number, requiresCompleted: mission.unlock.requiresCompleted });
  }
  const card = event.target.closest("[data-item].inventory-item");
  if (card && !card.disabled && !suppressPointerClick) updateMission({ type: "SELECT", item: card.dataset.item });
}

function onMissionLayerPointerOver(event) {
  if (state.screen !== STATES.MISSION_SELECT || !window.matchMedia?.("(hover: hover)").matches) return;
  const card = event.target.closest(".mission-marker--open");
  if (!card || card.contains(event.relatedTarget)) return;
  audioAdapter?.onMissionCardHover();
}

function onMissionLayerPointerDown(event) {
  if (languageTransitionPromise) return;
  const popupHandle = event.target.closest("[data-popup-drag-handle]");
  if (popupHandle && !event.target.closest("button")) {
    beginOutcomePopupDrag(event, popupHandle.closest("[data-outcome-popup]"));
    return;
  }
  const card = event.target.closest("[data-item].inventory-item");
  if (card && placementMode === "drag") beginPointerDrag(event, card);
}

function beginOutcomePopupDrag(event, popup) {
  if (!popup || event.button !== undefined && event.button !== 0) return;
  const startX = event.clientX;
  const startY = event.clientY;
  const popupX = Number(popup.dataset.popupX) || designViewport.width / 2;
  const popupY = Number(popup.dataset.popupY) || designViewport.height / 2;
  const stageRect = stage.getBoundingClientRect();
  const scale = stageRect.width / designViewport.width || 1;
  popup.dataset.userPosition = "true";
  popup.setPointerCapture?.(event.pointerId);
  const move = (moveEvent) => {
    setOutcomePopupPosition(
      popup,
      popupX + (moveEvent.clientX - startX) / scale,
      popupY + (moveEvent.clientY - startY) / scale,
    );
  };
  const end = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
  window.addEventListener("pointercancel", end, { once: true });
  event.preventDefault();
}

function beginPointerDrag(event, source) {
  if (event.button !== undefined && event.button !== 0) return;
  const item = source.dataset.item;
  if (!item || source.matches(":disabled") || !missionRun || state.screen !== STATES.MISSION_PLAY) return;
  const session = placementSession;
  const isCurrentGesture = () => session === placementSession && state.screen === STATES.MISSION_PLAY && missionRun && !["complete", "timeout"].includes(missionRun.status);
  const startX = event.clientX;
  const startY = event.clientY;
  let lastX = startX;
  let lastY = startY;
  let lastTime = performance.now();
  let velocityX = 0;
  let velocityY = 0;
  let moved = false;
  let ghost = null;
  const move = (moveEvent) => {
    const now = performance.now();
    const elapsed = Math.max(8, now - lastTime);
    velocityX = velocityX * .55 + ((moveEvent.clientX - lastX) / elapsed) * .45;
    velocityY = velocityY * .55 + ((moveEvent.clientY - lastY) / elapsed) * .45;
    lastX = moveEvent.clientX;
    lastY = moveEvent.clientY;
    lastTime = now;
    moved ||= Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 7;
    if (moved && !ghost) {
      ghost = document.createElement("div");
      ghost.className = "drag-ghost";
      ghost.innerHTML = objectCard(item);
      document.body.append(ghost);
      source.classList.add("is-dragging");
    }
    if (ghost) {
      const previewGeo = webglField?.projectDrop(moveEvent.clientX + clamp(velocityX * 52, -44, 44), moveEvent.clientY + clamp(velocityY * 52, -44, 44), item);
      const reason = previewGeo ? getPlacementRejection(item, previewGeo) : null;
      ghost.classList.toggle("is-invalid-drop", Boolean(reason));
      ghost.dataset.dropMessage = reason ? t(`placement.${placementErrorReason(reason)}.title`) : "";
      moveGhost(moveEvent.clientX, moveEvent.clientY, velocityX, ghost);
    }
  };
  const end = async (upEvent) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", cancel);
    moved ||= Math.hypot(upEvent.clientX - startX, upEvent.clientY - startY) > 8;
    if (!moved) return;
    if (!isCurrentGesture()) { source.classList.remove("is-dragging"); ghost?.remove(); return; }
    suppressPointerClick = true;
    setTimeout(() => { suppressPointerClick = false; }, 0);
    const rect = worldLayer.getBoundingClientRect();
    const inside = rect && upEvent.clientX >= rect.left && upEvent.clientX <= rect.right && upEvent.clientY >= rect.top && upEvent.clientY <= rect.bottom;
    if (!inside) {
      source.classList.remove("is-dragging");
      await settleGhost(ghost, startX, startY, 0);
      ghost?.remove();
      return;
    }
    const finishX = upEvent.clientX + clamp(velocityX * 52, -44, 44);
    const finishY = upEvent.clientY + clamp(velocityY * 52, -44, 44);
    const rotation = clamp(velocityX * 4.5, -9, 9);
    const geo = webglField?.projectDrop(finishX, finishY, item);
    if (!geo) {
      source.classList.remove("is-dragging");
      await settleGhost(ghost, startX, startY, 0);
      ghost?.remove();
      return;
    }
    const rejection = getPlacementRejection(item, geo);
    if (rejection) {
      source.classList.remove("is-dragging");
      await settleGhost(ghost, startX, startY, 0);
      ghost?.remove();
      if (isCurrentGesture()) showPlacementError(rejection);
      return;
    }
    if (isCurrentGesture()) updateMission({ type: "PLACE", item, ...geo, rotation, now: Date.now() });
    await settleGhost(ghost, finishX, finishY, rotation);
    ghost?.remove();
    source.classList.remove("is-dragging");
  };
  const cancel = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", cancel);
    source.classList.remove("is-dragging");
    ghost?.remove();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
  window.addEventListener("pointercancel", cancel, { once: true });
}

function moveGhost(x, y, velocityX, ghost) {
  const rotation = clamp(velocityX * 4.5, -11, 11);
  ghost.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotation}deg) scale(1.035)`;
}

function settleGhost(ghost, x, y, rotation) {
  if (!ghost) return Promise.resolve();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  const animation = ghost.animate([
    { transform: ghost.style.transform },
    { transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotation}deg) scale(.52)`, opacity: .35 },
  ], { duration: 240, easing: "cubic-bezier(.18,.82,.24,1)", fill: "forwards" });
  return animation.finished.catch(() => undefined);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateMission(action) {
  if (!missionRun || state.screen !== STATES.MISSION_PLAY) return false;
  const previousRun = missionRun;
  const next = reduceMission(previousRun, action);
  if (next === previousRun) {
    const type = action.type === "PLACE" ? action.item || previousRun.selected : previousRun.placements.find((p) => p.id === Number(action.id))?.type;
    const rejection = ["PLACE", "MOVE"].includes(action.type) && type ? getPlacementRejection(type, action) : null;
    if (["PLACE", "MOVE"].includes(action.type)) renderMission({ routeReleased: true }); // Restore preview links even on refusal.
    if (rejection) showPlacementError(rejection, action.id);
    return false;
  }
  if (["PLACE", "MOVE", "RESTART"].includes(action.type)) placementError = null;
  if (action.type === "RESTART") placementSession++;
  audioAdapter?.afterMissionTransition(previousRun, next, action);
  missionRun = next;
  renderMission({ routeReleased: ["PLACE", "MOVE", "REMOVE", "RESTART"].includes(action.type) });
  if (missionRun.status === "complete") clearInterval(timerId);
  return true;
}

function placementErrorReason(reason) {
  return reason === "water" || reason === "land" ? reason : "unavailable";
}

function showPlacementError(reason, anchorId = null) {
  if (!missionRun || state.screen !== STATES.MISSION_PLAY || ["complete", "timeout"].includes(missionRun.status)) return;
  clearPendingMissionFeedback();
  placementError = { key: `placement:${++placementErrorSequence}`, reason: placementErrorReason(reason), kind: "error", action: "placement", anchorId };
  const popup = missionLayer.querySelector("[data-outcome-popup]");
  if (popup) renderOutcomePopup(MISSIONS[missionRun.mission], deriveNetwork(missionRun, Date.now()));
}

function previewMissionMove(id, geo) {
  if (!missionRun || ["complete", "timeout"].includes(missionRun.status)) return;
  const previewRun = previewPlacementMove(missionRun, id, geo);
  if (previewRun === missionRun) return;
  const mission = MISSIONS[missionRun.mission];
  if (usesScreenConnections(mission)) {
    connectionPreview = previewRun;
    missionRun = { ...missionRun, connectionHold: null };
  }
  const evaluationNetwork = deriveNetwork(previewRun, Date.now());
  const feedbackEvents = deriveMissionFeedback({ mission, run: previewRun, network: evaluationNetwork });
  const network = applyMissionFeedback(evaluationNetwork, feedbackEvents);
  webglField.update({ placements: previewRun.placements, network, selectedItem: missionRun.selected, endpoints: mission.endpoints });
  if (!usesScreenConnections(mission)) {
    const placements = network?.paths?.[selectedPathId]?.ordered || orderedPlacements(previewRun);
    updateRouteSequence(shellFooterContent.querySelector("[data-route]"), mission, placements, network);
  }
}

function connectionModesHtml() {
  return ["world", "screen", "hybrid"].map((mode, index) => {
    const label = `${index + 1} — ${t(`connection.${mode}`)}`;
    const current = baseMissionCatalog.missions.every((mission) => connectionMode(mission) === mode);
    return `<a class="audio-toggle connection-mode" href="${connectionModeUrl(mode)}" ${current ? 'aria-current="true"' : ""} aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${index + 1}</a>`;
  }).join("");
}

function connectionModeUrl(mode) {
  const url = new URL(location.href);
  url.searchParams.set("connection", mode);
  return escapeHtml(`${url.pathname}${url.search}${url.hash}`);
}

function updateConnectionView(forceRoute = false) {
  if (!appReady || !missionRun || state.screen !== STATES.MISSION_PLAY || !usesScreenConnections(MISSIONS[missionRun.mission])
    || ["complete", "timeout"].includes(missionRun.status) || document.hidden) return;
  const now = Date.now(), mission = MISSIONS[missionRun.mission], run = connectionPreview || missionRun;
  const snapshot = webglField.captureConnections(run, mission, null, now);
  const holdPending = missionRun.connectionHold && screenReady(mission, missionRun, now);
  if (!forceRoute && (snapshot.revision === connectionRevision && !holdPending || now - connectionFrameAt < 33)) return;
  connectionRevision = snapshot.revision; connectionFrameAt = now;
  if (connectionPreview) {
    const preview = { ...run, connectionProjection: snapshot };
    const evaluated = deriveNetwork(preview, now);
    const network = applyMissionFeedback(evaluated, deriveMissionFeedback({ mission, run: preview, network: evaluated }));
    webglField.update({ placements: run.placements, network, selectedItem: run.selected, endpoints: mission.endpoints });
    updateMissionNetworkPanels(mission, network.objectives, network);
    return;
  }
  missionRun = reduceMission(missionRun, { type: "CONNECTION_VIEW", snapshot, now });
  const evaluation = deriveNetwork(missionRun, now);
  const signature = JSON.stringify([snapshot.interacting, evaluation.objectives, evaluation.states, evaluation.links.map((l) => [l.a, l.b, l.correct]),
    Object.values(evaluation.paths).map((p) => [p.ordered.map((n) => n.id), p.layout?.items.map((i) => [i.node.id, i.position, i.anchor])]), evaluation.diagnostics, Boolean(missionRun.connectionHold)]);
  if (forceRoute || signature !== connectionUiSignature || evaluation.complete && screenReady(mission, missionRun, now)) {
    connectionUiSignature = signature;
    renderMission({ routeImmediate: forceRoute });
  }
}

function startTimer() {
  clearInterval(timerId);
  timerId = window.setInterval(() => {
    if (!missionRun || document.hidden) return;
    missionRun = reduceMission(missionRun, { type: "TICK" });
    const timer = missionLayer.querySelector("[data-timer]");
    if (timer) timer.textContent = formatTime(missionRun.seconds);
    if (missionRun.status === "timeout") {
      clearInterval(timerId);
      renderMission();
    }
  }, 1000);
}

function fitStage() {
  if (missionRun?.connectionHold) missionRun = { ...missionRun, connectionHold: null };
  connectionRevision = -1;
  if (!designViewport) return;
  stage.style.setProperty("--stage-scale", String(Math.min(window.innerWidth / designViewport.width, window.innerHeight / designViewport.height)));
  webglField?.resize();
  updateMissionMarkerSafeArea();
}

function unlockAudio() {
  if (!appReady) return;
  void audioDirector?.unlock();
}

function onVisibilityChange() {
  if (missionRun) missionRun = { ...missionRun, connectionHold: null };
  connectionRevision = -1;
  if (!document.hidden) fitStage();
  void audioAdapter?.onVisibilityChange(document.hidden);
}

function onKeyDown(event) {
  if (!appReady) return;
  if (event.key !== "Enter" && event.key !== " ") cancelBackNavigation();
  if (event.key === "Escape") dispatch({ type: "BACK" });
  else if (debugEnabled && event.key.toLowerCase() === "r" && !event.target.closest?.(".game-screen")) dispatch({ type: "RESET" });
  else if (debugEnabled && event.key.toLowerCase() === "f") toggleFullscreen();
  else if (debugEnabled && event.key === "ArrowRight") navigateRelative(1);
  else if (debugEnabled && event.key === "ArrowLeft") navigateRelative(-1);
  else if ((event.key === "Enter" || event.key === " ") && state.screen !== STATES.MISSION_PLAY
    && !event.target.closest?.("a[href], button, input, select, textarea, [contenteditable]")) {
    event.preventDefault(); dispatch({ type: "PRIMARY" });
  }
}

function navigateRelative(offset) {
  const index = STATE_ORDER.indexOf(state.screen);
  dispatch({ type: "GO", screen: STATE_ORDER[(index + offset + STATE_ORDER.length) % STATE_ORDER.length] });
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}

function loadState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(progressStorageKey));
    const restored = restoreGameState(saved && !debugEnabled ? { ...saved, allMissionsAvailable: false } : saved, MISSION_ORDER);
    sessionStorage.setItem(progressStorageKey, JSON.stringify(restored));
    return restored;
  } catch (_) { /* Start clean when stored data is invalid. */ }
  return createInitialState(MISSION_ORDER[0]);
}

function assetUrl(source) { return preparedAssets.url(source); }

function brandLogoSource() {
  return language === "en" ? "./assets/nodes/logo-eng.svg" : "./assets/nodes/logo.svg";
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function deviceIcon(type, className) {
  const item = ITEM_TYPES[type];
  return `<img class="${className}" src="${escapeHtml(assetUrl(item.icon))}" alt="" draggable="false" />`;
}

function objectCard(type, count = null) {
  const item = ITEM_TYPES[type];
  const countMarkup = Number.isFinite(count) ? `<span class="object-card-count">×${count}</span>` : "";
  return `<span class="inventory-card-art object-card"><i class="object-card-drag-handle" aria-hidden="true"></i>${deviceIcon(type, "object-card-icon")}<strong class="object-card-title ui-copy-heading">${escapeHtml(objectCardTitle(item.short))}</strong>${countMarkup}</span>`;
}
function renderRoutePoint(point) {
  const icon = pointIconSource(point);
  return `<span class="route-endpoint has-icon">${icon ? `<img src="${escapeHtml(assetUrl(icon))}" alt="">` : ""}</span>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function emptyNetwork() {
  return { links: [], states: {} };
}

function screenTitle(mission) {
  return {
    [STATES.CTA]: t("screen.cta.title"),
    [STATES.ONBOARDING]: t("screen.onboarding.title"),
    [STATES.MISSION_SELECT]: t("screen.missionSelect.title"),
    [STATES.MISSION_PLAY]: t("screen.missionPlay.title", { number: mission.number }),
    [STATES.END]: t("screen.end.title"),
  }[state.screen] || t("app.title");
}

function missionDescriptionHtml(mission) {
  return escapeHtml(mission.description || mission.summary || "")
    .replace(/(^|\n)([^:\n]{1,24}:)/g, "$1<strong>$2</strong>");
}

function wordingHtml(key) {
  return escapeHtml(t(key)).replaceAll("\n", "<br />");
}

function applyStaticWording() {
  document.documentElement.lang = language;
  stage.setAttribute("aria-label", t("app.aria.game"));
  worldLayer.setAttribute("aria-label", t("app.aria.earth"));
  uiShell.querySelector(".brand-logo")?.setAttribute("alt", t("app.aria.logo"));
  if (preparedAssets) uiShell.querySelector(".brand-logo").src = assetUrl(brandLogoSource());
  uiShell.querySelector(".header-title").innerHTML = brandTitleHtml(language, t("app.header.title"), t("app.aria.logo"), preparedAssets ? assetUrl(brandLogoSource()) : brandLogoSource());
  uiShell.querySelector('[data-game-action="back"]').textContent = t("app.header.back");
  const modes = uiShell.querySelector("[data-connection-modes]");
  modes.setAttribute("aria-label", t("connection.mode"));
  modes.innerHTML = connectionModesHtml();
  const debugOffButton = uiShell.querySelector('[data-game-action="debug-off"]');
  debugOffButton.setAttribute("aria-label", t("app.debug.off"));
  debugOffButton.setAttribute("title", t("app.debug.off"));
  const completeAllButton = uiShell.querySelector('[data-game-action="debug-complete-all"]');
  completeAllButton.setAttribute("aria-label", t("app.debug.completeAll"));
  completeAllButton.setAttribute("title", t("app.debug.completeAll"));
  const unlockButton = uiShell.querySelector('[data-game-action="debug-toggle-unlock"]');
  unlockButton.setAttribute("aria-label", t("app.debug.unlockAll"));
  unlockButton.setAttribute("title", t("app.debug.unlockAll"));
  uiShell.querySelector(".language-switcher")?.setAttribute("aria-label", t("app.header.language"));
  uiShell.querySelector(".language-switcher")?.setAttribute("data-active-language", language);
  uiShell.querySelector(".shell-inventory")?.setAttribute("aria-label", t("app.inventory.aria"));
  shellInventoryList.setAttribute("aria-label", t("app.inventory.aria"));
  uiShell.querySelector(".shell-inventory h2").innerHTML = t("app.inventory.title").split("\n")
    .map((line, index) => `<span class="inventory-title__line${index === 0 ? " inventory-title__lead" : ""}">${escapeHtml(line)}</span>`).join("");
  syncPlacementControls();
  loading.textContent = t("app.loading");
  debug.querySelector('[data-debug="fullscreen"]').textContent = t("app.debug.fullscreen");
  for (const button of uiShell.querySelectorAll("[data-language]")) button.setAttribute("aria-pressed", String(button.dataset.language === language));
  syncAudioControl();
}

function syncPlacementControls() {
  uiShell.dataset.placementMode = placementMode;
  const toggle = uiShell.querySelector("[data-placement-toggle]");
  const nextMode = placementMode === "tap" ? "drag" : "tap";
  toggle.dataset.placementMode = nextMode;
  const label = t("placement.input.toggle", {
    current: t(`placement.input.${placementMode}`), next: t(`placement.input.${nextMode}`),
  });
  toggle.setAttribute("aria-label", label);
  toggle.setAttribute("title", label);
  for (const button of uiShell.querySelectorAll("[data-node-action]")) button.textContent = t(`placement.input.${button.dataset.nodeAction}`);
  syncTapTools();
}

function syncTapTools() {
  const enabled = placementMode === "tap" && state.screen === STATES.MISSION_PLAY;
  const selected = missionRun?.placements.find((node) => node.id === missionRun.selectedPlacementId);
  const editable = enabled && missionRun && !["complete", "timeout"].includes(missionRun.status);
  webglField?.setTapControls?.({ enabled, selectedId: editable ? selected?.id ?? null : null });
  const orbital = selected && isOrbitalType(selected.type) && !usesScreenConnections(MISSIONS[missionRun.mission]);
  uiShell.querySelector("[data-tap-tools]").hidden = !enabled || !orbital;
  uiShell.querySelector("[data-tap-altitude]").hidden = !orbital;
  if (orbital) {
    const settings = altitudeSettingsFor(selected.type);
    const percent = Math.round(100 * (selected.altitude - settings.minAltitude) / (settings.maxAltitude - settings.minAltitude));
    uiShell.querySelector("[data-tap-altitude-label]").textContent = t("placement.input.altitude", { value: percent });
    uiShell.querySelector('[data-node-action="lower"]').disabled = !editable || selected.altitude <= settings.minAltitude;
    uiShell.querySelector('[data-node-action="raise"]').disabled = !editable || selected.altitude >= settings.maxAltitude;
  }
}

function applyTapNodeAction(action) {
  if (placementMode !== "tap" || state.screen !== STATES.MISSION_PLAY || !missionRun) return;
  const selected = missionRun.placements.find((node) => node.id === missionRun.selectedPlacementId);
  if (!selected) return;
  if (!["raise", "lower"].includes(action) || !isOrbitalType(selected.type) || usesScreenConnections(MISSIONS[missionRun.mission])) return;
  const altitude = steppedAltitude(selected.altitude, altitudeSettingsFor(selected.type), action === "raise" ? 1 : -1);
  if (altitude !== selected.altitude) updateMission({ type: "MOVE", id: selected.id,
    latitude: selected.latitude, longitude: selected.longitude, altitude, now: Date.now() });
}

function syncAudioControl() {
  const control = uiShell.querySelector("[data-audio-toggle]");
  if (!control || !wording) return;
  const muted = audioDirector?.isMuted() ?? false;
  const label = t(muted ? "app.audio.unmute" : "app.audio.mute");
  control.setAttribute("aria-checked", String(!muted));
  control.setAttribute("aria-label", label);
  control.setAttribute("title", label);
  control.classList.toggle("is-muted", muted);
}

async function changeLanguage(nextLanguage) {
  if (!wording?.languages.includes(nextLanguage)) return;
  queuedLanguage = nextLanguage;
  if (languageTransitionPromise) return languageTransitionPromise;
  languageTransitionPromise = runLanguageTransitionQueue()
    .catch((error) => {
      loading.hidden = false;
      loading.textContent = t("app.loadingError");
      console.error(error);
    })
    .finally(() => {
      for (const animation of activeLanguageAnimations) animation?.cancel?.();
      for (const ghost of activeLanguageGhosts) ghost?.remove?.();
      activeLanguageAnimations = [];
      activeLanguageGhosts = [];
      stage.classList.remove("is-language-transitioning");
      uiShell.removeAttribute("aria-busy");
      languageTransitionPromise = null;
    });
  return languageTransitionPromise;
}

async function runLanguageTransitionQueue() {
  stage.classList.add("is-language-transitioning");
  uiShell.setAttribute("aria-busy", "true");
  cancelActiveScreenTransition();
  while (queuedLanguage) {
    const nextLanguage = queuedLanguage;
    queuedLanguage = null;
    if (nextLanguage === language) continue;
    await transitionToLanguage(nextLanguage);
  }
}

async function transitionToLanguage(nextLanguage) {
  const reduceMotion = prefersReducedMotion();
  const outgoingGhosts = reduceMotion ? [] : captureLanguageSnapshot();

  language = nextLanguage;
  t = createTranslator(wording, language);
  persistLanguage(language);
  configureMissions(localizeMissionCatalog(baseMissionCatalog, t));
  if (missionRun) activateMissionSettings(missionRun.mission);
  applyStaticWording();
  await rerenderLocalizedContent();

  if (reduceMotion) return;
  const duration = languageMotionDuration();
  const outgoingAnimations = playLanguageAnimations(outgoingGhosts, [
    { opacity: 1, transform: "translate3d(0, 0, 0)" },
    { opacity: 0, transform: "translate3d(0, -3px, 0)" },
  ], duration);
  const incomingAnimations = playLanguageAnimations(languageMotionTargets(), [
    { opacity: 0, transform: "translate3d(0, 3px, 0)" },
    { opacity: 1, transform: "translate3d(0, 0, 0)" },
  ], duration);
  activeLanguageAnimations = [...outgoingAnimations, ...incomingAnimations];
  await settleAnimations(activeLanguageAnimations);
  for (const animation of activeLanguageAnimations) animation?.cancel?.();
  for (const ghost of outgoingGhosts) ghost.remove();
  activeLanguageAnimations = [];
  activeLanguageGhosts = [];
}

async function rerenderLocalizedContent() {
  if (state.screen === STATES.MISSION_PLAY && missionRun) {
    const mission = MISSIONS[missionRun.mission];
    document.title = t("app.titleWithScreen", { screen: screenTitle(mission) });
    missionLayer.querySelector(".game-screen")?.setAttribute("aria-label", mission.name);
    const number = missionLayer.querySelector(".mission-card-content > p");
    const title = missionLayer.querySelector(".mission-card-content > h2");
    const description = missionLayer.querySelector(".mission-description");
    const level = missionLayer.querySelector(".mission-level");
    const timeLabel = missionLayer.querySelector("[data-time-label]");
    const restart = missionLayer.querySelector('[data-game-action="restart"]');
    if (number) number.textContent = t("mission.number", { number: mission.number });
    if (title) title.textContent = mission.name;
    if (level) level.textContent = mission.level;
    if (description) description.innerHTML = missionDescriptionHtml(mission);
    if (timeLabel) timeLabel.textContent = `${t("mission.time")} `;
    restart?.setAttribute("aria-label", t("mission.restart"));
    restart?.setAttribute("title", t("mission.restart"));
    delete shellInventoryList.dataset.motionKey;

    const popup = missionLayer.querySelector("[data-outcome-popup]");
    const popupPosition = popup?.dataset.userPosition === "true"
      ? { x: Number(popup.dataset.popupX), y: Number(popup.dataset.popupY) }
      : null;
    if (popup) delete popup.dataset.outcomeKey;
    if (activeMissionFeedback) {
      const currentEvents = deriveMissionFeedback({ mission, run: missionRun, network: deriveNetwork(missionRun, Date.now()) });
      activeMissionFeedback = currentEvents.find((event) => event.key === activeMissionFeedback.key) || null;
    }
    renderMission();
    if (popupPosition && popup && !popup.hidden) {
      setOutcomePopupPosition(popup, popupPosition.x, popupPosition.y);
      popup.dataset.userPosition = "true";
    }
    return;
  }

  delete shellFooterContent.dataset.contentKey;
  renderedScreen = null;
  await render({ immediate: true });
}

function languageMotionTargets() {
  const candidates = [
    missionLayer,
    uiShell.querySelector(".header-title"),
    uiShell.querySelector('[data-game-action="back"]'),
    uiShell.querySelector(".shell-inventory"),
    shellFooterContent,
  ];
  return [...new Set(candidates)].filter((element) => {
    if (!element?.isConnected || !element.getClientRects().length) return false;
    const style = getComputedStyle(element);
    return style.visibility !== "hidden" && Number(style.opacity) > .01;
  });
}

function captureLanguageSnapshot() {
  const stageRect = stage.getBoundingClientRect();
  const scaleX = stageRect.width / (stage.offsetWidth || designViewport?.width || 1);
  const scaleY = stageRect.height / (stage.offsetHeight || designViewport?.height || 1);
  const ghosts = languageMotionTargets().map((element) => {
    const rect = element.getBoundingClientRect();
    const ghost = element.cloneNode(true);
    ghost.removeAttribute("id");
    ghost.removeAttribute("hidden");
    ghost.setAttribute("aria-hidden", "true");
    ghost.classList.add("language-transition-ghost");
    for (const child of ghost.querySelectorAll("[id]")) child.removeAttribute("id");
    Object.assign(ghost.style, {
      position: "absolute",
      zIndex: "20",
      top: `${(rect.top - stageRect.top) / scaleY}px`,
      left: `${(rect.left - stageRect.left) / scaleX}px`,
      right: "auto",
      bottom: "auto",
      width: `${rect.width / scaleX}px`,
      height: `${rect.height / scaleY}px`,
      margin: "0",
      opacity: "1",
      transform: "translate3d(0, 0, 0)",
    });
    stage.append(ghost);
    return ghost;
  });
  activeLanguageGhosts = ghosts;
  return ghosts;
}

function languageMotionDuration(microDurationMs = shellConfig?.motion?.microDurationMs ?? 220) {
  return Math.max(LANGUAGE_MOTION_MIN_MS, Math.min(LANGUAGE_MOTION_MAX_MS, Math.round(microDurationMs * LANGUAGE_MOTION_DURATION_SCALE)));
}

function playLanguageAnimations(targets, keyframes, duration) {
  const animations = targets
    .map((element) => typeof element.animate === "function" ? element.animate(keyframes, { duration, easing: LANGUAGE_MOTION_EASING, fill: "forwards" }) : null)
    .filter(Boolean);
  return animations;
}

function settleAnimations(animations) {
  return Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
}
