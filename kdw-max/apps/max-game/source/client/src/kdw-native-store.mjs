import chrome from './kdw-store-chrome.json' with {type:'json'};
// Native HTML storefront uses the same device shell and presentation authority.
export function applyNativeStore(catalog){
 catalog.kdwStoreActivity=7;
 const assetId='kdw.native.store-phone';
 Object.assign(catalog.assets,chrome);
 for(const screen of Object.values(catalog.tasks['business.store'].screens)){
  screen.deviceKind='phone';screen.assetId=assetId;screen.annotations=[];
  for(const action of screen.actions){action.placement='below-screen';delete action.rect;}
  // Keep authored actions for receipt replay, but publish the native catalogue
  // in one command without navigating through duplicate storefront screens.
  screen.actions.push({actionId:screen.screenId+'.publish-now',label:'Опубликовать витрину',placement:'below-screen',outcome:{kind:'complete-task'}});
 }
 return catalog;
}
