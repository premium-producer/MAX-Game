import assert from "node:assert/strict";
import test from "node:test";
import { toEditableCatalog } from "../src/editor-state.mjs";
import { validateEditorCatalog } from "../src/editor-validation.mjs";
import { missionCatalog } from "./config-fixture.mjs";

test("current project catalog is accepted by editor validation", () => {
  const validation = validateEditorCatalog(toEditableCatalog(missionCatalog));
  assert.equal(validation.valid, true);
  assert.equal(validation.errors.length, 0);
});

test("editor validation catches duplicate IDs and warns about impossible adjacent objectives", () => {
  const catalog = toEditableCatalog(missionCatalog);
  catalog.missions[1].id = catalog.missions[0].id;
  catalog.missions[0].objectives[0].condition = { type: "adjacent", first: "internet", second: "terminal", count: 1 };
  const validation = validateEditorCatalog(catalog);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((issue) => /уже используется/.test(issue.message)));
  assert.ok(validation.warnings.some((issue) => /соседней пары/.test(issue.message)));
});

test("editor does not invent a route-length limit absent from runtime and JSON Schema", () => {
  const catalog = toEditableCatalog(missionCatalog);
  catalog.missions[0].route = Array.from({ length: 12 }, () => "terminal");
  const validation = validateEditorCatalog(catalog);
  assert.ok(validation.warnings.every((issue) => !/8 объектов|игровом footer/.test(issue.message)));
});
