import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(source,'../../apps/max-game/bfm-design');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const compiled=await build({entryPoints:[path.join(source,'src/bfm-main.mjs')],bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,write:false,metafile:true,legalComments:'inline'});
const files=new Map([['app.js',compiled.outputFiles[0].contents]]);
for(const name of ['index.html','bfm.css'])files.set(name,await fs.readFile(path.join(source,'public/bfm-design',name)));
// Keep this complete local preview portable without mutating other renderers.
for(const name of ['provenance.json'])files.set(name,await fs.readFile(path.join(source,'vendor/bfm-native',name)));
const prior=await fs.readFile(path.join(output,'build.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return {files:{}};throw e;});
for(const [name,bytes] of files){const current=await fs.readFile(path.join(output,name)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(current&&sha(current)!==sha(bytes)&&sha(current)!==prior.files[name])throw Error(`Runtime changed outside builder: ${name}`);}
const manifest={profile:'bfm-native-v4-missions',entry:'bfm-design/?backend=local&layout=wall',files:{},inputs:{},assets:{},scope:'shared catalog: six missions, phone/PC, actions, missing content, QR; explicit local/server profiles'};
// Common media already belongs to the shared MAX bundle. Verify it instead of
// silently replacing files owned by another renderer/build.
for(const asset of Object.values(MISSION_CATALOG.assets)){
 const bytes=await fs.readFile(path.resolve(output,'..',asset.path));
 if(sha(bytes)!==asset.sha256)throw Error(`Shared runtime asset differs from catalog: ${asset.path}`);
 manifest.assets[asset.path]=asset.sha256;
}
for(const name of Object.keys(compiled.metafile.inputs)){const file=path.resolve(name);manifest.inputs[path.relative(source,file).replaceAll('\\','/')]=sha(await fs.readFile(file));}
for(const forbidden of ['journey-motion.mjs','journey-reference-motion.mjs','journey-reference-frame.mjs','journey-guided-main.js'])if(Object.keys(manifest.inputs).some(name=>name.endsWith('/'+forbidden)))throw Error(`Forbidden legacy motion import: ${forbidden}`);
await fs.mkdir(output,{recursive:true});
for(const [name,bytes] of files){await fs.writeFile(path.join(output,name),bytes);manifest.files[name]=sha(bytes);}
await fs.writeFile(path.join(output,'build.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({profile:manifest.profile,files:files.size,modules:Object.keys(manifest.inputs).length,bytes:files.get('app.js').length}));
