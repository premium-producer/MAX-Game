import { parseMissionCatalog } from "./mission-config.mjs";

const OBJECT_TYPES = new Set(["terminal", "satellite", "gateway", "core", "internet"]);

export function validateEditorCatalog(catalog) {
  if (catalog?.schemaVersion === 2) {
    const errors = [];
    try { parseMissionCatalog(catalog); } catch (error) { errors.push(issue("catalog", error.message)); }
    return { valid: !errors.length, errors, warnings: [] };
  }
  const errors = [];
  const warnings = [];
  if (!catalog?.missions?.length) errors.push(issue("missions", "Добавьте хотя бы одну миссию."));

  const numbers = new Set();
  const ids = new Set();
  for (const [index, mission] of (catalog?.missions || []).entries()) {
    const path = `missions.${index}`;
    if (!Number.isInteger(mission.number) || mission.number < 1) errors.push(issue(`${path}.number`, "Номер должен быть положительным целым."));
    else if (numbers.has(mission.number)) errors.push(issue(`${path}.number`, `Номер ${mission.number} уже используется.`));
    numbers.add(mission.number);
    if (!mission.id?.trim()) errors.push(issue(`${path}.id`, "Укажите стабильный id."));
    else if (ids.has(mission.id)) errors.push(issue(`${path}.id`, `ID «${mission.id}» уже используется.`));
    ids.add(mission.id);
    if (!mission.name?.trim()) errors.push(issue(`${path}.name`, "Укажите название."));
    if (!Number.isInteger(Number(mission.timeSeconds)) || Number(mission.timeSeconds) < 1) errors.push(issue(`${path}.timeSeconds`, "Время должно быть положительным целым."));
    validateGeo(mission.mapPosition, `${path}.mapPosition`, errors);
    validateGeo(mission.endpoints?.A, `${path}.endpoints.A`, errors);
    validateGeo(mission.endpoints?.B, `${path}.endpoints.B`, errors);
    if (!Array.isArray(mission.route) || !mission.route.length) errors.push(issue(`${path}.route`, "Маршрут не может быть пустым."));
    for (const type of mission.route || []) if (!OBJECT_TYPES.has(type)) errors.push(issue(`${path}.route`, `Неизвестный объект «${type}».`));
    const objectiveIds = new Set();
    if (!mission.objectives?.length) errors.push(issue(`${path}.objectives`, "Добавьте хотя бы одну задачу."));
    for (const [objectiveIndex, objective] of (mission.objectives || []).entries()) {
      const objectivePath = `${path}.objectives.${objectiveIndex}`;
      if (!objective.id?.trim()) errors.push(issue(`${objectivePath}.id`, "Укажите id задачи."));
      else if (objectiveIds.has(objective.id)) errors.push(issue(`${objectivePath}.id`, `ID задачи «${objective.id}» повторяется.`));
      objectiveIds.add(objective.id);
      if (!objective.label?.trim()) errors.push(issue(`${objectivePath}.label`, "Укажите текст задачи."));
      validateCondition(objective.condition, objectivePath, mission.route || [], errors, warnings);
    }

    const dependencies = mission.unlock?.requiresCompleted || [];
    if (mission.number > 1 && !dependencies.length) warnings.push(issue(`${path}.unlock`, "Миссия открывается сразу: у неё нет зависимостей."));
    if (dependencies.includes(mission.number)) errors.push(issue(`${path}.unlock`, "Миссия не может зависеть от самой себя."));

    const a = mission.endpoints?.A;
    const b = mission.endpoints?.B;
    if (a && b && Math.hypot(a.latitude - b.latitude, a.longitude - b.longitude) < 0.5) warnings.push(issue(`${path}.endpoints`, "Точки A и Б почти совпадают."));
  }

  if (!errors.length) {
    try {
      parseMissionCatalog({ schemaVersion: 1, missions: catalog.missions, objectSettings: catalog.objectSettings });
    } catch (error) {
      errors.push(issue("catalog", error.message));
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

function validateGeo(value, path, errors) {
  const latitude = Number(value?.latitude);
  const longitude = Number(value?.longitude);
  if (!Number.isFinite(latitude) || latitude < -82 || latitude > 82) errors.push(issue(`${path}.latitude`, "Широта должна быть от −82 до 82."));
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) errors.push(issue(`${path}.longitude`, "Долгота должна быть от −180 до 180."));
}

function validateCondition(condition, path, route, errors, warnings) {
  if (!condition?.type) {
    errors.push(issue(`${path}.condition`, "Выберите условие."));
    return;
  }
  if (condition.type === "placed") {
    if (!OBJECT_TYPES.has(condition.object)) errors.push(issue(`${path}.condition.object`, "Выберите объект."));
  } else if (condition.type === "adjacent") {
    if (!OBJECT_TYPES.has(condition.first) || !OBJECT_TYPES.has(condition.second)) errors.push(issue(`${path}.condition`, "Выберите оба соседних объекта."));
    const required = Number(condition.count) || 1;
    const actual = route.reduce((count, type, index) => count + (type === condition.first && route[index + 1] === condition.second ? 1 : 0), 0);
    if (actual < required) warnings.push(issue(`${path}.condition`, "Такой соседней пары нет в правильном маршруте."));
  } else if (condition.type === "connectedSequence") {
    const sequence = condition.sequence;
    if (!Array.isArray(sequence) || !sequence.length) {
      errors.push(issue(`${path}.condition.sequence`, "Укажите последовательность соединённых объектов."));
    } else {
      const expected = ["endpoint:A", ...route, "endpoint:B"];
      if (!expected.some((_, start) => sequence.every((type, offset) => expected[start + offset] === type))) {
        warnings.push(issue(`${path}.condition.sequence`, "Такой цепочки нет в правильном маршруте."));
      }
    }
  } else if (!["allPlaced", "routeCorrect", "networkConnected"].includes(condition.type)) {
    errors.push(issue(`${path}.condition.type`, `Неизвестное условие «${condition.type}».`));
  }
  if (condition.count !== undefined && (!Number.isInteger(Number(condition.count)) || Number(condition.count) < 1)) errors.push(issue(`${path}.condition.count`, "Количество должно быть положительным целым."));
}

function issue(path, message) {
  return { path, message };
}
