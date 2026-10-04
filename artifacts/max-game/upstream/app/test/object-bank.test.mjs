import assert from "node:assert/strict";
import test from "node:test";
import { readFile, cp, mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { loadMissionCatalog, parseMissionCatalog, serializeMissionCatalog } from "../src/mission-config.mjs";
import { toEditableCatalog, createHistory, commitHistory, undoHistory, redoHistory } from "../src/editor-state.mjs";
import { applyEquipmentDefaults, commonEquipmentSettings, createBankEntry, removeBankEntry, setBankSvg, setEquipmentCount, chooseEquipmentSet, missionInventory } from "../src/object-bank.mjs";
import { renderBankList, renderBankDetail, renderEquipmentDefaults, renderMissionEquipment } from "../src/object-bank-view.mjs";
import { iconPicker } from "../src/editor-object-catalog.mjs";
import { renderSystemInspector } from "../src/editor-mission-system.js";
import { saveProjectConfigs } from "../src/editor-project-save.mjs";
import { writableProjectBase } from "../src/project-editor-client.mjs";
import { configureMissions, createMissionRun, availableCount } from "../src/mission-game.mjs";
import { missionCatalog as legacy } from "./config-fixture.mjs";
const root = resolve(import.meta.dirname, "..");
const diskFetch = (directory) => async (p) => ({ ok: true, json: async () => JSON.parse(await readFile(resolve(directory, p), "utf8")) });
const catalog = await loadMissionCatalog("./config/missions/index.json", diskFetch(resolve(root, "public")));
const editable = () => toEditableCatalog(catalog);
const svg = '<svg viewBox="0 0 10 10"><path d="M1 1H9V9H1Z"/></svg>';

test("three equipment sets supply each mission's current route inventory", () => {
  assert.equal(Object.keys(catalog.system.equipmentSets).length, 3);
  for (const mission of catalog.missions) {
    assert.ok(mission.equipmentSet);
    assert.deepEqual(mission.inventory, catalog.system.equipmentSets[mission.equipmentSet].inventory);
    const steps = mission.topology.paths[0].steps;
    for (const [type, count] of Object.entries(mission.inventory)) assert.equal(count, steps.filter((step) => step.type === type).length);
  }
});

test("one shared set supplies multiple missions and is the only serialized inventory source", () => {
  const raw = editable();
  createBankEntry(raw, "sets", "shared", "set-3");
  for (const type of Object.keys(raw.system.objectTypes)) setEquipmentCount(raw, "shared", type, 10);
  chooseEquipmentSet(raw, 0, "shared"); chooseEquipmentSet(raw, 1, "shared");
  setEquipmentCount(raw, "shared", "terminal", 12);
  // Cached editor inventory deliberately differs: the reference must win.
  raw.missions[0].inventory.terminal = 99;
  const parsed = parseMissionCatalog(raw), saved = serializeMissionCatalog(parsed);
  assert.equal(parsed.missions[0].inventory.terminal, 12);
  assert.equal(parsed.missions[1].inventory.terminal, 12);
  assert.equal(saved.missions[0].inventory, undefined);
  assert.equal(saved.missions[0].equipmentSet, "shared");
  assert.equal(parseMissionCatalog(saved).missions[0].inventory.terminal, 12);
  try { configureMissions(parsed); assert.equal(availableCount(createMissionRun(1), "terminal"), 12); }
  finally { configureMissions(legacy); }
});

test("detaching from a set copies the current composition; cloning a set does not clone objects", () => {
  const raw = editable(), count = Object.keys(raw.system.objectTypes).length;
  createBankEntry(raw, "sets", "copy", "set-1");
  setEquipmentCount(raw, "copy", "terminal", 4);
  assert.equal(raw.system.equipmentSets["set-1"].inventory.terminal, 1);
  assert.equal(Object.keys(raw.system.objectTypes).length, count);
  chooseEquipmentSet(raw, 0, "copy"); chooseEquipmentSet(raw, 0, "");
  assert.equal(raw.missions[0].equipmentSet, undefined);
  assert.equal(raw.missions[0].inventory.terminal, 4);
  setEquipmentCount(raw, "copy", "terminal", 8);
  assert.equal(missionInventory(raw, raw.missions[0]).terminal, 4);
  assert.throws(() => setEquipmentCount(raw, "copy", "terminal", 1.5), /целым/);
});

test("fixed-point bank stays separate and replacing an object SVG does not mutate shared icons", () => {
  const raw = editable();
  createBankEntry(raw, "icons", "city"); setBankSvg(raw, "icons", "city", svg);
  raw.missions[0].endpoints.A.icon = "city";
  createBankEntry(raw, "objects", "city-relay"); raw.system.objectTypes["city-relay"].icon = "city";
  const old = raw.system.icons.city.svg;
  setBankSvg(raw, "objects", "city-relay", '<svg><circle cx="5" cy="5" r="4"/></svg>');
  assert.equal(raw.system.icons.city.svg, old);
  assert.notEqual(raw.system.objectTypes["city-relay"].icon, "city");
  assert.equal(raw.system.pointIcons.includes(raw.system.objectTypes["city-relay"].icon), false);
  const picker = iconPicker(raw, ["missions", 0, "endpoints", "A", "icon"], "city", true);
  assert.match(picker, /value="city"/); assert.doesNotMatch(picker, /value="terminal"/);
  assert.doesNotMatch(picker, /Только подпись/);
  assert.doesNotMatch(picker, /type="file"/);
  assert.throws(() => removeBankEntry(raw, "icons", "city"), /используется/);
  createBankEntry(raw, "icons", "unused-city", "city"); removeBankEntry(raw, "icons", "unused-city");
  assert.equal(raw.system.icons["unused-city"], undefined);
});

test("bank deletion and validation cannot leave broken set, object or mission references", () => {
  const raw = editable();
  assert.throws(() => removeBankEntry(raw, "sets", "set-1"), /используется/);
  assert.throws(() => removeBankEntry(raw, "objects", "terminal"), /наборе/);
  assert.throws(() => createBankEntry(raw, "sets", "__proto__"), /ID/);
  const broken = structuredClone(raw); broken.missions[0].equipmentSet = "missing";
  assert.throws(() => parseMissionCatalog(broken), /неизвестный набор/);
  setEquipmentCount(raw, "set-1", "terminal", 0);
  assert.throws(() => parseMissionCatalog(raw), /уникальных ролей/);
});

test("bank forms have separate equipment, point SVG and set editors; missions only select", async () => {
  const raw = editable();
  const objectDetail = renderBankDetail(raw, "objects", "terminal");
  const pointDetail = renderBankDetail(raw, "icons", "point-a");
  const setDetail = renderBankDetail(raw, "sets", "set-1");
  assert.match(objectDetail, /SVG оборудования/);
  assert.match(objectDetail, /data-command="apply-equipment-defaults"/);
  assert.match(objectDetail, /data-equipment-default="size"/);
  assert.match(objectDetail, /data-bank-field="\[&quot;system&quot;,&quot;objectTypes&quot;,&quot;terminal&quot;,&quot;short&quot;\]"/);
  assert.doesNotMatch(objectDetail, /Надпись на карточке|&quot;label&quot;\]/);
  assert.match(pointDetail, /не игровое оборудование/);
  assert.match(pointDetail, /Название в банке/);
  const stageStart = pointDetail.indexOf('<div class="icon-stage">');
  const pointStage = pointDetail.slice(stageStart, pointDetail.indexOf("</div>", stageStart));
  assert.doesNotMatch(pointStage, /<strong|<p/);
  assert.match(setDetail, /data-set-count="terminal"/);
  assert.doesNotMatch(setDetail, /set-member[^>]*>[\s\S]*?<small/);
  assert.match(renderMissionEquipment(raw, 0), /set-1/);
  assert.match(renderBankList(raw, "objects", "terminal", "терминал"), /terminal/);
  assert.doesNotMatch(renderBankList(raw, "icons", "point-a"), /терминал/);
  const inspector = renderSystemInspector(raw, 0);
  assert.doesNotMatch(inspector, /data-v2-action="add-type"|data-icon-upload/);
  assert.match(inspector, /object.html/);
  const page = await readFile(resolve(root, "object.html"), "utf8");
  assert.match(page, /data-section="objects"/); assert.match(page, /data-section="icons"/); assert.match(page, /data-section="sets"/);
  assert.match(page, /object-bank\.css\?v=[\w-]+/);
  assert.match(page, /objects\.js\?v=[\w-]+/);
  assert.doesNotMatch(page, /<canvas/);
});

test("common equipment size and signal radius apply to every type without erasing mission overrides", () => {
  const raw = editable();
  const missionOverrides = structuredClone(raw.missions.map((mission) => mission.objectSettings));
  applyEquipmentDefaults(raw, { size: 1.35, signalRadius: 0.91 });
  for (const [id, type] of Object.entries(raw.system.objectTypes)) {
    assert.equal(raw.system.objectSettings[id].size, 1.35);
    assert.equal(raw.system.objectSettings[id].signalRadius, 0.91);
    if (type.behavior === "orbital") {
      assert.equal(raw.system.objectSettings[id].radiusAtMinAltitude, 0.91);
      assert.equal(raw.system.objectSettings[id].radiusAtMaxAltitude, 0.91);
    }
  }
  assert.deepEqual(raw.missions.map((mission) => mission.objectSettings), missionOverrides);
  assert.deepEqual(commonEquipmentSettings(raw), { size: 1.35, signalRadius: 0.91 });
  assert.match(renderEquipmentDefaults(raw), /сейчас 1.35/);
  createBankEntry(raw, "objects", "relay");
  assert.equal(raw.system.objectSettings.relay.size, 1.35);
  assert.equal(raw.system.objectSettings.relay.signalRadius, 0.91);
  assert.throws(() => applyEquipmentDefaults(raw, { size: 0 }), /больше нуля/);
});

test("equipment set edits and new bank entries participate in undo and redo", () => {
  const raw = editable(), history = createHistory(raw);
  createBankEntry(raw, "objects", "relay"); createBankEntry(raw, "sets", "custom"); setEquipmentCount(raw, "custom", "relay", 3);
  const changed = commitHistory(history, raw);
  assert.equal(undoHistory(changed).present.system.equipmentSets.custom, undefined);
  assert.equal(redoHistory(undoHistory(changed)).present.system.equipmentSets.custom.inventory.relay, 3);
});

test("bank save writes sets and point icons with backup and prevents a stale mission-editor overwrite", async () => {
  const directory = await mkdtemp(join(tmpdir(), "x-sputnik-bank-"));
  try {
    await cp(resolve(root, "public/config"), resolve(directory, "public/config"), { recursive: true });
    await cp(resolve(root, "public/config"), resolve(directory, "dist/config"), { recursive: true });
    const raw = editable(), stale = editable();
    createBankEntry(raw, "icons", "new-city"); setBankSvg(raw, "icons", "new-city", svg);
    setEquipmentCount(raw, "set-1", "terminal", 2);
    const shellConfig = JSON.parse(await readFile(resolve(root, "public/config/ui-shell.json"), "utf8"));
    const before = await readFile(resolve(directory, "public/config/mission-system.json"), "utf8");
    const saved = await saveProjectConfigs({ catalog: raw, shellConfig, projectRoot: directory });
    await assert.rejects(saveProjectConfigs({ catalog: stale, shellConfig, projectRoot: directory }), /Конфликт версии/);
    const loaded = await loadMissionCatalog("./config/missions/index.json", diskFetch(resolve(directory, "dist")));
    assert.equal(loaded.missions[0].inventory.terminal, 2);
    assert.equal(loaded.system.pointIcons.includes("new-city"), true);
    assert.equal(await readFile(resolve(directory, "backups/editor", saved.backupId, "mission-system.json"), "utf8"), before);
    const missionFile = JSON.parse(await readFile(resolve(directory, "public/config/missions/first-signal.json"), "utf8"));
    assert.equal(missionFile.inventory, undefined);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("standalone bank refuses static HTML health checks and selects the writable project server", async () => {
  const calls = [];
  const fetchImpl = async (url) => { calls.push(url); return { ok: true, json: async () => { if (url.includes(":4173")) throw new Error("HTML, not JSON"); return { writable: true, protocolVersion: 2 }; } }; };
  assert.equal(await writableProjectBase(fetchImpl, "http://127.0.0.1:4173"), "http://127.0.0.1:4174");
  assert.equal(calls.length, 2);
});
