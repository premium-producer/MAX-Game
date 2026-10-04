import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {collectSharedBackendFiles} from './build-shared-backend.mjs';

// Update an existing generated manifest without reopening it in truncation mode.
// Windows may reject that mode for a file currently observed by the workspace.
export async function writeBuildManifest(filename,text){
 const bytes=Buffer.from(text);let handle;
 try{handle=await fs.open(filename,'r+');}catch(error){if(error.code!=='ENOENT')throw error;await fs.writeFile(filename,bytes,{flag:'wx'});return;}
 try{await handle.writeFile(bytes);await handle.truncate(bytes.length);}finally{await handle.close();}
}

/** Independent backend release; leave every renderer byte and user save untouched. */
export async function buildSharedRuntime() {
  const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const target=path.resolve(source,'../../apps/max-game');
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
  const manifestFile=path.join(target,'build-manifest.json'), before=await fs.readFile(manifestFile,'utf8');
  const manifest=JSON.parse(before), shared=await collectSharedBackendFiles();
  const updates=[];
  for(const [name,bytes] of shared.files){
    const key='shared/'+name,destination=path.join(target,key);
    if(!path.resolve(destination).startsWith(path.join(target,'shared')+path.sep))throw new Error('Unsafe shared output');
    const current=await fs.readFile(destination).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
    if(current&&sha(current)!==sha(bytes)&&sha(current)!==manifest.files[key])throw new Error('Shared runtime changed by user: '+key);
    updates.push({key,destination,bytes,hash:sha(bytes)});
  }
  const desired=new Set(updates.map(update=>update.key));
  const obsolete=Object.keys(manifest.files).filter(key=>key.startsWith('shared/')&&!desired.has(key));
  if(obsolete.length)throw new Error('Archive obsolete shared runtime explicitly: '+obsolete.join(','));
  if(await fs.readFile(manifestFile,'utf8')!==before)throw new Error('Concurrent MAX build changed manifest');
  for(const update of updates){await fs.mkdir(path.dirname(update.destination),{recursive:true});await fs.writeFile(update.destination,update.bytes);manifest.files[update.key]=update.hash;}
  manifest.sharedBackend={contentHash:shared.manifest.contentHash,moduleHash:shared.manifest.moduleHash,versions:shared.manifest.versions,rendererActivation:'none'};
  await writeBuildManifest(manifestFile,JSON.stringify(manifest,null,2)+'\n');
  const sourceFile=path.join(target,'source-manifest.json');
  const hashes=await fs.readFile(sourceFile,'utf8').then(JSON.parse);
  for(const update of updates)if(update.key.startsWith('shared/src/'))hashes[update.key.slice('shared/'.length)]=update.hash;
  await writeBuildManifest(sourceFile,JSON.stringify(hashes,null,2)+'\n');
  for(const update of updates)if(sha(await fs.readFile(update.destination))!==update.hash)throw new Error('Shared copy mismatch: '+update.key);
  const result={target,profile:'shared-only',files:updates.length,missions:shared.manifest.missions.length,tasks:shared.manifest.tasks.length,assets:Object.keys(shared.manifest.assets).length};
  console.log(JSON.stringify(result));return result;
}
