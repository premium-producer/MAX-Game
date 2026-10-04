import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { balanceShortSentenceStarts, findShortSentenceStartBreaks, formatTypography, inferTypographyProfile, lintWording, resolveMissionTextLayout, TYPOGRAPHY_PROFILES } from "../src/typography.mjs";
import { createTranslator, parseWording } from "../src/wording.mjs";

const rawWording = JSON.parse(await readFile(new URL("../public/config/wording.json", import.meta.url), "utf8"));
const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("comparison URLs override the saved layout without changing it", () => {
  const config = Object.freeze({ typography: Object.freeze({ missionTextLayout: "justify" }) });
  assert.equal(resolveMissionTextLayout(config, "left"), "left");
  assert.equal(resolveMissionTextLayout(config, "justify"), "justify");
  assert.equal(resolveMissionTextLayout(config, "justify-4"), "justify-4");
  for (const override of [undefined, null, "", "wrong"]) assert.equal(resolveMissionTextLayout(config, override), "justify");
  assert.equal(config.typography.missionTextLayout, "justify");
  assert.equal(resolveMissionTextLayout({}), "adaptive");
  assert.equal(resolveMissionTextLayout({ typography: { missionTextLayout: "adaptive" } }, null), "adaptive");
});

test("justified descriptions and card summaries remove only generated sentence breaks", () => {
  let removed = 0;
  const elements = [".mission-description", ".mission-summary"].map((selector) => ({
    matches: (query) => query.includes(selector),
    closest: () => ({}),
    querySelectorAll: (query) => {
      assert.equal(query, "br[data-copy-sentence-break]");
      return [{ remove() { removed++; } }];
    },
    get ownerDocument() { throw new Error("Justified copy must not run the sentence-start measurement"); },
  }));
  assert.equal(balanceShortSentenceStarts({ querySelectorAll: () => elements }), 0);
  assert.equal(removed, 2);
});

test("typography formatter binds deterministic Russian constructions", () => {
  assert.equal(formatTypography("В миссии № 2 осталось 20 % времени", "ru", "body"), "В\u00A0миссии №\u00A02 осталось 20\u00A0% времени");
  assert.equal(formatTypography("с главным спутником и сетью", "ru", "body"), "с\u00A0главным спутником и\u00A0сетью");
  assert.equal(formatTypography("НА ЗЕМЛЕ И В КОСМОСЕ", "ru", "heading"), "НА\u00A0ЗЕМЛЕ И\u00A0В\u00A0КОСМОСЕ");
  assert.equal(formatTypography("от точки А через терминал", "ru", "body"), "от точки А через терминал");
});

test("typography formatter protects technical tokens and is idempotent", () => {
  const source = "Открой https://example.org/a-path и файл C:\\game\\mission-1.json";
  const once = formatTypography(source, "ru", "body");
  assert.match(once, /https:\/\/example\.org\/a-path/u);
  assert.match(once, /C:\\game\\mission-1\.json/u);
  assert.equal(formatTypography(once, "ru", "body"), once);
});

test("English formatter handles unambiguous short words and apostrophes", () => {
  assert.equal(formatTypography("A satellite isn't a terminal", "en", "body"), "A\u00A0satellite isn’t a\u00A0terminal");
  assert.equal(formatTypography("from point A through space", "en", "body"), "from point A through space");
});

test("English compact copy binds short words without overbinding mission prose or technical tokens", () => {
  const source = "Place the terminal on Earth at 20 km";
  assert.equal(formatTypography(source, "en", "instruction"), "Place the\u00A0terminal on\u00A0Earth at\u00A020\u00A0km");
  assert.equal(formatTypography(source, "en", "body"), "Place the terminal on Earth at 20\u00A0km");
  const mixed = "I'm at the terminal's location, 2.5 km from point A through space https://example.org/I'm";
  const formatted = formatTypography(mixed, "en", "body");
  assert.equal(formatted, "I’m at the terminal’s location, 2.5\u00A0km from point A through space https://example.org/I'm");
  assert.equal(formatTypography(formatted, "en", "body"), formatted);
  assert.equal(formatTypography("an object\non Earth", "en", "instruction"), "an\u00A0object\non\u00A0Earth");
});

test("UI punctuation policy applies to both locales and preserves detailed mission prose", () => {
  for (const language of ["ru", "en"]) {
    for (const key of ["onboarding.steps.1.body", "mission.feedback.error", "content.missions.example.summary", "content.missions.example.feedback.success.done.message"]) {
      assert.ok(lintWording({ entries: { [key]: { [language]: "Sentence.\nNext sentence" } } }).warnings.some(issue => issue.code === "terminal-period"));
    }
    assert.deepEqual(lintWording({ entries: { "content.missions.example.description": { [language]: "Sentence. Another sentence." } } }), { errors: [], warnings: [] });
    assert.deepEqual(lintWording({ entries: { "sample": { [language]: "2.5 km" } } }), { errors: [], warnings: [] });
  }
  assert.doesNotMatch(styles, /:lang\(en\)[^{]*\{[^}]*font-size/);
});

test("translator applies typography after placeholder interpolation and accepts an explicit profile", () => {
  const wording = parseWording(rawWording);
  const translate = createTranslator(wording, "ru");
  assert.equal(translate("mission.number", { number: 3 }), "МИССИЯ №\u00A03");
  assert.equal(translate("onboarding.steps.2.body", {}, { typography: "heading" }), "Управляй элементами сети спутниковой связи на\u00A0Земле и\u00A0в\u00A0космосе");
  assert.throws(() => formatTypography("text", "en", "unknown"), /неизвестный профиль/);
  assert.equal(translate("onboarding.steps.2.body"), "Управляй элементами сети спутниковой связи на\u00A0Земле и\u00A0в\u00A0космосе");
  assert.deepEqual(TYPOGRAPHY_PROFILES, ["body", "instruction", "heading", "button", "badge", "code"]);
});

test("copy linter blocks objective defects and keeps editorial judgments as warnings", () => {
  const invalid = { entries: { sample: { ru: "МИССИЯ №1  - тест ", en: "A  test" } } };
  const diagnostics = lintWording(invalid);
  assert.ok(diagnostics.errors.some((issue) => issue.code === "number-sign-spacing"));
  assert.ok(diagnostics.errors.some((issue) => issue.code === "double-space"));
  assert.ok(diagnostics.errors.some((issue) => issue.code === "outer-whitespace"));
  assert.ok(lintWording({ entries: { sample: { ru: "МИССИЯ № 1", en: "MISSION #1" } } }).errors.some((issue) => issue.code === "number-sign-spacing"));
  assert.ok(lintWording({ entries: { sample: { ru: "текст &nbsp; текст", en: "text <br> text" } } }).errors.some((issue) => issue.code === "html-entity"));
  const warning = lintWording({ entries: { "sample.title": { ru: "ЗАГОЛОВОК.", en: "YOU CAN CONTINUE." } } });
  assert.ok(warning.warnings.some((issue) => issue.code === "terminal-period"));
  assert.ok(warning.warnings.some((issue) => issue.code === "weak-wording"));
});

test("current wording has no blocking copy defects or editorial warnings", () => {
  assert.deepEqual(lintWording(rawWording), { errors: [], warnings: [] });
  assert.ok(lintWording({ entries: { "sample.title": { en: "A".repeat(90) } } }).warnings.some(issue => issue.code === "length-budget"));
  assert.ok(lintWording({ entries: { "onboarding.title": { en: "A".repeat(111) } } }).warnings.some(issue => issue.code === "length-budget"));
  assert.equal(inferTypographyProfile("popup.retry"), "button");
  assert.equal(inferTypographyProfile("content.missions.first-signal.name"), "heading");
  assert.equal(inferTypographyProfile("mission.number"), "badge");
  assert.equal(inferTypographyProfile("onboarding.steps.1.body"), "instruction");
});

test("player surfaces expose semantic wrapping profiles and debug layout QA", () => {
  for (const profile of ["heading", "body", "instruction", "button", "badge"]) {
    assert.match(`${index}\n${main}`, new RegExp(`(?:ui-copy-${profile}|data-copy-profile=\\"${profile}\\")`));
    assert.match(styles, new RegExp(`\\.ui-copy-${profile}`));
  }
  assert.match(styles, /text-wrap:\s*balance/);
  assert.match(styles, /text-wrap:\s*pretty/);
  assert.match(styles, /hyphens:\s*none/);
  assert.match(main, /balanceShortSentenceStarts\(stage\)/);
  assert.match(main, /auditTypographyLayout\(stage, language\)/);
});

test("sentence-start widow rule moves one or two words but leaves three", () => {
  const token = (text) => ({ text, node: {}, start: 0 });
  assert.equal(findShortSentenceStartBreaks([{ words: [token("предложения."), token("Всевозможный")] }])[0].text, "Всевозможный");
  assert.equal(findShortSentenceStartBreaks([{ words: [token("предложения."), token("Всем"), token("тем")] }])[0].text, "Всем");
  assert.deepEqual(findShortSentenceStartBreaks([{ words: [token("предложения."), token("Всем"), token("тем"), token("кому")] }]), []);
});
