import {applyReviewedAssets} from './apply-reviewed-assets.mjs';
import {assertCanvasSafeReviewedSvg} from './prepare-reviewed-svg.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {MISSION_CATALOG as base} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';
import {validateFlowDocument, migrateFlowDocument} from '../src/asset-audit/flow-document.mjs';
import {createAuditCatalog} from './build-asset-audit.mjs';
import {applyAssetAnnotations} from './apply-asset-annotations.mjs';

// Lossless compatibility gate for manual, source-action exports. The existing
// backend remains authoritative. Unsupported v3 features fail before any write.
export function applyAssetFlow(source, input, {rectCorrections=[]}={}) {
 const value=structuredClone(input); delete value.exportedAt; delete value.revision;
 const document=validateFlowDocument(value,createAuditCatalog(source));
 const flowSha256=createHash('sha256').update(JSON.stringify(document)).digest('hex');
 for(const fix of rectCorrections){
  const screen=document.tasks.flatMap(t=>t.screens).find(s=>s.screenId===fix.screenId);
  const action=screen?.interactions.find(i=>i.interactionId===fix.interactionId);
  if(action?.kind!=='hotspot'||!same(action.rect,fix.expectedRect))throw Error(`FLOW_CORRECTION_STALE: ${fix.interactionId}`);
  action.rect=[...fix.rect];
 }
 validateFlowDocument(document,createAuditCatalog(source));
 const reject=(id,reason)=>{throw Error(`FLOW_ADAPTER_UNSUPPORTED: ${id}: ${reason}`);};
 const stamp='2026-10-04T00:00:00.000Z';
 const legacy={schemaVersion:2,contentRevision:source.contentRevision,records:[],screens:[]};
 for(const mission of document.missions)if(mission.helpText!==null)reject(mission.missionId,'mission help');
 for(const task of document.tasks){
  const original=source.tasks[task.taskId];
  if(task.helpText!==null||task.startScreenId!==original.startScreenId)reject(task.taskId,'help/start');
  for(const screen of task.screens){
   const prior=original.screens[screen.screenId];
   if(screen.help.mode!=='override'||screen.help.text!==prior.instruction)reject(screen.screenId,'help');
   legacy.screens.push({taskId:task.taskId,screenId:screen.screenId,assetId:screen.assetId,assetSha256:screen.assetSha256,enabled:screen.enabled,final:screen.final,updatedAt:stamp});
   const active=screen.interactions.filter(i=>i.enabled);
   if(screen.enabled){
    if(screen.deletedSourceActionIds.length||active.length!==prior.actions.length)reject(screen.screenId,'added/removed actions');
    for(const [index,action] of prior.actions.entries()){
     const matches=active.filter(i=>i.sourceActionId===action.actionId&&i.interactionId===action.actionId);
     if(matches.length!==1)reject(screen.screenId,'action identity');
     const i=matches[0];
     if(!['hotspot','button'].includes(i.kind))reject(screen.screenId,'active timer');
     const label=i.kind==='button'?i.label:i.name;
     if(label!==action.label||(i.kind==='button'&&i.order!==index))reject(i.interactionId,'label/order');
     let outcome=action.outcome;
     if(screen.final&&['navigate','skip-screen'].includes(outcome.kind)&&!outcome.answer)outcome={kind:'complete-task'};
     const target=['navigate','skip-screen'].includes(outcome.kind)?{kind:'screen',screenId:outcome.screenId}:outcome.kind==='complete-task'?{kind:'complete-task'}:null;
     if(!same(target,i.target))reject(i.interactionId,'changed route');
     legacy.records.push({screenId:screen.screenId,assetId:screen.assetId,assetSha256:screen.assetSha256,actionId:action.actionId,label:action.label,placement:i.kind==='hotspot'?'hotspot':'below-screen',...(i.kind==='hotspot'?{rect:[...i.rect]}:{}),reviewed:true,updatedAt:stamp});
    }
   }else{
    // The existing compiler bypasses a disabled screen through its sole source
    // action. Do not infer a route when the editor changed that continuation.
    const action=prior.actions[0],i=active[0];
    const target=action?.outcome.kind==='navigate'?{kind:'screen',screenId:action.outcome.screenId}:action?.outcome.kind==='complete-task'?{kind:'complete-task'}:null;
    if(prior.actions.length!==1||active.length!==1||!i||i.sourceActionId!==action.actionId||action.outcome.answer||!target||!same(i.target,target))reject(screen.screenId,'ambiguous disabled continuation');
   }
  }
 }
 const result=applyAssetAnnotations(source,legacy);
 for(const record of legacy.records){
  const actual=Object.values(result.catalog.tasks).flatMap(t=>Object.values(t.screens)).find(s=>s.screenId===record.screenId)?.actions.find(a=>a.actionId===record.actionId);
  if(record.placement==='hotspot'&&!same(actual?.rect,record.rect))reject(record.actionId,'coordinate precision');
 }
 // Validate the effective graph AFTER the established disabled-screen bypass:
 // Ajv provenance + Graphlib reachability, exits, overlaps and automatic cycles.
 const effective=createAuditCatalog(result.catalog);
 const normalized=migrateFlowDocument({schemaVersion:2,contentRevision:result.catalog.contentRevision,records:[],screens:[]},effective);
 validateFlowDocument(normalized,effective,{publish:true});
 return {...result,metadata:{...result.metadata,flowSchemaVersion:3,flowSha256,rectCorrections:structuredClone(rectCorrections),adapter:'manual-source-actions-v1',activeInteractions:legacy.records.length}};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../src/reviewed-content');
 const input=JSON.parse(await fs.readFile(path.join(root,'flow.json'),'utf8'));
 const rectCorrections=JSON.parse(await fs.readFile(path.join(root,'flow-corrections.json'),'utf8'));
 const {catalog,metadata}=applyReviewedAssets(applyAssetFlow(base,input,{rectCorrections}));
 for(const asset of Object.values(catalog.assets).filter(a=>a.origin?.preparation?.kind==='canvas-safe-svg')){
  const svg=await fs.readFile(path.resolve(root,'../../public',asset.path),'utf8');
  assertCanvasSafeReviewedSvg(svg);
  if(createHash('sha256').update(svg).digest('hex')!==asset.sha256)throw Error('REVIEWED_SVG_PREPARED_SHA_MISMATCH: '+asset.assetId);
 }
 await fs.writeFile(path.join(root,'mission-catalog.json'),JSON.stringify(catalog,null,2)+'\n');
 await fs.writeFile(path.join(root,'annotation-source.json'),JSON.stringify(metadata,null,2)+'\n');
 console.log(JSON.stringify(metadata));
}
