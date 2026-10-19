import {COFFEE_PRODUCTS,CHANNEL_LIMITS,CHANNEL_AVATARS,emptyInteraction,interactionComplete,placeProduct,keyboardEdit} from './kdw-interactions-model.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avatars={cat:'🐱',game:'🎮',island:'🏝️',heart:'♥'};
const rows={ru:['й ц у к е н г ш щ з х ъ','ф ы в а п р о л д ж э','я ч с м и т ь б ю'],en:['q w e r t y u i o p','a s d f g h j k l','z x c v b n m'],symbols:['1 2 3 4 5 6 7 8 9 0','@ # ₽ % & * ( ) - +','! ? . , : ; / « »']};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const photo=product=>{const [x,y,w,h]=product.crop;return `<span class="kdw-product-photo" style="background-size:${780/w*100}% ${447/h*100}%;background-position:${x/(780-w)*100}% ${y/(447-h)*100}%" aria-hidden="true"></span>`;};
function currentScene(snapshot,phase){
 const s=snapshot?.state;if(!s||!['task','result'].includes(s.status)||!['task','result'].includes(phase))return null;
 if(s.taskId==='blogger.channel'&&['blogger.channel.name','blogger.channel.filled'].includes(s.screenId))return 'channel';
 if(s.taskId==='business.store')return 'store';
 return null;
}
/** Native inputs own selection/IME. Only SAVE_INTERACTION and existing ACT commands change durable gameplay. */
export function mountKdwInteractions({getSession,onMenu,onPresented=()=>{}}){
 const overlay=document.createElement('section');overlay.id='kdw-interactions';overlay.hidden=true;overlay.setAttribute('aria-label','Интерактивное задание MAX');document.body.append(overlay);
 let scene=null,context='',draft=null,dirty=false,saving=null,submitBusy=false,saveTimer=null,disposed=false,activeField='name',keyboardOpen=false,language='ru',shift=true,symbols=false,activeSlot=0,screenId='';
 const sameContext=()=>{const s=getSession()?.snapshot?.state;return !disposed&&context===`${s?.runId}:${s?.taskId}`&&s?.status==='task';};
 const error=message=>{const el=overlay.querySelector('[data-kdw-error]');if(el)el.textContent=message;};
 const resize=()=>{const element=overlay.querySelector('.kdw-scene');if(element)element.style.setProperty('--kdw-scale',Math.min(innerWidth/1600,innerHeight/900));};
 window.addEventListener('resize',resize);
 function buttonsBusy(value){overlay.querySelectorAll('[data-kdw-submit]').forEach(button=>{button.disabled=value||!interactionComplete(scene,draft);button.setAttribute('aria-busy',String(value));});overlay.querySelectorAll('[data-kdw-key],[data-kdw-avatar],[data-kdw-field],[data-kdw-product],[data-kdw-slot],[data-kdw-remove]').forEach(control=>{control.disabled=value||(scene==='store'&&screenId!=='business.store.start');});}
 async function flush(){
  clearTimeout(saveTimer);
  if(saving){await saving;if(dirty&&sameContext())return flush();return;}
  const savedContext=context;
  saving=(async()=>{
   const deadline=Date.now()+5000;
   while(dirty&&sameContext()&&savedContext===context){
    const session=getSession();
    if(session.busy){if(Date.now()>deadline)throw Error('Не удалось сохранить. Попробуй ещё раз.');await sleep(30);continue;}
    const value=structuredClone(draft),state=session.snapshot.state;dirty=false;
    const reply=await session.command('SAVE_INTERACTION',{taskId:state.taskId,screenId:state.screenId,value});
    if(savedContext!==context||!sameContext())return;
    if(!reply?.reply.ok){dirty=true;throw Error('Не удалось сохранить изменения. Попробуй ещё раз.');}
   }
  })();
  try{await saving;}finally{saving=null;}
 }
 function changed(){dirty=true;error('');buttonsBusy(submitBusy);clearTimeout(saveTimer);saveTimer=setTimeout(()=>{void flush().catch(cause=>error(cause.message));},180);}
 function brand(){return '<img class="kdw-brand" src="./brand/assets/logos/max-primary-white.svg" alt="MAX">';}
 function node(icon,label,done=false){return `<div class="kdw-node"><span class="kdw-node-tile"><img src="./webgl-v5/icon-glyphs/max-icon.${icon}.svg" alt="">${done?'<i class="kdw-check">✓</i>':''}</span><span>${label}</span></div>`;}
 function frame(content){return `<div class="kdw-phone"><div class="kdw-phone-status"><span>9:41</span><span>▴ ▰ ▰</span></div>${content}<span class="kdw-phone-bottom"></span></div>`;}
 function keyboard(){
  const layout=symbols?'symbols':language;
  return `<div class="kdw-keyboard" aria-label="Экранная клавиатура"><div class="kdw-keyboard-tools"><span data-kdw-editing>${activeField==='name'?'Название канала':'Описание канала'}</span><button type="button" data-kdw-key="dismiss" aria-label="Скрыть клавиатуру">⌄</button></div>${rows[layout].map((row,index)=>`<div class="kdw-key-row">${index===2?'<button type="button" class="kdw-key-wide" data-kdw-key="shift" aria-label="Регистр" aria-pressed="'+shift+'">⇧</button>':''}${row.split(' ').map(key=>`<button type="button" data-kdw-key="${esc(key)}">${esc(shift?key.toUpperCase():key)}</button>`).join('')}${index===0?'<button type="button" class="kdw-key-wide" data-kdw-key="backspace" aria-label="Удалить символ">⌫</button>':''}${index===2?`<button type="button" class="kdw-key-wide" data-kdw-key="symbols">${symbols?'АБВ':'123'}</button>`:''}</div>`).join('')}<div class="kdw-key-row"><button type="button" class="kdw-key-wide" data-kdw-key="language">${language==='ru'?'EN':'РУ'}</button><button type="button" class="kdw-key-space" data-kdw-key=" ">Пробел</button><button type="button" class="kdw-key-enter" data-kdw-key="enter" aria-label="${activeField==='name'?'К описанию':'Готово'}">${activeField==='name'?'↵':'Готово'}</button></div></div>`;
 }
 function channelMarkup(){
  // Only the editable display occupies the existing phone's screen. Its shell,
  // route icons, timer and instruction continue to use the original renderer.
  return `<div class="kdw-channel-editor"><div class="kdw-phone-status"><span>9:41</span><span>▴ ▰ ▰</span></div><h2 class="kdw-phone-title">Создание канала</h2><div class="kdw-channel-form"><span class="kdw-field-label">Аватар</span><div class="kdw-avatars">${CHANNEL_AVATARS.map(id=>`<button type="button" data-kdw-avatar="${id}" aria-label="Аватар ${id}" aria-pressed="${draft.avatar===id}">${avatars[id]}</button>`).join('')}</div><label class="kdw-input-label"><span class="kdw-sr-only">Название канала</span><input name="name" data-kdw-field="name" autocomplete="off" inputmode="none" maxlength="${CHANNEL_LIMITS.name}" placeholder="Название канала" value="${esc(draft.name)}"></label><label class="kdw-input-label"><span class="kdw-sr-only">Описание канала</span><textarea name="description" data-kdw-field="description" autocomplete="off" inputmode="none" maxlength="${CHANNEL_LIMITS.description}" placeholder="Описание канала">${esc(draft.description)}</textarea></label><button type="button" class="kdw-primary" data-kdw-submit>Создать канал</button><p class="kdw-error" data-kdw-error role="status" aria-live="polite"></p></div><span class="kdw-phone-bottom"></span></div><div class="kdw-scene kdw-channel-scene" data-keyboard="${keyboardOpen}">${keyboard()}</div>`;
 }
 function alignChannel(){
  if(scene!=='channel')return;
  const editor=overlay.querySelector('.kdw-channel-editor'),phone=document.querySelector('.route-phone'),canvas=phone?.querySelector('.task-media-canvas');
  const ready=canvas&&phone.dataset.mediaReadyKey===phone.dataset.sceneVersion&&Number(phone.dataset.pathPresence??0)>.97;
  editor.hidden=!ready;if(!ready)return;
  const rect=canvas.getBoundingClientRect(),scale=rect.width/390;
  if(!(scale>0)){editor.hidden=true;return;}
  Object.assign(editor.style,{left:rect.left+'px',top:rect.top+'px',height:rect.height/scale+'px',transform:`scale(${scale})`});
 }
 function slotMarkup(){return draft.slots.map((id,index)=>{const product=COFFEE_PRODUCTS.find(p=>p.id===id),editable=screenId==='business.store.start';return `<div class="kdw-slot" data-active="${editable&&activeSlot===index}" data-filled="${!!product}"><button type="button" data-kdw-slot="${index}" ${editable?'':'disabled'} aria-label="${product?(editable?'Изменить: ':'Товар: ')+esc(product.name):(editable?'Добавить товар в слот ':'Пустой слот ')+(index+1)}">${product?photo(product)+`<span>${esc(product.name)}</span>`:'<span class="kdw-slot-plus">+</span>'}</button>${product&&editable?`<button type="button" class="kdw-remove" data-kdw-remove="${index}" aria-label="Удалить ${esc(product.name)}">×</button>`:''}</div>`;}).join('');}
 function productMarkup(){return COFFEE_PRODUCTS.map(product=>{const selected=draft.slots.includes(product.id),editable=screenId==='business.store.start';return `<button type="button" class="kdw-product" data-kdw-product="${product.id}" ${editable?'':'disabled'} aria-pressed="${selected}">${photo(product)}<span>${esc(product.name)}</span><strong>${product.price} ₽</strong>${selected?'<i class="kdw-product-check">✓</i>':''}</button>`;}).join('');}
 function storeMarkup(){
  const editing=screenId==='business.store.start',ready=screenId==='business.store.result';
  const title=editing?'Выберите товар<br>для добавления':ready?'Витрина готова':'Проверьте вашу витрину';
  const instruction=editing?'Добавь товары в мини-приложение. Нажми на слот, чтобы заменить товар.':ready?'Товары добавлены. Мини-приложение готово к работе.':'Все выбранные товары появятся в мини-приложении MAX.';
  return `<div class="kdw-scene kdw-store-scene">${brand()}<button class="kdw-timer" data-kdw-menu aria-label="Вернуться к миссиям"></button><div class="kdw-store-nodes">${node('bot','Чат-бот для<br>приёма заказов',true)}${node('store','Мини-<br>приложение')}</div><aside class="kdw-instruction"><small>ВОЗМОЖНОСТИ MAX</small><h1>Мини-приложение</h1><p>${instruction}</p></aside>${frame(`<h2 class="kdw-phone-title">${editing?'Магазин':ready?'Витрина готова':'Мини-приложение'}</h2><div class="kdw-store-slots">${slotMarkup()}</div>`)}<section class="kdw-catalog"><h2><span>▱</span>${title}</h2><div class="kdw-products" ${editing?'':'data-readonly="true"'}>${productMarkup()}</div><footer><p data-kdw-count></p><button type="button" class="kdw-primary" data-kdw-submit>${editing?'Готово':ready?'Продолжить':'Опубликовать витрину'}</button><p class="kdw-error" data-kdw-error role="status" aria-live="polite"></p></footer></section></div>`;
 }
 function redraw(){overlay.innerHTML=scene==='channel'?channelMarkup():storeMarkup();resize();alignChannel();buttonsBusy(submitBusy);refreshStore();}
 function refreshStore(){if(scene!=='store')return;const slots=overlay.querySelector('.kdw-store-slots');if(slots)slots.innerHTML=slotMarkup();const products=overlay.querySelector('.kdw-products');if(products)products.innerHTML=productMarkup();const count=overlay.querySelector('[data-kdw-count]');if(count)count.textContent=`Выбрано товаров: ${draft.slots.filter(Boolean).length}`;}
 function refreshKeyboard(){const old=overlay.querySelector('.kdw-keyboard');if(old){const template=document.createElement('template');template.innerHTML=keyboard();old.replaceChildren(...template.content.firstElementChild.childNodes);}overlay.querySelector('.kdw-scene').dataset.keyboard=String(keyboardOpen);const panel=overlay.querySelector('.kdw-keyboard');panel.inert=!keyboardOpen;panel.setAttribute('aria-hidden',String(!keyboardOpen));}
 function dismissKeyboard(){keyboardOpen=false;overlay.querySelector('[data-kdw-field]:focus')?.blur();refreshKeyboard();}
 function editKey(key){
  if(submitBusy)return;
  if(key==='dismiss'){dismissKeyboard();return;}
  if(key==='shift'){shift=!shift;refreshKeyboard();return;}
  if(key==='symbols'){symbols=!symbols;refreshKeyboard();return;}
  if(key==='language'){language=language==='ru'?'en':'ru';symbols=false;refreshKeyboard();return;}
  if(key==='enter'){if(activeField==='name'){activeField='description';overlay.querySelector('[name=description]').focus();refreshKeyboard();}else dismissKeyboard();return;}
  const input=overlay.querySelector(`[name="${activeField}"]`);if(!input)return;
  const insertion=key==='backspace'?key:shift?key.toUpperCase():key;
  const edited=keyboardEdit(input.value,input.selectionStart??input.value.length,input.selectionEnd??input.value.length,insertion,{limit:CHANNEL_LIMITS[activeField]});
  input.value=edited.value;input.focus({preventScroll:true});input.setSelectionRange(edited.caret,edited.caret);draft[activeField]=edited.value;if(shift&&key!=='backspace'){shift=false;refreshKeyboard();}changed();
 }
 async function act(){
  if(submitBusy||!sameContext())return;
  if(!interactionComplete(scene,draft)){error(scene==='channel'?'Введи название канала — минимум два символа.':'Добавь хотя бы один товар.');return;}
  submitBusy=true;buttonsBusy(true);const started=context;
  try{
   if(scene==='channel')dismissKeyboard();
   await flush();if(started!==context||!sameContext())return;
   const session=getSession();
   async function existingAction(actionId){const state=session.snapshot.state;const reply=await session.act(state.screenId,actionId,state.revision);if(!reply?.reply.ok)throw Error('Не удалось продолжить. Попробуй ещё раз.');}
   if(scene==='channel'){
    if(session.snapshot.state.screenId==='blogger.channel.name')await existingAction('channel.fill-name-example');
    if(started===context&&session.snapshot.state.screenId==='blogger.channel.filled')await existingAction('channel.create');
   }else await existingAction(session.snapshot.view.actions[0]?.actionId);
  }catch(cause){error(cause.message);}finally{submitBusy=false;if(started===context)buttonsBusy(false);}
 }
 overlay.addEventListener('pointerdown',event=>{if(event.target.closest('[data-kdw-key]'))event.preventDefault();});
 overlay.addEventListener('input',event=>{const field=event.target.dataset.kdwField;if(field&&draft){draft[field]=event.target.value;changed();}});
 overlay.addEventListener('focusin',event=>{if(event.target.dataset.kdwField){activeField=event.target.dataset.kdwField;keyboardOpen=true;refreshKeyboard();}});
 overlay.addEventListener('keydown',event=>{if(event.isComposing)return;if(event.key==='Escape'&&scene==='channel'){event.preventDefault();event.stopPropagation();dismissKeyboard();}if(event.key==='Enter'&&event.target.name==='name'){event.preventDefault();editKey('enter');}});
 overlay.addEventListener('click',event=>{
  if(event.target.matches('[data-kdw-field]')){activeField=event.target.dataset.kdwField;keyboardOpen=true;refreshKeyboard();return;}
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.hasAttribute('data-kdw-menu')){if(submitBusy)return;void flush().then(()=>onMenu()).catch(cause=>error(cause.message));return;}
  if(button.hasAttribute('data-kdw-submit')){void act();return;}
  if(button.hasAttribute('data-kdw-key')){editKey(button.dataset.kdwKey);return;}
  if(submitBusy)return;
  if(button.dataset.kdwAvatar){draft.avatar=button.dataset.kdwAvatar;overlay.querySelectorAll('[data-kdw-avatar]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));changed();return;}
  if(scene!=='store'||screenId!=='business.store.start')return;
  if(button.hasAttribute('data-kdw-slot')){activeSlot=Number(button.dataset.kdwSlot);refreshStore();return;}
  if(button.hasAttribute('data-kdw-remove')){activeSlot=Number(button.dataset.kdwRemove);draft.slots[activeSlot]=null;changed();refreshStore();return;}
  if(button.dataset.kdwProduct){draft.slots=placeProduct(draft.slots,button.dataset.kdwProduct,activeSlot);const next=draft.slots.findIndex(id=>id===null);if(next!==-1)activeSlot=next;changed();refreshStore();}
 });
 function hide(){if(!scene)return;clearTimeout(saveTimer);scene=null;context='';dirty=false;submitBusy=false;overlay.hidden=true;overlay.replaceChildren();delete document.documentElement.dataset.kdwInteraction;document.querySelector('#circles').inert=false;}
 return {
  flush,
  update(next,phase){
   if(disposed)return;const kind=currentScene(next,phase);if(!kind){hide();return;}
   const s=next.state,key=`${s.runId}:${s.taskId}`;
   if(key!==context){context=key;scene=kind;draft=structuredClone(s.progress[s.missionId]?.interactions?.[s.taskId]??emptyInteraction(kind));dirty=false;screenId=s.screenId;activeSlot=Math.max(0,draft.slots?.findIndex(id=>id===null)??0);activeField='name';keyboardOpen=false;redraw();overlay.hidden=false;document.documentElement.dataset.kdwInteraction=kind;document.querySelector('#circles').inert=scene==='store';if(scene==='channel')refreshKeyboard();else onPresented();}
   else if(screenId!==s.screenId){screenId=s.screenId;redraw();onPresented();}
   alignChannel();
   const seconds=Math.ceil(Math.max(0,(s.deadlineAt===null?next.view.remainingMs:(s.deadlineAt-(s.pausedAt??Date.now())))??0)/1000),timer=overlay.querySelector('.kdw-timer');if(timer)timer.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  },
  dispose(){disposed=true;hide();clearTimeout(saveTimer);window.removeEventListener('resize',resize);overlay.remove();},
 };
}
