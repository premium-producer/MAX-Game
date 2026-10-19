import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication} from '../client/src/journey-v5-backend.mjs';
import {createWebGLSession,WEBGL_SHARED_KEY} from '../client/src/application/webgl-session.mjs';
import {createIndexedDBPersistence} from '../client/src/application/indexeddb-persistence.mjs';
import {createMemoryPersistencePort} from '../client/src/application/memory-persistence.mjs';
import {emptyInteraction,placeProduct,COFFEE_PRODUCTS,CHANNEL_AVATARS,interactionComplete} from '../client/src/kdw-interactions-model.mjs';
import glyphs from '../client/public/webgl-v5/icon-glyphs/manifest.json' with {type:'json'};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function startTouchGame({assets,params}){
 document.documentElement.dataset.webDisplay='touch';
 const shell=document.createElement('div');shell.innerHTML=`<header class="touch-header"><button data-menu>К миссиям</button><img src="${assets.url('brand/assets/logos/max-primary-white.svg')}" alt="MAX"><output aria-label="Осталось времени"></output></header><main class="touch"></main><section class="touch-notice" role="status" hidden></section>`;document.body.append(shell);
 const main=shell.querySelector('main'),notice=shell.querySelector('.touch-notice'),timer=shell.querySelector('output');let session,snapshot,key='',draft,slot=0,working=false,contacting=false,polling=false,saveTimer,loading=false,loadKey='',loadEpoch=0;
 const persistence=params.get('test')==='memory'?createMemoryPersistencePort():createIndexedDBPersistence({key:`${WEBGL_SHARED_KEY}:v5:${catalog.contentRevision}`,legacyStorage:localStorage});
 const port=createV5MissionSessionApplication({catalog,persistence});
 const photo=p=>`<span class="product-photo" style="background-size:${780/p.crop[2]*100}% ${447/p.crop[3]*100}%;background-position:${p.crop[0]/(780-p.crop[2])*100}% ${p.crop[1]/(447-p.crop[3])*100}%"></span>`;
 function error(message){notice.hidden=false;notice.innerHTML=`<p>${esc(message)}</p><button data-retry>Повторить</button>`;}
 // Only the visible screen is fetched. No mission-wide download or Image cache.
 function receive(next){
  snapshot=next;const s=next.state,v=next.view;
  const channel=['blogger.channel.name','blogger.channel.filled'].includes(s.screenId);
  const resource=s.status==='task'?(s.taskId==='business.store'?'assets/kdw-r7/catalog-reference.png':channel?null:v.device?.asset?.path):v.qr?.asset?.path;
  const nextLoadKey=`${s.runId}:${s.status}:${s.screenId}:${resource}`;
  if(nextLoadKey===loadKey){if(!loading)render();return;}
  loadKey=nextLoadKey;const epoch=++loadEpoch;
  if(!resource||assets.ready.has(resource)){loading=false;notice.hidden=true;render();return;}
  loading=true;notice.hidden=false;notice.textContent='Загрузка экрана…';
  async function load(){
   try{
    await session.owner(false);await assets.load(resource);
    if(epoch!==loadEpoch)return;loading=false;notice.hidden=true;render();await session.owner(!document.hidden);
   }catch(e){if(epoch!==loadEpoch)return;error('Не удалось загрузить экран. Проверьте соединение.');notice.querySelector('[data-retry]').onclick=()=>{notice.textContent='Загрузка экрана…';void load();};}
  }
  void load();
 }
 async function run(action){if(working||loading)return;working=true;let retry=action;try{await action();if(!loading)notice.hidden=true;}catch(e){console.error(e);error(e.message);notice.querySelector('[data-retry]').onclick=()=>{notice.hidden=true;void run(retry);};}finally{working=false;renderControls();}}
 async function saveDraft(){clearTimeout(saveTimer);if(!draft||snapshot.state.status!=='task'||snapshot.state.taskId==='business.store'&&snapshot.state.screenId!=='business.store.start')return;const {taskId,screenId}=snapshot.state;const result=await session.command('SAVE_INTERACTION',{taskId,screenId,value:structuredClone(draft)});if(!result?.reply.ok)throw Error('Не удалось сохранить выбор');}
 function renderControls(){for(const b of main.querySelectorAll('[data-action]')){const a=snapshot?.view.actions.find(a=>a.actionId===b.dataset.action);b.disabled=working||a?.disabled===true||(draft&&!interactionComplete(snapshot.state.taskId==='business.store'?'store':'channel',draft));}}
 function render(next){
  if(next)snapshot=next;if(!snapshot)return;const s=snapshot.state,v=snapshot.view;document.documentElement.dataset.kdwScreen=s.screenId??s.status;
  timer.textContent=v.remainingMs===null?'':`${Math.floor(Math.ceil(v.remainingMs/1000)/60)}:${String(Math.ceil(v.remainingMs/1000)%60).padStart(2,'0')}`;
  shell.querySelector('[data-menu]').hidden=s.status==='menu';
  const nextKey=`${s.runId}:${s.status}:${s.screenId}`;if(nextKey===key){renderControls();return;}key=nextKey;draft=null;clearTimeout(saveTimer);slot=0;
  if(s.status==='menu'){
   main.innerHTML=`<h1>Открой возможности MAX</h1><p>Выберите свою миссию</p><div class="mission-list">${Object.values(catalog.missions).map(m=>`<button class="mission-choice" data-mission="${m.missionId}"><img alt="" src="${assets.url(glyphs[m.iconAssetId].path)}"><span>${esc(m.title)}</span></button>`).join('')}</div><p class="touch-footer"><a href="${esc(location.pathname)}?display=scene">Открыть полную сцену</a></p>`;return;
  }
  if(s.status==='scan'){main.innerHTML='<h1>Открываем MAX…</h1>';return;}
  const progress=`<div class="progress">${v.nodes.filter(n=>n.current||n.completed).map(n=>`<span data-done="${n.completed}">${n.completed?'✓ ':''}${esc(n.title)}</span>`).join('')}</div>`;
  if(v.result){main.innerHTML=`${progress}<h1>${esc(v.result.title)}</h1><p>${esc(v.result.text)}</p>${v.qr?.asset?`<img class="qr" src="${assets.url(v.qr.asset.path)}" alt="QR-код MAX">`:''}<div class="actions"><button data-restart class="primary">Пройти ещё раз</button><button data-menu>К миссиям</button></div>`;return;}
  if(s.status==='result'){main.innerHTML=`${progress}<h1>Задание выполнено ✓</h1><p>Открываем следующую возможность MAX…</p>`;return;}
  const task=catalog.tasks[s.taskId],channel=s.screenId==='blogger.channel.name'||s.screenId==='blogger.channel.filled',store=s.taskId==='business.store';
  main.innerHTML=`${progress}<h1>${esc(task.title)}</h1><p>${esc(v.instruction?.text)}</p><div data-content></div><div class="actions">${v.actions.map(a=>`<button class="primary" data-action="${a.actionId}" ${a.disabled?'disabled':''}>${esc(a.label)}</button>`).join('')}</div>${v.automaticMs!==null?'<p class="hint">Продолжаем автоматически…</p>':''}`;
  const content=main.querySelector('[data-content]');
  if(channel){draft=structuredClone(s.progress[s.missionId].interactions?.[s.taskId]??emptyInteraction('channel'));content.innerHTML=`<div class="form"><div class="avatars">${CHANNEL_AVATARS.map((a,i)=>`<button data-avatar="${a}" aria-label="Аватар ${a}" aria-pressed="${a===draft.avatar}">${['🐱','🎮','🏝️','💗'][i]}</button>`).join('')}</div><label>Название канала<input name="name" maxlength="64" value="${esc(draft.name)}" autocomplete="off"></label><label>Описание<textarea name="description" maxlength="160">${esc(draft.description)}</textarea></label></div>`;}
  else if(store){draft=structuredClone(s.progress[s.missionId].interactions?.[s.taskId]??emptyInteraction('store'));paintStore();}
  else if(v.device?.asset){const a=v.device.asset;content.innerHTML=`<div class="device ${v.device.kind}"><img src="${assets.url(a.path)}" width="${a.width}" height="${a.height}" alt="${esc(task.title)}">${v.actions.filter(a=>a.rect).map(a=>{const r=Array.isArray(a.rect)?a.rect:[a.rect.x,a.rect.y,a.rect.width,a.rect.height];return `<button class="hit" data-action="${a.actionId}" aria-label="${esc(a.label)}" style="left:${r[0]/v.device.asset.width*100}%;top:${r[1]/v.device.asset.height*100}%;width:${r[2]/v.device.asset.width*100}%;height:${r[3]/v.device.asset.height*100}%"></button>`;}).join('')}</div>`;}
  else content.textContent=v.missing??'';
  renderControls();window.scrollTo({top:0,behavior:'instant'});
 }
 function paintStore(){const editing=snapshot.state.screenId==='business.store.start',content=main.querySelector('[data-content]');content.innerHTML=`<p class="hint">${editing?'Выберите ячейку витрины, затем товар':'Ваша витрина готова'}</p><div class="slots">${draft.slots.map((id,i)=>{const p=COFFEE_PRODUCTS.find(p=>p.id===id);return `<button ${editing?'':'disabled'} data-slot="${i}" aria-pressed="${slot===i}">${p?photo(p)+esc(p.name):'＋ Добавить товар'}${p&&editing?`<span class="remove" data-remove="${i}">Удалить</span>`:''}</button>`;}).join('')}</div><div class="products">${COFFEE_PRODUCTS.map(p=>`<button ${editing?'':'disabled'} data-product="${p.id}">${photo(p)}<span>${esc(p.name)}</span><strong>${p.price} ₽</strong></button>`).join('')}</div>`;}
 function fly(source,target,text){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const a=source.getBoundingClientRect(),b=target.getBoundingClientRect(),el=document.createElement('div');el.className='flight';el.textContent=text;Object.assign(el.style,{left:a.x+'px',top:a.y+'px',width:a.width+'px'});document.body.append(el);const dx=b.x-a.x,dy=b.y-a.y;el.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-50}px) scale(.8)`,opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.45)`,opacity:0}],{duration:500,easing:'ease-in-out'}).finished.finally(()=>el.remove());}
 shell.addEventListener('input',e=>{if(!draft||!['name','description'].includes(e.target.name))return;draft[e.target.name]=e.target.value;renderControls();clearTimeout(saveTimer);saveTimer=setTimeout(()=>run(saveDraft),350);});
 shell.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||working)return;
  if(e.target.dataset.remove!==undefined){draft.slots[Number(e.target.dataset.remove)]=null;paintStore();void run(saveDraft);return;}
  if(b.dataset.slot!==undefined){slot=Number(b.dataset.slot);paintStore();return;}
  if(b.dataset.product){const source=b,target=main.querySelector(`[data-slot="${slot}"]`);fly(source,target,COFFEE_PRODUCTS.find(p=>p.id===b.dataset.product).name);draft.slots=placeProduct(draft.slots,b.dataset.product,slot);slot=Math.max(0,draft.slots.indexOf(null));paintStore();void run(saveDraft);return;}
  if(b.dataset.avatar){draft.avatar=b.dataset.avatar;main.querySelectorAll('[data-avatar]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));void run(saveDraft);return;}
  void run(async()=>{
   if(b.dataset.mission){await session.command('SELECT_MISSION',{missionId:b.dataset.mission});await session.owner(!document.hidden&&!loading);}
   else if(b.hasAttribute('data-menu')){await saveDraft();await session.command('RETURN_MENU');}
   else if(b.hasAttribute('data-restart')){await session.restart();}
   else if(b.dataset.action){await saveDraft();const r=await session.act(snapshot.state.screenId,b.dataset.action);if(!r?.reply.ok)throw Error('Действие не принято. Попробуйте ещё раз.');}
  });
 });
 session=createWebGLSession({port,catalog,sessionId:'webgl-v5',initialOwnerActive:false,onSnapshot:receive,onError:e=>console.error(e)});
 await session.start();await session.owner(!document.hidden&&!loading);
 const interval=setInterval(async()=>{if(polling||document.hidden||working||loading)return;polling=true;try{
  if(snapshot.state.status==='scan'&&!contacting){contacting=true;await session.contact('touch-entry','down',true);await new Promise(r=>setTimeout(r,825));await session.contact('touch-entry',document.hidden?'cancel':'up',!document.hidden);contacting=false;}
  await session.poll(Date.now());if(snapshot.state.status==='result'&&Date.now()>=snapshot.state.resultReadyAt)await session.command('ADVANCE_RESULT');
 }catch(e){console.error(e);}finally{polling=false;}},150);
 document.addEventListener('visibilitychange',()=>{void session.owner(!document.hidden&&!loading);});
 window.addEventListener('pagehide',()=>{clearTimeout(saveTimer);clearInterval(interval);void session.close();},{once:true});
 document.documentElement.dataset.gameReady='true';return session;
}
