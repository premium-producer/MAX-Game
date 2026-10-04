// Approved content compiled against the pinned backend; engine and old saves stay intact.
import catalog from './reviewed-content/mission-catalog.json' with {type:'json'};
import {deepFreeze} from '../vendor/backend-figma-v2/src/contracts/mission-command.mjs';
import {createMissionSessionApplication} from '../vendor/backend-figma-v2/src/application/mission-session.mjs';
export const V5_MISSION_CATALOG=deepFreeze(catalog);
export const createV5MissionSessionApplication=(options={})=>createMissionSessionApplication({...options,catalog:options.catalog??V5_MISSION_CATALOG});
