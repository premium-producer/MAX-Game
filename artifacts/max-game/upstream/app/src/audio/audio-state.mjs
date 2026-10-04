export function deriveShellAudioEvents(previousState, nextState, action) {
  if (!previousState || !nextState || previousState === nextState || !action) return [];
  if (action.type === "PRIMARY") {
    if (previousState.screen === "CTA" && nextState.screen === "ONBOARDING") return ["ui.cta.primary"];
    if (previousState.screen === "ONBOARDING" && nextState.screen === "MISSION_SELECT") return ["ui.onboarding.to_mission_select"];
    if (previousState.screen === "MISSION_SELECT" && nextState.screen === "MISSION_PLAY") return ["ui.mission_select.launch"];
    if (previousState.screen === "END" && nextState.screen === "CTA") return ["ui.end.finish_game"];
  }
  if (action.type === "BACK") return ["ui.navigation.back"];
  if (action.type === "MISSION_COMPLETE" && previousState.screen === "MISSION_PLAY" && nextState.screen === "MISSION_SELECT") return ["ui.mission.success_continue"];
  if (action.type === "FINISH" && previousState.screen === "MISSION_SELECT" && nextState.screen === "END") return ["ui.mission_select.finish"];
  return [];
}

export function deriveMissionAudioEvents(previousRun, nextRun, action) {
  if (!previousRun || !nextRun || previousRun === nextRun || !action) return [];
  if (action.type === "RESTART") return ["ui.mission.restart"];
  if (action.type === "PLACE" || action.type === "MOVE") return ["game.node.place_or_move"];
  return [];
}

export function deriveFeedbackAudioEvent(outcome) {
  if (!outcome) return null;
  if (outcome.kind === "success") return "game.popup.success";
  if (outcome.kind === "error" || outcome.action === "timeout") return "game.popup.error";
  return null;
}

export function deriveNetworkAudioSnapshot(network) {
  const snapshot = { blue: 0, green: 0, red: 0 };
  for (const link of network?.links || []) {
    const firstState = network?.states?.[link.a];
    const secondState = network?.states?.[link.b];
    if (firstState === "wrong" || secondState === "wrong") snapshot.red += 1;
    else if (firstState === "link" || secondState === "link" || link.closing === true && link.correct === true) snapshot.green += 1;
    else snapshot.blue += 1;
  }
  return Object.freeze(snapshot);
}

export function diffNetworkAudio(previous = { blue: 0, green: 0, red: 0 }, next = { blue: 0, green: 0, red: 0 }) {
  return Object.freeze(Object.fromEntries(["blue", "green", "red"].map((color) => [color, { started: !previous[color] && next[color] > 0, stopped: previous[color] > 0 && !next[color], active: next[color] > 0 }])));
}

export function chooseVariant(variants, previousVariant = null, random = Math.random) {
  if (!Array.isArray(variants) || !variants.length) return null;
  if (variants.length === 1) return variants[0];
  const candidates = variants.filter((variant) => variant !== previousVariant);
  return candidates[Math.min(candidates.length - 1, Math.floor(Math.max(0, Math.min(0.999999, random())) * candidates.length))];
}

export function shouldResumeAfterVisibility({ unlocked, muted, wasRunningBeforeHidden }) {
  return Boolean(unlocked && !muted && wasRunningBeforeHidden);
}
