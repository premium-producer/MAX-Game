// Multipliers are independent of authored world sizes and signal radii.
export const DEFAULT_SCREEN_APPEARANCE = Object.freeze({ fieldScale: 1, objectScale: 1, showRangeCircle: true, sizes: Object.freeze({}) });
export let SCREEN_APPEARANCE = DEFAULT_SCREEN_APPEARANCE;

export function parseScreenAppearance(raw = {}, objectTypes = {}) {
  const record = (value) => value && typeof value === "object" && !Array.isArray(value);
  const multiplier = (value, label) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0.1 || value > 5) throw new Error(`${label}: укажи число от 0.1 до 5`);
    return value;
  };
  if (!record(raw) || Object.keys(raw).some((key) => !["fieldScale", "objectScale", "showRangeCircle", "sizes"].includes(key))) throw new Error("Настройки ракурса: неверные поля");
  if (raw.showRangeCircle !== undefined && typeof raw.showRangeCircle !== "boolean") throw new Error("Круг максимальной дальности: выбери показ или скрытие");
  const sizes = raw.sizes ?? {};
  if (!record(sizes)) throw new Error("Размеры объектов ракурса: ожидается объект");
  for (const [id, value] of Object.entries(sizes)) {
    if (!Object.hasOwn(objectTypes, id) && !["endpoint:A", "endpoint:B"].includes(id)) throw new Error(`Размеры ракурса: неизвестный объект ${id}`);
    multiplier(value, `Размер ${id}`);
  }
  return { showRangeCircle: raw.showRangeCircle ?? true, fieldScale: multiplier(raw.fieldScale ?? 1, "Поле связи"), objectScale: multiplier(raw.objectScale ?? 1, "Размер объектов"), sizes: { ...sizes } };
}

export function configureScreenAppearance(profile = DEFAULT_SCREEN_APPEARANCE) { SCREEN_APPEARANCE = profile; }
export function screenObjectSize(type, baseSize, enabled) {
  return baseSize * (enabled ? SCREEN_APPEARANCE.objectScale * (SCREEN_APPEARANCE.sizes[type] ?? 1) : 1);
}
export function screenFieldRadius(baseRadius, enabled) {
  return baseRadius * (enabled ? SCREEN_APPEARANCE.fieldScale : 1);
}
