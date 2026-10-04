import { CONTOUR_ID_PATTERN, DEFAULT_CONTOUR_ID } from "./earth-contours.mjs";
const REQUIRED_STATES = ["CTA", "ONBOARDING", "MISSION_SELECT", "MISSION_PLAY", "END"];
const GEOMETRY_FIELDS = ["outerInset", "headerHeight", "frameGap", "headerPadding", "headerSideColumn", "footerHeight", "footerBottom", "inventoryWidth", "columnGap", "borderWidth", "borderRadius"];
const MOTION_NUMBER_FIELDS = ["layoutDurationMs", "fadeDurationMs", "screenDurationMs", "screenExitDurationMs", "contentStaggerMs", "microDurationMs", "ambientDurationMs"];
const STATE_NUMBER_FIELDS = ["frameRight", "frameBottom", "footerRight", "backgroundBlur"];
const FOOTER_STYLES = new Set(["hidden", "floating", "panel"]);
const EARTH_MASKS = new Set(["full", "frame"]);
export const CURRENT_UI_SHELL_SCHEMA_VERSION = 8;

// The extra orbital headroom belongs only to the second mission.
export function resolveMissionEarthOrbit(source, screen, missionNumber) {
  return { ...source, centerRussia: source?.centerRussia !== false && screen === "MISSION_PLAY" && Number(missionNumber) === 2 };
}

export const DEFAULT_NODE_ICON_BACKDROP = Object.freeze({
  color: "#07111f",
  opacity: 0.9,
  radius: 0.127,
});
export const DEFAULT_EARTH_STYLE = Object.freeze({
  russiaContour: DEFAULT_CONTOUR_ID,
  dayTint: "#6f9ac0",
  nightTint: "#071a38",
  dayIntensity: 0.68,
  ambientIntensity: 0.14,
  saturation: 0.58,
  textureColorMix: 0,
  textureSaturation: 1,
  surfaceExposure: 0.78,
  surfaceGamma: 1.16,
  surfaceContrast: 1.12,
  oceanColor: "#233a52",
  oceanIntensity: 0.92,
  russiaSurfaceBoost: 0.9,
  outsideSurfaceDim: 0.48,
  russiaMaskFeather: 1.35,
  cityLightsColor: "#ff7a21",
  cityLightsHotColor: "#ffd09a",
  cityLightsIntensity: 1.8,
  cityLightsHotIntensity: 2.4,
  cityLightsGlowIntensity: 0.72,
  cityLightsCoreStart: 0.12,
  cityLightsGlowStart: 0.055,
  cityLightsDayVisibility: 0.08,
  cityLightsBlackPoint: 0.018,
  cityLightsWhitePoint: 0.34,
  cityLightsGamma: 1.1,
  cityLightsHotPoint: 0.58,
  cityLightsLimbStart: 0.035,
  cityLightsLimbEnd: 0.2,
  terminatorSoftness: 0.34,
  specularIntensity: 0.26,
  normalStrength: 0.36,
  cloudHighlights: 0.2,
  cloudColor: "#d8e8f7",
  cloudIntensity: 0.75,
  cloudOpacity: 0.4,
  cloudBlackPoint: 0.16,
  cloudWhitePoint: 0.58,
  cloudAltitude: 0.018,
  cloudShadowIntensity: 0.16,
  hazeColor: "#82c5ee",
  hazeIntensity: 0.08,
  hazePower: 2.2,
  borderColor: "#5c9bfa",
  borderIntensity: 1.15,
  borderCoreIntensity: 2.6,
  borderCoreWidth: 2,
  borderGlowIntensity: 0.78,
  emissiveBloomRadius: 18,
  emissiveBloomStrength: 0.72,
  emissiveBloomQuality: "high",
  atmosphereColor: "#62a9ff",
  atmosphereIntensity: 0.16,
  atmospherePower: 2.05,
  atmosphereInnerFeather: 0.025,
  atmosphereOuterFeather: 0.17,
  atmosphereSunBias: 0.3,
});
export const DEFAULT_CAMERA_VIEW = Object.freeze({
  target: Object.freeze([0, 2.31, 0]),
  rotation: Object.freeze([0, 0, 0]),
  distance: 7.2,
  fov: 38,
});
export const DEFAULT_EARTH_ORBIT = Object.freeze({
  limitsDegrees: Object.freeze({ west: 13, east: 10, north: 12, south: 10 }),
  centerRussia: true,
  verticalCenteringPx: 128,
  endpointSafePaddingPx: 32,
  missionMarkerSafePaddingPx: 50,
});
export const DEFAULT_CAMERA_IDLE_MOTION = Object.freeze({
  delayMs: 10000,
  fadeMs: 1800,
  periodMs: 16000,
  yawDegrees: 0.55,
  pitchDegrees: 0.28,
});

export async function loadUiShellConfig(source = "./config/ui-shell.json", fetchImpl = fetch) {
  const response = await fetchImpl(source, { cache: "no-store" });
  if (!response.ok) throw new Error(`Не удалось загрузить настройки интерфейса: HTTP ${response.status}`);
  return parseUiShellConfig(await response.json());
}

export function parseUiShellConfig(raw) {
  if (!raw || !Number.isInteger(raw.schemaVersion) || raw.schemaVersion < 1 || raw.schemaVersion > CURRENT_UI_SHELL_SCHEMA_VERSION) {
    throw new Error(`ui-shell.json: ожидается schemaVersion от 1 до ${CURRENT_UI_SHELL_SCHEMA_VERSION}`);
  }
  const designViewport = {
    width: positiveNumber(raw.designViewport?.width, "designViewport.width"),
    height: positiveNumber(raw.designViewport?.height, "designViewport.height"),
  };
  const typography = {
    missionTextLayout: enumValue(raw.typography?.missionTextLayout ?? "adaptive", new Set(["adaptive", "left", "justify", "justify-4"]), "typography.missionTextLayout"),
  };
  const rendering = {
    maxDrawingBufferPixels: positiveNumber(raw.rendering?.maxDrawingBufferPixels, "rendering.maxDrawingBufferPixels"),
    earth: normalizeEarthStyle(raw.rendering?.earth),
    nodeIconBackdrop: {
      color: hexColor(raw.rendering?.nodeIconBackdrop?.color ?? DEFAULT_NODE_ICON_BACKDROP.color, "rendering.nodeIconBackdrop.color"),
      opacity: unitNumber(raw.rendering?.nodeIconBackdrop?.opacity ?? DEFAULT_NODE_ICON_BACKDROP.opacity, "rendering.nodeIconBackdrop.opacity"),
      radius: positiveNumber(raw.rendering?.nodeIconBackdrop?.radius ?? DEFAULT_NODE_ICON_BACKDROP.radius, "rendering.nodeIconBackdrop.radius"),
    },
    signalLinks: {
      strandCount: positiveInteger(raw.rendering?.signalLinks?.strandCount, "rendering.signalLinks.strandCount"),
      segmentCount: positiveInteger(raw.rendering?.signalLinks?.segmentCount, "rendering.signalLinks.segmentCount"),
      particleCount: positiveInteger(raw.rendering?.signalLinks?.particleCount, "rendering.signalLinks.particleCount"),
      flowSpeed: positiveNumber(raw.rendering?.signalLinks?.flowSpeed, "rendering.signalLinks.flowSpeed"),
      waveAmplitude: nonNegativeNumber(raw.rendering?.signalLinks?.waveAmplitude, "rendering.signalLinks.waveAmplitude"),
      waveFrequency: positiveNumber(raw.rendering?.signalLinks?.waveFrequency, "rendering.signalLinks.waveFrequency"),
      strandSpacing: nonNegativeNumber(raw.rendering?.signalLinks?.strandSpacing ?? 0.0045, "rendering.signalLinks.strandSpacing"),
    },
  };
  const orbitSource = raw.interaction?.earthOrbit || DEFAULT_EARTH_ORBIT;
  const interaction = {
    earthOrbit: {
      limitsDegrees: Object.fromEntries(["west", "east", "north", "south"].map((direction) => [direction, angleLimit(orbitSource.limitsDegrees?.[direction] ?? DEFAULT_EARTH_ORBIT.limitsDegrees[direction], `interaction.earthOrbit.limitsDegrees.${direction}`)])),
      centerRussia: booleanValue(orbitSource.centerRussia ?? DEFAULT_EARTH_ORBIT.centerRussia, "interaction.earthOrbit.centerRussia"),
      verticalCenteringPx: nonNegativeNumber(orbitSource.verticalCenteringPx ?? DEFAULT_EARTH_ORBIT.verticalCenteringPx, "interaction.earthOrbit.verticalCenteringPx"),
      missionMarkerSafePaddingPx: nonNegativeNumber(orbitSource.missionMarkerSafePaddingPx ?? 50, "interaction.earthOrbit.missionMarkerSafePaddingPx"),
      endpointSafePaddingPx: nonNegativeNumber(orbitSource.endpointSafePaddingPx ?? DEFAULT_EARTH_ORBIT.endpointSafePaddingPx, "interaction.earthOrbit.endpointSafePaddingPx"),
    },
  };
  const geometry = Object.fromEntries(GEOMETRY_FIELDS.map((field) => [field, nonNegativeNumber(raw.geometry?.[field], `geometry.${field}`)]));
  for (const field of ["headerHeight", "headerSideColumn", "footerHeight", "inventoryWidth", "borderWidth"]) {
    if (geometry[field] === 0) throw new Error(`ui-shell.json: geometry.${field} должно быть больше нуля`);
  }
  const motion = {
    ...Object.fromEntries(MOTION_NUMBER_FIELDS.map((field) => [field, nonNegativeNumber(raw.motion?.[field], `motion.${field}`)])),
    cameraIdle: {
      delayMs: nonNegativeNumber(raw.motion?.cameraIdle?.delayMs ?? DEFAULT_CAMERA_IDLE_MOTION.delayMs, "motion.cameraIdle.delayMs"),
      fadeMs: positiveNumber(raw.motion?.cameraIdle?.fadeMs ?? DEFAULT_CAMERA_IDLE_MOTION.fadeMs, "motion.cameraIdle.fadeMs"),
      periodMs: positiveNumber(raw.motion?.cameraIdle?.periodMs ?? DEFAULT_CAMERA_IDLE_MOTION.periodMs, "motion.cameraIdle.periodMs"),
      yawDegrees: rangeNumber(raw.motion?.cameraIdle?.yawDegrees ?? DEFAULT_CAMERA_IDLE_MOTION.yawDegrees, 0, 5, "motion.cameraIdle.yawDegrees"),
      pitchDegrees: rangeNumber(raw.motion?.cameraIdle?.pitchDegrees ?? DEFAULT_CAMERA_IDLE_MOTION.pitchDegrees, 0, 5, "motion.cameraIdle.pitchDegrees"),
    },
    easing: nonEmptyString(raw.motion?.easing, "motion.easing"),
    springEasing: nonEmptyString(raw.motion?.springEasing, "motion.springEasing"),
  };
  const states = {};
  for (const name of REQUIRED_STATES) states[name] = normalizeState(raw.states?.[name], name, raw.schemaVersion);
  return deepFreeze({ schemaVersion: CURRENT_UI_SHELL_SCHEMA_VERSION, designViewport, typography, rendering, interaction, geometry, motion, states });
}

function normalizeEarthStyle(source = {}) {
  const russiaContour = source.russiaContour ?? DEFAULT_CONTOUR_ID;
  if (typeof russiaContour !== "string" || !CONTOUR_ID_PATTERN.test(russiaContour)) throw new Error("Некорректный rendering.earth.russiaContour");
  const legacyBloomRadius = Math.max(
    Number(source.cityLightsGlowRadius) || 0,
    Number(source.borderGlowRadius) || 0,
  );
  const style = {
    russiaContour,
    dayTint: hexColor(source.dayTint ?? DEFAULT_EARTH_STYLE.dayTint, "rendering.earth.dayTint"),
    nightTint: hexColor(source.nightTint ?? DEFAULT_EARTH_STYLE.nightTint, "rendering.earth.nightTint"),
    dayIntensity: rangeNumber(source.dayIntensity ?? DEFAULT_EARTH_STYLE.dayIntensity, 0, 3, "rendering.earth.dayIntensity"),
    ambientIntensity: unitNumber(source.ambientIntensity ?? DEFAULT_EARTH_STYLE.ambientIntensity, "rendering.earth.ambientIntensity"),
    saturation: rangeNumber(source.saturation ?? DEFAULT_EARTH_STYLE.saturation, 0, 2, "rendering.earth.saturation"),
    textureColorMix: unitNumber(source.textureColorMix ?? DEFAULT_EARTH_STYLE.textureColorMix, "rendering.earth.textureColorMix"),
    textureSaturation: rangeNumber(source.textureSaturation ?? DEFAULT_EARTH_STYLE.textureSaturation, 0, 2, "rendering.earth.textureSaturation"),
    surfaceExposure: rangeNumber(source.surfaceExposure ?? DEFAULT_EARTH_STYLE.surfaceExposure, 0, 2, "rendering.earth.surfaceExposure"),
    surfaceGamma: rangeNumber(source.surfaceGamma ?? DEFAULT_EARTH_STYLE.surfaceGamma, 0.5, 3, "rendering.earth.surfaceGamma"),
    surfaceContrast: rangeNumber(source.surfaceContrast ?? DEFAULT_EARTH_STYLE.surfaceContrast, 0.5, 2, "rendering.earth.surfaceContrast"),
    oceanColor: hexColor(source.oceanColor ?? DEFAULT_EARTH_STYLE.oceanColor, "rendering.earth.oceanColor"),
    oceanIntensity: rangeNumber(source.oceanIntensity ?? DEFAULT_EARTH_STYLE.oceanIntensity, 0, 2, "rendering.earth.oceanIntensity"),
    russiaSurfaceBoost: rangeNumber(source.russiaSurfaceBoost ?? DEFAULT_EARTH_STYLE.russiaSurfaceBoost, 0, 2, "rendering.earth.russiaSurfaceBoost"),
    outsideSurfaceDim: unitNumber(source.outsideSurfaceDim ?? DEFAULT_EARTH_STYLE.outsideSurfaceDim, "rendering.earth.outsideSurfaceDim"),
    russiaMaskFeather: rangeNumber(source.russiaMaskFeather ?? DEFAULT_EARTH_STYLE.russiaMaskFeather, 0.25, 4, "rendering.earth.russiaMaskFeather"),
    cityLightsColor: hexColor(source.cityLightsColor ?? DEFAULT_EARTH_STYLE.cityLightsColor, "rendering.earth.cityLightsColor"),
    cityLightsHotColor: hexColor(source.cityLightsHotColor ?? DEFAULT_EARTH_STYLE.cityLightsHotColor, "rendering.earth.cityLightsHotColor"),
    cityLightsIntensity: rangeNumber(source.cityLightsIntensity ?? DEFAULT_EARTH_STYLE.cityLightsIntensity, 0, 4, "rendering.earth.cityLightsIntensity"),
    cityLightsHotIntensity: rangeNumber(source.cityLightsHotIntensity ?? DEFAULT_EARTH_STYLE.cityLightsHotIntensity, 0, 6, "rendering.earth.cityLightsHotIntensity"),
    cityLightsGlowIntensity: rangeNumber(source.cityLightsGlowIntensity ?? DEFAULT_EARTH_STYLE.cityLightsGlowIntensity, 0, 2, "rendering.earth.cityLightsGlowIntensity"),
    cityLightsCoreStart: unitNumber(source.cityLightsCoreStart ?? DEFAULT_EARTH_STYLE.cityLightsCoreStart, "rendering.earth.cityLightsCoreStart"),
    cityLightsGlowStart: unitNumber(source.cityLightsGlowStart ?? DEFAULT_EARTH_STYLE.cityLightsGlowStart, "rendering.earth.cityLightsGlowStart"),
    cityLightsDayVisibility: unitNumber(source.cityLightsDayVisibility ?? DEFAULT_EARTH_STYLE.cityLightsDayVisibility, "rendering.earth.cityLightsDayVisibility"),
    cityLightsBlackPoint: unitNumber(source.cityLightsBlackPoint ?? DEFAULT_EARTH_STYLE.cityLightsBlackPoint, "rendering.earth.cityLightsBlackPoint"),
    cityLightsWhitePoint: unitNumber(source.cityLightsWhitePoint ?? DEFAULT_EARTH_STYLE.cityLightsWhitePoint, "rendering.earth.cityLightsWhitePoint"),
    cityLightsGamma: rangeNumber(source.cityLightsGamma ?? DEFAULT_EARTH_STYLE.cityLightsGamma, 0.1, 4, "rendering.earth.cityLightsGamma"),
    cityLightsHotPoint: unitNumber(source.cityLightsHotPoint ?? DEFAULT_EARTH_STYLE.cityLightsHotPoint, "rendering.earth.cityLightsHotPoint"),
    cityLightsLimbStart: unitNumber(source.cityLightsLimbStart ?? DEFAULT_EARTH_STYLE.cityLightsLimbStart, "rendering.earth.cityLightsLimbStart"),
    cityLightsLimbEnd: unitNumber(source.cityLightsLimbEnd ?? DEFAULT_EARTH_STYLE.cityLightsLimbEnd, "rendering.earth.cityLightsLimbEnd"),
    terminatorSoftness: rangeNumber(source.terminatorSoftness ?? DEFAULT_EARTH_STYLE.terminatorSoftness, 0.01, 1, "rendering.earth.terminatorSoftness"),
    specularIntensity: rangeNumber(source.specularIntensity ?? DEFAULT_EARTH_STYLE.specularIntensity, 0, 2, "rendering.earth.specularIntensity"),
    normalStrength: rangeNumber(source.normalStrength ?? DEFAULT_EARTH_STYLE.normalStrength, 0, 2, "rendering.earth.normalStrength"),
    cloudHighlights: rangeNumber(source.cloudHighlights ?? DEFAULT_EARTH_STYLE.cloudHighlights, 0, 2, "rendering.earth.cloudHighlights"),
    cloudColor: hexColor(source.cloudColor ?? DEFAULT_EARTH_STYLE.cloudColor, "rendering.earth.cloudColor"),
    cloudIntensity: rangeNumber(source.cloudIntensity ?? DEFAULT_EARTH_STYLE.cloudIntensity, 0, 2, "rendering.earth.cloudIntensity"),
    cloudOpacity: unitNumber(source.cloudOpacity ?? DEFAULT_EARTH_STYLE.cloudOpacity, "rendering.earth.cloudOpacity"),
    cloudBlackPoint: unitNumber(source.cloudBlackPoint ?? DEFAULT_EARTH_STYLE.cloudBlackPoint, "rendering.earth.cloudBlackPoint"),
    cloudWhitePoint: unitNumber(source.cloudWhitePoint ?? DEFAULT_EARTH_STYLE.cloudWhitePoint, "rendering.earth.cloudWhitePoint"),
    cloudAltitude: rangeNumber(source.cloudAltitude ?? DEFAULT_EARTH_STYLE.cloudAltitude, 0.003, 0.08, "rendering.earth.cloudAltitude"),
    cloudShadowIntensity: unitNumber(source.cloudShadowIntensity ?? DEFAULT_EARTH_STYLE.cloudShadowIntensity, "rendering.earth.cloudShadowIntensity"),
    hazeColor: hexColor(source.hazeColor ?? DEFAULT_EARTH_STYLE.hazeColor, "rendering.earth.hazeColor"),
    hazeIntensity: unitNumber(source.hazeIntensity ?? DEFAULT_EARTH_STYLE.hazeIntensity, "rendering.earth.hazeIntensity"),
    hazePower: rangeNumber(source.hazePower ?? DEFAULT_EARTH_STYLE.hazePower, 0.5, 8, "rendering.earth.hazePower"),
    borderColor: hexColor(source.borderColor ?? DEFAULT_EARTH_STYLE.borderColor, "rendering.earth.borderColor"),
    borderIntensity: rangeNumber(source.borderIntensity ?? DEFAULT_EARTH_STYLE.borderIntensity, 0, 2, "rendering.earth.borderIntensity"),
    borderCoreIntensity: rangeNumber(source.borderCoreIntensity ?? DEFAULT_EARTH_STYLE.borderCoreIntensity, 0, 6, "rendering.earth.borderCoreIntensity"),
    borderCoreWidth: rangeNumber(source.borderCoreWidth ?? DEFAULT_EARTH_STYLE.borderCoreWidth, 0.5, 6, "rendering.earth.borderCoreWidth"),
    borderGlowIntensity: rangeNumber(source.borderGlowIntensity ?? DEFAULT_EARTH_STYLE.borderGlowIntensity, 0, 2, "rendering.earth.borderGlowIntensity"),
    emissiveBloomRadius: rangeNumber(source.emissiveBloomRadius ?? (legacyBloomRadius || DEFAULT_EARTH_STYLE.emissiveBloomRadius), 0, 64, "rendering.earth.emissiveBloomRadius"),
    emissiveBloomStrength: rangeNumber(source.emissiveBloomStrength ?? DEFAULT_EARTH_STYLE.emissiveBloomStrength, 0, 2, "rendering.earth.emissiveBloomStrength"),
    emissiveBloomQuality: enumValue(source.emissiveBloomQuality ?? DEFAULT_EARTH_STYLE.emissiveBloomQuality, new Set(["high", "medium", "off"]), "rendering.earth.emissiveBloomQuality"),
    atmosphereColor: hexColor(source.atmosphereColor ?? DEFAULT_EARTH_STYLE.atmosphereColor, "rendering.earth.atmosphereColor"),
    atmosphereIntensity: rangeNumber(source.atmosphereIntensity ?? DEFAULT_EARTH_STYLE.atmosphereIntensity, 0, 2, "rendering.earth.atmosphereIntensity"),
    atmospherePower: rangeNumber(source.atmospherePower ?? DEFAULT_EARTH_STYLE.atmospherePower, 0.5, 8, "rendering.earth.atmospherePower"),
    atmosphereInnerFeather: rangeNumber(source.atmosphereInnerFeather ?? DEFAULT_EARTH_STYLE.atmosphereInnerFeather, 0.001, 0.25, "rendering.earth.atmosphereInnerFeather"),
    atmosphereOuterFeather: rangeNumber(source.atmosphereOuterFeather ?? DEFAULT_EARTH_STYLE.atmosphereOuterFeather, 0.01, 0.5, "rendering.earth.atmosphereOuterFeather"),
    atmosphereSunBias: unitNumber(source.atmosphereSunBias ?? DEFAULT_EARTH_STYLE.atmosphereSunBias, "rendering.earth.atmosphereSunBias"),
  };
  if (style.cityLightsBlackPoint >= style.cityLightsWhitePoint) {
    throw new Error("ui-shell.json: rendering.earth.cityLightsBlackPoint должно быть меньше cityLightsWhitePoint");
  }
  if (style.cloudBlackPoint >= style.cloudWhitePoint) {
    throw new Error("ui-shell.json: rendering.earth.cloudBlackPoint должно быть меньше cloudWhitePoint");
  }
  if (style.cityLightsLimbStart >= style.cityLightsLimbEnd) {
    throw new Error("ui-shell.json: rendering.earth.cityLightsLimbStart должно быть меньше cityLightsLimbEnd");
  }
  if (style.cityLightsCoreStart > style.cityLightsHotPoint) {
    throw new Error("ui-shell.json: rendering.earth.cityLightsCoreStart должно быть не больше cityLightsHotPoint");
  }
  if (style.atmosphereInnerFeather >= style.atmosphereOuterFeather) {
    throw new Error("ui-shell.json: rendering.earth.atmosphereInnerFeather должно быть меньше atmosphereOuterFeather");
  }
  return style;
}

export function repairEarthStyleRelations(source = {}, changedField = "") {
  const style = { ...source };
  const strictPairs = [
    ["cityLightsBlackPoint", "cityLightsWhitePoint", 0.001, 0, 1],
    ["cloudBlackPoint", "cloudWhitePoint", 0.001, 0, 1],
    ["cityLightsLimbStart", "cityLightsLimbEnd", 0.005, 0, 1],
    ["atmosphereInnerFeather", "atmosphereOuterFeather", 0.001, 0.001, 0.5],
  ];
  for (const [lowerKey, upperKey, gap, minimum, maximum] of strictPairs) {
    let lower = Number(style[lowerKey]);
    let upper = Number(style[upperKey]);
    if (!Number.isFinite(lower) || !Number.isFinite(upper) || lower < upper) continue;
    if (changedField === upperKey) lower = Math.max(minimum, upper - gap);
    else upper = Math.min(maximum, lower + gap);
    if (lower >= upper) {
      const expandedUpper = Math.min(maximum, lower + gap);
      if (expandedUpper > lower) upper = expandedUpper;
      else lower = Math.max(minimum, upper - gap);
    }
    style[lowerKey] = relationNumber(lower);
    style[upperKey] = relationNumber(upper);
  }
  const core = Number(style.cityLightsCoreStart);
  const hot = Number(style.cityLightsHotPoint);
  if (Number.isFinite(core) && Number.isFinite(hot) && core > hot) {
    if (changedField === "cityLightsHotPoint") style.cityLightsCoreStart = hot;
    else style.cityLightsHotPoint = core;
  }
  return style;
}

function relationNumber(value) { return Math.round(value * 1_000_000) / 1_000_000; }

export function resolveUiShellState(config, name) {
  const state = config.states[name];
  if (!state) throw new Error(`ui-shell.json: неизвестное состояние ${name}`);
  const frameBottom = state.frameAvoidsFooter && state.footer
    ? config.geometry.footerBottom + config.geometry.footerHeight + config.geometry.frameGap
    : state.frameBottom;
  return { ...state, frameBottom };
}

export function resolveEarthFrameOffset(config, name) {
  const state = resolveUiShellState(config, name);
  if (state.earthMask === "full") return { x: 0, y: 0 };
  return {
    x: (config.geometry.outerInset - state.frameRight) / 2,
    y: (config.geometry.headerHeight + config.geometry.frameGap - state.frameBottom) / 2,
  };
}

function normalizeState(source, name, schemaVersion) {
  if (!source) throw new Error(`ui-shell.json: отсутствует states.${name}`);
  const state = {};
  for (const field of ["header", "frame", "footer", "inventory", "frameAvoidsFooter"]) {
    if (typeof source[field] !== "boolean") throw new Error(`ui-shell.json: states.${name}.${field} должно быть boolean`);
    state[field] = source[field];
  }
  if (!FOOTER_STYLES.has(source.footerStyle)) throw new Error(`ui-shell.json: states.${name}.footerStyle имеет неизвестное значение`);
  state.footerStyle = source.footerStyle;
  if (!EARTH_MASKS.has(source.earthMask)) throw new Error(`ui-shell.json: states.${name}.earthMask имеет неизвестное значение`);
  state.earthMask = source.earthMask;
  for (const field of STATE_NUMBER_FIELDS) state[field] = nonNegativeNumber(source[field], `states.${name}.${field}`);
  state.backgroundDim = nonNegativeNumber(source.backgroundDim, `states.${name}.backgroundDim`);
  if (state.backgroundDim > 1) throw new Error(`ui-shell.json: states.${name}.backgroundDim должно быть в диапазоне 0–1`);
  state.cameraView = normalizeCameraView(source.cameraView, `states.${name}.cameraView`, schemaVersion);
  return state;
}

function normalizeCameraView(source, context, schemaVersion) {
  if (schemaVersion < 2) return structuredClone(DEFAULT_CAMERA_VIEW);
  const target = vector3(source?.target, `${context}.target`);
  if (schemaVersion >= 3) {
    return {
      target,
      rotation: vector3(source?.rotation, `${context}.rotation`),
      distance: positiveNumber(source?.distance, `${context}.distance`),
      fov: schemaVersion >= 4 ? cameraFov(source?.fov, `${context}.fov`) : DEFAULT_CAMERA_VIEW.fov,
    };
  }
  const camera = vector3(source?.camera, `${context}.camera`);
  const offset = camera.map((value, index) => value - target[index]);
  const distance = Math.hypot(...offset);
  if (distance < 0.1) throw new Error(`ui-shell.json: ${context}.camera должен находиться отдельно от target`);
  return {
    target,
    rotation: [Math.acos(Math.min(1, Math.max(-1, offset[1] / distance))) - Math.PI / 2, Math.atan2(offset[0], offset[2]), 0],
    distance,
    fov: DEFAULT_CAMERA_VIEW.fov,
  };
}

function cameraFov(value, context) {
  const number = positiveNumber(value, context);
  if (number < 15 || number > 100) throw new Error(`ui-shell.json: ${context} должно быть в диапазоне 15–100`);
  return number;
}

function angleLimit(value, context) {
  const number = nonNegativeNumber(value, context);
  if (number > 180) throw new Error(`ui-shell.json: ${context} должно быть в диапазоне 0–180`);
  return number;
}

function booleanValue(value, context) {
  if (typeof value !== "boolean") throw new Error(`ui-shell.json: ${context} должно быть boolean`);
  return value;
}

function vector3(value, context) {
  if (!Array.isArray(value) || value.length !== 3) throw new Error(`ui-shell.json: ${context} должен содержать три числа`);
  return value.map((entry, index) => finiteNumber(entry, `${context}[${index}]`));
}

function finiteNumber(value, context) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`ui-shell.json: ${context} должно быть числом`);
  return number;
}

function positiveNumber(value, context) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`ui-shell.json: ${context} должно быть положительным числом`);
  return number;
}

function positiveInteger(value, context) {
  const number = positiveNumber(value, context);
  if (!Number.isInteger(number)) throw new Error(`ui-shell.json: ${context} должно быть целым числом`);
  return number;
}

function nonNegativeNumber(value, context) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`ui-shell.json: ${context} должно быть неотрицательным числом`);
  return number;
}

function nonEmptyString(value, context) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`ui-shell.json: ${context} должно быть непустой строкой`);
  return value.trim();
}

function enumValue(value, allowed, context) {
  const normalized = nonEmptyString(value, context);
  if (!allowed.has(normalized)) throw new Error(`ui-shell.json: ${context} имеет неподдерживаемое значение ${normalized}`);
  return normalized;
}

function hexColor(value, context) {
  const color = nonEmptyString(value, context);
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`ui-shell.json: ${context} должен быть цветом #RRGGBB`);
  return color;
}

function unitNumber(value, context) {
  const number = nonNegativeNumber(value, context);
  if (number > 1) throw new Error(`ui-shell.json: ${context} должно быть в диапазоне 0–1`);
  return number;
}

function rangeNumber(value, minimum, maximum, context) {
  const number = finiteNumber(value, context);
  if (number < minimum || number > maximum) throw new Error(`ui-shell.json: ${context} должно быть в диапазоне ${minimum}–${maximum}`);
  return number;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}


export function resolveEndpointSafeArea(config, screen) {
  if (screen !== "MISSION_PLAY") return null;
  const state = resolveUiShellState(config, screen);
  const height = config.designViewport.height;
  const frameHeight = height - state.frameBottom - config.geometry.headerHeight - config.geometry.frameGap;
  const padding = Math.min(config.interaction.earthOrbit.endpointSafePaddingPx ?? 32, Math.max(0, (frameHeight - 1) / 2));
  return {
    top: (config.geometry.headerHeight + config.geometry.frameGap + padding) / height,
    bottom: (height - state.frameBottom - padding) / height,
  };
}
