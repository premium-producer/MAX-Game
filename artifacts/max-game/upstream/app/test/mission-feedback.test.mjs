import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadMissionCatalog } from "../src/mission-config.mjs";
import { applyMissionFeedback, createMissionFeedbackSession, deriveMissionFeedback, markMissionFeedbackSeen, nextUnseenMissionFeedback } from "../src/mission-feedback.mjs";

const root = resolve(import.meta.dirname, "..");
const diskFetch = (directory) => async (path) => ({ ok: true, json: async () => JSON.parse(await readFile(resolve(directory, path), "utf8")) });
const catalog = await loadMissionCatalog("./config/missions/index.json", diskFetch(resolve(root, "public")));
const mission = catalog.byNumber[2];

test("mission 2 authors a high-satellite error and marks only matched connections", () => {
  const run = { placements: [
    { id: 1, type: "terminal", altitude: .08 },
    { id: 2, type: "satellite", altitude: 1.12 },
    { id: 3, type: "satellite", altitude: .72 },
  ] };
  const network = {
    complete: false,
    objectives: [false, false, false],
    paths: {}, diagnostics: [],
    states: { 1: "base", 2: "base", 3: "base" },
    links: [{ a: 1, b: 2, correct: true }, { a: 2, b: 3, correct: true }],
  };
  const events = deriveMissionFeedback({ mission, run, network });
  const event = events.find((item) => item.id === "satellite-too-high");
  assert.equal(event.title, "СВЯЗЬ НЕ УСТАНОВЛЕНА");
  assert.match(event.message, /Спутник слишком высоко/);
  assert.deepEqual(event.nodeIds, [2]);
  const presented = applyMissionFeedback(network, events);
  assert.equal(presented.complete, false);
  assert.ok(presented.links.every((link) => link.negative));
  assert.equal(presented.states[2], "wrong");
  assert.equal(network.states[2], "base", "domain evaluation must remain immutable");
});

test("a one-sided misplaced object does not trigger an invalid-route popup", () => {
  const run = { placements: [{ id: 7, type: "terminal", altitude: .08 }] };
  const network = {
    complete: false, objectives: [], paths: {}, states: { 7: "base" },
    diagnostics: [{ rule: "slot", node: 7, path: "main", message: "Маршрут main, позиция 2: ожидается satellite" }],
    links: [{ a: "endpoint:A", b: 7, correct: false, neutral: true }],
  };
  const event = deriveMissionFeedback({ mission, run, network }).find((item) => item.id === "invalid-connection");
  assert.equal(event, undefined);
});

test("a two-sided invalid object triggers authored copy without technical diagnostics", () => {
  const run = { placements: [{ id: 1, type: "terminal", altitude: .08 }, { id: 2, type: "satellite", altitude: .72 }, { id: 3, type: "core", altitude: .08 }] };
  const network = {
    complete: false, objectives: [], paths: {}, states: { 1: "base", 2: "base", 3: "base" },
    diagnostics: [{ rule: "slot", node: 2, path: "main", message: "Маршрут main, позиция 2: ожидается terminal" }],
    links: [{ a: 1, b: 2, correct: false, neutral: true }, { a: 2, b: 3, correct: false, neutral: true }],
  };
  const event = deriveMissionFeedback({ mission, run, network }).find((item) => item.id === "invalid-connection");
  assert.equal(event.title, "СВЯЗЬ НЕ УСТАНОВЛЕНА");
  assert.equal(event.message, mission.feedbackEvents.error.find(rule => rule.id === "invalid-connection").message);
  assert.doesNotMatch(`${event.title} ${event.message}`, /main|позиция|terminal/);
  const presented = applyMissionFeedback(network, [event]);
  assert.equal(presented.states[2], "wrong");
  assert.ok(presented.links.every((link) => link.negative));
});

test("feedback session shows each authored event once per mission entry", () => {
  const events = [{ key: "error:first" }, { key: "success:second" }];
  const session = createMissionFeedbackSession(2);
  const first = nextUnseenMissionFeedback(session, events);
  assert.equal(first.key, "error:first");
  markMissionFeedbackSeen(session, first);
  assert.equal(nextUnseenMissionFeedback(session, events).key, "success:second");
});
