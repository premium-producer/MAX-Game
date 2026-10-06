// Shared by the browser and the write server. No executable/remote asset references.
export const SAFE_CATALOG_ID = /^(?!(?:__proto__|constructor|prototype)$)[a-zA-Z0-9_-]+$/;
export const DEFAULT_ICONS = Object.freeze(Object.fromEntries([
  ["terminal", "Терминал", "terminal"], ["satellite", "Спутник", "sputnik"],
  ["gateway", "Шлюз", "station"], ["core", "Центр обработки данных", "core"],
  ["internet", "Интернет", "internet"], ["point-a", "Буква A", "endpoint-a"], ["point-b", "Буква Б", "endpoint-b"],
].map(([id, label, file]) => [id, Object.freeze({ label, src: `./icons/${file}.svg` })])));
export const DEFAULT_OBJECT_TYPES = Object.freeze(Object.fromEntries([
  ["terminal", "абонентский терминал", "ТЕРМИНАЛ", "ground"],
  ["satellite", "космический аппарат", "СПУТНИК", "orbital"],
  ["gateway", "шлюзовая станция", "ШЛЮЗ", "ground"],
  ["core", "центр обработки данных", "ЦОД", "ground"],
  ["internet", "интернет", "ИНТЕРНЕТ", "ground"],
].map(([id, label, short, behavior]) => [id, Object.freeze({ label, short, icon: id, behavior })])));
const fail = (message) => { throw new Error(message); };
const record = (value) => value && typeof value === "object" && !Array.isArray(value);
const text = (value, name) => typeof value === "string" && value.trim() && value.length <= 160 ? value : fail(`${name}: нужен текст (1–160 символов)`);

// A deliberately small vector-only SVG dialect. Reject unsupported features rather
// than displaying a different picture in <img> and SVGLoader/WebGL.
export function validateIconSvg(input) {
  if (typeof input !== "string" || input.length > 131072) fail("SVG: размер не больше 128 КБ");
  const source = input.trim().replace(/^<\?xml[^?]*\?>\s*/i, "").replace(/<!--[\s\S]*?-->/g, "");
  const allowed = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon"]);
  const attrs = new Set(["xmlns", "viewBox", "width", "height", "id", "d", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "points", "transform", "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "opacity"]);
  const stack = []; let cursor = 0, shapes = 0, roots = 0;
  for (const match of source.matchAll(/<([^<>]+)>/g)) {
    if (source.slice(cursor, match.index).trim()) fail("SVG: текст нужно перевести в кривые");
    cursor = match.index + match[0].length;
    const token = match[1], closing = token.startsWith("/"), selfClosing = token.endsWith("/");
    const name = token.match(/^\/?([a-zA-Z][\w-]*)/)?.[1];
    if (!allowed.has(name)) fail(`SVG: элемент ${name || token} не поддерживается. Нужны контуры без текста, масок, фильтров и внешних ссылок`);
    if (closing) {
      if (token !== `/${name}` || stack.pop() !== name) fail("SVG: нарушена структура элементов");
      continue;
    }
    if (!stack.length && (name !== "svg" || ++roots !== 1)) fail("SVG: требуется один корневой svg");
    if (name === "svg" && stack.length) fail("SVG: вложенный svg не поддерживается");
    const body = token.slice(name.length, selfClosing ? -1 : undefined);
    const attrPattern = /\s+([\w:-]+)\s*=\s*(["'])([^<>]*?)\2/g;
    let end = 0; const seen = new Set();
    for (const a of body.matchAll(attrPattern)) {
      if (body.slice(end, a.index).trim() || !attrs.has(a[1]) || seen.has(a[1])) fail(`SVG: недопустимый атрибут ${a[1]}`);
      if (/[&\\]/.test(a[3]) || /url\s*\(|javascript:|data:/i.test(a[3])) fail("SVG: ссылки и сущности запрещены");
      if (a[1] === "xmlns" && a[3] !== "http://www.w3.org/2000/svg") fail("SVG: неверный xmlns");
      if (["opacity", "fill-opacity", "stroke-opacity"].includes(a[1]) && Number(a[3]) !== 1) fail("SVG: полупрозрачные контуры нужно свести к непрозрачной пиктограмме");
      seen.add(a[1]); end = a.index + a[0].length;
    }
    if (body.slice(end).trim()) fail("SVG: некорректные атрибуты");
    if (!["svg", "g"].includes(name)) shapes++;
    if (!selfClosing) stack.push(name);
  }
  if (stack.length || roots !== 1 || !shapes || source.slice(cursor).trim()) fail("SVG: нужен законченный документ с векторными контурами");
  // Icons are monochrome: normalize once so DOM and WebGL use the same silhouette.
  let normalized = source.replace(/\b(fill|stroke)\s*=\s*(["'])(.*?)\2/g, (_, key, quote, value) => `${key}=${quote}${value === "none" ? "none" : "#FFFFFF"}${quote}`);
  normalized = normalized.replace(/<svg\b([^>]*)>/, (tag, attributes) => {
    if (!/\bxmlns\s*=/.test(attributes)) tag = tag.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    if (!/\bfill\s*=/.test(attributes)) tag = tag.replace("<svg", '<svg fill="#FFFFFF"');
    return tag;
  });
  return normalized;
}

export function parseObjectCatalog(raw = {}) {
  const sourceIcons = raw.icons ?? DEFAULT_ICONS, sourceTypes = raw.objectTypes ?? DEFAULT_OBJECT_TYPES;
  if (!record(sourceIcons) || !record(sourceTypes) || !Object.keys(sourceTypes).length) fail("Нужны библиотека icons и непустой каталог objectTypes");
  const localSources = new Set(Object.values(DEFAULT_ICONS).map((icon) => icon.src));
  let total = 0;
  const icons = Object.fromEntries(Object.entries(sourceIcons).map(([id, icon]) => {
    if (!SAFE_CATALOG_ID.test(id) || !record(icon)) fail(`Некорректная иконка ${id}`);
    const label = text(icon.label, `Иконка ${id}`);
    if (icon.svg !== undefined) {
      if (icon.src !== undefined) fail(`Иконка ${id}: задайте svg или src, не оба`);
      const svg = validateIconSvg(icon.svg); total += svg.length;
      return [id, { label, svg }];
    }
    if (!localSources.has(icon.src)) fail(`Иконка ${id}: импортируйте SVG через редактор, внешние пути запрещены`);
    return [id, { label, src: icon.src }];
  }));
  if (total > 1048576) fail("Библиотека SVG: общий размер не больше 1 МБ");
  const objectTypes = Object.fromEntries(Object.entries(sourceTypes).map(([id, type]) => {
    if (!SAFE_CATALOG_ID.test(id) || !record(type)) fail(`Некорректный ID объекта ${id}`);
    if (!Object.hasOwn(icons, type.icon)) fail(`Объект ${id}: неизвестная иконка ${type.icon}`);
    if (!["ground", "orbital"].includes(type.behavior)) fail(`Объект ${id}: поведение ground или orbital`);
    const placementSurface = type.placementSurface ?? (type.behavior === "orbital" ? "any" : "land");
    if (!["land", "water", "any"].includes(placementSurface)) fail(`Объект ${id}: поверхность land, water или any`);
    return [id, { label: text(type.label, id), short: text(type.short, id), icon: type.icon, behavior: type.behavior, placementSurface }];
  }));
  const pointIcons = raw.pointIcons ?? ["point-a", "point-b"].filter((id) => Object.hasOwn(icons, id));
  if (!Array.isArray(pointIcons) || new Set(pointIcons).size !== pointIcons.length || pointIcons.some((id) => typeof id !== "string" || !Object.hasOwn(icons, id))) fail("pointIcons: нужны уникальные ID существующих SVG");
  const sourceSets = raw.equipmentSets ?? {};
  if (!record(sourceSets)) fail("equipmentSets: ожидается словарь наборов");
  const equipmentSets = Object.fromEntries(Object.entries(sourceSets).map(([id, set]) => {
    if (!SAFE_CATALOG_ID.test(id) || !record(set) || !record(set.inventory)) fail(`Некорректный набор ${id}`);
    const inventory = Object.fromEntries(Object.entries(set.inventory).map(([type, count]) => {
      if (!Object.hasOwn(objectTypes, type) || !Number.isInteger(count) || count < 0) fail(`Набор ${id}: ${type} — нужен тип банка и целое количество >= 0`);
      return [type, count];
    }));
    return [id, { label: text(set.label, `Набор ${id}`), inventory }];
  }));
  return { icons, objectTypes, pointIcons: [...pointIcons], equipmentSets };
}
export function iconSource(icon) { return icon?.svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon.svg)}` : icon?.src || ""; }
export function runtimeObjectTypes(system = {}) {
  const { icons, objectTypes } = parseObjectCatalog(system || {});
  return Object.fromEntries(Object.entries(objectTypes).map(([id, type]) => [id, { ...type, iconId: type.icon, icon: iconSource(icons[type.icon]) }]));
}
