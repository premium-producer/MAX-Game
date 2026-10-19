import {createGameModel, dispatchGameCommand, restoreGameModel} from '../core/game-core.mjs';

export const SHARED_EXPORT_VERSION = 1;
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const token = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value);
function jsonCopy(value) {
  const visit = object => {
    if (object === null || typeof object === 'string' || typeof object === 'boolean' || (typeof object === 'number' && Number.isFinite(object))) return;
    if (!Array.isArray(object) && !plain(object)) throw new TypeError('JSON data required');
    for (const item of Object.values(object)) visit(item);
  };
  visit(value);
  return JSON.parse(JSON.stringify(value));
}
const freeze = value => { if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; };
const lookup = (catalogs, state) => catalogs.find(catalog => catalog.taskId === state?.taskId && catalog.contentRevision === state?.contentRevision);

/** Export only a caller-selected confirmed record. Never reads browser keys/files. */
export function createSharedSessionExport({record, catalogs, missionCodec}) {
  const copy = jsonCopy(record);
  if (copy.schemaVersion === 2 && missionCodec) {
    const restored = missionCodec.restore(copy.mission);
    if (!restored.ok) throw new TypeError('Invalid confirmed mission record');
    copy.mission = restored.model;
    const lastNow=restored.model.receipts.at(-1)?.now??0;
    copy.clockCheckpointAt??=lastNow;
    if(!Number.isSafeInteger(copy.clockCheckpointAt)||copy.clockCheckpointAt<lastNow)throw new TypeError('Invalid mission clock checkpoint');
  } else {
    const catalog = lookup(catalogs, copy.game?.state);
    if (copy.schemaVersion !== 1 || !catalog || !restoreGameModel(catalog, copy.game).ok) throw new TypeError('Invalid confirmed task record');
  }
  // Layout metadata is archived separately; runtime accepts only a known mapping.
  return freeze({format:'max-shared-session-export', schemaVersion:SHARED_EXPORT_VERSION, record:copy});
}

/**
 * Explicit conservative migration. Unknown legacy stages/versions remain in archive;
 * they NEVER become answers or completion. Repeating the same import is deterministic.
 * missionCodec provides pure create/restore/rebind backed by the mission kernel.
 * No writing of either source or target storage happens here.
 */
export function createExplicitImportArtifact({sourceProfileId, source, targetSessionId, catalogs = [], taskId, contentRevision, missionCodec}) {
  if (!token(sourceProfileId) || !token(targetSessionId)) throw new TypeError('Explicit source and target IDs required');
  const archive = jsonCopy(source);
  const envelope = plain(archive) && archive.format === 'max-shared-session-export' && archive.schemaVersion === SHARED_EXPORT_VERSION;
  let record, disposition = 'archived-unproven', reason = 'Legacy progress has no proven semantic mapping';
  if (missionCodec) {
    record = {schemaVersion:2, mission:missionCodec.create(targetSessionId), clockCheckpointAt:0, layouts:{layoutRevision:0, positions:{}, receipts:[]}};
    if (envelope && archive.record?.schemaVersion === 2) {
      const restored = missionCodec.restore(archive.record.mission);
      if (restored.ok) {
        const lastNow=restored.model.receipts.at(-1)?.now??0;
        const checkpoint=archive.record.clockCheckpointAt??lastNow;
        if(Number.isSafeInteger(checkpoint)&&checkpoint>=lastNow){
          record.mission = missionCodec.rebind(restored.model, targetSessionId);
          record.clockCheckpointAt=checkpoint;
          disposition = 'restored-confirmed'; reason = 'Versioned semantic receipts validated by mission kernel';
        }else reason='Invalid mission clock checkpoint';
      } else reason = 'Incompatible or invalid mission receipts';
    }
  } else {
    const catalog = lookup(catalogs, {taskId, contentRevision});
    if (!catalog) throw new TypeError('Explicit target catalog required');
    let game = createGameModel(catalog, {sessionId:targetSessionId});
    if (envelope && archive.record?.schemaVersion === 1) {
      const old = archive.record.game;
      if (old?.state?.taskId === catalog.taskId && old?.state?.contentRevision === catalog.contentRevision) {
        const restored = restoreGameModel(catalog, old);
        if (restored.ok) {
          game = createGameModel(catalog, {sessionId:targetSessionId, scenarioId:restored.model.state.scenarioId});
          for (const receipt of restored.model.receipts) {
            const result = dispatchGameCommand(catalog, game, {...receipt.command, sessionId:targetSessionId});
            if (!result.reply.ok) throw new TypeError('Confirmed receipt cannot be rebound');
            game = result.model;
          }
          disposition = 'restored-confirmed'; reason = 'Versioned semantic receipts validated by task kernel';
        } else reason = 'Invalid task receipts';
      } else reason = 'Target task/content version does not match';
    }
    record = {schemaVersion:1, game, layouts:{}};
  }
  return freeze({schemaVersion:1, format:'max-explicit-import', sourceProfileId, targetSessionId,
    disposition, reason, record, archive, layoutDisposition:'archived-no-known-mapping'});
}

/**
 * Host-only activation through explicit ports. ArchivePort.saveOnce(id, artifact)
 * MUST be durable and reject a reused ID with different content. The immutable
 * archive commits first; create-only target persistence never replaces a profile.
 */
export async function applyExplicitImport({artifact, persistence, archivePort, catalogs = [], missionCodec}) {
  if (artifact?.format !== 'max-explicit-import' || !token(artifact.targetSessionId) || !persistence?.createImported || !persistence?.getImportTarget || !persistence?.load || !archivePort?.saveOnce) throw new TypeError('Explicit artifact, atomic import PersistencePort and durable ArchivePort required');
  const captured = freeze(jsonCopy(artifact));
  const state = captured.record?.game?.state;
  const verified = createExplicitImportArtifact({sourceProfileId:captured.sourceProfileId, source:captured.archive,
    targetSessionId:captured.targetSessionId, catalogs, taskId:state?.taskId, contentRevision:state?.contentRevision, missionCodec});
  if (JSON.stringify(verified) !== JSON.stringify(captured)) throw new TypeError('Import artifact failed semantic validation');
  const saved = await archivePort.saveOnce(captured.targetSessionId, captured);
  if (!['created', 'existing-identical'].includes(saved)) throw new Error('Invalid archive acknowledgement');
  try {
    const version=await persistence.createImported(captured.targetSessionId, captured.record, {importId:captured.targetSessionId});
    if(version!==0)throw new Error('Invalid imported create acknowledgement');
    return {created:true, duplicate:false, record:captured.record};
  } catch (error) {
    if (error.code !== 'SESSION_EXISTS') throw error;
    const ownedTarget=await persistence.getImportTarget(captured.targetSessionId);
    if(ownedTarget!==captured.targetSessionId)throw Object.assign(new Error('Import has no atomic target ownership'),{code:'IMPORT_TARGET_CONFLICT'});
    const stored = await persistence.load(captured.targetSessionId);
    const current = stored?.record, expected = captured.record;
    const currentModel = current?.game ?? current?.mission, expectedModel = expected.game ?? expected.mission;
    // A later state is allowed only if it retains the exact imported command prefix.
    const sameIdentity = current?.schemaVersion === expected.schemaVersion && currentModel?.state?.sessionId === expectedModel.state.sessionId
      && currentModel.state.rulesRevision === expectedModel.state.rulesRevision && currentModel.state.contentRevision === expectedModel.state.contentRevision;
    const prefix = sameIdentity && Array.isArray(currentModel.receipts) && currentModel.receipts.length >= expectedModel.receipts.length
      && expectedModel.receipts.every((receipt, index) => JSON.stringify(receipt) === JSON.stringify(currentModel.receipts[index]));
    if (!prefix || saved !== 'existing-identical') throw Object.assign(new Error('Import target already belongs to another profile'), {code:'IMPORT_TARGET_CONFLICT'});
    return {created:false, duplicate:true, record:freeze(jsonCopy(current))};
  }
}
