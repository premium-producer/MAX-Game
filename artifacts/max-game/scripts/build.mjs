import {buildVideoFinale,buildGameServer} from './build-video-finale.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {PRESENTATION_MISSIONS} from '../src/journey-presentation.mjs';
import {createClientWebglCatalog} from '../src/client-webgl-catalog.mjs';
import {collectSharedBackendFiles} from './build-shared-backend.mjs';

const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const project=path.resolve(source,'../..'), target=path.join(project,'apps/max-game');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
if(process.argv.includes('--shared-only')){
 const {buildSharedRuntime}=await import('./build-shared-runtime.mjs');
 await buildSharedRuntime();process.exit(0);
}
async function walk(root){const out=[];for(const e of await fs.readdir(root,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('Symlink rejected: '+e.name);const p=path.join(root,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const client=JSON.parse(await fs.readFile(path.join(source,'public/config/client-missions.json'),'utf8'));
const icons={'point-a':{label:'Буква A',src:'./icons/endpoint-a.svg'},'point-b':{label:'Буква Б',src:'./icons/endpoint-b.svg'}};
for(let n=1;n<=5;n++) icons[`step-${n}`]={label:String(n),svg:(await fs.readFile(path.join(source,`public/icons/step-${n}.svg`),'utf8')).trim()};
const catalogPath=path.join(source,'public/config/client-webgl.json'),catalogText=JSON.stringify(createClientWebglCatalog({...client,missions:[...client.missions,...PRESENTATION_MISSIONS]},icons),null,2)+'\n';
if(await fs.readFile(catalogPath,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;})!==catalogText)await fs.writeFile(catalogPath,catalogText);
const compiled=await build({entryPoints:[path.join(source,'src/journey-main.js')],bundle:true,nodePaths:[path.join(source,'node_modules')],format:'esm',platform:'browser',target:['es2020'],minify:true,write:false,metafile:true,legalComments:'inline'});
const files=new Map([['app.js',compiled.outputFiles[0].contents]]);
const guidedCompiled=await build({entryPoints:[path.join(source,'src/journey-guided-main.js')],bundle:true,nodePaths:[path.join(source,'node_modules')],format:'esm',platform:'browser',target:['es2020'],minify:true,write:false,metafile:true,legalComments:'inline'});
files.set('guided-app.js',guidedCompiled.outputFiles[0].contents);
for(const file of await walk(path.join(source,'public'))) files.set(path.relative(path.join(source,'public'),file).replaceAll('\\','/'),await fs.readFile(file));
for(const [dest,relative] of [
 ['site-game/client-review.mjs','src/content/client-review.mjs'],
 ['site-game/browser-persistence.mjs','src/application/browser-persistence.mjs'],
 ['site-game/content/client-review.mjs','src/content/client-review.mjs'],
 ['site-game/content/client-review-flows.mjs','src/content/client-review-flows.mjs'],
 ['site-game/core/client-review-progress.mjs','src/core/client-review-progress.mjs'],
])files.set(dest,dest==='site-game/client-review.mjs'
 ?Buffer.from("export * from '../shared/src/content/client-review.mjs';\n")
 :dest==='site-game/browser-persistence.mjs'
  ?Buffer.from("export {createBrowserPersistence} from '../shared/src/application/browser-persistence.mjs';\n")
 :dest.startsWith('site-game/content/')
  ?Buffer.from(`export * from '../../shared/${relative}';\n`)
  :await fs.readFile(path.join(source,relative)));
files.set('config/client-missions.json',await fs.readFile(path.join(source,'public/config/client-missions.json')));
// Canonical brand asset; keep the original symbol bytes in every portable build.
files.set('brand/assets/logos/max-symbol-white.svg',await fs.readFile(path.join(project,'artifacts/DESIGN/BRANDS/MAX/assets/logos/max-symbol-white.svg')));
for(const name of ['index.html','start.mjs','Start.bat','README.md'])files.set(name,await fs.readFile(path.join(source,name)));
files.set('start.mjs',(await buildGameServer(source)).outputFiles[0].contents);
for(const [name,bytes] of (await buildVideoFinale(source)).files)files.set('webgl-v5/'+name,bytes);
// Two actual entry pages share assets; the client edition has isolated progress.
const entry=(await fs.readFile(path.join(source,'index.html'),'utf8'));
files.set('client/index.html',Buffer.from(entry.replace('<html lang="ru">','<html lang="ru" data-edition="client">').replace('<head>','<head><base href="../">').replace('<title>MAX — Открой возможности</title>','<title>MAX — Версия клиента</title>')));
files.set('large-blocks/index.html',Buffer.from(entry.replace('<html lang="ru">','<html lang="ru" data-edition="client" data-experiment="large-blocks">').replace('<head>','<head><base href="../">').replace('<title>MAX — Открой возможности</title>','<title>MAX — Эксперимент · Всё ×1,67</title>')));
files.set('guided/index.html',Buffer.from(entry.replace('<html lang="ru">','<html lang="ru" data-edition="client" data-experiment="guided">').replace('<head>','<head><base href="../">').replace('</head>','<link rel="stylesheet" href="./src/journey-guided.css"></head>').replace('./app.js','./guided-app.js').replace('<title>MAX — Открой возможности</title>','<title>MAX — Ладонь и возможности</title>')));
files.set('src/journey-guided.css',await fs.readFile(path.join(source,'src/journey-guided.css')));
files.set('guided-line/index.html',Buffer.from(files.get('guided/index.html').toString().replace('data-experiment="guided"','data-experiment="guided" data-phone-layout="path"').replace('</head>','<link rel="stylesheet" href="./src/journey-guided-line.css"></head>').replace('<title>MAX — Ладонь и возможности</title>','<title>MAX — Смартфон в маршруте</title>')));
files.set('src/journey-guided-line.css',await fs.readFile(path.join(source,'src/journey-guided-line.css')));
files.set('guided-reveal/index.html',Buffer.from(files.get('guided-line/index.html').toString().replace('data-experiment="guided"','data-experiment="guided" data-reveal="true"').replace('</head>','<link rel="stylesheet" href="./src/journey-guided-reveal.css"></head>').replace('MAX — Смартфон в маршруте','MAX — Раскрытие миссии из ладони')));
files.set('src/journey-guided-reveal.css',await fs.readFile(path.join(source,'src/journey-guided-reveal.css')));
for(const name of ['circular.css','journey.css','master-link.mjs'])files.set('src/'+name,await fs.readFile(path.join(source,'src',name)));

files.set('licenses/three.txt',await fs.readFile(path.join(source,'node_modules/three/LICENSE')));
// Backend ESM/content is portable without activating or changing a renderer.
const sharedBackend=await collectSharedBackendFiles();
for(const [name,data] of sharedBackend.files)files.set('shared/'+name,data);
const old=await fs.readFile(path.join(target,'build-manifest.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return {files:{}};throw e;});
// Reject user edits and stale outputs before writing. Application docs are preserved.
for(const [name,data] of files){const dest=path.join(target,name);const current=await fs.readFile(dest).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(current&&sha(current)!==sha(data)&&sha(current)!==old.files[name])throw Error('Runtime changed by user: '+name);}
// Explicit 0.2 migration: prune only unchanged, previously generated files inside runtime.
const obsolete=[];
for(const [name,digest] of Object.entries(old.files))if(!files.has(name)){
 const dest=path.resolve(target,name),rel=path.relative(target,dest);
 if(rel.startsWith('..')||path.isAbsolute(rel)||rel.split(path.sep)[0]==='docs')throw Error('Unsafe obsolete runtime path: '+name);
 const current=await fs.readFile(dest).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(current&&sha(current)!==digest)throw Error('Obsolete runtime changed by user: '+name);
 if(current)obsolete.push(dest);
}
for(const dest of obsolete)await fs.unlink(dest);
const checksums={};for(const [name,data] of files){const dest=path.join(target,name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,data);checksums[name]=sha(data);}
const manifest={application:'MAX — Возможности рядом',version:'1.0.0',source:'artifacts/max-game',requires:['Modern browser with WebGL2','Static HTTPS hosting; or Stand Service'],engine:'Task-based MAX journey; original Three.js fibers; one/two independent sessions',acceptance:'Target touch/LED acceptance pending',files:checksums};
await fs.writeFile(path.join(target,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const sources={};for(const name of new Set([...Object.keys(compiled.metafile.inputs),...Object.keys(guidedCompiled.metafile.inputs)])){const absolute=path.resolve(name);sources[path.relative(source,absolute).replaceAll('\\','/')]=sha(await fs.readFile(absolute));}
for(const [name,data] of sharedBackend.files)if(name.startsWith('src/'))sources[name]=sha(data);
await fs.writeFile(path.join(target,'source-manifest.json'),JSON.stringify(sources,null,2)+'\n');
console.log(JSON.stringify({target,files:files.size,bytes:[...files.values()].reduce((n,v)=>n+v.length,0),modules:Object.keys(sources).length}));
