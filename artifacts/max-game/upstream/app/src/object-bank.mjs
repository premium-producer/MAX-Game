import { SAFE_CATALOG_ID, validateIconSvg } from "./object-catalog.mjs";
import { applyCatalogAction, ensureObjectCatalog } from "./editor-object-catalog.mjs";
import { settingsDefaults } from "./node-settings.mjs";

export function missionInventory(catalog, mission) {
  return mission.equipmentSet ? catalog.system.equipmentSets?.[mission.equipmentSet]?.inventory || {} : mission.inventory || {};
}
export function chooseEquipmentSet(catalog, missionIndex, id) {
  const mission = catalog.missions[missionIndex];
  if (id && !Object.hasOwn(catalog.system.equipmentSets || {}, id)) throw new Error("Набор не найден");
  const inventory = structuredClone(missionInventory(catalog, mission));
  if (id) { mission.equipmentSet = id; mission.inventory = structuredClone(catalog.system.equipmentSets[id].inventory); }
  else { delete mission.equipmentSet; mission.inventory = inventory; }
}
export function equipmentSetUsers(catalog, id) { return catalog.missions.filter((m) => m.equipmentSet === id); }
export function iconUsers(catalog, id) {
  return [
    ...Object.entries(catalog.system.objectTypes).filter(([, type]) => type.icon === id).map(([key, type]) => ({ kind: "object", id: key, label: type.short })),
    ...catalog.missions.flatMap((m) => Object.entries(m.endpoints).filter(([, point]) => point.icon === id).map(([key]) => ({ kind: "point", id: `${m.id}:${key}`, label: `${m.name} · ${key}` }))),
  ];
}
function uniqueId(dictionary, prefix) {
  let n = 1; while (Object.hasOwn(dictionary, `${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}
function assertNew(dictionary, id) {
  if (typeof id !== "string" || !SAFE_CATALOG_ID.test(id) || Object.hasOwn(dictionary, id)) throw new Error("Укажите новый ID: латиница, цифры, _ и -");
}
export function createBankEntry(catalog, section, id, copyId) {
  ensureObjectCatalog(catalog);
  if (section === "objects") {
    applyCatalogAction(catalog, copyId ? "duplicate-type" : "add-type", ["system", "objectTypes", copyId].filter(Boolean), id);
  } else if (section === "icons") {
    assertNew(catalog.system.icons, id);
    const source = copyId ? catalog.system.icons[copyId] : { src: "./icons/endpoint-a.svg" };
    catalog.system.icons[id] = { ...structuredClone(source), label: copyId ? `${source.label} — копия`.slice(0, 160) : "Новая иконка" };
    catalog.system.pointIcons.push(id);
  } else if (section === "sets") {
    assertNew(catalog.system.equipmentSets, id);
    const source = copyId ? catalog.system.equipmentSets[copyId] : { label: "Новый набор", inventory: {} };
    catalog.system.equipmentSets[id] = structuredClone(source);
    if (copyId) catalog.system.equipmentSets[id].label = `${source.label} — копия`.slice(0, 160);
  } else throw new Error("Неизвестный раздел банка");
}
export function removeBankEntry(catalog, section, id) {
  if (section === "objects") {
    const icon = catalog.system.objectTypes[id]?.icon;
    applyCatalogAction(catalog, "delete-type", ["system", "objectTypes", id]);
    if (icon && !catalog.system.pointIcons.includes(icon) && !iconUsers(catalog, icon).length) delete catalog.system.icons[icon];
  }
  else if (section === "icons") {
    const users = iconUsers(catalog, id);
    if (users.length) throw new Error(`Иконка используется: ${users.map((u) => u.label).join(", ")}`);
    catalog.system.pointIcons = catalog.system.pointIcons.filter((key) => key !== id);
    delete catalog.system.icons[id];
  } else if (section === "sets") {
    const users = equipmentSetUsers(catalog, id);
    if (users.length) throw new Error(`Набор используется в миссиях: ${users.map((m) => m.name).join(", ")}`);
    delete catalog.system.equipmentSets[id];
  }
}
export function setBankSvg(catalog, section, id, input) {
  const svg = validateIconSvg(input);
  if (section === "icons") {
    if (!catalog.system.pointIcons.includes(id)) throw new Error("Иконка удалена во время импорта");
    catalog.system.icons[id] = { label: catalog.system.icons[id].label, svg };
  } else if (section === "objects") {
    const type = catalog.system.objectTypes[id];
    if (!type) throw new Error("Объект удалён во время импорта");
    const old = type.icon;
    // Private object artwork can be replaced without changing fixed-point icons
    // or other objects that happened to use the same previous SVG.
    const privateAsset = !catalog.system.pointIcons.includes(old) && iconUsers(catalog, old).length === 1;
    const key = privateAsset ? old : uniqueId(catalog.system.icons, `object-${id}`);
    catalog.system.icons[key] = { label: type.short, svg };
    type.icon = key;
  }
}
export function setEquipmentCount(catalog, setId, type, count) {
  if (!Object.hasOwn(catalog.system.objectTypes, type) || !Number.isInteger(count) || count < 0) throw new Error("Количество должно быть целым числом >= 0");
  const inventory = catalog.system.equipmentSets[setId].inventory;
  if (count) inventory[type] = count; else delete inventory[type];
}
export function commonEquipmentSettings(catalog) {
  const ids = Object.keys(catalog.system.objectTypes || {});
  const resolved = settingsDefaults(catalog.system.objectTypes);
  const common = (key) => {
    const values = ids.map((id) => catalog.system.objectSettings?.[id]?.[key] ?? resolved[id]?.[key]);
    return values.length && values.every((value) => value === values[0]) ? values[0] : "";
  };
  return { size: common("size"), signalRadius: common("signalRadius") };
}
export function applyEquipmentDefaults(catalog, values) {
  ensureObjectCatalog(catalog);
  const updates = Object.fromEntries(Object.entries(values || {}).filter(([, value]) => value !== "" && value !== undefined));
  if (!Object.keys(updates).length) throw new Error("Введите размер маркера или радиус сигнала");
  for (const [key, value] of Object.entries(updates)) {
    if (!["size", "signalRadius"].includes(key) || typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new Error("Общие размер и радиус должны быть числами больше нуля");
  }
  const defaults = settingsDefaults(catalog.system.objectTypes);
  for (const [id, type] of Object.entries(catalog.system.objectTypes)) {
    const settings = catalog.system.objectSettings[id] ||= { ...defaults[id] };
    if (updates.size !== undefined) settings.size = updates.size;
    if (updates.signalRadius !== undefined) {
      settings.signalRadius = updates.signalRadius;
      if (type.behavior === "orbital") {
        settings.radiusAtMinAltitude = updates.signalRadius;
        settings.radiusAtMaxAltitude = updates.signalRadius;
      }
    }
  }
}
