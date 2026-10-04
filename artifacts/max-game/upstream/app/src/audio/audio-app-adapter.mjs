import { deriveFeedbackAudioEvent, deriveMissionAudioEvents, deriveNetworkAudioSnapshot, deriveShellAudioEvents } from "./audio-state.mjs";

export class AudioAppAdapter {
  constructor(director) {
    this.director = director;
  }

  afterShellTransition(previousState, nextState, action) {
    const events = deriveShellAudioEvents(previousState, nextState, action);
    if (nextState.screen === "CTA") {
      this.director.enterScreen(nextState.screen);
      for (const eventId of events) this.director.trigger(eventId);
      return;
    }
    for (const eventId of events) this.director.trigger(eventId);
    this.director.enterScreen(nextState.screen);
  }

  afterMissionTransition(previousRun, nextRun, action) {
    for (const eventId of deriveMissionAudioEvents(previousRun, nextRun, action)) this.director.trigger(eventId);
    if (action?.type === "RESTART") this.director.clearNetworkLoops();
  }

  onFeedbackShown(outcome) {
    const eventId = deriveFeedbackAudioEvent(outcome);
    if (eventId) this.director.trigger(eventId);
  }

  syncNetwork(network) {
    this.director.syncNetwork(deriveNetworkAudioSnapshot(network));
  }

  onMissionCardHover() {
    this.director.trigger("ui.mission_select.card_hover");
  }

  onMissionCardPress() {
    this.director.trigger("ui.mission_select.card_press");
  }

  onEarthOrbitGesture() {
    this.director.trigger("ui.cta.camera_orbit");
  }

  onVisibilityChange(hidden) {
    return this.director.handleVisibility(hidden);
  }
}
