// Autonomous MAX has one local audible renderer. No external producer module.
export const localAudioEnabled=(doc=globalThis.document)=>doc?.documentElement?.dataset.localAudio==='true';
export const masterAudioEnabled=()=>false;
export function openAudioPort(){throw Error('MAX_REMOTE_AUDIO_DISABLED');}
