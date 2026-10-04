import assert from "node:assert/strict";
import test from "node:test";
import { candidateCopyWidths, chooseCopyWidth, adaptMissionCopy } from "../src/adaptive-mission-copy.mjs";

test("width search is bounded and starts at the current composition", () => {
  for (const base of [294, 300]) {
    const widths = candidateCopyWidths(base);
    assert.equal(widths[0], base);
    assert.equal(widths.length, 13);
    assert.equal(new Set(widths).size, widths.length);
    assert.ok(widths.every((width) => Math.abs(width - base) <= 24));
  }
  assert.deepEqual(candidateCopyWidths(NaN), []);
});

test("smallest gaps take priority over proximity while overflow is rejected", () => {
  const candidates = [
    { width: 294, maxGapRatio: 4.5 },
    { width: 290, maxGapRatio: 1.2, overflow: true },
    { width: 298, maxGapRatio: 1.5 },
    { width: 318, maxGapRatio: 1.1 },
  ];
  assert.equal(chooseCopyWidth(candidates, 294).width, 318);
  assert.equal(chooseCopyWidth([{ width: 300, maxGapRatio: 3 }, { width: 304, maxGapRatio: 2 }], 300).width, 304);
  assert.deepEqual(chooseCopyWidth([{ width: 304, maxGapRatio: NaN }], 300), { width: 300 });
  assert.equal(chooseCopyWidth([{ width: 308, maxGapRatio: 1.2 }, { width: 304, maxGapRatio: 1.2 }], 300).width, 304);
});

test("ordinary modes never measure or mutate the document", () => {
  for (const mode of ["left", "justify", "justify-4"]) {
    adaptMissionCopy({ dataset: { missionTextLayout: mode }, get ownerDocument() { throw new Error("Unexpected measurement"); } });
  }
});

test("adaptive mode commits once, preserves text, caches the result and removes its probe", () => {
  let measurements = 0, removed = 0, appended = 0;
  const style = () => ({ removeProperty(name) { delete this[name]; } });
  const node = { data: "Абонентский терминал", get length() { return this.data.length; } };
  const sample = { style: style(), scrollWidth: 100, clientWidth: 100, append() {} };
  let clone;
  const document = {
    fonts: { status: "loaded" },
    defaultView: { getComputedStyle: () => ({ width: "294px", font: "14px Bureau", letterSpacing: "normal" }) },
    createElement: () => ({ style: {}, getBoundingClientRect: () => ({ width: 4 }), remove() {} }),
    createTreeWalker: () => { let visited = false; return { currentNode: node, nextNode() { if (visited) return false; visited = true; return true; } }; },
    createRange: () => ({ start: 0, setStart(_node, index) { this.start = index; }, setEnd() {}, getClientRects() {
      measurements++;
      const left = this.start === 10;
      const width = parseFloat(clone.style.width);
      const gap = width === 318 ? 4.4 : width === 298 ? 5 : 20;
      return [{ top: 0, height: 14, left: left ? 0 : 10 + gap, right: left ? 10 : 20 + gap }];
    } }),
  };
  sample.ownerDocument = document;
  const card = {
    style: style(), parentElement: { append() { appended++; } },
    cloneNode() { clone = { style: style(), querySelector: () => sample, querySelectorAll: () => [], removeAttribute() {}, setAttribute() {}, remove() { removed++; } }; return clone; },
  };
  const copy = { matches: () => true, closest: () => card, textContent: node.data, style: style(), dataset: {} };
  const root = { ownerDocument: document, dataset: { missionTextLayout: "adaptive" }, querySelectorAll: () => [copy] };
  adaptMissionCopy(root);
  assert.equal(card.style.width, "318px");
  assert.equal(copy.style.textAlign, "justify");
  assert.equal(copy.dataset.copyFit, "justified");
  assert.equal(copy.textContent, "Абонентский терминал");
  assert.equal(removed, 1);
  const firstMeasurements = measurements;
  adaptMissionCopy(root);
  assert.equal(measurements, firstMeasurements);
  assert.equal(appended, 1);
});
