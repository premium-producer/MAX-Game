import assert from "node:assert/strict";
import test from "node:test";
import { availableCount, createMissionRun, deriveNetwork, ITEM_TYPES, NODE_WAKE_DELAY_MS, orderedPlacements, previewPlacementMove, SATELLITE_MAX_ALTITUDE, SATELLITE_MIN_ALTITUDE, objectiveProgress, reduceMission, routeIsConnected, routeIsCorrect, signalRangeBetween, signalsOverlap } from "../src/mission-game.mjs";
import "./config-fixture.mjs";

const countryRoute = ["terminal", "satellite", "satellite", "satellite", "core", "satellite", "satellite", "satellite", "terminal"];
function countryRun(indices = countryRoute.map((_, index) => index)) {
  return indices.reduce((run, index) => reduceMission(run, {
    type: "PLACE", item: countryRoute[index], latitude: 45, longitude: index * 8, now: 0,
  }), createMissionRun(3));
}

test("country mission provides two terminals, six satellites and one core", () => {
  const run = createMissionRun(3);
  assert.equal(availableCount(run, "terminal"), 2);
  assert.equal(availableCount(run, "satellite"), 6);
  assert.equal(availableCount(run, "core"), 1);
  assert.equal(availableCount(run, "gateway"), 0);
  assert.equal(availableCount(run, "internet"), 0);
});

test("western and eastern objectives can be completed independently with three connected satellites", () => {
  assert.deepEqual(objectiveProgress(countryRun([0, 1, 2, 3]), NODE_WAKE_DELAY_MS), [false, true, false, false]);
  assert.deepEqual(objectiveProgress(countryRun([5, 6, 7, 8]), NODE_WAKE_DELAY_MS), [true, false, false, false]);
  assert.deepEqual(objectiveProgress(countryRun([0, 1, 2]), NODE_WAKE_DELAY_MS), [false, false, false, false]);
  assert.deepEqual(objectiveProgress(countryRun([6, 7, 8]), NODE_WAKE_DELAY_MS), [false, false, false, false]);
});

test("country objectives require active connected links and clear when a section breaks", () => {
  const run = countryRun();
  assert.deepEqual(objectiveProgress(run, NODE_WAKE_DELAY_MS - 1), [false, false, false, false]);
  assert.deepEqual(objectiveProgress(run, NODE_WAKE_DELAY_MS), [true, true, true, true]);
  assert.equal(reduceMission(run, { type: "CHECK", now: NODE_WAKE_DELAY_MS }).status, "complete");
  const broken = { ...run, placements: run.placements.map((node, index) => index === 2 ? { ...node, latitude: -60 } : node) };
  assert.deepEqual(objectiveProgress(broken, NODE_WAKE_DELAY_MS), [true, false, true, false]);
  const reversed = { ...run, placements: run.placements.map((node, index) => ({ ...node, screenX: index === 0 ? 2.5 : index })) };
  assert.equal(objectiveProgress(reversed, NODE_WAKE_DELAY_MS)[1], false);
  const noCore = countryRun([0, 1, 2, 3, 5, 6, 7, 8]);
  assert.deepEqual(objectiveProgress(noCore, NODE_WAKE_DELAY_MS), [true, true, false, false]);
});

test("arctic satellite objective requires coverage overlap, not only adjacent placement", () => {
  let run = createMissionRun(2);
  for (const longitude of [0, 8]) run = reduceMission(run, { type: "PLACE", item: "satellite", latitude: 45, longitude, now: 0 });
  assert.deepEqual(objectiveProgress(run, 0), [false, false, false]);
  assert.deepEqual(objectiveProgress(run, NODE_WAKE_DELAY_MS), [true, false, false]);
  run = reduceMission(run, { type: "MOVE", id: 2, latitude: 45, longitude: 100, now: 0 });
  assert.deepEqual(objectiveProgress(run, NODE_WAKE_DELAY_MS), [false, false, false]);
});

test("mission one accepts the correct assembled route", () => {
  let run = createMissionRun(1);
  for (const [index, item] of ["terminal", "satellite", "gateway", "core", "internet"].entries()) {
    run = reduceMission(run, { type: "PLACE", item, latitude: 45, longitude: -30 + index * 15, now: 0 });
  }
  assert.equal(routeIsCorrect(run), true);
  assert.equal(routeIsConnected(run, NODE_WAKE_DELAY_MS), true);
  assert.deepEqual(objectiveProgress(run), [true, true, true, true]);
  assert.equal(reduceMission(run, { type: "CHECK", now: NODE_WAKE_DELAY_MS }).status, "complete");
  assert.deepEqual(deriveNetwork(run, NODE_WAKE_DELAY_MS).links.slice(-3).map(({ a, b, surface }) => [a, b, surface === true]), [
    ["endpoint:A", 1, false],
    [5, "endpoint:B", false],
    ["endpoint:B", "endpoint:A", true],
  ]);
});

test("only configured missions close the completed route through A and B", () => {
  let run = createMissionRun(2);
  for (const [index, item] of ["terminal", "satellite", "satellite", "gateway", "core", "internet"].entries()) {
    run = reduceMission(run, { type: "PLACE", item, latitude: 45, longitude: -25 + index * 10, now: 0 });
  }
  assert.equal(routeIsConnected(run, NODE_WAKE_DELAY_MS), true);
  assert.equal(deriveNetwork(run, NODE_WAKE_DELAY_MS).links.some((link) => link.endpoint), false);
});

test("correctly ordered but disconnected route does not complete", () => {
  let run = createMissionRun(1);
  for (const [index, item] of ["terminal", "satellite", "gateway", "core", "internet"].entries()) {
    run = reduceMission(run, { type: "PLACE", item, latitude: 45, longitude: -100 + index * 50, now: 0 });
  }
  assert.equal(routeIsCorrect(run), true);
  assert.equal(routeIsConnected(run, NODE_WAKE_DELAY_MS), false);
  assert.equal(reduceMission(run, { type: "CHECK", now: NODE_WAKE_DELAY_MS }).status, "disconnected");
});

test("wrong and incomplete routes do not complete", () => {
  let run = reduceMission(createMissionRun(1), { type: "PLACE", item: "satellite", x: .4, y: .4 });
  assert.equal(reduceMission(run, { type: "CHECK" }).status, "incomplete");
  for (const [index, item] of ["terminal", "gateway", "core", "internet"].entries()) {
    run = reduceMission(run, { type: "PLACE", item, x: .2 + index * .1, y: .5 });
  }
  assert.equal(reduceMission(run, { type: "CHECK" }).status, "error");
});

test("inventory count follows placed and removed objects", () => {
  let run = createMissionRun(2);
  assert.equal(availableCount(run, "satellite"), 2);
  run = reduceMission(run, { type: "PLACE", item: "satellite", x: .5, y: .5 });
  assert.equal(availableCount(run, "satellite"), 1);
  run = reduceMission(run, { type: "REMOVE", id: run.placements[0].id });
  assert.equal(availableCount(run, "satellite"), 2);
});

test("moving an object changes the spatial route without changing its identity", () => {
  let run = createMissionRun(1);
  run = reduceMission(run, { type: "PLACE", item: "terminal", latitude: 20, longitude: 30, altitude: .08 });
  run = reduceMission(run, { type: "PLACE", item: "satellite", latitude: 25, longitude: 40, altitude: .72 });
  run = reduceMission(run, { type: "MOVE", id: 1, latitude: -35, longitude: 50, altitude: .08, rotation: 7 });
  assert.deepEqual(run.placements.map((placement) => placement.type), ["terminal", "satellite"]);
  assert.deepEqual(orderedPlacements(run).map((placement) => placement.type), ["satellite", "terminal"]);
  assert.deepEqual(run.placements[0], { id: 1, type: "terminal", latitude: -35, longitude: 50, altitude: .08, rotation: 7, droppedAt: 0 });
});

test("live move preview breaks a distant link without committing the placement", () => {
  let run = createMissionRun(1);
  run = reduceMission(run, { type: "PLACE", item: "terminal", latitude: 45, longitude: 0, now: 0 });
  run = reduceMission(run, { type: "PLACE", item: "gateway", latitude: 45, longitude: 8, now: 0 });
  assert.ok(deriveNetwork(run, NODE_WAKE_DELAY_MS).links.some((link) => link.a === 1 && link.b === 2));
  const preview = previewPlacementMove(run, 2, { latitude: 45, longitude: 100, altitude: 0.08 });
  assert.equal(run.placements[1].longitude, 8);
  assert.equal(preview.placements[1].droppedAt, run.placements[1].droppedAt);
  assert.equal(deriveNetwork(preview, NODE_WAKE_DELAY_MS).links.some((link) => link.a === 1 && link.b === 2), false);
});

test("screen projection overrides drop history in the displayed route", () => {
  let run = createMissionRun(1);
  for (const [item, screenX] of [["terminal", .2], ["satellite", .7], ["core", .5]]) {
    run = reduceMission(run, { type: "PLACE", item, latitude: 55, longitude: 40, now: 0 });
    run.placements.at(-1).screenX = screenX;
  }
  assert.deepEqual(orderedPlacements(run).map((placement) => placement.type), ["terminal", "core", "satellite"]);
});

test("3D placement clamps latitude, longitude, altitude and rotation", () => {
  let run = createMissionRun(1);
  run = reduceMission(run, { type: "PLACE", item: "terminal", latitude: -120, longitude: 400, altitude: -2, rotation: 90 });
  assert.deepEqual(run.placements[0], { id: 1, type: "terminal", latitude: -82, longitude: 180, altitude: .04, rotation: 10, droppedAt: 0 });
});

test("satellite altitude stays inside its free-flight corridor", () => {
  let run = createMissionRun(1);
  run = reduceMission(run, { type: "PLACE", item: "satellite", latitude: 50, longitude: 80, altitude: -2 });
  assert.equal(run.placements[0].altitude, SATELLITE_MIN_ALTITUDE);
  run = reduceMission(run, { type: "MOVE", id: 1, latitude: 50, longitude: 80, altitude: 99 });
  assert.equal(run.placements[0].altitude, SATELLITE_MAX_ALTITUDE);
});

test("inventory cannot place more objects than the mission provides", () => {
  let run = createMissionRun(1);
  run = reduceMission(run, { type: "PLACE", item: "terminal", x: .2, y: .2 });
  const unchanged = reduceMission(run, { type: "PLACE", item: "terminal", x: .4, y: .4 });
  assert.equal(unchanged, run);
  assert.equal(run.placements.length, 1);
});

test("a freshly dropped node wakes up after the signal delay", () => {
  let run = createMissionRun(1);
  run = reduceMission(run, { type: "PLACE", item: "satellite", x: .4, y: .5, now: 1000 });
  assert.equal(deriveNetwork(run, 1000).states[1], "drop");
  assert.equal(NODE_WAKE_DELAY_MS, 350);
  assert.equal(deriveNetwork(run, 1349).states[1], "drop");
  assert.equal(deriveNetwork(run, 1000 + NODE_WAKE_DELAY_MS).states[1], "base");
});

test("a node with two expected neighbors becomes linked", () => {
  let run = createMissionRun(1);
  for (const [item, longitude] of [["terminal", -10], ["satellite", 0], ["gateway", 10]]) {
    run = reduceMission(run, { type: "PLACE", item, latitude: 45, longitude, now: 0 });
  }
  assert.equal(deriveNetwork(run, 349).links.length, 0);
  const network = deriveNetwork(run, 350);
  assert.equal(network.links.filter((link) => link.a === 2 || link.b === 2).length, 2);
  assert.equal(network.states[2], "link");
});

test("a node with two unexpected neighbors becomes wrong", () => {
  let run = createMissionRun(1);
  for (const [item, longitude] of [["core", -10], ["satellite", 0], ["internet", 10]]) {
    run = reduceMission(run, { type: "PLACE", item, latitude: 45, longitude, now: 0 });
  }
  assert.equal(deriveNetwork(run, NODE_WAKE_DELAY_MS).states[2], "wrong");
});

test("an invalid adjacent connection is marked wrong immediately", () => {
  let run = createMissionRun(1);
  run = reduceMission(run, { type: "PLACE", item: "terminal", latitude: 45, longitude: 0, now: 0 });
  run = reduceMission(run, { type: "PLACE", item: "gateway", latitude: 45, longitude: 8, now: 0 });
  const [link] = deriveNetwork(run, NODE_WAKE_DELAY_MS).links;
  assert.equal(link.correct, false);
  assert.equal(deriveNetwork(run, NODE_WAKE_DELAY_MS).states[1], "base");
  assert.equal(deriveNetwork(run, NODE_WAKE_DELAY_MS).states[2], "base");
});

test("every network element has its own visible signal radius", () => {
  const radii = Object.values(ITEM_TYPES).map((item) => item.signalRadius);
  assert.equal(radii.every((radius) => Number.isFinite(radius) && radius > 0), true);
  assert.ok(new Set(radii).size > 1);
  assert.ok(ITEM_TYPES.satellite.signalRadius > ITEM_TYPES.terminal.signalRadius);
});

test("nodes link only when their signal coverage overlaps", () => {
  const terminal = { type: "terminal", latitude: 55, longitude: 37, altitude: 0.08 };
  const gatewayNear = { type: "gateway", latitude: 55, longitude: 45, altitude: 0.08 };
  const gatewayFar = { type: "gateway", latitude: 55, longitude: 95, altitude: 0.08 };
  assert.equal(signalRangeBetween(terminal, gatewayNear), ITEM_TYPES.terminal.signalRadius + ITEM_TYPES.gateway.signalRadius);
  assert.equal(signalsOverlap(terminal, gatewayNear), true);
  assert.equal(signalsOverlap(terminal, gatewayFar), false);
});

test("active distant nodes never receive a connection line", () => {
  let run = createMissionRun(1);
  run = reduceMission(run, { type: "PLACE", item: "terminal", latitude: 55, longitude: 20, now: 0 });
  run = reduceMission(run, { type: "PLACE", item: "gateway", latitude: 55, longitude: 100, now: 0 });
  assert.deepEqual(deriveNetwork(run, NODE_WAKE_DELAY_MS).links, []);
});

test("a node links only to its immediate left and right spatial neighbors", () => {
  let run = createMissionRun(1);
  for (const [item, longitude] of [["terminal", -6], ["satellite", 0], ["gateway", 6]]) {
    run = reduceMission(run, { type: "PLACE", item, latitude: 55, longitude, now: 0 });
  }
  const links = deriveNetwork(run, NODE_WAKE_DELAY_MS).links.map(({ a, b }) => [a, b]);
  assert.deepEqual(links, [[1, 2], [2, 3]]);
  assert.equal(links.some(([a, b]) => a === 1 && b === 3), false);
});


test("polar satellite preview and release preserve the exact dragged position on both caps", () => {
  let run = reduceMission(createMissionRun(2), { type: "PLACE", item: "satellite", latitude: 70, longitude: 50, altitude: 0.72 });
  const id = run.placements[0].id;
  for (const latitude of [82.1, 86.1, 89.99, 90, -82.1, -86.1, -89.99, -90]) {
    const geo = { latitude, longitude: 50, altitude: 0.72 };
    const preview = previewPlacementMove(run, id, geo).placements[0];
    run = reduceMission(run, { type: "MOVE", id, ...geo });
    for (const key of ["latitude", "longitude", "altitude"]) {
      assert.equal(preview[key], geo[key]);
      assert.equal(run.placements[0][key], geo[key]);
    }
  }
  const placed = reduceMission(createMissionRun(2), { type: "PLACE", item: "satellite", latitude: 86.1, longitude: 50, altitude: 0.72 });
  assert.equal(placed.placements[0].latitude, 86.1);
});
