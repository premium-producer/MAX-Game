import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveMissionEarthOrbit, DEFAULT_CAMERA_IDLE_MOTION, DEFAULT_EARTH_ORBIT, DEFAULT_EARTH_STYLE, parseUiShellConfig, repairEarthStyleRelations, resolveEarthFrameOffset, resolveUiShellState } from "../src/ui-shell-config.mjs";

const raw = JSON.parse(await readFile(new URL("../public/config/ui-shell.json", import.meta.url), "utf8"));

test("project UI shell JSON defines all five states and shared geometry", () => {
  const config = parseUiShellConfig(raw);
  assert.equal(config.schemaVersion, 8);
  assert.deepEqual(Object.keys(config.states), ["CTA", "ONBOARDING", "MISSION_SELECT", "MISSION_PLAY", "END"]);
  assert.equal(config.geometry.outerInset, 24);
  assert.equal(config.rendering.maxDrawingBufferPixels, 3840 * 2160);
  assert.deepEqual(config.rendering.earth, raw.rendering.earth);
  assert.deepEqual(config.rendering.nodeIconBackdrop, { color: "#07111f", opacity: 0.9, radius: 0.127 });
  assert.deepEqual(config.rendering.signalLinks, {
    strandCount: 5,
    segmentCount: 80,
    particleCount: 32,
    flowSpeed: 0.19,
    waveAmplitude: 0.009,
    waveFrequency: 3.25,
    strandSpacing: 0.0045,
  });
  assert.deepEqual(config.interaction.earthOrbit, { endpointSafePaddingPx: 32, ...raw.interaction.earthOrbit }, "Парсер должен сохранять настроенные пользователем лимиты вращения");
  assert.equal(config.motion.layoutDurationMs, 660);
  assert.equal(config.motion.fadeDurationMs, 450);
  assert.equal(config.motion.screenDurationMs, 840);
  assert.equal(config.motion.screenExitDurationMs, 480);
  assert.equal(config.motion.contentStaggerMs, 84);
  assert.equal(config.motion.microDurationMs, 220);
  assert.deepEqual(config.motion.cameraIdle, { delayMs: 10000, fadeMs: 1800, periodMs: 16000, yawDegrees: 0.55, pitchDegrees: 0.28 });
  assert.match(config.motion.springEasing, /^cubic-bezier/);
  assert.equal(config.states.CTA.header, false);
  assert.equal(config.states.CTA.earthMask, "full");
  assert.equal(config.states.ONBOARDING.footerStyle, "panel");
  assert.equal(config.states.ONBOARDING.earthMask, "frame");
  assert.equal(config.states.ONBOARDING.backgroundBlur, 12);
  assert.equal(config.states.MISSION_SELECT.footer, false);
  assert.equal(resolveUiShellState(config, "MISSION_SELECT").frameBottom, 24);
  assert.equal(config.states.MISSION_PLAY.inventory, true);
  assert.equal(config.states.MISSION_PLAY.frameRight, 268);
  assert.equal(config.states.END.backgroundBlur, 12);
  assert.equal(config.states.END.earthMask, "frame");
  for (const [name, state] of Object.entries(config.states)) {
    assert.deepEqual(state.cameraView, raw.states[name].cameraView, "Парсер должен сохранять ракурс, настроенный в редакторе");
  }
  const onboarding = resolveUiShellState(config, "ONBOARDING");
  assert.equal(onboarding.footer, false);
  assert.equal(onboarding.frameBottom, 24);
  assert.deepEqual(resolveEarthFrameOffset(config, "CTA"), { x: 0, y: 0 });
  assert.deepEqual(resolveEarthFrameOffset(config, "MISSION_SELECT"), { x: 0, y: 44 });
  assert.deepEqual(resolveEarthFrameOffset(config, "MISSION_PLAY"), { x: -122, y: -16 });
});

test("mission text layout preserves old configs and validates the optional alternative", () => {
  const legacy = structuredClone(raw);
  delete legacy.typography;
  assert.equal(parseUiShellConfig(legacy).typography.missionTextLayout, "adaptive");
  for (const missionTextLayout of ["adaptive", "left", "justify", "justify-4"]) {
    const config = parseUiShellConfig({ ...legacy, typography: { missionTextLayout } });
    assert.equal(parseUiShellConfig(JSON.parse(JSON.stringify(config))).typography.missionTextLayout, missionTextLayout);
  }
  assert.throws(() => parseUiShellConfig({ ...legacy, typography: { missionTextLayout: "center" } }), /typography\.missionTextLayout/);
});

test("UI shell parser rejects missing states and invalid geometry", () => {
  const missing = structuredClone(raw);
  delete missing.states.END;
  assert.throws(() => parseUiShellConfig(missing), /states\.END/);
  const invalid = structuredClone(raw);
  invalid.geometry.outerInset = -1;
  assert.throws(() => parseUiShellConfig(invalid), /outerInset/);
  const invalidMask = structuredClone(raw);
  invalidMask.states.MISSION_PLAY.earthMask = "viewport";
  assert.throws(() => parseUiShellConfig(invalidMask), /earthMask/);
  const invalidMotion = structuredClone(raw);
  invalidMotion.motion.microDurationMs = -1;
  assert.throws(() => parseUiShellConfig(invalidMotion), /microDurationMs/);
  const invalidIdleMotion = structuredClone(raw);
  invalidIdleMotion.motion.cameraIdle.yawDegrees = 5.1;
  assert.throws(() => parseUiShellConfig(invalidIdleMotion), /cameraIdle\.yawDegrees/);
  const invalidRenderBudget = structuredClone(raw);
  invalidRenderBudget.rendering.maxDrawingBufferPixels = 0;
  assert.throws(() => parseUiShellConfig(invalidRenderBudget), /maxDrawingBufferPixels/);
  const invalidStrands = structuredClone(raw);
  invalidStrands.rendering.signalLinks.strandCount = 2.5;
  assert.throws(() => parseUiShellConfig(invalidStrands), /strandCount/);
  const invalidBackdrop = structuredClone(raw);
  invalidBackdrop.rendering.nodeIconBackdrop.opacity = 1.2;
  assert.throws(() => parseUiShellConfig(invalidBackdrop), /nodeIconBackdrop\.opacity/);
  const invalidEarthStyle = structuredClone(raw);
  invalidEarthStyle.rendering.earth.terminatorSoftness = 0;
  assert.throws(() => parseUiShellConfig(invalidEarthStyle), /earth\.terminatorSoftness/);
  const invalidHaze = structuredClone(raw);
  invalidHaze.rendering.earth.hazeIntensity = 1.2;
  assert.throws(() => parseUiShellConfig(invalidHaze), /earth\.hazeIntensity/);
  const invalidRussiaBoost = structuredClone(raw);
  invalidRussiaBoost.rendering.earth.russiaSurfaceBoost = 2.1;
  assert.throws(() => parseUiShellConfig(invalidRussiaBoost), /earth\.russiaSurfaceBoost/);
  const invalidOutsideDim = structuredClone(raw);
  invalidOutsideDim.rendering.earth.outsideSurfaceDim = 1.1;
  assert.throws(() => parseUiShellConfig(invalidOutsideDim), /earth\.outsideSurfaceDim/);
  const invalidRussiaFeather = structuredClone(raw);
  invalidRussiaFeather.rendering.earth.russiaMaskFeather = 0.2;
  assert.throws(() => parseUiShellConfig(invalidRussiaFeather), /earth\.russiaMaskFeather/);
  const invalidOceanIntensity = structuredClone(raw);
  invalidOceanIntensity.rendering.earth.oceanIntensity = 2.1;
  assert.throws(() => parseUiShellConfig(invalidOceanIntensity), /earth\.oceanIntensity/);
  const invalidCloudOpacity = structuredClone(raw);
  invalidCloudOpacity.rendering.earth.cloudOpacity = 1.1;
  assert.throws(() => parseUiShellConfig(invalidCloudOpacity), /earth\.cloudOpacity/);
  const invalidCloudAltitude = structuredClone(raw);
  invalidCloudAltitude.rendering.earth.cloudAltitude = 0.1;
  assert.throws(() => parseUiShellConfig(invalidCloudAltitude), /earth\.cloudAltitude/);
  const invalidCloudThresholds = structuredClone(raw);
  invalidCloudThresholds.rendering.earth.cloudBlackPoint = invalidCloudThresholds.rendering.earth.cloudWhitePoint;
  assert.throws(() => parseUiShellConfig(invalidCloudThresholds), /cloudBlackPoint.*меньше cloudWhitePoint/);
  const invalidCityGlow = structuredClone(raw);
  invalidCityGlow.rendering.earth.cityLightsGlowIntensity = 2.1;
  assert.throws(() => parseUiShellConfig(invalidCityGlow), /earth\.cityLightsGlowIntensity/);
  const invalidCityThresholds = structuredClone(raw);
  invalidCityThresholds.rendering.earth.cityLightsBlackPoint = invalidCityThresholds.rendering.earth.cityLightsWhitePoint;
  assert.throws(() => parseUiShellConfig(invalidCityThresholds), /cityLightsBlackPoint.*меньше cityLightsWhitePoint/);
  const invalidCityLimb = structuredClone(raw);
  invalidCityLimb.rendering.earth.cityLightsLimbStart = invalidCityLimb.rendering.earth.cityLightsLimbEnd;
  assert.throws(() => parseUiShellConfig(invalidCityLimb), /cityLightsLimbStart.*меньше cityLightsLimbEnd/);
  const invalidNormalStrength = structuredClone(raw);
  invalidNormalStrength.rendering.earth.normalStrength = 2.1;
  assert.throws(() => parseUiShellConfig(invalidNormalStrength), /earth\.normalStrength/);
  const invalidBloomRadius = structuredClone(raw);
  invalidBloomRadius.rendering.earth.emissiveBloomRadius = 65;
  assert.throws(() => parseUiShellConfig(invalidBloomRadius), /earth\.emissiveBloomRadius/);
  const invalidBloomQuality = structuredClone(raw);
  invalidBloomQuality.rendering.earth.emissiveBloomQuality = "ultra";
  assert.throws(() => parseUiShellConfig(invalidBloomQuality), /earth\.emissiveBloomQuality/);
  const invalidCamera = structuredClone(raw);
  invalidCamera.states.CTA.cameraView.rotation = [0, 0];
  assert.throws(() => parseUiShellConfig(invalidCamera), /cameraView\.rotation/);
  const invalidDistance = structuredClone(raw);
  invalidDistance.states.CTA.cameraView.distance = 0;
  assert.throws(() => parseUiShellConfig(invalidDistance), /cameraView\.distance/);
  const invalidFov = structuredClone(raw);
  invalidFov.states.CTA.cameraView.fov = 120;
  assert.throws(() => parseUiShellConfig(invalidFov), /cameraView\.fov/);
  const invalidOrbit = structuredClone(raw);
  invalidOrbit.interaction.earthOrbit.limitsDegrees.west = 181;
  assert.throws(() => parseUiShellConfig(invalidOrbit), /limitsDegrees\.west/);
  const invalidCentering = structuredClone(raw);
  invalidCentering.interaction.earthOrbit.centerRussia = "yes";
  assert.throws(() => parseUiShellConfig(invalidCentering), /centerRussia/);
});

test("UI shell version 1 migrates to a default camera view", () => {
  const legacy = structuredClone(raw);
  legacy.schemaVersion = 1;
  delete legacy.rendering.nodeIconBackdrop;
  delete legacy.rendering.earth;
  for (const state of Object.values(legacy.states)) delete state.cameraView;
  const migrated = parseUiShellConfig(legacy);
  assert.equal(migrated.schemaVersion, 8);
  assert.deepEqual(migrated.rendering.nodeIconBackdrop, { color: "#07111f", opacity: 0.9, radius: 0.127 });
  assert.deepEqual(migrated.rendering.earth, structuredClone(DEFAULT_EARTH_STYLE));
  assert.deepEqual(migrated.states.MISSION_PLAY.cameraView, { target: [0, 2.31, 0], rotation: [0, 0, 0], distance: 7.2, fov: 38 });
});

test("UI shell without idle camera settings migrates to the gentle default", () => {
  const legacy = structuredClone(raw);
  delete legacy.motion.cameraIdle;
  assert.deepEqual(parseUiShellConfig(legacy).motion.cameraIdle, structuredClone(DEFAULT_CAMERA_IDLE_MOTION));
});

test("UI shell version 2 camera position migrates to three-axis rotation and distance", () => {
  const legacy = structuredClone(raw);
  legacy.schemaVersion = 2;
  for (const state of Object.values(legacy.states)) state.cameraView = { camera: [0, 2.31, 7.2], target: [0, 2.31, 0] };
  const migrated = parseUiShellConfig(legacy);
  assert.equal(migrated.schemaVersion, 8);
  assert.deepEqual(migrated.states.CTA.cameraView, { target: [0, 2.31, 0], rotation: [0, 0, 0], distance: 7.2, fov: 38 });
});

test("UI shell version 3 camera view migrates to the default FOV", () => {
  const legacy = structuredClone(raw);
  legacy.schemaVersion = 3;
  for (const state of Object.values(legacy.states)) delete state.cameraView.fov;
  const migrated = parseUiShellConfig(legacy);
  assert.equal(migrated.schemaVersion, 8);
  assert.equal(migrated.states.END.cameraView.fov, 38);
});

test("UI shell version 4 migrates hardcoded orbit limits and Russia centering", () => {
  const legacy = structuredClone(raw);
  legacy.schemaVersion = 4;
  delete legacy.interaction;
  const migrated = parseUiShellConfig(legacy);
  assert.equal(migrated.schemaVersion, 8);
  assert.deepEqual(migrated.interaction.earthOrbit, structuredClone(DEFAULT_EARTH_ORBIT));
});

test("UI shell version 5 migrates realtime city-light controls", () => {
  const legacy = structuredClone(raw);
  legacy.schemaVersion = 5;
  for (const field of [
    "cityLightsHotColor",
    "cityLightsCoreStart",
    "cityLightsGlowStart",
    "cityLightsBlackPoint",
    "cityLightsWhitePoint",
    "cityLightsGamma",
    "cityLightsHotPoint",
    "cityLightsLimbStart",
    "cityLightsLimbEnd",
  ]) delete legacy.rendering.earth[field];
  const migrated = parseUiShellConfig(legacy);
  assert.equal(migrated.schemaVersion, 8);
  for (const field of [
    "cityLightsHotColor",
    "cityLightsCoreStart",
    "cityLightsGlowStart",
    "cityLightsBlackPoint",
    "cityLightsWhitePoint",
    "cityLightsGamma",
    "cityLightsHotPoint",
    "cityLightsLimbStart",
    "cityLightsLimbEnd",
  ]) assert.equal(migrated.rendering.earth[field], DEFAULT_EARTH_STYLE[field]);
});

test("UI shell version 6 merges both legacy glow radii into one realtime bloom", () => {
  const legacy = structuredClone(raw);
  legacy.schemaVersion = 6;
  delete legacy.rendering.earth.emissiveBloomRadius;
  delete legacy.rendering.earth.emissiveBloomStrength;
  delete legacy.rendering.earth.emissiveBloomQuality;
  legacy.rendering.earth.cityLightsGlowRadius = 18;
  legacy.rendering.earth.borderGlowRadius = 22;
  const migrated = parseUiShellConfig(legacy);
  assert.equal(migrated.schemaVersion, 8);
  assert.equal(migrated.rendering.earth.emissiveBloomRadius, 22);
  assert.equal(migrated.rendering.earth.emissiveBloomStrength, DEFAULT_EARTH_STYLE.emissiveBloomStrength);
  assert.equal(migrated.rendering.earth.emissiveBloomQuality, "high");
  assert.equal("cityLightsGlowRadius" in migrated.rendering.earth, false);
  assert.equal("borderGlowRadius" in migrated.rendering.earth, false);
});

test("UI shell version 7 gains controllable original diffuse color", () => {
  const legacy = structuredClone(raw);
  legacy.schemaVersion = 7;
  delete legacy.rendering.earth.textureColorMix;
  delete legacy.rendering.earth.textureSaturation;
  const migrated = parseUiShellConfig(legacy);
  assert.equal(migrated.schemaVersion, 8);
  assert.equal(migrated.rendering.earth.textureColorMix, 0);
  assert.equal(migrated.rendering.earth.textureSaturation, 1);
});

test("earth editor repairs dependent thresholds in the direction the artist changed", () => {
  const source = structuredClone(raw.rendering.earth);
  source.cityLightsCoreStart = 0.8;
  source.cityLightsHotPoint = 0.2;
  assert.equal(repairEarthStyleRelations(source, "cityLightsCoreStart").cityLightsHotPoint, 0.8);
  assert.equal(repairEarthStyleRelations(source, "cityLightsHotPoint").cityLightsCoreStart, 0.2);
  source.cloudBlackPoint = 0.8;
  source.cloudWhitePoint = 0.4;
  const lowerChanged = repairEarthStyleRelations(source, "cloudBlackPoint");
  assert.equal(lowerChanged.cloudWhitePoint, 0.801);
  const upperChanged = repairEarthStyleRelations(source, "cloudWhitePoint");
  assert.equal(upperChanged.cloudBlackPoint, 0.399);
  const atMinimum = repairEarthStyleRelations({ ...source, cloudBlackPoint: 0.4, cloudWhitePoint: 0 }, "cloudWhitePoint");
  assert.equal(atMinimum.cloudBlackPoint, 0);
  assert.equal(atMinimum.cloudWhitePoint, 0.001);
  assert.doesNotThrow(() => parseUiShellConfig({ ...raw, rendering: { ...raw.rendering, earth: lowerChanged } }));
});


test("additional orbital headroom is enabled only in mission two in both player and editor", () => {
  const source = { centerRussia: true, verticalCenteringPx: 140, limitsDegrees: { north: 12, south: 12 } };
  for (const screen of ["CTA", "ONBOARDING", "MISSION_SELECT", "MISSION_PLAY", "END"]) {
    for (const mission of [1, 2, 3]) {
      const result = resolveMissionEarthOrbit(source, screen, mission);
      assert.equal(result.centerRussia, screen === "MISSION_PLAY" && mission === 2);
      assert.equal(result.verticalCenteringPx, 140);
      assert.deepEqual(result.limitsDegrees, source.limitsDegrees);
    }
  }
  assert.equal(resolveMissionEarthOrbit({ ...source, centerRussia: false }, "MISSION_PLAY", 2).centerRussia, false);
  assert.equal(source.centerRussia, true);
});
