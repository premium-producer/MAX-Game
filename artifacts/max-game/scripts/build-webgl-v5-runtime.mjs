import {applyReviewedAssets} from './apply-reviewed-assets.mjs';
import {buildVideoFinale,buildGameServer} from './build-video-finale.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build,transform} from 'esbuild';
import {MISSION_CATALOG} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';
import {V5_MISSION_CATALOG} from '../src/journey-v5-backend.mjs';
import {applyAssetFlow} from './apply-asset-flow.mjs';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(source,'../../apps/max-game/webgl-v5');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const release=path.join(source,'vendor/backend-figma-v2');
const releaseManifestBytes=await fs.readFile(path.join(release,'manifest.json'));
const releaseManifest=JSON.parse(releaseManifestBytes);
if(releaseManifest.sourceRelease.revision!==MISSION_CATALOG.contentRevision)throw Error('V5 release/catalog mismatch');
const annotations=JSON.parse(await fs.readFile(path.join(source,'src/reviewed-content/flow.json'),'utf8'));
const rectCorrections=JSON.parse(await fs.readFile(path.join(source,'src/reviewed-content/flow-corrections.json'),'utf8'));
const reviewed=applyReviewedAssets(applyAssetFlow(MISSION_CATALOG,annotations,{rectCorrections}));
if(JSON.stringify(reviewed.catalog)!==JSON.stringify(V5_MISSION_CATALOG))throw Error('Reviewed catalog stale: run apply-asset-flow.mjs');
for(const [name,hash] of Object.entries(releaseManifest.files)){
 const file=path.resolve(release,name);if(!file.startsWith(release+path.sep))throw Error('Unsafe release path');
 if(sha(await fs.readFile(file))!==hash)throw Error(`Installed backend release changed: ${name}`);
}
const compiled=await build({entryPoints:[path.join(source,'src/journey-guided-main.js')],nodePaths:[path.join(source,'node_modules')],bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,write:false,metafile:true,legalComments:'inline'});
const files=new Map([['app.js',compiled.outputFiles[0].contents]]);
const finale=await buildVideoFinale(source);for(const [name,bytes] of finale.files)files.set(name,bytes);
for(const name of await fs.readdir(path.join(source,'public/webgl-v5/audio')))files.set('audio/'+name,await fs.readFile(path.join(source,'public/webgl-v5/audio',name)));
const glyphManifest=JSON.parse(await fs.readFile(path.join(source,'public/webgl-v5/icon-glyphs/manifest.json')));
for(const [id,glyph] of Object.entries(glyphManifest)){
 if(glyph.sourceSha256!==MISSION_CATALOG.assets[id]?.sha256)throw Error(`Stale glyph: ${id}`);
 const bytes=await fs.readFile(path.join(source,'public',glyph.path));
 if(sha(bytes)!==glyph.sha256)throw Error(`Glyph checksum: ${id}`);
 files.set(glyph.path.slice('webgl-v5/'.length),bytes);
}
files.set('icon-glyphs/manifest.json',await fs.readFile(path.join(source,'public/webgl-v5/icon-glyphs/manifest.json')));
files.set('backend-source.json',await fs.readFile(path.join(release,'content-source.json')));
files.set('annotation-source.json',Buffer.from(JSON.stringify(reviewed.metadata,null,2)+'\n'));
for(const name of ['index.html','client.html','client.css','v5.css','third-party-notices.html'])files.set(name,await fs.readFile(path.join(source,'public/webgl-v5',name)));
for(const name of ['journey.css','journey-guided.css','journey-guided-line.css','journey-guided-reveal.css'])files.set(name,await fs.readFile(path.join(source,'src',name)));
const css=await transform(files.get('v5.css').toString(),{loader:'css',sourcefile:'v5.css'});
if(css.warnings.length)throw Error('v5 CSS warnings: '+JSON.stringify(css.warnings));
const prior=await fs.readFile(path.join(output,'build.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return {files:{}};throw e;});
// Scoped server update: preserve edits and keep the owning runtime manifest current.
const runtimeRoot=path.dirname(output),rootManifestPath=path.join(runtimeRoot,'build-manifest.json');
const rootManifest=JSON.parse(await fs.readFile(rootManifestPath,'utf8'));
const serverBuild=await buildGameServer(source),serverBytes=serverBuild.outputFiles[0].contents;
const existingServer=await fs.readFile(path.join(runtimeRoot,'start.mjs'));
if(sha(existingServer)!==sha(serverBytes)&&sha(existingServer)!==rootManifest.files['start.mjs'])throw Error('Runtime server changed outside builder');

for(const [name,bytes] of files){const current=await fs.readFile(path.join(output,name)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(current&&sha(current)!==sha(bytes)&&sha(current)!==prior.files[name])throw Error(`Runtime changed outside v5 builder: ${name}`);}
const manifest={profile:'webgl-bfm-v5',entry:'webgl-v5/?backend=local&layout=wall',renderer:'original GuidedReveal / Three.js 0.185.1 MIT',controller:'SharedRevealJourney',scope:'BFM visual theme on original WebGL; original layout and motion; shared mission backend; isolated local v5 profile',files:{},inputs:{},assets:{}};
manifest.backend={revision:V5_MISSION_CATALOG.contentRevision,source:'vendor/backend-figma-v2',sourceRevision:MISSION_CATALOG.contentRevision,annotations:reviewed.metadata,manifestSha256:sha(releaseManifestBytes),missions:Object.keys(V5_MISSION_CATALOG.missions).length,tasks:Object.keys(V5_MISSION_CATALOG.tasks).length,screens:reviewed.metadata.effectiveScreens};
// Install the exact release assets. Existing shared resources may only match,
// never be overwritten with a different edition's bytes.
const newAssets=new Map();
for(const asset of Object.values(V5_MISSION_CATALOG.assets)){
 const patched=reviewed.metadata.assetReplacements.some(r=>r.asset.path===asset.path);
 const bytes=await fs.readFile(path.join(patched?path.join(source,'public'):release,asset.path));
 if(sha(bytes)!==asset.sha256)throw Error(`Release asset differs: ${asset.path}`);
 const dest=path.resolve(output,'..',asset.path);
 if(!dest.startsWith(path.resolve(output,'..')+path.sep))throw Error('Unsafe runtime asset');
 const current=await fs.readFile(dest).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(current&&sha(current)!==asset.sha256)throw Error(`Shared runtime asset differs: ${asset.path}`);
 if(!current)newAssets.set(dest,bytes);manifest.assets[asset.path]=asset.sha256;
}
for(const name of Object.keys({...compiled.metafile.inputs,...finale.inputs,...serverBuild.metafile.inputs})){if(name.startsWith('(disabled):'))continue;const file=path.resolve(name);manifest.inputs[path.relative(source,file).replaceAll('\\','/')]=sha(await fs.readFile(file));}
for(const name of ['scripts/apply-reviewed-assets.mjs','src/reviewed-content/asset-replacements.json','start.mjs','package.json','package-lock.json','scripts/apply-asset-annotations.mjs','scripts/apply-asset-flow.mjs','src/asset-audit/flow-document.mjs','src/asset-audit/model.mjs','src/reviewed-content/flow.json','src/reviewed-content/flow-corrections.json'])manifest.inputs[name]=sha(await fs.readFile(path.join(source,name)));
for(const required of ['journey-guided-main.js','journey-webgl-ui.mjs','webgl-field.js','journey-shared-reveal.mjs','application/mission-session.mjs'])if(!Object.keys(manifest.inputs).some(name=>name.endsWith(required)))throw Error(`Missing original engine/backend: ${required}`);
if(Object.keys(manifest.inputs).some(name=>name.endsWith('/bfm-main.mjs')))throw Error('v5 must not use the DOM BFM renderer');
await fs.mkdir(output,{recursive:true});
for(const [dest,bytes] of newAssets){await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,bytes);}
for(const [name,bytes] of files){await fs.mkdir(path.dirname(path.join(output,name)),{recursive:true});await fs.writeFile(path.join(output,name),bytes);manifest.files[name]=sha(bytes);}
await fs.writeFile(path.join(output,'build.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({profile:manifest.profile,files:files.size,modules:Object.keys(manifest.inputs).length,bytes:files.get('app.js').length}));

await fs.writeFile(path.join(runtimeRoot,'start.mjs'),serverBytes);
rootManifest.files['start.mjs']=sha(serverBytes);
await fs.writeFile(rootManifestPath,JSON.stringify(rootManifest,null,2)+'\n');
