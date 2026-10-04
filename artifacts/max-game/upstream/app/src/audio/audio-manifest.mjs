const BUS_IDS = Object.freeze(["master", "music", "ui", "gameplay", "signal"]);
const EVENT_BUSES = new Set(BUS_IDS.slice(1));
const SCREENS = new Set(["CTA", "ONBOARDING", "MISSION_SELECT", "MISSION_PLAY", "END"]);
const PRELOAD_GROUPS = new Set(["boot", "onboarding", "mission-select", "mission-play", "end"]);
const KINDS = new Set(["one-shot", "loop"]);
const INSTANCE_POLICIES = new Set(["single-global", "one-global-layer-for-color", "restart-single-voice", "allow-tail-across-transition"]);

export async function loadAudioManifest(source = "./config/audio.json", fetchImpl = fetch) {
  const response = await fetchImpl(source, { cache: "no-store" });
  if (!response.ok) throw new Error(`audio.json: HTTP ${response.status}`);
  return validateAudioManifest(await response.json());
}

export function validateAudioManifest(raw) {
  if (!raw || raw.schemaVersion !== 1) throw new Error("audio.json: ожидается schemaVersion=1");
  if (!raw.settings || typeof raw.settings !== "object" || Array.isArray(raw.settings)) throw new Error("audio.json: settings должен быть объектом");
  for (const key of ["loopFadeMs", "stopFadeMs", "maxLateStartMs"]) assertFiniteNumber(raw.settings[key], `settings.${key}`, 0);
  if (typeof raw.settings.storageKey !== "string" || !raw.settings.storageKey.trim()) throw new Error("audio.json: settings.storageKey не заполнен");
  if (!raw.buses || typeof raw.buses !== "object" || Array.isArray(raw.buses)) throw new Error("audio.json: buses должен быть объектом");
  for (const bus of Object.keys(raw.buses)) if (!BUS_IDS.includes(bus)) throw new Error(`audio.json: неизвестный bus ${bus}`);
  for (const bus of BUS_IDS) {
    if (!raw.buses[bus]) throw new Error(`audio.json: отсутствует bus ${bus}`);
    assertFiniteNumber(raw.buses[bus].gain, `buses.${bus}.gain`, 0, 1);
  }

  const assets = validateUniqueList(raw.assets, "asset", (asset) => {
    if (!/^[a-z0-9-]+$/.test(asset.id || "")) throw new Error(`audio.json: некорректный asset id ${asset.id}`);
    if (typeof asset.url !== "string" || !/^\.\/audio\/[a-z0-9-]+\.(?:wav|webm|ogg)$/.test(asset.url) || !isAscii(asset.url)) {
      throw new Error(`audio.json: asset ${asset.id} должен иметь переносимый относительный audio URL`);
    }
    if (!PRELOAD_GROUPS.has(asset.preloadGroup)) throw new Error(`audio.json: неизвестная preloadGroup ${asset.preloadGroup}`);
  });
  const assetIds = new Set(assets.map((asset) => asset.id));

  const events = validateUniqueList(raw.events, "event", (event) => {
    if (!/^[a-z0-9_.-]+$/.test(event.id || "")) throw new Error(`audio.json: некорректный event id ${event.id}`);
    if (!KINDS.has(event.kind)) throw new Error(`audio.json: неизвестный kind ${event.kind}`);
    if (!EVENT_BUSES.has(event.bus)) throw new Error(`audio.json: неизвестный event bus ${event.bus}`);
    if (!Array.isArray(event.assets) || !event.assets.length) throw new Error(`audio.json: ${event.id}.assets не заполнен`);
    for (const assetId of event.assets) if (!assetIds.has(assetId)) throw new Error(`audio.json: ${event.id} ссылается на неизвестный asset ${assetId}`);
    if (!Array.isArray(event.screens) || !event.screens.length || event.screens.some((screen) => !SCREENS.has(screen))) throw new Error(`audio.json: ${event.id}.screens некорректен`);
    if (!INSTANCE_POLICIES.has(event.instancePolicy)) throw new Error(`audio.json: неизвестная instancePolicy ${event.instancePolicy}`);
    assertFiniteNumber(event.gain ?? 1, `events.${event.id}.gain`, 0, 1);
    assertFiniteNumber(event.cooldownMs ?? 0, `events.${event.id}.cooldownMs`, 0);
    assertFiniteNumber(event.blockOneShotsMs ?? 0, `events.${event.id}.blockOneShotsMs`, 0);
    if (event.exclusive !== undefined && typeof event.exclusive !== "boolean") throw new Error(`audio.json: events.${event.id}.exclusive должен быть boolean`);
    if (event.lateStartPolicy !== undefined && !["play", "drop"].includes(event.lateStartPolicy)) throw new Error(`audio.json: events.${event.id}.lateStartPolicy некорректен`);
    if ((event.exclusive || event.blockOneShotsMs > 0) && event.kind !== "one-shot") throw new Error(`audio.json: exclusive допустим только для one-shot`);
    if (event.maxInstances !== undefined && (!Number.isInteger(event.maxInstances) || event.maxInstances < 1)) throw new Error(`audio.json: events.${event.id}.maxInstances должен быть целым числом больше нуля`);
    if (event.kind === "loop" && event.assets.length !== 1) throw new Error(`audio.json: loop ${event.id} должен иметь ровно один asset`);
  });

  const assetById = new Map(assets.map((asset) => [asset.id, Object.freeze({ ...asset })]));
  const eventById = new Map(events.map((event) => [event.id, Object.freeze({ gain: 1, cooldownMs: 0, maxInstances: 1, lateStartPolicy: "play", ...event, exclusive: event.exclusive ?? event.blockOneShotsMs > 0, assets: Object.freeze([...event.assets]), screens: Object.freeze([...event.screens]) })]));
  return Object.freeze({
    schemaVersion: 1,
    settings: Object.freeze({ ...raw.settings }),
    buses: Object.freeze(Object.fromEntries(BUS_IDS.map((bus) => [bus, Object.freeze({ ...raw.buses[bus] })]))),
    assets: Object.freeze([...assetById.values()]),
    events: Object.freeze([...eventById.values()]),
    assetById,
    eventById,
  });
}

function validateUniqueList(value, label, validate) {
  if (!Array.isArray(value) || !value.length) throw new Error(`audio.json: ${label}s должен быть непустым массивом`);
  const ids = new Set();
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`audio.json: ${label} должен быть объектом`);
    validate(item);
    if (ids.has(item.id)) throw new Error(`audio.json: повторяется ${label} id ${item.id}`);
    ids.add(item.id);
  }
  return value;
}

function assertFiniteNumber(value, path, min, max = Infinity) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error(`audio.json: ${path} вне диапазона ${min}..${max}`);
}

function isAscii(value) {
  return /^[\x20-\x7e]+$/.test(value);
}

export { BUS_IDS, PRELOAD_GROUPS, SCREENS };
