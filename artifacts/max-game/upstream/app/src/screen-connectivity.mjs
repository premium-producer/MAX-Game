// Domain policy: all lengths are logical canvas pixels, independent of DPR.
export const SCREEN_CONNECTION_DEFAULTS = Object.freeze({
  corridorFraction: 0.25, ambiguityFraction: 0.01, minimumEndpointSpan: 120,
  iconGap: 8, stableHoldMs: 300,
});
export const projectedPolicy = (policy) => ["screenProjected", "hybridProjected"].includes(policy);
export const usesScreenConnections = (mission) => mission?.topology?.paths.some((path) => projectedPolicy(path.connection?.policy)) === true;
export const connectionMode = (mission) => mission?.topology?.paths.some((path) => path.connection?.policy === "hybridProjected") ? "hybrid" : usesScreenConnections(mission) ? "screen" : "world";
export const screenParameters = (connection) => ({ ...SCREEN_CONNECTION_DEFAULTS, ...connection?.screen });
export function validProjection(run, snapshot, now) {
  return snapshot?.mission === run.mission && snapshot.placements === run.placements
    && Number.isFinite(now) && Number.isFinite(snapshot.timestamp)
    && now >= snapshot.timestamp && now - snapshot.timestamp <= 120;
}
export function screenGeometry(connection, snapshot, from, to) {
  const config = screenParameters(connection), nodes = snapshot?.nodes || {};
  const valid = (p) => nodes[p.id]?.eligible === true && !p.placementBlocked;
  const vector = (p) => [nodes[p.id]?.x ?? 0, nodes[p.id]?.y ?? 0, 0];
  const radius = (p) => nodes[p.id]?.radius ?? 0;
  const distance = (a, b) => valid(a) && valid(b) ? Math.hypot(nodes[a.id].x - nodes[b.id].x, nodes[a.id].y - nodes[b.id].y) : Infinity;
  // Endpoint coordinates define the axis independently of eligibility.
  // Visibility is checked by each projected edge; hybrid ground edges use distance.
  const first = nodes[from.id], last = nodes[to.id];
  const span = first && last ? Math.hypot(last.x - first.x, last.y - first.y) : NaN;
  const axisValid = Number.isFinite(span) && span >= config.minimumEndpointSpan;
  const connects = (a, b) => valid(a) && valid(b) && distance(a, b) >= (nodes[a.id]?.iconRadius ?? 0) + (nodes[b.id]?.iconRadius ?? 0) + config.iconGap;
  return { vector, radius, distance, valid, connects, axisValid,
    corridorWidth: axisValid ? span * config.corridorFraction : 0,
    ambiguityEpsilon: config.ambiguityFraction };
}

// The reducer owns the hold. A fresh view with changed camera/placements resets it.
export function screenHold(mission, previous, snapshot, evaluation, now) {
  if (!evaluation.complete || snapshot.interacting || snapshot.hidden) return null;
  const binding = JSON.stringify(evaluation.bindings);
  const same = previous?.revision === snapshot.revision && previous.binding === binding;
  return { revision: snapshot.revision, binding, since: same ? previous.since : now };
}
export function screenReady(mission, run, now) {
  const snapshot = run.connectionProjection, hold = run.connectionHold;
  if (!hold || !validProjection(run, snapshot, now) || snapshot.interacting || snapshot.hidden || hold.revision !== snapshot.revision) return false;
  let delay = 0;
  for (const path of mission.topology.paths) if (projectedPolicy(path.connection.policy)) {
    delay = Math.max(delay, path.connection.screen?.stableHoldMs ?? SCREEN_CONNECTION_DEFAULTS.stableHoldMs);
  }
  return now - hold.since >= delay;
}
