import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseMissionCatalog } from "../src/mission-config.mjs";
import { createTranslator, localizeMissionCatalog, parseWording, storedLanguage, persistLanguage } from "../src/wording.mjs";

const rawWording = JSON.parse(await readFile(new URL("../public/config/wording.json", import.meta.url), "utf8"));
const wording = parseWording(rawWording);
const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const system = JSON.parse(await readFile(new URL("../public/config/mission-system.json", import.meta.url), "utf8"));
const missionFiles = ["first-signal", "arctic-route", "protected-network"];
const missions = await Promise.all(missionFiles.map(async (id) => JSON.parse(await readFile(new URL(`../public/config/missions/${id}.json`, import.meta.url), "utf8"))));
const missionCatalog = parseMissionCatalog({ schemaVersion: 2, revision: system._revision, system, missions });

test("one wording document keeps complete adjacent Russian and English entries", () => {
  assert.deepEqual(wording.languages, ["ru", "en"]);
  assert.ok(Object.keys(wording.entries).length > 100);
  for (const translations of Object.values(wording.entries)) {
    assert.equal(typeof translations.ru, "string");
    assert.equal(typeof translations.en, "string");
    assert.ok(translations.ru.trim());
    assert.ok(translations.en.trim());
  }
  const invalid = structuredClone(rawWording);
  delete invalid.entries["cta.title"].en;
  assert.throws(() => parseWording(invalid), /cta\.title\.en/);
});

test("every player-facing mission phrase resolves from wording.json in both languages", () => {
  for (const language of wording.languages) {
    const translate = createTranslator(wording, language);
    const localized = localizeMissionCatalog(missionCatalog, translate);
    for (const mission of localized.missions) {
      assert.notEqual(mission.name, mission.id);
      assert.ok(mission.description.length > 20);
      assert.ok(mission.successText.length > 3);
      assert.ok(mission.objectives.every((objective) => objective.label.length > 3));
      assert.ok(Object.values(mission.feedbackEvents).flat().every((event) => event.title && event.eyebrow && event.message));
    }
  }
  assert.equal(localizeMissionCatalog(missionCatalog, createTranslator(wording, "en")).byNumber[2].name, "THE\u00A0ARCTIC IS ONLINE");
});

test("game exposes RU/EN controls and initial loading copy is Russian from the dictionary", () => {
  assert.match(index, /class="language-switcher"/);
  assert.match(index, /data-language="ru"/);
  assert.match(index, /data-language="en"/);
  assert.doesNotMatch(main, /[А-Яа-яЁё]/);
  for (const [, , key, copy] of index.matchAll(/<([a-z0-9]+)\b[^>]*data-boot-copy="([^"]+)"[^>]*>([^<]*)<\/\1>/g)) {
    assert.equal(copy, wording.entries[key].ru, key);
  }
  assert.match(index, /data-boot-copy="loading.error"/);
  assert.doesNotMatch(main, /if \(nextLanguage !== "ru"\) return;/);
  for (const key of [...main.matchAll(/\bt\("([a-zA-Z0-9_.-]+)"/g)].map((match) => match[1])) assert.ok(wording.entries[key], key);
});

test("CTA uses the concise connect action without a subtitle", () => {
  assert.equal(wording.entries["cta.primary"].ru, "НАЖМИ, ЧТОБЫ ВЫЙТИ НА СВЯЗЬ");
  assert.equal(wording.entries["cta.primary"].en, "PRESS TO CONNECT");
  assert.equal(wording.entries["cta.subtitle"], undefined);
  assert.doesNotMatch(main, /cta\.subtitle/);
});

test("onboarding wording describes the low-orbit network and three current steps", () => {
  assert.equal(wording.entries["onboarding.title"].ru, "СОЗДАЙ НИЗКООРБИТАЛЬНУЮ СПУТНИКОВУЮ СЕТЬ ДЛЯ ПЕРЕДАЧИ ДАННЫХ В ЛЮБУЮ ТОЧКУ СТРАНЫ");
  assert.equal(wording.entries["onboarding.steps.1.body"].ru, "У каждой миссии своя задача и свои условия");
  assert.equal(wording.entries["onboarding.steps.2.title"].ru, "ПОСТРОЙ МАРШРУТ");
  assert.equal(wording.entries["onboarding.steps.2.body"].ru, "Управляй элементами сети спутниковой связи на Земле и в космосе");
  assert.equal(wording.entries["onboarding.steps.3.title"].ru, "ЗАПУСТИ СИГНАЛ");
  assert.equal(wording.entries["onboarding.steps.3.body"].ru, "Пройди все миссии\nГотов ли ты стать космическим инженером?");
});

test("language preference supports RU/EN query, persistence and unavailable storage", () => {
  const storage = { getItem: () => "en" };
  assert.equal(storedLanguage(wording, storage, "?lang=ru"), "ru");
  assert.equal(storedLanguage(wording, storage, "?lang=en"), "en");
  assert.equal(storedLanguage(wording, storage, ""), "en");
  assert.equal(storedLanguage(wording, storage, "?lang=de"), "en");
  assert.equal(storedLanguage(wording, { getItem: () => "de" }, ""), "ru");
  const broken = { getItem() { throw new Error("Unavailable storage"); } };
  assert.equal(storedLanguage(wording, broken, "?lang=en"), "en");
  assert.equal(storedLanguage(wording, broken, ""), "ru");
  let saved;
  const memory = { getItem: () => saved, setItem(_key, value) { saved = value; } };
  for (const language of ["en", "ru"]) {
    persistLanguage(language, memory);
    assert.equal(storedLanguage(wording, memory, ""), language);
  }
});

test("language changes use one interrupt-safe motion owner without resetting the mission scene", () => {
  assert.match(main, /languageTransitionPromise = runLanguageTransitionQueue\(\)/);
  assert.match(main, /cancelActiveScreenTransition\(\)/);
  assert.match(main, /await transitionToLanguage\(nextLanguage\)/);
  assert.match(main, /const outgoingGhosts = reduceMotion \? \[\] : captureLanguageSnapshot\(\)/);
  assert.match(main, /LANGUAGE_MOTION_DURATION_SCALE = 1\.72/);
  assert.match(main, /LANGUAGE_MOTION_MIN_MS = 320/);
  assert.match(main, /LANGUAGE_MOTION_MAX_MS = 440/);
  assert.match(main, /LANGUAGE_MOTION_EASING = "cubic-bezier\(\.42, 0, \.2, 1\)"/);
  assert.match(main, /activeLanguageAnimations = \[\.\.\.outgoingAnimations, \.\.\.incomingAnimations\]/);
  assert.match(main, /await rerenderLocalizedContent\(\)/);
  assert.match(main, /state\.screen === STATES\.MISSION_PLAY[\s\S]*renderMission\(\)/);
  assert.match(main, /const contentSignature = JSON\.stringify\(mission\.objectives\.map\(\(objective, index\) => \[objective\.id, objective\.label, progressSignature\[index\]\]\)\)/);
  assert.match(main, /const previous = list\.dataset\.progressKey \|\| ""/);
  assert.doesNotMatch(main, /async function changeLanguage[\s\S]*?webglMission = null;/);
  assert.match(main, /prefersReducedMotion\(\)/);
});
