import assert from "node:assert/strict";
import test from "node:test";
import { parseMissionCatalog } from "../src/mission-config.mjs";
import { missionCatalog, rawMissionCatalog } from "./config-fixture.mjs";

test("project mission JSON is valid and sorted", () => {
  assert.deepEqual(missionCatalog.missions.map((mission) => mission.number), [1, 2, 3]);
  assert.equal(missionCatalog.byNumber[2].timeSeconds, 150);
  assert.deepEqual(missionCatalog.missions.map((mission) => mission.mapPosition), rawMissionCatalog.missions.map((mission) => mission.mapPosition));
  assert.notDeepEqual(missionCatalog.byNumber[1].endpoints, missionCatalog.byNumber[2].endpoints);
  assert.deepEqual(missionCatalog.missions.map((mission) => mission.connectEndpointsOnComplete), [true, false, true]);
});

test("catalog parser accepts one hundred independently configured missions", () => {
  const template = structuredClone(rawMissionCatalog.missions[0]);
  const missions = Array.from({ length: 100 }, (_, index) => ({
    ...structuredClone(template), number: index + 1, id: `mission-${index + 1}`, name: `МИССИЯ ${index + 1}`,
    mapPosition: { latitude: -70 + (index % 10) * 14, longitude: -170 + Math.floor(index / 10) * 34 },
    unlock: { requiresCompleted: index ? [index] : [] },
  }));
  const catalog = parseMissionCatalog({ schemaVersion: 1, missions });
  assert.equal(catalog.missions.length, 100);
  assert.equal(catalog.byNumber[100].name, "МИССИЯ 100");
});

test("catalog parser rejects duplicate numbers and missing dependencies", () => {
  const first = structuredClone(rawMissionCatalog.missions[0]);
  const duplicate = { ...structuredClone(first), id: "duplicate" };
  assert.throws(() => parseMissionCatalog({ schemaVersion: 1, missions: [first, duplicate] }), /повторяется номер/);
  first.unlock.requiresCompleted = [99];
  assert.throws(() => parseMissionCatalog({ schemaVersion: 1, missions: [first] }), /отсутствующей миссии/);
});

test("catalog parser rejects circular unlock dependencies", () => {
  const first = { ...structuredClone(rawMissionCatalog.missions[0]), unlock: { requiresCompleted: [2] } };
  const second = { ...structuredClone(rawMissionCatalog.missions[1]), unlock: { requiresCompleted: [1] } };
  assert.throws(() => parseMissionCatalog({ schemaVersion: 1, missions: [first, second] }), /циклическая зависимость/);
});

test("catalog parser requires an explicit endpoint closing rule", () => {
  const first = structuredClone(rawMissionCatalog.missions[0]);
  delete first.connectEndpointsOnComplete;
  assert.throws(() => parseMissionCatalog({ schemaVersion: 1, missions: [first] }), /connectEndpointsOnComplete/);
});

test("connected sequence conditions survive catalog parsing and reject malformed chains", () => {
  const mission = structuredClone(rawMissionCatalog.missions[0]);
  const parse = (sequence) => {
    mission.objectives[0].condition = { type: "connectedSequence", sequence };
    return parseMissionCatalog({ schemaVersion: 1, missions: [mission] });
  };
  const sequence = ["endpoint:A", "terminal", "satellite", "satellite", "satellite"];
  assert.deepEqual(parse(sequence).missions[0].objectives[0].condition.sequence, sequence);
  for (const invalid of [[], ["terminal"], ["terminal", "unknown"], ["satellite", "endpoint:A", "terminal"], ["endpoint:B", "satellite", "terminal"]]) {
    assert.throws(() => parse(invalid));
  }
});
