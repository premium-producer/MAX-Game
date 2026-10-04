import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createSqlitePersistencePort} from './sqlite-persistence.mjs';
import {createMaxGameApi} from './http-api.mjs';

/** Missing configuration means disabled. A build does not activate the backend. */
export function readMaxGameConfig(projectRoot) {
  const file=path.join(projectRoot,'apps/stand-service/configs/max-game.json');
  if (!fs.existsSync(file)) return {enabled:false};
  if(fs.lstatSync(file).isSymbolicLink())throw new Error('INVALID_MAX_GAME_CONFIG');
  const settings=JSON.parse(fs.readFileSync(file,'utf8'));
  if (settings.schema !== 'max-game-backend/v1' || typeof settings.enabled !== 'boolean') throw new Error('INVALID_MAX_GAME_CONFIG');
  return settings;
}

export function resolveMaxGameDatabase(projectRoot, settings) {
  if (settings.profile !== 'sqlite') throw new Error('MAX_GAME_SQLITE_PROFILE_REQUIRED');
  const root=path.resolve(projectRoot,'apps/stand-service/configs/runtime-data');
  const relative=settings.database ?? 'max-game.sqlite';
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes(':')) throw new Error('INVALID_MAX_GAME_DATABASE');
  const target=path.resolve(root,relative), fromRoot=path.relative(root,target);
  if (!fromRoot || fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) throw new Error('INVALID_MAX_GAME_DATABASE');
  // Reject existing symlink parents before the worker creates any file.
  let cursor=target;
  while(cursor !== path.resolve(projectRoot)) { if(fs.existsSync(cursor)&&fs.lstatSync(cursor).isSymbolicLink()) throw new Error('INVALID_MAX_GAME_DATABASE');cursor=path.dirname(cursor); }
  return target;
}

/** Host authority. Imports the same portable core/catalog used by future adapters. */
export async function createMaxGameBackend({projectRoot,mode='dev',settings=readMaxGameConfig(projectRoot),authorize,now=Date.now}) {
  if (!settings.enabled) return null;
  const databasePath=resolveMaxGameDatabase(projectRoot,settings);
  const source=path.join(projectRoot,mode==='dev'?'artifacts/max-game/src':'apps/max-game/shared/src');
  const [{MISSION_CATALOG},{createMissionSessionApplication}]=await Promise.all([
    import(pathToFileURL(path.join(source,'content/mission-catalog.mjs'))),
    import(pathToFileURL(path.join(source,'application/mission-session.mjs'))),
  ]);
  const persistence=await createSqlitePersistencePort({databasePath});
  let application;
  try {
    application=createMissionSessionApplication({catalog:MISSION_CATALOG,persistence,now});
    const api=createMaxGameApi({application,catalog:MISSION_CATALOG,authorize,now});
    // One semantic timer drives hold/expiry, independent of rendering or frame rate.
    const pulse=setInterval(()=>{api.sweep().catch(()=>{});},100);pulse.unref();
    return Object.freeze({handle:api.handle,async close(){clearInterval(pulse);try{await api.close();}finally{await persistence.close();}}});
  } catch(cause) { await application?.close();await persistence.close();throw cause; }
}
