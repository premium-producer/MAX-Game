// Reviewed presentation data patch; the stand base supplies the accepted core/contracts.
import catalog from '../reviewed-content/mission-catalog.json' with {type:'json'};
import {deepFreeze} from '../contracts/mission-command.mjs';
export const MISSION_CONTENT_REVISION=catalog.contentRevision;
export const MISSION_CATALOG=deepFreeze(catalog);
