import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const runtime=path.join(root,'apps/max-game');
const hash=b=>createHash('sha256').update(b).digest('hex');
const release=process.argv[2];
if(!/^\d{8}T\d{6}Z$/.test(release||''))throw Error('UTC release required: YYYYMMDDTHHMMSSZ');
const output=path.join(root,'artifacts/workspace/dist/max-asset-audit',release);
await fs.mkdir(output,{recursive:true});
if((await fs.readdir(output)).length)throw Error('Package output must be empty');
const files=new Map(),build=JSON.parse(await fs.readFile(path.join(runtime,'asset-audit/build.json')));
for(const [name,sha] of Object.entries(build.inputs)){
 const bytes=await fs.readFile(path.resolve(root,'artifacts/max-game',name));
 if(hash(bytes)!==sha)throw Error(`Stale build input: ${name}`);
}
for(const [name,sha] of Object.entries(build.files)){
 let bytes=await fs.readFile(path.join(runtime,'asset-audit',name));
 if(hash(bytes)!==sha)throw Error(`Changed runtime: ${name}`);
 if(name==='index.html')bytes=Buffer.from(bytes.toString().replace('<head>','<head><meta name="max-audit-api" content="./api/">').replace('Настройки сохраняются в проект при каждом изменении.','Настройки сохраняются на Selectel при каждом изменении. Локальная копия на стенде сохраняется отдельно.'));
 files.set(`public/editor/${name}`,bytes);
}
for(const [name,sha] of Object.entries(build.assets)){
 const bytes=await fs.readFile(path.join(runtime,name));
 if(hash(bytes)!==sha)throw Error(`Changed asset: ${name}`);
 files.set(`public/${name}`,bytes);
}
for(const name of ['tokens/brand.css',...['300','400','500','600','700'].map(w=>`assets/fonts/max-sans-${w}.woff2`)])files.set(`public/brand/${name}`,await fs.readFile(path.join(runtime,'brand',name)));
const serverBytes=await fs.readFile(path.join(root,'artifacts/service/max-game/asset-audit-store.mjs'));
if(hash(serverBytes)!==build.serverSha256)throw Error('Changed server store bundle');
files.set('server/asset-audit-store.mjs',serverBytes);
files.set('server/asset-audit-server.mjs',await fs.readFile(path.join(root,'artifacts/max-game/scripts/asset-audit-server.mjs')));
files.set('activate.sh',Buffer.from((await fs.readFile(path.join(root,'artifacts/max-game/scripts/activate-asset-audit-selectel.sh'),'utf8')).replaceAll('\r\n','\n')));
files.set('build.json',Buffer.from(JSON.stringify({release,sourceBuild:build,files:Object.fromEntries([...files].map(([name,b])=>[name,hash(b)]))},null,2)+'\n'));
for(const [name,bytes] of files){const target=path.join(output,name);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);}
await fs.writeFile(path.join(output,'SHA256SUMS'),[...files].map(([name,b])=>`${hash(b)}  ${name}`).join('\n')+'\n');
console.log(JSON.stringify({output,release,files:files.size,bytes:[...files.values()].reduce((n,b)=>n+b.length,0)}));
