import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const project=path.resolve(import.meta.dirname,'../../..'),runtime=path.join(project,'apps/max-game');
const release=process.argv[2]??new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/,'Z');
if(!/^\d{8}T\d{6}Z$/.test(release))throw Error('Invalid release');
const output=path.join(project,'artifacts/workspace/dist/max-game-client',release);
await fs.mkdir(output,{recursive:false});
const hash=b=>createHash('sha256').update(b).digest('hex'),files={};
const manifest=JSON.parse(await fs.readFile(path.join(runtime,'webgl-v5/build.json')));
const put=async(name,bytes,expected)=>{
 if(path.isAbsolute(name)||name.split(/[\\/]/).includes('..'))throw Error('Unsafe package path');
 const digest=hash(bytes);if(expected&&expected!==digest)throw Error('Runtime changed: '+name);
 await fs.mkdir(path.dirname(path.join(output,name)),{recursive:true});await fs.writeFile(path.join(output,name),bytes);files[name]=digest;
};
for(const [name,digest] of Object.entries(manifest.inputs))if(hash(await fs.readFile(path.resolve(project,'artifacts/max-game',name)))!==digest)throw Error('Source changed: '+name);
for(const [name,digest] of Object.entries(manifest.files))await put('webgl-v5/'+name,await fs.readFile(path.join(runtime,'webgl-v5',name)),digest);
for(const [name,digest] of Object.entries(manifest.assets))await put(name,await fs.readFile(path.join(runtime,name)),digest);
async function directory(name){for(const entry of await fs.readdir(path.join(runtime,name),{withFileTypes:true})){
 const rel=name+'/'+entry.name;
 if(entry.isDirectory())await directory(rel);
 else if(entry.isFile()&&/\.(json|bin|svg|png|webp|jpg|woff2?|ttf|css|txt|html|md)$/i.test(entry.name))await put(rel,await fs.readFile(path.join(runtime,rel)));
 else throw Error('Unexpected public dependency: '+rel);
}}
for(const folder of ['brand','earth','icons','licenses'])await directory(folder);
for(const name of ['client-webgl.json','client-missions.json','ui-shell.json','earth-contours.json'])await put('config/'+name,await fs.readFile(path.join(runtime,'config',name)));
await put('index.html',Buffer.from('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=./webgl-v5/client.html"><title>MAX</title><a href="./webgl-v5/client.html">Открыть MAX</a></html>'));
await fs.writeFile(path.join(output,'release.json'),JSON.stringify({application:'MAX',profile:'client-1920x1080',release,contentRevision:manifest.backend.revision,annotations:manifest.backend.annotations,files},null,2)+'\n');
await fs.writeFile(path.join(output,'SHA256SUMS'),Object.entries(files).map(([name,digest])=>`${digest}  ${name}`).join('\n')+'\n');
console.log(JSON.stringify({release,output,files:Object.keys(files).length}));
