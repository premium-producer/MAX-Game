import assert from "node:assert/strict";
import test from "node:test";
import { Color } from "three";
import { missionStatus, nextMissionToPlay } from "../src/game-state.mjs";
import { setMissionSurfaceAnchorStatus } from "../src/webgl-field.js";

const material = () => ({ color: new Color(), opacity: 1, userData: { baseOpacity: 1 } });
const anchor = () => ({ userData: { statusMaterials: [material()], beaconMaterial: material(), broadcastPlate: { visible: false } } });

test("broadcast follows the playable mission through progress, completion and reset", () => {
  const order = [1, 2, 3];
  const missions = order.map((number) => ({ number, unlock: { requiresCompleted: order.slice(0, number - 1) } }));
  const anchors = missions.map(anchor);
  const plates = anchors.map((group) => group.userData.broadcastPlate);
  for (const completed of [[], [1], [1, 2], [1, 2, 3], []]) {
    const playable = nextMissionToPlay(completed, order);
    missions.forEach((mission, index) => setMissionSurfaceAnchorStatus(anchors[index], missionStatus(mission, completed), mission.number === playable));
    assert.deepEqual(anchors.map((group) => group.userData.broadcastPlate.visible), order.map((number) => number === playable));
    anchors.forEach((group, index) => assert.equal(group.userData.broadcastPlate, plates[index]));
    for (const number of completed) assert.equal(anchors[number - 1].userData.statusMaterials[0].color.getHex(), 0x21c994);
  }
});

test("locked, completed and other open missions cannot broadcast", () => {
  const group = anchor();
  for (const [status, active] of [["locked", true], ["completed", true], ["open", false], ["open", undefined]]) {
    setMissionSurfaceAnchorStatus(group, status, active);
    assert.equal(group.userData.broadcastPlate.visible, false);
  }
  setMissionSurfaceAnchorStatus(group, "open", true);
  assert.equal(group.userData.broadcastPlate.visible, true);
});
