// Observe the actual HTMLMediaElement clock; playback remains owned by the existing player.
// send receives state, never PCM or URLs. assetId must come from the accepted audio catalog.
export function observeMediaAudio(media,{trackId,assetId,bus,send,event:reportEvent=()=>{},visible=false,now=()=>performance.now()}={}){
 if(!media||typeof send!=='function'||!trackId||!assetId||!['vk','max','ribbon'].includes(bus))throw Error('AUDIO_MEDIA_OPTIONS');
 let closed=false,shown=visible,blocked=media.paused||media.readyState<2,last=-Infinity,lastState='',revision=0;
 const listeners=new Map();
 media.muted=true;media.defaultMuted=true;
 const sample=()=>({trackId,assetId,bus,state:!shown||media.ended||media.error?'stopped':!blocked&&!media.paused&&!media.ended&&!media.error&&media.readyState>=2?'playing':'paused',positionSeconds:Math.max(0,Number(media.currentTime)||0),rate:Number(media.playbackRate)||1,gain:Math.min(1,Math.max(0,Number(media.volume)||0)),loop:!!media.loop});
 function publish(force=false){
  if(closed)return;const value=sample(),at=now();
  // Position refresh is required even without DOM events; receiver expires dead producers.
  if(!force&&value.state===lastState&&at-last<250)return;
  last=at;lastState=value.state;send({...value,revision:++revision});
 }
 for(const event of ['playing','pause','waiting','stalled','seeking','seeked','ended','error','emptied','ratechange','volumechange','timeupdate']){
  const fn=()=>{
   if(!['timeupdate','volumechange'].includes(event))reportEvent({type:'media.'+event,cue:assetId,voiceId:trackId,...(event==='error'?{errorCode:String(media.error?.code??'unknown')}:{})});
   if(event==='playing')blocked=false;
   if(['waiting','stalled','seeking','error','emptied'].includes(event))blocked=true;
   if(event==='seeked')blocked=media.paused||media.readyState<2;
   if(event==='volumechange'&&!media.muted)media.muted=true;
   publish(event!=='timeupdate');
  };media.addEventListener(event,fn);listeners.set(event,fn);
 }
 return {
  setVisible(value){if(shown===!!value)return;shown=!!value;publish(true);},
  tick(){publish();},
  dispose(){if(closed)return;closed=true;for(const [event,fn]of listeners)media.removeEventListener(event,fn);send({...sample(),state:'stopped',revision:++revision});}
 };
}

/** One record per visible object, including duplicate assets. Never choose a solo item. */
export function createVisibleMediaAudio({send,bus,namespace,assetIdFor,now}={}){
 const entries=new Map();
 return {
  frame(items){
   const live=new Set();
   for(const item of items){
    if(!item.video)continue;const assetId=assetIdFor(item);if(!assetId)continue;
    const id=String(item.itemId);live.add(id);let e=entries.get(id);
    if(e&&(e.video!==item.video||e.assetId!==assetId)){e.observer.dispose();entries.delete(id);e=null;}
    if(!e){e={video:item.video,assetId,observer:observeMediaAudio(item.video,{trackId:namespace+':'+id,assetId,bus,send,now})};entries.set(id,e);}
    e.observer.setVisible(item.visible===true);e.observer.tick();
   }
   for(const [id,e]of entries)if(!live.has(id)){e.observer.dispose();entries.delete(id);}
  },
  dispose(){for(const e of entries.values())e.observer.dispose();entries.clear();}
 };
}
