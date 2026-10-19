import {MEDIA_ASSETS} from './journey-media-assets.mjs';
import {isIdTask} from './journey-id.mjs';

// Actual client frames, not inferred from ambiguous Figma frame names.
const frames=(ids,label)=>({ids:ids.map(String),label});
const missing=(reason,ids=[],label='Доступный контекст')=>({...frames(ids,label),missing:reason});
const CHANNEL=[frames([91504,91516],'Создание канала'),frames([91547,91553,91559,91662,91612,91637,91689],'Настройка канала'),frames([91714,91189],'Канал и публикация')];
const COMMENTS=[frames([91189,91755],'Публикация'),frames([91287,91338,91944,91998],'Комментарии и ответ'),frames([91389,91443,91854,91237,91803],'Обсуждение')];
const STATS=[frames([91497,91499],'Доступ к статистике'),frames([91501],'Статистика канала')];
const HOTEL=[frames(['hotel-01-arrival'],'Мишка подходит к отелю'),frames(['hotel-02-present-id'],'Предъявление ID в отеле')];
const BENEFIT=[frames(['museum-01-arrival'],'Мишка подходит к музею'),frames(['museum-02-present-id'],'Предъявление ID для льготы')];
const AGE=[frames(['age-01-arrival'],'Мишка входит в магазин'),frames(['age-02-present-id'],'Предъявление ID на кассе')];
const ACCOUNT=[frames([99709],'Подтверждение организации'),frames([99706],'Платформа MAX для бизнеса'),frames([99706],'Подключённая платформа')];
const BUSINESS_CHANNEL=[frames([100204,100205,100211,102188,103769,103778],'Создание канала бизнеса'),missing('Нет экрана подготовки публикации'),missing('Нет экрана отложенной публикации')];
const BOT=[frames([99725,99734,99750,99766],'Создание чат-бота'),frames([99817,99846,100034],'Бот и расширенные настройки'),missing('Нет сцены принятия нового заказа',['bot-delivery'],'Клиентский пример: статус и изменение доставки')];
const STORE=[missing('Нет карточки товара и каталога'),frames([99940,100117],'Подключение мини-приложения'),missing('Нет клиентской товарной витрины')];
const VOICE=[frames([74200],'Диалог'),frames([74231,74165,74133],'Начало записи'),frames([74262],'Запись голосового сообщения'),frames([74293],'Предпросмотр записи')];
const VIDEO=[frames([73633,73810],'Диалог'),frames([73648,73857,74100,73899,73976,73937],'Подготовка видеокружка'),frames([73690,73731,74018,74059],'Запись видеокружка'),frames([73772],'Предпросмотр видеокружка')];
const STATIC={channel:CHANNEL,comments:COMMENTS,statistics:STATS,hotel:HOTEL,benefit:BENEFIT,age:AGE,
 call:[frames([85871,85682],'Выбор собеседника'),frames([85847,85802,85778,85816],'Исходящий и входящие вызовы'),frames([85835,85865,85859,85886,85899,85762,85740,85717,85698,85728,85751,85757],'Вызов: состояния интерфейса')],
 group:[missing('Нет экранов создания группового чата'),missing('Нет экранов созданной группы')],
 reaction:[missing('Нет экранов стикеров и реакций'),missing('Нет экранов отправленной эмоции')],
 story:[frames([74325],'Истории в чатах'),frames([74309,74315],'Публикация: аудитория и время'),frames([74613,74603,74405,74496,74587,74627,74665],'Просмотр и состояния публикации')],
 account:ACCOUNT,sector:[ACCOUNT[1],ACCOUNT[1]],'business-channel':BUSINESS_CHANNEL,'business-bot':BOT,'business-store':STORE,
 'demo-benefit':BENEFIT,'demo-account':[ACCOUNT[0],ACCOUNT[2]]};

export function taskMedia(o,{client=true}={}){
 if(isIdTask(o?.step))return {ids:[],label:'Создание Цифрового ID',nativeId:true};
 if(!o)return missing('Материал задания не определён');
 let stages=STATIC[o.step];
 if(o.step==='message')stages=o.answers?.[0]===1?VIDEO:VOICE;
 if(o.step==='demo-tool'){
  const branch=[BUSINESS_CHANNEL,BOT,STORE][o.answers?.[0]??0];
  stages=[ACCOUNT[1],branch[0],branch[2]];
 }
 if(!stages)return missing('Материал задания не определён');
 let stage=Math.min(o.stage||0,stages.length-1);
 if(!client&&stages.length>2)stage=stage===0?0:stages.length-1;
 if(o.done){
  if(o.step==='message')return frames(o.answers?.[0]===1?[73601,73617,73825,73841]:[74215,74149],'Сообщение отправлено');
  stage=stages.length-1;
 }
 return stages[stage];
}
export function mediaFrames(media){return media.ids.map(id=>MEDIA_ASSETS[id]).filter(Boolean);}
export const TASK_DEVICES=Object.freeze({phone:Object.freeze({kind:'phone',width:392,height:800}),id:Object.freeze({kind:'phone',width:360,height:800}),pc:Object.freeze({kind:'pc',width:688,height:560})});
export function taskDevice(o){if(isIdTask(o?.step))return TASK_DEVICES.id;const frame=mediaFrames(taskMedia(o))[0];return o?.step==='business-tool'||frame?.width>frame?.height||!frame&&(o?.step?.startsWith('business-')||o?.step==='demo-tool')?TASK_DEVICES.pc:TASK_DEVICES.phone;}
const preloads=[];
export function preloadTaskMedia(){
 // First frames are warmed up. The blogger's top "+" is the first required
 // interaction, so its immediate next frame must be ready before play too.
 const ids=new Set([...Object.values(STATIC).flat(),...VOICE,...VIDEO,frames([73601],''),frames([74215],'')].map(m=>m.ids[0]).filter(Boolean));
 ids.add(CHANNEL[0].ids[1]);
 return Promise.all([...ids].map(id=>{const image=new Image();preloads.push(image);image.src=MEDIA_ASSETS[id].src;return image.decode();}));
}
export function missionCoverage(mission){
 const reasons=new Set();
 const steps=[...mission.steps,...(mission.branches||[]).map(b=>b.step)];
 for(const step of steps){
  const variants=step.id==='message'||step.id==='demo-tool'?[0,1,2]:[0];
  for(const choice of variants)for(let stage=0;stage<9;stage++){
   const media=taskMedia({step:step.id,stage,answers:[choice]});
   if(media.missing)reasons.add(media.missing);
   if(media.ids.some(id=>!MEDIA_ASSETS[id]))reasons.add('Файл материала отсутствует');
  }
 }
 return {complete:reasons.size===0,missing:[...reasons]};
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function coverageMarkup(mission){
 const c=missionCoverage(mission);
 return `<small class="media-coverage ${c.complete?'media-complete':'media-incomplete'}" data-content-status="${c.complete?'complete':'partial'}">${c.complete?'Без заглушек':'Есть заглушки'}</small>`;
}
export function taskMediaMarkup(o,{guidedReveal=false,...options}={}){
 const media=taskMedia(o,options),items=mediaFrames(media),first=items[0];
 const gap=media.missing?`<p class="media-missing" role="status">Заглушка: ${esc(media.missing)}</p>`:'';
 if(!first)return `<div class="client-scene media-placeholder" data-scene-slot="${esc(o.step)}">${gap}</div>`;
 const channelStart=guidedReveal&&o.step==='channel'&&o.stage===0&&!o.done;
 const image=`<img class="task-media-image" src="${esc(first.src)}" alt="${esc(first.label)}" draggable="false" decoding="async">`;
 const frame=channelStart?`<div class="task-media-canvas">${image}<button class="media-hotspot channel-plus" data-media-page="1" aria-label="Открыть меню создания через плюс"></button><button class="media-hotspot channel-create" data-answer="0" aria-label="Создать канал"></button></div>`:image;
 return `<div class="client-scene task-media" data-scene-slot="${esc(o.step)}" data-media-ids="${esc(media.ids.join(','))}" data-media-index="0"><div class="task-media-frame">${frame}</div><small class="media-caption">${esc(media.label)}</small>${!guidedReveal&&items.length>1?`<div class="media-navigation"><button class="pill" data-media-page="-1" aria-label="Предыдущий кадр" disabled>‹</button><small class="media-counter">1 / ${items.length}</small><button class="pill" data-media-page="1" aria-label="Следующий кадр">›</button></div>`:''}${gap}</div>`;
}

// A gallery is local presentation state. It never answers a task or changes progress.
// Decode first; commit only while the same retained task/phone is still connected.
export async function turnMediaPage(button,foreground,host){
 const gallery=button.closest('[data-media-ids]');if(!gallery)return false;
 if(gallery.dataset.mediaLoading||foreground?.busy(host)){foreground?.feedback?.(host,'Завершаем переход');return false;}
 const list=mediaFrames({ids:gallery.dataset.mediaIds.split(',')}),index=Math.max(0,Math.min(list.length-1,Number(gallery.dataset.mediaIndex)+Number(button.dataset.mediaPage)));
 if(index===Number(gallery.dataset.mediaIndex))return false;
 const oldImage=gallery.querySelector('img'),image=new Image();image.src=list[index].src;gallery.dataset.mediaLoading='true';
 try{await image.decode();}catch{delete gallery.dataset.mediaLoading;foreground?.feedback?.(host,'Кадр не загрузился. Попробуй ещё раз');return false;}
 if(!gallery.isConnected||gallery.querySelector('img')!==oldImage||foreground?.busy(host)){delete gallery.dataset.mediaLoading;return false;}
 const commit=()=>{
  delete gallery.dataset.mediaLoading;if(!gallery.isConnected||gallery.querySelector('img')!==oldImage)return;
  image.className='task-media-image';image.alt=list[index].label;image.draggable=false;oldImage.replaceWith(image);gallery.dataset.mediaIndex=String(index);
  const counter=gallery.querySelector('.media-counter');if(counter)counter.textContent=`${index+1} / ${list.length}`;
  for(const b of gallery.querySelectorAll('[data-media-page]'))b.disabled=Number(b.dataset.mediaPage)<0?index===0:index===list.length-1;
  foreground?.refreshPart(gallery.closest('.route-phone,.task-dialog')||gallery);foreground?.invalidate();
 };
 if(foreground)foreground.transitionContent(host,commit);else commit();return true;
}
