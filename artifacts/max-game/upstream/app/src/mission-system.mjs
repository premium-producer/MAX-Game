import { parseScreenAppearance } from "./screen-appearance.mjs";
import { SCREEN_CONNECTION_DEFAULTS } from "./screen-connectivity.mjs";
import { parseObjectSettings } from "./node-settings.mjs";
import { parseObjectCatalog } from "./object-catalog.mjs";

export const EQUIPMENT_TYPES = ["terminal", "satellite", "gateway", "core", "internet"];
export const DEFAULT_CONNECTION = { policy: "geographicCorridor", corridorWidth: 2, ambiguityEpsilon: 0.0001 };
export const DEFAULT_FEEDBACK = { invalid: "error" };
export const DEFAULT_MISSION_SELECT_OBJECTS = Object.freeze([Object.freeze({
  id: "mission-hub-satellite",
  kind: "orbital-signal",
  icon: "satellite",
  latitude: 68.25,
  longitude: 175.35,
  altitude: 1.4,
  size: 0.72,
  signalRadius: 0.82,
  signalMode: "always",
  successWhen: "all-missions-completed",
})]);
const safeId = /^(?!(?:__proto__|constructor|prototype)$)[a-zA-Z0-9_-]+$/;
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const positive = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;
const legacyPointIcon = (id, point, system) => {
  const token = String(point.label ?? id).trim().toUpperCase();
  if ((id.toUpperCase() === "A" || token === "A" || token === "А") && system.pointIcons.includes("point-a")) return "point-a";
  if ((id.toUpperCase() === "B" || token === "B" || token === "Б") && system.pointIcons.includes("point-b")) return "point-b";
  return "";
};

export function parseSystem(raw = {}) {
  assert(raw.schemaVersion === 2, "mission-system: требуется schemaVersion 2");
  const catalog = parseObjectCatalog(raw);
  return { schemaVersion: 2, ...catalog, objectSettings: parseObjectSettings(raw.objectSettings, catalog.objectTypes),
    screenAppearance: parseScreenAppearance(raw.screenAppearance, catalog.objectTypes),
    missionSelectObjects: parseMissionSelectObjects(raw.missionSelectObjects, catalog.icons),
    connection: parseConnection(raw.connection), feedback: parseFeedback(raw.feedback) };
}

export function parseMissionSelectObjects(raw, icons) {
  const source = raw ?? DEFAULT_MISSION_SELECT_OBJECTS;
  assert(Array.isArray(source), "missionSelectObjects: ожидается массив");
  const ids = new Set();
  return source.map((entry, index) => {
    const context = `missionSelectObjects[${index}]`;
    assert(entry && typeof entry === "object" && !Array.isArray(entry), `${context}: ожидается объект`);
    assert(safeId.test(entry.id) && !ids.has(entry.id), `${context}: нужен уникальный безопасный id`);
    ids.add(entry.id);
    assert(entry.kind === "orbital-signal", `${context}.kind: поддерживается orbital-signal`);
    assert(typeof entry.icon === "string" && Object.hasOwn(icons, entry.icon), `${context}.icon: выберите существующую иконку`);
    assert(Number.isFinite(entry.latitude) && Math.abs(entry.latitude) <= 82, `${context}.latitude: диапазон -82–82`);
    assert(Number.isFinite(entry.longitude) && Math.abs(entry.longitude) <= 180, `${context}.longitude: диапазон -180–180`);
    assert(positive(entry.altitude) && entry.altitude <= 3, `${context}.altitude: диапазон 0–3`);
    assert(positive(entry.size), `${context}.size: требуется значение > 0`);
    assert(positive(entry.signalRadius), `${context}.signalRadius: требуется значение > 0`);
    assert(entry.signalMode === "always", `${context}.signalMode: поддерживается always`);
    assert(entry.successWhen === "all-missions-completed", `${context}.successWhen: поддерживается all-missions-completed`);
    return {
      id: entry.id,
      kind: entry.kind,
      icon: entry.icon,
      latitude: entry.latitude,
      longitude: entry.longitude,
      altitude: entry.altitude,
      size: entry.size,
      signalRadius: entry.signalRadius,
      signalMode: entry.signalMode,
      successWhen: entry.successWhen,
    };
  });
}

function parseConnection(raw = {}) {
  const value = { ...DEFAULT_CONNECTION, ...raw };
  assert(["geographicCorridor", "screenProjected", "hybridProjected"].includes(value.policy), "Неизвестная политика соединений");
  assert(positive(value.corridorWidth) && positive(value.ambiguityEpsilon), "Ширина коридора и допуск должны быть > 0");
  if (value.policy !== "geographicCorridor" || value.screen !== undefined) {
    assert(value.screen === undefined || value.screen && typeof value.screen === "object" && !Array.isArray(value.screen), "Экранные параметры: ожидается объект");
    value.screen = { ...SCREEN_CONNECTION_DEFAULTS, ...value.screen };
    for (const [key, number] of Object.entries(value.screen)) {
      assert(Object.hasOwn(SCREEN_CONNECTION_DEFAULTS, key) && positive(number), `Экранный параметр ${key}: требуется конечное число > 0`);
    }
    assert(value.screen.corridorFraction <= 1 && value.screen.ambiguityFraction < 0.5 && value.screen.minimumEndpointSpan <= 2000 && value.screen.iconGap <= 100 && value.screen.stableHoldMs >= 100 && value.screen.stableHoldMs <= 5000, "Экранные параметры вне диапазона");
  }
  return value;
}
function parseFeedback(raw = {}) {
  const value = { ...DEFAULT_FEEDBACK, ...raw };
  assert(["error", "neutral"].includes(value.invalid), "Оформление ошибки: error или neutral");
  return value;
}

export function normalizeMissionLogic(source, system) {
  const equipmentTypes = Object.keys(system.objectTypes);
  assert(safeId.test(source.id), "ID миссии: латиница, цифры, _ и - (используется как имя файла)");
  const endpoints = structuredClone(source.endpoints);
  const topology = structuredClone(source.topology);
  assert(endpoints && Object.keys(endpoints).length >= 2, "Требуются минимум две фиксированные точки");
  const inferredRoles = Object.fromEntries(Object.keys(endpoints).map((id) => [id, new Set()]));
  for (const path of topology?.paths || []) {
    inferredRoles[path.from]?.add("start");
    inferredRoles[path.to]?.add("finish");
  }
  for (const [id, point] of Object.entries(endpoints)) {
    assert(safeId.test(id), `Некорректный ID точки ${id}`);
    assert(Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 82 && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180, `Точка ${id}: координаты вне диапазона`);
    for (const field of ["size", "signalRadius"]) if (point[field] !== undefined) assert(positive(point[field]), `Точка ${id}: ${field} должно быть > 0`);
    point.icon ||= legacyPointIcon(id, point, system);
    assert(point.icon && Object.hasOwn(system.icons, point.icon) && system.pointIcons.includes(point.icon), `Точка ${id}: выберите иконку из банка точек`);
    point.label = ""; // Endpoint captions are not a separate visual entity; the bank icon is authoritative.
    if (point.roles !== undefined) assert(Array.isArray(point.roles), `Точка ${id}: roles должен быть массивом`);
    point.roles = point.roles === undefined ? [...inferredRoles[id]] : [...new Set(point.roles)];
    assert(point.roles.length > 0 && point.roles.every((role) => ["start", "finish"].includes(role)), `Точка ${id}: назначьте её стартовой или завершающей`);
  }
  const equipmentSet = source.equipmentSet || "";
  if (equipmentSet) assert(Object.hasOwn(system.equipmentSets, equipmentSet), `Миссия ${source.name}: неизвестный набор ${equipmentSet}`);
  const inventory = { ...(equipmentSet ? system.equipmentSets[equipmentSet].inventory : source.inventory) };
  assert(Object.keys(inventory).length > 0, "Инвентарь пуст");
  for (const [type, count] of Object.entries(inventory)) assert(equipmentTypes.includes(type) && Number.isInteger(count) && count >= 0, `Инвентарь ${type}: требуется целое число >= 0`);
  assert(Array.isArray(topology?.paths) && topology.paths.length > 0, "Добавьте маршрут в topology.paths");
  const pathIds = new Set();
  const roles = new Map();
  for (const path of topology.paths) {
    assert(safeId.test(path.id) && !pathIds.has(path.id), `Повторный или некорректный ID маршрута ${path.id}`);
    pathIds.add(path.id);
    assert(endpoints[path.from] && endpoints[path.to] && path.from !== path.to, `Маршрут ${path.id}: выберите разные существующие точки`);
    assert(endpoints[path.from].roles.includes("start"), `Маршрут ${path.id}: точка ${path.from} не назначена стартовой`);
    assert(endpoints[path.to].roles.includes("finish"), `Маршрут ${path.id}: точка ${path.to} не назначена завершающей`);
    path.endpointSelection = { from: "specific", to: "specific", ...path.endpointSelection };
    assert(["specific", "anyRole"].includes(path.endpointSelection.from), `Маршрут ${path.id}: неизвестный режим стартовых точек`);
    assert(["specific", "anyRole"].includes(path.endpointSelection.to), `Маршрут ${path.id}: неизвестный режим завершающих точек`);
    path.endpointSignals = { from: "nearest", to: "nearest", ...path.endpointSignals };
    assert(["nearest", "parallel"].includes(path.endpointSignals.from), `Маршрут ${path.id}: неизвестный режим сигнала стартовых точек`);
    assert(["nearest", "parallel"].includes(path.endpointSignals.to), `Маршрут ${path.id}: неизвестный режим сигнала завершающих точек`);
    const a = endpoints[path.from], b = endpoints[path.to];
    assert(Math.hypot(a.latitude - b.latitude, a.longitude - b.longitude) > 0.001, `Маршрут ${path.id}: точки совпадают`);
    assert(Array.isArray(path.steps) && path.steps.length > 0, `Маршрут ${path.id}: добавьте роли`);
    path.connection = parseConnection({ ...system.connection, ...path.connection });
    const used = new Set();
    for (const step of path.steps) {
      assert(safeId.test(step.role) && !used.has(step.role) && equipmentTypes.includes(step.type), `Маршрут ${path.id}: некорректная или повторная роль ${step.role}`);
      used.add(step.role);
      assert(!roles.has(step.role) || roles.get(step.role) === step.type, `Общая роль ${step.role} должна иметь один тип`);
      roles.set(step.role, step.type);
    }
  }
  for (const type of equipmentTypes) assert([...roles.values()].filter((t) => t === type).length <= (inventory[type] || 0), `Миссия «${source.name}»: инвентарь ${type} меньше количества уникальных ролей`);
  const objectiveIds = new Set();
  const context = { pathIds, roles, topology, equipmentTypes, objectiveIds };
  const objectives = source.objectives.map((objective) => {
    assert(safeId.test(objective.id) && !objectiveIds.has(objective.id), `Повторный или некорректный ID задачи ${objective.id}`);
    objectiveIds.add(objective.id);
    return { ...objective, condition: validateConditionTree(objective.condition, context) };
  });
  const completion = validateConditionTree(source.completion || { type: "allPaths" }, context);
  const feedbackEvents = normalizeFeedbackEvents(source.feedbackEvents, { ...context, objectiveIds }, source);
  const overrides = source.objectSettings || {};
  for (const [type, values] of Object.entries(overrides)) {
    assert(system.objectSettings[type] && values && typeof values === "object" && !Array.isArray(values), `Неизвестный тип настроек ${type}`);
    for (const [key, value] of Object.entries(values)) assert(Object.hasOwn(system.objectSettings[type], key) && positive(value), `Некорректный параметр ${type}.${key}`);
  }
  const objectSettings = parseObjectSettings(Object.fromEntries(Object.entries(system.objectSettings).map(([key, settings]) => [key, { ...settings, ...overrides[key] }])), system.objectTypes);
  return { orbitalTypes: Object.entries(system.objectTypes).filter(([, type]) => type.behavior === "orbital").map(([id]) => id), endpoints, inventory, ...(equipmentSet ? { equipmentSet } : {}), topology, objectives, completion, feedback: parseFeedback({ ...system.feedback, ...source.feedback }), feedbackEvents, objectSettings,
    route: topology.paths[0].steps.map((step) => step.type) };
}

export function normalizeFeedbackEvents(raw, context, mission = {}) {
  const source = raw || defaultFeedbackEvents(mission);
  assert(source && Array.isArray(source.success) && Array.isArray(source.error), "Попапы миссии: нужны списки success и error");
  const ids = new Set();
  const normalize = (kind, event) => {
    assert(event && safeId.test(event.id) && !ids.has(event.id), `Попап: повторный или некорректный ID ${event?.id || ""}`);
    ids.add(event.id);
    assert(typeof event.eyebrow === "string" && event.eyebrow.trim(), `Попап ${event.id}: заполните надзаголовок`);
    assert(typeof event.title === "string" && event.title.trim(), `Попап ${event.id}: заполните заголовок`);
    assert(typeof event.message === "string", `Попап ${event.id}: message должен быть строкой`);
    const condition = validateFeedbackCondition(event.condition, context);
    if (kind === "success") {
      const action = event.action || (condition.type === "missionComplete" ? "complete" : "dismiss");
      assert(["complete", "dismiss"].includes(action), `Попап ${event.id}: action должен быть complete или dismiss`);
      return { id: event.id, eyebrow: event.eyebrow, title: event.title, message: event.message, condition, action };
    }
    const negativeConnections = event.negativeConnections || "none";
    assert(["none", "invalid", "matched", "all"].includes(negativeConnections), `Попап ${event.id}: неизвестный режим негативных соединений`);
    return { id: event.id, eyebrow: event.eyebrow, title: event.title, message: event.message, condition, negativeConnections };
  };
  const success = source.success.map((event) => normalize("success", event));
  const error = source.error.map((event) => normalize("error", event));
  assert(success.some((event) => event.action === "complete" && event.condition.type === "missionComplete"), "Добавьте финальный success-попап с условием «Миссия выполнена»");
  return { success, error };
}

export function defaultFeedbackEvents(mission = {}) {
  const number = Number(mission.number) || 1;
  return {
    success: [{
      id: "mission-complete",
      eyebrow: `МИССИЯ №${number} ВЫПОЛНЕНА`,
      title: mission.successText || "МАРШРУТ РАБОТАЕТ",
      message: "Маршрут собран верно, все участки сети соединены.",
      condition: { type: "missionComplete" },
      action: "complete",
    }],
    error: [{
      id: "invalid-connection",
      eyebrow: "ОШИБКА СОЕДИНЕНИЯ",
      title: "ПРОВЕРЬ ПОРЯДОК ОБОРУДОВАНИЯ",
      message: "Соедини элементы сети в последовательности, указанной в задании.",
      condition: { type: "invalidConnection" },
      negativeConnections: "invalid",
    }],
  };
}

export function validateFeedbackCondition(condition, context) {
  assert(condition && typeof condition === "object", "У попапа отсутствует условие");
  const c = structuredClone(condition);
  if (c.type === "missionComplete" || c.type === "invalidConnection") return { type: c.type };
  if (c.type === "objectiveComplete") {
    assert(context.objectiveIds.has(c.objective), `Попап ссылается на отсутствующую задачу ${c.objective}`);
    return { type: c.type, objective: c.objective };
  }
  if (c.type === "pathComplete") {
    assert(context.pathIds.has(c.path), `Попап ссылается на отсутствующий маршрут ${c.path}`);
    return { type: c.type, path: c.path };
  }
  if (c.type === "altitude") {
    assert(context.equipmentTypes.includes(c.object), `Попап высоты: неизвестный объект ${c.object}`);
    assert(["above", "below"].includes(c.comparison), "Попап высоты: comparison должен быть above или below");
    assert(positive(c.value), "Попап высоты: порог должен быть > 0");
    assert(["any", "all"].includes(c.quantifier), "Попап высоты: quantifier должен быть any или all");
    return { type: c.type, object: c.object, comparison: c.comparison, value: c.value, quantifier: c.quantifier };
  }
  throw new Error(`Неизвестное условие попапа: ${c.type}`);
}

export function validateConditionTree(condition, context, depth = 0) {
  assert(condition && depth <= 16, "Условие отсутствует или вложенность больше 16");
  const c = structuredClone(condition);
  if (["all", "any", "atLeast", "not"].includes(c.type)) {
    assert(Array.isArray(c.children) && c.children.length > 0, `${c.type}: добавьте вложенные условия`);
    if (c.type === "not") assert(c.children.length === 1, "not требует одно условие");
    if (c.type === "atLeast") assert(Number.isInteger(c.count) && c.count > 0 && c.count <= c.children.length, "atLeast: неверное количество");
    c.children = c.children.map((child) => validateConditionTree(child, context, depth + 1));
  } else if (["path", "segment"].includes(c.type)) {
    assert(context.pathIds.has(c.path), `Условие ссылается на отсутствующий маршрут ${c.path}`);
    if (c.type === "segment") {
      const path = context.topology.paths.find((p) => p.id === c.path);
      assert(Number.isInteger(c.from) && Number.isInteger(c.to) && c.from >= 0 && c.to > c.from && c.to <= path.steps.length + 1, "segment: границы включают точки (0 и N+1) и должны быть from < to");
      c.anchor = c.anchor || "start";
      assert(["start", "end"].includes(c.anchor), "segment.anchor: start или end");
    }
  } else if (c.type === "placed") {
    assert((context.equipmentTypes || EQUIPMENT_TYPES).includes(c.object) && Number.isInteger(c.count) && c.count > 0, "placed: выберите тип и положительное количество");
  } else assert(["allPaths", "allPlaced"].includes(c.type), `Неизвестное условие v2: ${c.type}`);
  return c;
}

export function migrateMission(source) {
  if (source.topology) return structuredClone(source);
  const mission = structuredClone(source);
  mission.inventory = Object.fromEntries(EQUIPMENT_TYPES.map((type) => [type, mission.route.filter((t) => t === type).length]));
  mission.topology = { paths: [{ id: "main", from: "A", to: "B", steps: mission.route.map((type, i) => ({ role: `${type}-${i + 1}`, type })) }] };
  const sequence = ["endpoint:A", ...mission.route, "endpoint:B"];
  mission.objectives = mission.objectives.map((o) => {
    const c = o.condition;
    if (c.type === "placed") return { ...o, condition: { ...c, count: c.count || 1 } };
    if (c.type === "allPlaced") return o;
    const wanted = c.type === "adjacent" ? [c.first, c.second] : c.sequence;
    const start = wanted ? sequence.findIndex((_, i) => wanted.every((type, j) => type === sequence[i + j])) : -1;
    return { ...o, condition: start < 0 ? { type: "allPaths" } : { type: "segment", path: "main", from: start, to: start + wanted.length - 1 } };
  });
  mission.completion = { type: "allPaths" };
  mission.feedback = { invalid: "error" };
  mission.feedbackEvents ||= defaultFeedbackEvents(mission);
  return mission;
}
