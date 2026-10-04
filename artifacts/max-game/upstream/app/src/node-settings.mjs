export let SATELLITE_DEFAULT_ALTITUDE = 0.72;
export let SATELLITE_MIN_ALTITUDE = 0.34;
export let SATELLITE_MAX_ALTITUDE = 1.4;
export function configureSatelliteBounds(settings) {
  SATELLITE_MIN_ALTITUDE = settings.minAltitude ?? 0.34;
  SATELLITE_MAX_ALTITUDE = settings.maxAltitude ?? 1.4;
  SATELLITE_DEFAULT_ALTITUDE = settings.defaultAltitude ?? 0.72;
}

export const DEFAULT_OBJECT_SETTINGS = Object.freeze(Object.fromEntries(Object.entries({
  terminal: { size: 1, signalRadius: 0.46 },
  satellite: { size: 1, signalRadius: 0.78, radiusAtMinAltitude: 0.78, radiusAtMaxAltitude: 0.78, minAltitude: 0.34, maxAltitude: 1.4, defaultAltitude: 0.72 },
  gateway: { size: 1, signalRadius: 0.62 },
  core: { size: 1, signalRadius: 0.56 },
  internet: { size: 1, signalRadius: 0.5 },
  "endpoint:A": { size: 1, signalRadius: 6.5 },
  "endpoint:B": { size: 1, signalRadius: 6.5 },
}).map(([type, settings]) => [type, Object.freeze(settings)])));

export function settingsDefaults(objectTypes) {
  if (!objectTypes) return DEFAULT_OBJECT_SETTINGS;
  return Object.fromEntries([...Object.entries(objectTypes).map(([id, type]) => [id,
    { ...(type.behavior === "orbital" ? DEFAULT_OBJECT_SETTINGS.satellite : DEFAULT_OBJECT_SETTINGS.terminal),
      ...(id !== "satellite" && type.behavior === "ground" ? { signalRadius: DEFAULT_OBJECT_SETTINGS[id]?.signalRadius ?? 0.46 } : {}) }]),
    ["endpoint:A", DEFAULT_OBJECT_SETTINGS["endpoint:A"]], ["endpoint:B", DEFAULT_OBJECT_SETTINGS["endpoint:B"]]]);
}
export function parseObjectSettings(source = {}, objectTypes) {
  const defaultsByType = settingsDefaults(objectTypes);
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("objectSettings: ожидается объект");
  for (const type of Object.keys(source)) if (!Object.hasOwn(defaultsByType, type)) throw new Error(`objectSettings: неизвестный тип ${type}`);
  return Object.fromEntries(Object.entries(defaultsByType).map(([type, defaults]) => {
    const entry = source[type] === undefined ? {} : source[type];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error(`objectSettings.${type}: ожидается объект`);
    for (const [key, value] of Object.entries(entry)) {
      if (!Object.hasOwn(defaults, key)) throw new Error(`objectSettings.${type}: неизвестное поле ${key}`);
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new Error(`objectSettings.${type}.${key}: ожидается число больше нуля`);
    }
    const settings = { ...defaults, ...entry };
    if ("minAltitude" in defaults) {
      settings.radiusAtMinAltitude = entry.radiusAtMinAltitude ?? settings.signalRadius;
      settings.radiusAtMaxAltitude = entry.radiusAtMaxAltitude ?? settings.signalRadius;
      if (settings.minAltitude >= settings.maxAltitude || settings.defaultAltitude < settings.minAltitude || settings.defaultAltitude > settings.maxAltitude) throw new Error("Высота спутника: min < max и min <= default <= max");
    }
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new Error(`objectSettings.${type}.${key}: ожидается число больше нуля`);
    }
    return [type, settings];
  }));
}

export function resolveSignalRadius(placement, settings = DEFAULT_OBJECT_SETTINGS, type = placement.type) {
  const entry = settings[type];
  if (!entry) return 0;
  if (!("minAltitude" in entry)) return entry.signalRadius;
  const altitude = Number.isFinite(placement.altitude) ? placement.altitude : (entry.defaultAltitude ?? SATELLITE_DEFAULT_ALTITUDE);
  const min = entry.minAltitude ?? SATELLITE_MIN_ALTITUDE, max = entry.maxAltitude ?? SATELLITE_MAX_ALTITUDE;
  const t = Math.min(1, Math.max(0, (altitude - min) / (max - min)));
  return entry.radiusAtMinAltitude + (entry.radiusAtMaxAltitude - entry.radiusAtMinAltitude) * t;
}
