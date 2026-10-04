import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { createMissionRun, reduceMission, availableCount, ITEM_TYPES, MISSIONS } from "../src/mission-game.mjs";
import "./config-fixture.mjs";

const source = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const block = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));

test("real selection reducer, cards and field agree without the removed inventory controls", () => {
  const elements = new Map();
  const element = (selector) => {
    if (['[data-placement-hint]', '[data-placement-modes]', '[data-tap-selection]', '[data-node-action="clear"]', '[data-node-action="delete"]'].includes(selector)) return null;
    if (!elements.has(selector)) elements.set(selector, { textContent: "", hidden: false, disabled: false });
    return elements.get(selector);
  };
  const cards = ["terminal", "satellite"].map((type) => ({ dataset: { item: type },
    classList: { toggle(_name, selected) { this.selected = selected; } },
    setAttribute(key, value) { this[key] = value; }, querySelector: () => null }));
  const list = { dataset: {}, children: cards, childElementCount: cards.length };
  let tapState;
  const ctx = vm.createContext({ missionRun: createMissionRun(3), placementMode: "tap",
    state: { screen: "play" }, STATES: { MISSION_PLAY: "play" }, ITEM_TYPES, MISSIONS, availableCount,
    uiShell: { querySelector: element }, shellInventoryList: list,
    webglField: { setTapControls(value) { tapState = value; } }, isOrbitalType: () => false,
    t: (key, args) => `${key}${args?.item ? ":" + args.item : ""}` });
  vm.runInContext(block("function updateInventory(", "function updateRouteSequence(")
    + block("function syncTapTools(", "function applyTapNodeAction("), ctx);
  const sync = (action) => {
    if (action) ctx.missionRun = reduceMission(ctx.missionRun, action);
    ctx.updateInventory(["terminal", "satellite"]); ctx.syncTapTools();
    assert.equal(tapState.selectedId, ctx.missionRun.selectedPlacementId ?? null);
    for (const card of cards) {
      assert.equal(card.classList.selected, ctx.missionRun.selected === card.dataset.item);
      assert.equal(card["aria-pressed"], String(ctx.missionRun.selected === card.dataset.item));
    }
  };
  sync();
  sync({ type: "SELECT", item: "terminal" });
 
  sync({ type: "SELECT", item: "terminal" });
 
  sync({ type: "SELECT", item: "satellite" });
  sync({ type: "PLACE", item: "satellite", latitude: 55, longitude: 50, altitude: .9, keepSelection: true });
 
  sync({ type: "SELECT_PLACEMENT", id: 1 });
 
  sync({ type: "CLEAR_SELECTION" });
 
});

test("sticky touch hover cannot look selected: only selection owns glow and checkmark", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const hoverRules = [...css.matchAll(/[^{}]*\.inventory-item:hover[^{}]*\{([^}]+)\}/g)];
  assert.equal(hoverRules.length, 1);
  assert.doesNotMatch(hoverRules[0][1], /background|box-shadow|filter|transform/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.inventory-item:hover/);
  assert.match(css, /\.inventory-item\.is-selected::after \{[^}]+border-right: 2px solid/);
  assert.match(css, /\.inventory-item\.is-selected::before \{[^}]+background: #80afff/);
});
