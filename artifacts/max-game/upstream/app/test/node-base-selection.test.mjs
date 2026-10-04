import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import './config-fixture.mjs';
import { createNode, setNodeAnchorSelected, updateNodeSelection, updateNodeTransform } from '../src/webgl-field.js';

const makeNode = (id, type = 'terminal') => createNode({ id, type, latitude: 60, longitude: 80, altitude: type === 'satellite' ? .72 : .08 }, 'base', new THREE.PlaneGeometry(.1, .1));
const selectImmediately = (node, selected) => { setNodeAnchorSelected(node, selected); updateNodeSelection(node, 0, true); };
const dispose = node => node.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });

test('selected base replaces rings/beacon, keeps hit targets and stays tangent after moving', () => {
  const node = makeNode(1), anchor = node.userData.anchor;
  const hitTargets = [...node.userData.hitTargets], originalPosition = node.position.clone();
  const geometry = anchor.moveArrows.geometry;
  assert.equal(anchor.restingBase.visible, true);
  assert.equal(anchor.moveArrows.visible, false);
  selectImmediately(node, true);
  assert.equal(anchor.restingBase.visible, false);
  assert.equal(anchor.moveArrows.visible, true);
  assert.deepEqual(node.userData.hitTargets, hitTargets);
  assert.ok(node.position.equals(originalPosition));
  assert.equal(anchor.moveArrows.parent, anchor.group);
  assert.ok(node.userData.supportMaterials.includes(anchor.moveArrows.material));
  geometry.computeBoundingBox();
  for (const axis of ['x', 'y']) {
    assert.ok(Math.abs(geometry.boundingBox.max[axis] - .116) < 1e-6);
    assert.ok(Math.abs(geometry.boundingBox.min[axis] + .116) < 1e-6);
  }
  updateNodeTransform(node, { ...node.userData.placement, latitude: 30, longitude: 15 });
  assert.ok(new THREE.Vector3(0, 0, 1).applyQuaternion(anchor.group.quaternion).distanceTo(node.position.clone().normalize()) < 1e-10);
  for (let index = 0; index < 5; index++) {
    selectImmediately(node, false);
    assert.equal(anchor.restingBase.visible, true);
    assert.equal(anchor.moveArrows.visible, false);
    selectImmediately(node, true);
    assert.equal(anchor.moveArrows.geometry, geometry);
  }
  node.userData.removing = true;
  selectImmediately(node, true);
  assert.equal(anchor.moveArrows.visible, false);
  let released = false;
  geometry.addEventListener('dispose', () => { released = true; });
  dispose(node);
  assert.ok(released);
});

test('real hover/selection update shows arrows only for the selected tap object', () => {
  const first = makeNode(1), second = makeNode(2), satellite = makeNode(3, 'satellite');
  const source = readFileSync(new URL('../src/webgl-field.js', import.meta.url), 'utf8');
  const start = source.indexOf('  const setHoveredHitTarget =');
  const context = vm.createContext({ nodesById: new Map([[1, first], [2, second]]),
    tapControls: true, selectedPlacementId: null, hoveredHitTarget: null, draggedNode: null,
    renderer: { domElement: { style: {} } }, currentSelectedItem: null, setNodeAnchorSelected,
    hit: { userData: { placement: first.userData.placement } },
  });
  vm.runInContext(source.slice(start, source.indexOf('  const onPointerDown =', start)), context);
  const update = () => { vm.runInContext('setHoveredHitTarget(hit, true)', context); [first, second].forEach(node => updateNodeSelection(node, 0, true)); };
  update();
  assert.equal(first.userData.anchor.moveArrows.visible, false, 'hover is not selection');
  context.selectedPlacementId = 1; update();
  assert.equal(first.userData.anchor.moveArrows.visible, true);
  context.selectedPlacementId = 2; update();
  assert.equal(first.userData.anchor.moveArrows.visible, false);
  assert.equal(second.userData.anchor.moveArrows.visible, true);
  context.selectedPlacementId = null; update();
  assert.equal(second.userData.anchor.moveArrows.visible, false);
  context.selectedPlacementId = 1; context.tapControls = false; update();
  assert.equal(first.userData.anchor.moveArrows.visible, false, 'drag mode restores base');
  assert.equal(satellite.userData.anchor, null);
  assert.doesNotThrow(() => setNodeAnchorSelected(satellite, true));
  [first, second, satellite].forEach(dispose);
});


test('selection crossfades base and neon border together, reverses continuously and respects presence/reduced motion', () => {
  const node = makeNode(1), data = node.userData, anchor = data.anchor;
  data.presence = .6;
  setNodeAnchorSelected(node, true);
  assert.equal(data.selection, 0, 'input only changes target');
  updateNodeSelection(node, 1 / 60);
  const first = data.selection;
  assert.ok(first > 0 && first < 1);
  assert.equal(anchor.restingBase.visible, true);
  assert.equal(anchor.moveArrows.visible, true);
  assert.equal(data.material.uniforms.uSelection.value, first);
  assert.equal(anchor.moveArrows.material.uniforms.uOpacity.value, .6 * first);
  assert.equal(anchor.group.userData.beaconMaterial.opacity, .96 * .6 * (1 - first));
  setNodeAnchorSelected(node, false);
  assert.equal(data.selection, first, 'reversal does not reset the rendered state');
  updateNodeSelection(node, 1 / 60);
  assert.ok(data.selection > 0 && data.selection < first);
  setNodeAnchorSelected(node, true);
  updateNodeSelection(node, 0, true);
  assert.equal(data.selection, 1);
  assert.equal(anchor.restingBase.visible, false);
  data.presence = 0;
  updateNodeSelection(node, 1 / 60);
  assert.equal(anchor.moveArrows.material.uniforms.uOpacity.value, 0, 'hidden node cannot leave arrows behind');
  assert.equal(anchor.group.userData.beaconMaterial.opacity, 0);
  setNodeAnchorSelected(node, false);
  updateNodeSelection(node, 0, true);
  assert.equal(data.selection, 0);
  assert.equal(anchor.moveArrows.visible, false);
  dispose(node);
});

test('selection uses normal blending above waves so solid #659DFC is independent of the background', () => {
  const node = makeNode(1), data = node.userData;
  const outline = data.selectionOutline, arrows = data.anchor.moveArrows;
  for (const mesh of [outline, arrows]) {
    assert.equal(mesh.material.blending, THREE.NormalBlending);
    assert.equal(mesh.material.toneMapped, false);
    assert.ok(mesh.renderOrder > data.plate.renderOrder);
    assert.ok(mesh.material.fragmentShader.includes('const vec3 selectionColor = vec3(101.0, 157.0, 252.0) / 255.0;'));
  }
  assert.equal(outline.parent, data.plate, 'outline inherits all icon radius/scale changes');
  assert.equal(outline.material.uniforms.uSelection, data.material.uniforms.uSelection);
  assert.equal(outline.material.uniforms.uPresence, data.material.uniforms.uPresence);
  assert.ok(data.material.fragmentShader.includes('coreBorder * (1.0 - uSelection)'));
  assert.ok(outline.material.fragmentShader.includes('max(border, halo * 0.35)'));
  assert.equal(outline.visible, false);
  data.presence = 1;
  selectImmediately(node, true);
  assert.equal(outline.visible, true);
  // Normal alpha compositing must preserve the requested solid ink even on snow.
  const ink = [101, 157, 252];
  for (const background of [[0, 0, 0], [20, 70, 120], [255, 255, 255]]) {
    const alpha = arrows.material.uniforms.uOpacity.value;
    assert.deepEqual(ink.map((value, index) => value * alpha + background[index] * (1 - alpha)), ink);
  }
  selectImmediately(node, false);
  assert.equal(outline.visible, false);
  let released = false;
  outline.material.addEventListener('dispose', () => { released = true; });
  dispose(node);
  assert.ok(released);
});
