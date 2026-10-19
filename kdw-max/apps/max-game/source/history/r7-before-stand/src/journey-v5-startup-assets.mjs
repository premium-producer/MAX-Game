import {ImageLoader,LoadingManager} from 'three';
import {withTimeout} from './asset-preparation.mjs';
import {sharedTaskMarkup,sharedAssetUrl} from './journey-shared-ui.mjs';
import {v5DeviceMetrics} from './journey-v5-device-morph.mjs';

// Content enumeration only; never sends commands or advances a live session.
export function v5StartupPlan(catalog,extra=[]){
 const screens=Object.values(catalog.tasks).flatMap(task=>Object.values(task.screens).map(screen=>({task,screen,asset:screen.missing?null:catalog.assets[screen.assetId]})));
 const urls=[...new Set([...screens.map(row=>sharedAssetUrl(row.asset)),...Object.values(catalog.missions).map(m=>sharedAssetUrl(catalog.assets[m.qr?.assetId])),...extra].filter(Boolean))];
 return {screens,urls};
}

export function v5StartupScreen({task,screen,asset},paused=false){
 const metrics=v5DeviceMetrics({kind:screen.deviceKind,asset,actions:screen.actions});
 const markup=sharedTaskMarkup({state:{status:'active',screenId:screen.screenId},view:{missing:screen.missing,device:{kind:screen.deviceKind,asset,annotations:screen.annotations??[]},instruction:{text:screen.instruction},actions:screen.actions}},{title:task.title});
 return {markup,metrics,paused};
}

export class V5StartupAssets{
 constructor(baseURL,{manager=new LoadingManager(),loader=null}={}){
  this.baseURL=baseURL;this.manager=manager;this.loader=loader??new ImageLoader(manager);this.images=new Map();this.disposed=false;
 }
 async load(urls,onProgress=()=>{}){
  const unique=[...new Set(urls.map(url=>new URL(url,this.baseURL).href))];let ready=0;onProgress(0,unique.length);
  await Promise.all(unique.map(url=>withTimeout(async()=>{
   const image=await this.loader.loadAsync(url);await image.decode();
   if(this.disposed)throw Error('MAX startup cancelled');
   this.images.set(url,image);onProgress(++ready,unique.length);
  },60000,url)));
  return this;
 }
 getImage(src){return this.images.get(new URL(src,this.baseURL).href)??null;}
 takeImage(template){
  const image=this.getImage(template.src);
  if(!image||image.isConnected)return false;
  // Changing crossorigin after loading can restart the browser image request.
  for(const attr of [...image.attributes])if(attr.name!=='src'&&attr.name!=='crossorigin')image.removeAttribute(attr.name);
  for(const attr of template.attributes)if(attr.name!=='src')image.setAttribute(attr.name,attr.value);
  image.dataset.preparedPhone='true';template.replaceWith(image);return true;
 }
 dispose(){this.disposed=true;this.images.clear();}
}
