import assert from "node:assert/strict";
import test from "node:test";
import { appendMission, commitHistory, createHistory, deleteMission, moveArrayItem, redoHistory, reorderMissions, routeCounts, serializableCatalog, toEditableCatalog, undoHistory } from "../src/editor-state.mjs";
import { missionCatalog } from "./config-fixture.mjs";

test("editor derives equipment counts exclusively from the ordered route", () => {
  assert.deepEqual(routeCounts(["terminal", "satellite", "satellite", "gateway"]), { terminal: 1, satellite: 2, gateway: 1 });
});

test("editor creates unique duplicated missions and serializes runtime JSON", () => {
  const catalog = toEditableCatalog(missionCatalog);
  const { catalog: next, mission } = appendMission(catalog, catalog.missions[0]);
  assert.equal(next.missions.length, 4);
  assert.equal(mission.number, 4);
  assert.notEqual(mission.id, catalog.missions[0].id);
  assert.deepEqual(mission.unlock.requiresCompleted, [3]);
  const serialized = serializableCatalog(next);
  assert.equal(serialized.schemaVersion, 1);
  assert.equal(serialized.missions.length, 4);
  assert.equal("byNumber" in serialized, false);
});

test("mission reorder renumbers dependencies without leaving stale references", () => {
  const catalog = toEditableCatalog(missionCatalog);
  const reordered = reorderMissions(catalog, 2, 0);
  assert.deepEqual(reordered.missions.map((mission) => mission.number), [1, 2, 3]);
  assert.equal(reordered.missions[0].id, catalog.missions[2].id);
  for (const mission of reordered.missions) assert.ok(mission.unlock.requiresCompleted.every((number) => number !== mission.number));
  const deleted = deleteMission(reordered, reordered.missions[1].id);
  assert.deepEqual(deleted.missions.map((mission) => mission.number), [1, 2]);
});

test("editor history treats a catalog change as one undoable operation", () => {
  const catalog = toEditableCatalog(missionCatalog);
  let history = createHistory(catalog);
  history = commitHistory(history, { ...catalog, missions: moveArrayItem(catalog.missions, 0, 1) });
  assert.equal(history.past.length, 1);
  history = undoHistory(history);
  assert.equal(history.present.missions[0].id, catalog.missions[0].id);
  history = redoHistory(history);
  assert.equal(history.present.missions[0].id, catalog.missions[1].id);
});
