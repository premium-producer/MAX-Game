import videojs from 'video.js';
import 'videojs-playlist';

export function mountFinalePlayer(host,manifest,{muted=false,onMediaReady,onItemChange,onBeforeItemChange,onError,controls=true}={}){
 if(!Array.isArray(manifest.items)||!manifest.items.length)throw Error('Empty video playlist');
 if(!document.querySelector('[data-finale-css]')){
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./webgl-v5/finale-player.css',document.baseURI).href;css.dataset.finaleCss='';document.head.append(css);
 }
 host.replaceChildren();
 const video=document.createElement('video');video.className='video-js vjs-default-skin';video.setAttribute('playsinline','');
 const tools=document.createElement('div');tools.className='v5-finale-tools';
 const select=document.createElement('select');select.setAttribute('aria-label','Ролик подборки');
 manifest.items.forEach((item,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=`${i+1} / ${manifest.items.length} — ${item.name}`;select.append(option);});
 const play=document.createElement('button');play.textContent='Воспроизвести';
 const next=document.createElement('button');next.textContent='Следующий ролик';
 const status=document.createElement('span');status.setAttribute('role','status');tools.append(select,play,next,status);host.append(video,tools);
 const player=videojs(video,{controls,preload:'metadata',playsinline:true,autoplay:false,muted,loop:false,fluid:false,fill:true,language:'ru'});
 let disposed=false,resume=false,failed=false,mediaReady=!onMediaReady,mediaRevision=0;
 const start=()=>{
  if(disposed||!mediaReady)return;
  if(document.hidden){resume=true;return;}
  const result=player.play();result?.catch(()=>{if(!disposed){status.textContent='Нажмите «Воспроизвести», чтобы начать.';play.hidden=false;}});
 };
 player.on('loadstart',()=>{mediaRevision++;mediaReady=!onMediaReady;if(onMediaReady)player.pause();onItemChange?.();});
 player.on('loadedmetadata',async()=>{
  if(!onMediaReady)return;
  const ticket=mediaRevision,w=player.videoWidth(),h=player.videoHeight();
  if(!(w>0&&h>0)){onError?.(Error('Video dimensions unavailable'));return;}
  player.pause();
  try{const ready=await onMediaReady(w,h);if(disposed||ticket!==mediaRevision||ready===false)return;mediaReady=true;start();}
  catch(error){if(!disposed&&ticket===mediaRevision)onError?.(error);}
 });
 player.playlist(manifest.items.map(item=>({name:item.name,sources:[{src:new URL(item.src+'?v='+item.sha256,document.baseURI).href,type:'video/mp4'}]})));
 player.playlist.repeat(true);
 const autoAdvance=()=>player.playlist.autoadvance(onBeforeItemChange?undefined:0);
 autoAdvance();
 if(onBeforeItemChange)player.on('ended',async()=>{
  const ticket=mediaRevision;
  try{const ready=await onBeforeItemChange();if(!disposed&&ticket===mediaRevision&&ready!==false)player.playlist.next();}
  catch(error){if(!disposed&&ticket===mediaRevision)onError?.(error);}
 });
 player.on('playlistitem',()=>{failed=false;status.textContent='';play.textContent='Воспроизвести';play.hidden=false;select.value=String(player.playlist.currentItem());});
 player.on('playing',()=>{if(!mediaReady){player.pause();return;}failed=false;status.textContent='';play.hidden=true;});
 player.on('pause',()=>{if(!failed){play.textContent='Воспроизвести';play.hidden=false;}});
 player.on('error',()=>{failed=true;player.playlist.autoadvance();status.textContent='Ролик недоступен. Повторите или выберите следующий.';play.hidden=false;play.textContent='Повторить';onError?.(player.error());});
 play.onclick=()=>{if(failed){player.error(null);player.playlist.currentItem(Number(select.value));player.load();failed=false;}autoAdvance();start();};
 select.onchange=()=>{player.playlist.currentItem(Number(select.value));autoAdvance();start();};
 next.onclick=()=>{player.playlist.next();autoAdvance();start();};
 const visibility=()=>{
  if(document.hidden){resume=resume||!player.paused();player.playlist.autoadvance();player.pause();}
  else{if(!failed)autoAdvance();if(resume&&!failed)start();resume=false;}
 };
 document.addEventListener('visibilitychange',visibility);
 start();
 return {dispose(){disposed=true;document.removeEventListener('visibilitychange',visibility);player.playlist.autoadvance();player.dispose();host.replaceChildren();}};
}
