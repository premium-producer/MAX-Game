import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {buildSharedRuntime,writeBuildManifest} from './build-shared-runtime.mjs';
import {collectSharedBackendFiles} from './build-shared-backend.mjs';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.resolve(source,'../../apps/max-game');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

// Compile the existing Guided entry only. Preserve every stylesheet, page and
// legacy app.js, including runtime styling edited by the user.
const compiled=await build({entryPoints:[path.join(source,'src/journey-guided-main.js')],bundle:true,nodePaths:[path.join(source,'node_modules')],format:'esm',platform:'browser',target:['es2020'],minify:true,write:false,metafile:true,legalComments:'inline'});
const {manifest:shared}=await collectSharedBackendFiles();
const files=new Map([['guided-app.js',compiled.outputFiles[0].contents],
 ['site-game/browser-persistence.mjs',Buffer.from("export {createBrowserPersistence} from '../shared/src/application/browser-persistence.mjs';\n")],
 ['site-game/site-session.mjs',await fs.readFile(path.join(source,'public/site-game/site-session.mjs'))]]);
for(const asset of Object.values(shared.assets))files.set(asset.path,await fs.readFile(path.join(source,'public',asset.path)));
for(const name of ['assets/backgrounds/figma-game-background.svg','assets/backgrounds/figma-game-background.json'])files.set(name,await fs.readFile(path.join(source,'public',name)));
files.set('webgl-reference/index.html',await fs.readFile(path.join(source,'public/webgl-reference/index.html')));
files.set('src/journey-reference.css',await fs.readFile(path.join(source,'src/journey-reference.css')));
let manifest=JSON.parse(await fs.readFile(path.join(target,'build-manifest.json'),'utf8'));
const siteBuildFile=path.join(target,'site-game/build.json'),siteBuild=JSON.parse(await fs.readFile(siteBuildFile,'utf8'));
for(const [name,bytes] of files){const current=await fs.readFile(path.join(target,name)).catch(error=>{if(error.code==='ENOENT')return null;throw error;});const previous=name.startsWith('site-game/')?siteBuild.files[name.slice('site-game/'.length)]:manifest.files[name];if(current&&sha(current)!==sha(bytes)&&sha(current)!==previous)throw Error('Runtime changed by user: '+name);}
await buildSharedRuntime();
const filename=path.join(target,'build-manifest.json'),before=await fs.readFile(filename,'utf8');manifest=JSON.parse(before);
if(await fs.readFile(filename,'utf8')!==before)throw Error('Concurrent build');
for(const [name,bytes] of files){const destination=path.join(target,name);await fs.mkdir(path.dirname(destination),{recursive:true});await writeBuildManifest(destination,bytes);manifest.files[name]=sha(bytes);}
manifest.webglAdapter={entry:'guided-reveal/?backend=local',contentRevision:shared.versions.content,profile:'explicit-local-or-server',legacyDefaultPreserved:true};
await writeBuildManifest(filename,JSON.stringify(manifest,null,2)+'\n');
for(const [name,bytes] of files)if(name.startsWith('site-game/'))siteBuild.files[name.slice('site-game/'.length)]=sha(bytes);
await writeBuildManifest(siteBuildFile,JSON.stringify(siteBuild,null,2)+'\n');
const hashesFile=path.join(target,'source-manifest.json'),hashes=JSON.parse(await fs.readFile(hashesFile,'utf8'));
for(const name of Object.keys(compiled.metafile.inputs)){const absolute=path.resolve(name);hashes[path.relative(source,absolute).replaceAll('\\','/')]=sha(await fs.readFile(absolute));}
await writeBuildManifest(hashesFile,JSON.stringify(hashes,null,2)+'\n');
for(const [name,bytes] of files)if(sha(await fs.readFile(path.join(target,name)))!==sha(bytes))throw Error('Copy mismatch: '+name);
console.log(JSON.stringify({profile:'webgl-shared',files:files.size,bytes:compiled.outputFiles[0].contents.length,modules:Object.keys(compiled.metafile.inputs).length,preserved:'all pages/CSS/app.js/user data'}));
