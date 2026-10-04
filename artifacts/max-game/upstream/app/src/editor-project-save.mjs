import { copyFile, mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { loadMissionCatalog, parseMissionCatalog, serializeMissionCatalog } from "./mission-config.mjs";
import { parseUiShellConfig, repairEarthStyleRelations } from "./ui-shell-config.mjs";
import { parseEarthContours, earthContourById } from "./earth-contours.mjs";

import { parseWording } from "./wording.mjs";
import { catalogForEditing, syncCatalogWording } from "./editor-content.mjs";

const CONFIG_FILES = ["missions.json", "ui-shell.json"];
let writeQueue = Promise.resolve();

export function saveProjectConfigs(options) {
  const task = writeQueue.then(() => options.catalog?.schemaVersion === 2 ? saveBundle(options) : saveLegacy(options));
  writeQueue = task.catch(() => undefined);
  return task;
}

export function saveEarthStyleConfig(options) {
  const task = writeQueue.then(() => saveEarthStyle(options));
  writeQueue = task.catch(() => undefined);
  return task;
}

async function saveLegacy({ catalog, shellConfig, projectRoot, now = new Date() }) {
  const currentIndex = await readFile(resolve(projectRoot, "public/config/missions/index.json"), "utf8").catch(() => null);
  if (currentIndex) throw new Error("Проект обновлён до v2. Обновите редактор: старая вкладка не может перезаписать новую структуру.");
  const publicConfigRoot = resolve(projectRoot, "public", "config");
  const distConfigRoot = resolve(projectRoot, "dist", "config");
  const backupId = backupTimestamp(now);
  const backupRoot = resolve(projectRoot, "backups", "editor", backupId);
  const previous = await Promise.all(CONFIG_FILES.map((name) => readFile(resolve(publicConfigRoot, name), "utf8")));
  const normalizedCatalog = serializeMissionCatalog(parseMissionCatalog({
    ...catalog,
    objectSettings: catalog?.objectSettings === undefined ? JSON.parse(previous[0]).objectSettings : catalog.objectSettings,
  }));
  const currentShell = JSON.parse(previous[1]);
  const normalizedShell = serializeUiShellConfig(parseUiShellConfig({
    ...shellConfig,
    typography: shellConfig.typography ?? currentShell.typography,
    rendering: { ...shellConfig.rendering, earth: currentShell.rendering?.earth },
  }));

  await mkdir(backupRoot, { recursive: true });
  await Promise.all(CONFIG_FILES.map((name, index) => writeFile(resolve(backupRoot, name), previous[index], "utf8")));
  await writeFile(resolve(backupRoot, "manifest.json"), `${JSON.stringify({
    createdAt: now.toISOString(),
    files: CONFIG_FILES,
    reason: "editor-save",
  }, null, 2)}\n`, "utf8");

  const next = {
    "missions.json": `${JSON.stringify(normalizedCatalog, null, 2)}\n`,
    "ui-shell.json": `${JSON.stringify(normalizedShell, null, 2)}\n`,
  };
  await mkdir(distConfigRoot, { recursive: true });

  try {
    await Promise.all(CONFIG_FILES.flatMap((name) => [
      writeFile(resolve(publicConfigRoot, name), next[name], "utf8"),
      writeFile(resolve(distConfigRoot, name), next[name], "utf8"),
    ]));
  } catch (error) {
    await Promise.all(CONFIG_FILES.flatMap((name) => [
      copyFile(resolve(backupRoot, name), resolve(publicConfigRoot, name)),
      copyFile(resolve(backupRoot, name), resolve(distConfigRoot, name)),
    ])).catch(() => undefined);
    throw error;
  }

  return { backupId, files: CONFIG_FILES };
}

export function readEditorProject(projectRoot) {
  return enqueue(() => readProject(projectRoot));
}

export function saveWordingConfig(options) {
  return enqueue(() => saveWording(options));
}

function enqueue(operation) {
  const task = writeQueue.then(operation);
  writeQueue = task.catch(() => undefined);
  return task;
}

const encode = (value) => `${JSON.stringify(value, null, 2)}\n`;
const fingerprint = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
function revisionsFor(shell, wording) {
  const cameraShell = structuredClone(shell);
  delete cameraShell.rendering.earth;
  return { shell: fingerprint(cameraShell), earth: fingerprint(shell.rendering.earth), wording: fingerprint(wording) };
}
function assertRevision(expected, actual, domain) {
  if (expected !== undefined && expected !== actual) {
    const error = new Error(`Конфликт версии (${domain}): данные уже изменены. Перечитайте проект; текущие правки можно экспортировать или восстановить из черновика.`);
    error.status = 409;
    throw error;
  }
}
async function readOptional(path) {
  return readFile(path, "utf8").catch((error) => { if (error.code === "ENOENT") return null; throw error; });
}
async function readProject(projectRoot) {
  const configRoot = resolve(projectRoot, "public/config");
  const catalog = await loadMissionCatalog("./missions/index.json", async (path) => {
    const value = await readFile(resolve(configRoot, path), "utf8");
    return { ok: true, json: async () => JSON.parse(value) };
  });
  const shellConfig = serializeUiShellConfig(parseUiShellConfig(JSON.parse(await readFile(resolve(configRoot, "ui-shell.json"), "utf8"))));
  const wordingText = await readOptional(resolve(configRoot, "wording.json"));
  const wording = wordingText ? JSON.parse(wordingText) : null;
  return { catalog: catalogForEditing(serializeMissionCatalog(catalog), wording), shellConfig, wording, revisions: revisionsFor(shellConfig, wording) };
}

async function saveBundle({ catalog, shellConfig, projectRoot, expected = {}, scope = "project", now = new Date() }) {
  const currentProject = await readProject(projectRoot);
  assertRevision(catalog.revision, currentProject.catalog.revision, "миссии и банк");
  assertRevision(expected.wording, currentProject.revisions.wording, "тексты");
  if (scope !== "catalog") assertRevision(expected.shell, currentProject.revisions.shell, "ракурсы");
  const parsed = serializeMissionCatalog(catalog);
  const shell = scope === "catalog" ? currentProject.shellConfig : serializeUiShellConfig(parseUiShellConfig({
    ...shellConfig,
    typography: shellConfig.typography ?? currentProject.shellConfig.typography,
    rendering: { ...shellConfig.rendering, earth: currentProject.shellConfig.rendering.earth },
  }));
  const wording = currentProject.wording ? syncCatalogWording(parsed, currentProject.catalog, currentProject.wording) : null;
  if (wording) parseWording(wording);
  const revision = randomUUID();
  const next = new Map([
    ["mission-system.json", encode({ $schema: "./mission-system.schema.json", ...parsed.system, _revision: revision })],
    ["ui-shell.json", encode(shell)],
    ...parsed.missions.map((m) => [`missions/${m.id}.json`, encode({ $schema: "../mission-v2.schema.json", ...m, _revision: revision })]),
  ]);
  if (wording) next.set("wording.json", encode(wording));
  for (const old of currentProject.catalog.missions) if (!parsed.missions.some((m) => m.id === old.id)) next.set(`missions/${old.id}.json`, null);
  // Publish the index last, after every member of this revision is ready.
  next.set("missions/index.json", encode({ schemaVersion: 2, revision, files: parsed.missions.map((m) => `${m.id}.json`) }));
  const result = await writeConfigTransaction({ projectRoot, next, now, category: "editor", reason: "editor-save-v2", revision });
  return { ...result, revision, revisions: revisionsFor(shell, wording), translationReview: wording?.translationReview || [] };
}

async function saveEarthStyle({ earthStyle, projectRoot, expected = {}, now = new Date() }) {
  const shell = serializeUiShellConfig(parseUiShellConfig(JSON.parse(await readFile(resolve(projectRoot, "public/config/ui-shell.json"), "utf8"))));
  assertRevision(expected.earth, fingerprint(shell.rendering.earth), "профиль Земли");
  const normalized = serializeUiShellConfig(parseUiShellConfig({ ...shell, rendering: { ...shell.rendering, earth: repairEarthStyleRelations(earthStyle) } }));
  const contours = parseEarthContours(JSON.parse(await readFile(resolve(projectRoot, "public/config/earth-contours.json"), "utf8")));
  earthContourById(contours, normalized.rendering.earth.russiaContour);
  const revision = randomUUID();
  const result = await writeConfigTransaction({ projectRoot, next: new Map([["ui-shell.json", encode(normalized)]]), now, category: "earth-style", reason: "earth-style-save", revision });
  return { ...result, revision, revisions: { earth: fingerprint(normalized.rendering.earth) }, earthStyle: structuredClone(normalized.rendering.earth) };
}

async function saveWording({ wording, expected = {}, projectRoot, now = new Date() }) {
  const current = await readProject(projectRoot);
  assertRevision(expected.wording, current.revisions.wording, "тексты");
  parseWording(wording);
  // Existing keys are referenced by the player. This editor changes phrases, not key identities.
  for (const key of Object.keys(current.wording.entries)) if (!Object.hasOwn(wording.entries, key)) throw new Error(`Нельзя удалить используемый ключ ${key}`);
  const revision = randomUUID();
  const result = await writeConfigTransaction({ projectRoot, next: new Map([["wording.json", encode(wording)]]), now, category: "wording", reason: "wording-save", revision });
  return { ...result, revision, revisions: { wording: fingerprint(wording) } };
}

async function writeConfigTransaction({ projectRoot, next, now, category, reason, revision }) {
  const backupId = `${backupTimestamp(now)}-${revision.slice(0, 8)}`;
  const backupRoot = resolve(projectRoot, "backups", category, backupId);
  const roots = [resolve(projectRoot, "public/config"), resolve(projectRoot, "dist/config")];
  const staged = [], published = [];
  await mkdir(backupRoot, { recursive: true });
  for (const [name, content] of next) for (const [index, root] of roots.entries()) {
    const path = resolve(root, name);
    const previous = await readOptional(path);
    const backup = resolve(backupRoot, index === 0 ? "" : "dist", name);
    if (previous !== null) { await mkdir(dirname(backup), { recursive: true }); await writeFile(backup, previous); }
    staged.push({ path, previous, content, temporary: `${path}.${revision}.tmp` });
  }
  await writeFile(resolve(backupRoot, "manifest.json"), encode({ createdAt: now.toISOString(), files: [...next.keys()], reason, absent: staged.filter((item) => item.previous === null).map((item) => item.path.slice(projectRoot.length + 1)) }));
  try {
    for (const item of staged) if (item.content !== null) {
      await mkdir(dirname(item.path), { recursive: true });
      await writeFile(item.temporary, item.content, { flag: "wx" });
    }
    for (const item of staged) {
      if (item.content === null) await rm(item.path, { force: true });
      else await rename(item.temporary, item.path);
      published.push(item);
    }
  } catch (error) {
    const failures = [];
    for (const item of published.reverse()) {
      try { if (item.previous === null) await rm(item.path, { force: true }); else await writeFile(item.path, item.previous); }
      catch (failure) { failures.push(failure.message); }
    }
    if (failures.length) throw new Error(`Запись и откат не завершены. Восстановите backup ${backupId}: ${failures.join("; ")}`);
    throw error;
  } finally {
    await Promise.all(staged.map(({ temporary }) => rm(temporary, { force: true }).catch(() => undefined)));
  }
  return { backupId, files: [...next.keys()] };
}

function serializeUiShellConfig(config) {
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

function backupTimestamp(value) {
  return value.toISOString().replaceAll(":", "-").replace(".", "-");
}
