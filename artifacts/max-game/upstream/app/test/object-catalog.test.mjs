import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdtemp, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { BoxGeometry } from "three";
import { DEFAULT_ICONS, parseObjectCatalog, validateIconSvg, iconSource } from "../src/object-catalog.mjs";
import { loadMissionCatalog, parseMissionCatalog, serializeMissionCatalog } from "../src/mission-config.mjs";
import { toEditableCatalog, appendMission, createHistory, commitHistory, undoHistory, redoHistory } from "../src/editor-state.mjs";
import { importCatalogIcon, applyCatalogAction, changeTypeBehavior } from "../src/editor-object-catalog.mjs";
import { renderSystemInspector, renderTopology, changeSystemField } from "../src/editor-mission-system.js";
import { configureMissions, createMissionRun, reduceMission, ITEM_TYPES, pointIconSource, isOrbitalType, signalRadiusFor, deriveNetwork } from "../src/mission-game.mjs";
import { createNode, nodeStemHeight, updateNodeTransform, satelliteAltitudeFromPointer } from "../src/webgl-field.js";
import { saveProjectConfigs } from "../src/editor-project-save.mjs";
import { missionCatalog as legacy } from "./config-fixture.mjs";

const root = resolve(import.meta.dirname, "..");
const diskFetch = (directory) => async (p) => ({ ok: true, json: async () => JSON.parse(await readFile(resolve(directory, p), "utf8")) });
const catalog = await loadMissionCatalog("./config/missions/index.json", diskFetch(resolve(root, "public")));
const svg = '<svg viewBox="0 0 24 24"><path d="M2 2H22V22H2Z" fill="black"/></svg>';
const editable = () => toEditableCatalog(catalog);

test("shared icon library accepts safe vectors and rejects executable, raster and external SVG", () => {
  const normalized = validateIconSvg(svg);
  assert.match(normalized, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(normalized, /fill="#ffffff"/);
  assert.equal(validateIconSvg(normalized), normalized);
  assert.match(iconSource({ svg: normalized }), /^data:image\/svg\+xml/);
  for (const unsafe of [
    '<svg><script>alert(1)</script></svg>', '<svg onload="alert(1)"><path d="M0 0L1 1"/></svg>',
    '<svg><image href="https://example.com/a.png"/></svg>', '<svg><use href="#a"/></svg>',
    '<svg><path fill="url(https://example.com)"/></svg>', '<svg><foreignObject/></svg>',
    '<svg><text>Hello</text></svg>', '<svg><g><path/></svg>', '<!DOCTYPE svg><svg><path/></svg>',
    '<svg><path style="fill:red"/></svg>', '<svg><path d="&evil;"/></svg>',
    '<svg><path/></svg><svg><path/></svg>',
  ]) assert.throws(() => validateIconSvg(unsafe), /SVG/);
  assert.throws(() => validateIconSvg(" ".repeat(131073)), /128/);
  assert.throws(() => parseObjectCatalog({ icons: { bad: { label: "Bad", src: "../../secret.svg" } } }), /внешние пути/);
});

test("catalog CRUD and arbitrary bank-backed point icons round-trip through history and editor forms", () => {
  const raw = editable();
  applyCatalogAction(raw, "add-type", ["system", "objectTypes"], "relay");
  changeSystemField(raw, ["system", "objectTypes", "relay", "short"], 'РЕЛЕ <"1">');
  assert.equal(raw.system.objectTypes.relay.label, 'РЕЛЕ <"1">');
  const icon = importCatalogIcon(raw, ["system", "objectTypes", "relay", "icon"], svg, "Моя иконка");
  raw.missions[0].endpoints.A.icon = icon;
  raw.missions[0].endpoints.A.label = "Западный порт";
  const roundTrip = serializeMissionCatalog(parseMissionCatalog(raw));
  assert.equal(roundTrip.system.objectTypes.relay.icon, icon);
  assert.equal(roundTrip.system.icons[icon].svg, validateIconSvg(svg));
  assert.equal(roundTrip.missions[0].endpoints.A.label, "");
  assert.equal(roundTrip.missions[0].endpoints.A.icon, icon);
  assert.match(renderSystemInspector(raw, 0), /Открыть банк объектов/);
  assert.doesNotMatch(renderSystemInspector(raw, 0), /data-v2-action="add-type"/);
  assert.match(renderSystemInspector(raw, 0), /РЕЛЕ &lt;&quot;1&quot;&gt;/);
  assert.match(renderTopology(raw, 0), /value="relay"/);
  let history = createHistory(editable()); history = commitHistory(history, raw);
  assert.equal(undoHistory(history).present.system.objectTypes.relay, undefined);
  assert.equal(redoHistory(undoHistory(history)).present.system.objectTypes.relay.icon, icon);
  applyCatalogAction(raw, "duplicate-type", ["system", "objectTypes", "relay"], "relay-copy");
  assert.deepEqual(raw.system.objectSettings["relay-copy"], raw.system.objectSettings.relay);
  applyCatalogAction(raw, "delete-type", ["system", "objectTypes", "relay-copy"]);
  assert.equal(raw.system.objectTypes["relay-copy"], undefined);
  assert.throws(() => applyCatalogAction(raw, "delete-type", ["system", "objectTypes", "terminal"]), /используется/);
  assert.throws(() => applyCatalogAction(raw, "add-type", ["system", "objectTypes"], "__proto__"), /ID/);
});

function customMission(behavior = "ground") {
  const raw = editable(); raw.missions = [raw.missions[0]];
  raw.system.equipmentSets = {};
  delete raw.missions[0].equipmentSet;
  raw.system.objectTypes = { relay: { label: "Новое реле", short: "РЕЛЕ", icon: "core", behavior } };
  raw.system.objectSettings = { relay: { size: 1.5, signalRadius: 2, ...(behavior === "orbital" ? { minAltitude: 0.4, maxAltitude: 2, defaultAltitude: 0.8, radiusAtMinAltitude: 1, radiusAtMaxAltitude: 3 } : {}) }, "endpoint:A": { size: 1, signalRadius: 0.3 }, "endpoint:B": { size: 1, signalRadius: 0.3 } };
  const m = raw.missions[0];
  m.endpoints = { source: { label: "Начало", icon: "terminal", latitude: 0, longitude: 0 }, city: { label: "", icon: "internet", latitude: 0, longitude: 10 } };
  m.inventory = { relay: 1 }; m.topology = { paths: [{ id: "delivery", from: "source", to: "city", steps: [{ role: "relay-role", type: "relay" }] }] };
  m.objectSettings = {}; m.unlock.requiresCompleted = [];
  m.objectives = [{ id: "placed", label: "Разместить реле", condition: { type: "placed", object: "relay", count: 1 } }];
  m.completion = { type: "allPaths" };
  return raw;
}

test("game completes a route of a new type with non-A/B icon-only endpoints", () => {
  try {
    configureMissions(parseMissionCatalog(customMission()));
    assert.deepEqual(Object.keys(ITEM_TYPES), ["relay"]);
    assert.equal(ITEM_TYPES.relay.short, "РЕЛЕ");
    assert.equal(pointIconSource({ icon: "internet" }), DEFAULT_ICONS.internet.src);
    let run = createMissionRun(1);
    run = reduceMission(run, { type: "PLACE", item: "relay", latitude: 0, longitude: 5, now: 0 });
    assert.equal(deriveNetwork(run, 1000).complete, true);
    assert.equal(reduceMission(run, { type: "CHECK", now: 1000 }).status, "complete");
    assert.equal(nodeStemHeight("relay"), 0.23);
  } finally { configureMissions(legacy); }
});

test("new orbital types use their own height limits, coverage curve and vector marker", () => {
  try {
    const raw = customMission("orbital"); configureMissions(parseMissionCatalog(raw));
    let run = createMissionRun(1);
    run = reduceMission(run, { type: "PLACE", item: "relay", latitude: 0, longitude: 5, altitude: 99, now: 0 });
    assert.equal(run.placements[0].altitude, 2);
    assert.equal(signalRadiusFor(run.placements[0]), 3);
    assert.equal(isOrbitalType("relay"), true);
    assert.equal(nodeStemHeight("relay"), 0);
    const geometry = new BoxGeometry(.1, .1, .01);
    const node = createNode(run.placements[0], "searching", geometry);
    assert.ok(node.userData.altitudeHandle);
    assert.equal(node.scale.x, 1.5);
    updateNodeTransform(node, { ...run.placements[0], altitude: 0.4 });
    assert.equal(node.userData.signalRadius, 1);
    assert.equal(node.userData.icon.geometry, geometry);
    assert.equal(satelliteAltitudeFromPointer(0.8, 0, -10000, 1080, raw.system.objectSettings.relay), 2);
    node.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    changeTypeBehavior(raw, "relay", "ground");
    assert.equal(raw.system.objectSettings.relay.minAltitude, undefined);
    assert.doesNotThrow(() => parseMissionCatalog(raw));
  } finally { configureMissions(legacy); }
});

test("unknown icon/type references fail; new mission templates work without the five built-in types", () => {
  const raw = customMission();
  assert.doesNotThrow(() => parseMissionCatalog(appendMission(raw).catalog));
  const badPoint = structuredClone(raw); badPoint.missions[0].endpoints.city.icon = "missing";
  assert.throws(() => parseMissionCatalog(badPoint), /иконк/);
  const badType = structuredClone(raw); badType.missions[0].inventory.missing = 1;
  assert.throws(() => parseMissionCatalog(badType), /Инвентарь/);
  const badRole = structuredClone(raw); badRole.missions[0].topology.paths[0].steps[0].type = "missing";
  assert.throws(() => parseMissionCatalog(badRole), /роль/);
  const badCondition = structuredClone(raw); badCondition.missions[0].objectives[0].condition.object = "missing";
  assert.throws(() => parseMissionCatalog(badCondition), /placed/);
});

test("one save integrates custom SVG and object types into public/dist with a previous-version backup", async () => {
  const directory = await mkdtemp(join(tmpdir(), "x-sputnik-icons-"));
  try {
    await cp(resolve(root, "public/config"), resolve(directory, "public/config"), { recursive: true });
    await cp(resolve(root, "public/config"), resolve(directory, "dist/config"), { recursive: true });
    const raw = editable(); applyCatalogAction(raw, "add-type", ["system", "objectTypes"], "custom-relay");
    const icon = importCatalogIcon(raw, ["system", "objectTypes", "custom-relay", "icon"], svg, "Relay");
    const shellConfig = JSON.parse(await readFile(resolve(root, "public/config/ui-shell.json"), "utf8"));
    const before = await readFile(resolve(directory, "public/config/mission-system.json"), "utf8");
    const saved = await saveProjectConfigs({ catalog: raw, shellConfig, projectRoot: directory });
    const source = await readFile(resolve(directory, "public/config/mission-system.json"), "utf8");
    assert.equal(source, await readFile(resolve(directory, "dist/config/mission-system.json"), "utf8"));
    assert.equal(await readFile(resolve(directory, "backups/editor", saved.backupId, "mission-system.json"), "utf8"), before);
    const loaded = await loadMissionCatalog("./config/missions/index.json", diskFetch(resolve(directory, "dist")));
    assert.equal(loaded.system.objectTypes["custom-relay"].icon, icon);
    assert.equal(loaded.system.icons[icon].svg, validateIconSvg(svg));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
