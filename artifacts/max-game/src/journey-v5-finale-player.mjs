import videojs from 'video.js';
import 'videojs-playlist';

export function mountFinalePlayer(host,manifest,{muted=false}={}){
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
 const player=videojs(video,{controls:true,preload:'metadata',playsinline:true,autoplay:false,muted,loop:false,fluid:false,fill:true,language:'ru'});
 let disposed=false,resume=false,failed=false;
 const start=()=>{
  if(disposed)return;
  if(document.hidden){resume=true;return;}
  const result=player.play();result?.catch(()=>{if(!disposed){status.textContent='Нажмите «Воспроизвести», чтобы начать.';play.hidden=false;}});
 };
 player.playlist(manifest.items.map(item=>({name:item.name,sources:[{src:new URL(item.src+'?v='+item.sha256,document.baseURI).href,type:'video/mp4'}]})));
 player.playlist.repeat(true);
 player.playlist.autoadvance(0);
 player.on('playlistitem',()=>{failed=false;status.textContent='';play.textContent='Воспроизвести';play.hidden=false;select.value=String(player.playlist.currentItem());});
 player.on('playing',()=>{failed=false;status.textContent='';play.hidden=true;});
 player.on('pause',()=>{if(!failed){play.textContent='Воспроизвести';play.hidden=false;}});
 player.on('error',()=>{failed=true;player.playlist.autoadvance();status.textContent='Ролик недоступен. Повторите или выберите следующий.';play.hidden=false;play.textContent='Повторить';});
 play.onclick=()=>{if(failed){player.error(null);player.playlist.currentItem(Number(select.value));player.load();failed=false;}player.playlist.autoadvance(0);start();};
 select.onchange=()=>{player.playlist.currentItem(Number(select.value));player.playlist.autoadvance(0);start();};
 next.onclick=()=>{player.playlist.next();player.playlist.autoadvance(0);start();};
 const visibility=()=>{
  if(document.hidden){resume=resume||!player.paused();player.playlist.autoadvance();player.pause();}
  else{if(!failed)player.playlist.autoadvance(0);if(resume&&!failed)start();resume=false;}
 };
 document.addEventListener('visibilitychange',visibility);
 start();
 return {dispose(){disposed=true;document.removeEventListener('visibilitychange',visibility);player.playlist.autoadvance();player.dispose();host.replaceChildren();}};
}
