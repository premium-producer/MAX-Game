import {mountAssetsEditor} from './assets-editor.mjs';
export const MODES=Object.freeze({standard:'Стандартная игра',background:'Только фон',assets:'Независимые ассеты'});
const REASONS=Object.freeze({
 REVISION_CONFLICT:'Настройки изменены другим оператором. Состояние обновлено — проверьте его и выберите режим снова.',
 STAND_BUSY:'Стенд занят текущим сценарием. Дождитесь его завершения и повторите переключение.',
 STATION_BUSY:'Стела занята текущим сценарием. Дождитесь его завершения и повторите переключение.',
 MAX_BUSY:'Сейчас идёт игра MAX. Дождитесь завершения игры и повторите переключение.',
 SHOW_MODE_ENABLED:'Включён сценарий «ID → ролики». Сначала выключите его в разделе ниже.',
 MAX_SHOW_MODE_ACTIVE:'Включён или ещё завершается сценарий «ID → ролики». Выключите его в разделе ниже и дождитесь завершения.',
 MODE_NOT_SUPPORTED:'Этот режим пока не поддерживается.',
 MAX_PRESENTATION_BACKGROUND:'Выбран режим «Только фон». Для запуска игры переключитесь в стандартный режим.',
 MAX_PRESENTATION_PENDING:'Проигрыватель ещё применяет режим. Дождитесь его подтверждения.',
 SHOW_ACTIVE:'Сейчас выполняется сценарий «ID → ролики». Дождитесь его завершения.',
 RENDERER_UNAVAILABLE:'Нет подтверждения от проигрывателя MAX_RIGHT. Проверьте подключение.',
 UNAVAILABLE:'Управление MAX сейчас недоступно.',
 INVALID_MODE:'Этот режим пока не поддерживается.',
 ASSET_NOT_FOUND:'Ассет отсутствует в доступном каталоге. Выберите другой.',
 DEVICE_ASSET_REQUIRED:'Сначала выберите ассет устройства.',
 ASSETS_SETTINGS_INVALID:'Проверьте настройки сцены: ассет устройства и не более 8 иконок.',
 DEVICE_ASSET_UNKNOWN:'Ассет устройства отсутствует в каталоге. Обновите каталог и выберите другой.',
 ICON_ASSET_UNKNOWN:'Иконка отсутствует в каталоге. Обновите каталог и выберите другую.',
 ASSET_CATALOG_UNAVAILABLE:'Каталог ассетов недоступен. Повторите загрузку каталога.',
 MAX_PRESENTATION_ASSETS:'Выбран режим независимых ассетов. Для запуска игры переключитесь в стандартный режим.',
 REQUEST_TOO_LARGE:'Команда отклонена: слишком большой объём настроек. Исправьте сцену и примените её снова.',
 REQUEST_VALIDATION_FAILED:'Команда отклонена: настройки не прошли проверку. Проверьте сцену и примените её снова.',
});
export function reasonText(code){return REASONS[code]||`Команда отклонена${code?': '+code:'.'}`;}
export async function presentationResponse(response,method='POST'){
 // Validation responses guarantee that the command was rejected. They must
 // not trap the operator in retries of the same invalid payload.
 if(method==='POST'&&!response.ok&&[413,422].includes(response.status))return {accepted:false,reason:response.status===413?'REQUEST_TOO_LARGE':'REQUEST_VALIDATION_FAILED'};
 const value=await response.json();
 if(!response.ok&&!(response.status===409&&value.accepted===false))throw Error(value.error||`HTTP ${response.status}`);
 return value;
}
export function describeState(state){
 if(!state)return {desired:'Нет данных',effective:'Нет подтверждения',phase:'Нет связи',ack:'Подтверждений ещё нет'};
 return {
  desired:MODES[state.desiredMode]||'Неизвестный режим',
  effective:MODES[state.effectiveMode]||'Нет подтверждения',
  phase:state.phase==='active'?'Последнее применение подтверждено проигрывателем':state.phase==='pending'?'Ожидаем применения проигрывателем':`Состояние: ${state.phase||'неизвестно'}`,
  ack:Number.isSafeInteger(state.lastAckAt)&&state.lastAckAt>0?`Последнее подтверждение: ${new Date(state.lastAckAt).toLocaleString('ru-RU')}`:'Подтверждений ещё нет',
 };
}
// A controller owns request ordering. A failed POST remains retryable with its
// original id; no preference is applied automatically after opening the panel.
export function createPresentationControl({request,newId,onChange=()=>{},readPending=()=>null,writePending=()=>{}}){
 let state=null,busy=false,pending=null,error='',notice='',readSequence=0;
 try{const saved=readPending();if(saved&&typeof saved.commandId==='string'&&Number.isSafeInteger(saved.expectedRevision)&&(Object.hasOwn(MODES,saved.mode)||saved.assetsSettings&&typeof saved.assetsSettings==='object'))pending=saved;}catch{}
 const snapshot=()=>({state,busy,pending,error,notice});
 const emit=()=>onChange(snapshot());
 function savePending(value){pending=value;try{writePending(value);}catch{}}
 async function refresh(){
  const sequence=++readSequence;
  try{const value=await request('GET');if(sequence!==readSequence)return;state=value.state||value;error='';}
  catch(e){if(sequence!==readSequence)return;state=null;error='Нет связи с управлением MAX: '+e.message;}
  emit();
 }
 async function submit(payload,retry=false){
  if(busy||(!retry&&(!state||pending))||retry&&!pending)return;
  busy=true;error='';notice='Отправляем команду…';++readSequence;
  if(!retry)savePending({commandId:newId(),expectedRevision:state.revision,...payload});
  emit();
  let result;
  try{
   const settings=Object.hasOwn(pending,'assetsSettings');
   result=await request('POST',pending,settings?'settings':'mode');
   if(typeof result.accepted!=='boolean')throw Error('Некорректное подтверждение команды');
   savePending(null);
   if(result.state)state=result.state;
   notice=result.accepted?(settings&&state?.desiredMode!=='assets'?'Сцена сохранена. Для показа выберите режим «Независимые ассеты».':'Команда принята. Ожидаем подтверждения проигрывателя.'):reasonText(result.reason);
  }catch(e){notice='Результат команды неизвестен. Обновите состояние или повторите ту же команду.';error=e.message;}
  finally{busy=false;await refresh();}
  return result;
 }
 return {refresh,select:mode=>Object.hasOwn(MODES,mode)?submit({mode}):Promise.resolve(),configureSettings:(assetsSettings,expectedRevision=state?.revision)=>submit({assetsSettings,expectedRevision}),retry:()=>submit(null,true),snapshot};
}

export function mountPresentationControl({root,getCsrf,fetchImpl=fetch,storage=sessionStorage}){
 const el=id=>root.querySelector('#'+id);
 let assetsEditor;
 const controller=createPresentationControl({
  newId:()=>crypto.randomUUID(),
  readPending:()=>JSON.parse(storage.getItem('max-presentation-command')||'null'),
  writePending:value=>value?storage.setItem('max-presentation-command',JSON.stringify(value)):storage.removeItem('max-presentation-command'),
  request:async(method,data,kind)=>{
   if(method==='POST'&&!getCsrf())throw Error('Дождитесь подключения панели к мастеру');
   const response=await fetchImpl('/fleet/v1/max-presentation'+(method==='POST'&&kind==='settings'?'/settings':''),method==='POST'?{method,headers:{'Content-Type':'application/json','X-Fleet-CSRF':getCsrf()},body:JSON.stringify(data),signal:AbortSignal.timeout(6000)}:{signal:AbortSignal.timeout(6000)});
   return presentationResponse(response,method);
  },
  onChange:view=>{
   const desc=describeState(view.state);
   el('presentation-desired').textContent=desc.desired;
   el('presentation-effective').textContent=desc.effective;
   el('presentation-phase').textContent=desc.phase;
   el('presentation-ack').textContent=desc.ack;
   el('presentation-notice').textContent=[view.notice,view.error].filter(Boolean).join(' ');
   el('presentation-detail').textContent=view.state?`Ревизия ${view.state.revision} · поколение режима ${view.state.modeEpoch}${view.state.lastError?' · ошибка: '+view.state.lastError:''}`:'';
   for(const mode of Object.keys(MODES)){
    const button=el('presentation-'+mode);
    button.disabled=view.busy||!view.state||!!view.pending||!getCsrf()||view.state.desiredMode===mode;
    button.setAttribute('aria-pressed',String(view.state?.desiredMode===mode));
   }
   el('presentation-refresh').disabled=view.busy;
   el('presentation-retry').hidden=!view.pending;el('presentation-retry').disabled=view.busy||!getCsrf();
   assetsEditor?.update(view);
  },
 });
 for(const mode of Object.keys(MODES))el('presentation-'+mode).onclick=()=>void controller.select(mode);
 el('presentation-refresh').onclick=()=>void controller.refresh();
 el('presentation-retry').onclick=()=>void controller.retry();
 assetsEditor=mountAssetsEditor({root,controller,getCsrf,fetchImpl});
 void controller.refresh();
 const timer=setInterval(()=>{if(!controller.snapshot().busy)void controller.refresh();},1500);
 return {controller,destroy:()=>{clearInterval(timer);assetsEditor.destroy();}};
}
