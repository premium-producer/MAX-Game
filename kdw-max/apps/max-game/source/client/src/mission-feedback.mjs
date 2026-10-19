import { usesScreenConnections } from "./screen-connectivity.mjs";
// Authored mission feedback. This module turns domain evaluation into presentation
// events; it never decides whether a mission is complete.
export const FEEDBACK_POPUP_DELAY_MS = 220;

const INVALID_DIAGNOSTICS = new Set(["slot", "binding", "ambiguous"]);

export function deriveMissionFeedback({ mission, run, network }) {
  if (!mission || !run || !network) return [];
  const source = mission.feedbackEvents || legacyFeedbackEvents(mission);
  const complete = (source.success || [])
    .map((rule) => resolveRule("success", rule, mission, run, network))
    .filter((event) => event && (!usesScreenConnections(mission) || event.action !== "complete" || run.status === "complete"));
  if (network.complete) return complete.filter((event) => event.action === "complete");
  return [
    ...(source.error || []).map((rule) => resolveRule("error", rule, mission, run, network)).filter(Boolean),
    ...complete.filter((event) => event.action !== "complete"),
  ];
}

function resolveRule(kind, rule, mission, run, network) {
  const match = evaluateFeedbackCondition(rule.condition, mission, run, network);
  if (!match.active) return null;
  return {
    ...rule,
    kind,
    key: `${kind}:${rule.id}`,
    nodeIds: match.nodeIds,
    anchorId: match.nodeIds[0] ?? null,
  };
}

export function evaluateFeedbackCondition(condition, mission, run, network) {
  const placements = run.placements || [];
  if (condition.type === "missionComplete") return { active: network.complete === true, nodeIds: [] };
  if (condition.type === "invalidConnection") {
    const fullyConnected = fullyConnectedNodeIds(network.links || []);
    const diagnostics = (network.diagnostics || []).filter((item) => INVALID_DIAGNOSTICS.has(item.rule)
      && (typeof item.node === "number" ? fullyConnected.has(item.node) : fullyConnected.size > 0));
    const wrongLinks = (network.links || []).filter((link) => link.correct === false
      && (fullyConnected.has(link.a) || fullyConnected.has(link.b)));
    const nodeIds = unique([
      ...diagnostics.map((item) => item.node).filter((id) => fullyConnected.has(id)),
      ...wrongLinks.flatMap((link) => [link.a, link.b]).filter((id) => fullyConnected.has(id)),
    ]);
    return { active: diagnostics.length > 0 || wrongLinks.length > 0, nodeIds };
  }
  if (condition.type === "objectiveComplete") {
    const index = mission.objectives.findIndex((objective) => objective.id === condition.objective);
    return { active: index >= 0 && network.objectives?.[index] === true, nodeIds: [] };
  }
  if (condition.type === "pathComplete") {
    const path = network.paths?.[condition.path];
    return { active: path?.complete === true, nodeIds: path?.ordered?.map((node) => node.id) || [] };
  }
  if (condition.type === "altitude") {
    const candidates = placements.filter((placement) => placement.type === condition.object);
    const compare = condition.comparison === "below"
      ? (placement) => placement.altitude < condition.value
      : (placement) => placement.altitude > condition.value;
    const matching = candidates.filter(compare);
    const active = condition.quantifier === "all"
      ? candidates.length > 0 && matching.length === candidates.length
      : matching.length > 0;
    return { active, nodeIds: matching.map((placement) => placement.id) };
  }
  return { active: false, nodeIds: [] };
}

// Applies only a visual overlay to an already evaluated network. Completion,
// objectives, diagnostics and bindings stay untouched.
export function applyMissionFeedback(network, events) {
  const negativeEvents = events.filter((event) => event.kind === "error" && event.negativeConnections !== "none");
  if (!negativeEvents.length) return network;
  const fullyConnected = fullyConnectedNodeIds(network.links || []);
  const shouldMark = (link, event) => {
    const nodeIds = new Set(event.nodeIds || []);
    if (event.negativeConnections === "all") return true;
    if (event.negativeConnections === "invalid") return link.correct === false;
    return event.negativeConnections === "matched" && (nodeIds.has(link.a) || nodeIds.has(link.b));
  };
  const states = { ...(network.states || {}) };
  if (negativeEvents.some((event) => event.negativeConnections === "all")) {
    for (const id of fullyConnected) states[id] = "wrong";
  } else {
    for (const link of network.links || []) if (negativeEvents.some((event) => shouldMark(link, event))) {
      if (fullyConnected.has(link.a)) states[link.a] = "wrong";
      if (fullyConnected.has(link.b)) states[link.b] = "wrong";
    }
    for (const event of negativeEvents) for (const id of event.nodeIds || []) if (fullyConnected.has(id)) states[id] = "wrong";
  }
  const links = (network.links || []).map((link) => negativeEvents.some((event) => shouldMark(link, event))
    && (states[link.a] === "wrong" || states[link.b] === "wrong")
    ? { ...link, negative: true, neutral: false }
    : link.negative ? { ...link, negative: false } : link);
  return { ...network, links, states };
}

export function createMissionFeedbackSession(missionNumber) {
  return { missionNumber, seen: new Set() };
}

export function nextUnseenMissionFeedback(session, events) {
  if (!session) return null;
  return events.find((event) => !session.seen.has(event.key)) || null;
}

export function markMissionFeedbackSeen(session, event) {
  if (session && event?.key) session.seen.add(event.key);
  return event;
}

function unique(items) { return [...new Set(items)]; }

function fullyConnectedNodeIds(links) {
  const neighbors = new Map();
  for (const link of links) for (const [id, neighbor] of [[link.a, link.b], [link.b, link.a]]) {
    if (typeof id !== "number") continue;
    if (!neighbors.has(id)) neighbors.set(id, new Set());
    neighbors.get(id).add(neighbor);
  }
  return new Set([...neighbors].filter(([, ids]) => ids.size >= 2).map(([id]) => id));
}

function legacyFeedbackEvents(mission) {
  return {
    success: [{ id: "mission-complete", eyebrow: `МИССИЯ №${mission.number} ВЫПОЛНЕНА`, title: mission.successText, message: "Маршрут собран верно, все участки сети соединены.", condition: { type: "missionComplete" }, action: "complete" }],
    error: mission.feedback?.invalid === "neutral" ? [] : [{ id: "invalid-connection", eyebrow: "ОШИБКА СОЕДИНЕНИЯ", title: "ПРОВЕРЬ ПОРЯДОК ОБОРУДОВАНИЯ", message: "Соедини элементы сети в последовательности, указанной в задании.", condition: { type: "invalidConnection" }, negativeConnections: "invalid" }],
  };
}
