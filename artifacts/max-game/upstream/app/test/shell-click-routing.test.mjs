import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { audioFixture } from "./audio-runtime-fixture.mjs";
import { createMissionRun, reduceMission, availableCount } from "../src/mission-game.mjs";
import "./config-fixture.mjs";

const source = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const block = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));

// Unlike a selector stub, this fixture follows ancestors: the shell itself owns
// data-placement-mode, while a clicked card/icon can be several levels below it.
function element(tag, dataset = {}, parent = null, classes = []) {
  const node = { tag, dataset, parent, disabled: false, attributes: {},
    classList: { toggle(name, on) { node.attributes[name] = on; } },
    setAttribute(name, value) { node.attributes[name] = value; },
    closest(selector) {
      const tagName = selector.match(/^[a-z]+/)?.[0];
      const attribute = selector.match(/\[data-([a-z-]+)\]/)?.[1]?.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const className = selector.match(/\.([a-z-]+)/)?.[1];
      if ((!tagName || tagName === tag) && (!attribute || attribute in dataset)
        && (!className || classes.includes(className))) return node;
      return parent?.closest(selector) ?? null;
    },
  };
  return node;
}

async function fixture(mode) {
  const audio = await audioFixture();
  const shell = element("div", { placementMode: mode });
  const sound = element("button", { audioToggle: "", debugOnly: "" }, shell);
  const modeButton = element("button", { debugOnly: "", placementToggle: "", placementMode: mode === "tap" ? "drag" : "tap" }, shell);
  const actions = [], navigations = [], saved = [];
  const ctx = vm.createContext({ placementMode: mode, placementSession: 0, debugEnabled: true,
    languageTransitionPromise: null, suppressPointerClick: false,
    missionRun: createMissionRun(3), audioDirector: audio.director, wording: {}, t: (key) => key,
    uiShell: { dataset: shell.dataset, querySelector: selector => selector === "[data-placement-toggle]" ? modeButton : sound, querySelectorAll: () => [] }, PLACEMENT_MODE_KEY: "placement",
    localStorage: { setItem: (...args) => saved.push(args) },
    syncTapTools() {},
    setDebugEnabled(enabled) { ctx.debugEnabled = enabled; },
    updateMission(action) { actions.push(action.type); ctx.missionRun = reduceMission(ctx.missionRun, action); },
    dispatch(action) { navigations.push(action.type); },
  });
  vm.runInContext(block("function onMissionLayerClick(", "function onMissionLayerPointerOver(")
    + block("function syncAudioControl(", "async function changeLanguage(")
    + block("function syncPlacementControls(", "function syncTapTools("), ctx);
  ctx.syncPlacementControls();
  return { ctx, shell, sound, modeButton, audio, actions, navigations, saved,
    click: (target) => ctx.onMissionLayerClick({ target }) };
}

for (const mode of ["tap", "drag"]) {
  test(`shell ${mode}: nested card clicks select equipment and preserve it until placement`, async () => {
    const f = await fixture(mode);
    try {
      const card = element("button", { item: "terminal" }, f.shell, ["inventory-item"]);
      const label = element("span", {}, card);
      const before = availableCount(f.ctx.missionRun, "terminal");
      f.click(label);
      assert.equal(f.ctx.missionRun.selected, "terminal");
      assert.equal(availableCount(f.ctx.missionRun, "terminal"), before);
      assert.equal(f.ctx.missionRun.placements.length, 0);
      f.click(element("aside", {}, f.shell));
      assert.equal(f.ctx.missionRun.selected, "terminal");
      f.click(label);
      assert.equal(f.ctx.missionRun.selected, null);
      card.disabled = true; f.click(label);
      assert.deepEqual(f.actions, ["SELECT", "SELECT"]);
    } finally { await f.audio.engine.dispose(); }
  });

  test(`shell ${mode}: audio/back and nested mode buttons remain independently clickable`, async () => {
    const f = await fixture(mode);
    try {
      f.audio.director.setMuted(true);
      const icon = element("path", {}, element("svg", {}, f.sound));
      f.click(icon);
      assert.equal(f.audio.director.isMuted(), false);
      assert.equal(f.sound.attributes["aria-checked"], "true");
      assert.equal(f.sound.attributes["is-muted"], false);
      f.click(icon);
      assert.equal(f.audio.director.isMuted(), true);
      assert.equal(f.sound.attributes["aria-checked"], "false");
      f.click(element("button", { gameAction: "back" }, f.shell));
      assert.deepEqual(f.navigations, ["BACK"]);
      const next = mode === "tap" ? "drag" : "tap";
      const modeButton = f.modeButton;
      f.click(element("span", {}, modeButton));
      assert.equal(f.ctx.placementMode, next);
      assert.deepEqual(f.actions, ["CLEAR_SELECTION"]);
      assert.deepEqual(f.saved, [["placement", next]]);
      assert.equal(modeButton.dataset.placementMode, mode);
      assert.equal(f.shell.dataset.placementMode, next);
      assert.ok(modeButton.attributes["aria-label"]);
      f.click(element("path", {}, element("svg", {}, modeButton)));
      assert.equal(f.ctx.placementMode, mode);
      assert.deepEqual(f.actions, ["CLEAR_SELECTION", "CLEAR_SELECTION"]);
      assert.deepEqual(f.saved, [["placement", next], ["placement", mode]]);
    } finally { await f.audio.engine.dispose(); }
  });
}


test('one input toggle follows the numbered modes and inventory has no old mode/hint block', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /data-connection-modes><\/nav>\s*<button[^>]+data-placement-toggle/);
  assert.equal((html.match(/data-placement-toggle/g) || []).length, 1);
  assert.doesNotMatch(html, /data-placement-modes|data-placement-hint|class="placement-controls"/);
  assert.match(html, /class="placement-toggle__tap"/);
  assert.match(html, /class="placement-toggle__drag"/);
});


test("production blocks hidden audio/input controls and keeps back/cards working", async () => {
  const f = await fixture("tap");
  try {
    f.ctx.debugEnabled = false;
    f.audio.director.setMuted(true);
    f.click(element("path", {}, element("svg", {}, f.sound)));
    f.click(f.modeButton);
    assert.equal(f.audio.director.isMuted(), true);
    assert.equal(f.ctx.placementMode, "tap");
    assert.deepEqual(f.saved, []);
    f.click(element("button", { gameAction: "back" }, f.shell));
    assert.deepEqual(f.navigations, ["BACK"]);
    f.click(element("button", { item: "terminal" }, f.shell, ["inventory-item"]));
    assert.equal(f.ctx.missionRun.selected, "terminal");
  } finally { await f.audio.engine.dispose(); }
});


test("power icon exits debug without navigation and is inert outside debug", async () => {
  const f = await fixture("tap");
  try {
    const button = element("button", { debugOnly: "", gameAction: "debug-off" }, f.shell);
    f.click(element("path", {}, element("svg", {}, button)));
    assert.equal(f.ctx.debugEnabled, false);
    assert.deepEqual(f.navigations, []);
    f.click(button);
    assert.equal(f.ctx.debugEnabled, false);
  } finally { await f.audio.engine.dispose(); }
});
