import details from './kdw-visitor-details-assets.json' with {type:'json'};
export function applyVisitorDetails(catalog){
 Object.assign(catalog.assets,details.assets);
 for(const [id,assetId] of Object.entries(details.screens)){
  const taskId=id.split('.').slice(0,2).join('.');catalog.tasks[taskId].screens[id].assetId=assetId;
 }
 return catalog;
}
