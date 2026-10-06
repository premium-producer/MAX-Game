import {mountSelectedAutoplay} from './selected-autoplay.mjs';
import {mountRenderOutputPanel} from './render-output-panel.js';
import {mountPresentationControl} from './presentation-control.mjs';
let state,csrf;
const $=s=>document.querySelector(s),message=t=>$('#message').textContent=t;
const labels={connected:'Последняя проверка успешна',unavailable:'Недоступен / доверие не подтверждено','not-checked':'Не проверено',ready:'Готов','not-integrated':'Не подключено'};
function text(tag,value,parent){const e=document.createElement(tag);e.textContent=value;parent.append(e);return e;}
async function call(route,data){const r=await fetch(route,data?{method:'POST',headers:{'Content-Type':'application/json','X-Fleet-CSRF':csrf},body:JSON.stringify(data)}:{});const v=await r.json();if(!r.ok)throw Error(v.error||'Ошибка запроса');return v;}
function render(){
  $('#summary').textContent=`Выпуск ${state.releaseId} · связь ${state.connectivityPolicy} · ревизия ${state.revision}`;
  if(state.lanAccess?.enabled){const link=document.createElement('a');link.href=state.lanAccess.url;link.textContent=' · Панель с телефона или другого ПК: '+state.lanAccess.url;$('#summary').append(link);}
  const root=$('#nodes');root.replaceChildren();
  for(const n of state.nodes){
    const card=document.createElement('article');root.append(card);text('h2',n.role,card);
    const form=document.createElement('form');form.className='fields';card.append(form);
    const hostLabel=text('label','IP',form),host=document.createElement('input');host.value=n.host;host.required=true;host.setAttribute('aria-label',`IP ${n.role}`);hostLabel.append(host);
    const portLabel=text('label','Порт',form),port=document.createElement('input');port.type='number';port.min='1024';port.max='65535';port.value=n.port;port.setAttribute('aria-label',`Порт ${n.role}`);portLabel.append(port);
    const save=text('button','Сохранить адрес',form);save.type='submit';
    const status=text('p',labels[n.status]||n.status,card);if(n.error)status.textContent+=' · '+n.error;
    if(n.checkedAt)text('p','Проверено: '+new Date(n.checkedAt).toLocaleString('ru-RU'),card);
    const dl=document.createElement('dl');card.append(dl);
    for(const [key,val] of Object.entries(n.readiness||{})){text('dt',key,dl);text('dd',labels[val]||val,dl);}
    form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{state=await call(`/fleet/v1/nodes/${n.nodeId}/address`,{host:host.value.trim(),port:Number(port.value),expectedRevision:state.revision});render();message('Адрес сохранён. Нажмите «Проверить подключения».');}catch(e){message(e.message);}finally{save.disabled=false;}};
  }
}
async function init(){state=await call('/fleet/v1/state');csrf=state.csrf;render();mountRenderOutputPanel(document.querySelector('#render-output'),{call,csrf,onError:e=>message(e.message)});}
$('#check').onclick=async()=>{$('#check').disabled=true;message('Проверка доверенных узлов…');try{state=await call('/fleet/v1/check',{});render();message('Проверка завершена. Готовность узла не подтверждает физический вывод.');}catch(e){message(e.message);}finally{$('#check').disabled=false;}};
init().catch(e=>message(e.message));

let show,showBusy=false,showPending=null,showSpeedDirty=false,showSpeedRevision=null;
try{showPending=JSON.parse(sessionStorage.getItem('max-show-command')||'null');}catch{}
async function refreshShow(){
 try{show=await call('/fleet/v1/max-show');$('#show-state').textContent=(show.enabled?'Режим включён':'Режим выключен')+(show.run?' · '+show.run.phase+' · '+show.run.gamePhase+' · текущий запуск: '+((show.run.screenDelayMs??1000)/1000)+' с/экран':'');if(!showSpeedDirty)$('#show-speed').value=String((show.screenDelayMs??1000)/1000);}
 catch(e){show=null;$('#show-state').textContent='Нет связи с мастером: '+e.message;}
 $('#show-on').disabled=showBusy||!show||show.enabled||!!showPending;$('#show-off').disabled=showBusy||!show||!show.enabled||!!showPending;$('#show-retry').hidden=!showPending;$('#show-retry').disabled=showBusy;$('#show-speed').disabled=showBusy||!show||!!showPending;$('#show-speed-save').disabled=showBusy||!show||!!showPending;
}
async function setShow(enabled,retry=false,screenDelayMs){
 if(showBusy||!csrf||(!retry&&(!show||showPending)))return;showBusy=true;
 if(!retry){showPending={commandId:crypto.randomUUID(),expectedRevision:screenDelayMs===undefined?show.revision:(showSpeedRevision??show.revision),enabled,...(screenDelayMs===undefined?{}:{screenDelayMs})};sessionStorage.setItem('max-show-command',JSON.stringify(showPending));}
 try{const response=await fetch('/fleet/v1/max-show',{method:'POST',headers:{'Content-Type':'application/json','X-Fleet-CSRF':csrf},body:JSON.stringify(showPending),signal:AbortSignal.timeout(6000)});const result=await response.json();if(!response.ok&&!(response.status===409&&result.accepted===false))throw Error(result.error||'Ошибка запроса');showPending=null;sessionStorage.removeItem('max-show-command');if(result.accepted&&screenDelayMs!==undefined||result.accepted&&retry){showSpeedDirty=false;showSpeedRevision=null;}message(result.accepted?'Настройки MAX сохранены':result.reason==='REVISION_CONFLICT'?'Настройки изменены другим оператором. Проверьте состояние и сохраните ещё раз.':result.reason||'Команда отклонена');if(result.reason==='REVISION_CONFLICT')showSpeedRevision=null;}
 catch(e){message('Команда не подтверждена: '+e.message);}
 finally{showBusy=false;await refreshShow();}
}
$('#show-on').onclick=()=>setShow(true);$('#show-off').onclick=()=>setShow(false);$('#show-retry').onclick=()=>setShow(false,true);
$('#show-speed').oninput=()=>{if(!showSpeedDirty)showSpeedRevision=show?.revision??null;showSpeedDirty=true;};
$('#show-speed-form').onsubmit=event=>{event.preventDefault();const input=$('#show-speed');if(!input.reportValidity())return;const delay=Math.round(input.valueAsNumber*1000);if(!Number.isInteger(delay)||delay<500||delay>10000||delay%100!==0)return;void setShow(show.enabled,false,delay);};
refreshShow();setInterval(()=>{if(!showBusy)void refreshShow();},1500);
mountPresentationControl({root:document,getCsrf:()=>csrf});

mountSelectedAutoplay({root:document,getCsrf:()=>csrf});
