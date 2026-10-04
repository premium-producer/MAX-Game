import { readFile } from "node:fs/promises";
import { parseMissionCatalog } from "../src/mission-config.mjs";
import { configureMissions, configurePlacementSurface } from "../src/mission-game.mjs";

export const rawMissionCatalog = JSON.parse(await readFile(new URL("../public/config/missions.json", import.meta.url), "utf8"));
export const missionCatalog = parseMissionCatalog(rawMissionCatalog);
configureMissions(missionCatalog);
// Existing topology/altitude fixtures intentionally use synthetic coordinates.
// Terrain behavior is exercised separately with the shipped mask in surface-map.test.
export const testLandSurface = Object.freeze({ sample: () => 0 });
configurePlacementSurface(testLandSurface);
