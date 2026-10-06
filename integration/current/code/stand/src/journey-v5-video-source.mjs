import {observeMediaAudio} from '../media-audio-observer.mjs';
// HTMLMediaElement owns decoding/looping; Three.VideoTexture owns frame updates.
// This adapter only binds readiness and lifetime to the retained device scene.
export function createDeviceVideo(document,asset,{onError=()=>{},onEnded=()=>{},loop=true,timeoutMs=15000,audioPort=null,audioTrackId='max-independent:video'}={}){
 const element=document.createElement('video');element.className='task-media-image';
 element.muted=true;element.defaultMuted=true;element.loop=loop;element.playsInline=true;element.preload='auto';
 element.setAttribute('muted','');element.setAttribute('playsinline','');element.setAttribute('aria-hidden','true');
 Object.assign(element.style,{display:'block',width:'100%',height:'100%',objectFit:'fill'});
 let disposed=false,loaded=false,failed=false,wanted=false,playing=false,starting=false,settle,playEpoch=0;
 const audioObserver=audioPort?observeMediaAudio(element,{trackId:audioTrackId,assetId:'video:'+asset.sha256,bus:'max',visible:false,send:value=>audioPort.send(value),event:value=>audioPort.event(value)}):null;
 const cleanupReady=()=>{clearTimeout(timer);element.removeEventListener('loadeddata',data);};
 const ready=new Promise((resolve,reject)=>{settle={resolve,reject};});
 function data(){
  if(disposed||loaded||element.readyState<2)return;
  if(element.videoWidth!==asset.width||element.videoHeight!==asset.height){fail(Error('MAX_VIDEO_DIMENSIONS_MISMATCH'));return;}
  loaded=true;cleanupReady();settle.resolve();
 }
 function fail(error){if(disposed||failed)return;failed=true;wanted=false;playing=false;audioObserver?.setVisible(false);element.pause();cleanupReady();settle.reject(error);onError(error);}
 const error=()=>fail(Error('MAX_VIDEO_MEDIA_ERROR_'+(element.error?.code??'UNKNOWN')));
 const ended=()=>{if(!disposed&&!failed&&!element.loop){playing=false;onEnded();}};
 element.addEventListener('ended',ended);
 element.addEventListener('loadeddata',data);element.addEventListener('error',error);
 const timer=setTimeout(()=>fail(Error('MAX_VIDEO_READY_TIMEOUT')),timeoutMs);
 element.src=`./${asset.path}?v=${asset.sha256}`;element.load();data();
 return {element,ready,
  setPlaying(value){
   wanted=!!value&&!disposed&&!failed;
   audioObserver?.setVisible(wanted&&loaded);audioObserver?.tick();
   if(!wanted){if(starting||playing)playEpoch++;starting=false;playing=false;if(!element.paused)element.pause();return;}
   if(element.ended&&!element.loop)return;
   if(!loaded||starting||playing&&!element.paused)return;
   starting=true;const generation=++playEpoch;
   Promise.resolve().then(()=>{if(!disposed&&wanted&&generation===playEpoch)return element.play();}).then(()=>{if(generation!==playEpoch)return;starting=false;if(disposed||!wanted){element.pause();playing=false;}else playing=true;}).catch(cause=>{if(generation!==playEpoch)return;starting=false;if(!disposed&&wanted)fail(Error('MAX_VIDEO_PLAY_REJECTED_'+(cause?.name??'ERROR')));});
  },
  readyForAck(visible){return loaded&&!failed&&(!visible||playing);},
  dispose(){if(disposed)return;disposed=true;playEpoch++;wanted=false;audioObserver?.dispose();cleanupReady();element.removeEventListener('error',error);element.removeEventListener('ended',ended);settle.reject(Error('MAX_VIDEO_CANCELLED'));element.pause();element.removeAttribute('src');element.load();element.remove();},
 };
}

export function createDeviceVideoTexture(VideoTexture,colorSpace,element){
 const texture=new VideoTexture(element);texture.colorSpace=colorSpace;
 // loadeddata may precede construction while paused. Force this first frame's
 // upload before the library's next native video-frame callback can arrive.
 texture.needsUpdate=true;return texture;
}
