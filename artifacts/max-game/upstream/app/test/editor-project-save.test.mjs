import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { saveEarthStyleConfig, saveProjectConfigs } from "../src/editor-project-save.mjs";
import { parseObjectSettings } from "../src/node-settings.mjs";
import { parseUiShellConfig } from "../src/ui-shell-config.mjs";

const sourceRoot = resolve(import.meta.dirname, "..");

test("unified editor save backs up both configs and updates source plus running game", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "x-sputnik-editor-save-"));
  try {
    const publicConfig = resolve(projectRoot, "public", "config");
    const distConfig = resolve(projectRoot, "dist", "config");
    await Promise.all([mkdir(publicConfig, { recursive: true }), mkdir(distConfig, { recursive: true })]);
    const oldCatalogText = await readFile(resolve(sourceRoot, "public", "config", "missions.json"), "utf8");
    const oldShellText = await readFile(resolve(sourceRoot, "public", "config", "ui-shell.json"), "utf8");
    await Promise.all([
      writeFile(resolve(publicConfig, "missions.json"), oldCatalogText),
      writeFile(resolve(publicConfig, "ui-shell.json"), oldShellText),
      writeFile(resolve(distConfig, "missions.json"), oldCatalogText),
      writeFile(resolve(distConfig, "ui-shell.json"), oldShellText),
    ]);

    const catalog = JSON.parse(oldCatalogText);
    const shellConfig = JSON.parse(oldShellText);
    catalog.missions[0].name = "НОВАЯ ВЕРСИЯ";
    catalog.objectSettings.terminal.size = 1.5;
    catalog.objectSettings.satellite.radiusAtMinAltitude = 0.5;
    catalog.objectSettings.satellite.radiusAtMaxAltitude = 1.2;
    catalog.objectSettings["endpoint:B"].size = 2;
    shellConfig.states.CTA.cameraView.rotation[2] = 0.25;
    shellConfig.states.CTA.cameraView.target[0] = 0.5;
    shellConfig.states.CTA.cameraView.fov = 46;
    shellConfig.interaction.earthOrbit.limitsDegrees.west = 42;
    shellConfig.interaction.earthOrbit.centerRussia = false;
    shellConfig.typography = { missionTextLayout: "justify" };
    const now = new Date("2026-09-04T12:34:56.789Z");
    const result = await saveProjectConfigs({ catalog, shellConfig, projectRoot, now });

    const savedCatalog = JSON.parse(await readFile(resolve(publicConfig, "missions.json"), "utf8"));
    const runtimeCatalog = JSON.parse(await readFile(resolve(distConfig, "missions.json"), "utf8"));
    const savedShell = JSON.parse(await readFile(resolve(publicConfig, "ui-shell.json"), "utf8"));
    const runtimeShell = JSON.parse(await readFile(resolve(distConfig, "ui-shell.json"), "utf8"));
    assert.equal(savedCatalog.missions[0].name, "НОВАЯ ВЕРСИЯ");
    assert.deepEqual(savedCatalog.objectSettings, parseObjectSettings(catalog.objectSettings));
    assert.deepEqual(runtimeCatalog, savedCatalog);
    assert.equal(savedShell.states.CTA.cameraView.rotation[2], 0.25);
    assert.equal(savedShell.states.CTA.cameraView.target[0], 0.5);
    assert.equal(savedShell.states.CTA.cameraView.fov, 46);
    assert.equal(savedShell.interaction.earthOrbit.limitsDegrees.west, 42);
    assert.equal(savedShell.interaction.earthOrbit.centerRussia, false);
    assert.equal(savedShell.typography.missionTextLayout, "justify");
    assert.deepEqual(runtimeShell, savedShell);

    const backupRoot = resolve(projectRoot, "backups", "editor", result.backupId);
    assert.equal(await readFile(resolve(backupRoot, "missions.json"), "utf8"), oldCatalogText);
    assert.equal(await readFile(resolve(backupRoot, "ui-shell.json"), "utf8"), oldShellText);
    const manifest = JSON.parse(await readFile(resolve(backupRoot, "manifest.json"), "utf8"));
    assert.equal(manifest.createdAt, now.toISOString());
    savedShell.rendering.earth.oceanColor = "#112233";
    await Promise.all([
      writeFile(resolve(publicConfig, "ui-shell.json"), `${JSON.stringify(savedShell, null, 2)}\n`),
      writeFile(resolve(distConfig, "ui-shell.json"), `${JSON.stringify(savedShell, null, 2)}\n`),
    ]);
    shellConfig.rendering.earth.oceanColor = "#abcdef";
    delete catalog.objectSettings;
    delete shellConfig.typography;
    await saveProjectConfigs({ catalog, shellConfig, projectRoot, now: new Date(now.getTime() + 1000) });
    const legacySave = JSON.parse(await readFile(resolve(publicConfig, "missions.json"), "utf8"));
    assert.deepEqual(legacySave.objectSettings, savedCatalog.objectSettings, "Старая вкладка редактора не должна стирать новые настройки объектов");
    const preservedShell = JSON.parse(await readFile(resolve(publicConfig, "ui-shell.json"), "utf8"));
    assert.equal(preservedShell.typography.missionTextLayout, "justify", "Старая вкладка сохраняет выбранный вид текста");
    assert.equal(preservedShell.rendering.earth.oceanColor, "#112233", "Редактор миссий не должен стирать Earth-профиль из отдельной страницы");
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("earth editor updates only the visual profile and creates its own backup", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "x-sputnik-earth-save-"));
  try {
    const publicConfig = resolve(projectRoot, "public", "config");
    const distConfig = resolve(projectRoot, "dist", "config");
    await Promise.all([mkdir(publicConfig, { recursive: true }), mkdir(distConfig, { recursive: true })]);
    const shellText = await readFile(resolve(sourceRoot, "public", "config", "ui-shell.json"), "utf8");
    await writeFile(resolve(publicConfig, "earth-contours.json"), await readFile(resolve(sourceRoot, "public/config/earth-contours.json")));
    await Promise.all([
      writeFile(resolve(publicConfig, "ui-shell.json"), shellText),
      writeFile(resolve(distConfig, "ui-shell.json"), shellText),
    ]);
    const before = JSON.parse(shellText);
    const earthStyle = structuredClone(before.rendering.earth);
    earthStyle.oceanColor = "#334455";
    earthStyle.cloudOpacity = 0.27;
    earthStyle.cityLightsCoreStart = 0.9;
    earthStyle.cityLightsHotPoint = 0.2;
    const now = new Date("2026-09-06T10:20:30.000Z");
    const result = await saveEarthStyleConfig({ earthStyle, projectRoot, now });
    const saved = JSON.parse(await readFile(resolve(publicConfig, "ui-shell.json"), "utf8"));
    const runtime = JSON.parse(await readFile(resolve(distConfig, "ui-shell.json"), "utf8"));
    assert.equal(saved.rendering.earth.oceanColor, "#334455");
    assert.equal(saved.rendering.earth.cloudOpacity, 0.27);
    assert.equal(saved.rendering.earth.cityLightsCoreStart, 0.9);
    assert.equal(saved.rendering.earth.cityLightsHotPoint, 0.9, "Сервер должен безопасно подвинуть зависимый порог, а не блокировать сохранение");
    assert.deepEqual(result.earthStyle, saved.rendering.earth, "Клиент должен получить обратно ровно сохранённый сервером профиль");
    assert.deepEqual(saved.states, before.states, "Визуальный редактор не должен менять ракурсы");
    assert.deepEqual(saved.interaction, parseUiShellConfig(before).interaction, "Визуальный редактор сохраняет управление с актуальными значениями по умолчанию");
    assert.deepEqual(saved.typography, parseUiShellConfig(before).typography);
    assert.deepEqual(runtime, saved);
    assert.equal(await readFile(resolve(projectRoot, "backups", "earth-style", result.backupId, "ui-shell.json"), "utf8"), shellText);
    const manifest = JSON.parse(await readFile(resolve(projectRoot, "backups", "earth-style", result.backupId, "manifest.json"), "utf8"));
    assert.equal(manifest.reason, "earth-style-save");
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});
