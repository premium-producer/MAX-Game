/**
 * Commands carry intent, never a caller-provided next state or completion flag.
 * @typedef {{schemaVersion:1,type:'ACT',commandId:string,sessionId:string,contentRevision:string,missionId:string,taskId:string,screenId:string,expectedRevision:number,actionId:string}} GameCommand
 */
export const GAME_COMMAND_VERSION = 1;
const fields = ['schemaVersion', 'type', 'commandId', 'sessionId', 'contentRevision', 'missionId', 'taskId', 'screenId', 'expectedRevision', 'actionId'];
const token = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

/** Validate, copy and normalize field order for deterministic retry identity. */
export function assertGameCommand(value) {
  const fail = message => { throw new TypeError(`GameCommand: ${message}`); };
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('expected plain object');
  if (Object.keys(value).length !== fields.length || Object.keys(value).some(key => !fields.includes(key))) fail('unexpected or missing fields');
  if (value.schemaVersion !== GAME_COMMAND_VERSION || value.type !== 'ACT') fail('unsupported command');
  for (const key of fields.filter(key => !['schemaVersion', 'type', 'expectedRevision'].includes(key))) if (typeof value[key] !== 'string' || !token.test(value[key])) fail(`invalid ${key}`);
  if (!Number.isSafeInteger(value.expectedRevision) || value.expectedRevision < 0) fail('invalid expectedRevision');
  return Object.freeze(Object.fromEntries(fields.map(key => [key, value[key]])));
}
