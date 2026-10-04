import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildPage} from './build-brandbook.mjs';
import {buildSharedRuntime,writeBuildManifest} from './build-shared-runtime.mjs';
import {collectSharedBackendFiles} from './build-shared-backend.mjs';

const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.resolve(source,'../../apps/max-game');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

/** Build the current Site and its common backend without compiling Legacy. */
export async function buildSiteRuntime(){
  const collected=await collectSharedBackendFiles({includeAssets:true});
  const manifestPath=path.join(target,'build-manifest.json');
  const before=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  const assets=[];
  for(const [name,bytes] of collected.files){
    if(name.startsWith('src/')||name==='manifest.json')continue;
    const destination=path.resolve(target,name),relative=path.relative(target,destination);
    if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Unsafe Site asset output');
    const current=await fs.readFile(destination).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
    const hash=digest(bytes);
    if(current&&digest(current)!==hash&&digest(current)!==before.files[name])throw new Error('User-edited Site asset: '+name);
    assets.push({name,destination,bytes,hash});
  }
  await buildSharedRuntime();
  await buildPage('site-game');
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  for(const asset of assets){
    await fs.mkdir(path.dirname(asset.destination),{recursive:true});
    await fs.writeFile(asset.destination,asset.bytes);
    manifest.files[asset.name]=asset.hash;
  }
  manifest.sharedBackend.siteAdapter='site-game';
  await writeBuildManifest(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  for(const asset of assets)if(digest(await fs.readFile(asset.destination))!==asset.hash)throw new Error('Site asset copy mismatch: '+asset.name);
  const result={target,profile:'site-only',assets:assets.length,contentRevision:collected.manifest.versions.content};
  console.log(JSON.stringify(result));return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildSiteRuntime();
