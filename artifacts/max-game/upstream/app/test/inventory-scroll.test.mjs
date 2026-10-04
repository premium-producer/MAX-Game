import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/inventory-scroll.mjs", import.meta.url), "utf8");
function harness({ scale = 1, disabled = Array(6).fill(false), reduced = false, mode = "tap" } = {}) {
  const target = (extra = {}) => ({ listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    removeEventListener(type) { delete this.listeners[type]; }, ...extra });
  const calls = [], events = target(), observers = [];
  const list = target({ scrollTop: 0, scrollHeight: disabled.length * 190, clientHeight: 400, offsetHeight: 400,
    getBoundingClientRect: () => ({ top: 50, height: 400 * scale }),
    scrollTo(options) { calls.push(options); this.scrollTop = options.top; },
    setPointerCapture(id) { this.capture = id; }, hasPointerCapture(id) { return this.capture === id; },
    releasePointerCapture() { this.capture = null; },
  });
  list.children = disabled.map((value, index) => ({ disabled: value, dataset: { item: String(index) },
    getBoundingClientRect: () => ({ top: 50 + (index * 190 - list.scrollTop) * scale }) }));
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(_target, options) { this.options = options; } disconnect() { this.disconnected = true; }
  }
  const ctx = vm.createContext({ MutationObserver: Observer });
  vm.runInContext(source.replace("export function", "function"), ctx);
  const api = ctx.createInventoryScroll({ list, events, canSwipe: () => mode === "tap", reducedMotion: () => reduced });
  function event(type, y = 200, extra = {}) {
    const e = { pointerId: 1, isPrimary: true, button: 0, pointerType: "mouse", clientX: 100, clientY: y,
      preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.blocked = true; }, ...extra };
    (list.listeners[type] || events.listeners[type])?.(e);
    return e;
  }
  return { api, list, events, calls, event, observers };
}

test("mouse and pen swipe the list at every stage scale, suppress the swipe click and preserve the next tap", () => {
  for (const scale of [.5, 1, 1.5, 2]) for (const pointerType of ["mouse", "pen"]) {
    const h = harness({ scale });
    assert.equal(h.event("pointerdown", 200, { pointerType }).prevented, undefined);
    h.event("pointermove", 196, { pointerType }); assert.equal(h.list.scrollTop, 0);
    h.event("pointermove", 200 - 100 * scale, { pointerType });
    assert.equal(h.list.scrollTop, 100);
    h.event("pointerup", 200 - 100 * scale, { pointerType });
    assert.equal(h.list.capture, null);
    assert.equal(h.event("click").blocked, true);
    h.event("pointerdown"); h.event("pointerup");
    assert.equal(h.event("click").blocked, undefined);
    assert.equal(h.list.scrollTop, 100);
  }
});

test("swipe clamps to both ends and release-only displacement cannot select a card", () => {
  const h = harness();
  h.event("pointerdown"); h.event("pointerup", -2000);
  assert.equal(h.list.scrollTop, 740); assert.equal(h.event("click").blocked, true);
  h.event("pointerdown"); h.event("pointermove", 2000); h.event("pointerup", 2000);
  assert.equal(h.list.scrollTop, 0);
});

test("touch keeps native swipe, wheel and keyboard scrolling; drag mode does not steal equipment drag", () => {
  for (const options of [{ mode: "tap", pointerType: "touch" }, { mode: "drag", pointerType: "mouse" }]) {
    const h = harness(options);
    assert.equal(h.event("pointerdown", 200, options).prevented, undefined);
    assert.equal(h.event("pointermove", 100, options).prevented, undefined);
    assert.equal(h.list.capture, undefined);
    assert.equal(h.list.scrollTop, 0);
    h.list.scrollTop = 120; // Native touch/wheel scroll belongs to the browser.
    h.event("pointerup", 100, options);
    assert.equal(h.list.scrollTop, 120);
    assert.equal(h.event("wheel").prevented, undefined);
    assert.equal(h.event("keydown").prevented, undefined);
  }
});

test("exhausting a type reveals the nearest available card, skips zero stock, prefers forward ties, and respects scale", () => {
  for (const scale of [.5, 1, 2]) {
    const h = harness({ scale, disabled: [true, false, true, true, false, false] });
    h.list.children[1].disabled = true; h.observers[0].callback();
    assert.equal(h.list.scrollTop, 740, "card 4 is the nearest available; bottom is clamped");
    assert.equal(h.calls[0].behavior, "smooth");
    h.api.sync(); assert.equal(h.calls.length, 1, "render/selection does not repeat scrolling");
    assert.ok(h.list.children.every((card) => card.selected === undefined), "scroll never selects equipment");
  }
  const h = harness(); h.list.children[2].disabled = true; h.api.sync();
  assert.equal(h.list.scrollTop, 570, "equal distance chooses the following card");
  const previous = harness({ disabled: [true, false, true, false, true, true] });
  previous.list.children[3].disabled = true; previous.api.sync();
  assert.equal(previous.list.scrollTop, 190, "when no forward object remains, return to the nearest earlier one");
});

test("all exhausted, unchanged stock, restock and list replacement do not move the menu", () => {
  const h = harness({ disabled: [true, false, true] });
  h.list.children[1].disabled = true; h.api.sync(); assert.equal(h.calls.length, 0);
  h.list.children[0].disabled = false; h.api.sync(); assert.equal(h.calls.length, 0);
  h.list.children = [...h.list.children.map((card) => ({ ...card }))];
  h.api.sync(); assert.equal(h.calls.length, 0);
  const noOverflow = harness({ disabled: [false, false] });
  noOverflow.list.children[0].disabled = true; noOverflow.api.sync();
  assert.equal(noOverflow.list.scrollTop, 0);
});

test("manual input interrupts auto scroll; reduced motion is immediate; cancellation and dispose clean up", () => {
  for (const type of ["pointerdown", "wheel", "keydown"]) {
    const h = harness(); h.list.children[0].disabled = true; h.api.sync();
    h.event(type); assert.equal(h.calls.at(-1).behavior, "instant");
  }
  const h = harness({ reduced: true });
  h.list.children[0].disabled = true; h.api.sync(); assert.equal(h.calls[0].behavior, "instant");
  h.event("pointerdown"); h.event("pointermove", 100, { pointerId: 2 }); assert.equal(h.list.scrollTop, 190);
  h.event("pointermove", 100); h.event("pointercancel");
  assert.equal(h.list.capture, null);
  h.event("pointermove", -100); assert.equal(h.list.scrollTop, 290);
  h.event("pointerdown"); h.event("pointermove", 100); h.api.dispose();
  assert.equal(h.list.capture, null);
  assert.equal(Object.keys(h.list.listeners).length, 0); assert.equal(Object.keys(h.events.listeners).length, 0);
  assert.ok(h.observers.every((observer) => observer.disconnected));
  const count = h.calls.length; h.list.children[1].disabled = true; h.api.sync(); assert.equal(h.calls.length, count);
});

test("actual inventory refresh drives autoscroll only when remaining stock becomes zero", () => {
  const h = harness();
  const counts = Object.fromEntries(h.list.children.map((card) => [card.dataset.item, 2]));
  for (const card of h.list.children) Object.assign(card, {
    classList: { toggle() {} }, setAttribute() {}, querySelector: () => null,
  });
  Object.assign(h.list, { dataset: {}, childElementCount: h.list.children.length });
  const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  const ctx = vm.createContext({ shellInventoryList: h.list, missionRun: { selected: null },
    ITEM_TYPES: Object.fromEntries(Object.keys(counts).map((key) => [key, { short: key }])),
    availableCount: (_run, key) => counts[key], t: () => "" });
  vm.runInContext(main.slice(main.indexOf("function updateInventory("), main.indexOf("function updateRouteSequence(")), ctx);
  const refresh = () => { ctx.updateInventory(Object.keys(counts)); h.observers[0].callback(); };
  refresh(); counts["0"] = 1; refresh(); assert.equal(h.calls.length, 0);
  counts["0"] = 0; refresh(); assert.equal(h.calls.length, 1); assert.equal(h.list.scrollTop, 190);
  ctx.missionRun.selected = "1"; refresh(); assert.equal(h.calls.length, 1);
});

test("inventory has no rail, keeps native vertical touch scroll and gives cards the full column", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /data-inventory-scrollbar|data-inventory-thumb/);
  assert.match(css, /\.inventory-scroll-area \{[^}]+grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(css, /\.shell-inventory \.inventory-list \{[^}]+touch-action: pan-y/);
});
