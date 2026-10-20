import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const tools=path.dirname(fileURLToPath(import.meta.url));
const apps=path.resolve(tools,'../..');
if(fs.existsSync(path.join(apps,'stela/source/build.mjs')))throw Error('Local Stella iteration exists. Use apps/stela/source/build.mjs; initial import would overwrite it.');
const source=path.resolve(process.argv[2]??'');
if(!process.argv[2]||!fs.existsSync(path.join(source,'artifacts/max-game/package.json')))throw Error('Usage: node assemble.mjs SOURCE_VK_DIGITALPRODUCTS');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.cpSync(from,to,{recursive:true,dereference:true,filter:filename=>!/(^|[\\/])(node_modules|\.git|__pycache__)([\\/]|$)/.test(filename)});};
const write=(filename,value)=>{fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,value);};
const json=(filename,value)=>write(filename,JSON.stringify(value,null,2)+'\n');
const runtime=path.join(source,'artifacts/service/node_modules/electron/dist');
if(!fs.existsSync(path.join(runtime,'electron.exe')))throw Error('Existing Electron runtime not found');
const releaseRoot=path.join(source,'artifacts/workspace/exports/MAX-Game/integration/current');
const release=JSON.parse(fs.readFileSync(path.join(releaseRoot,'release.json')));
const clientBundle=fs.readFileSync(path.join(releaseRoot,'runtime/client/app.js'));
if(sha(clientBundle)!==release.profiles.client.appSha256)throw Error('Latest R6 client bundle differs from release manifest');

function installDesktop(name,config){
 const root=path.join(apps,name);
 // Runtime is copied in full, including Chromium resources, locales and licenses.
 fs.mkdirSync(path.join(root,'runtime'),{recursive:true});
 fs.cpSync(runtime,path.join(root,'runtime'),{recursive:true,dereference:true});
 for(const filename of ['desktop-main.cjs','portable-server.cjs','Launch.ps1','Control.ps1'])copy(path.join(tools,filename),path.join(root,'launcher',filename));
 for(const [filename,command] of [['Start.bat','Launch.ps1'],['Check.bat','Control.ps1 -Action Check'],['Stop.bat','Control.ps1 -Action Stop']]){
  const [script,...args]=command.split(' ');
  write(path.join(root,filename),`@echo off\r\nsetlocal DisableDelayedExpansion\r\npowershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher/${script}" ${args.join(' ')} %*\r\nexit /b %errorlevel%\r\n`);
 }
 json(path.join(root,'app.json'),config);
 return root;
}

const gameRoot=installDesktop('max-game',{id:'kdw-max-game',title:'MAX — игра',version:release.id,port:18752,entry:'/webgl-v5/client.html?backend=local&layout=wall',window:{width:1280,height:800},verifyExpression:"document.documentElement.dataset.gameReady === 'true'"});
for(const area of ['assets','audio','brand','config','earth','icons','webgl-v5','licenses']){
 const current=path.join(source,'artifacts/workspace/exports/MAX-Game/apps/max-game',area);
 copy(fs.existsSync(current)?current:path.join(source,'apps/max-game',area),path.join(gameRoot,'www',area));
}
write(path.join(gameRoot,'www/webgl-v5/app.js'),clientBundle);
write(path.join(gameRoot,'www/index.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/webgl-v5/client.html?backend=local&layout=wall"><title>MAX</title>');
// The client pins a distinct icon manifest. Use its verified paths, not the stand map.
copy(path.join(releaseRoot,'code/static/client-icon-manifest.json'),path.join(gameRoot,'www/webgl-v5/icon-glyphs/manifest.json'));
const catalog=JSON.parse(fs.readFileSync(path.join(releaseRoot,'code/client/src/reviewed-content/mission-catalog.json')));
for(const asset of Object.values(catalog.assets)){
 const dest=path.join(gameRoot,'www',asset.path);
 if(!fs.existsSync(dest)||sha(fs.readFileSync(dest))!==asset.sha256)throw Error('Missing or incorrect R6 asset: '+asset.path);
}
const glyphs=JSON.parse(fs.readFileSync(path.join(releaseRoot,'code/static/client-icon-manifest.json')));
for(const glyph of Object.values(glyphs)){
 const dest=path.join(gameRoot,'www',glyph.path);
 if(!fs.existsSync(dest)||sha(fs.readFileSync(dest))!==glyph.sha256)throw Error('Missing or incorrect R6 glyph: '+glyph.path);
}
copy(path.join(releaseRoot,'code/client'),path.join(gameRoot,'source/client'));
const clientInputs=JSON.parse(fs.readFileSync(path.join(releaseRoot,'runtime/client/build-manifest.json'))).inputs;
for(const [name,digest] of Object.entries(clientInputs)){
 if(!/^artifacts\/(ribbon|service)\//.test(name))continue;
 const candidates=[path.join(source,'artifacts/workspace/exports/MAX-Game',name),path.join(source,name)];
 const found=candidates.find(filename=>fs.existsSync(filename)&&sha(fs.readFileSync(filename))===digest);
 if(!found)throw Error('Pinned client source dependency missing: '+name);
 copy(found,path.join(gameRoot,'source',name.slice('artifacts/'.length)));
}
copy(path.join(releaseRoot,'code/static/client-icon-manifest.json'),path.join(gameRoot,'source/client/public/webgl-v5/icon-glyphs/manifest.json'));
for(const name of ['package.json','package-lock.json'])copy(path.join(releaseRoot,name),path.join(gameRoot,'source/client',name));
copy(path.join(releaseRoot,'runtime/client/build-manifest.json'),path.join(gameRoot,'source/r6-build-manifest.json'));
copy(path.join(releaseRoot,'release.json'),path.join(gameRoot,'source/r6-release.json'));
json(path.join(gameRoot,'provenance.json'),{imported:'2026-10-18',sourceProject:source.replaceAll('\\','/'),profile:'client; local IndexedDB session; no MASTER',release:release.id,bundleSha256:sha(clientBundle),changes:['Portable Electron desktop host; local HTTP only; application-local data/profile','R6 client bundle copied without modification'],excluded:['MASTER and role-host services','Visitor data, databases, credentials, deployment configuration','Other MAX website sections and old game editions']});

const stelaRoot=installDesktop('stela',{id:'kdw-max-stela',title:'MAX — стела',version:'KDW-MAX-STELA-20261018',port:18751,entry:'/stella/',window:{width:600,height:1000},verifyExpression:"document.documentElement.dataset.serviceReady === 'true' && document.documentElement.dataset.stellaRingState === 'ready' && !!document.querySelector('button[aria-label=\"MAX\"]')"});
const localSource=path.join(stelaRoot,'source');
const original=path.join(source,'artifacts/stella-prototype');
const project=path.join(localSource,'artifacts/stella-prototype');
for(const filename of ['src','public','index.html','package.json','package-lock.json','provenance.json','tsconfig.app.json','tsconfig.json','tsconfig.node.json'])copy(path.join(original,filename),path.join(project,filename));
for(const brand of ['MAX','vk-video']){
 for(const area of ['logos','fonts',...(brand==='vk-video'?['illustrations']:[])]){
  const from=path.join(source,'artifacts/DESIGN/BRANDS',brand,'assets',area);
  if(fs.existsSync(from))copy(from,path.join(localSource,'artifacts/DESIGN/BRANDS',brand,'assets',area));
 }
}
for(const filename of ['cubes-art.js','cubes-art.json'])copy(path.join(source,'artifacts/ribbon',filename),path.join(localSource,'artifacts/ribbon',filename));
const lumicells=path.join(source,'docs/Research/lumicells-20260930/upstream/lumicells-1007717d72cfd9d768d4b9a3f7fc80a126e49c51');
copy(path.join(lumicells,'src'),path.join(localSource,'vendor/lumicells'));
if(fs.existsSync(path.join(lumicells,'LICENSE')))copy(path.join(lumicells,'LICENSE'),path.join(stelaRoot,'licenses/LumiCells-LICENSE'));
copy(path.join(source,'artifacts/ribbon/vendor/lumicells/src'),path.join(localSource,'vendor/lumicells-project'));
copy(path.join(source,'artifacts/ribbon/discovery-cutout.js'),path.join(localSource,'vendor/discovery-cutout.js'));
const fieldFile=path.join(localSource,'vendor/lumicells-project/core/engine/passes/field.ts');
write(fieldFile,fs.readFileSync(fieldFile,'utf8').replace('../../../../../../discovery-cutout.js','../../../../discovery-cutout.js'));
const home=`import type { Product } from '../types/prototype'\nimport { RingTag } from './RingTag'\nimport { ProductMark } from './ProductMark'\nexport function RingHomeScreen({ onSelect }: { onSelect: (product: Product) => void }) {\nreturn <section className="screen screen--home" aria-labelledby="home-title"><div className="home-intro" data-lc-influence="shadow" data-lc-strength="0.35"><h1 id="home-title">Исследуй свои возможности с MAX!</h1></div><div className="home-choices" style={{justifyContent:'center'}}><RingTag tone="violet" className="product-tag" aria-label="MAX" onClick={() => onSelect('max')}><ProductMark product="max" symbol /></RingTag></div></section>\n}\n`;
write(path.join(project,'src/components/RingHomeScreen.tsx'),home);
let prototype=fs.readFileSync(path.join(project,'src/features/prototype/Prototype.tsx'),'utf8');
prototype=prototype.replace("const product = screen.type === 'home' ? null :", "const product = screen.type === 'home' ? 'max' :");
prototype=prototype.replace("const startProduct = useCallback((product: 'max' | 'vk-video') => {", "const startProduct = useCallback((product: 'max' | 'vk-video') => {\n    if (product !== 'max') return");
write(path.join(project,'src/features/prototype/Prototype.tsx'),prototype);
const voiceFile=path.join(project,'public/voice/vasilisa/manifest.json');
const voices=JSON.parse(fs.readFileSync(voiceFile));
voices.assets=Object.fromEntries(Object.entries(voices.assets).filter(([key])=>key.startsWith('max-')));
json(voiceFile,voices);
for(const filename of fs.readdirSync(path.dirname(voiceFile)))if(filename!=='manifest.json'&&!Object.values(voices.assets).includes(filename))fs.unlinkSync(path.join(path.dirname(voiceFile),filename));
const html=fs.readFileSync(path.join(project,'index.html'),'utf8').replace(/<title>.*?<\/title>/,'<title>MAX — стела</title>');
write(path.join(project,'index.html'),html);
const packages=path.join(original,'node_modules');
const {build}=await import(pathToFileURL(path.join(packages,'vite/dist/node/index.js')));
const react=(await import(pathToFileURL(path.join(packages,'@vitejs/plugin-react/dist/index.js')))).default;
await build({root:project,configFile:false,base:'/stella/',plugins:[react()],resolve:{alias:[{find:/^lumicells\/(.*)$/,replacement:path.join(localSource,'vendor/lumicells/$1').replaceAll('\\','/')},{find:'lumicells-project',replacement:path.join(localSource,'vendor/lumicells-project')},...['react','react-dom','motion','lucide-react','howler'].map(name=>({find:new RegExp('^'+name+'(?=/|$)'),replacement:path.join(packages,name).replaceAll('\\','/')}))]},build:{outDir:path.join(stelaRoot,'www/stella'),emptyOutDir:true,rollupOptions:{output:{entryFileNames:'assets/app.js',chunkFileNames:'assets/[name].js',assetFileNames:'assets/[name][extname]'}}}});
write(path.join(stelaRoot,'www/index.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/stella/"><title>MAX</title>');
json(path.join(stelaRoot,'provenance.json'),{imported:'2026-10-18',sourceProject:source.replaceAll('\\','/'),source:'artifacts/stella-prototype; current source, not older apps/stella-prototype build',sourceProvenance:JSON.parse(fs.readFileSync(path.join(original,'provenance.json'))),changes:['MAX-only home and product guard','MAX palette on home','Home/VK narration excluded; existing MAX narration retained','Portable Electron desktop host; no stand-service integration'],integration:'Standalone questionnaire only. No inter-application queue or old MASTER connection is activated.'});

for(const [target,packages,names] of [[stelaRoot,path.join(original,'node_modules'),['react','react-dom','motion','motion-dom','motion-utils','framer-motion','lucide-react','howler','scheduler']],[gameRoot,path.join(releaseRoot,'node_modules'),['three','maath','idb']]]){
 for(const name of names){const dependency=path.join(packages,name);if(!fs.existsSync(dependency))continue;const destination=path.join(target,'licenses',name);for(const entry of fs.readdirSync(dependency,{withFileTypes:true}))if(entry.isFile()&&/^(LICEN[CS]E|COPYING|NOTICE)(\..*)?$/i.test(entry.name))copy(path.join(dependency,entry.name),path.join(destination,entry.name));const metadata=JSON.parse(fs.readFileSync(path.join(dependency,'package.json')));json(path.join(destination,'package-info.json'),{name:metadata.name,version:metadata.version,license:metadata.license});}
}

function manifest(root){const files={};function walk(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){if(e.name==='data'||e.name==='package-manifest.json')continue;const filename=path.join(folder,e.name);if(e.isDirectory())walk(filename);else if(e.isFile()){const bytes=fs.readFileSync(filename);files[path.relative(root,filename).replaceAll('\\','/')]={bytes:bytes.length,sha256:sha(bytes)};}else throw Error('Nonportable file: '+filename);}}walk(root);json(path.join(root,'package-manifest.json'),{application:JSON.parse(fs.readFileSync(path.join(root,'app.json'))).id,platform:'win32-x64',electron:fs.readFileSync(path.join(runtime,'version'),'utf8').trim(),files});return {files:Object.keys(files).length,bytes:Object.values(files).reduce((sum,file)=>sum+file.bytes,0)};}
console.log(JSON.stringify({game:manifest(gameRoot),stela:manifest(stelaRoot)},null,2));
