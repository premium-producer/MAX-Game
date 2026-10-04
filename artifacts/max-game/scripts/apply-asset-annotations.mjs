import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {MISSION_CATALOG as base} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';
import {assertMissionCatalog} from '../vendor/backend-figma-v2/src/contracts/mission-catalog.mjs';
import {validateDocument} from '../src/asset-audit/model.mjs';
import {createAuditCatalog} from './build-asset-audit.mjs';

const sha=value=>createHash('sha256').update(value).digest('hex');
/** Offline content compilation. Navigation/execution remains in the installed backend. */
export function applyAssetAnnotations(source,input){
 const document=validateDocument(input,createAuditCatalog(source));
 const annotationHash=sha(JSON.stringify(document));
 const catalog=structuredClone(source),settings=new Map(document.screens.map(s=>[s.screenId,s]));
 const records=new Map(document.records.map(r=>[JSON.stringify([r.screenId,r.actionId]),r]));
 const revision=`missions-reviewed-20261003-${annotationHash.slice(0,12)}`;
 const disabled=[],manual=[];
 for(const task of Object.values(catalog.tasks)){
  for(const screen of Object.values(task.screens)){
   let reviewed=false;
   for(const action of screen.actions){
    const r=records.get(JSON.stringify([screen.screenId,action.actionId]));
    if(r){reviewed=true;action.placement=r.placement;if(r.placement==='hotspot')action.rect=[...r.rect];else delete action.rect;}
    if(settings.get(screen.screenId)?.final&&['navigate','skip-screen'].includes(action.outcome.kind)){
     if(action.outcome.answer)throw Error(`Final would hide an answer effect: ${screen.screenId}`);
     action.outcome={kind:'complete-task'};
    }
   }
   if(reviewed&&screen.automaticMs!==null){screen.automaticMs=null;screen.mode='manual';manual.push(screen.screenId);}
  }
  // Only unambiguous, side-effect-free hidden screens may be bypassed.
  const resolve=(outcome,seen=new Set())=>{
   if(!['navigate','skip-screen'].includes(outcome.kind)||settings.get(outcome.screenId)?.enabled!==false)return structuredClone(outcome);
   const id=outcome.screenId,screen=task.screens[id];
   if(seen.has(id)||!screen||screen.missing||screen.actions.length!==1)throw Error(`Ambiguous disabled screen: ${id}`);
   const next=screen.actions[0].outcome;
   if(next.answer||!['navigate','complete-task'].includes(next.kind))throw Error(`Disabled screen has a semantic effect: ${id}`);
   const result=resolve(next,new Set([...seen,id]));
   if(outcome.answer)result.answer=structuredClone(outcome.answer);
   return result;
  };
  const start=resolve({kind:'navigate',screenId:task.startScreenId});
  if(start.kind!=='navigate')throw Error(`No playable start: ${task.taskId}`);
  task.startScreenId=start.screenId;
  for(const screen of Object.values(task.screens))for(const action of screen.actions)action.outcome=resolve(action.outcome);
  for(const id of Object.keys(task.screens))if(settings.get(id)?.enabled===false){disabled.push(id);delete task.screens[id];}
  if(task.coreCatalog){
   task.coreCatalog.screens=structuredClone(task.screens);
   task.coreCatalog.startScreenId=task.startScreenId;
   task.coreCatalog.contentRevision=`channel-reviewed-20261003-${annotationHash.slice(0,12)}`;
  }
 }
 catalog.contentRevision=revision;
 assertMissionCatalog(catalog);
 return {catalog,metadata:{sourceRevision:source.contentRevision,revision,annotationSha256:annotationHash,records:document.records.length,screenSettings:document.screens.length,disabled,manual,finalScreens:document.screens.filter(s=>s.final).map(s=>s.screenId),effectiveScreens:Object.values(catalog.tasks).reduce((n,t)=>n+Object.keys(t.screens).length,0)}};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../src/reviewed-content');
 const input=JSON.parse(await fs.readFile(path.join(root,'annotations.json'),'utf8'));
 const {catalog,metadata}=applyAssetAnnotations(base,input);
 await fs.writeFile(path.join(root,'mission-catalog.json'),JSON.stringify(catalog,null,2)+'\n');
 await fs.writeFile(path.join(root,'annotation-source.json'),JSON.stringify(metadata,null,2)+'\n');
 console.log(JSON.stringify(metadata));
}
