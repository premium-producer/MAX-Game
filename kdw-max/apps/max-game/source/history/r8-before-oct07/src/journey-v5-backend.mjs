import catalog from './reviewed-content/mission-catalog.json' with {type:'json'};
import {createKdwCatalog} from './kdw-interactions-model.mjs';
import {deepFreeze} from './contracts/mission-command.mjs';
import {createMissionSessionApplication} from './application/mission-session.mjs';
export const V5_MISSION_CATALOG=deepFreeze(createKdwCatalog(catalog));
export const createV5MissionSessionApplication=(options={})=>createMissionSessionApplication({...options,catalog:options.catalog??V5_MISSION_CATALOG});
