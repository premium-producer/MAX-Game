import {MISSION_CATALOG} from '../content/mission-catalog.mjs';
import {createMissionModel, dispatchMissionCommand, restoreMissionModel} from '../core/mission-core.mjs';

/** Exact semantic version only; numerical legacy stages are never translated. */
export function createMissionImportCodec(catalog = MISSION_CATALOG) {
  return Object.freeze({
    create:sessionId => createMissionModel(catalog, {sessionId}),
    restore:raw => restoreMissionModel(catalog, raw),
    rebind(model, sessionId) {
      if (!restoreMissionModel(catalog, model).ok) throw new TypeError('Unconfirmed mission model');
      let rebound = createMissionModel(catalog, {sessionId});
      for (const receipt of model.receipts) {
        const result = dispatchMissionCommand(catalog, rebound, {...receipt.command, sessionId}, {now:receipt.now, internal:receipt.internal});
        if (!result.reply.ok) throw new TypeError('Mission receipt cannot be rebound');
        rebound = result.model;
      }
      return rebound;
    },
  });
}
