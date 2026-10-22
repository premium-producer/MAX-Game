import catalog from './reviewed-content/mission-catalog.json' with {type:'json'};
import {createKdwCatalog} from './kdw-interactions-model.mjs';
import {BUSINESS_ORIGINAL} from './kdw-business-original.mjs';
import {deepFreeze} from './contracts/mission-command.mjs';
import {createMissionSessionApplication} from './application/mission-session.mjs';
import {TASK_CLOCK_RULES_REVISION} from './core/mission-core.mjs';
export const V5_MISSION_CATALOG=deepFreeze(createKdwCatalog(catalog,{businessScreens:BUSINESS_ORIGINAL?'original':'custom'}));
export const createV5MissionSessionApplication=(options={})=>createMissionSessionApplication({...options,catalog:options.development?{...(options.catalog??V5_MISSION_CATALOG),kdwDevelopment:true}:options.catalog??V5_MISSION_CATALOG,missionRulesRevision:TASK_CLOCK_RULES_REVISION});
