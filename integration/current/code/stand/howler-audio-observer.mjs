// Howler retains decoding, actual position, voice pooling, event mapping and random variants.
export function safeHowlerErrorCode(value){
 if(Number.isSafeInteger(value)&&value>=0&&value<=599)return 'HOWLER_'+value;
 if(typeof value?.name==='string'&&/^[A-Za-z][A-Za-z0-9]{0,47}Error$/.test(value.name))return value.name;
 if(typeof value==='string'){
  const http=/^Failed loading audio file with status: (\d{3})\.$/.exec(value);if(http)return 'HTTP_'+http[1];
  if(value==='No audio support.')return 'NO_AUDIO_SUPPORT';
  if(value==='No codec support for selected audio sources.')return 'NO_CODEC_SUPPORT';
  if(value==='Decoding audio data failed.')return 'DECODE_FAILED';
  if(value.startsWith('Playback was unable to start.'))return 'PLAYBACK_START_FAILED';
 }
 return 'HOWLER_ERROR';
}
export function observeHowlerAudio(sound,{assetId,bus,namespace,send,event:reportEvent=()=>{},now=()=>performance.now()}={}){
 if(!sound||typeof send!=='function'||!assetId||!namespace||!['music','max'].includes(bus))throw Error('AUDIO_HOWLER_OPTIONS');
 let closed=false,revision=0;const voices=new Set(),listeners=new Map();
 const position=id=>{const n=sound.seek(id);return typeof n==='number'&&Number.isFinite(n)?Math.max(0,n):0;};
 // Howler2.2.4 has no public per-voice mute getter. Read its pinned Sound flag;
 // do not call mute(undefined,id), which would mutate the voice.
 const gain=id=>sound._muted===true||sound._soundById?.(id)?._muted===true?0:Number(sound.volume(id))||0;
 const publish=(id,state)=>{if(closed)return;send({trackId:namespace+':'+assetId+':'+id,assetId,bus,state,positionSeconds:position(id),rate:Number(sound.rate(id))||1,gain:gain(id),loop:!!sound.loop(id),revision:++revision});};
 for(const event of ['load','loaderror','unlock','play','pause','stop','seek','end','mute','volume','rate','fade','playerror']){
  const fn=(id,error)=>{
   if(closed)return;
   const diagnostic=['load','loaderror','unlock','playerror'].includes(event);
   if(diagnostic)reportEvent({type:'howler.'+event,cue:assetId,...(Number.isSafeInteger(id)&&id>0?{voiceId:namespace+':'+assetId+':'+id}:{}),...(['loaderror','playerror'].includes(event)?{errorCode:safeHowlerErrorCode(error)}:{})});
   if(event==='play')voices.add(id);
   if(!voices.has(id))return;
   if(!diagnostic&&['play','pause','stop','seek','end','mute'].includes(event))reportEvent({type:'howler.'+event,cue:assetId,voiceId:namespace+':'+assetId+':'+id});
   const stopped=event==='stop'||event==='playerror'||(event==='end'&&!sound.loop(id));
   publish(id,stopped?'stopped':sound.playing(id)?'playing':'paused');
   if(stopped)voices.delete(id);
  };listeners.set(event,fn);sound.on(event,fn);
 }
 let last=-Infinity;
 return {
  tick(){const at=now();if(at-last<250)return;last=at;for(const id of voices)publish(id,sound.playing(id)?'playing':'paused');},
  dispose(){if(closed)return;for(const id of voices)publish(id,'stopped');closed=true;for(const [event,fn]of listeners)sound.off(event,fn);voices.clear();}
 };
}
