import assert from "node:assert/strict";
import { routeCandidates } from "./route-fixture.mjs";
import test from "node:test";
import { readFile, mkdtemp, cp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { loadMissionCatalog, missionSelectObjectsForRendering, parseMissionCatalog, serializeMissionCatalog } from "../src/mission-config.mjs";
import { evaluateMission } from "../src/mission-evaluation.mjs";
import { toEditableCatalog, appendMission } from "../src/editor-state.mjs";
import { addPointFromBank, applySystemAction, changeSystemField, pointIdsForRole, renderSystemInspector, renderTopology } from "../src/editor-mission-system.js";
import { saveProjectConfigs } from "../src/editor-project-save.mjs";
import { parseObjectSettings, resolveSignalRadius } from "../src/node-settings.mjs";
import { configureMissions, createMissionRun, reduceMission, deriveNetwork, routeIsConnected } from "../src/mission-game.mjs";
import { missionCatalog as legacy } from "./config-fixture.mjs";
import { ORBIT_ALTITUDE, SATELLITE_MIN_ALTITUDE, SATELLITE_MAX_ALTITUDE } from "../src/webgl-field.js";

const root = resolve(import.meta.dirname, "..");
const diskFetch = (directory) => async (p) => ({ ok: true, json: async () => JSON.parse(await readFile(resolve(directory, p), "utf8")) });
const catalog = await loadMissionCatalog("./config/missions/index.json", diskFetch(resolve(root, "public")));
const editable = () => toEditableCatalog(catalog);
function fixture(types = ["terminal", "satellite", "core"]) {
  const raw = editable(), m = raw.missions[0];
  delete m.equipmentSet; // This fixture intentionally authors a local inventory.
  m.endpoints = { A: { label: "A", latitude: 0, longitude: 0, signalRadius: 0.3 }, B: { label: "Б", latitude: 0, longitude: 20, signalRadius: 0.3 } };
  m.inventory = Object.fromEntries(["terminal", "satellite", "core", "gateway", "internet"].map((t) => [t, types.filter((x) => x === t).length + 1]));
  m.topology = { paths: [{ id: "main", from: "A", to: "B", steps: types.map((type, i) => ({ role: `slot-${i}`, type })) }] };
  m.objectives = [{ id: "network", label: "Сеть", condition: { type: "allPaths" } }];
  m.completion = { type: "allPaths" };
  m.objectSettings = Object.fromEntries(["terminal", "satellite", "core", "gateway", "internet"].map((t) => [t, { signalRadius: 1, ...(t === "satellite" ? { radiusAtMinAltitude: 1, radiusAtMaxAltitude: 1 } : {}) }]));
  const parsed = parseMissionCatalog(raw);
  const placements = types.map((type, i) => ({ id: i + 1, type, latitude: 0, longitude: 20 * (i + 1) / (types.length + 1), altitude: type === "satellite" ? 0.34 : 0.08, droppedAt: 0 }));
  return { raw, mission: parsed.missions[0], placements, run: (nodes = placements, now = 1000) => evaluateMission(parsed.missions[0], nodes, parsed.objectSettings, now) };
}

test("v2 split files round-trip without losing current coordinates, cameras or role identities", async () => {
  assert.equal(catalog.schemaVersion, 2);
  assert.equal(catalog.missions.length, 3);
  for (const m of catalog.missions) assert.deepEqual(m.mapPosition, legacy.missions.find((old) => old.id === m.id).mapPosition);
  const serialized = serializeMissionCatalog(catalog);
  assert.equal(serialized.missions[0].route, undefined);
  assert.deepEqual(parseMissionCatalog(serialized).missions, catalog.missions);
  assert.equal(catalog.missions[2].inventory.satellite, 6);
  assert.deepEqual(catalog.missionSelectObjects, catalog.system.missionSelectObjects);
  assert.deepEqual(catalog.missionSelectObjects[0], {
    id: "mission-hub-satellite", kind: "orbital-signal", icon: "satellite",
    latitude: 68.25, longitude: 175.35, altitude: 1.4, size: 0.72, signalRadius: 0.82,
    signalMode: "always", successWhen: "all-missions-completed",
  });
  assert.equal(missionSelectObjectsForRendering(catalog)[0].iconSource, "./icons/sputnik.svg");
});

test("mission-select objects own their size and fixed signal radius independently of gameplay satellites", () => {
  const raw = editable();
  raw.system.objectSettings.satellite.size = 2;
  raw.system.objectSettings.satellite.radiusAtMinAltitude = 0.1;
  raw.system.objectSettings.satellite.radiusAtMaxAltitude = 2;
  const parsed = parseMissionCatalog(raw);
  assert.equal(parsed.missionSelectObjects[0].size, 0.72);
  assert.equal(parsed.missionSelectObjects[0].signalRadius, 0.82);
  const invalid = editable();
  invalid.system.missionSelectObjects[0].signalRadius = 0;
  assert.throws(() => parseMissionCatalog(invalid), /missionSelectObjects\[0\]\.signalRadius/);
});

test("all migrated missions remain solvable with real geographic endpoints and configured radii", () => {
  for (const m of catalog.missions) {
    const nodes = routeCandidates(m);
    assert.equal(evaluateMission(m, nodes, catalog.objectSettings, 1000).complete, true, m.id);
    for (const satellite of nodes.filter(node => node.type === "satellite")) {
      assert.equal(evaluateMission(m, nodes.filter(node => node.id !== satellite.id), catalog.objectSettings, 1000).complete, false, `${m.id}: satellite ${satellite.id} is required`);
    }
  }
});

test("client equipment sets match route demand and require both national gateways", () => {
  const expected = [
    { terminal: 1, satellite: 1, gateway: 1, core: 1, internet: 1 },
    { terminal: 1, satellite: 2, gateway: 1, core: 1, internet: 0 },
    { terminal: 2, satellite: 6, gateway: 2, core: 1, internet: 0 },
  ];
  for (const m of catalog.missions) {
    assert.deepEqual(m.inventory, expected[m.number - 1], m.id);
    const path = m.topology.paths[0];
    const demand = Object.fromEntries(Object.keys(m.inventory).map((type) => [type, path.steps.filter((step) => step.type === type).length]));
    assert.deepEqual(demand, m.inventory, `${m.id}: every supplied object has a route slot`);
  }
  const m = catalog.missions.find((mission) => mission.number === 3);
  const path = m.topology.paths[0], a = m.endpoints[path.from], b = m.endpoints[path.to];
  const nodes = path.steps.map((step, i) => ({ id: i + 1, type: step.type,
    latitude: a.latitude + (b.latitude - a.latitude) * (i + 1) / (path.steps.length + 1),
    longitude: a.longitude + (b.longitude - a.longitude) * (i + 1) / (path.steps.length + 1),
    altitude: step.type === "satellite" ? 0.34 : 0.08, droppedAt: 0 }));
  assert.equal(evaluateMission(m, nodes, catalog.objectSettings, 1000).complete, true);
  for (const gateway of nodes.filter((node) => node.type === "gateway")) {
    const result = evaluateMission(m, nodes.filter((node) => node.id !== gateway.id), catalog.objectSettings, 1000);
    assert.equal(result.complete, false, `gateway ${gateway.id} cannot be skipped`);
    assert.equal(result.objectives[m.objectives.findIndex((objective) => objective.id === "unite-through-core")], false);
  }
});

test("v2 requires both physical endpoints independently of decorative closure", () => {
  const { raw, placements } = fixture();
  raw.missions[0].connectEndpointsOnComplete = false;
  raw.missions[0].endpoints.A.signalRadius = 0.001;
  raw.missions[0].objectSettings.terminal.signalRadius = 0.001;
  const m = parseMissionCatalog(raw).missions[0];
  const result = evaluateMission(m, placements, catalog.objectSettings, 1000);
  assert.equal(result.complete, false);
  assert.equal(result.links.some((link) => link.a === "endpoint:A"), false);
});

test("a fixed endpoint connects to a reached edge node on either side of its route cap", () => {
  const { raw } = fixture(["terminal"]);
  const mission = parseMissionCatalog(raw).missions[0];
  const terminalBehindStart = [{ id: 1, type: "terminal", latitude: 0, longitude: -1, altitude: 0.08, droppedAt: 0 }];
  const result = evaluateMission(mission, terminalBehindStart, catalog.objectSettings, 1000);
  assert.ok(result.links.some((link) => link.a === "endpoint:A" && link.b === 1));
  assert.equal(result.paths.main.ordered[0].id, 1);
});

test("v2 keeps a one-sided object and its incoming link visually neutral", () => {
  const { raw, placements } = fixture();
  raw.missions[0].feedback.invalid = "error";
  raw.missions[0].endpoints.A.signalRadius = 0.001;
  raw.missions[0].objectSettings.terminal.signalRadius = 0.001;
  const mission = parseMissionCatalog(raw).missions[0];
  let result = evaluateMission(mission, placements, catalog.objectSettings, 1000);
  assert.equal(result.links.some((link) => link.a === "endpoint:A"), false);
  assert.equal(result.links.some((link) => link.a === 1 && link.b === 2), true);
  assert.equal(result.states[1], "base");
  assert.equal(result.states[2], "link");

  const wrongFirst = placements.map((placement, index) => index === 0 ? { ...placement, type: "gateway", signalRadius: 0.001 } : placement);
  result = evaluateMission(mission, wrongFirst, catalog.objectSettings, 1000);
  assert.equal(result.links.some((link) => link.a === 1 && link.b === 2), true);
  assert.equal(result.states[1], "base");
});

test("v2 world order ignores screenX, placement IDs and creation order", () => {
  const { run, placements } = fixture();
  assert.equal(run().complete, true);
  assert.equal(run([...placements].reverse().map((p) => ({ ...p, id: 100 - p.id, screenX: -p.longitude }))).complete, true);
  assert.equal(run(placements.map((p, i) => ({ ...p, longitude: placements.at(-1 - i).longitude }))).complete, false);
});

test("fourth satellite cannot masquerade as core; neutral feedback never grants success", () => {
  const { raw, placements } = fixture(["terminal", "satellite", "satellite", "satellite", "core", "satellite", "terminal"]);
  const wrong = placements.map((p) => p.type === "core" ? { ...p, type: "satellite" } : p);
  raw.missions[0].feedback.invalid = "error";
  let m = parseMissionCatalog(raw).missions[0];
  let result = evaluateMission(m, wrong, catalog.objectSettings, 1000);
  assert.equal(result.states[5], "wrong");
  assert.equal(result.states[6], "wrong");
  assert.equal(result.complete, false);
  raw.missions[0].feedback.invalid = "neutral";
  m = parseMissionCatalog(raw).missions[0];
  result = evaluateMission(m, wrong, catalog.objectSettings, 1000);
  assert.equal(result.states[5], "base");
  assert.ok(result.links.some((link) => link.neutral));
  assert.equal(result.complete, false);
});

test("duplicate geographic progress is ambiguous, not resolved by IDs", () => {
  const { run, placements } = fixture();
  const result = run(placements.map((p) => ({ ...p, longitude: 10 })));
  assert.equal(result.complete, false);
  assert.ok(result.diagnostics.some((d) => d.rule === "ambiguous"));
});

test("v2 victory and reducer respect objectives, wake delay and signal breaks", () => {
  const { raw, placements, run } = fixture();
  assert.equal(run(placements, 0).complete, false);
  raw.missions[0].objectives.push({ id: "impossible", label: "99 терминалов", condition: { type: "placed", object: "terminal", count: 99 } });
  const parsed = parseMissionCatalog(raw);
  try {
    configureMissions(parsed);
    const runState = { ...createMissionRun(1), placements };
    assert.equal(routeIsConnected(runState, 1000), false);
    assert.notEqual(reduceMission(runState, { type: "CHECK", now: 1000 }).status, "complete");
    assert.equal(deriveNetwork(runState, 1000).objectives.at(-1), false);
  } finally { configureMissions(legacy); }
});

test("branch alternatives use compatible witnesses rather than requiring every alternative", () => {
  const { raw, placements } = fixture();
  const m = raw.missions[0];
  m.topology.paths.push({ ...structuredClone(m.topology.paths[0]), id: "alternative", steps: m.topology.paths[0].steps.map((s) => ({ ...s, role: `other-${s.role}` })) });
  for (const type of Object.keys(m.inventory)) m.inventory[type] *= 2;
  const any = { type: "any", children: [{ type: "path", path: "main" }, { type: "path", path: "alternative" }] };
  m.completion = any; m.objectives[0].condition = any;
  let result = evaluateMission(parseMissionCatalog(raw).missions[0], placements, catalog.objectSettings, 1000);
  assert.equal(result.complete, true);
  m.completion = { type: "allPaths" };
  result = evaluateMission(parseMissionCatalog(raw).missions[0], placements, catalog.objectSettings, 1000);
  assert.equal(result.complete, false, "one instance cannot fill two distinct simultaneous roles");
  m.topology.paths[1].steps = structuredClone(m.topology.paths[0].steps);
  result = evaluateMission(parseMissionCatalog(raw).missions[0], placements, catalog.objectSettings, 1000);
  assert.equal(result.complete, true, "shared role explicitly permits same instance");
});

test("nested all/any/not/atLeast and role segments are executable", () => {
  const { raw, placements } = fixture();
  raw.missions[0].completion = { type: "atLeast", count: 2, children: [
    { type: "segment", path: "main", from: 0, to: 2 },
    { type: "not", children: [{ type: "placed", object: "internet", count: 1 }] },
    { type: "placed", object: "terminal", count: 99 },
  ] };
  assert.equal(evaluateMission(parseMissionCatalog(raw).missions[0], placements, catalog.objectSettings, 1000).complete, true);
});

test("multiple geographic destinations connect independently through narrow corridors", () => {
  const { raw } = fixture(["terminal"]), m = raw.missions[0];
  m.endpoints.north = { label: "", icon: "point-b", latitude: 20, longitude: 0, signalRadius: 0.3 };
  m.topology.paths[0].connection = { corridorWidth: 0.2 };
  m.topology.paths.push({ id: "north", from: "A", to: "north", connection: { corridorWidth: 0.2 }, steps: [{ role: "north-terminal", type: "terminal" }] });
  const mission = parseMissionCatalog(raw).missions[0];
  const nodes = [{ id: 1, type: "terminal", latitude: 0, longitude: 10, altitude: 0.08, droppedAt: 0 }, { id: 2, type: "terminal", latitude: 10, longitude: 0, altitude: 0.08, droppedAt: 0 }];
  assert.equal(evaluateMission(mission, nodes, catalog.objectSettings, 1000).complete, true);
  assert.equal(evaluateMission(mission, nodes.slice(0, 1), catalog.objectSettings, 1000).complete, false);
});

test("any-role endpoint selection makes every authored start point a functional signal source", () => {
  const mission = catalog.missions.find((item) => item.id === "arctic-route");
  const path = mission.topology.paths[0];
  const finish = mission.endpoints[path.to];
  const starts = Object.entries(mission.endpoints).filter(([, endpoint]) => endpoint.roles.includes("start"));
  assert.equal(path.endpointSelection.from, "anyRole");
  assert.ok(starts.length > 0, "the authored mission must have a start point");
  for (const [id, start] of starts) {
    for (const direction of [0.01, -0.01]) {
      const node = { id: 1, type: path.steps[0].type,
        latitude: start.latitude + (finish.latitude - start.latitude) * direction,
        longitude: start.longitude + (finish.longitude - start.longitude) * direction,
        altitude: 0.08, droppedAt: 0 };
      const result = evaluateMission(mission, [node], catalog.objectSettings, 1000);
      assert.equal(result.paths[path.id].from, id, `${id}:${direction}`);
      assert.ok(result.links.some((link) => link.a === `endpoint:${id}` && link.b === node.id), `${id}:${direction}`);
    }
  }
});

test("equivalent endpoints can emit only from the nearest point or in parallel", () => {
  const { raw } = fixture(["terminal"]), missionSource = raw.missions[0];
  missionSource.endpoints.A.signalRadius = 1;
  missionSource.endpoints["near-start"] = { label: "", icon: "point-a", roles: ["start"], latitude: 0, longitude: 2, signalRadius: 1 };
  missionSource.topology.paths[0].endpointSelection = { from: "anyRole", to: "specific" };
  missionSource.topology.paths[0].endpointSignals = { from: "nearest", to: "nearest" };
  const placement = [{ id: 1, type: "terminal", latitude: 0, longitude: 3, altitude: 0.08, droppedAt: 0 }];
  let mission = parseMissionCatalog(raw).missions[0];
  let result = evaluateMission(mission, placement, catalog.objectSettings, 1000);
  let starts = result.links.filter((link) => link.endpointSide === "from");
  assert.equal(result.paths.main.from, "near-start");
  assert.deepEqual(starts.map((link) => link.a), ["endpoint:near-start"]);

  missionSource.topology.paths[0].endpointSignals.from = "parallel";
  mission = parseMissionCatalog(raw).missions[0];
  result = evaluateMission(mission, placement, catalog.objectSettings, 1000);
  starts = result.links.filter((link) => link.endpointSide === "from");
  assert.deepEqual(new Set(starts.map((link) => link.a)), new Set(["endpoint:A", "endpoint:near-start"]));
});

test("endpoint-anchored eastern segment can be built before the western part", () => {
  const m = catalog.missions[2];
  const nodes = ["gateway", "satellite", "satellite", "satellite", "terminal"].map((type, i) => ({ id: i + 1, type, latitude: m.endpoints.B.latitude, longitude: m.endpoints.B.longitude - 5 + i, altitude: type === "satellite" ? 0.34 : 0.08, droppedAt: 0 }));
  const result = evaluateMission(m, nodes, catalog.objectSettings, 1000);
  assert.equal(result.objectives[0], true);
  assert.equal(result.objectives[1], false);
  assert.equal(result.complete, false);
});

test("a locally correct eastern node is positive before the western prefix is complete", () => {
  const m = catalog.missions[0];
  const a = m.endpoints.A, b = m.endpoints.B;
  const lerp = (left, right, progress) => left + (right - left) * progress;
  const nodes = [
    { id: 4, type: "core", latitude: lerp(a.latitude, b.latitude, .78), longitude: lerp(a.longitude, b.longitude, .78), altitude: .08, droppedAt: 0, signalRadius: 10 },
    { id: 5, type: "internet", latitude: lerp(a.latitude, b.latitude, .9), longitude: lerp(a.longitude, b.longitude, .9), altitude: .08, droppedAt: 0, signalRadius: 10 },
  ];
  const result = evaluateMission(m, nodes, catalog.objectSettings, 1000);
  assert.equal(result.complete, false);
  assert.deepEqual(result.paths.main.tailEdges, [false, true, true]);
  assert.equal(result.states[5], "link");
  assert.ok(result.links.some((link) => link.a === 4 && link.b === 5 && link.correct));
  assert.ok(result.links.some((link) => link.a === 5 && link.b === "endpoint:B" && link.correct));
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.node === 5), false);
});

test("configured satellite altitude limits reach both reducer and live rendering bindings", () => {
  const { raw } = fixture();
  raw.system.objectSettings.satellite = { ...raw.system.objectSettings.satellite, minAltitude: 0.2, maxAltitude: 2, defaultAltitude: 1.1 };
  try {
    configureMissions(parseMissionCatalog(raw));
    const run = reduceMission(createMissionRun(1), { type: "PLACE", item: "satellite", latitude: 0, longitude: 10, now: 0 });
    assert.equal(run.placements[0].altitude, 1.1);
    assert.equal(ORBIT_ALTITUDE, 1.1);
    assert.equal(SATELLITE_MIN_ALTITUDE, 0.2);
    assert.equal(SATELLITE_MAX_ALTITUDE, 2);
  } finally { configureMissions(legacy); }
});

test("editor edits points, paths, roles, inventory, nested conditions and parameter overrides", () => {
  const raw = editable();
  changeSystemField(raw, ["missions", 0, "equipmentSet"], "");
  const pointId = addPointFromBank(raw, 0, "finish", "point-a");
  applySystemAction(raw, "rename-point", ["missions", 0, "endpoints", pointId], "north");
  changeSystemField(raw, ["missions", 0, "endpoints", "north", "latitude"], 70);
  applySystemAction(raw, "add-path", ["missions", 0, "topology", "paths"]);
  applySystemAction(raw, "add-step", ["missions", 0, "topology", "paths", 1, "steps"]);
  changeSystemField(raw, ["missions", 0, "topology", "paths", 1, "to"], "north");
  applySystemAction(raw, "inventory-from-roles", ["missions", 0]);
  changeSystemField(raw, ["missions", 0, "completion", "type"], "any");
  changeSystemField(raw, ["system", "objectSettings", "satellite", "minAltitude"], 0.2);
  changeSystemField(raw, ["missions", 0, "objectSettings", "terminal", "size"], 1.5);
  assert.equal(parseMissionCatalog(raw).missions[0].endpoints.north.icon, "point-a");
  assert.equal(parseMissionCatalog(raw).missions[0].endpoints.north.label, "");
  assert.ok(renderSystemInspector(raw, 0).includes("radiusAtMaxAltitude"));
  assert.match(renderSystemInspector(raw, 0), /УСПЕШНЫЕ ПОПАПЫ/);
  assert.match(renderSystemInspector(raw, 0), /ПОПАПЫ ОШИБОК/);
  applySystemAction(raw, "add-feedback-error", ["missions", 0, "feedbackEvents", "error"]);
  const feedbackIndex = raw.missions[0].feedbackEvents.error.length - 1;
  changeSystemField(raw, ["missions", 0, "feedbackEvents", "error", feedbackIndex, "condition", "type"], "altitude");
  assert.equal(raw.missions[0].feedbackEvents.error[feedbackIndex].condition.type, "altitude");
  assert.ok(renderTopology(raw, 0).includes("ambiguityEpsilon"));
  assert.match(renderTopology(raw, 0), /Любая стартовая/);
  assert.match(renderTopology(raw, 0), /Параллельно от всех/);
  assert.equal(parseMissionCatalog(appendMission(raw).catalog).missions.length, 4);
});

test("editor adds unlimited start and finish points from the shared icon bank", () => {
  const raw = editable(), mission = raw.missions[0];
  const start1 = addPointFromBank(raw, 0, "start", "point-a");
  const start2 = addPointFromBank(raw, 0, "start", "point-b");
  const finish1 = addPointFromBank(raw, 0, "finish", "point-a");
  const finish2 = addPointFromBank(raw, 0, "finish", "point-b");
  assert.equal(new Set([start1, start2, finish1, finish2]).size, 4);
  assert.deepEqual(mission.endpoints[start1].roles, ["start"]);
  assert.deepEqual(mission.endpoints[finish1].roles, ["finish"]);
  assert.equal(mission.endpoints[start1].label, "");
  assert.equal(mission.endpoints[finish1].label, "");
  assert.ok(pointIdsForRole(mission, "start").includes(start2));
  assert.ok(pointIdsForRole(mission, "finish").includes(finish2));
  applySystemAction(raw, "delete-point", ["missions", 0, "endpoints", "A"]);
  assert.equal(mission.endpoints.A, undefined);
  assert.ok([start1, start2].includes(mission.topology.paths[0].from));
  applySystemAction(raw, "delete-point", ["missions", 0, "endpoints", finish2]);
  assert.equal(mission.endpoints[finish2], undefined);
  assert.doesNotThrow(() => parseMissionCatalog(raw));
  assert.match(renderSystemInspector(raw, 0), /СТАРТОВЫЕ ТОЧКИ/);
  assert.match(renderSystemInspector(raw, 0), /ЗАВЕРШАЮЩИЕ ТОЧКИ/);
  assert.throws(() => addPointFromBank(raw, 0, "start", "missing"), /банка точек/);
});

test("v2 migrates legacy A/B to the point bank and rejects other text-only endpoints", () => {
  const raw = editable();
  delete raw.missions[0].endpoints.A.icon;
  raw.missions[0].endpoints.A.label = "A";
  const migrated = parseMissionCatalog(raw).missions[0].endpoints.A;
  assert.equal(migrated.icon, "point-a");
  assert.equal(migrated.label, "");
  raw.missions[0].endpoints["text-only"] = { label: "Сторонний текст", roles: ["finish"], latitude: 10, longitude: 10 };
  assert.throws(() => parseMissionCatalog(raw), /иконку из банка точек/);
});

test("v2 validation rejects broken references, duplicate roles, invalid inventory and altitude bounds", () => {
  for (const mutate of [
    (m) => m.topology.paths[0].from = "missing",
    (m) => m.topology.paths[0].endpointSelection = { from: "random", to: "specific" },
    (m) => m.topology.paths[0].endpointSignals = { from: "random", to: "nearest" },
    (m) => m.topology.paths[0].steps.push(m.topology.paths[0].steps[0]),
    (m) => m.inventory.satellite = -1,
    (m) => m.completion = { type: "path", path: "missing" },
    (m) => m.feedbackEvents.success = [],
    (m) => m.feedbackEvents.error.push({ ...structuredClone(m.feedbackEvents.error[0]), id: "mission-complete" }),
    (m) => m.feedbackEvents.error.push({ id: "bad-height", eyebrow: "Ошибка", title: "Высота", message: "", condition: { type: "altitude", object: "satellite", comparison: "above", value: -1, quantifier: "any" }, negativeConnections: "matched" }),
    (m) => m.objectSettings = { satellite: { minAltitude: 2, maxAltitude: 1 } },
    (m) => m.id = "../unsafe",
  ]) { const raw = editable(); delete raw.missions[0].equipmentSet; mutate(raw.missions[0]); assert.throws(() => parseMissionCatalog(raw)); }
  const settings = parseObjectSettings({ satellite: { minAltitude: 0.2, maxAltitude: 2, defaultAltitude: 1.1, radiusAtMinAltitude: 0.3, radiusAtMaxAltitude: 1.5 } });
  assert.ok(Math.abs(resolveSignalRadius({ type: "satellite", altitude: 1.1 }, settings) - 0.9) < 1e-9);
});

test("v2 saves every file with backup, rejects stale concurrent saves and reloads one revision", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "x-sputnik-v2-"));
  try {
    await cp(resolve(root, "public/config"), resolve(projectRoot, "public/config"), { recursive: true });
    await cp(resolve(root, "public/config"), resolve(projectRoot, "dist/config"), { recursive: true });
    const raw = editable(), shellConfig = JSON.parse(await readFile(resolve(root, "public/config/ui-shell.json"), "utf8"));
    raw.missions[0].objectSettings = { terminal: { size: 1.6 } };
    const options = { catalog: raw, shellConfig, projectRoot };
    const results = await Promise.allSettled([saveProjectConfigs(options), saveProjectConfigs(options)]);
    assert.equal(results[0].status, "fulfilled"); assert.equal(results[1].status, "rejected");
    const result = results[0].value;
    const saved = await loadMissionCatalog("./config/missions/index.json", diskFetch(resolve(projectRoot, "public")));
    assert.equal(saved.revision, result.revision);
    assert.equal(saved.missions[0].objectSettings.terminal.size, 1.6);
    for (const name of result.files) assert.equal(await readFile(resolve(projectRoot, "public/config", name), "utf8"), await readFile(resolve(projectRoot, "dist/config", name), "utf8"));
    assert.ok((await readdir(resolve(projectRoot, "backups/editor", result.backupId, "missions"))).includes("first-signal.json"));
    await assert.rejects(saveProjectConfigs({ ...options, catalog: legacy }), /v2/);
  } finally { await rm(projectRoot, { recursive: true, force: true }); }
});
