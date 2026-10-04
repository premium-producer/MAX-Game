import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const routeView = await readFile(new URL("../src/route-view.mjs", import.meta.url), "utf8");
const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const editorStyles = await readFile(new URL("../src/editor.css", import.meta.url), "utf8");
const earthEditorStyles = await readFile(new URL("../src/earth-editor.css", import.meta.url), "utf8");
const objectBankStyles = await readFile(new URL("../src/object-bank.css", import.meta.url), "utf8");
const handoffTokens = await readFile(new URL("../public/handoff/tokens-derived.json", import.meta.url), "utf8");
const webgl = await readFile(new URL("../src/webgl-field.js", import.meta.url), "utf8");
const assetSources = await readFile(new URL("../src/asset-preparation.mjs", import.meta.url), "utf8");

test("all runtime interfaces use only the bundled Bureau brand typefaces", () => {
  for (const source of [styles, editorStyles, earthEditorStyles, objectBankStyles, handoffTokens]) {
    assert.doesNotMatch(source, /Arial|sans-serif|monospace/i);
  }
  assert.match(styles, /font-family:\s*"Bureau 1440 Display"/);
  assert.match(styles, /font:\s*16px\/1\.2 "Bureau 1440 Text"/);
  assert.match(editorStyles, /font-family:\s*"Bureau Text"/);
  assert.match(earthEditorStyles, /font:\s*13px\/1\.4 "Bureau Text"/);
  assert.match(objectBankStyles, /font:\s*14px\/1\.5 "Bureau Text"/);
});

test("header, frame, footer and inventory are single persistent shell elements", () => {
  for (const id of ["shell-header", "shell-frame", "shell-footer", "shell-inventory"]) {
    assert.equal(index.match(new RegExp(`id=["']${id}["']`, "g"))?.length, 1);
  }
  assert.doesNotMatch(main, /<header\b|<footer\b|<aside\b/);
});

test("language switch uses a slower sliding indicator and honors reduced motion", () => {
  assert.match(styles, /\.language-switcher::before\s*\{[^}]*transition:\s*transform var\(--language-motion-duration\) var\(--language-motion-easing\)/s);
  assert.match(styles, /\.language-switcher\[data-active-language="en"\]::before\s*\{[^}]*translate3d\(100%, 0, 0\)/s);
  assert.match(styles, /\.language-transition-ghost,[\s\S]*pointer-events:\s*none !important/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.language-switcher::before,[\s\S]*transition:\s*none/s);
  assert.match(main, /if \(languageTransitionPromise\) return;[\s\S]*const action = event\.target\.closest/);
});

test("CTA repeats the header logo position, lowers its title group and has no orbit microcopy", () => {
  assert.match(main, /class="brand-logo cta-brand-logo"/);
  assert.match(styles, /\.cta-brand-logo\s*\{[^}]*top:\s*calc\(\(var\(--shell-header-height\) - 54px\) \/ 2\);[^}]*left:\s*var\(--shell-header-padding\)/s);
  assert.match(styles, /\.cta-content\s*\{[^}]*padding-top:\s*100px/s);
  assert.match(main, /const selectors = \[\s*"\.cta-brand-logo",\s*"\.cta-content > \*"/s);
  assert.doesNotMatch(styles, /ПЕРЕТАЩИ ФОН|СЛЕГКА ПОВЕРНУТЬ ЗЕМЛЮ/);
});

test("mission footer contains only the centered route and restart shares the right status slot with the flag", () => {
  const missionShell = main.slice(main.indexOf("function renderMissionShell"), main.indexOf("function renderCta"));
  assert.match(missionShell, /setShellFooterContent\(`mission:\$\{mission\.number\}`, `\s*<div class="route-sequence" data-route><\/div>`\);/s);
  assert.doesNotMatch(missionShell, /ПРОВЕРИТЬ МАРШРУТ|СБРОСИТЬ|check-button|reset-button/);
  assert.match(missionShell, /class="mission-card-footer"[\s\S]*class="mission-time"[\s\S]*class="mission-restart-button"[^>]*data-game-action="restart"[^>]*t\("mission\.restart"\)[\s\S]*<svg[^>]*viewBox="0 0 24 24"[\s\S]*class="mission-completion-flag"/);
  assert.match(styles, /\.shell-footer-content\s*\{[^}]*justify-content:\s*center/s);
  assert.match(styles, /\.mission-card-footer\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center/s);
  assert.match(styles, /\.mission-restart-button\s*\{[^}]*width:\s*26px;[^}]*height:\s*26px;[^}]*margin-left:\s*auto;[^}]*border-radius:\s*4px/s);
  assert.match(styles, /\.mission-card\.is-complete \.mission-restart-button\s*\{\s*display:\s*none;/s);
  assert.match(styles, /\.mission-card\.is-complete \.mission-completion-flag\s*\{\s*display:\s*block;/s);
  assert.doesNotMatch(styles, /\.check-button|\.reset-button/);
});

test("mission selection has no legacy static CSS orbit rings", () => {
  assert.doesNotMatch(styles, /\.mission-map::before|\.mission-map::after/);
});

test("only the next incomplete mission owns a start action after its summary", () => {
  const missionSelect = main.slice(main.indexOf("function renderMissionSelect"), main.indexOf("function syncMissionMarkers"));
  assert.match(missionSelect, /const finishAction = allCompleted[\s\S]*class="outcome-popup"[\s\S]*showOutcomePopup[\s\S]*action: "finish"/);
  assert.match(missionSelect, /setShellFooterContent\("select", ""\)/);
  assert.match(missionSelect, /actions\.innerHTML = finishAction/);
  assert.match(missionSelect, /class="mission-marker__select"[^>]*data-select-mission/);
  assert.match(missionSelect, /class="mission-preview-action"[^>]*data-game-action="launch"/);
  assert.doesNotMatch(missionSelect, /mission\.objectives|mission-preview-objectives/);
  assert.match(missionSelect, /mission\.summary/);
  assert.match(missionSelect, /missionSelect\.start/);
  assert.match(missionSelect, /const action = playable \?/);
  assert.doesNotMatch(missionSelect, /missionSelect\.replay/);
  assert.match(styles, /\.mission-marker\.is-selected \.mission-preview-action\s*\{\s*display:\s*flex;/s);
  assert.doesNotMatch(missionSelect, /setShellFooterContent\([^;]*data-game-action="launch"/s);
});

test("mission play and selection cards retain their distinct authored styles", () => {
  assert.match(styles, /\.mission-card\s*\{[^}]*width:\s*298px;[^}]*min-height:\s*min\(371px, calc\(100% - 68px\)\);[^}]*padding:\s*26px 20px;[^}]*background:\s*rgba\(15, 18, 23, \.96\);[^}]*box-shadow:\s*0 12px 28px rgba\(15, 18, 23, \.72\);/s);
  assert.match(styles, /\.mission-card li\s*\{[^}]*min-height:\s*49px;[^}]*grid-template-columns:\s*18px 1fr;[^}]*align-items:\s*center;[^}]*font:\s*16px\/1\.2 "Bureau 1440 Text"/s);
  assert.match(styles, /\.mission-card li \.objective-check\s*\{[^}]*width:\s*18px;[^}]*height:\s*18px;[^}]*border:\s*2px solid #2854ad;/s);
  assert.match(styles, /\.mission-card ul::before\s*\{[^}]*top:\s*24px;[^}]*bottom:\s*24px;[^}]*left:\s*8px;[^}]*width:\s*2px;[^}]*background:\s*#2854ad;/s);
  assert.match(styles, /\.mission-card\.is-complete ul::before\s*\{\s*background:\s*#0bb579;/s);
  assert.match(styles, /\.mission-marker\s*\{[^}]*width:\s*294px;[^}]*min-height:\s*356px;[^}]*padding:\s*28px 24px 22px;[^}]*background:\s*linear-gradient\(155deg,/s);
  assert.match(styles, /\.mission-preview-footer small\s*\{[^}]*font-size:\s*13px;[^}]*letter-spacing:\s*\.02em;/s);
});

test("returning from success animates only the newly unlocked mission", () => {
  assert.match(main, /action\.type === "MISSION_COMPLETE"[\s\S]*pendingUnlockedMission = nextMissionToPlay\(nextState\.completed, MISSION_ORDER\)/);
  assert.match(main, /unlocking \? "is-unlocking" : ""/);
  assert.match(main, /\.mission-marker-anchor:not\(\.is-behind-earth\) \.mission-marker/);
  assert.match(styles, /\.mission-marker\.is-unlocking\s*\{[^}]*animation:\s*mission-card-unlock var\(--screen-motion-duration\)/s);
  assert.match(styles, /@keyframes mission-start-unlock/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.mission-marker\.is-unlocking[\s\S]*animation:\s*none/s);
});

test("route footer mirrors the authoritative local node state", () => {
  assert.match(routeView, /network\?\.states\?\.\[node\.id\]/);
  assert.ok(routeView.includes("slot.classList.toggle('is-correct', item?.state === 'link')"));
  assert.ok(routeView.includes("slot.classList.toggle('is-wrong', item?.state === 'wrong')"));
  assert.match(styles, /\.route-slot\.is-correct\s*\{[^}]*border-color:\s*#42d9ad/s);
  assert.match(styles, /\.route-slot\.is-wrong\s*\{[^}]*border-color:\s*#f55257/s);
});

test("screen changes settle the existing camera for the full authored screen duration", () => {
  assert.match(main, /setViewState\(shellConfig\.states\[state\.screen\]\.cameraView, immediate, shellConfig\.motion\.screenDurationMs\)/);
  assert.match(main, /cameraIdleMotion:\s*shellConfig\.motion\.cameraIdle/);
  assert.match(webgl, /this\.viewTransition[\s\S]*cameraSettleProgress\(transition\.elapsed \/ transition\.duration\)/);
  assert.match(webgl, /immediate \|\| reducedMotionQuery\.matches/);
});

test("end screen follows the framed reference composition", () => {
  assert.match(main, /assets\/qr\/tg\.svg/);
  assert.match(main, /assets\/qr\/max\.svg/);
  const endScreen = main.slice(main.indexOf("function renderEnd()"), main.indexOf("function renderOutcomePopup"));
  assert.equal((endScreen.match(/class="qr-card"/g) || []).length, 2);
  assert.match(endScreen, /t\("end\.telegram"\)/);
  assert.match(endScreen, /t\("end\.max"\)/);
  assert.doesNotMatch(endScreen, /end-copy|end-stat|250\+|end\.learnMore/);
  assert.doesNotMatch(main, /function qrMarkup/);
  assert.match(styles, /\.end-content\s*\{[^}]*margin:\s*calc\(var\(--shell-header-height\) \+ var\(--shell-frame-gap\) \+ 105px\) auto 0;/s);
  assert.match(styles, /\.end-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, 380px\)/s);
  assert.match(styles, /\.shell-footer-content\[data-content-key="end"\] \.hero-button\s*\{[^}]*min-width:\s*390px/s);
});

test("inventory is a compact draggable card stack without native scrollbars", () => {
  assert.match(main, /objectCard\(type, count\)/);
  assert.match(main, /object-card-drag-handle/);
  assert.match(main, /object-card-count/);
  assert.doesNotMatch(main, /object-card-description/);
  assert.match(styles, /\.inventory-list\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*gap:\s*10px;[^}]*overflow-y:\s*auto;/s);
  assert.match(styles, /\.inventory-item\s*\{[^}]*flex:\s*0 0 154px;[^}]*border-radius:\s*9px;/s);
  assert.doesNotMatch(styles, /grid-auto-rows:\s*minmax\(150px,\s*1fr\)/);
  assert.match(styles, /\*::\-webkit-scrollbar\s*\{[^}]*display:\s*none;[^}]*width:\s*0;[^}]*height:\s*0;/s);
  assert.match(styles, /scrollbar-width:\s*none/);
});

test("points render exclusively from their bank SVG in the route footer and WebGL marker", () => {
  const start = main.indexOf("function renderRoutePoint");
  const routePoint = main.slice(start, main.indexOf("function escapeHtml", start));
  assert.match(routePoint, /pointIconSource\(point\)/);
  assert.match(routePoint, /icon \? `<img/);
  assert.doesNotMatch(routePoint, /point\?\.label|label \?/);
  assert.doesNotMatch(webgl, /endpointTextLayer|endpointGlyphGeometries|textLabel/);
});

test("WebGL UI graphics stay resolution-independent at Full HD and 4K", () => {
  assert.match(main, /await createWebGLField/);
  assert.match(main, /webglField\?\.resize\(\)/);
  assert.match(webgl, /SVGLoader/);
  assert.match(webgl, /setDrawingBufferSize/);
  assert.match(webgl, /fwidth\(/);
  assert.match(webgl, /toneMapped:\s*false/);
  assert.doesNotMatch(webgl, /CanvasTexture|new THREE\.Sprite|renderer\.setPixelRatio/);
});

test("Earth builds muted steel oceans, raised clouds and selective color bloom from realtime masks", () => {
  assert.match(assetSources, /Earth_Diffuse_4K\.jpg/);
  assert.match(assetSources, /Earth_Specular_4K\.webp/);
  assert.match(assetSources, /Earth_Normal_4K\.webp/);
  assert.match(assetSources, /Earth_Clouds_4K\.webp/);
  assert.doesNotMatch(webgl, /Earth_Glossiness_4K\.jpg/);
  assert.match(webgl, /EARTH_WIDTH_SEGMENTS = 160/);
  assert.match(webgl, /anisotropy = Math\.min\(8, renderer\.capabilities\.getMaxAnisotropy\(\)\)/);
  assert.match(webgl, /UniformsUtils\.clone\(THREE\.UniformsLib\.fog\)/);
  assert.match(webgl, /vec4 mvPosition = viewMatrix \* worldPosition;[\s\S]*gl_Position = projectionMatrix \* mvPosition;[\s\S]*#include <fog_vertex>/);
  assert.match(webgl, /uDayMap/);
  assert.match(webgl, /uSpecularMap/);
  assert.match(webgl, /uNormalMap/);
  assert.match(webgl, /tangentNormal\.xy \*= uNormalStrength/);
  assert.match(webgl, /float specularSample = clamp\(texture2D\(uSpecularMap, vEarthUv\)\.r/);
  assert.match(webgl, /float mappedSpecular = smoothstep\(0\.08, 0\.96, specularSample\)/);
  assert.match(webgl, /float oceanSheen = mappedSpecular/);
  assert.doesNotMatch(webgl, /halfDirection/);
  assert.match(webgl, /vec3 oceanTonalColor = uOceanColor/);
  assert.match(webgl, /outgoingLight = mix\(outgoingLight, oceanTonalColor, oceanMask\)/);
  assert.match(webgl, /vec3 oceanSheenColor = mix\(uOceanColor/);
  assert.match(webgl, /vec3 polarLandFloor = mix\(uNightTint, uDayTint/);
  assert.match(webgl, /outgoingLight = max\(outgoingLight, polarLandFloor \* polarLand\)/);
  assert.match(webgl, /earthUniforms\.uNormalStrength\.value = Number\(style\.normalStrength\)/);
  assert.match(webgl, /smoothstep\(-uTerminatorSoftness, uTerminatorSoftness, normalToSun\)/);
  assert.match(webgl, /gradedSample = pow\(max\(daySample, vec3\(0\.0\)\), vec3\(uSurfaceGamma\)\)/);
  assert.match(webgl, /vec3 originalColor = mix\(vec3\(originalLuminance\), daySample, uTextureSaturation\)/);
  assert.match(webgl, /vec3 surfaceColor = mix\(styledSurface, originalColor, uTextureColorMix\)/);
  assert.match(webgl, /earthUniforms\.uTextureColorMix\.value = Number\(style\.textureColorMix\)/);
  assert.match(webgl, /gradedSample = max\(\(gradedSample - 0\.18\) \* uSurfaceContrast \+ 0\.18/);
  assert.match(webgl, /rimHaze = pow\(1\.0 - viewFacing, uHazePower\)/);
  assert.match(webgl, /outgoingLight \+= uHazeColor \* hazeAmount/);
  assert.doesNotMatch(webgl, /desaturatedDay \* uDayTint/);
  assert.match(assetSources, /Russia_Fill_Mask_6K\.svg/);
  assert.match(webgl, /uRussiaMask:\s*\{ value: russiaSurfaceMask \}/);
  assert.match(webgl, /float russiaMask = smoothstep\(0\.5 - russiaEdge, 0\.5 \+ russiaEdge, russiaRaw\)/);
  assert.match(webgl, /float regionalDim = mix\(uOutsideSurfaceDim, 1\.0, russiaMask\)/);
  assert.match(webgl, /outgoingLight = outgoingLight \* mix\(1\.0, regionalDim, landMask\)[\s\S]*\+ russiaDetail \* russiaMask/);
  assert.match(webgl, /earthUniforms\.uRussiaSurfaceBoost\.value = Number\(style\.russiaSurfaceBoost\)/);
  assert.match(webgl, /contourSwitcher\.dispose\(\)/);
  assert.match(webgl, /release: \(\{ fill, geometry \}\) => \{ fill\.dispose\(\); geometry\.dispose\(\); \}/);
  assert.match(webgl, /const cloudMaterial = new THREE\.ShaderMaterial/);
  assert.match(webgl, /new THREE\.SphereGeometry\(EARTH_RADIUS, 128, 80\)/);
  assert.match(webgl, /cloudLayer\.scale\.setScalar\(\(EARTH_RADIUS \+ Number\(style\.cloudAltitude\)\) \/ EARTH_RADIUS\)/);
  assert.match(webgl, /float cloudShadowRaw = texture2D\(uCloudMap, vEarthUv \+ vec2\(-0\.0018, 0\.001\)\)\.r/);
  assert.match(webgl, /earthClouds\.dispose\(\)/);
  assert.match(assetSources, /Earth_Illumination_Core_4K\.webp/);
  assert.doesNotMatch(webgl, /Earth_Illumination_Glow_4K\.webp|earthIlluminationGlow|EARTH_RADIUS \* 1\.0015/);
  assert.match(webgl, /uCityMap:\s*\{ value: earthIlluminationCore \}/);
  assert.match(webgl, /texture2D\(uCityMap, vEarthUv, 0\.75\)/);
  assert.match(webgl, /float cityAa = max\(fwidth\(cityRaw\) \* 1\.5, 2\.0 \/ 255\.0\)/);
  assert.match(webgl, /float cityLimbFade = smoothstep\(uCityLimbStart, uCityLimbEnd, viewFacing\)/);
  assert.match(webgl, /outgoingLight \+= cityColor \* cityCore \* cityVisibility \* uCityIntensity/);
  assert.match(webgl, /outgoingLight \+= uCityHotColor \* cityHot \* cityHot \* cityVisibility \* uCityHotIntensity/);
  assert.match(webgl, /const cityBloomEmitterMaterial = new THREE\.ShaderMaterial/);
  assert.match(webgl, /const cityBloomEmitter = new THREE\.Mesh\(earth\.geometry, cityBloomEmitterMaterial\)/);
  assert.match(webgl, /borderBloomScene\.add\(cityBloomEmitter\)/);
  assert.match(webgl, /cityBloomUniforms\.uIntensity\.value = Number\(style\.cityLightsGlowIntensity\)/);
  assert.match(webgl, /cityBloomEmitter\.visible = cityBloomEnabled/);
  assert.match(webgl, /earthIlluminationCore\.dispose\(\)/);
  assert.match(webgl, /earthUniforms\.uCityColor\.value\.set\(style\.cityLightsColor\)/);
  assert.match(webgl, /earthUniforms\.uCityHotColor\.value\.set\(style\.cityLightsHotColor\)/);
  assert.match(webgl, /cityBloomUniforms\.uDayVisibility\.value = Number\(style\.cityLightsDayVisibility\)/);
  assert.match(webgl, /LineSegments2/);
  assert.match(webgl, /LineSegmentsGeometry/);
  assert.match(webgl, /LineMaterial/);
  assert.match(assetSources, /Russia_Border_Mask_6K\.svg/);
  assert.match(webgl, /loadAsync\(variant\.border\)/);
  assert.match(webgl, /russiaBorderLinePositions\(results\[1\]\.value\)/);
  assert.match(webgl, /new EffectComposer\(renderer, borderBloomRenderTarget\)/);
  assert.match(webgl, /new UnrealBloomPass\(new THREE\.Vector2\(1, 1\)/);
  assert.match(webgl, /const borderBloomDepthSphere = new THREE\.Mesh\(earth\.geometry, borderBloomDepthMaterial\)/);
  assert.match(webgl, /colorWrite:\s*false/);
  assert.match(webgl, /polygonOffset:\s*true/);
  assert.match(webgl, /polygonOffsetFactor:\s*1/);
  assert.match(webgl, /polygonOffsetUnits:\s*1/);
  assert.match(webgl, /texture2D\(uMap, vCityUv, 0\.75\)/);
  assert.match(webgl, /const borderBloomEmitter = new LineSegments2\(borderLineGeometry, borderBloomEmitterMaterial\)/);
  assert.match(webgl, /blending:\s*THREE\.NoBlending/);
  assert.match(webgl, /borderCoreMaterial\.color\.copy\(borderGlowTint\)\.lerp\(borderCoreWhite, 0\.94\)\.multiplyScalar\(Number\(style\.borderCoreIntensity\)\)/);
  assert.match(webgl, /blending:\s*THREE\.AdditiveBlending[\s\S]*bloomSample \* uOpacity/);
  assert.match(webgl, /new THREE\.WebGLRenderTarget\(1, 1,[\s\S]*texture\.name = "XSputnik\.earthHDR"/);
  assert.match(webgl, /const outputPass = new OutputPass\(\)/);
  assert.match(webgl, /renderer\.setRenderTarget\(earthHdrTarget\);[\s\S]*renderer\.render\(scene, camera\);[\s\S]*renderer\.render\(borderGlowOverlayScene, borderGlowOverlayCamera\);[\s\S]*outputPass\.render\(renderer, null, earthHdrTarget[\s\S]*renderer\.clearDepth\(\);[\s\S]*renderer\.render\(gameplayOcclusionScene, camera\);[\s\S]*renderer\.render\(gameplayForegroundScene, camera\)/);
  assert.match(webgl, /gameplayForegroundScene\.add\([\s\S]*linkLayer,[\s\S]*missionMarkerLayer,[\s\S]*nodeLayer,[\s\S]*endpointLayer,[\s\S]*satelliteDragGuide\.group/);
  assert.match(webgl, /for \(const renderScene of \[scene, gameplayForegroundScene\]\)/);
  assert.match(webgl, /resolveEmissiveBloomSize\(borderBloomDrawingBufferSize\.x, borderBloomDrawingBufferSize\.y, emissiveBloomQuality\)/);
  assert.match(webgl, /borderBloomPass\.dispose\(\)/);
  assert.match(webgl, /borderBloomComposer\.dispose\(\)/);
  assert.match(webgl, /earthHdrTarget\.dispose\(\)/);
  assert.match(webgl, /outputPass\.dispose\(\)/);
  assert.match(webgl, /cityBloomEmitterMaterial\.dispose\(\)/);
  assert.doesNotMatch(webgl, /configureBorderGlowMaterial|borderGlowOuterMaterial|borderGlowMiddleMaterial|borderGlowInnerMaterial/);
  assert.doesNotMatch(webgl, /borderNeonMaterial|borderGlowTexture|Russia_Border_Glow_4K\.webp|borderShadow|borderInnerShadow|russiaMaskTexture|mask_v1\.png/);
  assert.match(webgl, /contourSwitcher\.dispose\(\)/);
  assert.match(webgl, /const atmosphereHalo = new THREE\.Mesh/);
  assert.match(webgl, /float seamOverlap = radiusDerivative \* 1\.5/);
  assert.match(webgl, /projectedEarthDiscRadius\([\s\S]*atmospherePlaneDepth/);
  assert.match(webgl, /earthHdrTarget\.samples = resolveWorldMsaaSamples/);
  assert.match(webgl, /atmosphereHalo\.quaternion\.copy\(camera\.quaternion\)/);
  assert.match(webgl, /setEarthStyle\(style\)/);
  assert.match(main, /earthStyle:\s*shellConfig\.rendering\.earth/);
  assert.doesNotMatch(webgl, /new THREE\.MeshPhongMaterial/);
});

test("accepted links render as icon-to-icon wave strings with flowing particles", () => {
  assert.match(webgl, /iconLinkAnchor\(firstGroup\.position/);
  assert.match(webgl, /createSignalLinkVisual/);
  assert.match(webgl, /strandCount/);
  assert.match(webgl, /particleCount/);
  assert.match(webgl, /new THREE\.Points\(/);
  assert.match(webgl, /wavePhase/);
  assert.doesNotMatch(webgl, /entry\.line|entry\.pulse|new THREE\.SphereGeometry\(0\.035/);
});

test("mission selection keeps surface markers without orbital objects or progress links", () => {
  assert.doesNotMatch(main, /missionSelectObjectsForRendering/);
  assert.doesNotMatch(webgl, /missionSelectObjects|missionSelectOrbital|MissionSelectOrbital|missionSelectLink|missionLinkLayer|missionLinksByKey/);
  assert.match(webgl, /setMissionMarkers\(markers\)\s*\{\s*syncMissionSurfaceMarkers\(markers\)/);
  assert.match(webgl, /createMissionSurfaceAnchor\(\)/);
  assert.match(webgl, /setMissionSurfaceAnchorStatus\(group, marker.status, marker.active\)/);
  assert.match(webgl, /for \(const \[key, entry\] of linksByKey\)/);
  assert.match(webgl, /updateSignalLinkVisual\(entry, firstGroup.position, secondGroup.position, camera/);
});

test("drag previews recompute accepted links through the existing render loop", () => {
  assert.match(main, /onMovePreview:\s*\(id, geo\)/);
  assert.match(main, /function previewMissionMove[\s\S]*previewPlacementMove[\s\S]*deriveNetwork[\s\S]*webglField\.update/);
  assert.match(webgl, /movePreviewPending = true/);
  assert.match(webgl, /const animate = \(\) => \{[\s\S]*movePreviewPending[\s\S]*onMovePreview\(draggedNode\.id, draggedNode\.preview\)/);
  assert.doesNotMatch(webgl, /pointermove[\s\S]{0,120}requestAnimationFrame/);
});

test("all five application states map onto the persistent shell", () => {
  assert.match(main, /setShellState\(state\.screen/);
  assert.match(main, /ui-shell--\$\{screen\.toLowerCase\(\)\.replaceAll/);
});

test("the live Earth and backdrop use the frame geometry as a shared mask", () => {
  assert.match(main, /stage\.dataset\.earthMask = shellState\.earthMask/);
  assert.match(styles, /data-earth-mask="frame"[^}]*\.world-layer/s);
  assert.match(styles, /var\(--shell-frame-right\)/);
  assert.match(styles, /var\(--shell-frame-bottom\)/);
  assert.match(main, /setPresentationOffset\(earthOffset\.x, earthOffset\.y/);
});

test("mission markers are built from a surface platform, upward stem and accessible card controls", () => {
  assert.match(main, /setMissionMarkers\(state\.screen === STATES\.MISSION_SELECT/);
  assert.match(main, /mission-marker-anchor[\s\S]*mission-marker-stem[\s\S]*<article[^>]*mission-marker[\s\S]*<button[^>]*mission-marker__select/);
  assert.match(styles, /mission-marker-stem\s*\{[^}]*top:\s*-56px;[^}]*height:\s*48px/s);
  assert.match(styles, /mission-marker\s*\{[^}]*top:\s*-56px;[^}]*transform:\s*translate\(-50%, -100%\)/s);
  assert.match(webgl, /createMissionSurfaceAnchor/);
  assert.match(webgl, /broadcastPlate\.visible = status === "open" && active === true/);
  assert.doesNotMatch(webgl, /atmosphereHalo\.visible\s*=/);
  assert.match(webgl, /scene\.add\(atmosphereHalo, atmosphere\)/);
  assert.doesNotMatch(webgl, /missionOverlayScene|missionOverlayCamera|createMissionOrbitalBeacon/);
  assert.doesNotMatch(styles, /mission-beacon/);
  assert.match(webgl, /endpointLayer\.children\)[\s\S]*group\.userData\.billboard\.quaternion\.copy\(camera\.quaternion\)/);
  assert.match(webgl, /const anchor = createNodeAnchor\(\{ includeHitTarget: false \}\);[\s\S]*visualMaterials[\s\S]*billboard/);
});

test("white WebGL icons have a normal-blended dark backdrop over bright Earth textures", () => {
  assert.match(main, /nodeIconBackdropStyle:\s*shellConfig\.rendering\.nodeIconBackdrop/);
  assert.match(webgl, /new THREE\.CircleGeometry\(iconBackdropStyle\.radius, 64\)/);
  assert.match(webgl, /billboard\.add\(iconBackdrop, plate, icon\)/);
  assert.match(webgl, /color:\s*iconBackdropStyle\.color, opacity:\s*iconBackdropStyle\.opacity/);
});

test("screen changes and fixed route fades respect the shared motion system", () => {
  assert.match(main, /captureOutgoingScreen\(\)/);
  assert.match(main, /updateRouteSequence\(/);
  assert.match(main, /data-route-track/);
  assert.match(routeView, /dataset\.placementId/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.route-track > \.route-slot, \.route-track > \.route-edge \{ transition: none; \}/);
  const routeUpdate = main.slice(
    main.indexOf("function updateRouteSequence"),
    main.indexOf("function motionOptions"),
  );
  assert.match(routeView, /\{ opacity: 0 \}[\s\S]*\{ opacity: 1 \}/);
  assert.doesNotMatch(routeUpdate, /getBoundingClientRect|deltaX|translate3d|scale\(/);
  const screenTransition = main.slice(
    main.indexOf("function completeScreenTransition"),
    main.indexOf("function screenEnterTargets"),
  );
  assert.match(screenTransition, /filter:\s*"blur\(5px\)"/);
  assert.match(screenTransition, /filter:\s*"blur\(6px\)"/);
  assert.match(screenTransition, /target\.matches\("\.mission-marker"\)\s*\?\s*\[[\s\S]*filter:\s*"blur\(5px\) brightness\(\.8\)"/);
  const missionMarkerStart = styles.indexOf(".mission-marker {", styles.indexOf(".flow-screen--missions"));
  const missionMarkerStyles = styles.slice(missionMarkerStart, styles.indexOf(".mission-marker__select", missionMarkerStart));
  assert.match(missionMarkerStyles, /background:\s*linear-gradient\(155deg, rgba\(11, 17, 27, \.985\), rgba\(7, 12, 20, \.97\)\)/);
  assert.match(missionMarkerStyles, /will-change:\s*opacity, transform/);
  assert.doesNotMatch(missionMarkerStyles, /backdrop-filter/);
  assert.match(styles, /\.mission-marker\.mission-marker--locked,\s*\.mission-marker\.mission-marker--completed\s*\{\s*opacity:\s*\.8;/s);
  assert.doesNotMatch(styles, /\.mission-marker--locked\s*\{[^}]*grayscale/s);
  assert.match(styles, /\.mission-marker-anchor--locked \.mission-marker-stem,\s*\.mission-marker-anchor--completed \.mission-marker-stem\s*\{\s*opacity:\s*calc\(\.8 \* var\(--mission-bases-presence, 1\)\);/s);
  assert.match(webgl, /status === "locked" \|\| status === "completed" \? 0\.8 : 1/);
  assert.match(main, /\.mission-marker-anchor:not\(\.is-behind-earth\) \.mission-marker/);
  assert.doesNotMatch(main, /\.mission-marker-anchor:not\(\.is-behind-earth\) \.mission-marker:not\(:disabled\)/);
  assert.match(styles, /\.screen-transition-ghost\s*\{[^}]*will-change:\s*transform, opacity, filter/s);
  assert.match(main, /prefers-reduced-motion: reduce/);
  assert.match(styles, /screen-transition-ghost/);
  assert.match(styles, /floating-dialog-in/);
  assert.match(styles, /outcome-popup\[data-kind="success"\]\s*\{[^}]*animation-delay/s);
  assert.doesNotMatch(styles, /outcome-popup\[data-kind="error"\]\s*\{[^}]*animation-delay/s);
  assert.match(main, /renderOutcomePopup\(mission, evaluationNetwork, feedbackEvents\)/);
  assert.match(main, /missionRun\.status === "timeout"[\s\S]*action: "timeout"[\s\S]*title: t\("popup\.timeout\.title"\)/);
  assert.match(main, /popup\.dataset\.position = "floating"/);
  assert.match(main, /beginOutcomePopupDrag/);
  assert.match(main, /createMissionFeedbackSession/);
  assert.match(main, /deriveMissionFeedback/);
  assert.match(main, /outcome\.action === "finish" \? "finish" : "success"/);
  assert.match(main, /outcome\.action === "finish" \? "missionSelect\.continue" : "popup\.continue"/);
  assert.doesNotMatch(main, /outcome\.eyebrow/);
  assert.match(main, /escapeHtml\(outcome\.message\)/);
  assert.match(styles, /outcome-popup\[data-kind="success"\] \.hero-button/);
  assert.match(styles, /outcome-popup \.hero-button\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%/s);
  assert.match(styles, /game-feedback--playing,\s*\.game-feedback--complete,\s*\.game-feedback--timeout\s*\{\s*opacity:\s*0/);
  assert.match(main, /\["playing", "complete", "timeout"\]\.includes\(missionRun\.status\) \? 0 : 1/);
  assert.doesNotMatch(styles, /\.outcome-popup\[data-position="menu"\]/);
  assert.match(main, /classList\.toggle\("is-timeout", missionRun\.status === "timeout"\)/);
  assert.match(styles, /\.mission-time\.is-timeout\s*\{[^}]*border-color:\s*#e14f51;[^}]*color:\s*#ff8588/s);
  assert.match(styles, /font-family:\s*"Bureau 1440 Text"/);
  assert.match(styles, /mission-card ul::before\s*\{[^}]*top:\s*24px;[^}]*bottom:\s*24px;[^}]*background:\s*#2854ad/s);
  assert.doesNotMatch(styles, /objective-check::before|objective-check::after/);
  assert.match(styles, /M3\.5 9\.2 7\.2 13 14\.5 5\.2/);
  assert.doesNotMatch(styles, /mission-card li\.is-done \.objective-check\s*\{[^}]*linear-gradient/s);
  assert.doesNotMatch(styles, /mission-card li\.is-done \.objective-check\s*\{[^}]*transform/s);
  assert.match(styles, /mission-card li \.objective-check\s*\{[^}]*transition:\s*border-color[^;}]*background-color/s);
  assert.match(styles, /mission-card li\.is-done \.objective-check\s*\{[^}]*background-color:\s*#0bb579/s);
  assert.match(styles, /mission-card li\s*\{[^}]*align-items:\s*center/);
  assert.match(styles, /mission-card li \.objective-check\s*\{[^}]*margin-top:\s*0/);
  assert.match(styles, /mission-card\.is-complete/);
  assert.match(main, /mission-completion-flag/);
  assert.match(main, /function clearInventory\(\)\s*\{[^}]*replaceChildren\(\);[^}]*delete shellInventoryList\.dataset\.motionKey/s);
  assert.match(main, /dataset\.motionKey === signature && shellInventoryList\.childElementCount === itemOrder\.length/);
  assert.doesNotMatch(main, /Проверь порядок соседних элементов/);
  assert.match(webgl, /applyMaterialPresence\(group\.userData\.supportMaterials, group\.userData\.presence\)/);
  assert.match(webgl, /applyMaterialPresence\(group\.userData\.visualMaterials, group\.userData\.presence\)/);
  assert.match(webgl, /group\.userData\.targetPresence = 0/);
  assert.doesNotMatch(webgl, /for \(const child of \[\.\.\.endpointLayer\.children\]\)/);
});

test("timeout keeps the route footer and shows neutral retry and leave actions inside the regular popup", () => {
  assert.doesNotMatch(main, /function renderMissionFooter|mission-timeout:/);
  assert.match(main, /class="outcome-popup__actions"/);
  assert.match(main, /data-game-action="restart">\$\{escapeHtml\(t\("popup\.retry"\)\)\}<\/button>/);
  assert.match(main, /data-game-action="leave-mission">\$\{escapeHtml\(t\("popup\.leave"\)\)\}<\/button>/);
  assert.match(main, /data-popup-drag-handle/);
  assert.match(main, /action === "timeout"[\s\S]*centerX[\s\S]*centerY[\s\S]*setOutcomePopupPosition/);
  assert.match(main, /action === "leave-mission"\) dispatch\(\{ type: "BACK" \}\)/);
  assert.match(main, /function setShellFooterContent\(key, html\)/);
  const actionStyles = styles.slice(styles.indexOf(".outcome-popup__actions"), styles.indexOf(".outcome-popup .hero-button"));
  assert.match(actionStyles, /outcome-popup__action--retry\s*\{\s*background:\s*#526176/);
  assert.match(actionStyles, /outcome-popup__action--leave\s*\{\s*background:\s*transparent/);
  assert.doesNotMatch(actionStyles, /#27d19a|#61e5b5|#e14f51|#ff8588/);
});

// Full gameplay instructions and compact map summaries have separate authoring fields.
test("gameplay description uses the full mission text on entry and after language changes", () => {
  assert.match(main, /class="mission-description ui-copy-body">\$\{missionDescriptionHtml\(mission\)\}/);
  assert.match(main, /description.innerHTML = missionDescriptionHtml\(mission\)/);
  assert.match(main, /escapeHtml\(mission.description \|\| mission.summary \|\| ""\)/);
  assert.match(main, /class="mission-summary ui-copy-body">\$\{escapeHtml\(mission.summary\)\}/);
});
