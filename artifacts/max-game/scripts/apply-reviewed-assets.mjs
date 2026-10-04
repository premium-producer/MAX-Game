import replacements from '../src/reviewed-content/asset-replacements.json' with {type:'json'};
import {assertMissionCatalog} from '../vendor/backend-figma-v2/src/contracts/mission-catalog.mjs';
import {MISSION_CATALOG as source} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';

// Asset-only publication after compiling original reviewed annotations.
// Preserve IDs/revision/progress and scale the existing image-space geometry.
export function applyReviewedAssets(result){
 const catalog=structuredClone(result.catalog);
 for(const replacement of replacements){
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
 }
 assertMissionCatalog(catalog);
 return {catalog,metadata:{...result.metadata,assetReplacements:replacements}};
}
