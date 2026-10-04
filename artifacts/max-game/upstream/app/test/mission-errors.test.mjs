import assert from "node:assert/strict";
import test from "node:test";
import { createMissionErrorSession, deriveMissionErrors, markMissionErrorSeen, nextUnseenMissionError } from "../src/mission-errors.mjs";
import { createMissionRun, deriveNetwork, NODE_WAKE_DELAY_MS, reduceMission } from "../src/mission-game.mjs";
import { missionCatalog } from "./config-fixture.mjs";

function createWrongGatewaySatelliteTerminal() {
  let run = createMissionRun(1);
  for (const [item, screenX, longitude] of [
    ["gateway", .3, 0],
    ["satellite", .5, 8],
    ["terminal", .7, 16],
  ]) {
    run = reduceMission(run, { type: "PLACE", item, latitude: 45, longitude, now: 0 });
    run.placements.at(-1).screenX = screenX;
  }
  return run;
}

test("connection-order errors use a stable type signature instead of placement ids", () => {
  const run = createWrongGatewaySatelliteTerminal();
  const errors = deriveMissionErrors({
    mission: missionCatalog.byNumber[1],
    run,
    network: deriveNetwork(run, NODE_WAKE_DELAY_MS),
  });
  assert.equal(errors.length, 1);
  assert.equal(errors[0].key, "invalid-connection-order:gateway>satellite>terminal");
  assert.equal(errors[0].typeOrder, "gateway>satellite>terminal");
});

test("the same error can be surfaced only once during one mission session", () => {
  const run = createWrongGatewaySatelliteTerminal();
  const errors = deriveMissionErrors({
    mission: missionCatalog.byNumber[1],
    run,
    network: deriveNetwork(run, NODE_WAKE_DELAY_MS),
  });
  const session = createMissionErrorSession(1);
  const first = nextUnseenMissionError(session, errors);
  assert.equal(first?.key, "invalid-connection-order:gateway>satellite>terminal");
  markMissionErrorSeen(session, first);
  assert.equal(nextUnseenMissionError(session, errors), null);
  assert.equal(nextUnseenMissionError(session, deriveMissionErrors({
    mission: missionCatalog.byNumber[1],
    run: structuredClone(run),
    network: deriveNetwork(run, NODE_WAKE_DELAY_MS),
  })), null);
});

test("a new mission session may surface the same error again", () => {
  const run = createWrongGatewaySatelliteTerminal();
  const errors = deriveMissionErrors({ mission: missionCatalog.byNumber[1], run, network: deriveNetwork(run, NODE_WAKE_DELAY_MS) });
  const firstSession = createMissionErrorSession(1);
  markMissionErrorSeen(firstSession, nextUnseenMissionError(firstSession, errors));
  assert.equal(nextUnseenMissionError(createMissionErrorSession(1), errors)?.key, errors[0].key);
});
