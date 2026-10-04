export const MISSION_COMMAND_TYPES=['SELECT_MISSION','ACT','ADVANCE_RESULT','RETURN_MENU','RESTART_MISSION','RESET_PROGRESS','HOLD_CONFIRMED','OWNER_CHANGED','EXPIRE','AUTO_SCREEN'];
export const missionToken=v=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(v);
export function assertMissionCommand(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Command required');
 const keys=['schemaVersion','type','commandId','sessionId','contentRevision','expectedRevision','missionId','taskId','screenId','actionId','active'];
 if(Object.keys(input).some(k=>!keys.includes(k))||input.schemaVersion!==1||!MISSION_COMMAND_TYPES.includes(input.type))throw new TypeError('Invalid command');
 for(const k of ['commandId','sessionId','contentRevision'])if(!missionToken(input[k]))throw new TypeError(`Invalid ${k}`);
 if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)throw new TypeError('Invalid revision');
 if(input.type==='SELECT_MISSION'&&!missionToken(input.missionId))throw new TypeError('Invalid mission');
 if(['ACT','AUTO_SCREEN'].includes(input.type)&&(!missionToken(input.screenId)||!missionToken(input.actionId)))throw new TypeError('Invalid screen/action');
 if(input.type==='OWNER_CHANGED'&&typeof input.active!=='boolean')throw new TypeError('Invalid owner');
 return Object.fromEntries(keys.filter(k=>Object.hasOwn(input,k)).map(k=>[k,structuredClone(input[k])]));
}
export const deepFreeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(deepFreeze);Object.freeze(o);}return o;};
