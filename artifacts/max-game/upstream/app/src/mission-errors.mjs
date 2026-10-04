import { orderedPlacements } from "./mission-game.mjs";

// Legacy v1 compatibility helpers. The current game uses mission-feedback.mjs
// and authored feedbackEvents; keep this module only for old catalog consumers.

export const ERROR_POPUP_DELAY_MS = 220;

const INVALID_CONNECTION_RULE = Object.freeze({
  id: "invalid-connection-order",
  detect({ run, network }) {
    const placements = orderedPlacements(run);
    const indexById = new Map(placements.map((placement, index) => [placement.id, index]));
    const edges = network.links
      .filter((link) => link.correct === false && typeof link.a === "number" && typeof link.b === "number")
      .map((link) => {
        const first = indexById.get(link.a);
        const second = indexById.get(link.b);
        return first === undefined || second === undefined ? null : { start: Math.min(first, second), end: Math.max(first, second) };
      })
      .filter(Boolean)
      .sort((left, right) => left.start - right.start);
    if (!edges.length) return [];

    const groups = [];
    for (const edge of edges) {
      const previous = groups.at(-1);
      if (previous && edge.start <= previous.end) previous.end = Math.max(previous.end, edge.end);
      else groups.push({ ...edge });
    }
    return groups.map(({ start, end }) => {
      const sequence = placements.slice(start, end + 1);
      const typeOrder = sequence.map((placement) => placement.type).join(">");
      return {
        key: `${INVALID_CONNECTION_RULE.id}:${typeOrder}`,
        code: INVALID_CONNECTION_RULE.id,
        title: "НЕВЕРНОЕ СОЕДИНЕНИЕ",
        anchorId: sequence[Math.floor(sequence.length / 2)].id,
        typeOrder,
      };
    });
  },
});

const CHECKED_ROUTE_RULE = Object.freeze({
  id: "checked-route-order",
  detect({ run, connectionErrors }) {
    if (run.status !== "error" || connectionErrors.length) return [];
    const placements = orderedPlacements(run);
    const typeOrder = placements.map((placement) => placement.type).join(">");
    return [{
      key: `${CHECKED_ROUTE_RULE.id}:${typeOrder}`,
      code: CHECKED_ROUTE_RULE.id,
      title: "НЕВЕРНЫЙ ПОРЯДОК",
      anchorId: placements[Math.floor(placements.length / 2)]?.id ?? null,
      typeOrder,
    }];
  },
});

export const MISSION_ERROR_RULES = Object.freeze([INVALID_CONNECTION_RULE, CHECKED_ROUTE_RULE]);

export function deriveMissionErrors({ mission, run, network }) {
  if (!mission || !run || !network) return [];
  if (mission.engineVersion === 2) return mission.feedback.invalid === "neutral" ? [] : (network.diagnostics || [])
    .filter((d) => ["slot", "binding", "ambiguous"].includes(d.rule) && (d.node === undefined || network.states[d.node] !== "drop"))
    .map((d) => ({ key: `${d.rule}:${d.path}:${d.slot || d.role || ""}:${d.expected || ""}:${d.actual || ""}`, code: d.rule, title: d.message, anchorId: d.node ?? null }));
  const connectionErrors = INVALID_CONNECTION_RULE.detect({ mission, run, network });
  const context = { mission, run, network, connectionErrors };
  return [
    ...connectionErrors,
    ...MISSION_ERROR_RULES.slice(1).flatMap((rule) => rule.detect(context)),
  ];
}

export function createMissionErrorSession(missionNumber) {
  return { missionNumber, seen: new Set() };
}

export function nextUnseenMissionError(session, errors) {
  if (!session) return null;
  return errors.find((error) => !session.seen.has(error.key)) || null;
}

export function markMissionErrorSeen(session, error) {
  if (session && error?.key) session.seen.add(error.key);
  return error;
}
