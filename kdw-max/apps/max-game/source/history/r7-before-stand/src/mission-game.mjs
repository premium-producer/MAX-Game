import { configureScreenAppearance } from "./screen-appearance.mjs";
import { usesScreenConnections, validProjection, screenHold, screenReady } from "./screen-connectivity.mjs";
import { DEFAULT_OBJECT_SETTINGS, resolveSignalRadius, SATELLITE_DEFAULT_ALTITUDE, SATELLITE_MIN_ALTITUDE, SATELLITE_MAX_ALTITUDE } from "./node-settings.mjs";
import { evaluateMission, NODE_WAKE_DELAY_MS } from "./mission-evaluation.mjs";
import { configureSatelliteBounds } from "./node-settings.mjs";
import { runtimeObjectTypes, DEFAULT_ICONS, iconSource } from "./object-catalog.mjs";
import { surfaceRejection } from "./placement-policy.mjs";
export { SATELLITE_DEFAULT_ALTITUDE, SATELLITE_MIN_ALTITUDE, SATELLITE_MAX_ALTITUDE };
export let OBJECT_SETTINGS = DEFAULT_OBJECT_SETTINGS;
let catalogSettings = DEFAULT_OBJECT_SETTINGS;
let placementSurfaceMap = null;

export function configurePlacementSurface(map) {
  if (map !== null && typeof map?.sample !== "function") throw new Error("Invalid placement surface map");
  placementSurfaceMap = map;
}

export function getPlacementRejection(type, geo) {
  if (!ITEM_TYPES[type]) return "invalid-type";
  const latitude = Number(geo?.latitude), longitude = Number(geo?.longitude);
  if (geo?.latitude == null || geo?.longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return "invalid-coordinate";
  const latitudeLimit = isOrbitalType(type) ? 90 : 82;
  return surfaceRejection(ITEM_TYPES[type], clamp(latitude, -latitudeLimit, latitudeLimit), clamp(longitude, -180, 180), placementSurfaceMap);
}

export let ITEM_TYPES = runtimeObjectTypes();
export let ICON_LIBRARY = DEFAULT_ICONS;
export const pointIconSource = (point) => iconSource(ICON_LIBRARY[point?.icon]);
export const isOrbitalType = (type) => ITEM_TYPES[type]?.behavior === "orbital";
export const altitudeSettingsFor = (type) => OBJECT_SETTINGS[type] || DEFAULT_OBJECT_SETTINGS.satellite;

export { NODE_WAKE_DELAY_MS };
const EARTH_RADIUS = 3;

export let MISSIONS = Object.freeze({});
export let MISSION_ORDER = Object.freeze([]);

export function configureMissions(catalog) {
  if (!catalog?.missions?.length || !catalog.byNumber) throw new Error("Каталог миссий не загружен");
  const nextTypes = runtimeObjectTypes(catalog.system);
  for (const mission of catalog.missions) {
    for (const type of mission.route) if (!nextTypes[type]) throw new Error(`Миссия ${mission.number}: неизвестный объект ${type}`);
    for (const objective of mission.objectives) {
      for (const key of ["object", "first", "second"]) {
        if (objective.condition[key] && !nextTypes[objective.condition[key]]) throw new Error(`Миссия ${mission.number}: неизвестный объект ${objective.condition[key]} в условии ${objective.id}`);
      }
    }
  }
  MISSIONS = catalog.byNumber;
  OBJECT_SETTINGS = catalog.objectSettings || DEFAULT_OBJECT_SETTINGS;
  catalogSettings = OBJECT_SETTINGS;
  configureScreenAppearance(catalog.system?.screenAppearance);
  configureSatelliteBounds(OBJECT_SETTINGS.satellite || DEFAULT_OBJECT_SETTINGS.satellite);
  ICON_LIBRARY = catalog.system?.icons || DEFAULT_ICONS;
  ITEM_TYPES = Object.freeze(Object.fromEntries(Object.entries(nextTypes).map(([type, item]) => [type, Object.freeze({ ...item, ...OBJECT_SETTINGS[type] })])));
  MISSION_ORDER = Object.freeze(catalog.missions.map((mission) => mission.number));
  return MISSIONS;
}

export function createMissionRun(number) {
  const mission = MISSIONS[number];
  if (!mission) throw new Error(`Unknown mission ${number}`);
  activateMissionSettings(number);
  return { mission: number, placements: [], selected: null, selectedPlacementId: null, status: "playing", seconds: mission.timeSeconds, nextId: 1 };
}

export function activateMissionSettings(number) {
  const mission = MISSIONS[number];
  OBJECT_SETTINGS = Object.fromEntries(Object.entries(catalogSettings).map(([type, settings]) => [type, { ...settings, ...mission?.objectSettings?.[type] }]));
  configureSatelliteBounds(OBJECT_SETTINGS.satellite || DEFAULT_OBJECT_SETTINGS.satellite);
}

export function reduceMission(run, action) {
  const mission = MISSIONS[run.mission];
  if (action?.type === "RESTART") return createMissionRun(run.mission);
  if (!action || !mission || run.status === "complete" || run.status === "timeout") return run;
  if (action.type === "CLEAR_SELECTION") {
    return run.selected || run.selectedPlacementId != null ? { ...run, selected: null, selectedPlacementId: null } : run;
  }
  if (action.type === "SELECT_PLACEMENT") {
    const id = Number(action.id);
    if (!run.placements.some((placement) => placement.id === id)) return run;
    return { ...run, selected: null, selectedPlacementId: run.selectedPlacementId === id ? null : id };
  }
  if (action.type === "SELECT") {
    if (!ITEM_TYPES[action.item] || availableCount(run, action.item) < 1) return run;
    return { ...run, selected: run.selected === action.item ? null : action.item, selectedPlacementId: null, status: "playing" };
  }
  if (action.type === "PLACE") {
    if (invalidGeoInput(action)) return run;
    const item = action.item || run.selected;
    if (!ITEM_TYPES[item] || availableCount(run, item) < 1) return run;
    const geo = normalizeGeo(action, item);
    if (getPlacementRejection(item, geo)) return run;
    const placement = {
      id: run.nextId,
      type: item,
      ...geo,
      rotation: clamp(Number(action.rotation) || 0, -10, 10),
      droppedAt: finiteNumber(action.now, 0),
    };
    const selected = action.keepSelection && run.selected === item && availableCount(run, item) > 1 ? item : null;
    return { ...run, placements: [...run.placements, placement], nextId: run.nextId + 1, selected, selectedPlacementId: null, status: "playing" };
  }
  if (action.type === "MOVE") {
    if (invalidGeoInput(action)) return run;
    const id = Number(action.id);
    const previous = run.placements.find((placement) => placement.id === id);
    if (!previous || getPlacementRejection(previous.type, normalizeGeo(action, previous.type, previous))) return run;
    const placements = run.placements.map((placement) => placement.id === id ? {
      ...placement,
      ...normalizeGeo(action, placement.type, placement),
      rotation: clamp(Number(action.rotation) || 0, -10, 10),
      droppedAt: finiteNumber(action.now, 0),
    } : placement);
    return { ...run, placements, status: "playing",
      ...(action.clearSelection ? { selected: null, selectedPlacementId: null } : {}) };
  }
  if (action.type === "REMOVE") {
    const id = Number(action.id);
    if (!run.placements.some((placement) => placement.id === id)) return run;
    return { ...run, placements: run.placements.filter((placement) => placement.id !== id),
      selectedPlacementId: run.selectedPlacementId === id ? null : run.selectedPlacementId, status: "playing" };
  }
  if (action.type === "CONNECTION_VIEW" && usesScreenConnections(mission)) {
    if (!validProjection(run, action.snapshot, action.now)) return { ...run, connectionProjection: null, connectionHold: null };
    const next = { ...run, connectionProjection: action.snapshot };
    const evaluation = missionEvaluation(next, action.now);
    return { ...next, connectionHold: screenHold(mission, run.connectionHold, action.snapshot, evaluation, action.now) };
  }
  if (action.type === "CHECK") {
    if (mission.engineVersion === 2) {
      const evaluation = missionEvaluation(run, finiteNumber(action.now, Date.now()));
      const complete = evaluation.complete && (!usesScreenConnections(mission) || screenReady(mission, run, finiteNumber(action.now, Date.now())));
      return { ...run, status: complete ? "complete" : evaluation.diagnostics.some((d) => d.rule === "slot" || d.rule === "binding") ? "error" : "disconnected",
        ...(complete && usesScreenConnections(mission) ? { completion: { mission: run.mission, placements: run.placements, evaluation } } : {}) };
    }
    if (run.placements.length < mission.route.length) return { ...run, status: "incomplete" };
    if (!routeIsCorrect(run)) return { ...run, status: "error" };
    const latestDrop = Math.max(0, ...run.placements.map((placement) => placement.droppedAt));
    const now = finiteNumber(action.now, latestDrop + NODE_WAKE_DELAY_MS);
    return { ...run, status: routeIsConnected(run, now) ? "complete" : "disconnected" };
  }
  if (action.type === "TICK") {
    const seconds = Math.max(0, run.seconds - 1);
    return { ...run, seconds, status: seconds === 0 ? "timeout" : run.status };
  }
  if (action.type === "RESTART") return createMissionRun(run.mission);
  return run;
}

// Produces an ephemeral, normalized placement snapshot for live drag feedback.
// It intentionally preserves droppedAt/status and never mutates the authoritative run.
export function previewPlacementMove(run, id, geo) {
  const placementId = Number(id);
  if (!run?.placements?.some((placement) => placement.id === placementId)) return run;
  return {
    ...run,
    placements: run.placements.map((placement) => {
      if (placement.id !== placementId) return placement;
      const candidate = normalizeGeo(geo, placement.type, placement);
      const reason = invalidGeoInput(geo) ? "invalid-coordinate" : getPlacementRejection(placement.type, candidate);
      return { ...placement, ...candidate, ...(reason ? { placementBlocked: reason } : {}) };
    }),
  };
}

export function routeIsCorrect(run) {
  if (MISSIONS[run.mission].engineVersion === 2) {
    const evaluation = missionEvaluation(run, usesScreenConnections(MISSIONS[run.mission]) ? run.connectionProjection?.timestamp ?? 0 : Infinity);
    return MISSIONS[run.mission].topology.paths.every((path) => {
      const result = evaluation.paths[path.id];
      return result.matches.every(Boolean) && result.nodes.length === path.steps.length + 2;
    });
  }
  const placements = orderedPlacements(run);
  return MISSIONS[run.mission].route.every((item, index) => placements[index]?.type === item);
}

export function routeIsConnected(run, now = 0) {
  if (MISSIONS[run.mission].engineVersion === 2) return missionEvaluation(run, now).complete;
  if (!routeIsCorrect(run)) return false;
  const placements = orderedPlacements(run);
  const links = deriveNetwork(run, now).links;
  const linkedPairs = new Set(links.map((link) => pairKey(link.a, link.b)));
  return placements.slice(0, -1).every((placement, index) => linkedPairs.has(pairKey(placement.id, placements[index + 1].id)))
    && endpointCoverageSatisfied(run, placements);
}

export function orderedPlacements(run) {
  if (MISSIONS[run.mission]?.engineVersion === 2) return missionEvaluation(run, run.connectionProjection?.timestamp ?? 0).paths[MISSIONS[run.mission].topology.paths[0].id].ordered;
  return [...run.placements].sort((left, right) => {
    const horizontalDelta = placementHorizontal(left) - placementHorizontal(right);
    return Math.abs(horizontalDelta) > 1e-6 ? horizontalDelta : left.id - right.id;
  });
}

export function availableCount(run, item) {
  const required = MISSIONS[run.mission].inventory?.[item] ?? MISSIONS[run.mission].route.filter((entry) => entry === item).length;
  const placed = run.placements.filter((entry) => entry.type === item).length;
  return Math.max(0, required - placed);
}

export function objectiveProgress(run, now = 0) {
  if (MISSIONS[run.mission].engineVersion === 2) return missionEvaluation(run, now).objectives;
  return MISSIONS[run.mission].objectives.map((objective) => evaluateObjectiveCondition(objective.condition, run, now));
}

export function evaluateObjectiveCondition(condition, run, now = 0) {
  if (MISSIONS[run.mission].engineVersion === 2) return missionEvaluation(run, now).evaluate(condition);
  const route = orderedPlacements(run).map((placement) => placement.type);
  if (condition.type === "placed") return route.filter((type) => type === condition.object).length >= (condition.count || 1);
  if (condition.type === "adjacent") return countAdjacent(route, condition.first, condition.second) >= (condition.count || 1);
  if (condition.type === "connectedSequence") return connectedSequenceExists(condition.sequence, run, now);
  if (condition.type === "allPlaced") return run.placements.length === MISSIONS[run.mission].route.length;
  if (condition.type === "routeCorrect") return routeIsCorrect(run);
  if (condition.type === "networkConnected") return routeIsConnected(run, now);
  return false;
}

function connectedSequenceExists(sequence, run, now) {
  // Endpoints anchor the sequence to the A/B ends of the displayed route.
  // Their visual links are still added when the whole mission route closes.
  const ordered = orderedPlacements(run);
  const nodes = [endpointPlacement(run, "A"), ...ordered, endpointPlacement(run, "B")];
  const links = deriveNetwork(run, now).links;
  const connected = new Set(links.filter((link) => link.correct).map((link) => pairKey(link.a, link.b)));
  return nodes.some((_, start) => {
    if (!sequence.every((type, offset) => nodes[start + offset]?.type === type)) return false;
    if (sequence[0] === "endpoint:A" && !signalsOverlap(nodes[start], nodes[start + 1])) return false;
    if (sequence.at(-1) === "endpoint:B" && !signalsOverlap(nodes[start + sequence.length - 2], nodes[start + sequence.length - 1])) return false;
    const segment = nodes.slice(start, start + sequence.length).filter((node) => node.id !== undefined);
    return segment.every((node) => now - node.droppedAt >= NODE_WAKE_DELAY_MS)
      && segment.slice(0, -1).every((node, index) => connected.has(pairKey(node.id, segment[index + 1].id)));
  });
}

export function deriveNetwork(run, now = 0) {
  // Invalid drag ghosts are visible but can never participate in the network.
  if (MISSIONS[run.mission].engineVersion !== 2 && run.placements.some((placement) => placement.placementBlocked)) run = { ...run, placements: run.placements.filter((placement) => !placement.placementBlocked) };
  if (MISSIONS[run.mission].engineVersion === 2) return missionEvaluation(run, now);
  const ordered = orderedPlacements(run);
  const links = [];
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const first = ordered[index];
    const second = ordered[index + 1];
    if (now - first.droppedAt < NODE_WAKE_DELAY_MS || now - second.droppedAt < NODE_WAKE_DELAY_MS) continue;
    const distance = distance3d(first, second);
    const range = signalRangeBetween(first, second);
    if (distance <= range) links.push({
      a: first.id,
      b: second.id,
      distance,
      range,
      correct: isCorrectAdjacentPair(run.mission, first.type, second.type),
    });
  }
  const states = {};
  for (const placement of run.placements) {
    if (now - placement.droppedAt < NODE_WAKE_DELAY_MS) {
      states[placement.id] = "drop";
      continue;
    }
    const linkedIds = links.flatMap((link) => link.a === placement.id ? [link.b] : link.b === placement.id ? [link.a] : []);
    if (linkedIds.length < 2) {
      states[placement.id] = "base";
      continue;
    }
    const linkedTypes = linkedIds.map((id) => run.placements.find((item) => item.id === id)?.type).sort();
    states[placement.id] = hasCorrectNeighbors(run.mission, placement.type, linkedTypes) ? "link" : "wrong";
  }
  const mission = MISSIONS[run.mission];
  const linkedPairs = new Set(links.map((link) => pairKey(link.a, link.b)));
  const routeComplete = ordered.length === mission.route.length
    && routeIsCorrect(run)
    && endpointCoverageSatisfied(run, ordered)
    && ordered.slice(0, -1).every((placement, index) => linkedPairs.has(pairKey(placement.id, ordered[index + 1].id)));
  if (routeComplete && mission.connectEndpointsOnComplete) {
    links.push(
      { a: "endpoint:A", b: ordered[0].id, endpoint: true, correct: true },
      { a: ordered.at(-1).id, b: "endpoint:B", endpoint: true, correct: true },
      { a: "endpoint:B", b: "endpoint:A", endpoint: true, surface: true, closing: true, correct: true },
    );
  }
  return { links, states };
}

export function signalRangeBetween(first, second) {
  return signalRadiusFor(first) + signalRadiusFor(second);
}

export function signalRadiusFor(placement, type = placement.type) {
  if (placement.signalRadius !== undefined) return placement.signalRadius;
  return resolveSignalRadius(placement, OBJECT_SETTINGS, type);
}

export function missionEvaluation(run, now = 0) {
  // A confirmed victory is a domain result, not a live camera sample. Keep
  // every consumer (footer, objectives, links, popup) on that same result.
  if (run.status === "complete" && run.completion?.mission === run.mission
    && run.completion.placements === run.placements && usesScreenConnections(MISSIONS[run.mission])) return run.completion.evaluation;
  return evaluateMission(MISSIONS[run.mission], run.placements, catalogSettings, now, NODE_WAKE_DELAY_MS, validProjection(run, run.connectionProjection, now) ? run.connectionProjection : null);
}

function endpointPlacement(run, key) {
  return { ...MISSIONS[run.mission].endpoints[key], type: `endpoint:${key}`, altitude: 0.012 };
}

function endpointCoverageSatisfied(run, ordered) {
  if (!MISSIONS[run.mission].connectEndpointsOnComplete) return true;
  return ordered.length > 0 && signalsOverlap(endpointPlacement(run, "A"), ordered[0])
    && signalsOverlap(ordered.at(-1), endpointPlacement(run, "B"));
}

export function signalsOverlap(first, second) {
  return distance3d(first, second) <= signalRangeBetween(first, second);
}

function countAdjacent(slots, first, second) {
  return slots.reduce((count, item, index) => count + (item === first && slots[index + 1] === second ? 1 : 0), 0);
}

function pairKey(firstId, secondId) {
  return firstId < secondId ? `${firstId}:${secondId}` : `${secondId}:${firstId}`;
}

function placementHorizontal(placement) {
  const screenX = Number(placement.screenX);
  if (Number.isFinite(screenX)) return screenX;
  return Number.isFinite(Number(placement.longitude)) ? Number(placement.longitude) : placement.id;
}

function hasCorrectNeighbors(missionNumber, type, linkedTypes) {
  const route = MISSIONS[missionNumber].route;
  return route.some((item, index) => {
    if (item !== type || index === 0 || index === route.length - 1) return false;
    return [route[index - 1], route[index + 1]].sort().every((neighbor, neighborIndex) => neighbor === linkedTypes[neighborIndex]);
  });
}

function isCorrectAdjacentPair(missionNumber, firstType, secondType) {
  const route = MISSIONS[missionNumber].route;
  return route.some((type, index) => type === firstType && route[index + 1] === secondType);
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function invalidGeoInput(action) {
  return ["latitude", "longitude"].some((key) => action[key] !== undefined && (action[key] === null || !Number.isFinite(Number(action[key]))));
}

function normalizeGeo(action, type, fallback = {}) {
  const fallbackX = clamp01(action.x);
  const fallbackY = clamp01(action.y);
  const settings = altitudeSettingsFor(type);
  const defaultAltitude = isOrbitalType(type) ? settings.defaultAltitude : 0.08;
  const minimumAltitude = isOrbitalType(type) ? settings.minAltitude : 0.04;
  const maximumAltitude = isOrbitalType(type) ? settings.maxAltitude : 1.4;
  // Orbital ray picking covers the full sphere, including the polar caps.
  const latitudeLimit = isOrbitalType(type) ? 90 : 82;
  return {
    latitude: clamp(finiteNumber(action.latitude, fallback.latitude ?? (0.5 - fallbackY) * 164), -latitudeLimit, latitudeLimit),
    longitude: clamp(finiteNumber(action.longitude, fallback.longitude ?? (fallbackX - 0.5) * 360), -180, 180),
    altitude: clamp(finiteNumber(action.altitude, fallback.altitude ?? defaultAltitude), minimumAltitude, maximumAltitude),
  };
}

function distance3d(first, second) {
  const a = sphericalVector(first);
  const b = sphericalVector(second);
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function sphericalVector(placement) {
  const latitude = placement.latitude * Math.PI / 180;
  const longitude = placement.longitude * Math.PI / 180;
  const radius = EARTH_RADIUS + placement.altitude;
  return {
    x: radius * Math.cos(latitude) * Math.sin(longitude),
    y: radius * Math.sin(latitude),
    z: radius * Math.cos(latitude) * Math.cos(longitude),
  };
}

function clamp01(value) {
  return clamp(Number(value) || 0, 0.04, 0.96);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
