export const STATES = Object.freeze({
  CTA: "CTA",
  ONBOARDING: "ONBOARDING",
  MISSION_SELECT: "MISSION_SELECT",
  MISSION_PLAY: "MISSION_PLAY",
  END: "END",
});

export const STATE_ORDER = Object.freeze(Object.values(STATES));
export const MISSION_STATUSES = Object.freeze({ LOCKED: "locked", OPEN: "open", COMPLETED: "completed" });

export function missionStatus(mission, completed, allMissionsAvailable = false) {
  if (completed.includes(mission.number)) return MISSION_STATUSES.COMPLETED;
  if (allMissionsAvailable) return MISSION_STATUSES.OPEN;
  return mission.unlock.requiresCompleted.every((number) => completed.includes(number)) ? MISSION_STATUSES.OPEN : MISSION_STATUSES.LOCKED;
}

export function nextMissionToPlay(completed, missionOrder) {
  return missionOrder.find((mission) => !completed.includes(mission)) ?? null;
}

export function createInitialState(firstMission = 1) {
  return { screen: STATES.CTA, activeMission: firstMission, completed: [], allMissionsAvailable: false, revision: 0 };
}

export function restoreGameState(saved, missionOrder = [1]) {
  const initial = createInitialState(missionOrder[0]);
  if (!saved || saved.screen === STATES.CTA || !STATE_ORDER.includes(saved.screen)
    || !missionOrder.includes(saved.activeMission) || !Array.isArray(saved.completed)) return initial;
  // Free selection allows legitimate completion outside the normal sequence.
  const completed = missionOrder.filter((mission) => saved.completed.includes(mission));
  const allMissionsAvailable = saved.allMissionsAvailable === true;
  const activeMission = allMissionsAvailable || saved.screen === STATES.MISSION_PLAY
    ? saved.activeMission : nextMissionToPlay(completed, missionOrder) ?? missionOrder.at(-1);
  return { ...saved, activeMission, completed, allMissionsAvailable };
}

export function reduceGame(state, action, missionOrder = [1]) {
  if (!action || typeof action.type !== "string" || !missionOrder.length) return state;
  const firstMission = missionOrder[0];
  const activeMission = missionOrder.includes(state.activeMission) ? state.activeMission : firstMission;
  const playableMission = nextMissionToPlay(state.completed, missionOrder);

  if (action.type === "GO" && STATE_ORDER.includes(action.screen)) {
    if (action.screen === STATES.CTA) return createInitialState(firstMission);
    return moveTo({ ...state, activeMission }, action.screen);
  }
  if (action.type === "SELECT_MISSION") {
    const mission = Number(action.mission);
    const requirements = Array.isArray(action.requiresCompleted) ? action.requiresCompleted : [];
    if (state.screen !== STATES.MISSION_SELECT || !missionOrder.includes(mission)
      || (!state.allMissionsAvailable && (mission !== playableMission || !requirements.every((number) => state.completed.includes(number))))) return state;
    if (mission === activeMission) return state;
    return { ...state, activeMission: mission, revision: state.revision + 1 };
  }
  if (action.type === "PRIMARY") {
    if (state.screen === STATES.CTA) return moveTo(createInitialState(firstMission), STATES.ONBOARDING);
    if (state.screen === STATES.ONBOARDING) return moveTo({ ...state, activeMission }, STATES.MISSION_SELECT);
    if (state.screen === STATES.MISSION_SELECT) {
      const requirements = Array.isArray(action.requiresCompleted) ? action.requiresCompleted : [];
      if (!state.allMissionsAvailable && (activeMission !== playableMission || !requirements.every((number) => state.completed.includes(number)))) return state;
      return moveTo({ ...state, activeMission }, STATES.MISSION_PLAY);
    }
    if (state.screen === STATES.END) return createInitialState(firstMission);
    return state;
  }
  if (action.type === "DEBUG_TOGGLE_UNLOCK") {
    const allMissionsAvailable = !state.allMissionsAvailable;
    return { ...state, allMissionsAvailable,
      activeMission: !allMissionsAvailable && state.screen !== STATES.MISSION_PLAY ? playableMission ?? missionOrder.at(-1) : activeMission,
      revision: state.revision + 1 };
  }
  if (action.type === "DEBUG_COMPLETE_ALL") {
    return { ...state, screen: STATES.MISSION_SELECT, activeMission: missionOrder.at(-1), completed: [...missionOrder], revision: state.revision + 1 };
  }
  if (action.type === "MISSION_COMPLETE") {
    if (state.screen !== STATES.MISSION_PLAY || Number(action.mission) !== activeMission) return state;
    const completed = addCompleted(state.completed, activeMission);
    const nextMission = nextMissionToPlay(completed, missionOrder) ?? activeMission;
    return {
      ...state,
      screen: STATES.MISSION_SELECT,
      activeMission: nextMission,
      completed,
      revision: state.revision + 1,
    };
  }
  if (action.type === "BACK") {
    if (state.screen === STATES.ONBOARDING) return createInitialState(firstMission);
    if (state.screen === STATES.MISSION_SELECT) return moveTo(state, STATES.ONBOARDING);
    if (state.screen === STATES.MISSION_PLAY) return moveTo({ ...state,
      activeMission: state.allMissionsAvailable ? activeMission : playableMission ?? missionOrder.at(-1),
    }, STATES.MISSION_SELECT);
    if (state.screen === STATES.END) return moveTo(state, STATES.MISSION_SELECT);
    return state;
  }
  if (action.type === "FINISH" && state.screen === STATES.MISSION_SELECT && missionOrder.every((mission) => state.completed.includes(mission))) {
    return moveTo(state, STATES.END);
  }
  if (action.type === "RESET") return createInitialState(firstMission);
  return state;
}

function moveTo(state, screen) {
  if (screen === state.screen) return state;
  return { ...state, screen, revision: state.revision + 1 };
}

function addCompleted(completed, mission) {
  return completed.includes(mission) ? completed : [...completed, mission].sort((left, right) => left - right);
}
