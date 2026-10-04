import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build, transform} from 'esbuild';
import {MISSION_CATALOG} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const clone = value => structuredClone(value);

function thumbnailPath(asset) {
  return `thumbs/${asset.assetId.replace(/[^a-zA-Z0-9._-]/g, '_')}-${asset.sha256.slice(0, 12)}.webp`;
}

function auditAsset(asset, thumbnail = false) {
  if (!asset || !asset.path.startsWith('assets/') || asset.path.includes('..') || asset.path.includes('\\')) {
    throw Error('Invalid audit asset path');
  }
  return {...clone(asset), url: `../${asset.path}`, ...(thumbnail ? {thumbnailUrl: thumbnailPath(asset)} : {})};
}

/** Read-only projection of the exact installed release, never a gameplay profile. */
export function createAuditCatalog(catalog = MISSION_CATALOG) {
  const usedTasks = new Set();
  const usedScreens = new Set();
  const assets = Object.values(catalog.assets).map(asset => auditAsset(asset));
  const missions = Object.values(catalog.missions).map(mission => ({
    missionId: mission.missionId,
    title: mission.title,
    test: Boolean(mission.test),
    taskIds: [...mission.taskIds],
    tasks: mission.taskIds.map(taskId => {
      const task = catalog.tasks[taskId];
      if (!task) throw Error(`Unknown audit task: ${taskId}`);
      usedTasks.add(taskId);
      return {
        taskId,
        title: task.title,
        startScreenId: task.startScreenId,
        screens: Object.values(task.screens).map((screen, index) => {
          usedScreens.add(screen.screenId);
          return {
            screenId: screen.screenId,
            order: screen.origin?.screenOrder ?? index + 1,
            deviceKind: screen.deviceKind,
            assetId: screen.assetId,
            asset: screen.assetId ? auditAsset(catalog.assets[screen.assetId], true) : null,
            instruction: screen.instruction,
            mode: screen.mode,
            automaticMs: screen.automaticMs ?? null,
            missing: clone(screen.missing ?? null),
            actions: clone(screen.actions),
          };
        }),
      };
    }),
  }));
  const unattached = Object.keys(catalog.tasks).filter(taskId => !usedTasks.has(taskId));
  if (unattached.length) throw Error(`Tasks outside missions: ${unattached.join(', ')}`);
  return {
    schemaVersion: 1,
    contentRevision: catalog.contentRevision,
    source: 'vendor/backend-figma-v2',
    missions,
    assets,
    counts: {
      missions: missions.length,
      tasks: usedTasks.size,
      screens: missions.reduce((n, mission) => n + mission.tasks.reduce((sum, task) => sum + task.screens.length, 0), 0),
      uniqueScreens: usedScreens.size,
      assets: assets.length,
    },
  };
}

function inside(root, relative) {
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(root + path.sep)) throw Error(`Unsafe build path: ${relative}`);
  return resolved;
}

export async function buildAssetAudit() {
  const output = path.resolve(source, '../../apps/max-game/asset-audit');
  const runtime = path.dirname(output);
  const release = path.join(source, 'vendor/backend-figma-v2');
  const releaseManifestBytes = await fs.readFile(path.join(release, 'manifest.json'));
  const releaseManifest = JSON.parse(releaseManifestBytes);
  if (releaseManifest.sourceRelease.revision !== MISSION_CATALOG.contentRevision) throw Error('Audit release/catalog mismatch');
  for (const [name, hash] of Object.entries(releaseManifest.files)) {
    if (sha(await fs.readFile(inside(release, name))) !== hash) throw Error(`Installed release changed: ${name}`);
  }
  const catalog = createAuditCatalog();
  // Reuse already installed shared assets. No writes, replacements or fallback editions.
  for (const asset of catalog.assets) {
    if (sha(await fs.readFile(inside(runtime, asset.path))) !== asset.sha256) {
      throw Error(`Shared runtime asset differs: ${asset.path}`);
    }
  }
  const compiled = await build({
    entryPoints: [path.join(source, 'src/asset-audit/main.mjs')],
    nodePaths: [path.join(source, 'node_modules')],
    bundle: true, format: 'esm', platform: 'browser', target: ['es2022'],
    outfile: path.join(output, 'app.js'),
    minify: true, write: false, metafile: true, legalComments: 'inline',
  });
  const serverFile=path.resolve(source,'../service/max-game/asset-audit-store.mjs');
  const server=await build({entryPoints:[path.join(source,'src/asset-audit/server-store.mjs')],bundle:true,platform:'node',format:'esm',target:'node22',outfile:serverFile,write:false,metafile:true});
  await fs.writeFile(serverFile,server.outputFiles[0].contents);
  const files = new Map(compiled.outputFiles.map(file => [path.relative(output, file.path).replaceAll('\\', '/'), file.contents]));
  const notices=[await fs.readFile(path.join(source,'public/asset-audit/annotorious-license.txt'),'utf8')];
  const packages=new Set([...Object.keys(compiled.metafile.inputs),...Object.keys(server.metafile.inputs)].map(name=>name.replaceAll('\\','/').split('node_modules/').pop()).filter(name=>name&&!name.startsWith('artifacts/')).map(name=>name.startsWith('@')?name.split('/').slice(0,2).join('/'):name.split('/')[0]));
  for(const name of packages){
    const dir=path.join(source,'node_modules',name);
    const pkg=await fs.readFile(path.join(dir,'package.json'),'utf8').then(JSON.parse).catch(()=>null);if(!pkg)continue;
    notices.push(`\n${pkg.name} ${pkg.version} — ${pkg.license}\n`);
    for(const file of await fs.readdir(dir))if(/^licen[cs]e(?:\.|$)/i.test(file))notices.push(await fs.readFile(path.join(dir,file),'utf8'));
  }
  const noticeText=notices.join('\n').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  files.set('third-party-notices.html',Buffer.from('<!doctype html><meta charset="utf-8"><title>MAX · Licenses</title><pre>'+noticeText+'</pre>'));
  files.set('catalog.json', Buffer.from(JSON.stringify(catalog, null, 2) + '\n'));
  const {default: sharp} = await import('sharp');
  const screenAssets = new Map(catalog.missions.flatMap(mission => mission.tasks.flatMap(task => task.screens.filter(screen => screen.asset).map(screen => [screen.assetId, screen.asset]))));
  for (const asset of screenAssets.values()) {
    const thumbnail = await sharp(inside(runtime, asset.path))
      .resize({width: 440, height: 520, fit: 'inside', withoutEnlargement: true})
      .webp({quality: 78}).toBuffer();
    files.set(thumbnailPath(asset), thumbnail);
  }
  for (const name of ['index.html', 'audit.css']) files.set(name, await fs.readFile(path.join(source, 'public/asset-audit', name)));
  const css = await transform(files.get('audit.css').toString(), {loader: 'css', sourcefile: 'audit.css'});
  if (css.warnings.length) throw Error(`Audit CSS warnings: ${JSON.stringify(css.warnings)}`);
  const prior = await fs.readFile(path.join(output, 'build.json'), 'utf8').then(JSON.parse).catch(error => {
    if (error.code === 'ENOENT') return {files: {}};
    throw error;
  });
  for (const [name, bytes] of files) {
    const current = await fs.readFile(path.join(output, name)).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (current && sha(current) !== sha(bytes) && sha(current) !== prior.files[name]) throw Error(`Runtime changed outside audit builder: ${name}`);
  }
  const manifest = {
    profile: 'max-asset-audit', entry: 'asset-audit/',
    contentRevision: catalog.contentRevision, counts: catalog.counts,
    backendManifestSha256: sha(releaseManifestBytes), files: {}, inputs: {}, assets: {},
    serverSha256: sha(server.outputFiles[0].contents),
  };
  const inputs = new Set([
    ...Object.keys(compiled.metafile.inputs).map(name => path.resolve(name)),
    ...Object.keys(server.metafile.inputs).map(name => path.resolve(name)),
    fileURLToPath(import.meta.url),
    path.join(release, 'manifest.json'),
    ...Object.keys(releaseManifest.files).filter(name => name.endsWith('.mjs')).map(name => inside(release, name)),
    path.join(source, 'public/asset-audit/index.html'),
    path.join(source, 'public/asset-audit/audit.css'),
    path.join(source, 'public/asset-audit/annotorious-license.txt'),
  ]);
  for (const input of inputs) manifest.inputs[path.relative(source, input).replaceAll('\\', '/')] = sha(await fs.readFile(input));
  for (const asset of catalog.assets) manifest.assets[asset.path] = asset.sha256;
  await fs.mkdir(output, {recursive: true});
  for (const [name, bytes] of files) {
    await fs.mkdir(path.dirname(path.join(output, name)), {recursive: true});
    await fs.writeFile(path.join(output, name), bytes);
    manifest.files[name] = sha(bytes);
  }
  await fs.writeFile(path.join(output, 'build.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({profile: manifest.profile, files: files.size, ...catalog.counts}));
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildAssetAudit();
