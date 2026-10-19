import {missionToken} from './mission-command.mjs';

const fail = code => Object.assign(new Error(code), {code});
const fields = ['schemaVersion','assignmentId','slotId','expectedGeneration','sessionId','missionId','contentRevision'];
/** Canonical field order makes exact durable retries independent of JSON key order. */
export function assertMissionAssignment(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).length !== fields.length || Object.keys(input).some(key => !fields.includes(key)) ||
      input.schemaVersion !== 1 || !Number.isSafeInteger(input.expectedGeneration) || input.expectedGeneration < 0 ||
      ['assignmentId','sessionId','missionId','contentRevision'].some(key => !missionToken(input[key]))) throw fail('INVALID_ASSIGNMENT');
  if (input.slotId !== 'main') throw fail('INVALID_SLOT');
  return Object.fromEntries(fields.map(key => [key, input[key]]));
}
