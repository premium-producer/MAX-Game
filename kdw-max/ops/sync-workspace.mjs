import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const pin=p=>{const b=fs.readFileSync(p);return {bytes:b.length,sha256:hash(b)};};
const equalPin=(a,b)=>a?.bytes===b?.bytes&&a?.sha256===b?.sha256;
const equalFiles=(a,b)=>Object.keys(a).length===Object.keys(b).length&&Object.entries(b).every(([n,p])=>equalPin(a[n],p));
const destination=(base,rel)=>{
 const file=path.resolve(base,rel);
 if(!file.startsWith(base+path.sep))throw Error('Invalid destination: '+rel);
 for(let current=file;;current=path.dirname(current)){
  try{if(fs.lstatSync(current).isSymbolicLink())throw Error('Symlink publication destination: '+current);}
  catch(error){if(error.code!=='ENOENT')throw error;}
  if(current===base)break;
 }
 return file;
};
const config=read(path.join(root,'ops/sync/paths.json'));
const mode=process.argv[2]??'check';
if(!['check','prepare'].includes(mode))throw Error('Use check or prepare; prepare updates publication files only.');
const safe=rel=>{
 if(path.isAbsolute(rel)||rel.split('/').some(x=>['..','data','private','secrets','runtime','node_modules','.git'].includes(x)))throw Error('Forbidden sync path: '+rel);
 if(rel==='apps/max-game/source/fixtures/visitor-photo.png')throw Error('Private fixture');
 const file=path.join(root,rel);
 if(!fs.realpathSync(file).startsWith(root+path.sep))throw Error('Sync source escapes workspace: '+rel);
 return file;
};
const sources={};
for(const rel of Object.keys(config.files).sort())sources[rel]=pin(safe(rel));
const revision=hash(Buffer.from(JSON.stringify(sources)));
const failures=[];const results=[];const plans=[];
// The allowlist owns current files only. Historical repository trees are untouched.
for(const [name,spec] of Object.entries(config.repositories)){
 const repo=destination(root,'github/'+name),manifestPath=destination(repo,spec.prefix+'docs/kdw-max/SOURCE_MANIFEST.json');
 const old=read(manifestPath),files={},writes=[],retired=[];let changed=0;
 for(const rel of spec.retired??[]){
  const dest=destination(repo,rel);if(!fs.existsSync(dest))continue;
  if(!dest.startsWith(repo+path.sep)||!old.files[rel])throw Error('Unreviewed retired path: '+rel);
  if(!equalPin(pin(dest),old.files[rel]))throw Error('Retired file was edited: '+rel);
  retired.push(dest);
  if(mode==='check')failures.push({repository:name,path:rel,error:'retired export helper remains active'});
 }
 for(const [rel,owners] of Object.entries(config.files)){
  if(!owners.includes(name))continue;
  const destRel=spec.prefix+rel,dest=destination(repo,destRel);files[destRel]=sources[rel];
  const actual=fs.existsSync(dest)?pin(dest):null;
  if(equalPin(actual,sources[rel]))continue;
  changed++;
  if(mode==='prepare'){
   if(actual?!equalPin(actual,old.files[destRel]):Boolean(old.files[destRel]))throw Error('Publication was edited; preserve and review before preparing: '+name+'/'+destRel);
   writes.push({dest,rel,before:actual});
  }else failures.push({repository:name,path:rel,error:'publication differs from working root'});
 }
 // Full installed package inventories differ by platform/runtime. Keep their
 // published provenance pins, but exclude them from the common source revision.
 for(const rel of spec.retainedMetadata??[]){
  const dest=destination(repo,rel),expected=old.files[rel];
  if(!expected||!fs.existsSync(dest)||!equalPin(pin(dest),expected))throw Error('Published package metadata changed; review separately: '+rel);
  files[rel]=expected;
 }
 if(mode==='check'){
  if(old.sharedRevision!==revision)failures.push({repository:name,error:'shared revision differs'});
  if(!equalFiles(old.files,files))failures.push({repository:name,error:'SOURCE_MANIFEST file set or SHA differs'});
 }
 plans.push({name,repo,manifestPath,old,files,writes,retired});
 results.push({repository:name,files:Object.keys(files).length,changed});
}
// No destination is changed until both repositories pass the complete preflight.
if(mode==='prepare'){
 const backup=destination(root,'.sync/archive/publication-'+Date.now());
 for(const plan of plans){
  const save=dest=>{if(!fs.existsSync(dest))return;const out=path.join(backup,plan.name,path.relative(plan.repo,dest));fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(dest,out);};
  for(const {dest,rel,before} of plan.writes){
   destination(plan.repo,path.relative(plan.repo,dest));
   const current=fs.existsSync(dest)?pin(dest):null;
   if(current||before){if(!equalPin(current,before))throw Error('Destination changed after preflight: '+dest);}
   if(!equalPin(pin(safe(rel)),sources[rel]))throw Error('Source changed after preflight: '+rel);
   save(dest);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(safe(rel),dest);
  }
  for(const dest of plan.retired){
   destination(plan.repo,path.relative(plan.repo,dest));
   if(!equalPin(pin(dest),plan.old.files[path.relative(plan.repo,dest).replaceAll('\\','/')]))throw Error('Retired file changed after preflight: '+dest);
   save(dest);fs.unlinkSync(dest);
  }
  const manifest={...plan.old,source:'Canonical workspace root',sharedRevision:revision,files:plan.files};
  delete manifest.sourceExportManifestSha256;
  destination(plan.repo,path.relative(plan.repo,plan.manifestPath));
  save(plan.manifestPath);fs.writeFileSync(plan.manifestPath,JSON.stringify(manifest,null,2)+'\n');
 }
}
console.log(JSON.stringify({mode,sharedRevision:revision,sourceFiles:Object.keys(sources).length,repositories:results,failures},null,2));
process.exitCode=failures.length?1:0;
