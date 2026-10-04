import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { buildRouteLayout } from "../src/route-layout.mjs";
import { updateRouteTrack, disposeRouteTrack, ROUTE_FADE_MS, createRouteBatch, ROUTE_BATCH_MS } from "../src/route-view.mjs";
import { loadMissionCatalog, parseMissionCatalog, serializeMissionCatalog } from "../src/mission-config.mjs";
import { evaluateMission } from "../src/mission-evaluation.mjs";
import { routeDom } from "./route-dom-fixture.mjs";

const root = new URL("../public/", import.meta.url);
const catalog = await loadMissionCatalog("./config/missions/index.json", async (path) => ({ ok: true, json: async () => JSON.parse(await readFile(new URL(path, root), "utf8")) }));
const node = (id) => ({ id, type: "satellite" });
const link = (a, b) => ({ a, b, correct: true, endpoint: String(a).startsWith("endpoint:") || String(b).startsWith("endpoint:") });
const locate = (layout, id) => layout.items.find((item) => item.node.id === id);

test("detached pieces center as a group, preserve spatial order and never imply a link", () => {
  const a = node(9), b = node(2);
  assert.equal(locate(buildRouteLayout([a], [], "A", "B", 11), 9).position, 5);
  const layout = buildRouteLayout([b, a], [], "A", "B", 11);
  assert.deepEqual(layout.items.map((item) => [item.node.id, item.position, item.anchor]), [[2, 4, "free"], [9, 5, "free"]]);
  assert.equal(layout.connections.length, 0);
});

test("B anchors a terminal at the end and its connected neighbors grow to its left", () => {
  const sat = node(1), terminal = { id: 2, type: "terminal" };
  let layout = buildRouteLayout([sat, terminal], [link(2, "endpoint:B")], "A", "B", 11);
  assert.equal(locate(layout, 2).position, 10); assert.equal(locate(layout, 1).position, 4);
  layout = buildRouteLayout([sat, terminal], [link(1, 2), link(2, "endpoint:B")], "A", "B", 11);
  assert.deepEqual(layout.items.map((item) => [item.position, item.anchor]), [[9, "to"], [10, "to"]]);
  layout = buildRouteLayout([sat, terminal], [link(1, 2)], "A", "B", 11);
  assert.deepEqual(layout.items.map((item) => [item.position, item.anchor]), [[4, "free"], [5, "free"]]);
});

test("separate A/B chains and free components occupy disjoint positions; merge/split does not duplicate nodes", () => {
  const nodes = [1, 2, 3, 4, 5, 6].map(node);
  const links = [link("endpoint:A", 1), link(1, 2), link(3, 4), link(5, 6), link(6, "endpoint:B")];
  const layout = buildRouteLayout(nodes, links, "A", "B", 11);
  assert.deepEqual(layout.items.map((item) => item.position), [0, 1, 4, 5, 9, 10]);
  assert.deepEqual(layout.groups.map((g) => g.anchor), ["from", "free", "to"]);
  const full = buildRouteLayout(nodes, [...links, link(2, 3), link(4, 5)], "A", "B", 6);
  assert.equal(full.groups.length, 1); assert.equal(full.groups[0].anchor, "both");
  assert.equal(new Set(full.items.map((item) => item.node.id)).size, 6);
  assert.deepEqual(full.items.map((item) => item.position), [0, 1, 2, 3, 4, 5]);
});

function easternPair(policy = "hybridProjected") {
  const raw = serializeMissionCatalog(catalog);
  for (const mission of raw.missions) for (const path of mission.topology.paths) path.connection.policy = policy;
  const parsed = parseMissionCatalog(raw), mission = structuredClone(parsed.byNumber[3]);
  const placements = [
    { id: 1, type: "satellite", latitude: 48, longitude: 120, altitude: .72, droppedAt: 0 },
    { id: 2, type: "terminal", latitude: 43.12, longitude: 131.89, altitude: .08, droppedAt: 0 },
  ];
  const record = (x, y) => ({ x, y, radius: 110, iconRadius: 20, eligible: true });
  const nodes = { "endpoint:A": record(297, 303), "endpoint:B": record(1168, 582), 1: record(1044, 460), 2: record(1129, 507) };
  const snapshot = { nodes, placements, mission: 3, timestamp: 1000, revision: 1 };
  return { mission, placements, snapshot, evaluate: (now = 1000) => evaluateMission(mission, placements, parsed.objectSettings, now, 700, snapshot) };
}

test("REF-049: first drop and repeated wakeups keep the B attachment in all three mechanics", () => {
  for (const policy of ["geographicCorridor", "screenProjected", "hybridProjected"]) {
    const f = easternPair(policy);
    f.placements.splice(0, 1);
    const terminal = f.placements[0];
    for (const droppedAt of [1000, 3000, 5000]) {
      terminal.droppedAt = droppedAt;
      for (const elapsed of [0, 699, 700]) {
        const network = f.evaluate(droppedAt + elapsed), layout = network.paths.main.layout;
        assert.equal(locate(layout, terminal.id).position, 10, `${policy}: ${elapsed}ms`);
        assert.equal(locate(layout, terminal.id).anchor, 'to');
        const edge = layout.connections.find(link => link.b === 'endpoint:B');
        assert.ok(edge);
        assert.equal(edge.active, elapsed >= 700);
        assert.equal(network.links.some(link => link.b === 'endpoint:B'), elapsed >= 700);
        assert.equal(network.complete, false);
      }
    }
    // A real move out of range must detach immediately, even during wakeup.
    terminal.latitude = -60; terminal.longitude = -100;
    f.snapshot.nodes[terminal.id].x = 700; f.snapshot.nodes[terminal.id].y = 800;
    assert.equal(locate(f.evaluate(5000).paths.main.layout, terminal.id).anchor, 'free');
  }
});

test("full chain layout stays fixed while waking gates live links, colors and victory", () => {
  const f = easternPair('screenProjected'), path = f.mission.topology.paths[0];
  path.steps = [{ role: 'sat', type: 'satellite' }, { role: 'term', type: 'terminal' }];
  f.mission.objectives = [{ id: 'network', condition: { type: 'allPaths' } }];
  f.mission.completion = { type: 'allPaths' };
  f.snapshot.nodes['endpoint:A'] = { ...f.snapshot.nodes[1], x: 944 };
  const stable = f.evaluate();
  assert.equal(stable.complete, true);
  f.placements[1].droppedAt = 1000;
  const waking = f.evaluate(1000), awake = f.evaluate(1700);
  const positions = network => network.paths.main.layout.items.map(item => [item.node.id, item.position, item.anchor]);
  assert.deepEqual(positions(waking), positions(stable));
  assert.deepEqual(positions(awake), positions(stable));
  assert.equal(waking.states[2], 'drop'); assert.equal(waking.complete, false);
  assert.equal(awake.states[2], 'link'); assert.equal(awake.complete, true);
  assert.ok(waking.links.length < awake.links.length);
});

test("footer keeps waking occupants in their slots and activates arrows without replaying icon fades", () => {
  const { track } = routeDom(), f = easternPair('screenProjected');
  f.placements.forEach(p => { p.droppedAt = 1000; });
  let fades = 0;
  const draw = now => {
    const network = f.evaluate(now);
    updateRouteTrack(track, network.paths.main.layout, network, type => `<i>${type}</i>`, () => { fades++; return null; }, { immediate: true });
  };
  draw(1000);
  const slots = [...track.routeSlots], initialFades = fades;
  assert.equal(slots[10].dataset.placementId, '2');
  assert.equal(track.routeEdges[9].classList.contains('is-connected'), false);
  draw(1700);
  assert.equal(slots[10].dataset.placementId, '2');
  assert.equal(track.routeEdges[9].classList.contains('is-connected'), true);
  assert.equal(fades, initialFades);
  assert.deepEqual(track.routeSlots, slots);
});

test("an ineligible A preserves the distant eastern satellite link and B-anchored footer", () => {
  for (const policy of ["screenProjected", "hybridProjected"]) {
    const f = easternPair(policy), before = f.evaluate();
    f.snapshot.nodes["endpoint:A"].eligible = false; f.snapshot.nodes["endpoint:A"].reason = "earth";
    const after = f.evaluate();
    assert.ok(after.links.some((l) => l.a === 1 && l.b === 2));
    assert.deepEqual(after.paths.main.ordered.map((p) => p.id), [1, 2]);
    assert.deepEqual(after.paths.main.layout.items.map((i) => [i.position, i.anchor]), [[9, "to"], [10, "to"]]);
    assert.deepEqual(after.paths.main.layout, before.paths.main.layout);
    assert.equal(after.complete, false);
  }
});

test("a satellite outside the old corridor can join the local eastern chain; hidden/overlapping pieces cannot", () => {
  const f = easternPair();
  f.snapshot.nodes[1].y = 650; // Outside the old A→B corridor, within local coverage.
  assert.ok(f.evaluate().links.some((l) => l.a === 1 && l.b === 2));
  f.snapshot.nodes[1].eligible = false;
  let result = f.evaluate();
  assert.ok(!result.links.some((l) => l.a === 1 || l.b === 1));
  assert.equal(locate(result.paths.main.layout, 1).anchor, "free");
  assert.equal(result.paths.main.layout.items.length, 2);
  f.snapshot.nodes[1] = { ...f.snapshot.nodes[2], x: f.snapshot.nodes[2].x - 10 };
  result = f.evaluate();
  assert.ok(!result.links.some((l) => l.a === 1 && l.b === 2));
  assert.equal(result.complete, false);
});

test("reversed and vertical views keep the terminal on B and the satellite on its connected side", () => {
  for (const vertical of [false, true]) {
    const f = easternPair();
    for (const p of Object.values(f.snapshot.nodes)) {
      const { x, y } = p;
      if (vertical) { p.x = y; p.y = -x; } else p.x = -x;
    }
    const layout = f.evaluate().paths.main.layout;
    assert.deepEqual(layout.items.map((i) => [i.node.id, i.position, i.anchor]), [[1, 9, "to"], [2, 10, "to"]]);
  }
});

test("classical mode anchors a terminal at B and recenters it after physical disconnection", () => {
  const f = easternPair("geographicCorridor");
  f.placements.splice(0, 1);
  let result = f.evaluate();
  assert.equal(locate(result.paths.main.layout, 2).anchor, "to");
  assert.equal(locate(result.paths.main.layout, 2).position, 10);
  f.placements[0].latitude = -60;
  result = f.evaluate();
  assert.equal(locate(result.paths.main.layout, 2).anchor, "free");
  assert.equal(locate(result.paths.main.layout, 2).position, 5);
});

test("endpoint visibility constrains projected edges; hybrid ground edges follow physical range", () => {
  for (const policy of ["screenProjected", "hybridProjected"]) {
    const f = easternPair(policy), path = f.mission.topology.paths[0];
    // Match a short authored route to this exact pair; physical B link remains hybrid.
    path.steps = [{ role: "sat", type: "satellite" }, { role: "term", type: "terminal" }];
    f.mission.objectives = [{ id: "network", condition: { type: "allPaths" } }];
    f.mission.completion = { type: "allPaths" };
    f.snapshot.nodes["endpoint:A"] = { ...f.snapshot.nodes[1], x: 944 };
    assert.equal(f.evaluate().complete, true);
    for (const id of ["endpoint:A", "endpoint:B"]) {
      f.snapshot.nodes[id].eligible = false;
      const result = f.evaluate();
      assert.equal(result.complete, policy === "hybridProjected" && id === "endpoint:B");
      assert.ok(result.links.some((l) => l.a === 1 && l.b === 2));
      f.snapshot.nodes[id].eligible = true;
    }
  }
});

test("fixed cells survive reordering; latest accumulated state appears only after 200 milliseconds", () => {
  const { track } = routeDom(1100), nodes = [node(1), node(2)], jobs = new Map(); let next = 0;
  const options = { schedule(fn, ms) { assert.equal(ms, 200); jobs.set(++next, fn); return next; }, cancel(id) { jobs.delete(id); } };
  const draw = (links, states = {}) => updateRouteTrack(track, buildRouteLayout(nodes, links, "A", "B", 11), { states }, (type) => '<i>' + type + '</i>', () => null, options);
  draw([]);
  const cells = [...track.routeSlots];
  assert.equal(cells.length, 11); assert.equal(cells.filter(s => !s.dataset.placementId).length, 9);
  assert.equal(cells[4].dataset.placementId, '1'); assert.equal(cells[5].dataset.placementId, '2');
  draw([link(1, 2), link(2, "endpoint:B")], { 2: "link" });
  assert.equal(cells[5].dataset.placementId, '2'); assert.equal(jobs.size, 1);
  draw([link(2, "endpoint:B")]); assert.equal(jobs.size, 1);
  const flush = [...jobs.values()][0]; jobs.clear(); flush();
  assert.equal(cells[10].dataset.placementId, '2'); assert.equal(cells[4].dataset.placementId, '1');
  assert.equal(cells[5].routeContent.innerHTML, '');
  assert.deepEqual(track.routeSlots, cells); assert.ok(cells.every(s => !s.style.transform));
  assert.ok(track.routeEdges.every(e => !e.classList.contains('is-connected')));
  draw([link(1, 2), link(2, "endpoint:B")]);
  disposeRouteTrack(track); assert.equal(jobs.size, 0);
});

test("actual main footer uses the evaluator layout: B attachment never lights the A arrow", async () => {
  const f = easternPair(), network = f.evaluate(), { route, track, from, to } = routeDom(1100);
  const ctx = vm.createContext({ selectedPathId: "main", missionRun: null, buildRouteLayout, updateRouteTrack, disposeRouteTrack, ROUTE_FADE_MS,
    escapeHtml: (s) => s, t: (s) => s, renderRoutePoint: () => "<b></b>", deviceIcon: (type) => `<i>${type}</i>`, animateElement() {}, motionOptions: () => ({}) });
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  vm.runInContext(source.slice(source.indexOf("function updateRouteSequence("), source.indexOf("function motionOptions(")), ctx);
  ctx.updateRouteSequence(route, f.mission, f.placements, network);
  assert.equal(from.classList.contains("is-connected"), false); assert.equal(to.classList.contains("is-connected"), true);
  assert.equal(track.routeNodes.get("2").dataset.anchor, "to"); assert.equal(track.routeNodes.get("1").dataset.anchor, "to");
});

test("200ms batches publish the latest state during continuous changes, without postponing the deadline", () => {
  let now = 0, next = 0; const jobs = new Map(), commits = [];
  const scheduler = { schedule(fn, ms) { jobs.set(++next, { at: now + ms, fn }); return next; }, cancel(id) { jobs.delete(id); } };
  const advance = (ms) => { now += ms; for (const [id, job] of jobs) if (job.at <= now) { jobs.delete(id); job.fn(); } };
  const batch = createRouteBatch(value => commits.push(value), scheduler);
  assert.equal(ROUTE_BATCH_MS, 200);
  batch.push('empty', 0); batch.push('a', 1);
  for (let i = 1; i < 5; i++) { advance(40); batch.push(String(i), i); }
  assert.deepEqual(commits, [0]); assert.equal(jobs.size, 1);
  advance(39); assert.deepEqual(commits, [0]);
  advance(1); assert.deepEqual(commits, [0, 4]);
  batch.push('next', 5); advance(200); assert.deepEqual(commits, [0, 4, 5]);
  batch.push('transient', 6); advance(80); batch.push('next', 5); advance(120);
  assert.deepEqual(commits, [0, 4, 5], 'returning to the displayed arrangement causes no fade');
  batch.push('pending', 7); batch.push('complete', 8, true);
  assert.equal(jobs.size, 0); assert.deepEqual(commits, [0, 4, 5, 8]);
  batch.push('stale', 9); batch.dispose(); advance(10000);
  assert.deepEqual(commits, [0, 4, 5, 8]);
});

test("frequent state updates do not restart an in-flight fade to the same occupant", async () => {
  const { track } = routeDom(), animations = [];
  const animate = () => {
    let finish;
    const animation = { finished: new Promise(resolve => { finish = resolve; }), cancel() {}, finish: () => finish() };
    animations.push(animation); return animation;
  };
  const draw = (id, state = 'base') => updateRouteTrack(track, buildRouteLayout([{ ...node(id), type: String(id) }], [], 'A', 'B', 3),
    { states: { [id]: state } }, type => `<i>${type}</i>`, animate, { immediate: true });
  draw(1); draw(2);
  const exit = animations.at(-1), count = animations.length;
  draw(2, 'link');
  assert.equal(animations.length, count);
  exit.finish(); await Promise.resolve();
  assert.equal(track.routeSlots[1].routeContent.innerHTML, '<i>2</i>');
  assert.equal(track.routeSlots[1].classList.contains('is-correct'), true);
  assert.ok(ROUTE_FADE_MS * 2 < ROUTE_BATCH_MS);
});

test("cell replacement fades opacity only and cancelled exits cannot repopulate a disposed footer", async () => {
  const { track } = routeDom(), frames = [], animations = [];
  const animate = (_content, keyframes) => {
    frames.push(keyframes);
    let finish;
    const animation = { finished: new Promise(resolve => { finish = resolve; }), cancel() {}, finish: () => finish() };
    animations.push(animation); return animation;
  };
  const draw = (nodes) => updateRouteTrack(track, buildRouteLayout(nodes, [], 'A', 'B', 3), {}, type => '<i>' + type + '</i>', animate, { immediate: true });
  draw([{ id: 1, type: 'terminal' }]);
  const slot = track.routeSlots[1];
  assert.ok(slot.routeContent.innerHTML.includes('terminal'));
  draw([{ id: 2, type: 'satellite' }]);
  assert.ok(slot.routeContent.innerHTML.includes('terminal'), 'old content stays during fade-out');
  animations.at(-1).finish(); await Promise.resolve();
  assert.ok(slot.routeContent.innerHTML.includes('satellite'));
  assert.ok(frames.every(sequence => sequence.every(frame => Object.keys(frame).join() === 'opacity')));
  assert.ok(track.routeSlots.every(cell => !cell.style.transform));
  draw([{ id: 3, type: 'core' }]); const outgoing = animations.at(-1);
  disposeRouteTrack(track); outgoing.finish(); await Promise.resolve();
  assert.ok(!slot.routeContent.innerHTML.includes('core'));
});
