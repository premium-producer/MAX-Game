import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuditCatalog} from '../scripts/build-asset-audit.mjs';
import {entriesOf, keyOf, clampRect, rectAt, makeRecord, validateImport} from '../src/asset-audit/model.mjs';

const catalog = createAuditCatalog();
const entries = entriesOf(catalog);
const first = entries[0].screen;
const envelope = records => ({schemaVersion: 1, contentRevision: catalog.contentRevision, records});
const firstRecord = () => makeRecord(first, first.actions[0], 'hotspot', [10, 20, 70, 50]);

test('click at each image corner creates a non-empty rectangle entirely inside image', () => {
  for (const {screen} of entries) {
    const asset = screen.asset;
    for (const [x, y] of [[0, 0], [asset.width, 0], [0, asset.height], [asset.width, asset.height], [asset.width / 2, asset.height / 2]]) {
      const [left, top, width, height] = rectAt(x, y, asset);
      assert.ok(left >= 0 && top >= 0);
      assert.ok(width > 0 && height > 0);
      assert.ok(left + width <= asset.width + 0.000001, `${screen.screenId}: right edge ${left + width} exceeds ${asset.width}`);
      assert.ok(top + height <= asset.height + 0.000001, `${screen.screenId}: bottom edge ${top + height} exceeds ${asset.height}`);
    }
  }
  assert.deepEqual(rectAt(0, 0, {width: 12, height: 8}), [0, 0, 12, 8]);
});

test('manual rectangle clamp handles oversize, off-image movement, rejects non-finite and empty extents', () => {
  const asset = {width: 100, height: 200};
  assert.deepEqual(clampRect([-20, -30, 200, 400], asset), [0, 0, 100, 200]);
  assert.deepEqual(clampRect([99, 198, 25, 30], asset), [75, 170, 25, 30]);
  assert.deepEqual(clampRect([5.123, 8.789, 25, 30], asset), [5.12, 8.79, 25, 30]);
  for (const rect of [[NaN, 1, 2, 3], [1, Infinity, 2, 3], [1, 2, 0, 3], [1, 2, 3, -1]]) {
    assert.throws(() => clampRect(rect, asset), /Некорректная область/);
  }
});

test('multiple actions on one screen have independent IDs and remain independently editable', () => {
  const screen = entries.find(({screen}) => screen.actions.length > 1).screen;
  const records = screen.actions.map((action, index) => makeRecord(screen, action, index === 0 ? 'hotspot' : 'below-screen', [10, 20, 40, 50]));
  const result = validateImport(envelope(records), catalog);
  assert.equal(new Set(result.map(r => keyOf(r.screenId, r.actionId))).size, records.length);
  assert.equal(result[0].placement, 'hotspot');
  assert.equal(result[1].placement, 'below-screen');
  assert.ok(!Object.hasOwn(result[1], 'rect'));
  assert.notEqual(keyOf('a,b', 'c'), keyOf('a', 'b,c'));
  assert.deepEqual(result.map(r => r.actionId), screen.actions.map(a => a.actionId));
});

test('import rejects wrong schema/revision, stale asset identity/hash, unknown action/screen and duplicate action', () => {
  const invalid = [
    {...envelope([firstRecord()]), schemaVersion: 2},
    {...envelope([firstRecord()]), contentRevision: 'old-content'},
    envelope([{...firstRecord(), assetId: 'other'}]),
    envelope([{...firstRecord(), assetSha256: '0'.repeat(64)}]),
    envelope([{...firstRecord(), screenId: 'unknown'}]),
    envelope([{...firstRecord(), actionId: 'unknown'}]),
    envelope([{...firstRecord(), reviewed: false}]),
    envelope([{...firstRecord(), placement: 'automatic'}]),
    envelope([firstRecord(), firstRecord()]),
    envelope([null]),
    {schemaVersion: 1, contentRevision: catalog.contentRevision, records: {}},
  ];
  for (const value of invalid) assert.throws(() => validateImport(value, catalog));
});

test('import rejects malformed, non-finite, empty and out-of-bounds rectangles without applying earlier valid records', () => {
  const invalidRects = [
    null, [1, 2, 3], [1, 2, 3, 4, 5], [NaN, 2, 3, 4], [1, 2, Infinity, 4],
    ['1', 2, 3, 4], [-1, 2, 3, 4], [1, -1, 3, 4], [1, 2, 0, 4],
    [1, 2, 3, -1], [first.asset.width, 0, 1, 1], [0, first.asset.height, 1, 1],
    [first.asset.width - 1, 0, 1.01, 1], [0, first.asset.height - 1, 1, 1.01],
  ];
  const secondScreen = entries[1].screen;
  for (const rect of invalidRects) {
    const valid = makeRecord(secondScreen, secondScreen.actions[0], 'below-screen');
    const input = envelope([valid, {...firstRecord(), rect}]);
    const before = structuredClone(input);
    assert.throws(() => validateImport(input, catalog));
    assert.deepEqual(input, before);
  }
});

test('all catalog actions round-trip through JSON export/import without mutating source or changing action semantics', () => {
  const sourceBefore = structuredClone(catalog);
  const records = entries.flatMap(({screen}) => screen.actions.map(action => makeRecord(screen, action, action.placement, action.rect)));
  const payload = JSON.parse(JSON.stringify(envelope(records)));
  const payloadBefore = structuredClone(payload);
  const restored = validateImport(payload, catalog);
  const withoutTime = ({updatedAt, ...record}) => record;
  assert.deepEqual(restored.map(withoutTime), records.map(withoutTime));
  assert.deepEqual(payload, payloadBefore);
  assert.deepEqual(catalog, sourceBefore);
  assert.equal(restored.length, entries.reduce((n, entry) => n + entry.screen.actions.length, 0));
});
