export const MISSION_COMMAND_TYPES=['SELECT_MISSION','ACT','SAVE_INTERACTION','START_POSTS','PUBLISH_POST','START_STORE','PICK_PRODUCT','DEV_TIMER','RESTART_TASK','SKIP_TASK','ADVANCE_RESULT','RETURN_MENU','RESTART_MISSION','RESET_PROGRESS','STAND_READY','STAND_TOUCH','STAND_IDLE','HOLD_CONFIRMED','OWNER_CHANGED','EXPIRE','AUTO_SCREEN'];
export const missionToken=v=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(v);
export function assertMissionCommand(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Command required');
 const keys=['schemaVersion','type','commandId','sessionId','contentRevision','expectedRevision','missionId','taskId','screenId','actionId','active','value','spawnId','fresh','textPolicy'];
 if(Object.keys(input).some(k=>!keys.includes(k))||input.schemaVersion!==1||!MISSION_COMMAND_TYPES.includes(input.type))throw new TypeError('Invalid command');
 for(const k of ['commandId','sessionId','contentRevision'])if(!missionToken(input[k]))throw new TypeError(`Invalid ${k}`);
 if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)throw new TypeError('Invalid revision');
 if(input.type==='SELECT_MISSION'&&!missionToken(input.missionId))throw new TypeError('Invalid mission');
 if(Object.hasOwn(input,'fresh')&&(input.type!=='SELECT_MISSION'||typeof input.fresh!=='boolean'))throw new TypeError('Invalid fresh mission flag');
 if(['ACT','AUTO_SCREEN'].includes(input.type)&&(!missionToken(input.screenId)||!missionToken(input.actionId)))throw new TypeError('Invalid screen/action');
 if(input.type==='SAVE_INTERACTION'&&(!missionToken(input.taskId)||!missionToken(input.screenId)||!input.value||typeof input.value!=='object'))throw new TypeError('Invalid interaction');
 if(Object.hasOwn(input,'textPolicy')&&(!['SAVE_INTERACTION','ACT'].includes(input.type)||!['kdw-text-v1','kdw-text-v2'].includes(input.textPolicy)))throw new TypeError('Invalid text policy');
 if(['START_POSTS','PUBLISH_POST','START_STORE','PICK_PRODUCT'].includes(input.type)&&(!missionToken(input.taskId)||!missionToken(input.screenId)))throw new TypeError('Invalid posts context');
 if(['PUBLISH_POST','PICK_PRODUCT'].includes(input.type)&&!missionToken(input.spawnId))throw new TypeError('Invalid spawn');
 if(!['PUBLISH_POST','PICK_PRODUCT'].includes(input.type)&&Object.hasOwn(input,'spawnId'))throw new TypeError('Unexpected spawn');
 if(input.type!=='SAVE_INTERACTION'&&Object.hasOwn(input,'value'))throw new TypeError('Unexpected interaction');
 if(input.type==='OWNER_CHANGED'&&typeof input.active!=='boolean')throw new TypeError('Invalid owner');
 if(input.type==='DEV_TIMER'&&(typeof input.active!=='boolean'||Object.keys(input).some(k=>!['schemaVersion','type','commandId','sessionId','contentRevision','expectedRevision','active'].includes(k))))throw new TypeError('Invalid development timer');
 if(['RESTART_TASK','SKIP_TASK'].includes(input.type)&&(!missionToken(input.taskId)||Object.keys(input).some(k=>!['schemaVersion','type','commandId','sessionId','contentRevision','expectedRevision','taskId'].includes(k))))throw new TypeError('Invalid task control');
 // The session authority compares durable retries before this validator. Keep
 // the wire key order for the two new semantic commands so their saved receipt
 // matches an identical retry; historical command normalization stays intact.
 const order=['START_POSTS','PUBLISH_POST','START_STORE','PICK_PRODUCT','DEV_TIMER','RESTART_TASK','SKIP_TASK'].includes(input.type)?Object.keys(input):keys;
 return Object.fromEntries(order.filter(k=>Object.hasOwn(input,k)).map(k=>[k,structuredClone(input[k])]));
}
export const deepFreeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(deepFreeze);Object.freeze(o);}return o;};
