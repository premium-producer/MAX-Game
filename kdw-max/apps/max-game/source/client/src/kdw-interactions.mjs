import {webglActivitiesEnabled} from './activity-webgl/activity-runtime.mjs';
import {mountWebGLActivity} from './activity-webgl/activity-controller.mjs';
import {guardImage,fallbackImageSource,visitorMessage} from './kdw-graceful-media.mjs';
import {alignPixelKeyboard} from './kdw-pixel-map.mjs';
import {createTextInputGuard} from './kdw-text-input-guard.mjs';
import {TEXT_POLICY,TEXT_REMOVED_NOTICE} from './kdw-text-policy.mjs';
import {KEYBOARD_DISMISS_ICON,updateKeyboardPanel} from './kdw-keyboard-ui.mjs';
import {typographyText} from './kdw-typography.mjs';
import {preloadBusinessImages} from './kdw-business-images.mjs';
import {storeBank,STORE_VERSION,storeGoal,storeRating,STORE_TASK,STORE_SCREEN} from './kdw-store-rating.mjs';
import {activityGeometry,alignActivityPhone,alignActivityActions,fadeActivityOut} from './kdw-activity-stage.mjs';
import {createProductStream} from './kdw-product-stream.mjs';
import {createStoreMotion} from './kdw-store-motion.mjs';
import {COFFEE_PRODUCTS,CHANNEL_LIMITS,CHANNEL_AVATARS,emptyInteraction,interactionComplete,placeProduct,keyboardEdit} from './kdw-interactions-model.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avatars={cat:'🐱',game:'🎮',island:'🏝️',heart:'♥'};
const rows={ru:['й ц у к е н г ш щ з х ъ','ф ы в а п р о л д ж э','я ч с м и т ь б ю'],en:['q w e r t y u i o p','a s d f g h j k l','z x c v b n m'],symbols:['1 2 3 4 5 6 7 8 9 0','@ # ₽ % & * ( ) - +','! ? . , : ; / « »']};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const photo=product=>{if(product.image)return `<img class="kdw-product-photo kdw-product-generated" src="./${esc(product.image.path)}" alt="" draggable="false">`;if(!product.crop)return `<span class="kdw-product-photo kdw-product-emoji">${esc(product.emoji)}</span>`;const [x,y,w,h]=product.crop;return `<span class="kdw-product-photo" style="background-size:${780/w*100}% ${447/h*100}%;background-position:${x/(780-w)*100}% ${y/(447-h)*100}%" aria-hidden="true"></span>`;};
const ratingMarkup=score=>`<small class="kdw-store-score" data-tone="${score==null?'none':score>=5?'gold':score<4?'red':'blue'}" aria-label="Оценка ${score??'нет'}"><span aria-hidden="true">★</span> ${score?.toFixed(1).replace('.',',')??'—'}</small>`;
function currentScene(snapshot,phase){
 const s=snapshot?.state;if(!s||!['task','result'].includes(s.status)||['business.store.dashboard','business.store.settings'].includes(s.screenId))return null;
 // Prepare native content during the same entrance as its device shell.
 if(s.taskId==='business.store'&&['trace','phone-enter','task','result','phone-exit'].includes(phase))return 'store';
 if(!['task','result'].includes(phase))return null;
 // The personal channel renderer owns both blogger tasks and their shared profile.
 if(s.taskId==='business.store')return 'store';
 return null;
}
/** Native inputs own selection/IME. Only SAVE_INTERACTION and existing ACT commands change durable gameplay. */
export function mountKdwInteractions(options){
 if(!webglActivitiesEnabled())return mountLegacyInteractions(options);
 const legacy=mountLegacyInteractions(options),gpu=mountWebGLActivity({kind:'store',getSession:options.getSession});let gpuOwns=false;
 return {gpuActivity:true,ready:next=>gpu.ready(next),flush:opts=>gpuOwns?gpu.flush(opts):legacy.flush(opts),align(){if(!gpuOwns)legacy.align();},
  update(next,phase){gpuOwns=next?.state?.taskId===STORE_TASK&&next.state.screenId===STORE_SCREEN;legacy.update(gpuOwns?null:next,phase);gpu.update(next,phase);},
  dispose(){legacy.dispose();gpu.dispose();}};
}
function mountLegacyInteractions({getSession,onMenu,deferAlignment=false}){
 const overlay=document.createElement('section');overlay.id='kdw-interactions';overlay.hidden=true;overlay.setAttribute('aria-label','Интерактивное задание MAX');document.body.append(overlay);
 const storeMotion=createStoreMotion(overlay);
 const productStream=createProductStream(overlay,product=>productMarkup(product));
 let latestSnapshot=null,storeStarting=false,storeSignature='',storePending=false,scenePhase='';
 let storePhotos={key:'',status:'idle'};
 function ensureStorePhotos(){
  const business=latestSnapshot?.state.progress.business;if(!business)return false;
  const activity=business.storeActivity,type=activity?.businessType??business.answers?.businessType??'cafe',version=activity?.version??STORE_VERSION,key=type+':'+version;
  if(storePhotos.key!==key){
   const state=storePhotos={key,status:'loading'};
   preloadBusinessImages(storeBank(type,version)).then(()=>{if(!disposed&&storePhotos===state){state.status='ready';if(scene==='store')error('');}})
    .catch(cause=>{console.error('MAX_STORE_MEDIA_FALLBACK',cause?.name);if(!disposed&&storePhotos===state)state.status='ready';});
  }
  return storePhotos.status==='ready';
 }
 let scene=null,context='',draft=null,dirty=false,saving=null,submitBusy=false,saveTimer=null,disposed=false,activeField='name',keyboardOpen=false,language='ru',shift=true,symbols=false,activeSlot=0,screenId='',noticeTimer=0,noticeText='';
 const storeFinished=()=>storeGoal(latestSnapshot?.state.progress.business?.storeActivity)||screenId!==STORE_SCREEN&&!latestSnapshot?.state.progress.business?.storeActivity&&interactionComplete('store',draft);
 const sameContext=()=>{const s=getSession()?.snapshot?.state;return !disposed&&context===`${s?.runId}:${s?.taskId}`&&s?.status==='task';};
 const error=message=>{const el=overlay.querySelector('[data-kdw-error]');if(el)el.textContent=visitorMessage(message);};
 const resize=()=>{const element=overlay.querySelector('.kdw-scene');if(element){element.style.setProperty('--kdw-scale',Math.min(innerWidth/1600,innerHeight/900));alignPixelKeyboard(element);}};
 window.addEventListener('resize',resize);
 function buttonsBusy(value){overlay.querySelectorAll('[data-kdw-submit]').forEach(button=>{button.disabled=value||scene==='store'&&(storeMotion.active()||storePending||scenePhase!=='task')||!(scene==='store'?storeFinished():interactionComplete(scene,draft));button.setAttribute('aria-busy',String(value));});overlay.querySelectorAll('[data-kdw-key],[data-kdw-avatar],[data-kdw-field],[data-kdw-product],[data-kdw-slot],[data-kdw-remove]').forEach(control=>{control.disabled=value||(scene==='store'&&screenId!=='business.store.start');});}
 async function flush({final=true}={}){
  if(final&&!textInputs.finish())throw Error('Завершите ввод текста');
  clearTimeout(saveTimer);if(textInputs.pending())return;
  if(saving){await saving;if(dirty&&sameContext())return flush();return;}
  const savedContext=context;
  saving=(async()=>{
   const deadline=Date.now()+5000;
   while(dirty&&sameContext()&&savedContext===context){
    const session=getSession();
    if(session.busy){if(Date.now()>deadline)throw Error('Не удалось сохранить. Попробуй ещё раз.');await sleep(30);continue;}
    const value=structuredClone(draft),state=session.snapshot.state;dirty=false;
    const reply=await session.command('SAVE_INTERACTION',{taskId:state.taskId,screenId:state.screenId,value,textPolicy:TEXT_POLICY});
    if(savedContext!==context||!sameContext())return;
    if(!reply?.reply.ok){dirty=true;throw Error('Не удалось сохранить изменения. Попробуй ещё раз.');}
   }
  })();
  try{await saving;}finally{saving=null;}
 }
 function changed(){dirty=true;error('');buttonsBusy(submitBusy);clearTimeout(saveTimer);saveTimer=setTimeout(()=>{if(!textInputs.pending())void flush({final:false}).catch(cause=>error(cause.message));},180);}
 function keyboard(){
  const layout=symbols?'symbols':language;
  return `<div class="kdw-keyboard" aria-label="Экранная клавиатура"><small class="kdw-sr-only" data-kdw-moderation-keyboard aria-hidden="true">${esc(noticeText)}</small>${rows[layout].map((row,index)=>`<div class="kdw-key-row">${index===2?'<button type="button" class="kdw-key-wide" data-kdw-key="shift" aria-label="Регистр" aria-pressed="'+shift+'">⇧</button>':''}${row.split(' ').map(key=>`<button type="button" data-kdw-key="${esc(key)}">${esc(shift?key.toUpperCase():key)}</button>`).join('')}${index===0?'<button type="button" class="kdw-key-wide" data-kdw-key="backspace" aria-label="Удалить символ">⌫</button>':''}${index===2?`<button type="button" class="kdw-key-wide" data-kdw-key="symbols">${symbols?'АБВ':'123'}</button>`:''}</div>`).join('')}<div class="kdw-key-row"><button type="button" class="kdw-key-wide" data-kdw-key="language">${language==='ru'?'EN':'РУ'}</button><button type="button" class="kdw-key-space" data-kdw-key=" ">Пробел</button><button type="button" data-kdw-key="dismiss" class="kdw-keyboard-dismiss kdw-key-wide" aria-label="Скрыть клавиатуру">${KEYBOARD_DISMISS_ICON}</button><button type="button" class="kdw-key-enter" data-kdw-key="enter" aria-label="${activeField==='name'?'К описанию':'Готово'}">${activeField==='name'?'↵':'Готово'}</button></div></div>`;
 }
 function channelMarkup(){
  // Only the editable display occupies the existing phone's screen. Its shell,
  // route icons, timer and instruction continue to use the original renderer.
  return `<div class="kdw-channel-editor"><div class="kdw-phone-status"><span>9:41</span><span>▴ ▰ ▰</span></div><h2 class="kdw-phone-title">Создание канала</h2><div class="kdw-channel-form"><span class="kdw-field-label">Аватар</span><div class="kdw-avatars">${CHANNEL_AVATARS.map(id=>`<button type="button" data-kdw-avatar="${id}" aria-label="Аватар ${id}" aria-pressed="${draft.avatar===id}">${avatars[id]}</button>`).join('')}</div><label class="kdw-input-label"><span class="kdw-sr-only">Название канала</span><input name="name" data-kdw-field="name" autocomplete="off" inputmode="none" maxlength="${CHANNEL_LIMITS.name}" placeholder="Название канала" value="${esc(draft.name)}"></label><label class="kdw-input-label"><span class="kdw-sr-only">Описание канала</span><textarea name="description" data-kdw-field="description" autocomplete="off" inputmode="none" maxlength="${CHANNEL_LIMITS.description}" placeholder="Описание канала">${esc(draft.description)}</textarea></label><button type="button" class="kdw-primary" data-kdw-submit>Создать канал</button><p class="kdw-error" data-kdw-error role="status" aria-live="polite"></p><p class="kdw-moderation-notice" data-kdw-moderation role="status" aria-live="polite"></p></div><span class="kdw-phone-bottom"></span></div><div class="kdw-scene kdw-channel-scene" data-keyboard="${keyboardOpen}">${keyboard()}</div>`;
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
 function storeRows(){return latestSnapshot?.state.progress.business?.storeActivity?.published??(screenId!==STORE_SCREEN?(draft?.slots??[]).filter(Boolean).map(postId=>({postId,score:null})):[]);}
 function storeProduct(id){return storeBank(latestSnapshot?.state.progress.business?.storeActivity?.businessType??latestSnapshot?.state.progress.business?.answers?.businessType,latestSnapshot?.state.progress.business?.storeActivity?.version??STORE_VERSION).find(p=>p.id===id)??COFFEE_PRODUCTS.find(p=>p.id===id);}
 function slotMarkup(){const rows=storeRows(),capacity=Math.max(8,Math.ceil((rows.length+2)/2)*2);return rows.map((row,index)=>{const product=storeProduct(row.postId);return `<article class="kdw-slot" data-filled="true" data-rating="${row.score}"><div data-kdw-slot="${index}" class="kdw-slot-content">${photo(product)}<div class="kdw-store-price"><strong>${product.price.toLocaleString('ru-RU')} ₽</strong>${ratingMarkup(row.score)}</div><span class="kdw-store-name">${esc(typographyText(product.name))}</span>${product.description?`<small class="kdw-store-description">${esc(typographyText(product.description))}</small>`:''}<span class="kdw-store-more">Подробнее</span></div></article>`;}).join('')+Array.from({length:capacity-rows.length},()=>'<div class="kdw-slot kdw-slot-placeholder" aria-hidden="true"></div>').join('');}
 function productMarkup(product){return `<button type="button" class="kdw-product" data-kdw-product="${product.id}" aria-label="Добавить ${esc(product.name)}">${photo(product)}<span class="kdw-product-title">${esc(typographyText(product.name))}</span><strong>${product.price.toLocaleString('ru-RU')} ₽</strong>${product.description?`<small class="kdw-product-description">${esc(typographyText(product.description))}</small>`:''}</button>`;}
 function storeMarkup(){
  return `<div class="kdw-store-editor kdw-max-store"><header class="kdw-store-header"><img src="./assets/kdw-native/store-header.svg" alt="" draggable="false"><h2>Рейтинг магазина: <span data-store-rating>4,0</span></h2></header><div class="kdw-store-scroll" tabindex="0" aria-label="Каталог магазина"><div class="kdw-store-slots">${slotMarkup()}</div></div></div><footer class="kdw-store-actions"><button type="button" class="kdw-activity-button kdw-transition-button" data-kdw-submit hidden>Завершить миссию</button><button type="button" class="kdw-activity-button" data-kdw-image-retry hidden>Повторить загрузку</button><p class="kdw-error" data-kdw-error role="status" aria-live="polite"></p><p class="kdw-moderation-notice" data-kdw-moderation role="status" aria-live="polite"></p></footer><section class="kdw-product-stream" aria-label="Товары для витрины"></section>`;
 }
 function alignStore(){
  if(scene!=='store')return;
  const editor=overlay.querySelector('.kdw-store-editor'),field=overlay.querySelector('.kdw-product-stream'),g=activityGeometry();
  const ready=g&&g.matched&&g.phone.dataset.sceneVersion?.includes(screenId)&&g.phone.querySelector('.task-media-canvas img')?.getAttribute('src')?.endsWith('kdw-native/store-phone.svg');
  const controls=overlay.querySelector('.kdw-store-actions');
  if(!ready){editor.style.opacity='0';field.style.opacity='0';controls.style.opacity='0';editor.inert=field.inert=controls.inert=true;return;}
  const photosReady=ensureStorePhotos(),phoneAlpha=alignActivityPhone(editor,g);editor.inert ||=scenePhase!=='task'||!photosReady;
  if(!photosReady){editor.style.opacity='0';error(storePhotos.status==='error'?'Не удалось загрузить фотографии':'Загружаем фотографии…');}
  const retry=overlay.querySelector('[data-kdw-image-retry]');if(retry)retry.hidden=storePhotos.status!=='error';
  if(phoneAlpha>.97&&!editor.inert&&screenId===STORE_SCREEN&&scenePhase==='task')void startStore();productStream.sync(g,latestSnapshot,screenId===STORE_SCREEN&&photosReady,scenePhase==='task'&&phoneAlpha>.97&&!editor.inert);
  alignActivityActions(controls,g,phoneAlpha,editor.inert&&storePhotos.status!=='error');
  for(const node of field.querySelectorAll('[data-kdw-product]'))node.disabled ||=submitBusy||storePending;
 }
 function redraw(){storeMotion.clear();overlay.innerHTML=scene==='channel'?channelMarkup():storeMarkup();for(const image of overlay.querySelectorAll('img'))guardImage(image,{fallback:fallbackImageSource()});resize();alignChannel();alignStore();buttonsBusy(submitBusy);refreshStore();}
 function refreshStore(){
  if(scene!=='store')return;
  const activity=latestSnapshot?.state.progress.business?.storeActivity,signature=JSON.stringify(activity?.published??[]),slots=overlay.querySelector('.kdw-store-slots');
  if(slots&&signature!==storeSignature){storeSignature=signature;slots.innerHTML=slotMarkup();const scroller=overlay.querySelector('.kdw-store-scroll'),last=slots.querySelector('[data-filled=true]:last-of-type');
   // Follow the newest product, not the empty templates following it.
   const bounds=scroller.getBoundingClientRect(),scale=bounds.width/scroller.offsetWidth;
   const bottom=last?(last.getBoundingClientRect().bottom-bounds.top)/scale+scroller.scrollTop+9:0;
   scroller.scrollTo({top:Math.max(0,bottom-scroller.clientHeight),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  const finished=storeFinished();document.documentElement.dataset.kdwStorePlaying=String(!finished);
  overlay.querySelector('[data-kdw-submit]').hidden=!finished;
  const rating=overlay.querySelector('[data-store-rating]'),ratingText=storeRating(activity).toFixed(1).replace('.',',');if(rating.textContent!==ratingText)rating.textContent=ratingText;
  storeMotion.sync();buttonsBusy(submitBusy);
 }
 async function startStore(){const session=getSession();if(storeStarting||session.snapshot?.state.progress.business?.storeActivity||session.busy||!session.snapshot?.state.ownerActive)return;storeStarting=true;const key=context;try{const r=await session.command('START_STORE',{taskId:STORE_TASK,screenId:STORE_SCREEN});if(key===context){latestSnapshot=session.snapshot;if(!r?.reply.ok)error('Не удалось начать каталог.');}}finally{storeStarting=false;}}
 async function pickProduct(button){if(button.disabled||storeFinished()||storePending||submitBusy||getSession().busy||screenId!==STORE_SCREEN)return;storePending=true;button.dataset.pending='true';const key=context,index=latestSnapshot.state.progress.business.storeActivity.published.length,product=button.dataset.kdwProduct;
  storeMotion.begin(index,button);
  try{const session=getSession(),r=await session.command('PICK_PRODUCT',{taskId:STORE_TASK,screenId:STORE_SCREEN,spawnId:button.dataset.productSpawn});if(key!==context)return;if(!r?.reply.ok){storeMotion.cancel(index);error('Товар уже улетел. Выберите следующий.');return;}latestSnapshot=session.snapshot;refreshStore();error('');storeMotion.add(product,index,button);}catch(cause){if(key===context){storeMotion.cancel(index);error('Не удалось выбрать товар. Попробуйте ещё раз.');}}finally{storePending=false;delete button.dataset.pending;}}
 function refreshKeyboard(){updateKeyboardPanel(overlay.querySelector('.kdw-channel-scene'),keyboard(),keyboardOpen);}
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
  input.value=edited.value;input.focus({preventScroll:true});input.setSelectionRange(edited.caret,edited.caret);textInputs.edit(input);if(shift&&key!=='backspace'){shift=false;refreshKeyboard();}
 }
 async function act(){
  if(submitBusy||!sameContext()||scene==='store'&&storeMotion.active())return;
  if(!(scene==='store'?storeFinished():interactionComplete(scene,draft))){error(scene==='channel'?'Введи название канала — минимум два символа.':'Добавь хотя бы один товар.');return;}
  submitBusy=true;buttonsBusy(true);const started=context;
  try{
   if(scene==='channel')dismissKeyboard();
   await flush();if(started!==context||!sameContext())return;
   const session=getSession();
   async function existingAction(actionId){const state=session.snapshot.state;const reply=await session.command('ACT',{taskId:state.taskId,screenId:state.screenId,actionId,expectedRevision:state.revision,textPolicy:TEXT_POLICY});if(!reply?.reply.ok)throw Error('Не удалось продолжить. Попробуй ещё раз.');}
   if(scene==='channel'){
    if(session.snapshot.state.screenId==='blogger.channel.name')await existingAction('channel.fill-name-example');
    if(started===context&&session.snapshot.state.screenId==='blogger.channel.filled')await existingAction('channel.create');
   }else await existingAction(session.snapshot.state.screenId+'.publish-now');
  }catch(cause){error(cause.message);}finally{submitBusy=false;if(started===context)buttonsBusy(false);}
 }
 overlay.addEventListener('pointerdown',event=>{if(event.target.closest('[data-kdw-key]'))event.preventDefault();const b=event.target.closest('[data-product-spawn]');if(b&&!b.disabled){b.dataset.held='true';b.setPointerCapture(event.pointerId);}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])overlay.addEventListener(type,event=>{const b=event.target.closest('[data-product-spawn]');if(b)delete b.dataset.held;});
 const textInputs=createTextInputGuard(overlay,{selector:'[data-kdw-field]',fieldAttribute:'data-kdw-field',limits:CHANNEL_LIMITS,onEdit(input,result){if(draft){draft[input.dataset.kdwField]=result.value;changed();}},onRemoved(){clearTimeout(noticeTimer);noticeText=TEXT_REMOVED_NOTICE;overlay.querySelectorAll('[data-kdw-moderation],[data-kdw-moderation-keyboard]').forEach(e=>e.textContent=noticeText);noticeTimer=setTimeout(()=>{noticeText='';overlay.querySelectorAll('[data-kdw-moderation],[data-kdw-moderation-keyboard]').forEach(e=>e.textContent='');},2200);}});

 overlay.addEventListener('focusin',event=>{if(event.target.dataset.kdwField){activeField=event.target.dataset.kdwField;keyboardOpen=true;refreshKeyboard();}});
 overlay.addEventListener('keydown',event=>{if(event.isComposing)return;if(event.key==='Escape'&&scene==='channel'){event.preventDefault();event.stopPropagation();dismissKeyboard();}if(event.key==='Enter'&&event.target.name==='name'){event.preventDefault();editKey('enter');}});
 overlay.addEventListener('click',event=>{
  if(event.target.matches('[data-kdw-field]')){activeField=event.target.dataset.kdwField;keyboardOpen=true;refreshKeyboard();return;}
  const button=event.target.closest('button');if(!button||button.disabled||button.closest('[inert],[hidden]'))return;
  if(button.hasAttribute('data-kdw-menu')){if(submitBusy)return;void flush().then(()=>onMenu()).catch(cause=>error(cause.message));return;}
  if(button.hasAttribute('data-kdw-submit')){void act();return;}
  if(button.hasAttribute('data-kdw-image-retry')){storePhotos={key:'',status:'idle'};ensureStorePhotos();return;}
  if(button.hasAttribute('data-kdw-key')){editKey(button.dataset.kdwKey);return;}
  if(submitBusy)return;
  if(button.dataset.kdwAvatar){draft.avatar=button.dataset.kdwAvatar;overlay.querySelectorAll('[data-kdw-avatar]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));changed();return;}
  if(scene!=='store'||screenId!=='business.store.start')return;
  
  if(button.hasAttribute('data-kdw-remove')){activeSlot=Number(button.dataset.kdwRemove);storeMotion.cancel(activeSlot);draft.slots[activeSlot]=null;changed();refreshStore();return;}
  if(button.dataset.kdwProduct)void pickProduct(button);

 });
 function hide(){clearTimeout(noticeTimer);noticeText='';textInputs.reset();if(!scene)return;productStream.clear();if(scene==='store')fadeActivityOut(overlay);storeSignature='';storeMotion.clear();clearTimeout(saveTimer);scene=null;context='';dirty=false;submitBusy=false;overlay.hidden=true;overlay.replaceChildren();delete document.documentElement.dataset.kdwInteraction;delete document.documentElement.dataset.kdwStorePlaying;document.querySelector('#circles').inert=false;}
 return {
  flush,
  align(){alignChannel();alignStore();},
  update(next,phase){
   if(disposed)return;if(next===latestSnapshot&&phase===scenePhase)return;latestSnapshot=next;scenePhase=phase;productStream.accept(next);if(next?.state.progress.business?.answers?.businessType)ensureStorePhotos();const kind=currentScene(next,phase);if(!kind){hide();return;}
   const s=next.state,key=`${s.runId}:${s.taskId}`;
   if(key!==context){storeSignature='';productStream.reset();context=key;scene=kind;draft=structuredClone(s.progress[s.missionId]?.interactions?.[s.taskId]??emptyInteraction(kind));dirty=false;screenId=s.screenId;activeSlot=Math.max(0,draft.slots?.findIndex(id=>id===null)??0);activeField='name';keyboardOpen=false;redraw();overlay.hidden=false;document.documentElement.dataset.kdwInteraction=kind;document.querySelector('#circles').inert=false;if(scene==='channel')refreshKeyboard();}
   else if(screenId!==s.screenId){screenId=s.screenId;storeSignature='';redraw();}
   if(scene==='store')refreshStore();
   if(!deferAlignment){alignChannel();alignStore();}

  },
  dispose(){disposed=true;textInputs.dispose();hide();clearTimeout(saveTimer);window.removeEventListener('resize',resize);overlay.remove();},
 };
}
