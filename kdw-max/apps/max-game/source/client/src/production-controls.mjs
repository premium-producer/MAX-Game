export const DEFAULT_CONNECTION_MODE = "hybrid";
export const DEBUG_SESSION_KEY = "max-space:debug-session";
export const BACK_CLICK_GAP_MS = 500;

export function readDebugSession(storage) {
  try { return storage?.getItem(DEBUG_SESSION_KEY) === "1"; } catch { return false; }
}

export function saveDebugSession(storage, enabled) {
  try {
    if (enabled) storage?.setItem(DEBUG_SESSION_KEY, "1");
    else storage?.removeItem(DEBUG_SESSION_KEY);
  } catch { /* Debug can still be toggled for the current page. */ }
}

export function initialControls(search, debugEnabled, savedPlacement = "tap") {
  const params = new URLSearchParams(search);
  const requested = params.get("connection");
  return {
    connection: debugEnabled && ["world", "screen", "hybrid"].includes(requested) ? requested : DEFAULT_CONNECTION_MODE,
    placement: debugEnabled && savedPlacement === "drag" ? "drag" : "tap",
  };
}

// Ten consecutive Back clicks; other controls and pauses reset the sequence.
export function createDebugGesture(maxGapMs = BACK_CLICK_GAP_MS) {
  let count = 0, previousAt = 0;
  return (target, now = Date.now()) => {
    if (target !== "back" || now - previousAt >= maxGapMs || now < previousAt) count = 0;
    previousAt = now;
    if (target !== "back") return false;
    count++;
    if (count !== 10) return false;
    count = 0;
    return true;
  };
}
