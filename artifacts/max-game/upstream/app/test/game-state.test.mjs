import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState, missionStatus, MISSION_STATUSES, nextMissionToPlay, reduceGame, restoreGameState, STATES } from "../src/game-state.mjs";

const order = [1, 2, 3];

test("runtime has exactly five interactive screen states", () => {
  assert.deepEqual(Object.values(STATES), ["CTA", "ONBOARDING", "MISSION_SELECT", "MISSION_PLAY", "END"]);
});

test("primary flow reaches the final screen and records completed missions", () => {
  let state = createInitialState(order[0]);
  state = reduceGame(state, { type: "PRIMARY" }, order);
  state = reduceGame(state, { type: "PRIMARY" }, order);
  for (const mission of order) {
    state = reduceGame(state, { type: "PRIMARY" }, order);
    state = reduceGame(state, { type: "MISSION_COMPLETE", mission }, order);
  }
  state = reduceGame(state, { type: "FINISH" }, order);
  assert.equal(state.screen, STATES.END);
  assert.deepEqual(state.completed, order);
});

test("the same state machine supports one hundred missions", () => {
  const hundred = Array.from({ length: 100 }, (_, index) => index + 1);
  let state = { ...createInitialState(1), screen: STATES.MISSION_SELECT };
  for (const mission of hundred) {
    assert.equal(state.activeMission, mission);
    state = reduceGame(state, { type: "PRIMARY" }, hundred);
    state = reduceGame(state, { type: "MISSION_COMPLETE", mission }, hundred);
  }
  state = reduceGame(state, { type: "FINISH" }, hundred);
  assert.equal(state.screen, STATES.END);
  assert.equal(state.completed.length, 100);
});

test("finishing the final screen starts a clean session", () => {
  const finished = { screen: STATES.END, activeMission: 3, completed: order, revision: 9 };
  assert.deepEqual(reduceGame(finished, { type: "PRIMARY" }, order), createInitialState(1));
});

test("back and reset are deterministic", () => {
  let state = reduceGame(createInitialState(), { type: "PRIMARY" }, order);
  assert.equal(state.screen, STATES.ONBOARDING);
  state = reduceGame(state, { type: "BACK" }, order);
  assert.equal(state.screen, STATES.CTA);
  state = reduceGame({ screen: STATES.END, activeMission: 3, completed: order, revision: 20 }, { type: "RESET" }, order);
  assert.deepEqual(state, createInitialState());
});

test("returning through onboarding to CTA clears completed missions and starts with mission one", () => {
  let state = { screen: STATES.MISSION_SELECT, activeMission: 3, completed: [1, 2], revision: 12 };
  state = reduceGame(state, { type: "BACK" }, order);
  assert.equal(state.screen, STATES.ONBOARDING);
  assert.deepEqual(state.completed, [1, 2]);
  state = reduceGame(state, { type: "BACK" }, order);
  assert.deepEqual(state, createInitialState(1));
  state = reduceGame(reduceGame(state, { type: "PRIMARY" }, order), { type: "PRIMARY" }, order);
  assert.equal(state.screen, STATES.MISSION_SELECT);
  assert.equal(nextMissionToPlay(state.completed, order), 1);
  assert.equal(missionStatus({ number: 2, unlock: { requiresCompleted: [1] } }, state.completed), MISSION_STATUSES.LOCKED);
});

test("every direct CTA entry resets the session using the configured first mission", () => {
  const customOrder = [4, 7, 9];
  for (const screen of Object.values(STATES)) {
    const old = { screen, activeMission: 9, completed: [4, 7], revision: 20 };
    assert.deepEqual(reduceGame(old, { type: "GO", screen: STATES.CTA }, customOrder), createInitialState(4));
    assert.deepEqual(old.completed, [4, 7], "previous state is not mutated");
  }
});

test("restoring an old CTA session drops stale progress while other screens keep valid progress", () => {
  const saved = { screen: STATES.CTA, activeMission: 3, completed: [1, 2], revision: 8 };
  assert.deepEqual(restoreGameState(saved, order), createInitialState(1));
  const playing = restoreGameState({ ...saved, screen: STATES.MISSION_PLAY }, order);
  assert.deepEqual(playing.completed, [1, 2]);
  assert.equal(playing.activeMission, 3);
  assert.deepEqual(restoreGameState(null, order), createInitialState(1));
  assert.deepEqual(restoreGameState({ ...saved, screen: STATES.MISSION_SELECT, completed: [1, 3, 99] }, order).completed, [1, 3]);
});

test("only the next incomplete mission can be selected", () => {
  const state = { ...createInitialState(), screen: STATES.MISSION_SELECT };
  assert.equal(reduceGame(state, { type: "SELECT_MISSION", mission: 2, requiresCompleted: [1] }, order), state);
  const ready = { ...state, activeMission: 2, completed: [1] };
  assert.equal(reduceGame(ready, { type: "SELECT_MISSION", mission: 1, requiresCompleted: [] }, order), ready);
  assert.equal(reduceGame(ready, { type: "SELECT_MISSION", mission: 3, requiresCompleted: [1, 2] }, order), ready);
  assert.equal(nextMissionToPlay(ready.completed, order), 2);
});

test("mission status is locked, open or completed", () => {
  const first = { number: 1, unlock: { requiresCompleted: [] } };
  const second = { number: 2, unlock: { requiresCompleted: [1] } };
  assert.equal(missionStatus(first, []), MISSION_STATUSES.OPEN);
  assert.equal(missionStatus(second, []), MISSION_STATUSES.LOCKED);
  assert.equal(missionStatus(second, [1]), MISSION_STATUSES.OPEN);
  assert.equal(missionStatus(second, [1, 2]), MISSION_STATUSES.COMPLETED);
});

test("successful mission returns to the map and selects the newly opened mission", () => {
  const playing = { screen: STATES.MISSION_PLAY, activeMission: 1, completed: [], revision: 3 };
  const result = reduceGame(playing, { type: "MISSION_COMPLETE", mission: 1 }, order);
  assert.equal(result.screen, STATES.MISSION_SELECT);
  assert.equal(result.activeMission, 2);
  assert.deepEqual(result.completed, [1]);
});

test("locked active mission cannot launch", () => {
  const state = { ...createInitialState(2), screen: STATES.MISSION_SELECT };
  assert.equal(reduceGame(state, { type: "PRIMARY", requiresCompleted: [1] }, order), state);
});

test("completed missions cannot be launched again", () => {
  const completedFirst = { screen: STATES.MISSION_SELECT, activeMission: 1, completed: [1], revision: 5 };
  assert.equal(reduceGame(completedFirst, { type: "PRIMARY", requiresCompleted: [] }, order), completedFirst);
  const finished = { screen: STATES.MISSION_SELECT, activeMission: 3, completed: order, revision: 12 };
  assert.equal(reduceGame(finished, { type: "PRIMARY", requiresCompleted: [1, 2] }, order), finished);
  assert.equal(nextMissionToPlay(finished.completed, order), null);
});

test("a mission cannot be skipped with the primary action", () => {
  const state = { screen: STATES.MISSION_PLAY, activeMission: 1, completed: [], revision: 3 };
  assert.equal(reduceGame(state, { type: "PRIMARY" }, order), state);
  assert.equal(reduceGame(state, { type: "MISSION_COMPLETE", mission: 2 }, order), state);
  assert.equal(reduceGame(state, { type: "MISSION_COMPLETE", mission: 1 }, order).screen, STATES.MISSION_SELECT);
});


test("debug check completes the catalog and unlocks the normal finale without simulating gameplay", () => {
  const catalogOrder = [2, 5, 9];
  const before = { ...createInitialState(2), screen: STATES.MISSION_PLAY, completed: [2], activeMission: 5 };
  const done = reduceGame(before, { type: "DEBUG_COMPLETE_ALL" }, catalogOrder);
  assert.deepEqual(done.completed, catalogOrder);
  assert.notEqual(done.completed, catalogOrder);
  assert.equal(done.activeMission, 9);
  assert.equal(done.screen, STATES.MISSION_SELECT);
  assert.equal(reduceGame(done, { type: "FINISH" }, catalogOrder).screen, STATES.END);
  assert.deepEqual(before.completed, [2]);
  assert.deepEqual(reduceGame(done, { type: "GO", screen: STATES.CTA }, catalogOrder).completed, []);
});

test("unlock toggle permits closed and completed missions without completing them", () => {
  const initial = { ...createInitialState(), screen: STATES.MISSION_SELECT, completed: [1] };
  let state = reduceGame(initial, { type: "DEBUG_TOGGLE_UNLOCK" }, order);
  assert.deepEqual(state.completed, [1]);
  for (const mission of [3, 1, 2]) {
    state = reduceGame(state, { type: "SELECT_MISSION", mission, requiresCompleted: [1, 2] }, order);
    assert.equal(state.activeMission, mission);
    state = reduceGame(state, { type: "PRIMARY", requiresCompleted: [1, 2] }, order);
    assert.equal(state.screen, STATES.MISSION_PLAY);
    state = reduceGame(state, { type: "BACK" }, order);
  }
  assert.equal(reduceGame(state, { type: "SELECT_MISSION", mission: 99 }, order), state);
  state = reduceGame(state, { type: "DEBUG_TOGGLE_UNLOCK" }, order);
  assert.equal(state.allMissionsAvailable, false);
  assert.equal(state.activeMission, 2);
  assert.equal(reduceGame(state, { type: "SELECT_MISSION", mission: 3 }, order), state);
  assert.equal(reduceGame(state, { type: "SELECT_MISSION", mission: 1 }, order), state);
});

test("out-of-order wins and replay survive restore without duplicate completion", () => {
  let state = { ...createInitialState(), screen: STATES.MISSION_SELECT, allMissionsAvailable: true };
  for (const mission of [3, 3, 1, 2]) {
    state = reduceGame(state, { type: "SELECT_MISSION", mission }, order);
    state = reduceGame(state, { type: "PRIMARY" }, order);
    state = reduceGame(state, { type: "MISSION_COMPLETE", mission }, order);
    state = restoreGameState(JSON.parse(JSON.stringify(state)), order);
    assert.equal(state.completed.filter(n => n === mission).length, 1);
  }
  assert.deepEqual(state.completed, order);
  state = reduceGame(state, { type: "DEBUG_TOGGLE_UNLOCK" }, order);
  assert.equal(reduceGame(state, { type: "PRIMARY" }, order), state);
  assert.equal(reduceGame(state, { type: "FINISH" }, order).screen, STATES.END);
  assert.deepEqual(reduceGame(state, { type: "GO", screen: STATES.CTA }, order), createInitialState());
});

test("switching access off during replay preserves the running mission and returns to normal selection", () => {
  let state = { ...createInitialState(), screen: STATES.MISSION_PLAY, activeMission: 3, completed: [1], allMissionsAvailable: true };
  state = reduceGame(state, { type: "DEBUG_TOGGLE_UNLOCK" }, order);
  assert.equal(state.activeMission, 3);
  assert.equal(restoreGameState(state, order).activeMission, 3);
  assert.equal(reduceGame(state, { type: "BACK" }, order).activeMission, 2);
  const won = reduceGame(state, { type: "MISSION_COMPLETE", mission: 3 }, order);
  assert.equal(won.activeMission, 2);
  assert.deepEqual(restoreGameState(won, order).completed, [1, 3]);
});
