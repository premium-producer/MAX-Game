// Stable wording keys and the authored fields they represent. No gameplay conditions change here.
export function contentFields(catalog) {
  const fields = [];
  const add = (key, owner, field) => fields.push({ key, owner, field });
  if (catalog.system) {
    for (const [id, icon] of Object.entries(catalog.system.icons || {})) add(`content.icons.${id}`, icon, "label");
    for (const [id, type] of Object.entries(catalog.system.objectTypes || {})) {
      add(`content.objects.${id}.label`, type, "label");
      add(`content.objects.${id}.short`, type, "short");
    }
    for (const [id, set] of Object.entries(catalog.system.equipmentSets || {})) add(`content.equipmentSets.${id}`, set, "label");
  }
  for (const mission of catalog.missions) {
    const root = `content.missions.${mission.id}`;
    for (const [field, suffix] of [["name", "name"], ["description", "description"], ["successText", "success"], ["summary", "summary"], ["level", "level"]]) add(`${root}.${suffix}`, mission, field);
    for (const objective of mission.objectives) add(`${root}.objectives.${objective.id}`, objective, "label");
    for (const [kind, events] of Object.entries(mission.feedbackEvents || {})) for (const event of events) {
      for (const field of ["eyebrow", "title", "message"]) add(`${root}.feedback.${kind}.${event.id}.${field}`, event, field);
    }
  }
  return fields;
}

export function catalogForEditing(catalog, wording) {
  const next = structuredClone(catalog);
  for (const { key, owner, field } of contentFields(next)) {
    if (wording?.entries[key]) owner[field] = wording.entries[key].ru;
  }
  return next;
}

export function syncCatalogWording(catalog, previousCatalog, wording) {
  const next = structuredClone(wording);
  const previous = new Map(contentFields(catalogForEditing(previousCatalog, wording)).map(({ key, owner, field }) => [key, owner[field] ?? ""]));
  const review = new Set(next.translationReview || []);
  for (const { key, owner, field } of contentFields(catalog)) {
    const value = String(owner[field] ?? "").trim();
    if (previous.has(key) && previous.get(key) === value) continue;
    // An explicitly empty optional phrase uses the catalog fallback in both languages.
    if (!value.trim()) { delete next.entries[key]; review.delete(key); continue; }
    if (next.entries[key]) next.entries[key].ru = value;
    else next.entries[key] = { ru: value, en: value };
    review.add(key);
  }
  next.translationReview = [...review];
  return next;
}
