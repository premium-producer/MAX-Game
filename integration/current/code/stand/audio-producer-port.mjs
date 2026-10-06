import {createAudioProducer} from '/bridge/audio-client.mjs';

export const masterAudioEnabled=()=>globalThis.STAND_AUDIO_MODE==='master'||globalThis.document?.documentElement?.dataset.managedAudio==='true';
export function openAudioPort(source){
 const producer=createAudioProducer({source});let lastState='';
 return {
  send(value){
   if(value.state==='stopped'){producer.remove(value.trackId);return;}
   producer.update({voiceId:value.trackId,assetId:value.assetId,bus:value.bus,volume:value.gain,loop:value.loop,positionSeconds:value.positionSeconds,paused:value.state!=='playing'});
  },
  state(value){const key=JSON.stringify(value);if(key===lastState)return;lastState=key;producer.setState?.(value);},
  event(value){producer.event?.(value);},
  close(){producer.close();}
 };
}
