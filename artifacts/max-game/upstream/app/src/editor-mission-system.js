import { SCREEN_CONNECTION_DEFAULTS } from "./screen-connectivity.mjs";
import { EQUIPMENT_TYPES, DEFAULT_CONNECTION, defaultFeedbackEvents } from "./mission-system.mjs";
import { DEFAULT_OBJECT_SETTINGS, settingsDefaults } from "./node-settings.mjs";
import { catalogTypes, catalogTypeOptions, iconPicker, ensureObjectCatalog, changeTypeBehavior, applyCatalogAction } from "./editor-object-catalog.mjs";
import { renderMissionEquipment } from "./object-bank-view.mjs";
import { chooseEquipmentSet } from "./object-bank.mjs";

const labels = { terminal: "Терминал", satellite: "Спутник", gateway: "Шлюз", core: "Центр обработки данных", internet: "Интернет", "endpoint:A": "Точки: профиль A", "endpoint:B": "Точки: профиль Б" };
const parameterLabels = { size: "Размер маркера ×", signalRadius: "Радиус сигнала", radiusAtMinAltitude: "Радиус на min высоте", radiusAtMaxAltitude: "Радиус на max высоте", minAltitude: "Минимальная высота", maxAltitude: "Максимальная высота", defaultAltitude: "Стартовая высота" };
const escape = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const attr = (path) => escape(JSON.stringify(path));
const button = (text, action, path, extra = "") => `<button type="button" data-v2-action="${action}" data-v2-path="${attr(path)}" ${extra}>${text}</button>`;
function field(label, path, value, type = "text", placeholder = "") {
  return `<label class="editor-field"><span>${escape(label)}</span><input type="${type}" ${type === "number" ? 'step="any"' : ""} data-v2-field="${attr(path)}" value="${escape(value)}" placeholder="${escape(placeholder)}"></label>`;
}
function select(label, path, value, options) {
  return `<label class="editor-field"><span>${escape(label)}</span><select data-v2-field="${attr(path)}">${options.map(([id, text]) => `<option value="${escape(id)}" ${id === value ? "selected" : ""}>${escape(text)}</option>`).join("")}</select></label>`;
}
const defaultTypeOptions = EQUIPMENT_TYPES.map((t) => [t, labels[t]]);

export function renderSystemInspector(catalog, index) {
  const mission = catalog.missions[index], base = ["missions", index];
  const types = catalogTypes(catalog), typeOptions = catalogTypeOptions(catalog);
  const settingsSection = (title, root, values, fallback, override = false) => `<details class="inspector-section v2-section"><summary>${title}</summary><p class="condition-note">Размер не меняет радиус. Единицы сцены: радиус Земли = 3. ${override ? "Пустое поле наследует общий параметр." : "Общие значения действуют во всех миссиях."}</p>${Object.entries(settingsDefaults(types)).map(([type, defaults]) => `<h4>${escape(types[type]?.short || labels[type] || type)}</h4><div class="field-grid">${Object.keys(defaults).map((key) => field(parameterLabels[key], [...root, type, key], values?.[type]?.[key], "number", fallback?.[type]?.[key] ?? defaults[key])).join("")}</div>`).join("")}</details>`;
  return `<section class="inspector-section"><h3>ТОЧКИ МАРШРУТОВ</h3><p class="condition-note">Стартовых и завершающих точек может быть сколько угодно. Новые точки проще добавлять из банка через кнопки над вьюпортом.</p>${renderPointSection(catalog, mission, index, "start", "СТАРТОВЫЕ ТОЧКИ")}${renderPointSection(catalog, mission, index, "finish", "ЗАВЕРШАЮЩИЕ ТОЧКИ")}</section>
  ${renderMissionEquipment(catalog, index)}
  ${renderFeedbackEvents(catalog, mission, index, typeOptions)}
  ${settingsSection("РАЗМЕРЫ И РАДИУСЫ · ЭТА МИССИЯ", [...base, "objectSettings"], mission.objectSettings, catalog.system.objectSettings, true)}

  <details class="inspector-section v2-section"><summary>ОБЩИЕ ПРАВИЛА НОВЫХ МАРШРУТОВ</summary>${field("Ширина коридора по умолчанию", ["system", "connection", "corridorWidth"], catalog.system.connection.corridorWidth, "number")}${field("Допуск неоднозначности", ["system", "connection", "ambiguityEpsilon"], catalog.system.connection.ambiguityEpsilon, "number")}<p class="condition-note">Оформление ошибок задаётся списком событий каждой миссии. Уже заданные локальные параметры маршрутов сохраняют свои значения.</p></details>
  <section class="inspector-section"><h3>УСЛОВИЕ ПОБЕДЫ</h3><p class="condition-note">Дополнительно всегда требуются все задачи миссии. Условия проверяются непрерывно, галочки снимаются при разрыве.</p>${renderCondition(mission.completion, [...base, "completion"], mission, typeOptions)}</section>
  <section class="inspector-section"><h3>ЗАДАЧИ</h3>${mission.objectives.map((objective, i) => `<article class="objective-editor">${field("ID задачи", [...base, "objectives", i, "id"], objective.id)}${field("Текст", [...base, "objectives", i, "label"], objective.label)}${renderCondition(objective.condition, [...base, "objectives", i, "condition"], mission, typeOptions)}${button("Удалить задачу", "remove", [...base, "objectives", i])}</article>`).join("")}${button("＋ Задача", "add-objective", [...base, "objectives"])}</section>`;
}

function renderFeedbackEvents(catalog, mission, index, typeOptions) {
  mission.feedbackEvents ||= defaultFeedbackEvents(mission);
  const root = ["missions", index, "feedbackEvents"];
  const group = (kind, title, note) => `<details class="inspector-section v2-section feedback-event-group" open><summary>${title} · ${mission.feedbackEvents[kind].length}</summary><p class="condition-note">${note}</p>${mission.feedbackEvents[kind].map((event, i) => {
    const path = [...root, kind, i];
    return `<article class="objective-editor feedback-event feedback-event--${kind}">
      <div class="feedback-event__heading"><strong>${escape(event.title)}</strong><div class="v2-actions">${button("↑", "left", path, i === 0 ? "disabled" : "")}${button("↓", "right", path, i === mission.feedbackEvents[kind].length - 1 ? "disabled" : "")}${button("Удалить", "remove", path)}</div></div>
      <div class="field-grid">${field("ID события", [...path, "id"], event.id)}${field("Крупный текст попапа", [...path, "title"], event.title)}</div>
      ${renderFeedbackCondition(event.condition, [...path, "condition"], mission, typeOptions)}
      ${kind === "success"
        ? select("Действие", [...path, "action"], event.action, [["dismiss", "Закрыть и продолжить"], ["complete", "Завершить миссию"]])
        : select("Негативные соединения", [...path, "negativeConnections"], event.negativeConnections, [["none", "Не окрашивать"], ["invalid", "Только неправильные"], ["matched", "Возле найденных объектов"], ["all", "Все соединения"]])}
    </article>`;
  }).join("")}${button(kind === "success" ? "＋ Успешный попап" : "＋ Попап ошибки", `add-feedback-${kind}`, [...root, kind])}</details>`;
  return `<section class="inspector-section"><h3>ПОПАПЫ И НЕГАТИВНЫЕ СОЕДИНЕНИЯ</h3><p class="condition-note">Порядок карточек задаёт приоритет. Каждое событие показывается один раз за вход в миссию. В игре отображается только крупный текст попапа; технические ошибки маршрута игроку не выводятся.</p></section>
  ${group("success", "УСПЕШНЫЕ ПОПАПЫ", "Финальный попап должен иметь условие «Миссия выполнена» и действие «Завершить миссию».")}
  ${group("error", "ПОПАПЫ ОШИБОК", "Красный визуальный эффект настраивается независимо от условия и текста.")}`;
}

const feedbackConditionTypes = [["missionComplete", "Миссия выполнена"], ["invalidConnection", "Неправильное соединение"], ["objectiveComplete", "Задача выполнена"], ["pathComplete", "Маршрут выполнен"], ["altitude", "Высота оборудования"]];
function renderFeedbackCondition(c, path, mission, typeOptions) {
  const objectiveOptions = mission.objectives.map((objective) => [objective.id, objective.label]);
  const pathOptions = mission.topology.paths.map((route) => [route.id, route.id]);
  return `<div class="v2-condition feedback-condition">${select("Когда показывать", [...path, "type"], c.type, feedbackConditionTypes)}
    ${c.type === "objectiveComplete" ? select("Задача", [...path, "objective"], c.objective, objectiveOptions) : ""}
    ${c.type === "pathComplete" ? select("Маршрут", [...path, "path"], c.path, pathOptions) : ""}
    ${c.type === "altitude" ? `<div class="field-grid">${select("Оборудование", [...path, "object"], c.object, typeOptions)}${select("Сравнение", [...path, "comparison"], c.comparison, [["above", "Выше порога"], ["below", "Ниже порога"]])}${field("Порог высоты", [...path, "value"], c.value, "number")}${select("Количество", [...path, "quantifier"], c.quantifier, [["any", "Хотя бы один"], ["all", "Все размещённые"]])}</div>` : ""}
  </div>`;
}

const conditionTypes = [["allPaths", "Все маршруты соединены"], ["path", "Конкретный маршрут"], ["segment", "Участок маршрута"], ["placed", "Размещено объектов"], ["allPlaced", "Весь инвентарь размещён"], ["all", "Все вложенные условия (AND)"], ["any", "Любое условие (OR)"], ["atLeast", "Минимум N условий"], ["not", "НЕ"]];
export function renderCondition(c, path, mission, typeOptions = defaultTypeOptions) {
  const pathOptions = mission.topology.paths.map((p) => [p.id, p.id]);
  const children = c.children || [];
  return `<div class="v2-condition">${select("Условие", [...path, "type"], c.type, conditionTypes)}${["path", "segment"].includes(c.type) ? select("Маршрут", [...path, "path"], c.path, pathOptions) : ""}
  ${c.type === "segment" ? `<div class="field-grid">${field("От позиции (0 = начало)", [...path, "from"], c.from, "number")}${field("До позиции (N+1 = конец)", [...path, "to"], c.to, "number")}</div>${select("Проверять от", [...path, "anchor"], c.anchor || "start", [["start", "Начальной точки"], ["end", "Конечной точки (независимый хвост)"]])}` : ""}
  ${c.type === "placed" ? select("Тип", [...path, "object"], c.object, typeOptions) : ""}
  ${["placed", "atLeast"].includes(c.type) ? field("Количество", [...path, "count"], c.count, "number") : ""}
  ${children.map((child, i) => `<div>${renderCondition(child, [...path, "children", i], mission, typeOptions)}${c.type !== "not" ? button("Убрать условие", "remove", [...path, "children", i]) : ""}</div>`).join("")}
  ${["all", "any", "atLeast"].includes(c.type) ? button("＋ Условие", "add-condition", [...path, "children"]) : ""}</div>`;
}

export function renderTopology(catalog, index) {
  const mission = catalog.missions[index], base = ["missions", index, "topology", "paths"];
  const typeOptions = catalogTypeOptions(catalog);
  const starts = pointIdsForRole(mission, "start").map((id) => [id, pointOption(catalog, mission, id)]);
  const finishes = pointIdsForRole(mission, "finish").map((id) => [id, pointOption(catalog, mission, id)]);
  return `<li class="v2-topology"><p class="condition-note">Маршруты направлены от стартовой точки к завершающей. Для каждой стороны можно выбрать одну конкретную точку или сделать равноправными все точки соответствующего назначения. Для равноправной группы сигнал может идти только от ближайшей к крайнему объекту точки либо параллельно от всех точек в радиусе. Одинаковый ID роли в разных маршрутах требует один общий физический узел. В режиме расстояния порядок определяется на планете, в режиме ракурса — вдоль экранной оси от старта к финишу</p>${mission.topology.paths.map((p, i) => `<article class="v2-path"><div class="v2-path-header">${field("ID маршрута", [...base, i, "id"], p.id)}${select("Стартовая точка", [...base, i, "from"], p.from, starts)}${select("Работа стартовых точек", [...base, i, "endpointSelection", "from"], p.endpointSelection?.from || "specific", [["specific", "Только выбранная"], ["anyRole", "Любая стартовая"]])}${select("Сигнал стартовых точек", [...base, i, "endpointSignals", "from"], p.endpointSignals?.from || "nearest", [["nearest", "Только ближайшая"], ["parallel", "Параллельно от всех"]])}${select("Завершающая точка", [...base, i, "to"], p.to, finishes)}${select("Работа завершающих точек", [...base, i, "endpointSelection", "to"], p.endpointSelection?.to || "specific", [["specific", "Только выбранная"], ["anyRole", "Любая завершающая"]])}${select("Сигнал завершающих точек", [...base, i, "endpointSignals", "to"], p.endpointSignals?.to || "nearest", [["nearest", "Только ближайшая"], ["parallel", "Параллельно от всех"]])}${select("Механика связи", [...base, i, "connection", "policy"], p.connection?.policy || "geographicCorridor", [["geographicCorridor", "По расстоянию"], ["screenProjected", "По ракурсу"], ["hybridProjected", "Смешанный"]])}${["screenProjected", "hybridProjected"].includes(p.connection?.policy) ? Object.entries(SCREEN_CONNECTION_DEFAULTS).map(([key, fallback]) => field(({corridorFraction:"Ширина коридора / длина оси",ambiguityFraction:"Допуск порядка / длина оси",minimumEndpointSpan:"Минимальная длина оси, px",iconGap:"Зазор между иконками, px",stableHoldMs:"Удержание ракурса, мс"})[key], [...base, i, "connection", "screen", key], p.connection.screen?.[key] ?? fallback, "number")).join("") : ""}${field("Ширина коридора", [...base, i, "connection", "corridorWidth"], p.connection?.corridorWidth ?? catalog.system.connection.corridorWidth, "number")}${field("Допуск неоднозначности", [...base, i, "connection", "ambiguityEpsilon"], p.connection?.ambiguityEpsilon ?? catalog.system.connection.ambiguityEpsilon, "number")}${button("Удалить маршрут", "remove", [...base, i])}</div><div class="v2-steps">${p.steps.map((step, j) => `<article><b>${j + 1}</b>${field("ID роли", [...base, i, "steps", j, "role"], step.role)}${select("Объект", [...base, i, "steps", j, "type"], step.type, typeOptions)}<div class="v2-actions">${button("←", "left", [...base, i, "steps", j])}${button("→", "right", [...base, i, "steps", j])}${button("×", "remove", [...base, i, "steps", j])}</div></article>`).join("")}${button("＋ Роль", "add-step", [...base, i, "steps"])}</div></article>`).join("")}${button("＋ Маршрут / ветка", "add-path", base)}</li>`;
}

function renderPointSection(catalog, mission, index, role, title) {
  const base = ["missions", index, "endpoints"];
  return `<div class="v2-point-group"><h4>${title}</h4>${pointIdsForRole(mission, role).map((id) => {
    const point = mission.endpoints[id];
    const roleValue = point.roles?.length === 2 ? "both" : point.roles?.[0] || role;
    return `<article class="v2-point"><h4>${escape(id)}</h4>${select("Назначение", [...base, id, "roles"], roleValue, [["start", "Стартовая"], ["finish", "Завершающая"], ["both", "Обе роли"]])}${iconPicker(catalog, [...base, id, "icon"], point.icon, true)}<div class="field-grid">${field("Широта", [...base, id, "latitude"], point.latitude, "number")}${field("Долгота", [...base, id, "longitude"], point.longitude, "number")}${field("Размер × (пусто = профиль)", [...base, id, "size"], point.size, "number")}${field("Радиус (пусто = профиль)", [...base, id, "signalRadius"], point.signalRadius, "number")}</div><div class="v2-actions"><button type="button" data-map-tool="${escape(id)}">НА КАРТЕ</button>${button("Переименовать ID", "rename-point", [...base, id])}${button("Удалить", "delete-point", [...base, id])}</div></article>`;
  }).join("") || '<p class="condition-note">Пока нет точек этой роли.</p>'}</div>`;
}

function pointOption(catalog, mission, id) {
  const point = mission.endpoints[id];
  return `${id}${point?.icon && catalog.system.icons[point.icon] ? ` · ${catalog.system.icons[point.icon].label}` : ""}`;
}

export function pointIdsForRole(mission, role) {
  return Object.entries(mission.endpoints || {}).filter(([id, point]) => {
    if (point.roles?.includes(role)) return true;
    return mission.topology?.paths?.some((path) => role === "start" ? path.from === id : path.to === id);
  }).map(([id]) => id);
}

export function addPointFromBank(catalog, index, role, iconId) {
  if (!["start", "finish"].includes(role)) throw new Error("Неизвестное назначение точки");
  const mission = catalog.missions[index], icon = catalog.system.icons?.[iconId];
  if (!icon || !catalog.system.pointIcons?.includes(iconId)) throw new Error("Выберите иконку из банка точек");
  const id = unique(`${role}-${iconId}`, Object.keys(mission.endpoints));
  mission.endpoints[id] = { label: "", icon: iconId, roles: [role], ...mission.mapPosition };
  return id;
}

export function getAt(root, path) { return path.reduce((node, key) => node?.[key], root); }
export function setAt(root, path, value) {
  let node = root;
  for (const key of path.slice(0, -1)) { if (!node[key]) node[key] = {}; node = node[key]; }
  if (value === undefined) delete node[path.at(-1)]; else node[path.at(-1)] = value;
}
function conditionDefault(type, mission, firstType = "terminal") {
  if (["all", "any", "not", "atLeast"].includes(type)) return { type, ...(type === "atLeast" ? { count: 1 } : {}), children: [{ type: "allPaths" }] };
  if (["path", "segment"].includes(type)) return { type, path: mission.topology.paths[0]?.id || "", ...(type === "segment" ? { from: 0, to: 1 } : {}) };
  if (type === "placed") return { type, object: firstType, count: 1 };
  return { type };
}
function feedbackConditionDefault(type, mission, firstType = "terminal") {
  if (type === "objectiveComplete") return { type, objective: mission.objectives[0]?.id || "" };
  if (type === "pathComplete") return { type, path: mission.topology.paths[0]?.id || "" };
  if (type === "altitude") return { type, object: firstType, comparison: "above", value: 1, quantifier: "any" };
  return { type };
}
export function changeSystemField(catalog, path, value) {
  ensureObjectCatalog(catalog);
  if (path.at(-1) === "policy" && path.includes("connection") && ["screenProjected", "hybridProjected"].includes(value)) {
    const connection = getAt(catalog, path.slice(0, -1));
    connection.screen = { ...SCREEN_CONNECTION_DEFAULTS, ...connection.screen };
  }
  if (path[0] === "missions" && path.at(-1) === "equipmentSet") { chooseEquipmentSet(catalog, path[1], value); return; }
  if (path[0] === "system" && path[1] === "objectTypes" && path.at(-1) === "short") {
    catalog.system.objectTypes[path[2]].short = value;
    catalog.system.objectTypes[path[2]].label = value;
    return;
  }
  if (path[1] === "objectTypes" && path.at(-1) === "behavior") { changeTypeBehavior(catalog, path[2], value); return; }
  if (path.at(-1) === "roles" && path.includes("endpoints")) {
    setAt(catalog, path, value === "both" ? ["start", "finish"] : [value]);
  } else if (path.at(-1) === "type" && path.includes("feedbackEvents")) {
    setAt(catalog, path.slice(0, -1), feedbackConditionDefault(value, catalog.missions[path[1]], Object.keys(catalogTypes(catalog))[0]));
  } else if (path.at(-1) === "type" && (path.includes("condition") || path.includes("completion"))) {
    setAt(catalog, path.slice(0, -1), conditionDefault(value, catalog.missions[path[1]], Object.keys(catalogTypes(catalog))[0]));
  } else {
    // Renaming a path updates all typed references, including deeply nested conditions.
    if (path.includes("paths") && path.at(-1) === "id") {
      const mission = catalog.missions[path[1]], old = getAt(catalog, path);
      const update = (c) => { if (c.path === old) c.path = value; c.children?.forEach(update); };
      mission.objectives.forEach((o) => update(o.condition)); update(mission.completion);
      for (const kind of ["success", "error"]) for (const event of mission.feedbackEvents?.[kind] || []) if (event.condition?.type === "pathComplete" && event.condition.path === old) event.condition.path = value;
    }
    if (path.includes("objectives") && path.at(-1) === "id") {
      const mission = catalog.missions[path[1]], old = getAt(catalog, path);
      for (const kind of ["success", "error"]) for (const event of mission.feedbackEvents?.[kind] || []) if (event.condition?.type === "objectiveComplete" && event.condition.objective === old) event.condition.objective = value;
    }
    setAt(catalog, path, value);
  }
}
export function applySystemAction(catalog, action, path, argument) {
  if (applyCatalogAction(catalog, action, path, argument)) return;
  const types = Object.keys(catalogTypes(catalog));
  const target = getAt(catalog, path), parent = getAt(catalog, path.slice(0, -1)), key = path.at(-1);
  const mission = catalog.missions[path[1]];
  if (action === "remove") { parent.splice(Number(key), 1); return; }
  if (["left", "right"].includes(action)) {
    const to = Number(key) + (action === "left" ? -1 : 1);
    if (to >= 0 && to < parent.length) [parent[key], parent[to]] = [parent[to], parent[key]];
  }
  if (action === "add-condition") target.push({ type: "allPaths" });
  if (action === "add-objective") target.push({ id: unique("objective", mission.objectives.map((o) => o.id)), label: "Новая задача", condition: { type: "allPaths" } });
  if (action === "add-feedback-success") {
    const ids = [...mission.feedbackEvents.success, ...mission.feedbackEvents.error].map((event) => event.id);
    target.push({ id: unique("success", ids), eyebrow: "УСПЕХ", title: "ЭТАП ВЫПОЛНЕН", message: "Условие выполнено.", condition: { type: "objectiveComplete", objective: mission.objectives[0]?.id || "" }, action: "dismiss" });
  }
  if (action === "add-feedback-error") {
    const ids = [...mission.feedbackEvents.success, ...mission.feedbackEvents.error].map((event) => event.id);
    target.push({ id: unique("error", ids), eyebrow: "ВНИМАНИЕ", title: "ПРОВЕРЬ СОЕДИНЕНИЕ", message: "Исправь отмеченный участок сети.", condition: { type: "invalidConnection" }, negativeConnections: "invalid" });
  }
  if (action === "add-step") target.push({ role: unique("role", mission.topology.paths.flatMap((p) => p.steps.map((s) => s.role))), type: types.includes("satellite") ? "satellite" : types[0] });
  if (action === "add-path") target.push({ id: unique("path", target.map((p) => p.id)), from: pointIdsForRole(mission, "start")[0], to: pointIdsForRole(mission, "finish")[0], endpointSelection: { from: "specific", to: "specific" }, endpointSignals: { from: "nearest", to: "nearest" }, steps: [{ role: unique("role", target.flatMap((p) => p.steps.map((s) => s.role))), type: types[0] }], connection: { ...catalog.system.connection } });
  if (action === "inventory-from-roles") {
    if (mission.equipmentSet) throw new Error("Состав общего набора редактируется на странице банка объектов");
    const roles = new Map(mission.topology.paths.flatMap((p) => p.steps.map((s) => [s.role, s.type])));
    mission.inventory = Object.fromEntries(types.map((type) => [type, [...roles.values()].filter((t) => t === type).length]));
  }
  if (action === "delete-point") {
    const changes = [];
    for (const route of mission.topology.paths) for (const [field, role, opposite] of [["from", "start", "to"], ["to", "finish", "from"]]) {
      if (route[field] !== key) continue;
      const replacement = pointIdsForRole(mission, role).find((id) => id !== key && id !== route[opposite]);
      if (!replacement) throw new Error(`Сначала добавьте другую ${role === "start" ? "стартовую" : "завершающую"} точку: маршрут «${route.id}» не может остаться без неё`);
      changes.push([route, field, replacement]);
    }
    for (const [route, field, replacement] of changes) route[field] = replacement;
    delete parent[key];
  }
  if (action === "rename-point") {
    if (!argument || !/^[a-zA-Z0-9_-]+$/.test(argument) || ["__proto__", "constructor", "prototype"].includes(argument) || parent[argument]) throw new Error("Нужен уникальный ID: латиница, цифры, _ или -");
    parent[argument] = target; delete parent[key];
    for (const p of mission.topology.paths) { if (p.from === key) p.from = argument; if (p.to === key) p.to = argument; }
  }
}
function unique(seed, ids) { let n = 1; while (ids.includes(`${seed}-${n}`)) n++; return `${seed}-${n}`; }
