// Logical screen coordinates only. Neither camera nor DOM bounds participate in the rules.
export const BOARD = Object.freeze({width: 1720, height: 440, margin: 70});
export const WAKE_MS = 350, HOLD_MS = 300;
export function validateCatalog(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.missions) || data.missions.length !== 4) throw Error('Ожидаются четыре миссии MAX');
  const ids = new Set();
  for (const m of data.missions) {
    if (!m.id || ids.has(m.id) || !m.title || !m.description || !m.start || !m.finish || !m.result) throw Error('Некорректная миссия');
    ids.add(m.id);
    const steps = [...m.steps, ...(m.branches || []).map(b => b.step)];
    if (!m.steps.length || new Set(steps.map(s => s.id)).size !== steps.length || steps.some(s => !s.id || !s.label || !s.detail)) throw Error('Некорректные шаги');
    if (m.branches && (!m.branches.length || new Set(m.branches.map(b => b.id)).size !== m.branches.length || m.branches.some(b => !b.id || !b.label))) throw Error('Некорректные варианты');
  }
  return data;
}
export function missionSteps(mission, branch) {
  if (!mission.branches) return mission.steps;
  const choice = mission.branches.find(b => b.id === branch);
  if (!choice) throw Error('Выбери инструмент продвижения');
  return [...mission.steps, choice.step];
}
export function createRun(mission, branch = mission.branches?.[0].id) {
  missionSteps(mission, branch);
  return {missionId: mission.id, branch, placements: {}, holdSince: null, status: 'playing'};
}
export function placeNode(run, mission, id, point, now) {
  if (run.status === 'complete' || !missionSteps(mission, run.branch).some(s => s.id === id) || !Number.isFinite(point?.x) || !Number.isFinite(point?.y) || !Number.isFinite(now)) return run;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  return {...run, holdSince: null, placements: {...run.placements, [id]: {
    x: clamp(point.x, BOARD.margin + 90, BOARD.width - BOARD.margin - 90),
    y: clamp(point.y, BOARD.margin, BOARD.height - 150), droppedAt: now
  }}};
}
export function removeNode(run, id) {
  if (run.status === 'complete' || !run.placements[id]) return run;
  const placements = {...run.placements}; delete placements[id];
  return {...run, placements, holdSince: null};
}
export function evaluateRoute(run, mission, now, {interacting = false, paused = false, hidden = false} = {}) {
  const steps = missionSteps(mission, run.branch);
  const reach = (BOARD.width - BOARD.margin * 2) / (steps.length + 1) * 1.28;
  const nodes = [{id: 'start', x: BOARD.margin, y: BOARD.height / 2},
    ...steps.map(step => ({id: step.id, ...run.placements[step.id]})),
    {id: 'finish', x: BOARD.width - BOARD.margin, y: BOARD.height / 2}];
  const awake = n => n.droppedAt == null || now - n.droppedAt >= WAKE_MS;
  const links = nodes.slice(1).map((b, i) => {
    const a = nodes[i];
    const present = [a.x, a.y, b.x, b.y].every(Number.isFinite);
    const ordered = present && b.x - a.x >= 90;
    const distance = present ? Math.hypot(b.x - a.x, b.y - a.y) : Infinity;
    return {a, b, present, connected: ordered && distance <= reach && awake(a) && awake(b)};
  });
  return {nodes, links, reach, ready: Number.isFinite(now) && !interacting && !paused && !hidden && links.every(l => l.connected),
    placed: steps.filter(s => run.placements[s.id]).length, total: steps.length};
}
export function tickRun(run, mission, now, flags) {
  if (run.status === 'complete') return run;
  if (!evaluateRoute(run, mission, now, flags).ready) return run.holdSince === null ? run : {...run, holdSince: null};
  if (run.holdSince === null) return {...run, holdSince: now};
  return now - run.holdSince >= HOLD_MS ? {...run, status: 'complete'} : run;
}
