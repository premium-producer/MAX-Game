import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../editor.html", import.meta.url), "utf8");
const editor = await readFile(new URL("../src/editor-main.js", import.meta.url), "utf8");
const earthHtml = await readFile(new URL("../earth.html", import.meta.url), "utf8");
const earthEditor = await readFile(new URL("../src/earth-editor-main.js", import.meta.url), "utf8");
const earthStyles = await readFile(new URL("../src/earth-editor.css", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/editor.css", import.meta.url), "utf8");
const runtime = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const field = await readFile(new URL("../src/webgl-field.js", import.meta.url), "utf8");
const server = await readFile(new URL("../server.mjs", import.meta.url), "utf8");
const editorLauncher = await readFile(new URL("../START-EDITOR-WINDOWS.bat", import.meta.url), "utf8");
const gameLauncher = await readFile(new URL("../START-WINDOWS.bat", import.meta.url), "utf8");

test("mission editor exposes the catalog, globe tools, inspector and route builder", () => {
  for (const id of ["mission-list", "preview-host", "preview-stage", "preview-shell", "editor-world", "inspector", "route-palette", "route-sequence", "camera-state"]) {
    assert.equal(html.match(new RegExp(`id=["']${id}["']`, "g"))?.length, 1);
  }
  for (const tool of ["navigate", "mission"]) assert.match(html, new RegExp(`data-map-tool=["']${tool}["']`));
  assert.match(html, /data-point-group="start"[^>]*>СТАРТОВЫЕ ТОЧКИ/);
  assert.match(html, /data-point-group="finish"[^>]*>ЗАВЕРШАЮЩИЕ ТОЧКИ/);
  assert.match(html, /id="point-group-menu"/);
  assert.doesNotMatch(html, />ТОЧКА [AАБB]</);
  assert.match(editor, /addPointFromBank/);
  assert.match(editor, /pointIdsForRole/);
  assert.match(editor, /ДОБАВИТЬ ИЗ БАНКА ИКОНОК/);
  assert.match(editor, /data-delete-point/);
  assert.match(editor, /routeCounts\(mission\.route\)/);
  assert.match(editor, /mission\.endpoints\[activeMapTool\]/);
  assert.match(html, /data-action="save-project"/);
  assert.match(editor, /assertWritableEditorServer/);
  assert.match(editor, /editorApiBase = await writableProjectBase\(\)/);
  assert.match(editor, /loadEditorProject\(editorApiBase\)/);
  assert.match(editor, /editorApiUrl\("\/api\/editor\/save"\)/);
  assert.match(editor, /async function saveProject\(\)[\s\S]*?storeCurrentCameraView\(false\)[\s\S]*?fetch\(editorApiUrl/);
  assert.match(editor, /notifyRunningGame\(result\.backupId\)/);
  assert.match(editor, /publishProjectChange/);
  assert.doesNotMatch(html, /save-as|save-shell|file-input/);
  assert.doesNotMatch(editor, /downloadJson|saveJsonWithPicker/);
  assert.match(editor, /saveDraft/);
  assert.match(editor, /renderMissionIssues/);
  assert.doesNotMatch(editor, /field\("Надзаголовок"|textarea\("Текст"/);
  assert.match(styles, /mission-list-copy/);
  for (const axis of ["0", "1", "2"]) assert.match(html, new RegExp(`data-camera-axis=["']${axis}["']`));
  for (const axis of ["0", "1", "2"]) assert.match(html, new RegExp(`data-camera-target=["']${axis}["']`));
  assert.match(html, /id="camera-fov"/);
  for (const direction of ["west", "east", "north", "south"]) assert.match(html, new RegExp(`data-earth-limit=["']${direction}["']`));
  assert.match(html, /id="earth-center-russia"/);
  assert.match(html, /id="earth-centering-px"/);
  assert.doesNotMatch(html, /data-earth-style|earth-style-controls/);
  assert.match(html, /href="\.\/earth\.html"/);
  assert.doesNotMatch(html, /borderInnerShadowIntensity|ВНУТРЕННЯЯ ТЕНЬ/);
  assert.match(html, /Shift\+ЛКМ: камера/);
  assert.match(html, /data-action="capture-view-all"/);
  assert.match(editor, /preciseOrbit:\s*true/);
  assert.match(editor, /onMovePreview:\s*\(id, geo\) => previewTestMove/);
  assert.match(editor, /setEarthOrbitPreferences/);
  assert.match(editor, /earthStyle:\s*loadedShellConfig\.rendering\.earth/);
  assert.doesNotMatch(editor, /earthStyleInputs|applyEarthStyleInputs|syncEarthStyleInputs/);
  assert.match(runtime, /earthOrbit:\s*resolveMissionEarthOrbit\(shellConfig\.interaction\.earthOrbit, state\.screen, state\.activeMission\)/);
  assert.match(editor, /rotation:\s*view\.rotation/);
  assert.match(editor, /fov:\s*round\(view\.fov/);
  assert.match(field, /cameraEuler\.set\(cameraPitch, cameraYaw, this\.roll/);
  assert.match(field, /this\.dragAxis === "pan"/);
  assert.match(field, /this\.targetFov/);
  assert.match(field, /controls\?\.centerRussia[\s\S]*?verticalCenteringOffset/);
  assert.match(editor, /Math\.min\(availableWidth, availableHeight \* 16 \/ 9\)/);
  assert.match(editor, /resolveUiShellState\(shellConfig, selectedCameraState\)/);
  assert.match(editor, /resolveEarthFrameOffset\(shellConfig, selectedCameraState\)/);
  assert.match(editor, /setPresentationOffset\(earthOffset\.x \* scale, earthOffset\.y \* scale/);
  assert.match(editor, /selectedCameraState === "MISSION_SELECT"/);
  assert.match(editor, /selectedCameraState === "MISSION_PLAY"/);
  assert.match(styles, /preview-stage\[data-earth-mask="frame"\] \.editor-world/);
  assert.match(styles, /\.preview-frame/);
  assert.match(styles, /\.preview-inventory/);
  assert.match(server, /url\.pathname === "\/api\/editor\/status"/);
  assert.match(server, /Access-Control-Allow-Origin/);
  assert.match(server, /http:\/\/127\.0\.0\.1:4173/);
  assert.match(server, /process\.argv\.includes\("--open-editor"\)/);
  assert.match(editorLauncher, /--watch --watch-preserve-output "[^\r\n]*server\.mjs" --open-editor/);
  assert.match(gameLauncher, /--watch --watch-preserve-output "[^\r\n]*server\.mjs" --open/);
});

test("planet appearance has a dedicated realtime editor", () => {
  for (const id of ["earth-preview", "earth-controls", "texture-grid", "preview-state", "control-search", "save-state"]) {
    assert.equal(earthHtml.match(new RegExp(`id=["']${id}["']`, "g"))?.length, 1);
  }
  assert.match(earthHtml, /ВИЗУАЛЬНЫЙ РЕДАКТОР ПЛАНЕТЫ/);
  assert.match(earthHtml, /data-action="save"/);
  assert.match(earthEditor, /await createWebGLField/);
  assert.match(earthEditor, /field\.setEarthStyle\(earthStyle\)/);
  assert.match(earthEditor, /\/api\/earth-style\/save/);
  assert.match(earthEditor, /publishProjectChange/);
  assert.match(earthEditor, /ignoreSourceId:\s*EARTH_EDITOR_SOURCE_ID/);
  assert.match(earthEditor, /result\.earthStyle \|\| submitted/);
  assert.match(server, /url\.pathname === "\/api\/earth-style\/save"/);
  assert.match(earthStyles, /\.earth-preview canvas/);
  for (const field of ["russiaContour", "dayTint", "nightTint", "textureColorMix", "textureSaturation", "surfaceExposure", "surfaceGamma", "surfaceContrast", "oceanColor", "oceanIntensity", "russiaSurfaceBoost", "outsideSurfaceDim", "russiaMaskFeather", "cityLightsColor", "cityLightsHotColor", "cityLightsIntensity", "cityLightsHotIntensity", "cityLightsGlowIntensity", "cityLightsCoreStart", "cityLightsGlowStart", "cityLightsBlackPoint", "cityLightsWhitePoint", "cityLightsGamma", "cityLightsHotPoint", "cityLightsLimbStart", "cityLightsLimbEnd", "normalStrength", "cloudColor", "cloudIntensity", "cloudOpacity", "cloudBlackPoint", "cloudWhitePoint", "cloudAltitude", "cloudShadowIntensity", "hazeColor", "hazeIntensity", "hazePower", "borderIntensity", "borderCoreIntensity", "borderCoreWidth", "borderGlowIntensity", "emissiveBloomRadius", "emissiveBloomStrength", "emissiveBloomQuality", "atmosphereIntensity", "atmosphereInnerFeather", "atmosphereOuterFeather", "atmosphereSunBias"]) {
    assert.match(earthEditor, new RegExp(`(?:color|number|select)\\(["']${field}["']`));
  }
  assert.match(earthEditor, /repairEarthStyleRelations\(earthStyle, definition\.key\)/);
  for (const texture of ["Earth_Diffuse_4K.jpg", "Earth_Illumination_Core_4K.webp", "Earth_Specular_4K.webp", "Earth_Normal_4K.webp", "Earth_Clouds_4K.webp"]) assert.match(earthEditor, new RegExp(texture.replaceAll(".", "\\.")));
});

test("editor and runtime share per-state camera views without a second WebGL architecture", () => {
  assert.match(editor, /await createWebGLField/);
  assert.match(editor, /freeOrbit:\s*true/);
  assert.match(editor, /states\[selectedCameraState\]\.cameraView/);
  assert.match(runtime, /states\[state\.screen\]\.cameraView/);
  assert.match(runtime, /project-config-saved/);
  assert.match(runtime, /location\.reload\(\)/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /<canvas/);
});
