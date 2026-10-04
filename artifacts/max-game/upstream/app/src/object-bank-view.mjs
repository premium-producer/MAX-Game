import { iconSource } from "./object-catalog.mjs";
import { settingsDefaults } from "./node-settings.mjs";
import { commonEquipmentSettings, equipmentSetUsers, iconUsers, missionInventory } from "./object-bank.mjs";
export const escapeBank = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const e = escapeBank;
const pathAttr = (path) => e(JSON.stringify(path));
const field = (label, path, value, numeric = false) => `<label><span>${e(label)}</span><input ${numeric ? 'type="number" min="0.000001" step="any"' : 'maxlength="160"'} data-bank-field="${pathAttr(path)}" value="${e(value)}"></label>`;
const parameterNames = { size: "Размер маркера ×", signalRadius: "Радиус сигнала", minAltitude: "Минимальная высота", maxAltitude: "Максимальная высота", defaultAltitude: "Стартовая высота", radiusAtMinAltitude: "Радиус на минимальной высоте", radiusAtMaxAltitude: "Радиус на максимальной высоте" };
export const sectionNames = { objects: "Оборудование", icons: "Иконки точек", sets: "Наборы для миссий", screen: "Объекты для ракурса" };
export function renderMissionEquipment(catalog, index) {
  const mission = catalog.missions[index], sets = catalog.system.equipmentSets || {}, inventory = missionInventory(catalog, mission);
  const selector = `<label class="editor-field"><span>Набор оборудования</span><select data-v2-field="${pathAttr(["missions", index, "equipmentSet"])}"><option value="" ${!mission.equipmentSet ? "selected" : ""}>Локальный состав (без общего набора)</option>${Object.entries(sets).map(([id, set]) => `<option value="${e(id)}" ${id === mission.equipmentSet ? "selected" : ""}>${e(set.label)}</option>`).join("")}</select></label>`;
  const contents = mission.equipmentSet ? `<p class="condition-note">Состав задаётся в общем банке. Изменение этого набора действует во всех миссиях, которые его используют.</p><ul>${Object.entries(inventory).filter(([, count]) => count > 0).map(([type, count]) => `<li>${e(catalog.system.objectTypes[type]?.short || type)} × ${count}</li>`).join("")}</ul>` : `<div class="field-grid">${Object.entries(catalog.system.objectTypes).map(([type, item]) => `<label class="editor-field"><span>${e(item.short)}</span><input type="number" min="0" step="1" data-v2-field="${pathAttr(["missions", index, "inventory", type])}" value="${inventory[type] || 0}"></label>`).join("")}</div><button data-v2-action="inventory-from-roles" data-v2-path="${pathAttr(["missions", index])}">Заполнить по уникальным ролям</button>`;
  return `<section class="inspector-section"><h3>НАБОР ОБОРУДОВАНИЯ</h3>${selector}${contents}<a href="./object.html#sets/${e(mission.equipmentSet || "")}" target="_blank" rel="noopener">Открыть банк объектов и наборов ↗</a></section>`;
}
export function bankEntries(catalog, section) {
  const system = catalog.system;
  if (section === "screen") return [...bankEntries(catalog, "objects"), ...["A", "B"].map((key) => ({ id: `endpoint:${key}`, label: `Точка ${key === "A" ? "А" : "Б"}`, icon: iconSource(system.icons[`point-${key.toLowerCase()}`] || { src: `./icons/endpoint-${key.toLowerCase()}.svg` }) }))];
  if (section === "objects") return Object.entries(system.objectTypes).map(([id, item]) => ({ id, label: item.short, icon: iconSource(system.icons[item.icon]) }));
  if (section === "icons") return system.pointIcons.map((id) => ({ id, label: system.icons[id].label, icon: iconSource(system.icons[id]) }));
  return Object.entries(system.equipmentSets).map(([id, set]) => ({ id, label: set.label, count: Object.values(set.inventory).reduce((a, b) => a + b, 0) }));
}
export function renderBankList(catalog, section, selected, filter = "") {
  const query = filter.toLocaleLowerCase("ru");
  return bankEntries(catalog, section).filter((entry) => `${entry.id} ${entry.label}`.toLocaleLowerCase("ru").includes(query)).map((entry) => `<button data-entry="${e(entry.id)}" aria-pressed="${entry.id === selected}">${entry.icon ? `<img src="${e(entry.icon)}" alt="">` : ""}<span><strong>${e(entry.label)}</strong><small>${e(entry.id)}${entry.count !== undefined ? ` · ${entry.count} объектов` : ""}</small></span></button>`).join("") || '<p class="empty">Записей нет. Нажмите ＋, чтобы создать новую.</p>';
}
export function renderEquipmentDefaults(catalog) {
  const common = commonEquipmentSettings(catalog);
  const bulkField = (label, key, value) => `<label><span>${label}<small>${value === "" ? "сейчас разные значения" : `сейчас ${e(value)}`}</small></span><input type="number" min="0.000001" step="any" data-equipment-default="${key}" value="" placeholder="новое значение"></label>`;
  return `<section class="equipment-defaults"><div><h3>ОБЩИЕ ПАРАМЕТРЫ ВСЕГО ОБОРУДОВАНИЯ</h3><p>Одним действием задаёт базовый размер и радиус всем типам. Локальные переопределения внутри отдельных миссий сохраняются.</p></div><div class="equipment-defaults__fields">${bulkField("Размер маркера ×", "size", common.size)}${bulkField("Радиус сигнала", "signalRadius", common.signalRadius)}<button type="button" class="primary" data-command="apply-equipment-defaults">ПРИМЕНИТЬ КО ВСЕМУ ОБОРУДОВАНИЮ</button></div></section>`;
}
export function renderBankDetail(catalog, section, id) {
  if (section === "screen") return renderScreenAppearance(catalog, id);
  const entry = bankEntries(catalog, section).find((item) => item.id === id);
  if (!entry) return '<p class="empty">Создайте или выберите запись слева.</p>';
  const system = catalog.system;
  const header = `<div class="detail-header"><div><h2>${e(entry.label)}</h2><span class="detail-id">ID: ${e(id)}</span></div><div class="detail-actions"><button data-command="duplicate">Дублировать</button><button data-command="delete" class="danger">Удалить</button></div></div>`;
  if (section === "sets") {
    const set = system.equipmentSets[id], users = equipmentSetUsers(catalog, id);
    return `${header}<p class="detail-description">Набор — это состав и количество оборудования из общего банка. Это не последовательность маршрута.</p><div class="fields">${field("Название набора", ["system", "equipmentSets", id, "label"], set.label)}</div><p class="usage">Используется: ${users.length ? users.map((m) => e(m.name)).join(", ") : "пока не назначен миссии"}. Изменения общего набора применятся во всех этих миссиях.</p><div class="set-members">${Object.entries(system.objectTypes).map(([type, item]) => `<label class="set-member ${(set.inventory[type] || 0) > 0 ? "included" : ""}"><img src="${e(iconSource(system.icons[item.icon]))}" alt=""><span>${e(item.short)}</span><input type="number" min="0" step="1" value="${set.inventory[type] || 0}" data-set-count="${e(type)}" aria-label="Количество: ${e(item.short)}"></label>`).join("")}</div><p class="bank-note">0 — объект не входит в набор. Сохраните набор, затем выберите его в <a href="./editor.html">редакторе миссий</a>. Последовательности, географические точки и условия настраиваются там.</p>`;
  }
  const item = section === "objects" ? system.objectTypes[id] : system.icons[id];
  const base = ["system", section === "objects" ? "objectTypes" : "icons", id];
  const params = section === "objects" ? { ...settingsDefaults(system.objectTypes)[id], ...system.objectSettings[id] } : null;
  const users = section === "objects" ? Object.entries(system.equipmentSets).filter(([, set]) => set.inventory[id] > 0).map(([, set]) => set.label) : iconUsers(catalog, id).map((user) => user.label);
  const previewName = section === "objects" ? `<strong>${e(item.short)}</strong>` : "";
  const nameField = section === "objects" ? field("Название", [...base, "short"], item.short) : field("Название в банке", [...base, "label"], item.label);
  return `${header}<p class="detail-description">${section === "objects" ? "Одна запись оборудования для всех наборов и миссий. Здесь задаются единое отображаемое название, собственный SVG и физические параметры." : "Это обозначение фиксированной точки, не игровое оборудование. Название нужно только для поиска и выбора в банке и не выводится рядом с иконкой в игре."}</p>${section === "objects" ? renderEquipmentDefaults(catalog) : ""}<div class="object-layout"><div><div class="icon-stage"><img src="${e(entry.icon)}" alt="Предпросмотр SVG">${previewName}</div><label class="upload">${section === "objects" ? "SVG оборудования" : "SVG иконки точки"}<input data-bank-upload type="file" accept=".svg,image/svg+xml"></label></div><div><div class="fields">${nameField}${section === "objects" ? `<label class="wide"><span>Размещение</span><select data-bank-field="${pathAttr([...base, "behavior"])}"><option value="ground" ${item.behavior === "ground" ? "selected" : ""}>На Земле: платформа и ножка</option><option value="orbital" ${item.behavior === "orbital" ? "selected" : ""}>На высоте: управление высотой</option></select></label><label class="wide"><span>Допустимая поверхность</span><select data-bank-field="${pathAttr([...base, "placementSurface"])}">${[["land", "Только суша"], ["water", "Только вода"], ["any", "Суша и вода"]].map(([value, label]) => `<option value="${value}" ${(item.placementSurface ?? (item.behavior === "orbital" ? "any" : "land")) === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>` : ""}</div>${params ? `<h3>Размеры и сигнал</h3><div class="fields">${Object.entries(params).map(([key, value]) => field(parameterNames[key], ["system", "objectSettings", id, key], value, true)).join("")}</div>` : ""}<p class="usage">Используется: ${users.length ? users.map(e).join(", ") : "пока не используется"}.</p></div></div><p class="bank-note">SVG сохраняется внутри проекта, без скачивания в Downloads. Используйте монохромные векторные контуры; текст переведите в кривые. До 128 КБ. Маски, фильтры, CSS и растровые вставки не поддерживаются.</p>`;
}

export function renderScreenAppearance(catalog, id) {
  const entry = bankEntries(catalog, "screen").find((item) => item.id === id);
  if (!entry) return "";
  const profile = catalog.system.screenAppearance || { fieldScale: 1, objectScale: 1, sizes: {} };
  const base = ["system", "screenAppearance"];
  const scaleField = (label, path, value) => field(label, path, value, true).replace('min="0.000001" step="any"', 'min="0.1" max="5" step="0.05"');
  return `<div class="detail-header"><div><h2>РАКУРСНЫЙ РЕЖИМ</h2><p>Настройки действуют во всех миссиях режима «По ракурсу».</p></div><a href="./?connection=screen" target="_blank" rel="noopener">Открыть игру по ракурсу ↗</a></div>
    <section class="equipment-defaults"><div><h3>ОБЩИЕ ПАРАМЕТРЫ</h3><p>Поле связи — круг вокруг объекта. Увеличь его, чтобы соединять более удалённые на экране объекты. Размеры иконок настраиваются отдельно.</p></div><div class="fields">${scaleField("Масштаб всех полей связи ×", [...base, "fieldScale"], profile.fieldScale)}${scaleField("Масштаб всех объектов ×", [...base, "objectScale"], profile.objectScale)}<label class="wide"><span>Круг максимальной дальности</span><select data-bank-field="${pathAttr([...base, "showRangeCircle"])}" data-value-type="boolean"><option value="true" ${profile.showRangeCircle !== false ? "selected" : ""}>Показывать</option><option value="false" ${profile.showRangeCircle === false ? "selected" : ""}>Скрыть</option></select><small>Скрой круг подсказки, сохранив дальность связи и проверку соединений.</small></label></div></section>
    <h3>${e(entry.label)}</h3><div class="object-layout"><div class="icon-stage"><img src="${e(entry.icon)}" alt="Иконка выбранного объекта"><strong>${e(entry.label)}</strong></div><div><div class="fields">${scaleField("Масштаб этого типа ×", [...base, "sizes", id], profile.sizes[id] ?? 1)}</div><p class="bank-note">Итоговый размер = исходный размер × общий масштаб объектов × масштаб этого типа. 1 — без изменения, 0,5 — вдвое меньше, 2 — вдвое больше. Допустимые значения: от 0,1 до 5.</p><p class="bank-note">Для дополнительных фиксированных точек применяется масштаб точки А.</p></div></div>
    <p class="bank-note">Нажми «Сохранить изменения», затем обнови игру. Размер поля влияет и на его контур, и на проверку соединений. Эти множители применяются только в режиме «По ракурсу».</p>`;
}
