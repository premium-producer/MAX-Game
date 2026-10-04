/**
 * Renderer-independent content contract, v1. All coordinates use asset pixels.
 * @typedef {{kind:'channel-type', value:'private'|'public'}} ChannelAnswer
 * @typedef {{kind:'navigate', screenId:string, answer?:ChannelAnswer}|{kind:'complete-task'}} ActionOutcome
 * @typedef {{actionId:string, label:string, placement:'hotspot'|'below-screen', rect?:number[], outcome:ActionOutcome}} TaskAction
 * @typedef {{annotationId:string, kind:'text-replacement', text:string, rect:number[]}} TextAnnotation
 * @typedef {{screenId:string, deviceKind:'phone'|'pc', mode:'manual'|'choice'|'automatic', assetId:string, instruction:string, actions:TaskAction[], annotations:TextAnnotation[]}} TaskScreen
 * @typedef {{assetId:string, path:string, mimeType:'image/png', width:number, height:number, sha256:string, origin:{kind:string, frameId:number}}} TaskAsset
 * @typedef {{schemaVersion:1, contentRevision:string, missionId:string, taskId:string, startScreenId:string, assets:Record<string,TaskAsset>, screens:Record<string,TaskScreen>}} TaskCatalog
 */

export const TASK_CATALOG_VERSION = 1;
const ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const fail = (path, message) => { throw new TypeError(`${path}: ${message}`); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = (value, path) => { if (typeof value !== 'string' || !ID.test(value)) fail(path, 'invalid stable ID'); };
const text = (value, path) => { if (typeof value !== 'string' || !value.trim()) fail(path, 'expected non-empty text'); };

// A content export must be ordinary JSON, not callbacks, DOM, textures or class instances.
function json(value, path, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (!object(value) && !Array.isArray(value)) fail(path, 'expected JSON data');
  if (ancestors.has(value)) fail(path, 'cyclic data');
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(path, 'expected plain object');
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) json(child, `${path}.${key}`, ancestors);
  ancestors.delete(value);
}

function rect(value, asset, path) {
  if (!Array.isArray(value) || value.length !== 4 || !value.every(Number.isFinite)) fail(path, 'expected [x,y,width,height]');
  const [x, y, width, height] = value;
  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > asset.width || y + height > asset.height) fail(path, 'outside asset bounds');
}

/** Validate references, geometry and graph before publishing content. @param {TaskCatalog} catalog */
export function assertTaskCatalog(catalog) {
  json(catalog, 'catalog');
  if (!object(catalog)) fail('catalog', 'expected object');
  if (catalog.schemaVersion !== TASK_CATALOG_VERSION) fail('schemaVersion', 'unsupported contract version');
  for (const key of ['contentRevision', 'missionId', 'taskId', 'startScreenId']) id(catalog[key], key);
  for (const key of ['assets', 'screens']) if (!object(catalog[key]) || !Object.keys(catalog[key]).length) fail(key, 'expected non-empty map');
  if (!Object.hasOwn(catalog.screens, catalog.startScreenId)) fail('startScreenId', 'unknown screen');

  for (const [key, asset] of Object.entries(catalog.assets)) {
    id(key, `assets.${key}`);
    if (!object(asset) || asset.assetId !== key) fail(`assets.${key}`, 'assetId must match map key');
    if (typeof asset.path !== 'string' || !/^assets\/[a-zA-Z0-9/_-]+\.png$/.test(asset.path)) fail(`assets.${key}.path`, 'expected portable asset path');
    if (asset.mimeType !== 'image/png') fail(`assets.${key}.mimeType`, 'unsupported image type in v1');
    for (const size of ['width', 'height']) if (!Number.isSafeInteger(asset[size]) || asset[size] <= 0) fail(`assets.${key}.${size}`, 'expected positive integer');
    if (typeof asset.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(asset.sha256)) fail(`assets.${key}.sha256`, 'expected SHA-256');
    if (!object(asset.origin) || asset.origin.kind !== 'client-frame' || !Number.isSafeInteger(asset.origin.frameId) || asset.origin.frameId <= 0) fail(`assets.${key}.origin`, 'expected original client frame');
  }

  const actionIds = new Set(), annotationIds = new Set();
  for (const [key, screen] of Object.entries(catalog.screens)) {
    id(key, `screens.${key}`);
    if (!object(screen) || screen.screenId !== key) fail(`screens.${key}`, 'screenId must match map key');
    if (!['phone', 'pc'].includes(screen.deviceKind)) fail(`${key}.deviceKind`, 'expected phone or pc');
    if (!['manual', 'choice', 'automatic'].includes(screen.mode)) fail(`${key}.mode`, 'invalid interaction mode');
    text(screen.instruction, `${key}.instruction`);
    if (!Object.hasOwn(catalog.assets, screen.assetId)) fail(`${key}.assetId`, 'unknown asset');
    const asset = catalog.assets[screen.assetId];
    if (!Array.isArray(screen.actions) || !screen.actions.length) fail(`${key}.actions`, 'expected actions');
    if (!Array.isArray(screen.annotations)) fail(`${key}.annotations`, 'expected array');
    for (const action of screen.actions) {
      if (!object(action)) fail(`${key}.actions`, 'expected action object');
      id(action.actionId, `${key}.actionId`); text(action.label, `${key}.label`);
      if (actionIds.has(action.actionId)) fail(action.actionId, 'duplicate actionId');
      actionIds.add(action.actionId);
      if (action.placement === 'hotspot') rect(action.rect, asset, `${action.actionId}.rect`);
      else if (action.placement !== 'below-screen' || action.rect !== undefined) fail(action.actionId, 'invalid placement');
      const outcome = action.outcome;
      if (!object(outcome)) fail(action.actionId, 'expected outcome');
      if (outcome.kind === 'navigate') {
        if (!Object.hasOwn(catalog.screens, outcome.screenId)) fail(action.actionId, 'unknown target screen');
        if (Object.hasOwn(outcome, 'answer') && (!object(outcome.answer) || outcome.answer.kind !== 'channel-type' || !['private', 'public'].includes(outcome.answer.value))) fail(action.actionId, 'invalid answer');
      } else if (outcome.kind !== 'complete-task' || outcome.screenId !== undefined || outcome.answer !== undefined) fail(action.actionId, 'invalid outcome');
    }
    for (const annotation of screen.annotations) {
      if (!object(annotation)) fail(key, 'expected annotation object');
      id(annotation.annotationId, `${key}.annotationId`);
      if (annotationIds.has(annotation.annotationId)) fail(annotation.annotationId, 'duplicate annotationId');
      annotationIds.add(annotation.annotationId);
      if (annotation.kind !== 'text-replacement') fail(annotation.annotationId, 'invalid annotation kind');
      text(annotation.text, `${annotation.annotationId}.text`);
      rect(annotation.rect, asset, `${annotation.annotationId}.rect`);
    }
  }

  const reachable = new Set();
  function visit(screenId) {
    if (reachable.has(screenId)) return;
    reachable.add(screenId);
    for (const action of catalog.screens[screenId].actions) if (action.outcome.kind === 'navigate') visit(action.outcome.screenId);
  }
  visit(catalog.startScreenId);
  if (reachable.size !== Object.keys(catalog.screens).length) fail('screens', 'unreachable screen');
  const canComplete = new Set(Object.values(catalog.screens).filter(s => s.actions.some(a => a.outcome.kind === 'complete-task')).map(s => s.screenId));
  let changed = true;
  while (changed) {
    changed = false;
    for (const screen of Object.values(catalog.screens)) if (!canComplete.has(screen.screenId) && screen.actions.some(a => a.outcome.kind === 'navigate' && canComplete.has(a.outcome.screenId))) { canComplete.add(screen.screenId); changed = true; }
  }
  if (canComplete.size !== reachable.size) fail('screens', 'screen has no route to completion');
  return catalog;
}

/** Validate and freeze a source catalog. Consumers must not mutate content into progress. */
export function freezeTaskCatalog(catalog) {
  assertTaskCatalog(catalog);
  const freeze = value => { if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); if (!Object.isFrozen(value)) Object.freeze(value); } return value; };
  return freeze(catalog);
}
