import {assertTaskCatalog} from '../contracts/task-catalog.mjs';
import {assertGameCommand} from '../contracts/game-command.mjs';

export const GAME_STATE_VERSION = 1;
export const GAME_RULES_REVISION = 'task-rules-v1';

/**
 * First kernel slice: one active task. Mission orchestration is a later layer.
 * @typedef {{schemaVersion:1,rulesRevision:string,contentRevision:string,sessionId:string,scenarioId:string,missionId:string,taskId:string,screenId:string,revision:number,status:'active'|'completed',answers:Record<string,string>,completion:null|{commandId:string,taskId:string,revision:number}}} GameState
 * @typedef {{command:import('../contracts/game-command.mjs').GameCommand,reply:object}} CommandReceipt
 * @typedef {{schemaVersion:1,state:GameState,receipts:CommandReceipt[]}} GameModel
 */
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const token = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
};

/** No clock, storage, browser or renderer is needed to start a run. */
export function createGameModel(catalog, {sessionId, scenarioId = 'guided-reveal'}) {
  assertTaskCatalog(catalog);
  if (!token(sessionId) || !token(scenarioId)) throw new TypeError('Invalid session/scenario ID');
  return freeze({schemaVersion:GAME_STATE_VERSION, state:{
    schemaVersion:GAME_STATE_VERSION, rulesRevision:GAME_RULES_REVISION,
    contentRevision:catalog.contentRevision, sessionId, scenarioId,
    missionId:catalog.missionId, taskId:catalog.taskId, screenId:catalog.startScreenId,
    revision:0, status:'active', answers:{}, completion:null,
  }, receipts:[]});
}

function assertModel(catalog, model) {
  const state = model?.state;
  if (!plain(model) || model.schemaVersion !== GAME_STATE_VERSION || !plain(state) || !Array.isArray(model.receipts)) throw new TypeError('Invalid GameModel');
  if (state.schemaVersion !== GAME_STATE_VERSION || state.rulesRevision !== GAME_RULES_REVISION || state.contentRevision !== catalog.contentRevision) throw new TypeError('Incompatible state/content/rules version');
  if (!token(state.sessionId) || !token(state.scenarioId) || state.missionId !== catalog.missionId || state.taskId !== catalog.taskId || !Object.hasOwn(catalog.screens, state.screenId)) throw new TypeError('Invalid state identity');
  if (!Number.isSafeInteger(state.revision) || state.revision < 0 || state.revision !== model.receipts.length || !plain(state.answers) || !['active', 'completed'].includes(state.status)) throw new TypeError('Invalid state progress');
  if ((state.status === 'active' && state.completion !== null) || (state.status === 'completed' && (!plain(state.completion) || state.completion.taskId !== state.taskId || state.completion.revision !== state.revision || !token(state.completion.commandId)))) throw new TypeError('Invalid completion');
}

/**
 * Pure dispatch. Receipts are separate from GameState and future persistence.
 * reply is stable on retry; effects are emitted only for a NEW accepted command.
 */
export function dispatchGameCommand(catalog, model, input) {
  assertTaskCatalog(catalog);
  assertModel(catalog, model);
  const reject = code => ({model, reply:freeze({ok:false, code, snapshot:model.state}), effects:[], duplicate:false});
  let command;
  try { command = assertGameCommand(input); } catch { return reject('INVALID_COMMAND'); }
  const previous = model.receipts.find(receipt => receipt.command.commandId === command.commandId);
  if (previous) {
    if (JSON.stringify(previous.command) !== JSON.stringify(command)) return reject('COMMAND_ID_REUSED');
    return {model, reply:previous.reply, effects:[], duplicate:true};
  }
  const state = model.state;
  if (command.sessionId !== state.sessionId || command.missionId !== state.missionId || command.taskId !== state.taskId) return reject('WRONG_CONTEXT');
  if (command.contentRevision !== state.contentRevision) return reject('CONTENT_CONFLICT');
  if (command.expectedRevision !== state.revision) return reject('REVISION_CONFLICT');
  if (command.screenId !== state.screenId) return reject('SCREEN_CONFLICT');
  if (state.status === 'completed') return reject('TASK_ALREADY_COMPLETED');
  const action = catalog.screens[state.screenId].actions.find(item => item.actionId === command.actionId);
  if (!action) return reject('ACTION_UNAVAILABLE');
  if (state.revision === Number.MAX_SAFE_INTEGER) return reject('REVISION_LIMIT');

  const revision = state.revision + 1, {outcome} = action;
  const completed = outcome.kind === 'complete-task';
  const next = freeze({...state, revision,
    screenId:completed ? state.screenId : outcome.screenId,
    status:completed ? 'completed' : 'active',
    answers:outcome.answer ? {...state.answers, [outcome.answer.kind]:outcome.answer.value} : {...state.answers},
    completion:completed ? {commandId:command.commandId, taskId:state.taskId, revision} : null,
  });
  const reply = freeze({ok:true, code:'APPLIED', commandId:command.commandId, snapshot:next});
  const nextModel = Object.freeze({schemaVersion:GAME_STATE_VERSION, state:next, receipts:Object.freeze([...model.receipts, freeze({command, reply})])});
  const effects = [];
  if (outcome.answer) effects.push({type:'ANSWER_RECORDED', taskId:state.taskId, answer:{...outcome.answer}});
  if (next.screenId !== state.screenId) effects.push({type:'SCREEN_CHANGED', taskId:state.taskId, screenId:next.screenId});
  if (completed) effects.push({type:'TASK_COMPLETED', taskId:state.taskId, commandId:command.commandId});
  return {model:nextModel, reply, effects:freeze(effects), duplicate:false};
}

const sameJSON = (left, right) => {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => sameJSON(item, right[index]));
  if (!plain(left) || !plain(right)) return false;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every(key => Object.hasOwn(right, key) && sameJSON(left[key], right[key]));
};

/**
 * Restore ONLY this new format. Verify the small semantic receipt sequence;
 * no movement history, renderer phases or legacy numerical stages are replayed.
 * Invalid data returns no model and never invents a completion or answer.
 */
export function restoreGameModel(catalog, raw) {
  try {
    assertTaskCatalog(catalog);
    const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
    assertModel(catalog, saved);
    let model = createGameModel(catalog, {sessionId:saved.state.sessionId, scenarioId:saved.state.scenarioId});
    for (const receipt of saved.receipts) {
      if (!plain(receipt) || !plain(receipt.reply)) throw new TypeError('Invalid receipt');
      const result = dispatchGameCommand(catalog, model, receipt.command);
      if (!result.reply.ok || result.duplicate || !sameJSON(result.reply, receipt.reply)) throw new TypeError('Invalid receipt sequence');
      model = result.model;
    }
    if (!sameJSON(model, saved)) throw new TypeError('Snapshot does not match confirmed commands');
    return {ok:true, model};
  } catch (error) {
    return {ok:false, code:'INVALID_SAVED_STATE', message:error.message, model:null};
  }
}
