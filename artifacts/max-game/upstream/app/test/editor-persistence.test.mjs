import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { readEditorProject, saveProjectConfigs, saveEarthStyleConfig, saveWordingConfig } from "../src/editor-project-save.mjs";
import { loadMissionCatalog } from "../src/mission-config.mjs";
import { localizeMissionCatalog, createTranslator, parseWording } from "../src/wording.mjs";
import { appendMission } from "../src/editor-state.mjs";
import { loadEditorProject, writableProjectBase, flushEditorInput } from "../src/project-editor-client.mjs";

const root = resolve(import.meta.dirname, "..");
async function fixture(t) {
  const projectRoot = await mkdtemp(join(tmpdir(), "sputnik-persistence-"));
  t.after(() => rm(projectRoot, { recursive: true, force: true }));
  await cp(resolve(root, "public/config"), resolve(projectRoot, "public/config"), { recursive: true });
  await cp(resolve(root, "public/config"), resolve(projectRoot, "dist/config"), { recursive: true });
  return projectRoot;
}
const diskFetch = (root) => async (path) => ({ ok: true, json: async () => JSON.parse(await readFile(resolve(root, path), "utf8")) });
async function runtime(projectRoot, language = "ru") {
  const configRoot = resolve(projectRoot, "dist/config");
  const catalog = await loadMissionCatalog("./missions/index.json", diskFetch(configRoot));
  const wording = parseWording(JSON.parse(await readFile(resolve(configRoot, "wording.json"), "utf8")));
  return localizeMissionCatalog(catalog, createTranslator(wording, language));
}

test("mission and bank edits survive save, reload and player localization; new missions run in both languages", async (t) => {
  const projectRoot = await fixture(t);
  const initial = await readEditorProject(projectRoot);
  const { catalog, shellConfig, revisions: expected } = initial;
  const originalEnglish = initial.wording.entries[`content.missions.${catalog.missions[0].id}.name`].en;
  catalog.missions[0].name = "ТЕСТОВАЯ МИССИЯ";
  catalog.missions[0].summary = "Проверь связь через спутник.";
  catalog.missions[0].level = "ЭКСПЕРТ";
  catalog.missions[0].objectives[0].label = "Размести терминал.";
  catalog.missions[0].feedbackEvents.success[0].title = "ТЕСТ УСПЕШЕН";
  catalog.system.objectTypes.terminal.short = "НОВЫЙ ТЕРМИНАЛ";
  const { catalog: next } = appendMission(catalog, catalog.missions[0]);
  const result = await saveProjectConfigs({ catalog: next, shellConfig, expected, projectRoot });
  const loaded = await readEditorProject(projectRoot);
  assert.equal(loaded.catalog.missions[0].name, "ТЕСТОВАЯ МИССИЯ");
  assert.equal(loaded.catalog.missions[0].summary, "Проверь связь через спутник.");
  assert.equal(loaded.wording.entries[`content.missions.${catalog.missions[0].id}.name`].en, originalEnglish);
  assert.ok(result.translationReview.length);
  for (const language of ["ru", "en"]) {
    const played = await runtime(projectRoot, language);
    assert.equal(played.missions.length, next.missions.length);
    assert.ok(played.missions.at(-1).name);
    assert.ok(played.missions.at(-1).feedbackEvents.success[0].title);
  }
  const played = await runtime(projectRoot);
  assert.equal(played.missions[0].name, "ТЕСТОВАЯ МИССИЯ");
  assert.equal(played.missions[0].level, "ЭКСПЕРТ");
  assert.equal(played.system.objectTypes.terminal.short, "НОВЫЙ ТЕРМИНАЛ");
  for (const name of result.files) assert.equal(await readFile(resolve(projectRoot, "public/config", name), "utf8"), await readFile(resolve(projectRoot, "dist/config", name), "utf8"));
  // Repeated save uses the acknowledged revision and does not undo wording.
  await saveProjectConfigs({ ...loaded, expected: loaded.revisions, projectRoot });
  assert.equal((await runtime(projectRoot)).missions[0].name, "ТЕСТОВАЯ МИССИЯ");
});

test("text editor phrases are loaded into authoring; old tabs cannot overwrite them", async (t) => {
  const projectRoot = await fixture(t), initial = await readEditorProject(projectRoot);
  const key = `content.missions.${initial.catalog.missions[0].id}.name`;
  const wording = structuredClone(initial.wording); wording.entries[key] = { ru: "НОВОЕ ИМЯ", en: "NEW NAME" };
  await saveWordingConfig({ wording, expected: initial.revisions, projectRoot });
  await assert.rejects(saveProjectConfigs({ ...initial, expected: initial.revisions, projectRoot }), (error) => error.status === 409);
  await assert.rejects(saveWordingConfig({ wording: initial.wording, expected: initial.revisions, projectRoot }), /Конфликт/);
  const current = await readEditorProject(projectRoot);
  assert.equal(current.catalog.missions[0].name, "НОВОЕ ИМЯ");
  await saveProjectConfigs({ ...current, expected: current.revisions, projectRoot });
  assert.equal((await runtime(projectRoot, "en")).missions[0].name, "NEW NAME");
});

test("mission copy alternative survives reload and other editors without altering wording", async (t) => {
  const projectRoot = await fixture(t);
  let current = await readEditorProject(projectRoot);
  const wordingBefore = await readFile(resolve(projectRoot, "public/config/wording.json"), "utf8");
  const viewsBefore = structuredClone(current.shellConfig.states);
  current.shellConfig.typography.missionTextLayout = "justify";
  await saveProjectConfigs({ ...current, expected: current.revisions, projectRoot });
  current = await readEditorProject(projectRoot);
  assert.equal(current.shellConfig.typography.missionTextLayout, "justify");
  await saveEarthStyleConfig({ earthStyle: current.shellConfig.rendering.earth, expected: current.revisions, projectRoot });
  current = await readEditorProject(projectRoot);
  await saveProjectConfigs({ ...current, scope: "catalog", expected: current.revisions, projectRoot });
  current = await readEditorProject(projectRoot);
  delete current.shellConfig.typography; // Payload from an older editor.
  await saveProjectConfigs({ ...current, expected: current.revisions, projectRoot });
  current = await readEditorProject(projectRoot);
  const dist = JSON.parse(await readFile(resolve(projectRoot, "dist/config/ui-shell.json"), "utf8"));
  assert.equal(dist.typography.missionTextLayout, "justify");
  assert.deepEqual(current.shellConfig.states, viewsBefore);
  assert.equal(await readFile(resolve(projectRoot, "public/config/wording.json"), "utf8"), wordingBefore);
  current.shellConfig.typography.missionTextLayout = "left";
  await saveProjectConfigs({ ...current, expected: current.revisions, projectRoot });
  assert.equal((await readEditorProject(projectRoot)).shellConfig.typography.missionTextLayout, "left");
});

test("bank surface policies survive scoped save, public/dist reload and localization", async (t) => {
  const projectRoot = await fixture(t), initial = await readEditorProject(projectRoot);
  initial.catalog.system.objectTypes.terminal.placementSurface = "water";
  initial.catalog.system.objectTypes.gateway.placementSurface = "any";
  const endpoints = structuredClone(initial.catalog.missions.map((mission) => mission.endpoints));
  await saveProjectConfigs({ ...initial, scope: "catalog", expected: initial.revisions, projectRoot });
  const reloaded = await readEditorProject(projectRoot);
  assert.equal(reloaded.catalog.system.objectTypes.terminal.placementSurface, "water");
  assert.equal(reloaded.catalog.system.objectTypes.gateway.placementSurface, "any");
  assert.deepEqual(reloaded.catalog.missions.map((mission) => mission.endpoints), endpoints);
  for (const language of ["ru", "en"]) {
    const played = await runtime(projectRoot, language);
    assert.equal(played.system.objectTypes.terminal.placementSurface, "water");
    assert.equal(played.system.objectTypes.gateway.placementSurface, "any");
    assert.equal(played.system.objectTypes.satellite.placementSurface, "any");
  }
});

test("Earth contour selection round-trips and rejects unknown variants without changing gameplay", async (t) => {
  const projectRoot = await fixture(t), before = await readEditorProject(projectRoot);
  let current = before;
  for (const id of ["decorative-2026", "classic", "decorative-2026"]) {
    await saveEarthStyleConfig({ earthStyle: { ...current.shellConfig.rendering.earth, russiaContour: id }, expected: current.revisions, projectRoot });
    current = await readEditorProject(projectRoot);
    assert.equal(current.shellConfig.rendering.earth.russiaContour, id);
    const runtimeShell = JSON.parse(await readFile(resolve(projectRoot, "dist/config/ui-shell.json"), "utf8"));
    assert.deepEqual(runtimeShell, current.shellConfig);
    assert.deepEqual(current.catalog, before.catalog);
    assert.deepEqual(current.shellConfig.states, before.shellConfig.states);
    assert.deepEqual(current.shellConfig.interaction, before.shellConfig.interaction);
    const { russiaContour: _old, ...oldStyle } = before.shellConfig.rendering.earth;
    const { russiaContour: _new, ...newStyle } = current.shellConfig.rendering.earth;
    assert.deepEqual(newStyle, oldStyle);
  }
  await assert.rejects(saveEarthStyleConfig({ earthStyle: { ...current.shellConfig.rendering.earth, russiaContour: "missing" }, expected: current.revisions, projectRoot }), /не найден/);
  assert.deepEqual((await readEditorProject(projectRoot)).shellConfig, current.shellConfig);
});

test("Earth and camera edits are independent; bank save cannot reset cameras; stale Earth saves fail", async (t) => {
  const projectRoot = await fixture(t), before = await readEditorProject(projectRoot);
  const earthStyle = { ...before.shellConfig.rendering.earth, oceanColor: "#123456" };
  const earthResult = await saveEarthStyleConfig({ earthStyle, expected: before.revisions, projectRoot });
  await assert.rejects(saveEarthStyleConfig({ earthStyle: before.shellConfig.rendering.earth, expected: before.revisions, projectRoot }), /Конфликт/);
  before.shellConfig.states.CTA.cameraView.fov = 48;
  await saveProjectConfigs({ ...before, expected: before.revisions, projectRoot });
  const current = await readEditorProject(projectRoot);
  assert.equal(current.shellConfig.rendering.earth.oceanColor, "#123456");
  assert.equal(current.shellConfig.states.CTA.cameraView.fov, 48);
  assert.equal(current.revisions.earth, earthResult.revisions.earth);
  // Even an obsolete shell attached to a bank payload is outside the bank's write scope.
  await saveProjectConfigs({ ...current, shellConfig: { invalid: true }, scope: "catalog", expected: current.revisions, projectRoot });
  assert.equal((await readEditorProject(projectRoot)).shellConfig.states.CTA.cameraView.fov, 48);
});

test("invalid configs and failed staging leave public and dist data untouched", async (t) => {
  const projectRoot = await fixture(t), before = await readEditorProject(projectRoot);
  const file = resolve(projectRoot, "public/config/mission-system.json"), old = await readFile(file, "utf8");
  const bad = structuredClone(before.catalog); bad.missions[0].id = "../invalid";
  await assert.rejects(saveProjectConfigs({ catalog: bad, shellConfig: before.shellConfig, expected: before.revisions, projectRoot }));
  assert.equal(await readFile(file, "utf8"), old);
  const distFile = resolve(projectRoot, "dist/config/mission-system.json");
  await rm(distFile); await mkdir(distFile);
  await assert.rejects(saveProjectConfigs({ ...before, expected: before.revisions, projectRoot }));
  assert.equal(await readFile(file, "utf8"), old);
  assert.ok((await readdir(resolve(projectRoot, "public/config"))).every((name) => !name.endsWith(".tmp")));
});

test("renaming a mission preserves data and removes its old files only from the active config", async (t) => {
  const projectRoot = await fixture(t), before = await readEditorProject(projectRoot);
  const oldId = before.catalog.missions[0].id; before.catalog.missions[0].id = "renamed-mission";
  const result = await saveProjectConfigs({ ...before, expected: before.revisions, projectRoot });
  assert.equal((await runtime(projectRoot)).missions[0].id, "renamed-mission");
  for (const root of ["public", "dist"]) await assert.rejects(readFile(resolve(projectRoot, root, "config/missions", `${oldId}.json`)), { code: "ENOENT" });
  assert.ok(await readFile(resolve(projectRoot, "backups/editor", result.backupId, "missions", `${oldId}.json`)));
});

test("client reads the same writable project snapshot it will save to, including cross-port fallback", async () => {
  const calls = [];
  const base = await writableProjectBase(async (url) => { calls.push(url); return { ok: true, json: async () => url.startsWith("http://localhost:4173") ? { writable: false } : { writable: true, protocolVersion: 2 } }; }, "http://localhost:4173");
  assert.equal(base, "http://127.0.0.1:4174");
  const project = await readEditorProject(root);
  const loaded = await loadEditorProject(base, async (url) => { calls.push(url); return { ok: true, json: async () => project }; });
  assert.equal(calls.at(-1), `${base}/api/editor/project`);
  assert.equal(loaded.catalog.revision, project.catalog.revision);
});

test("save shortcut commits the focused field before serializing", () => {
  const previous = globalThis.document; let committed = false;
  globalThis.document = { activeElement: { matches: () => true, blur: () => { committed = true; } } };
  try { flushEditorInput(); assert.equal(committed, true); } finally { globalThis.document = previous; }
});

test("Earth save keeps edits made during the response and remains busy until the body resolves", async () => {
  const source = await readFile(resolve(root, "src/earth-editor-main.js"), "utf8");
  const saveFunction = source.slice(source.indexOf("async function save()"), source.indexOf("\nfunction persistDraft()"));
  let releaseBody, drafted = false, cleared = false;
  const context = vm.createContext({
    saving: false, contourLoading: false, earthStyle: { oceanColor: "#111111" }, savedEarth: { oceanColor: "#000000" }, expected: { earth: "old" },
    shellConfig: Object.freeze({ rendering: Object.freeze({ earth: { oceanColor: "#000000" } }) }),
    repairEarthStyleRelations: (v) => v, structuredClone, apiBase: "http://local", draftKey: "earth", EARTH_EDITOR_SOURCE_ID: "test",
    isDirty() { return JSON.stringify(context.earthStyle) !== JSON.stringify(context.savedEarth); },
    updateStatus() {}, syncAllFields() {}, field: { setEarthStyle() {} }, publishProjectChange() {}, showNotice() {}, saveDetail: {},
    persistDraft() { drafted = true; }, clearDraft: async () => { cleared = true; },
    fetch: async () => ({ ok: true, json: () => new Promise((done) => { releaseBody = done; }) }),
  });
  vm.runInContext(saveFunction, context);
  const pending = context.save();
  await new Promise((done) => setImmediate(done));
  assert.equal(context.saving, true);
  context.earthStyle.oceanColor = "#222222";
  releaseBody({ earthStyle: { oceanColor: "#111111" }, revisions: { earth: "new" }, backupId: "backup" });
  await pending;
  assert.equal(context.earthStyle.oceanColor, "#222222");
  assert.equal(context.savedEarth.oceanColor, "#111111");
  assert.equal(context.saving, false); assert.equal(drafted, true); assert.equal(cleared, false);
});
