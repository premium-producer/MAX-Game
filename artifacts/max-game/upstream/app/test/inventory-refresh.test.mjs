import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("placing/selecting/removing equipment updates existing cards without replaying list entrance", async () => {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  let rebuilds = 0, entrances = 0;
  const counts = { terminal: 2, satellite: 6 };
  const makeCard = (type) => {
    const counter = { textContent: `×${counts[type]}` }, title = { textContent: type };
    return { dataset: { item: type }, disabled: false, title: type,
      classList: { selected: false, toggle(_key, selected) { this.selected = selected; } },
      querySelector: (selector) => selector === ".object-card-count" ? counter : title,
      setAttribute(key, value) { this[key] = value; },
    };
  };
  const list = { dataset: {}, children: [], get childElementCount() { return this.children.length; },
    set innerHTML(markup) { rebuilds++; this.children = markup.split("|").filter(Boolean).map(makeCard); },
    replaceChildren() { this.children = []; },
  };
  const ctx = vm.createContext({ shellInventoryList: list, missionRun: { selected: null },
    ITEM_TYPES: { terminal: { short: "terminal" }, satellite: { short: "satellite" } },
    availableCount: (_run, type) => counts[type], renderInventoryItem: (type) => `${type}|`,
    animateElement() { entrances++; }, motionOptions: () => ({}), shellConfig: { motion: { contentStaggerMs: 84 } },
    t: (_key, { item, count }) => `${item}: ${count}`,
  });
  vm.runInContext(source.slice(source.indexOf("function updateInventory("), source.indexOf("function updateRouteSequence(")), ctx);
  ctx.updateInventory(["terminal", "satellite"]);
  const cards = [...list.children], counter = cards[1].querySelector(".object-card-count");
  assert.equal(rebuilds, 1); assert.equal(entrances, 2);
  for (let count = 5; count >= 0; count--) {
    counts.satellite = count; ctx.missionRun.selected = count % 2 ? "satellite" : null;
    ctx.updateInventory(["terminal", "satellite"]);
    assert.equal(list.children[0], cards[0]); assert.equal(list.children[1], cards[1]);
    assert.equal(cards[1].querySelector(".object-card-count"), counter);
    assert.equal(counter.textContent, `×${count}`);
    assert.equal(cards[1].disabled, count === 0);
    assert.equal(cards[1].classList.selected, count % 2 === 1);
    assert.equal(cards[1]["aria-label"], `satellite: ${count}`);
  }
  counts.satellite = 6; ctx.updateInventory(["terminal", "satellite"]);
  assert.equal(cards[1].disabled, false); assert.equal(counter.textContent, "×6");
  ctx.ITEM_TYPES.satellite.short = "Спутник"; ctx.updateInventory(["terminal", "satellite"]);
  assert.equal(cards[1].querySelector(".object-card-title").textContent, "Спутник");
  assert.equal(cards[1].title, "Спутник");
  ctx.ITEM_TYPES.satellite.short = "Космический аппарат"; ctx.updateInventory(["terminal", "satellite"]);
  assert.equal(cards[1].querySelector(".object-card-title").textContent, "Космический\nаппарат");
  assert.equal(cards[1].title, "Космический аппарат");
  ctx.ITEM_TYPES.satellite.short = "Центр обработки данных"; ctx.updateInventory(["terminal", "satellite"]);
  assert.equal(cards[1].querySelector(".object-card-title").textContent, "Центр обработки данных");
  assert.equal(ctx.objectCardTitle("Абонентский\u00a0терминал"), "Абонентский\nтерминал");

  assert.equal(rebuilds, 1); assert.equal(entrances, 2);
  ctx.clearInventory(); ctx.updateInventory(["terminal", "satellite"]);
  assert.equal(rebuilds, 2); assert.equal(entrances, 4);
});
