import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, cp, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { BufferGeometry, Group, Quaternion } from 'three';
import { loadMissionCatalog, parseMissionCatalog, serializeMissionCatalog } from '../src/mission-config.mjs';
import { configureMissions, createMissionRun, signalRadiusFor } from '../src/mission-game.mjs';
import { parseScreenAppearance, configureScreenAppearance } from '../src/screen-appearance.mjs';
import { createNode, setNodeScreenConnections, updateNodeTransform, applyEndpointAppearance, updateConnectionContour } from '../src/webgl-field.js';
import { changeSystemField } from '../src/editor-mission-system.js';
import { renderBankDetail, bankEntries } from '../src/object-bank-view.mjs';
import { createBankEntry, removeBankEntry } from '../src/object-bank.mjs';
import { parseUiShellConfig } from '../src/ui-shell-config.mjs';
import { saveProjectConfigs } from '../src/editor-project-save.mjs';

const root = resolve(import.meta.dirname, '..');
const diskFetch = (base) => async (p) => ({ ok: true, json: async () => JSON.parse(await readFile(resolve(base, p), 'utf8')) });
const catalog = await loadMissionCatalog('./config/missions/index.json', diskFetch(resolve(root, 'public')));
const profile = { fieldScale: 1.6, objectScale: 1.2, showRangeCircle: false, sizes: { terminal: .5, satellite: 1.4, 'endpoint:A': .7 } };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
function edited() { const raw = serializeMissionCatalog(catalog); raw.system.screenAppearance = structuredClone(profile); return raw; }

test('screen profile validates multipliers and round-trips without changing authored world settings', () => {
  const raw = edited();
  const parsed = parseMissionCatalog(raw);
  assert.deepEqual(serializeMissionCatalog(parsed).system.screenAppearance, profile);
  assert.deepEqual(parsed.objectSettings, catalog.objectSettings);
  assert.deepEqual(parsed.missions.map(m => m.objectSettings), catalog.missions.map(m => m.objectSettings));
  assert.deepEqual(parseScreenAppearance(), { fieldScale: 1, objectScale: 1, showRangeCircle: true, sizes: {} });
  for (const value of [0, -1, NaN, Infinity, 5.1, '2']) assert.throws(() => parseScreenAppearance({ fieldScale: value }));
  assert.throws(() => parseScreenAppearance({ sizes: { missing: 1 } }));
  assert.throws(() => parseScreenAppearance({ sizes: [] }));
  assert.throws(() => parseScreenAppearance({ typo: 1 }));
  assert.throws(() => parseScreenAppearance({ showRangeCircle: 'false' }));
});

test('real node transforms apply separate icon and field multipliers and restore world geometry', () => {
  configureMissions(parseMissionCatalog(edited())); createMissionRun(1);
  const geometry = new BufferGeometry();
  try {
    for (const type of ['terminal', 'satellite', 'gateway']) {
      const placement = { id: type, type, latitude: 60, longitude: 80, altitude: .72 };
      const node = createNode(placement, 'base', geometry);
      const baseSize = node.scale.x, baseRadius = node.userData.signalRadius, baseStem = node.userData.stemHeight, position = node.position.clone();
      setNodeScreenConnections(node, true);
      const scale = profile.objectScale * (profile.sizes[type] ?? 1);
      close(node.scale.x, baseSize * scale); close(node.userData.stemHeight, baseStem * scale);
      close(node.userData.signalRadius, baseRadius * profile.fieldScale);
      const u = node.userData.material.uniforms;
      close(u.uWaveEnd.value * node.userData.plate.scale.x * node.scale.x, node.userData.signalRadius);
      close(signalRadiusFor(placement), baseRadius);
      updateNodeTransform(node, { ...placement, longitude: 85 });
      close(node.scale.x, baseSize * scale); close(node.userData.signalRadius, baseRadius * profile.fieldScale);
      setNodeScreenConnections(node, false); updateNodeTransform(node, placement);
      close(node.scale.x, baseSize); close(node.userData.signalRadius, baseRadius);
      assert.deepEqual(node.position, position);
      const geometries = new Set(), materials = new Set();
      node.traverse(o => { if(o.geometry !== geometry && o.geometry) geometries.add(o.geometry); if(o.material) materials.add(o.material); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    }
    const endpoint = new Group();
    endpoint.userData = { appearanceType: 'endpoint:A', baseSize: .8, baseSignalRadius: .9 };
    applyEndpointAppearance(endpoint, true);
    close(endpoint.scale.x, .8 * 1.2 * .7); close(endpoint.userData.signalRadius, .9 * 1.6);
    applyEndpointAppearance(endpoint, true); close(endpoint.scale.x, .8 * 1.2 * .7);
    applyEndpointAppearance(endpoint, false); close(endpoint.scale.x, .8); close(endpoint.userData.signalRadius, .9);
  } finally { geometry.dispose(); configureMissions(catalog); }
});

test('screen editor fields persist through bank mutation and custom type duplication/removal', () => {
  const raw = edited();
  changeSystemField(raw, ['system','screenAppearance','sizes','core'], 1.7);
  assert.equal(parseMissionCatalog(raw).system.screenAppearance.sizes.core, 1.7);
  const html = renderBankDetail(raw, 'screen', 'core');
  assert.match(html, /Масштаб всех полей связи/); assert.match(html, /Масштаб этого типа/);
  assert.match(html, /value="false" selected/);
  assert.match(html, /value="1.7"/); assert.ok(!html.includes('data-command="delete"'));
  assert.equal(bankEntries(raw, 'screen').length, Object.keys(raw.system.objectTypes).length + 2);
  createBankEntry(raw, 'objects', 'custom-relay', 'core');
  assert.equal(raw.system.screenAppearance.sizes['custom-relay'], 1.7);
  removeBankEntry(raw, 'objects', 'custom-relay');
  assert.equal(raw.system.screenAppearance.sizes['custom-relay'], undefined);
  parseMissionCatalog(raw);
});

test('catalog-only save writes screen settings to public and dist, backs up source and rejects stale saves', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'screen-bank-save-'));
  try {
    await cp(resolve(root,'public/config'), resolve(directory,'public/config'), { recursive: true });
    await cp(resolve(root,'public/config'), resolve(directory,'dist/config'), { recursive: true });
    const before = await readFile(resolve(directory,'public/config/mission-system.json'), 'utf8');
    const shellBefore = await readFile(resolve(directory,'public/config/ui-shell.json'), 'utf8');
    const raw = edited();
    const saved = await saveProjectConfigs({ catalog: raw, scope: 'catalog', projectRoot: directory });
    for (const tree of ['public','dist']) {
      const loaded = await loadMissionCatalog('./config/missions/index.json', diskFetch(resolve(directory,tree)));
      assert.deepEqual(loaded.system.screenAppearance, profile);
      assert.deepEqual(loaded.objectSettings, catalog.objectSettings);
      assert.deepEqual(parseUiShellConfig(JSON.parse(await readFile(resolve(directory,tree,'config/ui-shell.json'), 'utf8'))), parseUiShellConfig(JSON.parse(shellBefore)));
    }
    assert.equal(await readFile(resolve(directory,'backups/editor',saved.backupId,'mission-system.json'), 'utf8'), before);
    await assert.rejects(saveProjectConfigs({ catalog: raw, scope: 'catalog', projectRoot: directory }), /Конфликт версии/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});


test('range hint can be hidden and restored without changing radius or wave geometry', () => {
  configureMissions(catalog); createMissionRun(1);
  const geometry = new BufferGeometry();
  const node = createNode({ id: 'hint', type: 'terminal', latitude: 60, longitude: 80 }, 'base', geometry);
  setNodeScreenConnections(node, true);
  node.userData.presence = 1;
  const radius = node.userData.signalRadius, plate = node.userData.plate.scale.clone();
  try {
    for (const showRangeCircle of [true, false, true]) {
      configureScreenAppearance({ ...catalog.system.screenAppearance, showRangeCircle });
      updateConnectionContour(node, true, new Quaternion());
      assert.equal(node.userData.connectionContour.visible, showRangeCircle);
      assert.equal(node.userData.signalRadius, radius);
      assert.deepEqual(node.userData.plate.scale, plate);
    }
    updateConnectionContour(node, false, new Quaternion());
    assert.equal(node.userData.connectionContour.visible, false);
  } finally {
    node.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    configureMissions(catalog);
  }
});
