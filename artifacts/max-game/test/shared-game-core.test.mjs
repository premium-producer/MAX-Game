import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHANNEL_CATALOG as catalog} from '../src/content/channel-catalog.mjs';
import {assertGameCommand} from '../src/contracts/game-command.mjs';
import {createGameModel, dispatchGameCommand, restoreGameModel} from '../src/core/game-core.mjs';

let serial = 0;
const create = sessionId => createGameModel(catalog, {sessionId:sessionId ?? `session-${++serial}`});
function command(model, actionId, overrides = {}) {
  const s = model.state;
  return {schemaVersion:1, type:'ACT', commandId:`command-${++serial}`, sessionId:s.sessionId,
    contentRevision:s.contentRevision, missionId:s.missionId, taskId:s.taskId,
    screenId:s.screenId, expectedRevision:s.revision, actionId, ...overrides};
}
function act(model, actionId) {
  const result = dispatchGameCommand(catalog, model, command(model, actionId));
  assert.equal(result.reply.ok, true, result.reply.code);
  return result;
}
const prefix = ['channel.open-create-menu', 'channel.choose-create', 'channel.fill-name-example', 'channel.create'];
const privatePath = [...prefix, 'channel.choose-private', 'channel.continue-private', 'channel.skip-invites', 'channel.complete'];
const publicPath = [...prefix, 'channel.choose-public', 'channel.use-new-link', 'channel.fill-link-example', 'channel.save-public-link', 'channel.skip-invites', 'channel.complete'];
function walk(actions, initial = create()) {
  let model = initial;
  const effects = [];
  for (const action of actions) {
    const result = act(model, action);
    model = result.model; effects.push(...result.effects);
  }
  return {model, effects};
}

test('initial state has no fabricated answers/completion and no presentation state', () => {
  const model = create();
  assert.deepEqual(model.state.answers, {});
  assert.equal(model.state.revision, 0);
  assert.equal(model.state.status, 'active');
  assert.equal(model.state.completion, null);
  assert.equal(model.state.screenId, catalog.startScreenId);
  assert.deepEqual(JSON.parse(JSON.stringify(model)), model);
  assert.equal(Object.isFrozen(model.state.answers), true);
  for (const key of ['phase', 'loading', 'elapsed', 'positions', 'phone', 'texture']) assert.equal(Object.hasOwn(model.state, key), false);
});

test('private/public complete exactly once; arriving at created alone is not completion', () => {
  for (const [path, type] of [[privatePath, 'private'], [publicPath, 'public']]) {
    const {model:before} = walk(path.slice(0, -1));
    assert.equal(before.state.screenId, 'blogger.channel.created');
    assert.equal(before.state.status, 'active');
    assert.equal(before.state.completion, null);
    const result = act(before, 'channel.complete');
    assert.equal(result.model.state.answers['channel-type'], type);
    assert.equal(result.model.state.status, 'completed');
    assert.equal(result.model.state.completion.commandId, result.reply.commandId);
    assert.equal(result.effects.filter(e => e.type === 'TASK_COMPLETED').length, 1);
    const repeated = dispatchGameCommand(catalog, result.model, command(result.model, 'channel.complete'));
    assert.equal(repeated.reply.code, 'TASK_ALREADY_COMPLETED');
    assert.equal(repeated.model, result.model);
    assert.deepEqual(repeated.effects, []);
  }
});

test('private selection on the same screen is a real recorded answer, not a lost tap', () => {
  const {model:before} = walk(prefix);
  const result = act(before, 'channel.choose-private');
  assert.equal(result.model.state.screenId, before.state.screenId);
  assert.equal(result.model.state.revision, before.state.revision + 1);
  assert.equal(result.model.state.answers['channel-type'], 'private');
  assert.deepEqual(result.effects.map(e => e.type), ['ANSWER_RECORDED']);
});

test('return to old link changes public to private and allows another public attempt', () => {
  const {model} = walk([...prefix, 'channel.choose-public', 'channel.keep-old-link']);
  assert.equal(model.state.answers['channel-type'], 'private');
  assert.equal(model.state.screenId, 'blogger.channel.privacy');
  assert.equal(walk(['channel.choose-public', 'channel.use-new-link', 'channel.fill-link-example', 'channel.save-public-link'], model).model.state.answers['channel-type'], 'public');
});

test('accepted retry returns original reply after later actions, with no repeated effects', () => {
  const first = create(), input = command(first, 'channel.open-create-menu');
  const accepted = dispatchGameCommand(catalog, first, input);
  const later = act(accepted.model, 'channel.choose-create').model;
  const retry = dispatchGameCommand(catalog, later, {...input});
  assert.equal(retry.duplicate, true);
  assert.equal(retry.reply, accepted.reply);
  assert.equal(retry.model, later);
  assert.deepEqual(retry.effects, []);
  assert.equal(retry.reply.snapshot.revision, 1);
  assert.equal(retry.model.state.revision, 2);
  const reused = dispatchGameCommand(catalog, later, {...input, actionId:'channel.choose-create'});
  assert.equal(reused.reply.code, 'COMMAND_ID_REUSED');
  assert.equal(reused.model, later);
});

test('completion retry after JSON restore is the same receipt and never a new credit', () => {
  const {model} = walk(publicPath);
  const restored = restoreGameModel(catalog, JSON.stringify(model));
  assert.equal(restored.ok, true);
  assert.deepEqual(restored.model, model);
  const receipt = model.receipts.at(-1);
  const retry = dispatchGameCommand(catalog, restored.model, receipt.command);
  assert.equal(retry.duplicate, true);
  assert.deepEqual(retry.reply, receipt.reply);
  assert.deepEqual(retry.effects, []);
  assert.equal(retry.model.state.revision, model.state.revision);
});

test('stale revision/screen, another session/task and unavailable actions leave state intact', async t => {
  const model = walk(prefix).model;
  const cases = [
    [{expectedRevision:model.state.revision - 1}, 'REVISION_CONFLICT'],
    [{screenId:catalog.startScreenId}, 'SCREEN_CONFLICT'],
    [{sessionId:'another-session'}, 'WRONG_CONTEXT'],
    [{missionId:'digital-id'}, 'WRONG_CONTEXT'],
    [{taskId:'blogger.statistics'}, 'WRONG_CONTEXT'],
    [{contentRevision:'another-content'}, 'CONTENT_CONFLICT'],
    [{actionId:'channel.complete'}, 'ACTION_UNAVAILABLE'],
    [{actionId:'missing-action'}, 'ACTION_UNAVAILABLE'],
  ];
  for (const [overrides, code] of cases) await t.test(code + JSON.stringify(overrides), () => {
    const result = dispatchGameCommand(catalog, model, command(model, 'channel.choose-public', overrides));
    assert.equal(result.reply.code, code);
    assert.equal(result.model, model); assert.deepEqual(result.effects, []);
  });
});

test('malformed commands cannot set answers, the next screen or completion', async t => {
  const model = create();
  for (const [name, override] of Object.entries({
    completed:{completed:true}, answers:{answers:{'channel-type':'public'}}, state:{state:{}},
    unsupported:{type:'SET_DONE'}, fraction:{expectedRevision:0.5}, negative:{expectedRevision:-1},
    unknownVersion:{schemaVersion:2}, missingId:{commandId:''}, invalidId:{commandId:'bad id'},
  })) await t.test(name, () => {
    const result = dispatchGameCommand(catalog, model, command(model, 'channel.open-create-menu', override));
    assert.equal(result.reply.code, 'INVALID_COMMAND'); assert.equal(result.model, model);
  });
});

test('every intermediate screen restores without re-answering or losing the selected type', () => {
  for (const path of [privatePath, publicPath]) {
    let model = create();
    for (const action of path) {
      model = act(model, action).model;
      const result = restoreGameModel(catalog, JSON.stringify(model));
      assert.equal(result.ok, true); assert.deepEqual(result.model, model);
      model = result.model;
    }
  }
  assert.deepEqual(restoreGameModel(catalog, create()).model.state.answers, {});
});

test('restore rejects invented progress, missing receipts, changed rules and legacy stage saves', async t => {
  const saved = walk(publicPath).model;
  const cases = [
    ['invented answer', s => { s.state.answers['channel-type'] = 'private'; }],
    ['fabricated receipt answer', s => { s.receipts[0].reply.snapshot.answers['channel-type'] = 'public'; }],
    ['missing receipts', s => { s.receipts = []; }],
    ['extra completion', s => { s.state.completion.commandId = 'another-completion'; }],
    ['stage only', s => { s.state.stage = 10; }],
    ['wrong rules', s => { s.state.rulesRevision = 'other-rules'; }],
    ['wrong content', s => { s.state.contentRevision = 'other-content'; }],
    ['unknown screen', s => { s.state.screenId = 'missing'; }],
    ['reordered commands', s => { [s.receipts[0], s.receipts[1]] = [s.receipts[1], s.receipts[0]]; }],
    ['lost completion action', s => { s.receipts.at(-1).command.actionId = 'channel.skip-invites'; }],
  ];
  for (const [name, mutate] of cases) await t.test(name, () => {
    const input = structuredClone(saved); mutate(input);
    const before = JSON.stringify(input), result = restoreGameModel(catalog, input);
    assert.equal(result.ok, false); assert.equal(result.model, null);
    assert.equal(JSON.stringify(input), before);
  });
  assert.equal(restoreGameModel(catalog, '{').ok, false);
  assert.equal(restoreGameModel(catalog, {version:2, screen:'created', completed:true}).ok, false);
  assert.equal(restoreGameModel(catalog, {stage:3, done:true, answers:[]}).ok, false);
});

test('dispatch is immutable, commands normalize ordering, and sessions stay independent', () => {
  const first = create(), second = create();
  const input = command(first, 'channel.open-create-menu');
  const reordered = Object.fromEntries(Object.entries(input).reverse());
  assert.deepEqual(assertGameCommand(input), assertGameCommand(reordered));
  const before = JSON.stringify(first), result = dispatchGameCommand(catalog, first, input);
  assert.equal(JSON.stringify(first), before); assert.equal(second.state.revision, 0);
  assert.equal(Object.isFrozen(result.model.receipts.at(-1).reply.snapshot), true);
  const retry = dispatchGameCommand(catalog, result.model, reordered);
  assert.equal(retry.duplicate, true);
  const completed = walk(privatePath).model;
  const mutable = structuredClone(completed);
  restoreGameModel(catalog, mutable);
  assert.equal(Object.isFrozen(mutable.state), false);
});

test('kernel follows the supplied catalog instead of hardcoding a mission or rendering system', () => {
  const alternate = structuredClone(catalog);
  alternate.missionId = 'demo-benefit'; alternate.taskId = 'demo-benefit.example';
  alternate.startScreenId = 'blogger.channel.menu';
  delete alternate.screens['blogger.channel.chats'];
  const model = createGameModel(alternate, {sessionId:'alternate'});
  const result = dispatchGameCommand(alternate, model, command(model, 'channel.choose-create'));
  assert.equal(result.reply.ok, true);
  assert.equal(result.model.state.missionId, 'demo-benefit');
  assert.equal(result.model.state.screenId, 'blogger.channel.name');
  for (const path of ['../src/core/game-core.mjs', '../src/contracts/game-command.mjs']) {
    const code = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(code, /^import.*(?:content|site-game|three|node:)/m);
    assert.doesNotMatch(code, /\b(?:localStorage|requestAnimationFrame|setTimeout|performance|document|window)\b/);
  }
});
