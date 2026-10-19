import { formatTypography, inferTypographyProfile, lintWording } from "./typography.mjs";

const SUPPORTED_LANGUAGES = Object.freeze(["ru", "en"]);
const STORAGE_KEY = "max-space-language";

export async function loadWording(source = "./config/wording.json", fetchImpl = fetch) {
  const response = await fetchImpl(source, { cache: "no-store" });
  if (!response.ok) throw new Error(`wording.json: HTTP ${response.status}`);
  return parseWording(await response.json());
}

export function parseWording(raw) {
  if (!raw || raw.schemaVersion !== 1 || raw.defaultLanguage !== "ru" || !Array.isArray(raw.languages)) {
    throw new Error("wording.json: ожидается schemaVersion=1 и defaultLanguage=ru");
  }
  if (raw.languages.length !== SUPPORTED_LANGUAGES.length || SUPPORTED_LANGUAGES.some((language) => !raw.languages.includes(language))) {
    throw new Error("wording.json: обязательны языки ru и en");
  }
  if (!raw.entries || typeof raw.entries !== "object" || Array.isArray(raw.entries)) throw new Error("wording.json: entries должен быть объектом");
  const diagnostics = lintWording(raw);
  if (diagnostics.errors.length) {
    const issue = diagnostics.errors[0];
    throw new Error(`wording.json: ${issue.location}: ${issue.message} [${issue.code}]`);
  }
  const entries = {};
  for (const [key, translations] of Object.entries(raw.entries)) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(key) || !translations || typeof translations !== "object" || Array.isArray(translations)) {
      throw new Error(`wording.json: некорректный ключ ${key}`);
    }
    for (const language of SUPPORTED_LANGUAGES) {
      if (typeof translations[language] !== "string" || !translations[language].trim()) throw new Error(`wording.json: ${key}.${language} не заполнен`);
    }
    const placeholders = (value) => [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort().join("|");
    if (placeholders(translations.ru) !== placeholders(translations.en)) throw new Error(`wording.json: плейсхолдеры ru/en не совпадают у ${key}`);
    entries[key] = Object.freeze({ ru: translations.ru, en: translations.en });
  }
  return Object.freeze({ schemaVersion: 1, defaultLanguage: raw.defaultLanguage, languages: SUPPORTED_LANGUAGES, entries: Object.freeze(entries), diagnostics: Object.freeze(diagnostics) });
}

export function storedLanguage(wording, storage, search = globalThis.location?.search ?? "") {
  const requested = new URLSearchParams(search).get("lang");
  if (wording.languages.includes(requested)) return requested;
  try {
    const saved = (storage ?? globalThis.localStorage)?.getItem(STORAGE_KEY);
    if (wording.languages.includes(saved)) return saved;
  } catch (_) { /* Storage is optional; use the configured default. */ }
  return wording.defaultLanguage;
}

export function persistLanguage(language, storage = globalThis.localStorage) {
  try { storage?.setItem(STORAGE_KEY, language); } catch (_) { /* Keep the in-memory language. */ }
}

export function createTranslator(wording, language) {
  if (!wording.languages.includes(language)) throw new Error(`wording.json: неизвестный язык ${language}`);
  return (key, variables = {}, options = {}) => {
    const template = wording.entries[key]?.[language];
    if (template === undefined) throw new Error(`wording.json: отсутствует фраза ${key}.${language}`);
    const interpolated = template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => String(variables[name] ?? `{${name}}`));
    return formatTypography(interpolated, language, options.typography || inferTypographyProfile(key));
  };
}

export function localizeMissionCatalog(catalog, translate) {
  const localized = structuredClone(catalog);
  const optional = (key, fallback) => {
    try { return translate(key); } catch (_) { return fallback; }
  };
  if (localized.system) {
    for (const [id, icon] of Object.entries(localized.system.icons || {})) icon.label = optional(`content.icons.${id}`, icon.label);
    for (const [id, type] of Object.entries(localized.system.objectTypes || {})) {
      type.label = optional(`content.objects.${id}.label`, type.label);
      type.short = optional(`content.objects.${id}.short`, type.short);
    }
    for (const [id, set] of Object.entries(localized.system.equipmentSets || {})) set.label = optional(`content.equipmentSets.${id}`, set.label);
  }
  for (const mission of localized.missions) {
    const root = `content.missions.${mission.id}`;
    mission.name = optional(`${root}.name`, mission.name);
    mission.description = optional(`${root}.description`, mission.description);
    mission.successText = optional(`${root}.success`, mission.successText);
    mission.level = optional(`${root}.level`, mission.level || "");
    mission.summary = optional(`${root}.summary`, mission.summary || "");
    for (const objective of mission.objectives) objective.label = optional(`${root}.objectives.${objective.id}`, objective.label);
    for (const [kind, events] of Object.entries(mission.feedbackEvents || {})) for (const event of events) {
      const eventRoot = `${root}.feedback.${kind}.${event.id}`;
      event.eyebrow = optional(`${eventRoot}.eyebrow`, event.eyebrow);
      event.title = optional(`${eventRoot}.title`, event.title);
      event.message = optional(`${eventRoot}.message`, event.message);
    }
  }
  localized.byNumber = Object.fromEntries(localized.missions.map((mission) => [mission.number, mission]));
  return localized;
}

export { STORAGE_KEY as LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES };
