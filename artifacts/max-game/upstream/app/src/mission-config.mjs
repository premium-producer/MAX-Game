import { parseObjectSettings } from "./node-settings.mjs";
import { DEFAULT_MISSION_SELECT_OBJECTS, normalizeMissionLogic, parseMissionSelectObjects, parseSystem } from "./mission-system.mjs";
import { DEFAULT_ICONS, iconSource } from "./object-catalog.mjs";

const CONDITION_TYPES = new Set(["placed", "adjacent", "connectedSequence", "allPlaced", "routeCorrect", "networkConnected"]);
const SEQUENCE_OBJECTS = new Set(["terminal", "satellite", "gateway", "core", "internet", "endpoint:A", "endpoint:B"]);

export async function loadMissionCatalog(source = "./config/missions/index.json", fetchImpl = fetch, attempt = 0) {
  const response = await fetchImpl(source, { cache: "no-store" });
  if (!response.ok) throw new Error(`Не удалось загрузить каталог миссий: HTTP ${response.status}`);
  const raw = await response.json();
  if (raw.schemaVersion !== 2 || !raw.files) return parseMissionCatalog(raw);
  const root = source.slice(0, source.lastIndexOf("/") + 1);
  const read = async (path) => {
    const result = await fetchImpl(path, { cache: "no-store" });
    if (!result.ok) throw new Error(`Не удалось прочитать ${path}`);
    return result.json();
  };
  if (!Array.isArray(raw.files) || raw.files.some((file) => !/^[a-zA-Z0-9_-]+\.json$/.test(file))) throw new Error("Некорректный индекс миссий");
  const [system, ...missions] = await Promise.all([read(`${root}../mission-system.json`), ...raw.files.map((file) => read(`${root}${file}`))]);
  if ([system, ...missions].some((file) => (file._revision || "migration-v2") !== raw.revision)) {
    if (attempt >= 5) throw new Error("Конфигурация обновляется или содержит разные ревизии. Повторите загрузку.");
    await new Promise((done) => setTimeout(done, 100));
    return loadMissionCatalog(source, fetchImpl, attempt + 1);
  }
  return parseMissionCatalog({ schemaVersion: 2, revision: raw.revision, system, missions });
}

export function parseMissionCatalog(raw) {
  if (!raw || ![1, 2].includes(raw.schemaVersion) || !Array.isArray(raw.missions) || raw.missions.length < 1) {
    throw new Error("missions.json: ожидается schemaVersion=1 и непустой массив missions");
  }
  const numbers = new Set();
  const ids = new Set();
  const system = raw.schemaVersion === 2 ? parseSystem(raw.system) : null;
  // Preserve older direct SVG assignments as entries in the fixed-point bank.
  if (system) for (const mission of raw.missions) for (const point of Object.values(mission.endpoints || {})) {
    if (point.icon && Object.hasOwn(system.icons, point.icon) && !system.pointIcons.includes(point.icon)) system.pointIcons.push(point.icon);
  }
  const missions = raw.missions.map((mission, index) => normalizeMission(mission, index, numbers, ids, system));
  missions.sort((left, right) => left.number - right.number);
  for (const mission of missions) {
    for (const required of mission.unlock.requiresCompleted) {
      if (!numbers.has(required)) throw new Error(`missions.json: миссия ${mission.number} зависит от отсутствующей миссии ${required}`);
      if (required === mission.number) throw new Error(`missions.json: миссия ${mission.number} не может зависеть от самой себя`);
    }
  }
  validateUnlockGraph(missions);
  return deepFreeze({
    schemaVersion: raw.schemaVersion,
    ...(system ? { system, revision: raw.revision || "initial" } : {}),
    objectSettings: system?.objectSettings || parseObjectSettings(raw.objectSettings),
    missionSelectObjects: system?.missionSelectObjects || parseMissionSelectObjects(raw.missionSelectObjects ?? DEFAULT_MISSION_SELECT_OBJECTS, DEFAULT_ICONS),
    missions,
    byNumber: Object.fromEntries(missions.map((mission) => [mission.number, mission])),
  });
}

export function missionSelectObjectsForRendering(catalog) {
  const icons = catalog.system?.icons || DEFAULT_ICONS;
  return catalog.missionSelectObjects.map((entry) => ({ ...entry, iconSource: iconSource(icons[entry.icon]) }));
}

export function serializeMissionCatalog(catalog) {
  if (catalog.schemaVersion === 2) {
    const parsed = parseMissionCatalog(catalog);
    return { schemaVersion: 2, revision: parsed.revision, system: structuredClone(parsed.system), missions: parsed.missions.map((mission) => {
      const result = structuredClone(mission);
      delete result.orbitalTypes; // derived from object behavior
      delete result.route; // derived compatibility view, never a second authoring source
      if (result.equipmentSet) delete result.inventory; // derived from the shared set
      return result;
    }) };
  }
  const parsed = parseMissionCatalog({
    schemaVersion: 1,
    missions: catalog.missions,
    objectSettings: catalog.objectSettings,
  });
  return {
    $schema: "./missions.schema.json",
    schemaVersion: 1,
    missions: structuredClone(parsed.missions),
    objectSettings: structuredClone(parsed.objectSettings),
    missionSelectObjects: structuredClone(parsed.missionSelectObjects),
  };
}

function normalizeMission(source, index, numbers, ids, system = null) {
  const context = `missions[${index}]`;
  const number = positiveInteger(source?.number, `${context}.number`);
  const id = nonEmptyString(source?.id, `${context}.id`);
  if (numbers.has(number)) throw new Error(`missions.json: повторяется номер миссии ${number}`);
  if (ids.has(id)) throw new Error(`missions.json: повторяется id миссии ${id}`);
  numbers.add(number);
  ids.add(id);

  const logic = system ? normalizeMissionLogic(source, system) : null;
  const route = logic?.route || arrayOfStrings(source.route, `${context}.route`);
  const objectiveIds = new Set();
  const objectives = requiredArray(source.objectives, `${context}.objectives`).map((objective, objectiveIndex) => ({
    id: nonEmptyString(objective?.id, `${context}.objectives[${objectiveIndex}].id`),
    label: nonEmptyString(objective?.label, `${context}.objectives[${objectiveIndex}].label`),
    condition: logic ? logic.objectives[objectiveIndex].condition : normalizeCondition(objective?.condition, `${context}.objectives[${objectiveIndex}].condition`),
  }));
  for (const objective of objectives) {
    if (objectiveIds.has(objective.id)) throw new Error(`${context}: повторяется id подзадачи ${objective.id}`);
    objectiveIds.add(objective.id);
  }
  return {
    number,
    id,
    name: nonEmptyString(source.name, `${context}.name`),
    description: String(source.description || ""),
    ...(source.summary !== undefined ? { summary: String(source.summary) } : {}),
    ...(source.level !== undefined ? { level: String(source.level) } : {}),
    timeSeconds: positiveInteger(source.timeSeconds, `${context}.timeSeconds`),
    mapPosition: normalizePosition(source.mapPosition, `${context}.mapPosition`),
    endpoints: logic?.endpoints || {
      A: normalizeEndpoint(source.endpoints?.A, `${context}.endpoints.A`, "A"),
      B: normalizeEndpoint(source.endpoints?.B, `${context}.endpoints.B`, "Б"),
    },
    connectEndpointsOnComplete: requiredBoolean(source.connectEndpointsOnComplete, `${context}.connectEndpointsOnComplete`),
    route,
    objectives,
    successText: nonEmptyString(source.successText, `${context}.successText`),
    unlock: { requiresCompleted: (source.unlock?.requiresCompleted || []).map((value) => positiveInteger(value, `${context}.unlock.requiresCompleted`)) },
    ...(logic ? { ...logic, objectSettings: structuredClone(source.objectSettings || {}), engineVersion: 2 } : {}),
  };
}

function validateUnlockGraph(missions) {
  const dependencies = new Map(missions.map((mission) => [mission.number, mission.unlock.requiresCompleted]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (number) => {
    if (visiting.has(number)) throw new Error(`missions.json: циклическая зависимость разблокировки у миссии ${number}`);
    if (visited.has(number)) return;
    visiting.add(number);
    for (const dependency of dependencies.get(number) || []) visit(dependency);
    visiting.delete(number);
    visited.add(number);
  };
  for (const mission of missions) visit(mission.number);
}

function normalizeCondition(condition, context) {
  if (!condition || !CONDITION_TYPES.has(condition.type)) throw new Error(`${context}: неизвестный type`);
  const normalized = { type: condition.type };
  if (condition.object !== undefined) normalized.object = nonEmptyString(condition.object, `${context}.object`);
  if (condition.first !== undefined) normalized.first = nonEmptyString(condition.first, `${context}.first`);
  if (condition.second !== undefined) normalized.second = nonEmptyString(condition.second, `${context}.second`);
  if (condition.count !== undefined) normalized.count = positiveInteger(condition.count, `${context}.count`);
  if (condition.type === "placed" && !normalized.object) throw new Error(`${context}: placed требует object`);
  if (condition.type === "adjacent" && (!normalized.first || !normalized.second)) throw new Error(`${context}: adjacent требует first и second`);
  if (condition.type === "connectedSequence") {
    normalized.sequence = arrayOfStrings(condition.sequence, `${context}.sequence`);
    const sequence = normalized.sequence;
    if (sequence.filter((type) => !type.startsWith("endpoint:")).length < 2
      || sequence.some((type, index) => !SEQUENCE_OBJECTS.has(type)
        || (type === "endpoint:A" && index !== 0)
        || (type === "endpoint:B" && index !== sequence.length - 1))) {
      throw new Error(`${context}: sequence требует минимум два объекта; A допустима только в начале, Б — в конце`);
    }
  }
  return normalized;
}

function normalizePosition(position, context) {
  const latitude = finiteNumber(position?.latitude, `${context}.latitude`);
  const longitude = finiteNumber(position?.longitude, `${context}.longitude`);
  if (latitude < -82 || latitude > 82 || longitude < -180 || longitude > 180) {
    throw new Error(`${context}: географические координаты вне допустимого диапазона`);
  }
  return { latitude, longitude };
}

function normalizeEndpoint(endpoint, context, fallbackLabel) {
  const latitude = finiteNumber(endpoint?.latitude, `${context}.latitude`);
  const longitude = finiteNumber(endpoint?.longitude, `${context}.longitude`);
  if (latitude < -82 || latitude > 82 || longitude < -180 || longitude > 180) throw new Error(`${context}: координаты вне допустимого диапазона`);
  return { label: String(endpoint.label || fallbackLabel), latitude, longitude };
}

function positiveInteger(value, context) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${context}: ожидается положительное целое число`);
  return number;
}

function finiteNumber(value, context) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${context}: ожидается число`);
  return number;
}

function nonEmptyString(value, context) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${context}: ожидается непустая строка`);
  return value.trim();
}

function requiredBoolean(value, context) {
  if (typeof value !== "boolean") throw new Error(`missions.json: ${context} должно быть boolean`);
  return value;
}

function requiredArray(value, context) {
  if (!Array.isArray(value) || value.length < 1) throw new Error(`${context}: ожидается непустой массив`);
  return value;
}

function arrayOfStrings(value, context) {
  return requiredArray(value, context).map((item, index) => nonEmptyString(item, `${context}[${index}]`));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}
