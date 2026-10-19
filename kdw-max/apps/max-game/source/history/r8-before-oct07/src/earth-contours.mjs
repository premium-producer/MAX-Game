export const EARTH_CONTOURS_URL = "./config/earth-contours.json";
export const DEFAULT_CONTOUR_ID = "classic";
export const CONTOUR_ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const ASSET_PATH = /^\.\/earth\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.svg$/;

export function parseEarthContours(raw) {
  if (raw?.schemaVersion !== 1 || !Array.isArray(raw.variants) || !raw.variants.length) throw new Error("Некорректный каталог контуров Земли");
  const ids = new Set();
  const variants = raw.variants.map((entry) => {
    if (typeof entry?.id !== "string" || !CONTOUR_ID_PATTERN.test(entry.id) || ids.has(entry.id)) throw new Error("Нужен уникальный ID контура");
    if (typeof entry.label !== "string" || !entry.label.trim() || entry.label.length > 100) throw new Error("Нужно название контура");
    if (!ASSET_PATH.test(entry.border) || !ASSET_PATH.test(entry.fill) || entry.border === entry.fill) throw new Error("Нужны отдельные локальные SVG контура и заливки");
    ids.add(entry.id);
    return Object.freeze({ id: entry.id, label: entry.label.trim(), border: entry.border, fill: entry.fill });
  });
  if (!ids.has(DEFAULT_CONTOUR_ID)) throw new Error("В каталоге должен оставаться исходный контур classic");
  return Object.freeze({ schemaVersion: 1, variants: Object.freeze(variants) });
}

export const DEFAULT_EARTH_CONTOURS = parseEarthContours({ schemaVersion: 1, variants: [
  { id: DEFAULT_CONTOUR_ID, label: "Исходный", border: "./earth/Russia_Border_Mask_6K.svg", fill: "./earth/Russia_Fill_Mask_6K.svg" },
] });

export function earthContourById(catalog, id = DEFAULT_CONTOUR_ID) {
  const variant = catalog.variants.find((entry) => entry.id === id);
  if (!variant) throw new Error(`Контур «${id}» не найден. Выбери загруженный вариант.`);
  return variant;
}

export async function loadEarthContours(fetchImpl = fetch) {
  const response = await fetchImpl(EARTH_CONTOURS_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Каталог контуров: HTTP ${response.status}`);
  return parseEarthContours(await response.json());
}

// Keep only the active pair resident. A late load cannot replace a newer
// selection. Old resources are disposed only after an atomic successful apply.
export function createContourSwitcher({ initial, load, apply, release }) {
  let active = initial, requested = initial.id, pending = null, version = 0, disposed = false;
  return {
    get activeId() { return active.id; },
    select(id) {
      if (disposed) return Promise.reject(new Error("Contour switcher disposed"));
      if (id === requested && pending) return pending;
      requested = id;
      const token = ++version;
      if (id === active.id) { pending = null; return Promise.resolve(true); }
      pending = Promise.resolve().then(() => load(id)).then((resource) => {
        if (disposed || token !== version) { release(resource); return false; }
        try { apply(resource); } catch (error) { release(resource); throw error; }
        const old = active;
        active = { id, resource };
        release(old.resource);
        return true;
      }).finally(() => { if (token === version) pending = null; });
      return pending;
    },
    dispose() {
      if (disposed) return;
      disposed = true; version++;
      release(active.resource);
    },
  };
}
