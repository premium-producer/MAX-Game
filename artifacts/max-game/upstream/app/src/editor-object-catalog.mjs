import { DEFAULT_ICONS, DEFAULT_OBJECT_TYPES, SAFE_CATALOG_ID, iconSource, validateIconSvg } from "./object-catalog.mjs";
import { settingsDefaults } from "./node-settings.mjs";
const escape = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const attr = (path) => escape(JSON.stringify(path));
export const catalogTypes = (catalog) => catalog.system.objectTypes || DEFAULT_OBJECT_TYPES;
export const catalogTypeOptions = (catalog) => Object.entries(catalogTypes(catalog)).map(([id, type]) => [id, type.short]);
export function iconPicker(catalog, path, value, pointBankOnly = false) {
  const icons = catalog.system.icons || DEFAULT_ICONS;
  const ids = pointBankOnly ? [...new Set([...(catalog.system.pointIcons || ["point-a", "point-b"]), ...(value ? [value] : [])])].filter((id) => icons[id]) : Object.keys(icons);
  return `<label class="editor-field"><span>Иконка из банка точек</span><select data-v2-field="${attr(path)}">${ids.map((id) => `<option value="${id}" ${value === id ? "selected" : ""}>${escape(icons[id].label)}</option>`).join("")}</select></label>${icons[value] ? `<img class="editor-icon-preview" src="${escape(iconSource(icons[value]))}" alt="">` : ""}<a href="./object.html#icons" target="_blank" rel="noopener">Подготовить иконки в банке ↗</a>`;
}
export function ensureObjectCatalog(catalog) {
  catalog.system.objectTypes ||= structuredClone(DEFAULT_OBJECT_TYPES);
  catalog.system.objectSettings ||= {};
  catalog.system.icons ||= structuredClone(DEFAULT_ICONS);
  catalog.system.pointIcons ||= ["point-a", "point-b"].filter((id) => catalog.system.icons[id]);
  catalog.system.equipmentSets ||= {};
}
export function importCatalogIcon(catalog, path, input, name = "Иконка") {
  const svg = validateIconSvg(input);
  ensureObjectCatalog(catalog);
  let id = Object.keys(catalog.system.icons).find((key) => catalog.system.icons[key].svg === svg);
  if (!id) {
    let n = 1; while (catalog.system.icons[`custom-${n}`]) n++;
    id = `custom-${n}`;
    catalog.system.icons[id] = { label: name.slice(0, 160) || id, svg };
  }
  let target = catalog;
  for (const key of path.slice(0, -1)) target = target[key];
  target[path.at(-1)] = id;
  return id;
}
export function changeTypeBehavior(catalog, id, behavior) {
  ensureObjectCatalog(catalog);
  const previous = catalog.system.objectSettings[id] || {};
  catalog.system.objectTypes[id].behavior = behavior;
  catalog.system.objectTypes[id].placementSurface = behavior === "orbital" ? "any" : "land";
  const defaults = settingsDefaults(catalog.system.objectTypes)[id];
  const trim = (values) => Object.fromEntries(Object.entries(values || {}).filter(([key]) => key in defaults));
  catalog.system.objectSettings[id] = { ...defaults, ...trim(previous) };
  if (behavior === "orbital") {
    const inheritedRadius = previous.signalRadius ?? defaults.signalRadius;
    if (!Number.isFinite(previous.radiusAtMinAltitude)) catalog.system.objectSettings[id].radiusAtMinAltitude = inheritedRadius;
    if (!Number.isFinite(previous.radiusAtMaxAltitude)) catalog.system.objectSettings[id].radiusAtMaxAltitude = inheritedRadius;
  }
  for (const mission of catalog.missions) if (mission.objectSettings?.[id]) mission.objectSettings[id] = trim(mission.objectSettings[id]);
}
export function applyCatalogAction(catalog, action, path, argument) {
  if (!["add-type", "duplicate-type", "delete-type"].includes(action)) return false;
  ensureObjectCatalog(catalog);
  const types = catalog.system.objectTypes, id = path.at(-1);
  if (action === "delete-type") {
    if (Object.keys(types).length <= 1) throw new Error("В каталоге должен остаться хотя бы один тип");
    const uses = (c) => c?.object === id || c?.children?.some(uses);
    const usedSet = Object.values(catalog.system.equipmentSets).find((set) => set.inventory[id] > 0);
    if (usedSet) throw new Error(`Объект используется в наборе «${usedSet.label}». Сначала уберите его из набора`);
    const used = catalog.missions.find((m) => (!m.equipmentSet && m.inventory?.[id] > 0) || m.topology.paths.some((p) => p.steps.some((s) => s.type === id)) || uses(m.completion) || m.objectives.some((o) => uses(o.condition)));
    if (used) throw new Error(`Тип используется в миссии «${used.name}»: сначала измените инвентарь, роли и условия`);
    delete types[id]; delete catalog.system.objectSettings[id];
    if (catalog.system.screenAppearance) delete catalog.system.screenAppearance.sizes[id];
    for (const set of Object.values(catalog.system.equipmentSets)) delete set.inventory[id];
    for (const m of catalog.missions) { if (m.inventory) delete m.inventory[id]; if (m.objectSettings) delete m.objectSettings[id]; }
    return true;
  }
  if (!SAFE_CATALOG_ID.test(argument) || Object.hasOwn(types, argument)) throw new Error("Нужен уникальный ID: латиница, цифры, _ или -");
  const existingIds = Object.keys(types);
  const commonSetting = (key) => {
    const values = existingIds.map((typeId) => catalog.system.objectSettings[typeId]?.[key]);
    return values.length && values.every((value) => Number.isFinite(value) && value === values[0]) ? values[0] : undefined;
  };
  const inheritedDefaults = { size: commonSetting("size"), signalRadius: commonSetting("signalRadius") };
  types[argument] = action === "duplicate-type" ? structuredClone(types[id]) : { label: "НОВЫЙ ОБЪЕКТ", short: "НОВЫЙ ОБЪЕКТ", icon: Object.keys(catalog.system.icons)[0], behavior: "ground" };
  catalog.system.objectSettings[argument] = action === "duplicate-type" ? structuredClone(catalog.system.objectSettings[id] || settingsDefaults(types)[id]) : { ...settingsDefaults(types)[argument], ...Object.fromEntries(Object.entries(inheritedDefaults).filter(([, value]) => value !== undefined)) };
  if (action === "duplicate-type" && catalog.system.screenAppearance?.sizes[id] !== undefined) catalog.system.screenAppearance.sizes[argument] = catalog.system.screenAppearance.sizes[id];
  return true;
}
