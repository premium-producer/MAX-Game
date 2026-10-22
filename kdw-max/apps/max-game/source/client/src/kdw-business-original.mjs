import archive from '../vendor/backend-figma-v2/manifest.json' with {type:'json'};

// Separate iteration and save namespace. The customized build remains intact.
export const BUSINESS_ORIGINAL=globalThis.location?.pathname?.endsWith('/cafe-original.html')===true;
export function applyOriginalCafe(catalog,base){
 for(const taskId of ['business.platform','business.channel','business.bot']){
  const task=catalog.tasks[taskId],source=base.tasks[taskId];
  task.startScreenId=source.startScreenId;
  for(const [id,screen] of Object.entries(source.screens)){
   // The playable post feed and storefront keep their current mechanics.
   if(id==='business.channel.result')continue;
   task.screens[id]=structuredClone(screen);
   const asset=archive.assets[screen.assetId];
   if(!asset||asset.mimeType!=='image/png')throw Error('Missing original cafe PNG: '+id);
   const previous=base.assets[screen.assetId],sx=asset.width/previous.width,sy=asset.height/previous.height;
   for(const item of [...task.screens[id].actions,...task.screens[id].annotations]){
    if(item.rect)item.rect=item.rect.map((v,i)=>v*(i%2?sy:sx));
   }
   catalog.assets[asset.assetId]=structuredClone(asset);
  }
 }
 delete catalog.tasks['business.platform'].screens['business.platform.business-type'];
 delete catalog.kdwBusinessChoice;
 delete catalog.kdwBusinessConfirmation;
 delete catalog.kdwBusinessPlatformLegacy;
 catalog.kdwBusinessNative=false;
 catalog.kdwBusinessOriginal=true;
 return catalog;
}
