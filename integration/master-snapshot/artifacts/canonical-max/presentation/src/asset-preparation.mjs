import { DEFAULT_ICONS, iconSource } from "./object-catalog.mjs";
import { DEFAULT_EARTH_CONTOURS, earthContourById } from "./earth-contours.mjs";

export const EARTH_TEXTURES = Object.freeze([
  "./earth/Earth_Diffuse_4K.jpg", "./earth/Earth_Illumination_Core_4K.webp",
  "./earth/Earth_Specular_4K.webp", "./earth/Earth_Normal_4K.webp",
  "./earth/Earth_Clouds_4K.webp", "./earth/Russia_Fill_Mask_6K.svg",
]);
export const EARTH_BORDER = "./earth/Russia_Border_Mask_6K.svg";
export const UI_IMAGES = Object.freeze([
  "./brand/assets/logos/max-mono-white.svg",
]);
export const GAME_FONTS = Object.freeze(['400 24px "Max Sans"', '500 24px "Max Sans"', '600 24px "Max Sans"']);

export function collectAssetSources(catalog, itemTypes, contours = DEFAULT_EARTH_CONTOURS, contourId, planar = false) {
  const contour = earthContourById(contours, contourId);
  const icons = [...new Set([
    ...(planar ? [] : Object.values(DEFAULT_ICONS).map(iconSource)),
    ...Object.values(catalog.system?.icons || {}).map(iconSource),
    ...Object.values(itemTypes).map((item) => item.icon),
  ].filter(Boolean))];
  if (planar) return {icons,contours,vectorSources:[],images:[...new Set([...UI_IMAGES,...icons])]};
  return { icons, contours, vectorSources: [contour.border], images: [...new Set([...UI_IMAGES, ...icons, ...EARTH_TEXTURES.slice(0, 5), contour.fill, contour.border])] };
}

export async function withTimeout(operation, milliseconds = 60000, label = "Resource") {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      new Promise((_, reject) => { timer = setTimeout(() => {
        controller.abort(); reject(new Error(`${label}: timeout`));
      }, milliseconds); }),
    ]);
  } finally { clearTimeout(timer); }
}

// Stop scheduling new work after a failure, but drain active workers before cleanup.
export async function prepareTasks(tasks, onProgress = () => {}, concurrency = 4) {
  let cursor = 0, completed = 0, failure;
  const results = new Array(tasks.length);
  onProgress(0, tasks.length);
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (!failure && cursor < tasks.length) {
      const index = cursor++;
      try {
        results[index] = await tasks[index]();
        onProgress(++completed, tasks.length);
      } catch (error) { failure ||= error; }
    }
  }));
  if (failure) throw failure;
  return results;
}

export class PreparedAssets {
  constructor() { this.entries = new Map(); this.icons = []; this.disposed = false; }
  async load(sources, onProgress, { fetchImpl = fetch, imageFactory = () => new Image() } = {}) {
    this.icons = sources.icons;
    this.contours = sources.contours;
    await prepareTasks(sources.images.map((source) => () => withTimeout(async (signal) => {
      const response = await fetchImpl(source, { signal, cache: "no-cache" });
      if (!response.ok) throw new Error(`${source}: HTTP ${response.status}`);
      const blob = await response.blob();
      if (signal.aborted || this.disposed) throw new Error("Asset preparation cancelled");
      // The border is parsed as vector geometry; rasterizing another 6000×3000 image wastes memory.
      if ((sources.vectorSources || [EARTH_BORDER]).includes(source)) {
        this.entries.set(source, { url: null, image: null, text: await blob.text() });
        return;
      }
      const url = URL.createObjectURL(blob);
      const image = imageFactory();
      const entry = { url, image, text: null };
      this.entries.set(source, entry);
      image.decoding = "async";
      image.src = url;
      await image.decode();
      if (source.includes(".svg") || source.startsWith("data:image/svg+xml")) entry.text = await blob.text();
    }, 60000, source)), onProgress);
    return this;
  }
  get(source) {
    const entry = this.entries.get(source);
    if (!entry) throw new Error(`Asset was not prepared: ${source}`);
    return entry;
  }
  url(source) { return this.get(source).url; }
  dispose() {
    this.disposed = true;
    for (const entry of this.entries.values()) { if (entry.image) entry.image.src = ""; if (entry.url) URL.revokeObjectURL(entry.url); }
    this.entries.clear();
  }
}

export async function prepareFonts(fontSet, onProgress) {
  await prepareTasks(GAME_FONTS.map((font) => () => withTimeout(async () => {
    const faces = await fontSet.load(font, "Связь Satellite 0123456789");
    if (!faces.length) throw new Error(`Font unavailable: ${font}`);
  }, 60000, font)), onProgress, 2);
}

export function yieldToBrowser() { return new Promise((resolve) => setTimeout(resolve, 0)); }
