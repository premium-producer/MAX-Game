import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { LoadingScreen } from "../src/loading-screen.mjs";
import { createTranslator, parseWording } from "../src/wording.mjs";

test("loading uses the game name in both languages and keeps technical failures out of player copy", async (context) => {
  const wording = parseWording(JSON.parse(await readFile(new URL("../public/config/wording.json", import.meta.url), "utf8")));
  const previousDocument = globalThis.document;
  globalThis.document = { title: wording.entries["app.title"].ru };
  context.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  context.mock.method(console, "error", () => {});
  const elements = new Map();
  const element = () => ({ textContent: "", hidden: false, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener() {}, focus() {} });
  const root = { ...element(), querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  } };
  root.querySelector("[data-loading-status]").textContent = wording.entries["loading.config"].ru;
  root.querySelector("[data-loading-error]").textContent = wording.entries["loading.error"].ru;
  const screen = new LoadingScreen(root);
  screen.phase("config");
  assert.equal(screen.status.textContent, wording.entries["loading.config"].ru);
  const internalError = new Error("X-SPUTNIK GPU failure in internal/config.json");
  screen.fail(internalError);
  assert.equal(screen.status.textContent, wording.entries["loading.error"].ru);
  assert.doesNotMatch(screen.status.textContent, /X-SPUTNIK|GPU|internal/);
  for (const language of wording.languages) {
    const t = createTranslator(wording, language);
    screen.localize(t, language);
    assert.equal(document.title, t("app.title"));
    const brand = root.querySelector(".boot-brand").innerHTML;
    if (language === "en") { assert.match(brand, /logo-eng\.svg/); assert.doesNotMatch(brand, /SPACE IS ONLINE/); }
    else assert.equal(brand, t("app.header.title"));
    assert.equal(screen.status.textContent, t("loading.config"));
    assert.equal(screen.progress.attributes["aria-label"], t("loading.progress"));
    screen.fail(internalError);
    assert.equal(screen.status.textContent, t("loading.error"));
    assert.doesNotMatch(screen.status.textContent, /X-SPUTNIK|GPU|internal/);
    assert.equal(screen.retry.hidden, false);
  }
});
