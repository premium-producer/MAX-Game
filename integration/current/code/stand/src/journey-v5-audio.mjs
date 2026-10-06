import {observeHowlerAudio} from '../howler-audio-observer.mjs';
import {openAudioPort,masterAudioEnabled} from '../audio-producer-port.mjs';
import {Howl,Howler} from 'howler';

export const V5_SOUNDS=Object.freeze({
 ambience:['game_ambience_loop',.22,true],hold:['game_icon_hold_loop',.25,true],
 click1:['game_button_click_1',.45],click2:['game_button_click_2',.45],click3:['game_button_click_3',.45],
 grab1:['game_icon_grab_1',.45],grab2:['game_icon_grab_2',.45],phoneGrab:['game_phone_grab_1',.45],
 pop:['game_icon_pop',.35],hand:['game_transition_handscreen',.5],row:['game_transition_icons',.4],
 link:['game_enengy_stream_1',.4],fan:['game_enengy_stream_2',.4],
 activate:['game_phonescreen_activate',.5],reactivate:['game_phonescreen_reactivate',.4],drop:['game_icons_deselect',.35]
});

// Event mapping only. Playback, decoding, voice pooling, fades and unlock are Howler.
export class V5Audio {
 constructor({Sound=Howl,baseURL=new URL('./webgl-v5/audio/',document.baseURI),report=()=>{},random=Math.random,isRunning=()=>!Howler.usingWebAudio||Howler.ctx?.state==='running',resume=()=>Howler.ctx?.resume()}={}){
  this.report=report;this.random=random;this.isRunning=isRunning;this.resume=resume;this.audioPort=masterAudioEnabled()?openAudioPort('max-v5'):null;this.audioObservers=[];this.sounds=new Map();this.voices=[];this.loops=new Map();
  this.activated=false;this.muted=false;this.active=!this.audioPort;this.disposed=false;this.holding=false;
  this.run='';this.stage='';this.screen='';this.nodes=new Set();this.loaded=0;this.errors=0;this.played=0;
  for(const [key,[file,volume,loop=false]] of Object.entries(V5_SOUNDS)){
   const sound=new Sound({src:[new URL(file+'.ogg',baseURL).href,new URL(file+'.mp3',baseURL).href],preload:true,loop,volume,pool:3,
    onload:()=>{this.loaded++;this.publish();this.restoreLoops();},
    onloaderror:()=>{this.errors++;this.publish();},
    onplay:()=>{this.played++;this.publish();},
    onplayerror:()=>{sound.stop();this.loops.delete(key);this.errors++;this.publish();},
    onunlock:()=>this.restoreLoops()});
   this.sounds.set(key,sound);
   if(this.audioPort)this.audioObservers.push(observeHowlerAudio(sound,{assetId:'max.'+file,bus:key==='ambience'?'music':'max',namespace:'max-v5',send:value=>this.audioPort.send(value),event:value=>this.audioPort.event(value)}));
  }
  this.audioTimer=this.audioPort?setInterval(()=>{for(const observer of this.audioObservers)observer.tick();},250):null;
  this.publish();
 }
 publish(){this.audioPort?.state({branch:'max',phase:this.disposed?'disposed':!this.active?'paused':this.stage||'mission',screen:this.screen,active:this.active,activated:this.activated,muted:this.muted,running:!!this.isRunning(),loaded:this.loaded,errors:this.errors});this.report({loaded:this.loaded,total:this.sounds.size,played:this.played,errors:this.errors,activated:this.activated,muted:this.muted,active:this.active,running:!!this.isRunning(),loops:[...this.loops.keys()]});}
 get enabled(){return this.activated&&!this.muted&&this.active&&!this.disposed;}
 activate(){if(this.disposed)return;this.activated=true;Promise.resolve(this.resume()).then(()=>{if(!this.disposed){this.restoreLoops();this.publish();}},()=>{if(!this.disposed){this.errors++;this.publish();}});this.restoreLoops();this.publish();}
 play(key){
  const sound=this.sounds.get(key);if(!this.enabled||!this.isRunning()||sound?.state()!=='loaded')return false;
  this.voices=this.voices.filter(v=>v.sound.playing(v.id));
  // Howler pool limits inactive voices, not concurrent voices. Bound current SFX explicitly.
  if(this.voices.length>=5){const old=this.voices.shift();old.sound.stop(old.id);}
  const id=sound.play();this.voices.push({sound,id,key});return true;
 }
 variant(keys){return this.play(keys[Math.floor(this.random()*keys.length)]);}
 click(){return this.variant(['click1','click2','click3']);}
 grab(kind){this.holding=true;if(kind==='phone')this.play('phoneGrab');else this.variant(['grab1','grab2']);this.restoreLoops();}
 release({cue=false}={}){this.holding=false;this.stopLoop('hold');if(cue)this.play('drop');}
 stopLoop(key){const s=this.sounds.get(key),id=this.loops.get(key);if(id!==undefined)s.stop(id);this.loops.delete(key);}
 restoreLoops(){
  if(!this.enabled||!this.isRunning())return;
  for(const key of ['ambience',...(this.holding?['hold']:[])]){
   const sound=this.sounds.get(key);if(sound?.state()!=='loaded'||this.loops.has(key))continue;
   const id=sound.play();this.loops.set(key,id);sound.volume(0,id);sound.fade(0,V5_SOUNDS[key][1],180,id);
  }
  this.publish();
 }
 stopTransient({preserveClicks=false}={}){const keep=[];for(const v of this.voices){if(preserveClicks&&v.key.startsWith('click')&&v.sound.playing(v.id))keep.push(v);else v.sound.stop(v.id);}this.voices=keep;this.release();}
 setActive(value){if(this.active===value)return;this.active=value;if(!value){this.stopTransient();this.stopLoop('ambience');}else if(this.activated)this.activate();this.publish();}
 setMuted(value){this.muted=value;if(value){this.stopTransient();this.stopLoop('ambience');}else if(this.activated)this.activate();this.publish();}
 sync({run='',stage='',screen='',nodes=[],holding=false,active=true}={}){
  const beforeState=this.run+'|'+this.stage+'|'+this.screen+'|'+this.holding+'|'+this.active;
  this.setActive(active);
  if(run!==this.run){this.stopTransient({preserveClicks:true});this.run=run;this.stage='';this.screen='';this.nodes.clear();}
  if(stage!==this.stage){
   this.stage=stage;
   const key={'startup:shell':'hand','startup:row':'row','startup:trace':'link','startup:fan':'fan','handoff:pack':'row','handoff:trace':'link','handoff:link':'fan'}[stage];
   if(key)this.play(key);
  }
  for(const id of nodes)if(!this.nodes.has(id)){this.nodes.add(id);this.play('pop');}
  if(screen&&screen!==this.screen){this.play(this.screen?'reactivate':'activate');this.screen=screen;}
  if(this.holding!==holding){this.holding=holding;if(!holding)this.stopLoop('hold');else this.restoreLoops();}
  if(beforeState!==this.run+'|'+this.stage+'|'+this.screen+'|'+this.holding+'|'+this.active)this.publish();
 }
 dispose(){clearInterval(this.audioTimer);for(const observer of this.audioObservers)observer.dispose();this.audioPort?.close();this.disposed=true;for(const sound of this.sounds.values())sound.unload();this.loops.clear();this.voices=[];}
}

export function mountV5Audio({document:doc=document}={}){
 const button=doc.createElement('button');button.className='v5-audio-control';button.type='button';
 const audio=new V5Audio({baseURL:new URL('./webgl-v5/audio/',doc.baseURI),report:state=>{
  doc.documentElement.dataset.audio=JSON.stringify(state);
  button.textContent=!state.activated?'Включить звук':state.muted?'Звук: выкл':'Звук: вкл';
  button.setAttribute('aria-label',!state.activated?'Включить звук':state.muted?'Включить звук':'Выключить звук');
  button.setAttribute('aria-pressed',String(state.activated&&!state.muted));
 }});
 if(masterAudioEnabled()){button.hidden=true;queueMicrotask(()=>audio.activate());}doc.body.append(button);
 const unlock=e=>{if(e.isTrusted&&e.target!==button)audio.activate();};
 doc.addEventListener('pointerdown',unlock,true);doc.addEventListener('keydown',unlock,true);
 button.addEventListener('click',()=>{if(!audio.activated)audio.activate();else audio.setMuted(!audio.muted);});
 const dispose=audio.dispose.bind(audio);audio.dispose=()=>{doc.removeEventListener('pointerdown',unlock,true);doc.removeEventListener('keydown',unlock,true);button.remove();dispose();};
 return audio;
}
