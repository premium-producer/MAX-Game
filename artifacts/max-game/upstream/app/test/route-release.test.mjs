import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const block = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

test('PLACE, MOVE and cancelled release flush a fresh committed projection even inside the frame throttle', () => {
  for (const action of ['PLACE', 'MOVE', 'cancel']) {
    const events = [], mission = { number: 2, engineVersion: 2, inventory: {} };
    const network = { complete: false, objectives: {}, states: {}, links: [], paths: {} };
    let meshes;
    const ctx = vm.createContext({ appReady: true, state: { screen: 'play' }, STATES: { MISSION_PLAY: 'play' },
      missionRun: { mission: 2, status: 'playing', placements: [{ id: 1, longitude: 10 }] },
      MISSIONS: { 2: mission }, ITEM_TYPES: {}, webglMission: 2, connectionPreview: null,
      connectionRevision: 7, connectionFrameAt: 1000, connectionBoundsDirty: false,
      connectionBounds: {}, connectionUiSignature: '', activeScreenTransition: null,
      document: { hidden: false }, Date: { now: () => 1000 }, placementSession: 0, audioAdapter: null,
      withProjectedLayout: run => run, usesScreenConnections: () => true, screenReady: () => false,
      reduceMission(run, change) {
        if (change.type === 'CONNECTION_VIEW') return { ...run, connectionProjection: change.snapshot };
        return { ...run, placements: [{ id: 1, longitude: 80 }] };
      },
      deriveNetwork: () => network, deriveMissionFeedback: () => [], applyMissionFeedback: n => n,
      t: key => key, scheduleNodeWakeup() {}, renderOutcomePopup() {},
      renderMissionStatus(_m, _p, _i, _msg, _n, options) { events.push(['footer', options.immediate]); },
      webglField: {
        update({ placements }) { meshes = placements; events.push(['mesh', placements[0].longitude]); },
        captureConnections(run) {
          assert.equal(meshes, run.placements);
          events.push(['capture', meshes[0].longitude]);
          return { revision: 7, interacting: true, placements: meshes, nodes: {} };
        },
      },
    });
    vm.runInContext(block('function renderMission(', 'function renderMissionShell(')
      + block('function updateMission(', 'function placementErrorReason(')
      + block('function updateConnectionView(', 'function startTimer('), ctx);
    if (action === 'cancel') ctx.renderMission({ routeReleased: true });
    else ctx.updateMission({ type: action });
    assert.deepEqual(events, [['mesh', action === 'cancel' ? 10 : 80], ['capture', action === 'cancel' ? 10 : 80],
      ['mesh', action === 'cancel' ? 10 : 80], ['footer', true]]);
  }
});

test('Arctic success popup is centered at 68% of the game frame regardless of endpoint projection', () => {
  const positions = [], popup = {};
  const ctx = vm.createContext({ shellConfig: { geometry: { outerInset: 20, headerHeight: 90, frameGap: 10 } },
    STATES: { MISSION_PLAY: 'play' }, designViewport: { width: 1920, height: 1080 },
    resolveUiShellState: () => ({ frameRight: 280, frameBottom: 144 }),
    setOutcomePopupPosition: (_popup, x, y) => positions.push([x, y]),
    webglField: { projectGeo() { throw Error('Arctic popup must not follow the endpoint'); } },
  });
  vm.runInContext(block('function positionOutcomePopup(', 'function setOutcomePopupPosition('), ctx);
  ctx.positionOutcomePopup(popup, { number: 2 }, 'success', null);
  assert.deepEqual(positions, [[830, 100 + (936 - 100) * 0.68]]);
  ctx.designViewport = { width: 1440, height: 900 };
  ctx.positionOutcomePopup(popup, { number: 2 }, 'success', null);
  assert.deepEqual(positions[1], [590, 100 + (756 - 100) * 0.68]);
});
