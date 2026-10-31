import {configureVideoAudio} from './kdw-video-audio.mjs';
import {Howl} from 'howler';
import {MusicPlayer} from './kdw-music-player.mjs';
import {V5Audio,V5_SOUNDS} from './journey-v5-audio.mjs';
import {masterAudioEnabled,localAudioEnabled} from '../audio-producer-port.mjs';

// Operator controls wrap the frozen V5 event mapping; standalone historical pages retain V5.
export class EventAudio extends V5Audio {
 constructor(options={}){super(options);this.Sound=options.Sound||Howl;this.mix=null;this.mixKey='';this.fileKeys=new Map();this.envelopes=new Set();this.retired=new Map();this.musicFiles=[];this.musicContext={scene:'standby',available:false};this.music=new MusicPlayer({Sound:this.Sound,onState:options.onMusicState,onError:(file,error)=>{console.warn('MAX_MUSIC_PLAYBACK_ERROR',file,String(error??'unknown'));this.errors++;this.publish();}});}
 updateMusic(){this.music?.update({mix:this.mix,files:this.musicFiles, ...this.musicContext,activated:this.activated,muted:this.muted});}
 sync(state){this.musicContext={scene:state.musicScene??'mission',available:state.musicAvailable??state.active};super.sync(state);this.updateMusic();}
 get enabled(){return super.enabled&&(this.mix?.enabled??true);}
 level(key){return this.mix?(this.mix.events[key]?.volume??0)*this.mix.masterVolume:V5_SOUNDS[key][1];}
 fadeIn(){return this.mix?.fadeInMs??180;}
 fadeOut(){return this.mix?.fadeOutMs??0;}
 configure(state){
  if(!state?.value?.events||this.disposed)return;
  const key=JSON.stringify([state.value,state.files]);if(key===this.mixKey)return;this.mixKey=key;this.mix=state.value;configureVideoAudio(this.mix);
  this.musicFiles=state.files;this.stopLoop('ambience');this.sounds.get('ambience')?.unload();this.sounds.delete('ambience');
  for(const event of Object.keys(V5_SOUNDS)){
   if(event==='ambience')continue;
   const setting=this.mix.events[event],file=state.files.find(f=>f.name===setting?.file),identity=file?.url??'';
   if(this.fileKeys.get(event)!==identity){
    const old=this.sounds.get(event);for(const v of this.envelopes||[])if(v.sound===old)this.finish(v);
    this.loops.delete(event);this.voices=this.voices.filter(v=>v.sound!==old);this.sounds.delete(event);
    if(old){const timer=setTimeout(()=>{old.unload();this.retired.delete(timer);},this.fadeOut()+30);this.retired.set(timer,old);}
    this.fileKeys.set(event,identity);
    if(file){const sound=new this.Sound({src:[file.url],preload:true,loop:!!V5_SOUNDS[event][2],volume:this.level(event),pool:3,
     onload:()=>{if(!this.disposed)this.restoreLoops();},onloaderror:()=>{this.errors++;this.publish();},onplay:()=>{this.played++;this.publish();},onplayerror:()=>{sound.stop();this.loops.delete(event);this.errors++;this.publish();},onunlock:()=>this.restoreLoops()});this.sounds.set(event,sound);}
   }
  }
  // Each voice has an independent envelope; editing a level never alters another event.
  for(const v of this.envelopes)if(!v.stopping){const level=this.level(v.key);v.sound.volume(level,v.id);this.scheduleTail(v);}
  if(!this.enabled){this.stopTransient();this.stopLoop('ambience');}else this.restoreLoops();this.updateMusic();this.publish();
 }
 begin(key,loop=false){const sound=this.sounds.get(key);if(!this.enabled||!this.isRunning()||sound?.state()!=='loaded')return null;
  const id=sound.play(),duration=Number(sound.duration(id))||0,level=this.level(key),fi=Math.min(this.fadeIn(),loop?Infinity:duration*500),v={sound,id,key,loop,duration,started:performance.now(),timer:null,stopping:false};
  this.envelopes.add(v);sound.volume(fi?0:level,id);if(fi)sound.fade(0,level,fi,id);
  const clean=()=>{clearTimeout(v.timer);this.envelopes.delete(v);};sound.once('end',()=>{if(!loop)clean();},id);sound.once('stop',clean,id);this.scheduleTail(v);return v;
 }
 scheduleTail(v){clearTimeout(v.timer);if(v.loop||v.stopping)return;const remaining=v.duration*1000-(performance.now()-v.started),fo=Math.min(this.fadeOut(),v.duration*500,Math.max(0,remaining));if(fo>0)v.timer=setTimeout(()=>{if(!v.stopping&&v.sound.playing(v.id))v.sound.fade(v.sound.volume(v.id),0,fo,v.id);},Math.max(0,remaining-fo));}
 finish(v){if(v.stopping)return;v.stopping=true;clearTimeout(v.timer);const fade=this.fadeOut();if(fade>0&&v.sound.playing(v.id)){v.sound.fade(v.sound.volume(v.id),0,fade,v.id);v.timer=setTimeout(()=>{v.sound.stop(v.id);this.envelopes.delete(v);},fade);}else{v.sound.stop(v.id);this.envelopes.delete(v);}}
 play(key){if(!this.enabled)return false;this.voices=this.voices.filter(v=>v.sound.playing(v.id)&&!v.stopping);if(this.voices.length>=5)this.finish(this.voices.shift());const v=this.begin(key);if(!v)return false;this.voices.push(v);return true;}
 restoreLoops(){this.updateMusic();if(!this.envelopes||!this.enabled||!this.isRunning())return;for(const key of (this.holding?['hold']:[]))if(!this.loops.has(key)){const v=this.begin(key,true);if(v)this.loops.set(key,v.id);}this.publish();}
 stopLoop(key){const id=this.loops.get(key),sound=this.sounds.get(key);if(id!==undefined){const v=[...(this.envelopes||[])].find(v=>v.sound===sound&&v.id===id);if(v)this.finish(v);else sound?.stop(id);}this.loops.delete(key);}
 stopTransient({preserveClicks=false}={}){const keep=[];for(const v of this.voices){if(preserveClicks&&v.key.startsWith('click')&&v.sound.playing(v.id))keep.push(v);else this.finish(v);}this.voices=keep;this.release();}
 dispose(){this.music.dispose();for(const v of this.envelopes){clearTimeout(v.timer);v.sound.stop(v.id);}this.envelopes.clear();for(const [timer,sound]of this.retired){clearTimeout(timer);sound.unload();}this.retired.clear();super.dispose();}
}
export function mountV5Audio({document:doc=document}={}){
 const button=doc.createElement('button');button.className='v5-audio-control';button.type='button';
 const audio=new EventAudio({onMusicState:state=>{doc.documentElement.dataset.musicPlayback=JSON.stringify(state);},baseURL:new URL('./webgl-v5/audio/',doc.baseURI),report:state=>{doc.documentElement.dataset.audio=JSON.stringify(state);button.textContent=!state.activated?'Включить звук':state.muted?'Звук: выкл':'Звук: вкл';button.setAttribute('aria-label',button.textContent);button.setAttribute('aria-pressed',String(state.activated&&!state.muted));}});
 if(masterAudioEnabled()||localAudioEnabled(doc)){button.hidden=true;queueMicrotask(()=>audio.activate());}doc.body.append(button);
 const abort=new AbortController();let fetching=false;
 const refresh=async()=>{if(fetching||audio.disposed)return;fetching=true;try{const r=await fetch('/__kdw/sound/state',{cache:'no-store',signal:abort.signal});if(r.ok)audio.configure(await r.json());}catch{/* Static previews keep their built-in bank. */}finally{fetching=false;}};
 void refresh();const timer=setInterval(refresh,2000);
 const unlock=e=>{if(e.isTrusted&&e.target!==button)audio.activate();};doc.addEventListener('pointerdown',unlock,true);doc.addEventListener('keydown',unlock,true);button.addEventListener('click',()=>{if(!audio.activated)audio.activate();else audio.setMuted(!audio.muted);});
 const dispose=audio.dispose.bind(audio);audio.dispose=()=>{abort.abort();clearInterval(timer);doc.removeEventListener('pointerdown',unlock,true);doc.removeEventListener('keydown',unlock,true);button.remove();dispose();};return audio;
}
