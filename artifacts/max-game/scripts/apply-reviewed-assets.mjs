import replacements from '../src/reviewed-content/asset-replacements.json' with {type:'json'};
import {assertMissionCatalog} from '../vendor/backend-figma-v2/src/contracts/mission-catalog.mjs';
import {MISSION_CATALOG as source} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';
import {applyReviewedPresentation,REVIEWED_PRESENTATION_OVERRIDES} from './apply-reviewed-presentation.mjs';

// Asset-only publication after compiling original reviewed annotations.
// Preserve IDs/revision/progress and scale the existing image-space geometry.
export function applyReviewedAssets(result){
 let catalog=structuredClone(result.catalog);
 for(const replacement of replacements){
  if(!replacement.taskId){
   const old=catalog.assets[replacement.assetId];
   if(!replacement.assetId)throw Error('Invalid added reviewed asset');
   if(old){
    // Shared asset changes are narrowly limited to mission completion QR codes.
    // An image used by a task needs its explicit screen/geometry replacement.
    if(replacement.kind!=='mission-qr'||old.sha256!==replacement.previousSha256||
     !Object.values(catalog.missions).some(m=>m.qr?.assetId===replacement.assetId)||
     Object.values(catalog.tasks).some(t=>Object.values(t.screens).some(s=>s.assetId===replacement.assetId)))throw Error('Invalid shared reviewed QR asset');
   }else if(replacement.previousSha256!==null)throw Error('Invalid added reviewed asset');
   catalog.assets[replacement.assetId]={assetId:replacement.assetId,...replacement.asset};continue;
  }
  const screen=catalog.tasks[replacement.taskId]?.screens[replacement.screenId];
  const sourceScreen=source.tasks[replacement.taskId]?.screens[replacement.screenId];
  const assetId=screen?.assetId??replacement.assetId;
  if(!sourceScreen||sourceScreen.assetId!==assetId||!screen&&!result.metadata.disabled.includes(replacement.screenId))throw Error('Invalid replacement target: '+replacement.screenId);
  const old=catalog.assets[assetId];
  if(!old||old.sha256!==replacement.previousSha256)throw Error('Stale asset replacement: '+replacement.screenId);
  const asset={...old,...replacement.asset};
  if(Object.values(catalog.tasks).flatMap(t=>Object.values(t.screens)).filter(s=>s.assetId===old.assetId).length!==(screen?1:0))throw Error('Replacement asset is shared');
  const scale=rect=>rect.map((n,i)=>n*(i%2?asset.height/old.height:asset.width/old.width));
  for(const action of screen?.actions??[])if(action.placement==='hotspot')action.rect=scale(action.rect);
  for(const annotation of screen?.annotations??[])if(annotation.rect)annotation.rect=scale(annotation.rect);
  catalog.assets[old.assetId]=asset;
  if(screen&&catalog.tasks[replacement.taskId].coreCatalog){
   const core=catalog.tasks[replacement.taskId].coreCatalog;
   core.screens[screen.screenId]=structuredClone(screen);core.assets[old.assetId]=structuredClone(asset);
  }
 }
 catalog=applyReviewedPresentation(catalog);
 assertMissionCatalog(catalog);
 return {catalog,metadata:{...result.metadata,assetReplacements:replacements,presentationOverrides:REVIEWED_PRESENTATION_OVERRIDES}};
}
