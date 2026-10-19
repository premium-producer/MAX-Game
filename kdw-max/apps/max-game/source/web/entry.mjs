import {WebAssets} from './assets.mjs';
const status=document.querySelector('#web-status');
const base=new URL('.',import.meta.url),params=new URLSearchParams(location.search);
const link=(url,rel='stylesheet')=>new Promise((resolve,reject)=>{const el=document.createElement('link');el.rel=rel;el.href=new URL(url,base);el.onload=resolve;el.onerror=reject;document.head.append(el);});
async function boot(){
 // Public web delivery always owns a local browser session, never a stand LAN.
 params.set('backend','local');params.set('view','game');const pageURL=new URL(location.href);pageURL.search=params.toString();history.replaceState(null,'',pageURL);
 const response=await fetch(new URL('asset-manifest.json',base),{cache:'no-cache'});if(!response.ok)throw Error('Не удалось получить список ресурсов');const manifest=await response.json();
 const assets=new WebAssets(manifest,base);globalThis.maxWebAssets=assets;document.documentElement.dataset.webRelease=manifest.release;
 const baseTag=document.createElement('base');baseTag.href=base.href;document.head.prepend(baseTag);
 await assets.preload(manifest.shell,(done,total)=>status.textContent=`Загрузка MAX: ${done} / ${total}`);
 await link('brand/tokens/brand.css');
 {
  for(const name of ['journey.css','journey-guided.css','journey-guided-line.css','journey-guided-reveal.css','v5.css','kdw-interactions.css'])await link('webgl-v5/'+name);
  Object.assign(document.documentElement.dataset,{edition:'client',experiment:'guided',reveal:'true',phoneLayout:'path',visual:'webgl-bfm-v5',browserStand:'true',timerPolicy:'stand-device-timer'});
  const stage=document.createElement('div');stage.innerHTML='<canvas id="ambient" aria-hidden="true"></canvas><div id="arena"><div id="world" aria-hidden="true"></div><main id="circles"></main><div id="loading" role="status">Готовим пространство MAX…</div></div>';document.body.append(...stage.childNodes);
  await import('./webgl-v5/app.js');
 }
 status.remove();
}
boot().catch(error=>{console.error(error);status.textContent='Не удалось загрузить игру. Проверьте соединение и попробуйте ещё раз.';const button=document.createElement('button');button.textContent='Повторить загрузку';button.onclick=()=>location.reload();status.append(button);});
