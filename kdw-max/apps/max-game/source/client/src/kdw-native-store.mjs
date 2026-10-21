// Native HTML storefront uses the same device shell and presentation authority.
export function applyNativeStore(catalog){
 catalog.kdwStoreActivity=6;
 const assetId='kdw.native.store-phone';
 catalog.assets[assetId]={assetId,path:'assets/kdw-native/store-phone.svg',width:390,height:800,sha256:'828dcb6fad602311e9fc23db9f7e3f75a91ebad5dbbb436f52fec954739fc944',mimeType:'image/svg+xml'};
 for(const screen of Object.values(catalog.tasks['business.store'].screens)){
  screen.deviceKind='phone';screen.assetId=assetId;screen.annotations=[];
  for(const action of screen.actions){action.placement='below-screen';delete action.rect;}
  // Keep authored actions for receipt replay, but publish the native catalogue
  // in one command without navigating through duplicate storefront screens.
  screen.actions.push({actionId:screen.screenId+'.publish-now',label:'Опубликовать витрину',placement:'below-screen',outcome:{kind:'complete-task'}});
 }
 return catalog;
}
