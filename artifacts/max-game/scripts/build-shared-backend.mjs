import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {checkSharedBoundaries} from './check-shared-boundaries.mjs';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = value => createHash('sha256').update(value).digest('hex');
const groups = ['contracts', 'core', 'content', 'application', 'migration', 'development', 'adapters', 'client-runtime'];
async function walk(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, {withFileTypes:true}).catch(error => { if (error.code === 'ENOENT') return []; throw error; })) {
    if (entry.isSymbolicLink()) throw new Error(`Symlink forbidden: ${entry.name}`);
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(name)); else files.push(name);
  }
  return files;
}

/** Same raw ESM modules and content manifest are consumed by each future adapter. */
export async function collectSharedBackendFiles({sourceRoot = source, includeAssets = false} = {}) {
  const guard = await checkSharedBoundaries(path.join(sourceRoot, 'src'));
  if (!guard.ok) throw new Error(`Shared boundaries violated: ${JSON.stringify(guard.violations)}`);
  const files = new Map(), catalogs = [], missionCatalogs = [];
  for (const group of groups) for (const filename of await walk(path.join(sourceRoot, 'src', group))) {
    if (!/\.(?:mjs|js|json)$/.test(filename)) throw new Error(`Unsupported shared module: ${filename}`);
    const name = path.relative(sourceRoot, filename).replaceAll('\\', '/');
    files.set(name, await fs.readFile(filename));
    if (group === 'content' && filename.endsWith('.mjs')) {
      const exported = await import(pathToFileURL(filename).href);
      for (const item of Object.values(exported)) if (item?.schemaVersion === 1 && item?.taskId && item?.screens && item?.assets && !catalogs.includes(item)) catalogs.push(item);
      for (const item of Object.values(exported)) if (item?.schemaVersion === 1 && item?.missions && item?.tasks && item?.assets && !missionCatalogs.includes(item)) missionCatalogs.push(item);
    }
  }
  const assets = {}, tasks = [];
  const missions = [];
  for (const catalog of missionCatalogs) {
    for (const mission of Object.values(catalog.missions)) missions.push({...mission,contentRevision:catalog.contentRevision});
    for (const task of Object.values(catalog.tasks)) tasks.push({taskId:task.taskId,contentRevision:catalog.contentRevision,startScreenId:task.startScreenId,catalogHash:digest(JSON.stringify(task))});
  }
  for (const catalog of [...catalogs, ...missionCatalogs]) {
    if (catalog.taskId) tasks.push({missionId:catalog.missionId, taskId:catalog.taskId, contentRevision:catalog.contentRevision, startScreenId:catalog.startScreenId, catalogHash:digest(JSON.stringify(catalog))});
    for (const asset of Object.values(catalog.assets)) {
      if (asset.kind === 'missing' || asset.missing === true || !asset.path) continue;
      const filename = path.resolve(sourceRoot, 'public', asset.path), relative = path.relative(path.join(sourceRoot, 'public'), filename);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Unsafe asset path');
      const bytes = await fs.readFile(filename), sha256 = digest(bytes);
      if (asset.sha256 && asset.sha256 !== sha256) throw new Error(`Asset digest changed: ${asset.assetId}`);
      if (assets[asset.assetId] && assets[asset.assetId].sha256 !== sha256) throw new Error(`Conflicting asset ID: ${asset.assetId}`);
      assets[asset.assetId] = {...asset, sha256};
      if (includeAssets) files.set(asset.path, bytes);
    }
  }
  const taskVersions=new Map();
  for(const task of tasks){
    const key=JSON.stringify([task.contentRevision,task.taskId]);
    if(taskVersions.has(key))throw new Error(`Duplicate task version: ${key}`);
    taskVersions.set(key,task.catalogHash);
  }
  for(const catalog of missionCatalogs)for(const mission of Object.values(catalog.missions)){
    for(const taskId of mission.taskIds)if(!Object.hasOwn(catalog.tasks,taskId))throw new Error(`Mission references missing task: ${taskId}`);
    for(const task of Object.values(catalog.tasks))for(const screen of Object.values(task.screens)){
      if(screen.assetId&&!Object.hasOwn(catalog.assets,screen.assetId))throw new Error(`Screen references missing asset: ${screen.screenId}`);
      if(screen.actions.some(action=>action.outcome?.screenId&&!Object.hasOwn(task.screens,action.outcome.screenId)))throw new Error(`Screen references missing successor: ${screen.screenId}`);
    }
  }
  const modules = Object.fromEntries([...files].filter(([name]) => name.startsWith('src/')).map(([name, bytes]) => [name, digest(bytes)]));
  const manifest = {schemaVersion:1, application:'MAX shared backend', format:'esm',
    assetBase:includeAssets ? './' : '../', tasks, missions, assets, modules,
    versions:{content:[...new Set(tasks.map(task=>task.contentRevision))],rules:['task-rules-v1','mission-rules-v1']},
    contentHash:digest(JSON.stringify({tasks, missions, assets})), moduleHash:digest(JSON.stringify(modules)),
    rendererActivation:'none', migration:'explicit-only', persistence:'external-port',
    files:Object.fromEntries([...files].map(([name, bytes])=>[name,digest(bytes)]))};
  files.set('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));
  return {files, manifest};
}

export async function writeSharedBackendBundle(target,{files,manifest}) {
  const previous=await fs.readFile(path.join(target,'manifest.json'),'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return {files:{}};throw error;});
  const previousFiles=previous.files??{...previous.modules,...Object.fromEntries(Object.values(previous.assets??{}).map(asset=>[asset.path,asset.sha256]))};
  // Only replace/prune bytes owned by the previous generated manifest.
  for(const [name,bytes] of files){
    if(name==='manifest.json')continue;
    const current=await fs.readFile(path.join(target,name)).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
    if(current&&digest(current)!==digest(bytes)&&previousFiles[name]!==digest(current))throw new Error(`Shared output changed by user: ${name}`);
  }
  for(const [name,hash] of Object.entries(previousFiles))if(!files.has(name)){
    const filename=path.resolve(target,name),relative=path.relative(target,filename);
    if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Unsafe old shared output path');
    const current=await fs.readFile(filename).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
    if(current&&digest(current)!==hash)throw new Error(`Stale shared output changed by user: ${name}`);
    if(current)await fs.unlink(filename);
  }
  for (const [name, bytes] of files) { const filename = path.join(target, name); await fs.mkdir(path.dirname(filename), {recursive:true}); await fs.writeFile(filename, bytes); }
  return {target,files:files.size,tasks:manifest.tasks.length,assets:Object.keys(manifest.assets).length};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = path.resolve(source, '../../artifacts/workspace/dist/max-shared-backend');
  console.log(JSON.stringify(await writeSharedBackendBundle(target,await collectSharedBackendFiles({includeAssets:true}))));
}
