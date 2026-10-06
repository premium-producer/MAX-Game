import {V5MotionValue} from './journey-v5-inertia.mjs';
import {V5_MOTION} from './journey-v5-motion-profile.mjs';
import {v5DeviceMetrics} from './journey-v5-device-morph.mjs';
import {v5IconTile} from './journey-v5-icons.mjs';
import {sharedTaskMarkup,sharedAssetUrl} from './journey-shared-ui.mjs';
import {createV5RouteMeasure} from './journey-v5-route-layout.mjs';
import {createDeviceVideo} from './journey-v5-video-source.mjs';
import {masterAudioEnabled,openAudioPort} from '../audio-producer-port.mjs';
import {createIndependentCycle,DEFAULT_CYCLE_ASSETS} from './journey-v5-independent-cycle.mjs';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const independentKey=s=>`${s.owner??''}:${s.revision}:${s.modeEpoch}:${s.settingsRevision??0}`;
export function independentIconMarkup(catalog,id,size){
 const asset=catalog.assets[catalog.uiIcons[id]];
 if(asset?.presentationStyle!=='artwork')return v5IconTile(catalog,id,size);
 if(asset.kind!=='image'||!(asset.width>0&&asset.height>0)||!asset.path)throw Error('MAX_ICON_ARTWORK_INVALID');
 const fit=Math.min(size/asset.width,size/asset.height),width=asset.width*fit,height=asset.height*fit;
 return `<span class="tile" data-independent-artwork="true" style="display:block;width:${size}px;height:${size}px;position:relative;border:0;border-radius:0;padding:0;background:transparent;box-shadow:none"><img data-independent-artwork="true" draggable="false" alt="" src="${esc(sharedAssetUrl(asset))}" style="position:absolute;display:block;left:${(size-width)/2}px;top:${(size-height)/2}px;width:${width}px;height:${height}px;object-fit:contain;border:0;border-radius:0"></span>`;
}
// Presentation only: no SessionPort, action dispatch, additional canvas or ticker.
export function createIndependentAssets({host,arena,foreground,catalog,reduced,changed,onApplied,onError,cycleClock,audioPort=masterAudioEnabled()?openAudioPort('max-independent'):null}){
 const measure=createV5RouteMeasure(arena),items=new Map(),presence=new V5MotionValue(0);
 const labels=new Map(Object.values(catalog.tasks).map(task=>[task.iconAssetId,task.title]));
 for(const [role,label]of Object.entries({'open-max':'Открыть MAX',scan:'Открой возможности',restart:'Начать заново',fallback:'MAX'}))if(catalog.uiIcons[role])labels.set(catalog.uiIcons[role],label);
 let state=null,key='',disposed=false,serial=0,assetId=undefined,ready=false,pending=false,failed=false,acked='';
 let width=v5DeviceMetrics().width,height=800,requestedAsset=undefined,scale=1,iconSize=256,preparedTransition=null;
 let currentVideo=null,pendingVideo=null,active=true;
 let cycleToken=null;
 const cycle=createIndependentCycle({assetFor:id=>catalog.assets[id],clock:cycleClock,onSelect:selection=>{cycleToken=selection.token;prepareAsset(selection.assetId);audioPort?.event?.({type:'independent.cycle.select',cue:selection.assetId});publishAudioState();}});
 function publishAudioState(){audioPort?.state?.({branch:'max',phase:'assets',screen:requestedAsset??null,cycle:!!state?.assetsSettings.cycleEnabled,active:active&&!!state?.assetsSettings.deviceVisible&&ready,ready,pending,failed});}
 const disposeVideo=video=>{if(video){foreground.releaseVideo?.(video.element);video.dispose();}};
 const shell=host.ownerDocument.createElement('section');shell.className='route-phone client-task';shell.inert=true;shell.dataset.pathPresence='0';host.append(shell);
 host.dataset.routePhase='planning';host.dataset.uiPresence='1';host.inert=true;
 const style=(el,name,value)=>{if(el.style[name]!==value)el.style[name]=value;};
 function geometry(){
  const nodes=[...items.values()].filter(i=>i.wanted),left=nodes.filter(i=>i.spec.side==='left').reverse(),right=nodes.filter(i=>i.spec.side==='right'),ordered=[...left,...right];
  // Scale the whole virtual composition uniformly, retaining the normal 400px gap.
  style(host,'left','0px');style(host,'top','0px');style(host,'width','4096px');style(host,'height','1280px');style(host,'overflow','visible');
  style(shell,'left',`${2048-width/2}px`);style(shell,'top',`${640-height/2}px`);style(shell,'width',`${width}px`);style(shell,'height',`${height}px`);
  const offsets=measure(ordered.map(i=>({step:i.id})),null,{width,height},iconSize*scale,left.length,400*scale);
  for(const item of ordered){const p=offsets[item.id],x=2048+p.x-iconSize*scale/2,y=640+p.y-iconSize*scale/2;style(item.el,'left',`${x}px`);style(item.el,'top',`${y}px`);foreground.setTarget(host,item.id,{left:x,top:y});}
  const app=shell.querySelector('.demo-app');if(app){style(app,'width','100%');style(app,'height','100%');style(app,'padding','12px 10px');}
 }
 function prepareAsset(id){
  const asset=id===null?null:catalog.assets[id];if(id!==null&&!asset)throw Error('MAX_ASSET_UNKNOWN');
  const ticket=++serial;requestedAsset=id;pending=true;ready=false;failed=false;preparedTransition=null;delete shell.dataset.gpuUploadError;
  disposeVideo(pendingVideo);pendingVideo=null;
  if(foreground.contentBusy(host))foreground.cancelContent(host);
  foreground.prewarmDeviceAssets(asset&&asset.kind!=='video'?[asset]:[]);
  const template=host.ownerDocument.createElement('template');
  template.innerHTML=asset?sharedTaskMarkup({state:{status:'presentation'},view:{device:{kind:'phone',asset},actions:[]}}):'<section><div class="demo-app" data-device="phone"><div class="phone-content" data-task-content></div></div></section>';
  // template.content has an inert owner document: adopt before decode, even while detached.
  const next=host.ownerDocument.adoptNode(template.content.querySelector('.demo-app'));let image=next.querySelector('img');
  if(image)image.src=new URL(sharedAssetUrl(asset),host.ownerDocument.baseURI).href;
  let preparedVideo=null;
  const mediaFailure=error=>{if(disposed||ticket!==serial||failed)return;pending=false;failed=true;onError(error);};
  if(asset?.kind==='video'){
   const selectedToken=cycleToken;
   preparedVideo=createDeviceVideo(host.ownerDocument,asset,{onError:mediaFailure,audioPort,audioTrackId:`max-independent:${ticket}`,loop:!state.assetsSettings.cycleEnabled,onEnded:()=>{if(!disposed&&ticket===serial)cycle.ended(selectedToken);}});pendingVideo=preparedVideo;
   image.replaceWith(preparedVideo.element);image=null;
  }
  const load=async()=>{if(preparedVideo)await preparedVideo.ready;else if(image){foreground.takePreparedPhoneImage(image);image=next.querySelector('img');image.dataset.gpuDecoded='false';await image.decode();image.dataset.gpuDecoded='true';}};
  void load().then(()=>{
   if(disposed||ticket!==serial)return;
   const metrics=v5DeviceMetrics({asset}),mediaKey=`independent:${ticket}:${id??'blank'}`;height=metrics.height;
   const commit=()=>{if(disposed||ticket!==serial)return;disposeVideo(currentVideo);currentVideo=preparedVideo;pendingVideo=null;const old=shell.querySelector('.demo-app');if(old){old.replaceChildren(...next.childNodes);}else shell.append(next);shell.dataset.sceneVersion=mediaKey;shell.dataset.mediaReadyKey=mediaKey;delete shell.dataset.gpuReadyKey;delete shell.dataset.gpuUploadError;assetId=id;pending=false;failed=false;geometry();foreground.refreshPart(shell);changed();};
   if(shell.querySelector('.demo-app'))preparedTransition=()=>foreground.transitionContent(host,commit,{from:width,to:metrics.width,resize:value=>{if(ticket!==serial)return;width=value;geometry();},ready:()=>disposed||ticket!==serial||shell.dataset.gpuReadyKey===mediaKey});
   else{width=metrics.width;geometry();commit();}
  }).catch(mediaFailure);
 }
 function accept(next){
  const nextKey=independentKey(next);if(disposed||nextKey===key)return;
  const settings=next.assetsSettings;
  if(!settings||!Array.isArray(settings.icons)||settings.icons.length>8)throw Error('MAX_ASSETS_SETTINGS_INVALID');
  const fitIds=settings.cycleEnabled?(settings.cycleAssetIds??DEFAULT_CYCLE_ASSETS):[settings.deviceAssetId];
  const metrics={width:Math.max(...fitIds.map(id=>v5DeviceMetrics({asset:catalog.assets[id]}).width))},count=side=>settings.icons.filter(i=>i.side===side).length;
  const previousIconPixels=iconSize*scale;iconSize=settings.iconSizePx??256;
  if(!Number.isInteger(iconSize)||iconSize<64||iconSize>1024)throw Error('MAX_ICON_SIZE_INVALID');
  const slots=Math.max(count('left'),count('right'));
  scale=slots?Math.min(1,Math.max(0,1952-metrics.width/2)/(slots*(iconSize+400))):1;
  const aliases={...catalog,tasks:{},missions:{},uiIcons:{...catalog.uiIcons}};
  for(const spec of settings.icons)aliases.uiIcons[spec.instanceId]=spec.assetId;
  const markup=new Map(settings.icons.map(spec=>[spec.instanceId,independentIconMarkup(aliases,spec.instanceId,iconSize*scale)]));
  state=next;key=nextKey;acked='';
  for(const item of items.values())item.wanted=false;
  for(const spec of settings.icons){
   let item=items.get(spec.instanceId);
   const priorImage=item?.el.querySelector('img[data-independent-artwork]');
   const retryArtwork=priorImage&&(priorImage.dataset.gpuDecoded==='failed'||priorImage.dataset.gpuUploadError);
   if(item&&(item.spec.assetId!==spec.assetId||iconSize*scale!==previousIconPixels||retryArtwork)){item.el.querySelector('.tile').outerHTML=markup.get(spec.instanceId);const fresh=item.el.querySelector('img[data-independent-artwork]');if(fresh&&retryArtwork)fresh.dataset.gpuRetry='true';foreground.refreshPart(item.el);}
   if(!item){const el=host.ownerDocument.createElement('button');el.className='object';el.dataset.object=spec.instanceId;el.dataset.planning='true';el.dataset.pathPresence='0';el.inert=true;el.style.position='absolute';el.innerHTML=markup.get(spec.instanceId)+'<span class="object-label icon-caption"></span>';host.append(el);item={id:spec.instanceId,el,presence:new V5MotionValue(0)};items.set(spec.instanceId,item);foreground.invalidate();}
   const asset=catalog.assets[spec.assetId],artwork=asset?.presentationStyle==='artwork';
   const caption=item.el.querySelector('.icon-caption');caption.textContent=artwork?'':labels.get(spec.assetId)??'MAX';caption.hidden=artwork;caption.style.fontSize=`${32*scale}px`;item.el.style.width=`${iconSize*scale}px`;item.el.setAttribute('aria-label',asset?.label??labels.get(spec.assetId)??'MAX');
   const artworkImage=item.el.querySelector('img[data-independent-artwork]');
   if(artworkImage&&artworkImage.dataset.gpuDecoded===undefined){
    artworkImage.dataset.gpuDecoded='false';
    void artworkImage.decode().then(()=>{if(disposed||!artworkImage.isConnected)return;artworkImage.dataset.gpuDecoded='true';foreground.refreshPart(item.el);changed();}).catch(error=>{if(disposed||!artworkImage.isConnected)return;artworkImage.dataset.gpuDecoded='failed';onError(error);});
   }
   item.spec=spec;item.wanted=true;
  }
  const ordered=settings.icons.map(s=>[s.instanceId,items.get(s.instanceId)]);for(const [id,item]of items)if(!item.wanted)ordered.push([id,item]);items.clear();for(const pair of ordered)items.set(...pair);
  geometry();
  const cycleChanged=cycle.configure(settings);
  if(!settings.cycleEnabled){cycleToken=null;if(cycleChanged||settings.deviceAssetId!==requestedAsset||failed)prepareAsset(settings.deviceAssetId);}
  else if(!cycleChanged&&failed)prepareAsset(cycle.selected().assetId);
  if(!active||!settings.deviceVisible){cycle.hide();currentVideo?.setPlaying(false);}
  publishAudioState();
 }
 function tick(dt){
  if(disposed||!state)return;
  dt=Math.min(dt,.05);const settings=state.assetsSettings;
  if(preparedTransition&&!foreground.contentBusy(host)&&preparedTransition())preparedTransition=null;
  ready=!pending&&!failed&&shell.dataset.gpuReadyKey===shell.dataset.sceneVersion&&!!shell.dataset.sceneVersion;
  if(shell.dataset.gpuUploadError&&!failed){failed=true;onError(Error('MAX_ASSET_GPU_UPLOAD_FAILED'));}
  const deviceGoal=Number(settings.deviceVisible&&(ready||assetId!==undefined));presence.step(deviceGoal,dt,V5_MOTION.presenceOmega,reduced.matches);shell.dataset.pathPresence=String(presence.value);
  currentVideo?.setPlaying(active&&dt>0&&settings.deviceVisible&&presence.value>.01&&Number(host.dataset.contentPresence??1)>.01);
  let settled=presence.at(deviceGoal,.005,.05)&&!foreground.contentBusy(host)&&!pending&&!failed;
  if(active&&dt>0&&settings.deviceVisible&&deviceGoal===1&&settled&&ready){cycle.ready(cycleToken);if(currentVideo?.element.ended)cycle.ended(cycleToken);}else cycle.hide();
  if(currentVideo)settled&&=currentVideo.readyForAck(settings.deviceVisible);
  for(const [id,item]of items){
   const image=item.el.querySelector('img[data-independent-artwork]'),imageReady=!image||image.dataset.gpuReady==='true';
   if(image?.dataset.gpuUploadError&&!image.dataset.errorReported){image.dataset.errorReported='true';onError(Error('MAX_ICON_GPU_UPLOAD_FAILED'));}
   const requested=item.wanted&&settings.iconsVisible&&item.spec.enabled,goal=Number(requested&&imageReady);item.presence.step(goal,dt,V5_MOTION.presenceOmega,reduced.matches);item.el.dataset.pathPresence=String(item.presence.value);
   settled&&=(!requested||imageReady)&&item.presence.at(goal,.005,.05)&&(!goal||foreground.isSettled(host,id));
   if(!item.wanted&&item.presence.at(0,.005,.05)){item.el.remove();items.delete(id);foreground.invalidate();}
  }
  geometry();changed();publishAudioState();
  if(settled&&ready&&acked!==key){acked=key;onApplied({...state,sceneKey:key});}
 }
 return {accept,tick,fit:geometry,key:()=>key,setActive(value){active=!!value;if(!active){cycle.hide();currentVideo?.setPlaying(false);}publishAudioState();},dispose(){if(disposed)return;disposed=true;serial++;cycle.dispose();disposeVideo(pendingVideo);disposeVideo(currentVideo);pendingVideo=null;currentVideo=null;audioPort?.close();foreground.cancelContent(host);measure.dispose?.();for(const item of items.values())item.el.remove();shell.remove();items.clear();host.style.transform='';foreground.invalidate();}};
}
