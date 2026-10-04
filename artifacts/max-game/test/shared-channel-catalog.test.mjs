import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CHANNEL_CATALOG as catalog} from '../src/content/channel-catalog.mjs';
import {assertTaskCatalog, freezeTaskCatalog} from '../src/contracts/task-catalog.mjs';
import {CHANNEL_SCREENS as source} from '../public/site-game/channel-task.mjs';

const sid = key => `blogger.channel.${key}`;
const clone = () => structuredClone(catalog);
const originalActions = {
  plus:'channel.open-create-menu', channel:'channel.choose-create', example:'channel.fill-name-example',
  create:'channel.create', private:'channel.choose-private', public:'channel.choose-public',
  continue:'channel.continue-private', keep:'channel.keep-old-link', new:'channel.use-new-link',
  'link-example':'channel.fill-link-example', 'continue-public':'channel.save-public-link',
  'skip-invites':'channel.skip-invites', button:'channel.complete',
};

test('catalog loads in Node as immutable plain JSON with stable IDs', () => {
  assert.equal(assertTaskCatalog(catalog), catalog);
  assert.equal(catalog.missionId, 'blogger');
  assert.equal(catalog.taskId, 'blogger.channel');
  assert.equal(Object.keys(catalog.screens).length, 10);
  assert.equal(Object.keys(catalog.assets).length, 10);
  assert.deepEqual(JSON.parse(JSON.stringify(catalog)), catalog);
  assert.throws(() => { catalog.screens[sid('chats')].actions[0].rect[0] = 0; }, TypeError);
  assert.throws(() => { catalog.assets['client.frame-91504'].path = 'other.png'; }, TypeError);
});

test('first extraction preserves all current instructions, targets and completion button', () => {
  for (const [key, screen] of Object.entries(source)) {
    const canonical = catalog.screens[sid(key)];
    assert.equal(canonical.instruction, screen.copy);
    assert.equal(canonical.assetId, `client.frame-${screen.frame}`);
    assert.equal(canonical.deviceKind, 'phone');
    assert.equal(canonical.actions.length, (screen.actions?.length ?? 0) + Number(!!screen.button));
    for (const action of screen.actions ?? []) {
      const canonicalAction = canonical.actions.find(a => a.actionId === originalActions[action.id]);
      assert.ok(canonicalAction, action.id);
      assert.equal(canonicalAction.label, action.label);
      assert.deepEqual(canonicalAction.rect, action.rect);
      assert.equal(canonicalAction.placement, 'hotspot');
      assert.equal(canonicalAction.outcome.screenId, sid(action.to));
    }
    if (screen.button) {
      assert.equal(canonical.actions[0].label, screen.button.label);
      assert.equal(canonical.actions[0].placement, 'below-screen');
      assert.equal(canonical.actions[0].outcome.kind, 'complete-task');
    }
    assert.deepEqual(canonical.annotations.map(a => a.text), screen.header ? [screen.header] : []);
  }
});

// Walk declared data only; no gameplay reducer or animation controller is involved.
function route(actionIds) {
  let screenId = catalog.startScreenId, channelType = 'private', terminal = false;
  for (const actionId of actionIds) {
    const action = catalog.screens[screenId].actions.find(a => a.actionId === actionId);
    assert.ok(action, `${actionId} unavailable at ${screenId}`);
    const {outcome} = action;
    if (outcome.answer) channelType = outcome.answer.value;
    if (outcome.kind === 'complete-task') terminal = true;
    else screenId = outcome.screenId;
  }
  return {screenId, channelType, terminal};
}
const common = ['channel.open-create-menu', 'channel.choose-create', 'channel.fill-name-example', 'channel.create'];

test('private and public graphs reach the same terminal without losing the chosen type', () => {
  assert.deepEqual(route([...common, 'channel.choose-private', 'channel.continue-private', 'channel.skip-invites', 'channel.complete']), {screenId:sid('created'), channelType:'private', terminal:true});
  assert.deepEqual(route([...common, 'channel.choose-public', 'channel.use-new-link', 'channel.fill-link-example', 'channel.save-public-link', 'channel.skip-invites', 'channel.complete']), {screenId:sid('created'), channelType:'public', terminal:true});
  assert.equal(route([...common, 'channel.continue-private', 'channel.skip-invites']).terminal, false);
});

test('keeping the old link explicitly returns to private, including a later public retry', () => {
  assert.deepEqual(route([...common, 'channel.choose-public', 'channel.keep-old-link']), {screenId:sid('privacy'), channelType:'private', terminal:false});
  assert.equal(route([...common, 'channel.choose-public', 'channel.keep-old-link', 'channel.choose-public', 'channel.use-new-link', 'channel.fill-link-example', 'channel.save-public-link']).channelType, 'public');
});

test('manifest hashes and dimensions describe original source and shipped Site bytes', () => {
  for (const asset of Object.values(catalog.assets)) {
    const bytes = readFileSync(new URL(`../public/${asset.path}`, import.meta.url));
    const site = readFileSync(new URL(`../public/site-game/client-media/frame-${asset.origin.frameId}.png`, import.meta.url));
    assert.deepEqual(bytes, site);
    assert.equal(bytes.readUInt32BE(16), asset.width);
    assert.equal(bytes.readUInt32BE(20), asset.height);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  }
});

test('public header correction is a common annotation in native image coordinates', () => {
  for (const key of ['public-link', 'public-filled']) {
    const annotation = catalog.screens[sid(key)].annotations[0];
    assert.equal(annotation.kind, 'text-replacement');
    assert.equal(annotation.text, 'Публичный канал создан');
    assert.deepEqual(annotation.rect, [7.2, 106, 345.6, 42]);
  }
});

test('validation rejects invalid geometry, references, IDs, JSON and impossible graphs', async t => {
  const cases = [
    ['unsupported version', c => { c.schemaVersion = 2; }, /unsupported contract/],
    ['invalid ID', c => { c.missionId = 'Стать блогером'; }, /stable ID/],
    ['missing start', c => { c.startScreenId = sid('missing'); }, /unknown screen/],
    ['unknown asset', c => { c.screens[sid('chats')].assetId = 'missing'; }, /unknown asset/],
    ['wrong map ID', c => { c.screens[sid('chats')].screenId = sid('menu'); }, /map key/],
    ['duplicate action', c => { c.screens[sid('menu')].actions[0].actionId = 'channel.open-create-menu'; }, /duplicate actionId/],
    ['unknown target', c => { c.screens[sid('chats')].actions[0].outcome.screenId = sid('missing'); }, /unknown target/],
    ['outside hotspot', c => { c.screens[sid('chats')].actions[0].rect = [340, 54, 48, 48]; }, /outside asset/],
    ['negative annotation', c => { c.screens[sid('public-link')].annotations[0].rect[0] = -1; }, /outside asset/],
    ['invalid choice', c => { c.screens[sid('privacy')].actions[0].outcome.answer.value = 'other'; }, /invalid answer/],
    ['null choice', c => { c.screens[sid('privacy')].actions[0].outcome.answer = null; }, /invalid answer/],
    ['portable path', c => { c.assets['client.frame-91504'].path = 'assets/../secrets/file.png'; }, /portable asset/],
    ['callback', c => { c.screens[sid('chats')].callback = () => {}; }, /JSON data/],
    ['class instance', c => { c.runtime = new Date(); }, /plain object/],
    ['cycle', c => { c.cycle = c; }, /cyclic data/],
    ['unreachable screen', c => { c.screens[sid('chats')].actions[0].outcome.screenId = sid('privacy'); }, /unreachable/],
    ['no completion route', c => { c.screens[sid('created')].actions[0].outcome = {kind:'navigate', screenId:sid('created')}; }, /no route to completion/],
  ];
  for (const [name, mutate, pattern] of cases) await t.test(name, () => {
    const value = clone(); mutate(value);
    assert.throws(() => assertTaskCatalog(value), pattern);
  });
});

test('a validated JSON export can be frozen again without renderer dependencies', () => {
  const imported = freezeTaskCatalog(JSON.parse(JSON.stringify(catalog)));
  assert.deepEqual(imported, catalog);
  for (const path of ['../src/contracts/task-catalog.mjs', '../src/content/channel-catalog.mjs']) {
    const code = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(code, /^import.*(?:three|site-game|journey-webgl|node:)/m);
    assert.doesNotMatch(code, /\b(?:document|window|localStorage|requestAnimationFrame)\b/);
  }
});

test('a shallow frozen root cannot leave nested catalog data mutable', () => {
  const input = Object.freeze(structuredClone(catalog));
  freezeTaskCatalog(input);
  assert.equal(Object.isFrozen(input.screens['blogger.channel.chats'].actions[0].rect), true);
  assert.throws(() => { input.screens['blogger.channel.chats'].actions[0].rect[0] = 10; }, TypeError);
});
