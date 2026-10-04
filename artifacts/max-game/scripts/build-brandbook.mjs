import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export async function buildPage(page='brandbook') {
if(!['brandbook','business','digital-id','authors','career','site-game'].includes(page))throw Error('Unknown local site preview: '+page);
const source=path.join(project,'artifacts/max-game/public',page);
const target=path.join(project,'apps/max-game',page);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function walk(root){const files=[];for(const entry of await fs.readdir(root,{withFileTypes:true})){if(entry.isSymbolicLink())throw Error('Symlink rejected');const file=path.join(root,entry.name);if(entry.isDirectory())files.push(...await walk(file));else files.push(file);}return files;}
const old=await fs.readFile(path.join(target,'build.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return {files:{}};throw e;});
const planned=[];
for(const file of await walk(source)){
 const name=path.relative(source,file),key=name.replaceAll('\\','/');
 const bytes=page==='site-game'&&key==='client-review.mjs'
  ?Buffer.from("export * from '../shared/src/content/client-review.mjs';\n")
  :page==='site-game'&&key==='browser-persistence.mjs'
   ?Buffer.from("export {createBrowserPersistence} from '../shared/src/application/browser-persistence.mjs';\n")
  :await fs.readFile(file);
 const current=await fs.readFile(path.join(target,name)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(current&&digest(current)!==digest(bytes)&&digest(current)!==old.files[key])throw Error('User-edited brandbook runtime: '+key);
 planned.push({name,key,bytes});
}
if(page==='site-game')for(const [key,relative] of [
 ['content/client-review.mjs','src/content/client-review.mjs'],
 ['content/client-review-flows.mjs','src/content/client-review-flows.mjs'],
 ['core/client-review-progress.mjs','src/core/client-review-progress.mjs'],
]){
 const bytes=key.startsWith('content/')
  ?Buffer.from(`export * from '../../shared/src/${relative.slice(4)}';\n`)
  :await fs.readFile(path.join(project,'artifacts/max-game',relative));
 const current=await fs.readFile(path.join(target,key)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(current&&digest(current)!==digest(bytes)&&digest(current)!==old.files[key])throw Error('User-edited Site runtime: '+key);
 planned.push({name:key,key,bytes});
}
const files={};
for(const {name,key,bytes} of planned){const dest=path.join(target,name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,bytes);files[key]=digest(bytes);}
await fs.writeFile(path.join(target,'build.json'),JSON.stringify({source:'artifacts/max-game/public/'+page,files},null,2)+'\n');
console.log(JSON.stringify({target,files:planned.length,bytes:planned.reduce((n,f)=>n+f.bytes.length,0)}));
return {target,files:planned.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildPage(process.argv[2]||'brandbook');
