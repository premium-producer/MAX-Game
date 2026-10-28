const $=s=>document.querySelector(s),owner=crypto.randomUUID(),iframe=$('#layout-preview');
let loaded,draft,scene=null,frameUrl='',liveBusy=false,saving=false,dirty=false,liveGeneration=0,debounce,livePromise=Promise.resolve(),liveQueued=false;
const names={logo:'Логотип',video:'Видео',missions:'Блок миссий',device:'Устройство',reference:'Справка',button:'Кнопка перехода',icons:'Иконки',timer:'Таймер'};
const message=(text,error=false)=>{$('#layout-notice').textContent=text;$('#layout-notice').dataset.error=String(error);};
async function api(action,value){const r=await fetch('/__kdw/layout/'+action,value===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});const v=await r.json();if(!r.ok)throw Error(v.error||'Сервис недоступен');return v;}
const effective=(kind,id)=>{const layers=[draft.game,draft.devices[kind],draft.screens[id]];return{...Object.assign({},...layers),relative:Object.assign({},...layers.map(v=>v?.relative))};};
function target(key,write=false){const scope=$('#layout-scope').value;if(scope==='game')return draft.game;const root=scope==='screen'?draft.screens:draft.devices,id=scope==='screen'?scene?.screen:scope;if(!id||id==='menu')return null;if(write&&!root[id])root[id]={};return write?root[id]:(root[id]??{});}
function pose(key){if($('#layout-scope').value==='game')return draft.game[key];return target(key)?.[key]??effective($('#layout-scope').value==='screen'?scene?.kind:$('#layout-scope').value, $('#layout-scope').value==='screen'?scene?.screen:'')[key];}
function post(){iframe.contentWindow?.postMessage({type:'kdw-layout:draft',value:draft,guides:$('#layout-guides').checked},location.origin);}
function changed(){dirty=true;post();clearTimeout(debounce);if($('#layout-live').checked)debounce=setTimeout(()=>void applyLive(),100);}
function fields(parent,keys,standby){parent.replaceChildren();for(const key of keys){const p=standby?draft.standby[key]:pose(key);const box=document.createElement('div');box.className='pose-fields';const h=document.createElement('h3');h.textContent=!standby&&key==='device'?'Масштаб всего блока':names[key];box.append(h);
 for(const [prop,title,min,max,step]of [['x','Смещение X',-3072,3072,1],['y','Смещение Y',-1536,1536,1],['scale','Масштаб, %',35,250,1]].filter(([prop])=>standby||prop==='scale')){const row=document.createElement('div');row.className='pose-row';const label=document.createElement('label');label.textContent=title;const range=document.createElement('input');range.type='range';const number=document.createElement('input');number.type='number';number.setAttribute('aria-label',names[key]+' · '+title);for(const n of [range,number]){n.min=min;n.max=max;n.step=step;n.value=prop==='scale'?Math.round(p[prop]*100):p[prop];n.dataset.group=key;n.dataset.property=prop;n.disabled=!standby&&$('#layout-scope').value==='screen'&&(!scene?.screen||scene.standby);n.oninput=()=>{const value=Number(n.value);if(n.value===''||!Number.isFinite(value)||value<min||value>max)return;range.value=number.value=value;let g;if(standby)g=draft.standby;else{g=target(key,true);if(!g)return;if(!g[key])g[key]=structuredClone(pose(key));}g[key][prop]=prop==='scale'?value/100:value;changed();};}label.append(range);row.append(label,number);box.append(row);}parent.append(box);}}
const relativeFields=[
 ['fallingCardScale','Размер падающих карточек, % прежнего',50,300,220,100],
 ['fallingSpawnRight','Расширить область появления вправо, px',0,1600,0,1],
 ['pcScale','Компьютер, % обычного устройства',10,200,100,100],
 ['cardsScale','Телефон в играх с карточками, %',10,200,120,100],
 ['deviceScale','Размер устройства, % исходного',35,250,100,100],
 ['centerX','Сдвиг центра X, % базовой ширины',-200,200,0,1],
 ['centerY','Сдвиг центра Y, % базовой высоты',-200,200,0,1],
 ['iconWidth','Ширина иконки, % базового размера',5,180,null,1],
 ['iconGap','Между иконками, % базового размера',0,200,null,1],
 ['iconsDeviceGap','Иконки → устройство, % базового размера',0,200,null,1],
 ['referenceWidth','Ширина справки, % базового размера',20,300,null,1],
 ['deviceReferenceGap','Устройство → справка, % базового размера',0,200,null,1],
 ['buttonGap','Справка → кнопка, % базового размера',0,100,null,1]
];
function relativeValues(){const scope=$('#layout-scope').value;return effective(scope==='screen'?scene?.kind:scope,scope==='screen'?scene?.screen:'').relative;}
function setRelative(prop,value){const g=target('relative',true);if(!g)return;g.relative??={};if(value===undefined)delete g.relative[prop];else g.relative[prop]=value;changed();}
function relativeControls(){const parent=$('#relative-fields'),value=relativeValues(),disabled=$('#layout-scope').value==='screen'&&(!scene?.screen||scene.standby);parent.replaceChildren();
 for(const [prop,title,min,max,defaultValue,factor]of relativeFields){const row=document.createElement('div');row.className='pose-row';const label=document.createElement('label');label.textContent=title;const range=document.createElement('input'),number=document.createElement('input');range.type='range';number.type='number';number.setAttribute('aria-label',title);const current=value[prop]===undefined?defaultValue:Math.round(value[prop]*factor*10000)/10000;
  for(const n of [range,number]){n.min=min;n.max=max;n.step=prop==='deviceScale'?1:.5;n.dataset.group='relative';n.dataset.property=prop;n.disabled=disabled;}
  range.value=current??Math.max(min,Math.min(max,scene?.ratios?.[prop]??min));number.value=current??'';number.placeholder='Авто';
  for(const n of [range,number])n.oninput=()=>{if(n.value===''&&n===number){setRelative(prop,undefined);return;}const next=Number(n.value);if(!Number.isFinite(next)||next<min||next>max)return;number.value=range.value=next;setRelative(prop,next/factor);};
  label.append(range);row.append(label,number);parent.append(row);
 }
 const hint=document.createElement('p');hint.textContent='Падающие посты и товары: 220% — новый исходный размер. Расширение вправо задаётся в пикселях экрана 3072×1536 и ограничивается краем дисплея; размер карточек от него не меняется. За жёлтой областью лидара касания недоступны. Компьютер и телефон в играх с карточками настраиваются независимо, от 10 до 200%. Меняется только устройство, плавно, с сохранением центра. '+'Пустое поле — исходный размер или отступ. Базовый размер един для телефона и компьютера и следует общему масштабу. Отдельное увеличение устройства не раздувает иконки и справку и не меняет его центр. Кнопка всегда по центру под справкой';parent.append(hint);
 const center=document.createElement('button');center.type='button';center.id='center-device';center.textContent='По центру игровой области';center.disabled=disabled;center.onclick=()=>{setRelative('centered',true);setRelative('centerX',0);setRelative('centerY',0);relativeControls();};
 const original=document.createElement('button');original.type='button';original.className='secondary';original.textContent='Вернуть исходный центр';original.disabled=disabled;original.onclick=()=>{setRelative('centered',false);setRelative('centerX',0);setRelative('centerY',0);relativeControls();};parent.append(center,original);
}
function render(){fields($('#standby-fields'),['logo','video','missions'],true);fields($('#game-fields'),['device'],false);relativeControls();$('#scope-info').textContent=$('#layout-scope').value==='screen'?(scene?.screen&&!scene.standby?'Исключение для '+scene.screen:'Откройте игровой экран в предпросмотре'):'Общие значения → тип устройства → отдельный экран';$('#clear-override').disabled=$('#layout-scope').value==='game';}
function fit(){iframe.style.transform=`scale(${$('#preview-wrap').clientWidth/3072})`;}
new ResizeObserver(fit).observe($('#preview-wrap'));
async function openPreview(){const session=await api('session',{});const u=new URL(session.url,location.origin);if($('#layout-scene').value)u.searchParams.set('layout-scene',$('#layout-scene').value);frameUrl=u.href;scene=null;iframe.src=frameUrl;render();fit();}
function profiles(){const select=$('#layout-profile');select.replaceChildren();for(const p of loaded.profiles){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;select.append(option);}select.value=loaded.activeProfileId;$('#layout-profile-name').value=loaded.activeProfileName;}
function adopt(v){loaded=v;draft=structuredClone(v.value);dirty=false;profiles();render();post();}
async function cancelLive(disable=true){liveGeneration++;liveQueued=false;clearTimeout(debounce);if(disable)$('#layout-live').checked=false;await livePromise;await api('cancel',{owner});}
function applyLive(){
 if(liveBusy){liveQueued=true;return livePromise;}if(saving||!$('#layout-live').checked)return Promise.resolve();
 liveBusy=true;liveQueued=false;const generation=liveGeneration;
 livePromise=api('preview',{owner,value:draft,revision:loaded.revision,profileId:loaded.activeProfileId}).then(async()=>{if(generation!==liveGeneration)await api('cancel',{owner});else if(dirty)message('Правки видны на стене · «Сохранить профиль» фиксирует их');}).catch(e=>{$('#layout-live').checked=false;message(e.message,true);}).finally(()=>{liveBusy=false;if(liveQueued&&!saving&&$('#layout-live').checked){liveQueued=false;void applyLive();}});return livePromise;
}
async function action(fn){if(saving)return;saving=true;try{await fn();}catch(e){$('#layout-profile').value=loaded.activeProfileId;message(e.message,true);}finally{saving=false;if($('#layout-live').checked)void applyLive();}}
$('#layout-profile').onchange=()=>void action(async()=>{const id=$('#layout-profile').value;await cancelLive(false);adopt(await api('profiles/switch',{owner,id,revision:loaded.profilesRevision}));message('Профиль переключён. Несохранённые изменения отменены');});
$('#layout-profile-name').oninput=()=>{dirty=true;};
$('#create-profile').onclick=()=>void action(async()=>{const name=$('#new-profile-name').value;await cancelLive(false);adopt(await api('profiles/create',{owner,name,value:draft,revision:loaded.profilesRevision}));$('#new-profile-name').value='';message('Профиль создан. Настройте его и сохраните');});
$('#layout-scope').onchange=render;$('#layout-guides').onchange=post;
$('#open-preview').onclick=()=>void action(openPreview);$('#layout-scene').onchange=()=>void action(openPreview);
$('#layout-live').onchange=()=>{if($('#layout-live').checked){liveGeneration++;message('Режим настройки включён. Правки сразу видны на стене');}else void cancelLive().then(()=>message('На стене восстановлен сохранённый профиль')).catch(e=>message(e.message,true));};
$('#save-layout').onclick=()=>void action(async()=>{await cancelLive(false);const v=await api('profiles/save',{owner,id:loaded.activeProfileId,name:$('#layout-profile-name').value,value:draft,revision:loaded.profilesRevision});adopt(v);message('Композиция сохранена в профиле «'+v.activeProfileName+'»');});
$('#cancel-layout').onclick=()=>void action(async()=>{await cancelLive(false);adopt(await api('state'));message('Несохранённые изменения отменены');});
$('#exit-layout').onclick=()=>void action(async()=>{await cancelLive();dirty=false;location.href='./';});
$('#reset-layout').onclick=()=>{draft=structuredClone(loaded.defaults);render();changed();message('Исходный макет в предпросмотре. Нажмите «Сохранить», чтобы оставить его');};
$('#clear-override').onclick=()=>{const scope=$('#layout-scope').value;if(scope==='screen'&&scene?.screen)delete draft.screens[scene.screen];else if(['phone','pc'].includes(scope))delete draft.devices[scope];render();changed();};
$('#export-layout').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)+'\n'],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='max-layout.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import-layout').onclick=()=>$('#layout-file').click();$('#layout-file').onchange=()=>void action(async()=>{const file=$('#layout-file').files[0];if(!file)return;try{if(file.size>65536)throw Error('Профиль должен быть меньше 64 КБ');const v=await api('validate',{value:JSON.parse(await file.text())});draft=v.value;render();changed();message('Профиль импортирован в предпросмотр. Сохраните его для применения');}finally{$('#layout-file').value='';}});
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==iframe.contentWindow||e.data?.type!=='kdw-layout:scene')return;const previous=scene;scene=e.data;$('#scene-info').textContent=scene.standby?'Standby':`${scene.screen} · ${scene.kind==='pc'?'компьютер':'телефон'}`;$('#layout-measurements').textContent=scene.rects.map(r=>`${names[r.role]}: X ${Math.round(r.x)} · Y ${Math.round(r.y)} · ${Math.round(r.width)}×${Math.round(r.height)}`).join('\n');if(previous?.screen!==scene.screen||previous?.kind!==scene.kind||previous?.standby!==scene.standby)render();});
iframe.onload=post;
setInterval(()=>{if(draft)post();if($('#layout-live').checked)void applyLive();},3000);
window.addEventListener('pagehide',()=>{fetch('/__kdw/layout/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({owner}),keepalive:true}).catch(()=>{});});

try{adopt(await api('state'));await openPreview();message('Настройки прочитаны. Предпросмотр открыт');}catch(e){message(e.message,true);}
