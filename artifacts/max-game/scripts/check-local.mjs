// Read-only verification: no access to the historical X-SPUTNIK directory.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const source=path.resolve(import.meta.dirname,'..');
const project=path.resolve(source,'../..');
const runtime=path.join(project,'apps/max-game');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function inside(root,name){
  const file=path.resolve(root,name),relative=path.relative(root,file);
  if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Outside root: '+name);
  const real=await fs.realpath(file),realRelative=path.relative(await fs.realpath(root),real);
  if(realRelative.startsWith('..')||path.isAbsolute(realRelative))throw Error('External symlink: '+name);
  return file;
}
async function verify(root,name,digest){
  const file=await inside(root,name);
  if(sha(await fs.readFile(file))!==digest)throw Error('Hash mismatch: '+name);
}
const manifest=JSON.parse(await fs.readFile(path.join(source,'upstream/manifest.json'),'utf8'));
for(const file of manifest.files)await verify(project,file.local,file.sha256);
const compiled=JSON.parse(await fs.readFile(path.join(runtime,'source-manifest.json'),'utf8'));
// A consistent old bundle can pass every hash while omitting a restored feature.
// Verify the actual entry dependency graph, not nearby or conflict-copy files.
for(const required of ['src/journey-slot-placement.mjs','src/journey-large-blocks.mjs','src/journey-guided.mjs','src/journey-guided-line.mjs','src/journey-guided-reveal.mjs','src/journey-media.mjs','src/journey-media-assets.mjs']){
  if(!Object.hasOwn(compiled,required))throw Error('Required game module absent from compiled entry: '+required);
}
for(const [name,digest] of Object.entries(compiled)){
  if(name.startsWith('../ribbon/')||['../service/shared-fluid.mjs','../service/public/shared-field-model.js'].includes(name))await verify(project,'artifacts/'+name.slice(3),digest);
  else if(['rear-content-fade.js','rear-wall-style.js','max-wall-atmosphere.js','max-panel-glass.js','max-panel-optics.js','max-liquid-glass.js','max-glass-model.js'].some(n=>name==='../service/public/'+n))await verify(project,'artifacts/service/public/'+path.basename(name),digest);
  else await verify(source,name,digest);
}
const output=JSON.parse(await fs.readFile(path.join(runtime,'build-manifest.json'),'utf8'));
for(const required of ['guided/index.html','guided-line/index.html','guided-reveal/index.html','guided-app.js'])if(!Object.hasOwn(output.files,required))throw Error('Required experimental page absent: '+required);
for(const [name,digest] of Object.entries(output.files))await verify(runtime,name,digest);
const symbol='brand/assets/logos/max-symbol-white.svg';
const symbolHash=sha(await fs.readFile(path.join(project,'artifacts/DESIGN/BRANDS/MAX/assets/logos/max-symbol-white.svg')));
if(output.files[symbol]!==symbolHash)throw Error('MAX start symbol absent or changed in runtime');
for(const name of ['three','esbuild']){
  await inside(source,'node_modules/'+name+'/package.json');
}
async function scan(root){
  for(const entry of await fs.readdir(root,{withFileTypes:true})){
    const file=path.join(root,entry.name);
    if(entry.isDirectory())await scan(file);
    else if(/\.(?:mjs|js|cjs|py|json|html|css|bat)$/i.test(file)){
      const text=await fs.readFile(file,'utf8');
      if(/(?:[A-Z]:[\\/]|file:\/\/)[^\r\n"']*(?:RESTRUCTURA|X-SPUTNIK)/i.test(text))throw Error('External project dependency: '+file);
    }
  }
}
for(const name of ['src','scripts','test'])await scan(path.join(source,name));
for(const name of ['package.json','package-lock.json','index.html','start.mjs','Start.bat']){
  const value=await fs.readFile(path.join(source,name),'utf8');
  if(/RESTRUCTURA|BEELINE-2026/i.test(value))throw Error('External dependency: '+name);
}
console.log(JSON.stringify({upstreamFiles:manifest.files.length,skills:manifest.skillFolders.length,
  compiledInputs:Object.keys(compiled).length,runtimeFiles:Object.keys(output.files).length,
  historicalSourceDirectoryAccessed:false,result:'pass'},null,2));
