// Only local HTML video is registered. The operator mix never touches playback,
// remote audio routing, currentTime, or an asset's explicit mute setting.
let mix=null;
const players=new Set();
export function configureVideoAudio(value){
 mix=value;
 for(const player of players)player.apply();
}
export function bindVideoAudio(element,{group='tasks',muted=false}={}){
 let assetMuted=muted,disposed=false;
 const player={apply(){
  if(disposed)return;
  const channel=mix?.video?.[group]??{enabled:true,volume:1};
  const enabled=!!mix&&mix.enabled===true&&channel.enabled===true&&!assetMuted&&globalThis.document?.documentElement?.dataset.layoutPreview!=='true';
  element.volume=enabled?Math.max(0,Math.min(1,mix.masterVolume*channel.volume)):0;
  element.muted=!enabled||element.volume===0;
  element.defaultMuted=element.muted;
  if(element.muted)element.setAttribute('muted','');else element.removeAttribute('muted');
 }};
 players.add(player);player.apply();
 return{setMuted(value){assetMuted=value===true;player.apply();},dispose(){disposed=true;players.delete(player);}};
}
