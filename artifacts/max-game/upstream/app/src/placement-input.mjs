export const PLACEMENT_MODE_KEY = "space-connected:placement-mode";
export const TAP_SLOP_PX = 8;
export const TAP_ALTITUDE_STEPS = 20;

export function loadPlacementMode(search, storage) {
  const requested = new URLSearchParams(search).get("placement");
  if (["tap", "drag"].includes(requested)) return requested;
  try { return storage?.getItem(PLACEMENT_MODE_KEY) === "drag" ? "drag" : "tap"; }
  catch { return "tap"; }
}

// Use the whole gesture, including the release displacement. A rotation that
// returns to its starting point, a second finger or pointercancel is not a tap.
export function isPlacementTap(start, event, { moved = false, cancelled = false, item, rect } = {}) {
  return Boolean(start && item && start.item === item && isCanvasTap(start, event, { moved, cancelled, rect }));
}

export function isCanvasTap(start, event, { moved = false, cancelled = false, rect } = {}) {
  return Boolean(start && !cancelled && !moved && !start.swiped && !start.multitouch
    && start.pointerId === event.pointerId && event.button === 0
    && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= (start.slopPx ?? TAP_SLOP_PX)
    && event.clientX >= rect.left && event.clientX <= rect.right
    && event.clientY >= rect.top && event.clientY <= rect.bottom);
}

export function steppedAltitude(altitude, settings, direction) {
  const step = (settings.maxAltitude - settings.minAltitude) / TAP_ALTITUDE_STEPS;
  return Math.min(settings.maxAltitude, Math.max(settings.minAltitude, altitude + direction * step));
}
