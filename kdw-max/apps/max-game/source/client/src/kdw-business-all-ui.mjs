import {externalAction} from './kdw-transition-actions.mjs';
import {BUSINESS_ALL_ASSETS,businessAllLayout} from './kdw-business-all-model.mjs';
import {businessProfile} from './kdw-business-profile.mjs';
import {linkedVisitorAvatar} from './kdw-game-link.mjs';
import {businessSourceMarkup, businessSourceLayout} from './kdw-business-source-ui.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function businessScreenLayout(id,state){
 const layout=businessAllLayout(id,businessProfile(state).id);
 if(id==='business.platform.ready')return {...layout,width:895,height:559,box:[0,(559-895*78/455)/2,895,895*78/455]};
 return layout??businessSourceLayout(id);
}
export function businessScreenMarkup(snapshot){
 const s=snapshot.state,l=businessScreenLayout(s.screenId,s);if(!l)return businessSourceMarkup(snapshot);
 const action=snapshot.view.actions[0]?.actionId??'',box=l.box??[0,0,l.width,l.height];
 const pos=([x,y,w,h])=>`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
 const actions=l.box?[[...l.box,'Профиль подтверждён']]:l.actions;
 return `<div class="bn-source-canvas" data-business-step="${l.number}" style="width:${l.width}px;height:${l.height}px"><img class="bn-original" data-business-asset="${l.assetId}" style="${pos(box)}" alt="${esc(actions[0][4])}" draggable="false">${l.visitor?`<span class="bn-original-field bn-source-photo" style="${pos(l.visitor)}"><img src="${linkedVisitorAvatar()}" alt="Фото посетителя"></span>`:''}${actions.map(r=>`<button type="button" class="bn-original-action" data-bn-action="${esc(action)}" aria-label="${esc(r[4])}" style="${pos(r)}"></button>`).join('')}</div>${l.forward?`<div class="bn-source-forward"><button type="button" class="${externalAction(snapshot,action,'Продолжить').className}" data-bn-action="${esc(action)}">${externalAction(snapshot,action,'Продолжить').label}</button></div>`:''}`;
}
// One decoded screen at a time enters the presentation. Rasters are shared by
// hash; never inject the 84 MB export into the JavaScript bundle or fetch all3.
export function createBusinessScreenLoader(){
 const entries=new Map(),rasters=new Map(),controllers=new Set();let disposed=false;
 async function read(url,kind='text'){const c=new AbortController();controllers.add(c);const timer=setTimeout(()=>c.abort(),12000);try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw Error('Resource '+r.status);return await r[kind]();}finally{clearTimeout(timer);controllers.delete(c);}}
 function raster(name){if(!rasters.has(name))rasters.set(name,(async()=>{const blob=await read('./assets/kdw-native/business-all/'+name,'blob');return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});})().catch(e=>{rasters.delete(name);throw e;}));return rasters.get(name);}
 function load(id){let e=entries.get(id);if(e)return e;e={done:false,url:'',error:null};entries.set(id,e);
  e.promise=(async()=>{let timeout;try{const a=BUSINESS_ALL_ASSETS[id];let svg=await read('./'+a.path);for(const name of a.dependencies??[])svg=svg.replaceAll('./'+name,await raster(name));const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));if(disposed){URL.revokeObjectURL(url);return;}e.url=url;const image=new Image();image.src=url;await Promise.race([image.decode(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Decode timeout')),12000);})]);}catch(error){e.error=error;}finally{clearTimeout(timeout);e.done=true;}})();return e;
 }
 return {
  ready(id,state){const l=businessScreenLayout(id,state);if(!l)return true;const e=load(l.assetId);for(const [key,item]of entries)if(entries.size>4&&key!==l.assetId&&item.done){if(item.url)URL.revokeObjectURL(item.url);entries.delete(key);}return e.done;},
  apply(root){for(const image of root.querySelectorAll('[data-business-asset]')){const e=load(image.dataset.businessAsset);if(e.done&&!e.error)image.src=e.url;else if(e.error){image.hidden=true;root.querySelectorAll('[data-bn-action]').forEach(b=>b.disabled=true);const notice=root.querySelector('.bn-error');notice.textContent='Не удалось загрузить экран. ';const button=document.createElement('button');button.type='button';button.dataset.bnRetry=image.dataset.businessAsset;button.textContent='Повторить';notice.append(button);}}},
  retry(id){const e=entries.get(id);if(e?.url)URL.revokeObjectURL(e.url);entries.delete(id);load(id);},
  dispose(){disposed=true;for(const c of controllers)c.abort();for(const e of entries.values())if(e.url)URL.revokeObjectURL(e.url);entries.clear();rasters.clear();}
 };
}

