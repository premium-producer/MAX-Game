import { screenGeometry, projectedPolicy } from "./screen-connectivity.mjs";
import { resolveSignalRadius } from "./node-settings.mjs";
import { buildRouteLayout } from "./route-layout.mjs";

export const NODE_WAKE_DELAY_MS = 350;

// Pure domain evaluator. Optional projected geometry is supplied by the view adapter; no DOM or Three.js dependency.
export function evaluateMission(mission, placements, settings, now, wakeDelay = NODE_WAKE_DELAY_MS, projection = null) {
  if (placements.some((p) => p.placementBlocked)) placements = placements.filter((p) => !p.placementBlocked);
  const states = Object.fromEntries(placements.map((p) => [p.id, now - p.droppedAt < wakeDelay ? "drop" : "base"]));
  const paths = {};
  const diagnostics = [];
  const links = [];
  const merged = Object.fromEntries(Object.entries(settings).map(([type, values]) => [type, { ...values, ...mission.objectSettings?.[type] }]));
  const awake = (p) => String(p.id).startsWith("endpoint:") || now - p.droppedAt >= wakeDelay;
  const point = (id) => ({ ...mission.endpoints[id], id: `endpoint:${id}`, type: `endpoint:${id}`, altitude: 0.012 });
  const radius = (p) => p.signalRadius ?? resolveSignalRadius(p, merged, p.type.startsWith("endpoint:") && !merged[p.type] ? "endpoint:A" : p.type);
  for (const path of mission.topology.paths) {
    const variants = pathEndpointVariants(mission, path).map(({ from, to }) => evaluatePathVariant({
      mission, path, from, to, placements, point, radius, awake, projection,
    }));
    const activeVariants = filterEndpointSignalVariants(path, variants);
    const selected = activeVariants.reduce((best, candidate) => variantIsBetter(candidate, best) ? candidate : best, activeVariants[0]);
    paths[path.id] = { ...selected.result, from: selected.from, to: selected.to,
      alternatives: variants.map((variant) => ({ from: variant.from, to: variant.to, complete: variant.result.complete })) };
    links.push(...selected.links);
    for (const variant of variants) {
      if (variant === selected) continue;
      links.push(...variant.links.filter((link) => link.endpointSide && path.endpointSignals?.[link.endpointSide] === "parallel"));
    }
    diagnostics.push(...selected.diagnostics);
    for (const [id, value] of Object.entries(selected.stateUpdates)) {
      // A node is positive when it forms a valid local fragment of any authored
      // path. A conflicting alternative path must not overwrite that evidence.
      if (value === "link" || states[id] !== "link") states[id] = value;
    }
  }
  const evaluate = (c) => {
    if (c.type === "all") return c.children.every(evaluate);
    if (c.type === "any") return c.children.some(evaluate);
    if (c.type === "not") return !evaluate(c.children[0]);
    if (c.type === "atLeast") return c.children.filter(evaluate).length >= c.count;
    if (c.type === "placed") return placements.filter((p) => p.type === c.object).length >= c.count;
    if (c.type === "allPlaced") return Object.entries(mission.inventory).every(([type, n]) => placements.filter((p) => p.type === type).length === n);
    if (c.type === "path") return paths[c.path]?.complete === true;
    if (c.type === "allPaths") return Object.values(paths).every((p) => p.complete);
    if (c.type === "segment") {
      const p = paths[c.path], offset = c.anchor === "end" ? p.shift : 0;
      const edges = c.anchor === "end" ? p.tailEdges : p.edges;
      return c.from + offset >= 0 && edges.slice(c.from + offset, c.to + offset).length === c.to - c.from && edges.slice(c.from + offset, c.to + offset).every(Boolean);
    }
    return false;
  };
  // Conditions carry witnesses. OR alternatives do not impose contradictory bindings
  // on each other; AND/atLeast require a single consistent assignment of instances.
  let budget = 4096, indeterminate = false;
  const merge = (a, b) => {
    if (--budget < 0) { indeterminate = true; return null; }
    const bindings = { ...a.bindings }, owners = new Map(Object.entries(bindings).map(([role, id]) => [id, role]));
    for (const [role, id] of Object.entries(b.bindings)) {
      if ((role in bindings && bindings[role] !== id) || (owners.has(id) && owners.get(id) !== role)) return null;
      bindings[role] = id; owners.set(id, role);
    }
    return { bindings, paths: [...new Set([...a.paths, ...b.paths])] };
  };
  const empty = () => ({ bindings: {}, paths: [] });
  const product = (left, right) => {
    const result = [];
    for (const a of left) for (const b of right) { const combined = merge(a, b); if (combined) result.push(combined); if (indeterminate) return []; }
    return result;
  };
  const proof = (c) => {
    if (--budget < 0) { indeterminate = true; return []; }
    if (c.type === "all") return c.children.reduce((acc, child) => product(acc, proof(child)), [empty()]);
    if (c.type === "any") return c.children.flatMap(proof);
    if (c.type === "not") return proof(c.children[0]).length ? [] : [empty()];
    if (c.type === "atLeast") {
      const levels = Array.from({ length: c.count + 1 }, () => []); levels[0] = [empty()];
      for (const child of c.children) {
        const candidates = proof(child);
        for (let n = c.count; n > 0; n--) levels[n].push(...product(levels[n - 1], candidates));
      }
      return levels[c.count];
    }
    if (c.type === "allPaths") return proof({ type: "all", children: mission.topology.paths.map((p) => ({ type: "path", path: p.id })) });
    if (!evaluate(c)) return [];
    if (["path", "segment"].includes(c.type)) {
      const p = paths[c.path];
      const bindings = c.type === "segment" && c.anchor === "end" ? p.tailBindings : p.bindings;
      return [{ bindings, paths: [c.path] }];
    }
    return [empty()];
  };
  const objectives = mission.objectives.map((o) => proof(o.condition).length > 0 && !indeterminate);
  const witnesses = proof({ type: "all", children: [mission.completion, ...mission.objectives.map((o) => o.condition)] });
  const complete = witnesses.length > 0 && !indeterminate;
  if (indeterminate) diagnostics.push({ rule: "indeterminate", message: "Слишком много альтернатив условий. Упростите выражение; победа не засчитана" });
  else if (!complete && objectives.every(Boolean) && evaluate(mission.completion)) diagnostics.push({ rule: "binding", message: "Маршруты требуют противоречивых назначений общих ролей" });
  const witness = complete ? witnesses[0] : empty();
  const activeLinks = complete ? links.filter((link) => witness.paths.includes(link.path)) : links;
  if (complete) {
    for (const p of placements) states[p.id] = Object.values(witness.bindings).includes(p.id) ? "link" : "base";
    diagnostics.length = 0;
  }
  const seen = new Set();
  const uniqueLinks = activeLinks.filter((link) => {
    const key = [String(link.a), String(link.b)].sort().join("|");
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  if (complete && mission.connectEndpointsOnComplete) for (const path of mission.topology.paths) {
    const resolved = paths[path.id];
    if (resolved.complete) uniqueLinks.push({ a: `endpoint:${resolved.to}`, b: `endpoint:${resolved.from}`, correct: true, endpoint: true, surface: path.connection.policy !== "screenProjected", screen: path.connection.policy === "screenProjected", closing: true });
  }
  return { complete, objectives, paths, bindings: witness.bindings, diagnostics, links: uniqueLinks, states, evaluate, indeterminate };
}

function pathEndpointVariants(mission, path) {
  const ids = (side, role) => {
    if (path.endpointSelection?.[side] !== "anyRole") return [path[side]];
    const matching = Object.entries(mission.endpoints).filter(([, endpoint]) => endpoint.roles?.includes(role)).map(([id]) => id);
    return [path[side], ...matching.filter((id) => id !== path[side])];
  };
  const variants = [];
  for (const from of ids("from", "start")) for (const to of ids("to", "finish")) if (from !== to) variants.push({ from, to });
  return variants;
}

function filterEndpointSignalVariants(path, variants) {
  let active = variants;
  for (const side of ["from", "to"]) {
    if (path.endpointSelection?.[side] !== "anyRole" || path.endpointSignals?.[side] !== "nearest") continue;
    const candidates = active.filter((variant) => Number.isFinite(variant.boundaryDistances[side]));
    if (!candidates.length) continue;
    const nearest = candidates.reduce((best, candidate) => candidate.boundaryDistances[side] < best.boundaryDistances[side] ? candidate : best, candidates[0]);
    active = active.filter((variant) => variant[side] === nearest[side]);
  }
  return active.length ? active : variants;
}

function evaluatePathVariant({ mission, path, from, to, placements, point, radius, awake, projection }) {
  const pathBindings = {}, variantLinks = [], geometryLinks = [], variantDiagnostics = [], stateUpdates = {};
  const start = point(from), end = point(to);
  const screen = projectedPolicy(path.connection.policy);
  const hybrid = path.connection.policy === "hybridProjected";
  const orbital = (p) => mission.orbitalTypes?.includes(p.type) === true;
  const screenPair = (a, b) => screen && (!hybrid || orbital(a) || orbital(b));
  const worldRadius = radius;
  const geometry = screen ? screenGeometry(path.connection, projection, start, end) : null;
  const position = geometry?.vector || ((p) => vector(p, true));
  const distance = geometry?.distance || distanceBetween;
  const eligible = geometry?.valid || (() => true);
  const connects = (a, b) => !screenPair(a, b) || geometry.connects(a, b);
  radius = geometry?.radius || radius;
  const corridorWidth = geometry?.corridorWidth ?? path.connection.corridorWidth;
  const ambiguityEpsilon = geometry?.ambiguityEpsilon ?? path.connection.ambiguityEpsilon;
  const a = position(start), b = position(end);
  const delta = b.map((n, i) => n - a[i]);
  const length2 = dot(delta, delta) || 1;
  const projectedEntries = placements.filter(eligible).map((node) => {
    const v = position(node), offset = v.map((n, i) => n - a[i]);
    const progress = dot(offset, delta) / length2;
    const cross = Math.hypot(...offset.map((n, i) => n - delta[i] * progress));
    return { node, progress, cross,
      startDistance: Math.hypot(v[0] - a[0], v[1] - a[1], v[2] - a[2]),
      finishDistance: Math.hypot(v[0] - b[0], v[1] - b[1], v[2] - b[2]) };
  });
  // A single route is assembled from local chains anywhere on the field.
  // Separate authored paths retain their corridors to avoid stealing nodes.
  const entries = mission.topology.paths.length === 1 ? [...projectedEntries]
    : projectedEntries.filter((entry) => entry.progress > 0 && entry.progress < 1 && entry.cross <= corridorWidth);
  const includeEndpointCap = (endpoint, distanceKey) => {
    const candidates = projectedEntries.filter((entry) => entry[distanceKey] <= radius(endpoint) + radius(entry.node));
    if (!candidates.length) return;
    const closestToPath = candidates.reduce((best, candidate) => candidate.cross < best.cross - 1e-9
      || Math.abs(candidate.cross - best.cross) <= 1e-9 && candidate[distanceKey] < best[distanceKey]
      ? candidate : best, candidates[0]);
    if (!entries.some((entry) => entry.node.id === closestToPath.node.id)) entries.push(closestToPath);
  };
  includeEndpointCap(start, "startDistance");
  includeEndpointCap(end, "finishDistance");
  entries.sort((left, right) => left.progress - right.progress);
  const ambiguous = entries.some((entry, index) => index > 0 && Math.abs(entry.progress - entries[index - 1].progress) <= ambiguityEpsilon);
  const nodes = [start, ...entries.map((entry) => entry.node), end];
  const iconOverlap = screen && nodes.some((first, index) => eligible(first) && nodes.slice(index + 1).some((second) => eligible(second) && !connects(first, second)));
  const expected = [{ role: `point-${from}`, type: start.type }, ...path.steps, { role: `point-${to}`, type: end.type }];
  const shift = nodes.length - expected.length;
  let prefix = !ambiguous && !iconOverlap;
  const matches = nodes.map((node, index) => {
    prefix = prefix && node.type === expected[index]?.type;
    if (prefix && index > 0 && index < nodes.length - 1) pathBindings[expected[index].role] = node.id;
    return prefix;
  });
  const expectedPairCounts = expected.slice(0, -1).reduce((counts, slot, index) => {
    const key = `${slot.type}>${expected[index + 1].type}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
  const pairMatches = nodes.slice(0, -1).map((first, index) => {
    const second = nodes[index + 1];
    const key = `${first.type}>${second.type}`;
    const candidateSlots = expected.flatMap((slot, expectedIndex) => (
      slot.type === first.type && expected[expectedIndex + 1]?.type === second.type ? [expectedIndex] : []
    ));
    if (expectedPairCounts.get(key) === 1) return true;
    return candidateSlots.includes(index) || candidateSlots.includes(index - shift);
  });
  const edgeDistance = (a, b) => screenPair(a, b) ? distance(a, b) : distanceBetween(a, b);
  const edgeRange = (a, b) => screenPair(a, b) ? radius(a) + radius(b) : worldRadius(a) + worldRadius(b);
  const geometryEdges = nodes.slice(0, -1).map((first, index) => {
    const second = nodes[index + 1];
    const separation = edgeDistance(first, second), range = edgeRange(first, second);
    const connected = connects(first, second) && separation <= range;
    const active = connected && awake(first) && awake(second);
    // Link feedback is local. Global path completion still uses the prefix-based
    // `edges` below, but a valid eastern fragment must not turn red merely
    // because an earlier western slot has not been assembled yet.
    const correct = pairMatches[index];
    const endpointSide = index === 0 ? "from" : index === nodes.length - 2 ? "to" : "";
    if (connected) {
      const link = { a: first.id, b: second.id, correct, path: path.id, distance: separation, range, ...(screenPair(first, second) ? { screen: true } : {}),
        endpoint: Boolean(endpointSide), ...(endpointSide ? { endpointSide } : {}), neutral: !correct && mission.feedback.invalid === "neutral" };
      geometryLinks.push({ ...link, active });
      if (active) variantLinks.push(link);
    }
    return connected;
  });
  const connectedEdges = geometryEdges.map((connected, index) => connected && awake(nodes[index]) && awake(nodes[index + 1]));
  const edges = connectedEdges.map((connected, index) => connected && matches[index] && matches[index + 1]);
  let suffix = !ambiguous && !iconOverlap;
  const tailMatches = Array(nodes.length).fill(false), tailBindings = {};
  for (let index = nodes.length - 1; index >= 0; index--) {
    const slot = expected[index - shift];
    suffix = suffix && nodes[index].type === slot?.type;
    tailMatches[index] = suffix;
    if (suffix && index > 0 && index < nodes.length - 1) tailBindings[slot.role] = nodes[index].id;
  }
  const tailEdges = nodes.slice(0, -1).map((first, index) => tailMatches[index] && tailMatches[index + 1]
    && awake(first) && awake(nodes[index + 1]) && connects(first, nodes[index + 1]) && edgeDistance(first, nodes[index + 1]) <= edgeRange(first, nodes[index + 1]));
  const ordered = nodes.slice(1, -1);
  // Include detached/temporarily hidden pieces in the route model as isolated
  // components, without making them eligible for links or completion.
  const layoutOrder = [...placements].sort((left, right) => {
    const progress = (node) => dot(position(node).map((n, i) => n - a[i]), delta) / length2;
    return progress(left) - progress(right) || String(left.id).localeCompare(String(right.id), undefined, { numeric: true });
  });
  // Spatial placement is immediate. Waking controls only the live signal and color.
  const layout = buildRouteLayout(layoutOrder, geometryLinks, from, to, path.steps.length);
  const result = { ordered, nodes, matches, edges, tailEdges, shift, tailBindings, ambiguous, bindings: pathBindings, layout,
    complete: nodes.length === expected.length && edges.every(Boolean) && !ambiguous
      && (!screen || geometry.axisValid) };
  if (iconOverlap) variantDiagnostics.push({ rule: "view", path: path.id, message: "Разведи иконки и сохрани точки маршрута в поле зрения" });
  if (ambiguous) variantDiagnostics.push({ rule: "ambiguous", path: path.id, message: "Узлы имеют одинаковое продвижение вдоль маршрута; разведите их" });
  const expectedTypeCounts = expected.reduce((counts, slot) => counts.set(slot.type, (counts.get(slot.type) || 0) + 1), new Map());
  const localMatches = nodes.map((node, index) => {
    if (index <= 0 || index >= nodes.length - 1) return false;
    const candidateSlots = expected.flatMap((slot, expectedIndex) => (
      expectedIndex > 0
      && expectedIndex < expected.length - 1
      && slot.type === node.type
      && expected[expectedIndex - 1].type === nodes[index - 1].type
      && expected[expectedIndex + 1].type === nodes[index + 1].type
        ? [expectedIndex]
        : []
    ));
    if (expectedTypeCounts.get(node.type) === 1) return candidateSlots.length > 0;
    // Repeated types (for example a run of satellites) need an unambiguous
    // alignment from either endpoint; otherwise an extra instance could
    // masquerade as a different role that happens to share its neighbors.
    return candidateSlots.includes(index) || candidateSlots.includes(index - shift);
  });
  for (let index = 1; index < nodes.length - 1; index++) {
    const node = nodes[index];
    if (!awake(node)) continue;
    const connectedOnBothSides = connectedEdges[index - 1] && connectedEdges[index];
    if (!connectedOnBothSides) continue;
    if (localMatches[index]) stateUpdates[node.id] = "link";
    else {
      variantDiagnostics.push({ rule: "slot", path: path.id, node: node.id, slot: index, expected: expected[index]?.type, actual: node.type,
        message: `Маршрут ${path.id}: объект ${node.type} окружён неверными соседями` });
      if (mission.feedback.invalid === "error") stateUpdates[node.id] = "wrong";
    }
  }
  // A bounded run must contain the authored number of repeated devices.
  // Two locally valid satellite pairs cannot substitute for a three-satellite span.
  const expectedRuns = boundedRuns(expected).filter((run) => run.count > 1);
  if (!ambiguous && !iconOverlap) for (const run of boundedRuns(nodes)) {
    const candidates = expectedRuns.filter((candidate) => candidate.type === run.type
      && candidate.before === run.before && candidate.after === run.after);
    if (!candidates.length || candidates.some((candidate) => candidate.count === run.count)) continue;
    if (!connectedEdges.slice(run.first - 1, run.last + 1).every(Boolean)) continue;
    const ids = new Set(nodes.slice(run.first, run.last + 1).map((node) => node.id));
    for (const id of ids) {
      variantDiagnostics.push({ rule: "slot", reason: "run-count", path: path.id, node: id,
        expectedCount: candidates[0].count, actualCount: run.count,
        message: `Маршрут ${path.id}: между ${run.before} и ${run.after} требуется ${candidates[0].count} объектов ${run.type}, установлено ${run.count}` });
      if (mission.feedback.invalid === "error") stateUpdates[id] = "wrong";
    }
    for (const links of [variantLinks, layout.connections]) for (const link of links) {
      if (ids.has(link.a) && ids.has(link.b)) link.correct = false;
    }
  }
  if (!result.complete && !ambiguous && matches.every(Boolean)) variantDiagnostics.push({ rule: "coverage", path: path.id, message: `Маршрут ${path.id}: неполная цепочка или разрыв радиопокрытия` });
  const geometryPrefix = geometryEdges.map((connected, index) => connected && matches[index] && matches[index + 1]);
  const geometrySuffix = geometryEdges.map((connected, index) => connected && tailMatches[index] && tailMatches[index + 1]);
  const geometryComplete = nodes.length === expected.length && geometryPrefix.every(Boolean) && !ambiguous && (!screen || geometry.axisValid);
  const score = [Number(geometryComplete), geometryPrefix.filter(Boolean).length, geometrySuffix.filter(Boolean).length,
    geometryEdges.filter(Boolean).length, matches.filter(Boolean).length, -Math.abs(nodes.length - expected.length), Number(!ambiguous)];
  const boundaryDistances = {
    from: nodes.length > 2 ? edgeDistance(start, nodes[1]) : Number.POSITIVE_INFINITY,
    to: nodes.length > 2 ? edgeDistance(nodes.at(-2), end) : Number.POSITIVE_INFINITY,
  };
  return { from, to, result, links: variantLinks, diagnostics: variantDiagnostics, stateUpdates, score, boundaryDistances };
}

function boundedRuns(sequence) {
  const runs = [];
  for (let first = 0; first < sequence.length;) {
    let last = first;
    while (last + 1 < sequence.length && sequence[last + 1].type === sequence[first].type) last++;
    if (first > 0 && last + 1 < sequence.length) runs.push({ first, last, count: last - first + 1,
      type: sequence[first].type, before: sequence[first - 1].type, after: sequence[last + 1].type });
    first = last + 1;
  }
  return runs;
}

function variantIsBetter(candidate, current) {
  for (let index = 0; index < candidate.score.length; index++) {
    if (candidate.score[index] !== current.score[index]) return candidate.score[index] > current.score[index];
  }
  return false;
}

export function distanceBetween(a, b) { return Math.hypot(...vector(a).map((n, i) => n - vector(b)[i])); }
function vector(p, surface = false) {
  const lat = p.latitude * Math.PI / 180, lon = p.longitude * Math.PI / 180, r = 3 + (surface ? 0 : p.altitude || 0);
  return [r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon)];
}
function dot(a, b) { return a.reduce((sum, n, i) => sum + n * b[i], 0); }
