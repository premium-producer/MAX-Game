export const usesVideoFinale=({enabled,automatic,phase})=>!!enabled&&!!automatic&&phase==='complete';

// Game lifecycle glue only. Playback/order/repeat belong to videojs-playlist.
export function mountV5Finale({onActive,onExit,isMuted=()=>false}){
 const preference='max.v5.video-finale';
 let enabled=new URLSearchParams(location.search).get('finale')==='videos';
 try{if(!new URLSearchParams(location.search).has('finale'))enabled=localStorage.getItem(preference)==='true';}catch{}
 const option=document.createElement('label');option.className='v5-finale-option';
 const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=enabled;
 option.append(checkbox,document.createTextNode('Видео вместо QR в автомиссиях'));document.body.append(option);
 checkbox.addEventListener('change',()=>{enabled=checkbox.checked;try{localStorage.setItem(preference,String(enabled));}catch{}});
 let layer=null,player=null,epoch=0,run=null,disposed=false;
 const close=()=>{epoch++;player?.dispose();player=null;layer?.remove();layer=null;onActive(false);};
 const exit=()=>{close();onExit();};
 async function load(target){
  const ticket=++epoch;player?.dispose();player=null;
  target.replaceChildren();
  const status=document.createElement('p');status.textContent='Подготовка видео…';target.append(status);
  try{
   const [module,response]=await Promise.all([
    import(new URL('./webgl-v5/finale-player.js',document.baseURI).href),
    fetch(new URL('./webgl-v5/finale-videos/manifest.json',document.baseURI))
   ]);
   if(!response.ok)throw Error('Playlist HTTP '+response.status);
   const manifest=await response.json();
   if(disposed||ticket!==epoch)return;
   player=module.mountFinalePlayer(target,manifest,{muted:isMuted()});
  }catch(error){
   if(disposed||ticket!==epoch)return;
   console.error('MAX video finale',error);status.textContent='Не удалось загрузить подборку.';
   const retry=document.createElement('button');retry.textContent='Повторить';retry.onclick=()=>void load(target);target.append(retry);
  }
 }
 return {
  get active(){return !!layer;},
  update({automatic,phase,runId,menu}){
   option.hidden=!menu||!!layer;
   if(!usesVideoFinale({enabled,automatic,phase}))return false;
   if(run===runId)return true;
   run=runId;close();onActive(true);option.hidden=true;
   layer=document.createElement('section');layer.className='v5-finale';layer.setAttribute('role','dialog');layer.setAttribute('aria-label','Видеоподборка');
   const back=document.createElement('button');back.className='v5-finale-exit';back.textContent='К миссиям';back.onclick=exit;
   const target=document.createElement('div');target.className='v5-finale-player';layer.append(back,target);document.body.append(layer);
   void load(target);return true;
  },
  dispose(){disposed=true;close();option.remove();}
 };
}
