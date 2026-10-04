import { serializeMissionCatalog } from "./mission-config.mjs";
import { migrateMission } from "./mission-system.mjs";
import { DEFAULT_OBJECT_TYPES } from "./object-catalog.mjs";

export const EDITOR_HISTORY_LIMIT = 100;

export function toEditableCatalog(catalog) {
  if (catalog.schemaVersion === 2) return { ...serializeMissionCatalog(catalog), missions: structuredClone(catalog.missions) };
  return {
    $schema: "./missions.schema.json",
    schemaVersion: 1,
    missions: structuredClone(catalog.missions || []),
    objectSettings: structuredClone(catalog.objectSettings),
  };
}

export function createMissionTemplate(catalog, source = null) {
  const missions = catalog.missions || [];
  const number = missions.length + 1;
  const base = source ? structuredClone(source) : {
    name: "НОВАЯ МИССИЯ",
    description: "Описание игровой задачи.",
    timeSeconds: 120,
    mapPosition: { latitude: 55.75, longitude: 80 },
    endpoints: {
      A: { label: "", icon: "point-a", roles: ["start"], latitude: 55.75, longitude: 37.62 },
      B: { label: "", icon: "point-b", roles: ["finish"], latitude: 58, longitude: 120 },
    },
    connectEndpointsOnComplete: false,
    route: ["terminal", "satellite", "gateway", "core", "internet"],
    objectives: [
      { id: "place-terminal", label: "размести терминал", condition: { type: "placed", object: "terminal", count: 1 } },
      { id: "finish-network", label: "собери связанную сеть", condition: { type: "networkConnected" } },
    ],
    successText: "МАРШРУТ РАБОТАЕТ",
    unlock: { requiresCompleted: number > 1 ? [number - 1] : [] },
  };
  base.number = number;
  base.id = uniqueId(slugify(source ? `${source.id}-copy` : base.name), missions.map((mission) => mission.id));
  if (source) {
    base.name = `${source.name} — КОПИЯ`;
    base.mapPosition.longitude = clampLongitude(base.mapPosition.longitude + 4);
    base.unlock = { requiresCompleted: number > 1 ? [number - 1] : [] };
  }
  if (catalog.schemaVersion === 2) {
    if (!source) {
      const types = Object.keys(catalog.system.objectTypes || DEFAULT_OBJECT_TYPES);
      const pointIcons = catalog.system.pointIcons || [];
      if (!pointIcons.length) throw new Error("Сначала добавьте хотя бы одну иконку в банк точек");
      base.endpoints.A.icon = pointIcons[0];
      base.endpoints.B.icon = pointIcons[1] || pointIcons[0];
      base.route = types.slice(0, 5);
      base.objectives = [{ id: "finish-network", label: "собери связанную сеть", condition: { type: "allPaths" } }];
    }
    const migrated = migrateMission(base);
    if (!source) migrated.inventory = Object.fromEntries(base.route.map((type) => [type, 1]));
    if (!source) migrated.feedback = structuredClone(catalog.system.feedback);
    return migrated;
  }
  return base;
}

export function appendMission(catalog, source = null) {
  const mission = createMissionTemplate(catalog, source);
  return { catalog: { ...catalog, missions: [...catalog.missions, mission] }, mission };
}

export function deleteMission(catalog, missionId) {
  const kept = catalog.missions.filter((mission) => mission.id !== missionId);
  return reorderAndRenumber({ ...catalog, missions: kept }, kept.map((mission) => mission.id));
}

export function reorderMissions(catalog, fromIndex, toIndex) {
  const missions = moveArrayItem(catalog.missions, fromIndex, toIndex);
  return reorderAndRenumber({ ...catalog, missions }, missions.map((mission) => mission.id));
}

function reorderAndRenumber(catalog, orderedIds) {
  const oldNumbers = new Map(catalog.missions.map((mission) => [mission.id, mission.number]));
  const newNumbersByOld = new Map();
  orderedIds.forEach((id, index) => newNumbersByOld.set(oldNumbers.get(id), index + 1));
  const missions = orderedIds.map((id, index) => {
    const mission = catalog.missions.find((entry) => entry.id === id);
    return {
      ...mission,
      number: index + 1,
      unlock: {
        requiresCompleted: mission.unlock.requiresCompleted
          .filter((number) => newNumbersByOld.has(number))
          .map((number) => newNumbersByOld.get(number))
          .filter((number) => number !== index + 1),
      },
    };
  });
  return { ...catalog, missions };
}

export function moveArrayItem(items, fromIndex, toIndex) {
  const next = [...items];
  if (fromIndex < 0 || fromIndex >= next.length || toIndex < 0 || toIndex >= next.length || fromIndex === toIndex) return next;
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function routeCounts(route) {
  return route.reduce((counts, type) => ({ ...counts, [type]: (counts[type] || 0) + 1 }), {});
}

export function serializableCatalog(catalog) {
  return serializeMissionCatalog(catalog);
}

export function createHistory(initialCatalog) {
  return { past: [], present: structuredClone(initialCatalog), future: [] };
}

export function commitHistory(history, nextCatalog) {
  if (JSON.stringify(history.present) === JSON.stringify(nextCatalog)) return history;
  return {
    past: [...history.past.slice(-(EDITOR_HISTORY_LIMIT - 1)), structuredClone(history.present)],
    present: structuredClone(nextCatalog),
    future: [],
  };
}

export function undoHistory(history) {
  if (!history.past.length) return history;
  return {
    past: history.past.slice(0, -1),
    present: structuredClone(history.past.at(-1)),
    future: [structuredClone(history.present), ...history.future],
  };
}

export function redoHistory(history) {
  if (!history.future.length) return history;
  return {
    past: [...history.past, structuredClone(history.present)],
    present: structuredClone(history.future[0]),
    future: history.future.slice(1),
  };
}

export function slugify(value) {
  return String(value || "mission")
    .toLowerCase()
    .replace(/[а-яё]/g, (letter) => ({ а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" }[letter]))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "mission";
}

function uniqueId(seed, ids) {
  const used = new Set(ids);
  let candidate = seed;
  let suffix = 2;
  while (used.has(candidate)) candidate = `${seed}-${suffix++}`;
  return candidate;
}

function clampLongitude(value) {
  return ((Number(value) + 180) % 360 + 360) % 360 - 180;
}
