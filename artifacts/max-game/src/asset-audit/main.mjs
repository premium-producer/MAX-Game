import {createImageAnnotator} from '@annotorious/annotorious';
import '@annotorious/annotorious/annotorious.css';
import {openDB} from 'idb';
import {entriesOf,rectAt,clampRect} from './model.mjs';
import {validateFlowDocument} from './flow-document.mjs';
import {readEditorDocument,findFlowScreen,newInteraction,deleteInteraction,importEditorDocument,recoveryConfirmation} from './editor-model.mjs';
import {mergeFlowDocuments} from './collaboration.mjs';
import {sameDocument,acknowledgeSave,undoLocalEdit,recoveryKey,pollReceiptIsCurrent} from './collaboration-client.mjs';
import {createCardLeaseClient} from './card-lock-client.mjs';

const $=id=>document.getElementById(id),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const apiBase=document.querySelector('meta[name="max-audit-api"]')?.content||'/api/';
const api=name=>new URL(name,new URL(apiBase,location.href)).href;
let catalog,entries,flow,recoveryDb,recoveryDocument,recoveryBaseRevision,history=[],active,selectedId,anno,epoch=0,placing=null,syncing=false;
let serverRevision,csrf,dirty=false,saving=false,conflict=false,version=0,retries=0,retryTimer,saveTimer,cachePending=Promise.resolve();
let baseDocument,replaceMode=false,conflictState,polling=false,pollTimer,pointerHeld=false,remotePending=false,repaintPending=false,renderedRects=new Map();
// Duplicate-tab copies sessionStorage; a new page lifetime always writes its own recovery key.
const clientId=crypto.randomUUID();let previousClientId;try{previousClientId=sessionStorage.getItem('max-flow-client');sessionStorage.setItem('max-flow-client',clientId);}catch{/* This page still has an isolated recovery key. */}
let img=$('editor-image'),exportUrl;
let cardLocks=new Map(),locksReady=false,locksPolling=false,locksTimer,opening=false,writeBlocked=false,saveFlight;
const dialog=$('editor'),screenNow=()=>active&&findFlowScreen(flow,active.screen.screenId),taskNow=()=>active&&flow.tasks.find(t=>t.taskId===active.task.taskId);
const editorConflictButton=$('open-conflict').cloneNode(true);editorConflictButton.id='editor-open-conflict';$('editor-save').after(editorConflictButton);
const actionNow=()=>screenNow()?.interactions.find(i=>i.interactionId===selectedId);
const snapshot=()=>structuredClone(flow);
const lease=createCardLeaseClient({request:lockRequest,onChange:()=>{if(flow){updateCards();refreshEditor();}},onLost:message=>{writeBlocked=true;clearTimeout(saveTimer);clearTimeout(retryTimer);cacheDraft();$('lease-status').textContent=message;saveStatus(message,true);refreshEditor();}});
async function lockRequest(body){
 if(!csrf)csrf=(await requestJson(api('state'))).csrf;
 try{return await requestJson(api('max-asset-locks'),{method:'POST',headers:{'Content-Type':'application/json','X-VK-Token':csrf,'X-MAX-Editor-Id':clientId},body:JSON.stringify(body)});}
 catch(error){if(error.status===403)csrf=null;throw error;}
}
async function pollLocks(){
 clearTimeout(locksTimer);if(locksPolling)return;locksPolling=true;
 try{const result=await requestJson(api('max-asset-locks'),{headers:{'X-MAX-Editor-Id':clientId}});cardLocks=new Map(result.locks.map(lock=>[lock.screenId,lock]));locksReady=true;}
 catch{locksReady=false;}
 finally{locksPolling=false;updateCards();if(!document.hidden)locksTimer=setTimeout(pollLocks,2000);}
}
function paintCardLocks(){
 for(const card of document.querySelectorAll('[data-entry]')){const entry=entries[Number(card.dataset.entry)],held=cardLocks.get(entry.screen.screenId),busy=Boolean(held&&!held.owned);card.classList.toggle('editing-locked',busy);card.querySelector('.card-lock').textContent=busy?'СЕЙЧАС РЕДАКТИРУЕТСЯ':held?.owned?'ОТКРЫТО У ВАС':!locksReady?'Проверка доступности…':'';for(const button of card.querySelectorAll('button'))button.disabled=busy||!locksReady||opening;}
}
function status(message,error=false){for(const id of ['status','editor-save']){$(id).textContent=message;$(id).classList.toggle('error',error);}}
function imageStatus(message,error=false){$('image-status').textContent=message;$('image-status').hidden=!message;$('image-status').classList.toggle('error',error);}
function saveStatus(message,error=false){status(message,error);$('retry-save').hidden=!error||conflict;}
async function requestJson(url,options){const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000),...options});let value;try{value=await response.json();}catch{value={};}if(!response.ok){const error=Error(value.error||`HTTP ${response.status}`);error.status=response.status;error.payload=value;throw error;}return value;}
function cacheDraft(){const value={baseRevision:serverRevision,baseDocument,savedAt:Date.now(),dirty,document:snapshot()};cachePending=cachePending.then(async()=>{try{await recoveryDb?.put('drafts',value,recoveryKey(catalog.contentRevision,clientId));}catch{/* Export and server persistence remain available. */}});}
function validateRoutes(){try{validateFlowDocument(flow,catalog,{publish:true});$('validation-status').textContent='Маршруты прошли структурную проверку. Черновик ещё не применён к игре.';}catch(error){$('validation-status').textContent='Черновик сохранится. Перед применением к игре исправьте: '+error.message;}}
function queueSave(){dirty=true;version++;retries=0;cacheDraft();updateCards();validateRoutes();clearTimeout(saveTimer);clearTimeout(retryTimer);retryTimer=null;if(!conflict)saveTimer=setTimeout(flush,350);status('Есть изменения — сохраняем…');}
function edit(mutator,{structural=false}={}){
 if(!flow||serverRevision===undefined||conflict||writeBlocked||(active&&!lease.valid()))return;
 const before=snapshot();
 try{mutator();validateFlowDocument(flow,catalog);if(sameDocument(before,flow))return false;history.push({before,after:snapshot()});if(history.length>100)history.shift();queueSave();if(structural)refreshEditor();return true;}
 catch(error){flow=before;refreshEditor();status('Изменение отменено: '+error.message,true);}
}
const interactionBusy=()=>pointerHeld||Boolean(document.activeElement?.matches('input,textarea,select'));
function repaintShared(){
 updateCards();validateRoutes();
 if(active&&selectedId&&!actionNow()){
  // A receipt may remove the action whose stale form is still focused. Do not let
  // subsequent keystrokes silently disappear or edit the next action in the list.
  if($('interaction-fields').contains(document.activeElement))document.activeElement.blur();
  selectedId=undefined;placing=null;imageStatus('Выбранное действие удалено другим участником. Выберите другое действие в списке.');
 }
 if(interactionBusy()){repaintPending=true;return;}repaintPending=false;if(active){syncAnnotations();refreshEditor();}
}
function waitForPointer(){return new Promise(resolve=>{const check=()=>{if(!pointerHeld)resolve();else setTimeout(check,40);};check();});}
function conflictValue(value){
 if(value===null||value===undefined)return 'Удалено / не задано';
 if(typeof value==='boolean')return value?'Включено':'Выключено';
 if(typeof value!=='object')return String(value).slice(0,300);
 if(value.interactions)return value.deleted?'Действие удалено':value.interactions.map(conflictValue).join('; ');
 if(value.mode)return `${value.mode==='hide'?'Скрыть справку':value.mode==='inherit'?'Наследовать справку':'Свой текст'}${value.text?' · '+value.text.slice(0,250):''}`;
 return [value.name||value.label,value.enabled===false?'Выключено':value.enabled===true?'Включено':null,value.kind==='timer'?`${value.delayMs/1000} с`:null,value.rect?'Область: '+value.rect.map(Math.round).join(', '):null,value.target?targetLabel(value.target):null].filter(Boolean).join(' · ')||'Настройка изменена';
}
function showConflict(state,items){
 conflict=true;conflictState=state;clearTimeout(saveTimer);clearTimeout(retryTimer);
 $('conflict-items').replaceChildren(...items.map(item=>{const li=document.createElement('li'),title=document.createElement('strong');title.textContent=item.label||item.key||String(item);li.append(title);if(Object.hasOwn(item,'local')){for(const [label,value] of [['Моя версия',item.local],['Общая версия',item.remote]]){const p=document.createElement('p');p.textContent=label+': '+conflictValue(value);li.append(p);}}return li;}));
 $('conflict-message').textContent=state.replace?'Полная замена не выполнена: общая версия уже изменилась. Можно явно повторить замену либо принять общую версию. Ваша копия доступна для скачивания.':'Одно и то же действие изменили одновременно. Остальные изменения команды уже объединены с вашими. Выберите, какую версию спорных действий оставить.';
 $('conflict-local').textContent=state.replace?'Заменить общей версией из моей копии':'Оставить мои спорные изменения';
 $('conflict-remote').textContent=state.replace?'Принять общую версию':'Принять общие спорные изменения';
 saveStatus('Конфликт совместного редактирования — требуется ваш выбор.',true);refreshEditor();updateCards();
 $('open-conflict').hidden=false;editorConflictButton.hidden=false;if(!$('conflict-box').open)$('conflict-box').showModal();cacheDraft();
}
function mergeRemote(remote,revision){
 const previousBase=baseDocument,local=snapshot();
 if(replaceMode&&dirty){showConflict({base:previousBase,local:snapshot(),remote,revision,replace:true},[{label:'Замена полного документа'}]);return;}
 const result=mergeFlowDocuments(previousBase,flow,remote);flow=result.document;baseDocument=remote;serverRevision=revision;dirty=!sameDocument(flow,remote);cacheDraft();repaintShared();
 if(result.conflicts.length)showConflict({base:previousBase,local,remote,revision},result.conflicts);
 else if(dirty){saveStatus('Изменения команды получены; сохраняем ваши…');clearTimeout(saveTimer);saveTimer=setTimeout(flush,100);}
 else saveStatus('Общая версия синхронизирована');
}
async function pollShared(){
 clearTimeout(pollTimer);
 if(polling)return;
 if(document.hidden||saving||conflict||writeBlocked||serverRevision===undefined||replaceMode){if(!document.hidden)pollTimer=setTimeout(pollShared,2000);return;}
 if(interactionBusy()){remotePending=true;pollTimer=setTimeout(pollShared,2000);return;}
 polling=true;const requestedRevision=serverRevision;
 try{
  const server=await requestJson(api('max-asset-flow'));
  if(!pollReceiptIsCurrent(requestedRevision,serverRevision))return;
  if(typeof server.revision!=='string')throw Error('Сервер не вернул версию');
  if(server.revision!==serverRevision){if(saving||conflict||interactionBusy()||replaceMode){remotePending=true;return;}mergeRemote(readEditorDocument(server,catalog),server.revision);}
  else if(!dirty)saveStatus('Общая версия синхронизирована');
  else if(!retryTimer&&!saving){clearTimeout(saveTimer);saveTimer=setTimeout(flush,100);}
  remotePending=false;
 }catch(error){if(!conflict)saveStatus('Нет связи с сервером. Ваши изменения остаются в этой вкладке; подключение повторится автоматически.',true);}
 finally{polling=false;if(!document.hidden)pollTimer=setTimeout(pollShared,2000);}
}
async function flush(){
 if(saveFlight)return saveFlight;
 saveFlight=performFlush();try{return await saveFlight;}finally{saveFlight=null;}
}
async function performFlush(){
 if(saving||!dirty||conflict||writeBlocked||serverRevision===undefined||(active&&!lease.valid()))return;
 saving=true;updateCards();saveStatus('Сохраняем изменения в общей версии…');
 try{while(dirty&&!conflict&&!writeBlocked&&(!active||lease.valid())){
  const document=validateFlowDocument(snapshot(),catalog),sentBase=structuredClone(baseDocument),sentReplace=replaceMode;
  if(!csrf)csrf=(await requestJson(api('state'))).csrf;
  if(!csrf)throw Error('Нет авторизации сервера');
  if(active&&!lease.valid()){lease.lose('Доступ к карточке истёк до отправки. Скачайте копию и откройте карточку заново.');return;}
  const result=await requestJson(api(sentReplace?'max-asset-flow':'max-asset-flow/merge'),{method:'POST',headers:{'Content-Type':'application/json','X-VK-Token':csrf,'X-MAX-Editor-Id':clientId,...lease.headers()},body:JSON.stringify(sentReplace?{expectedRevision:serverRevision,document}:{baseDocument:sentBase,document})});
  if(typeof result.revision!=='string')throw Error('Сервер не подтвердил версию');
  const acknowledged=readEditorDocument(result,catalog);
  // A completed receipt never blocks subsequent text autosaves. Only active geometry waits for pointer-up.
  if(pointerHeld)await waitForPointer();
  const current=snapshot(),rebased=acknowledgeSave(document,current,acknowledged);
  flow=rebased.document;baseDocument=acknowledged;serverRevision=result.revision;dirty=rebased.dirty;replaceMode=false;cacheDraft();repaintShared();
  if(rebased.conflicts.length)showConflict({base:document,local:current,remote:acknowledged,revision:result.revision},rebased.conflicts);
 }retries=0;if(!conflict&&!writeBlocked&&!dirty)saveStatus('Общая версия синхронизирована');}
 catch(error){if(error.status===409){
  try{const latest=error.payload?.currentDocument||await requestJson(api('max-asset-flow'));if(pointerHeld)await waitForPointer();const localBefore=snapshot(),remote=readEditorDocument(latest,catalog);mergeRemote(remote,latest.revision);
   if(!conflict){flow=localBefore;showConflict({base:baseDocument,local:localBefore,remote,revision:latest.revision,replace:true},error.payload?.conflicts?.length?error.payload.conflicts:[{label:error.message}]);}
  }catch(readError){saveStatus('Не удалось получить общую версию: '+readError.message+'. Ваша копия сохранена в браузере.',true);}
 }else if(error.status===423){writeBlocked=true;cacheDraft();saveStatus('Карточка занята или доступ истёк. Изменения остались в локальной копии. Закройте карточку; повторите сохранение, когда она освободится.',true);if(error.payload?.code==='CARD_LEASE_LOST')lease.lose('Доступ к карточке истёк. Скачайте копию и откройте карточку заново.');pollLocks();}
 else{if(error.status===403)csrf=null;saveStatus('Нет связи или сохранение отклонено: '+error.message+'. Ваши изменения сохранены в этой вкладке.',true);retryTimer=setTimeout(()=>{retryTimer=null;flush();},Math.min(30000,3000*2**Math.min(retries++,3)));}}
 finally{saving=false;updateCards();}
}
function targetLabel(target){if(target?.kind==='complete-task')return 'Завершить задание';if(!target)return 'Назначение не задано';const entry=entries.find(e=>e.screen.screenId===target.screenId);return entry?'Экран '+entry.screen.order:target.screenId;}
const kindLabel=i=>i.kind==='hotspot'?'Зона':i.kind==='button'?'Кнопка':'Автопереход';
const nameOf=i=>i.name||i.label||'Автопереход';
function updateCards(){if(!flow)return;let done=0;
 for(const card of document.querySelectorAll('[data-entry]')){
  const e=entries[Number(card.dataset.entry)],s=findFlowScreen(flow,e.screen.screenId),count=s.interactions.filter(i=>i.enabled).length;
  if(count)done++;card.dataset.reviewed=String(count>0);card.dataset.enabled=String(s.enabled);card.dataset.final=String(s.final);card.classList.toggle('reviewed',count>0);card.classList.toggle('inactive',!s.enabled);
  card.querySelector('.screen-state').textContent=!s.enabled?'Экран отключён':s.final?'Финальный экран задания':'Активный экран';
  card.querySelector('.state').textContent=count+' активных действий / '+s.interactions.length+' всего';
  card.querySelector('.action-summary').innerHTML=s.interactions.map(i=>`<div>${i.enabled?'●':'○'} ${esc(kindLabel(i))}: ${esc(nameOf(i))} → ${esc(targetLabel(i.target))}</div>`).join('');
 }$('progress').textContent=`${done} / ${entries.length} экранов с переходами`;$('undo').disabled=!history.length||conflict||saving||writeBlocked;$('import').disabled=conflict||saving||writeBlocked;$('restore-recovery').disabled=conflict||saving||writeBlocked;paintCardLocks();applyFilter();
}
function applyFilter(){const value=$('filter').value;for(const card of document.querySelectorAll('.card'))card.hidden=value==='pending'?card.dataset.reviewed==='true':value==='reviewed'?card.dataset.reviewed!=='true':value==='inactive'?card.dataset.enabled!=='false':value==='final'?card.dataset.final!=='true':false;for(const group of document.querySelectorAll('.task,.mission'))group.hidden=!group.querySelector('.card:not([hidden])');}
function keepInput(id,value){if(document.activeElement!==$(id))$(id).value=value;}
function refreshEditor(){
 if(!active||!flow)return;const s=screenNow(),a=actionNow();
 $('edit-controls').disabled=serverRevision===undefined||conflict||writeBlocked||!lease.valid();
 if(!lease.valid()||writeBlocked)$('stage').inert=true;
 $('interaction-list').innerHTML=s.interactions.map(i=>`<div class="interaction-row ${i.interactionId===selectedId?'selected':''} ${i.enabled?'':'off'}"><input type="checkbox" aria-label="Включить ${esc(nameOf(i))}" data-enabled="${esc(i.interactionId)}" ${i.enabled?'checked':''}><button type="button" data-select="${esc(i.interactionId)}">${esc(kindLabel(i))} · ${esc(nameOf(i))}<small>${esc(targetLabel(i.target))}${i.kind==='timer'?' · '+i.delayMs/1000+' с':''}</small></button></div>`).join('');
 $('add-hotspot').disabled=!anno;$('add-timer').disabled=s.interactions.some(i=>i.kind==='timer');
 $('screen-enabled').checked=s.enabled;$('screen-final').checked=s.final;$('screen-final').disabled=!s.enabled;
 $('interaction-fields').hidden=!a;$('cancel-place').hidden=!placing;
 $('placement-hint').textContent=placing?'Нажмите на нужное место изображения. Старые зоны сохранятся до нового щелчка.':'Все зоны видны на изображении. Выберите рамку или действие в списке, чтобы изменить его.';
 $('stage').classList.toggle('placing',Boolean(placing));
 if(a){
  $('interaction-name-label').textContent=a.kind==='button'?'Текст кнопки':'Название действия';keepInput('interaction-name',nameOf(a));$('interaction-name').maxLength=a.kind==='button'?2000:500;
  $('target').innerHTML='<option value="">Выберите назначение</option>'+active.task.screens.map(source=>{const f=findFlowScreen(flow,source.screenId);return `<option value="${esc(source.screenId)}">Экран ${source.order}${f.enabled?'':' · отключён'} · ${esc(source.screenId)}</option>`;}).join('')+'<option value="@complete">Завершить задание</option>';
  $('target').value=a.target?.kind==='complete-task'?'@complete':a.target?.screenId||'';$('target').disabled=Boolean(a.semanticRef);
  $('semantic-note').hidden=!a.semanticRef;$('semantic-note').textContent='У этого действия есть проверка ответа или другой игровой эффект. Назначение закреплено исходным сценарием; его изменение требует отдельной проверки backend.';
  $('delay-label').hidden=a.kind!=='timer';keepInput('delay',a.delayMs/1000);$('coordinates').textContent=a.kind==='hotspot'?'Область в исходных пикселях: '+a.rect.map(Math.round).join(' · '):'';
  $('place').hidden=a.kind!=='hotspot';$('place').disabled=!anno;$('show-action').hidden=a.kind!=='hotspot';$('show-action').disabled=!anno;
 }
 keepInput('help-mode',s.help.mode);keepInput('screen-help',s.help.text);$('screen-help').hidden=s.help.mode!=='override';keepInput('task-help',taskNow().helpText||'');keepInput('mission-help',flow.missions.find(m=>m.missionId===active.mission.missionId).helpText||'');
 const buttons=s.interactions.filter(i=>i.kind==='button').sort((a,b)=>a.order-b.order);$('outside-preview').hidden=!buttons.length;$('outside-preview').innerHTML=buttons.map(i=>`<span class="${i.enabled?'':'disabled'}">${esc(i.label)}</span>`).join('');
}
function annotationOf(i){const [x,y,w,h]=i.rect;return {id:i.interactionId,bodies:[],target:{annotation:i.interactionId,selector:{type:'RECTANGLE',geometry:{x,y,w,h,bounds:{minX:x,minY:y,maxX:x+w,maxY:y+h}}}}};}
function syncAnnotations({initial=false}={}){
 if(!anno||!active)return;syncing=true;
 try{const wanted=screenNow().interactions.filter(i=>i.kind==='hotspot'),current=new Map(anno.getAnnotations().map(a=>[a.id,a]));
 if(initial)anno.setAnnotations(wanted.map(annotationOf),true);
 else{for(const a of current.values())if(!wanted.some(i=>i.interactionId===a.id))anno.removeAnnotation(a.id);for(const i of wanted){const next=annotationOf(i),old=current.get(i.interactionId);if(!old)anno.addAnnotation(next);else if(JSON.stringify(old.target.selector.geometry)!==JSON.stringify(next.target.selector.geometry))anno.updateAnnotation(next);}}
 if(actionNow()?.kind==='hotspot')anno.setSelected(selectedId,true);
 renderedRects=new Map(wanted.map(i=>[i.interactionId,[...i.rect]]));
 }finally{syncing=false;}
 refreshEditor();
}
function captureEdit(){
 if(syncing||!anno||!active)return;const changes=[];
 for(const annotation of anno.getAnnotations()){
  const i=screenNow().interactions.find(i=>i.interactionId===annotation.id);if(i?.kind!=='hotspot')continue;
  const g=annotation.target.selector.geometry,r=clampRect([g.x,g.y,g.w,g.h],active.screen.asset);
  const shown=renderedRects.get(i.interactionId);
  if(shown&&!shown.every((v,index)=>Math.abs(v-r[index])<.02))changes.push([i.interactionId,r]);
 }
 if(changes.length){edit(()=>{for(const [id,rect] of changes)screenNow().interactions.find(i=>i.interactionId===id).rect=rect;});syncAnnotations();}
}
function destroyEditor(){captureEdit();if(anno){anno.destroy();anno=null;}renderedRects.clear();epoch++;active=null;placing=null;}
async function renderEditor(index){
 destroyEditor();active=entries[index];const ticket=epoch,{mission,task,screen}=active;selectedId=screenNow().interactions[0]?.interactionId;
 $('editor-path').textContent=`${mission.title} / ${task.title}`;$('editor-title').textContent=`Экран ${screen.order} из ${task.screens.length}`;$('prev').disabled=index===0;$('next').disabled=index===entries.length-1;
 if(!dialog.open)dialog.showModal();
 const image=new Image();image.id='editor-image';image.alt=`${task.title}, экран ${screen.order}`;image.src=screen.asset.url;img.hidden=true;imageStatus('Загрузка изображения…');$('stage').inert=true;refreshEditor();
 try{await image.decode();if(ticket!==epoch)return;
  if(image.naturalWidth!==screen.asset.width||image.naturalHeight!==screen.asset.height)throw Error(`Размер изображения не совпадает с каталогом: ${image.naturalWidth} × ${image.naturalHeight}, ожидается ${screen.asset.width} × ${screen.asset.height}`);
  img.replaceWith(image);img=image;
  anno=createImageAnnotator(img,{drawingEnabled:false,autoSave:true,userSelectAction:'EDIT',style:annotation=>{const i=screenNow()?.interactions.find(i=>i.interactionId===annotation.id);return {stroke:i?.enabled?'#54ffbd':'#999',strokeWidth:2,fill:i?.enabled?'#54ffbd':'#999',fillOpacity:.12};}});
  anno.on('updateAnnotation',captureEdit);anno.on('selectionChanged',selected=>{if(syncing||ticket!==epoch||!active||!screenNow())return;const a=selected[0];if(a&&screenNow().interactions.some(i=>i.interactionId===a.id)){selectedId=a.id;refreshEditor();}});
  syncAnnotations({initial:true});$('stage').inert=!lease.valid()||writeBlocked;imageStatus('');
 }catch(error){if(ticket===epoch){imageStatus('Не удалось открыть изображение: '+error.message,true);console.error('MAX audit image',screen.screenId,error);}}
}
async function leaveEditor(){
 captureEdit();clearTimeout(saveTimer);await flush();
 if(dirty||conflict||saving){
  if(!writeBlocked){saveStatus('Дождитесь сохранения или разрешите конфликт перед закрытием карточки.',true);return false;}
  if(!window.confirm('Закрыть карточку без отправки несохранённых изменений? Копия останется в браузере; её можно скачать.'))return false;
  cacheDraft();
 }
 destroyEditor();
 try{await lease.release();}catch{saveStatus('Связь потеряна. Блокировка карточки автоматически освободится через 30 секунд.',true);}
 await pollLocks();return true;
}
async function openEditor(index){
 if(opening||!entries[index])return;
 if(writeBlocked){saveStatus('Сначала сохраните оставшиеся изменения кнопкой «Повторить подключение / сохранение» или скачайте копию.',true);return;}
 const held=cardLocks.get(entries[index].screen.screenId);if(held&&!held.owned){saveStatus('СЕЙЧАС РЕДАКТИРУЕТСЯ — эту карточку уже открыл другой участник.',true);return;}
 opening=true;paintCardLocks();
 try{
  if(active&&!await leaveEditor())return;
  if(dialog.open)dialog.close();
  await lease.acquire(entries[index].screen.screenId);
  $('lease-status').textContent='Карточка закреплена за вами до закрытия.';
  // Image decoding may be slow: the card is already acquired, but close/navigation
  // must remain available. renderEditor uses its epoch to reject late images.
  renderEditor(index).catch(error=>saveStatus('Не удалось показать карточку: '+error.message,true));pollLocks();
 }catch(error){if(lease.grant&&!active){try{await lease.release();}catch{/* Expiry bounds a lost release. */}}saveStatus(error.status===423?'СЕЙЧАС РЕДАКТИРУЕТСЯ — карточку уже открыл другой участник.':'Не удалось открыть карточку: '+error.message,true);await pollLocks();}
 finally{opening=false;paintCardLocks();}
}
async function closeEditor(){if(opening)return;opening=true;try{if(await leaveEditor())dialog.close();}finally{opening=false;paintCardLocks();}}
$('stage').addEventListener('pointerdown',event=>{
 if(!placing||!anno||!active||event.button!==0)return;const r=img.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;if(x<0||x>1||y<0||y>1)return;
 event.preventDefault();event.stopImmediatePropagation();const rect=rectAt(x*active.screen.asset.width,y*active.screen.asset.height,active.screen.asset),mode=placing;
 edit(()=>{if(mode==='new'){const id='zone:'+crypto.randomUUID();screenNow().interactions.push(newInteraction('hotspot',screenNow(),taskNow(),id,rect));selectedId=id;}else screenNow().interactions.find(i=>i.interactionId===mode).rect=rect;});placing=null;syncAnnotations();
},true);
$('interaction-list').onchange=event=>{const id=event.target.dataset.enabled;if(id){edit(()=>screenNow().interactions.find(i=>i.interactionId===id).enabled=event.target.checked,{structural:true});anno?.setStyle(annotation=>{const i=screenNow().interactions.find(i=>i.interactionId===annotation.id);return {stroke:i?.enabled?'#54ffbd':'#999',fill:i?.enabled?'#54ffbd':'#999',strokeWidth:2,fillOpacity:.12};});}};
$('interaction-list').onclick=event=>{const button=event.target.closest('[data-select]');if(button){captureEdit();selectedId=button.dataset.select;placing=null;syncAnnotations();refreshEditor();}};
$('add-hotspot').onclick=()=>{placing='new';refreshEditor();};
for(const kind of ['button','timer'])$('add-'+kind).onclick=()=>{const id=kind+':'+crypto.randomUUID();edit(()=>{screenNow().interactions.push(newInteraction(kind,screenNow(),taskNow(),id));selectedId=id;},{structural:true});};
$('cancel-place').onclick=()=>{placing=null;refreshEditor();};$('place').onclick=()=>{placing=selectedId;refreshEditor();};$('show-action').onclick=()=>{placing=null;syncAnnotations();};
$('delete-action').onclick=()=>{edit(()=>{deleteInteraction(screenNow(),selectedId);selectedId=screenNow().interactions[0]?.interactionId;},{structural:true});placing=null;syncAnnotations();};
$('interaction-name').oninput=event=>edit(()=>{const a=actionNow();if(a)a[a.kind==='button'?'label':'name']=event.target.value;});
$('interaction-name').onchange=refreshEditor;
$('target').onchange=event=>edit(()=>{const a=actionNow();if(a&&!a.semanticRef)a.target=event.target.value==='@complete'?{kind:'complete-task'}:event.target.value?{kind:'screen',screenId:event.target.value}:null;},{structural:true});
$('delay').onchange=event=>edit(()=>{actionNow().delayMs=Math.round(Number(event.target.value)*1000);},{structural:true});
$('screen-enabled').onchange=event=>edit(()=>{screenNow().enabled=event.target.checked;if(!event.target.checked)screenNow().final=false;},{structural:true});
$('screen-final').onchange=event=>edit(()=>{const checked=event.target.checked;if(checked)for(const s of taskNow().screens)s.final=false;screenNow().final=checked;},{structural:true});
$('help-mode').onchange=event=>edit(()=>screenNow().help.mode=event.target.value,{structural:true});
$('screen-help').oninput=event=>edit(()=>screenNow().help.text=event.target.value);
$('task-help').oninput=event=>edit(()=>taskNow().helpText=event.target.value||null);
$('mission-help').oninput=event=>edit(()=>flow.missions.find(m=>m.missionId===active.mission.missionId).helpText=event.target.value||null);
$('close').onclick=closeEditor;dialog.addEventListener('cancel',event=>{event.preventDefault();closeEditor();});$('prev').onclick=()=>openEditor(entries.indexOf(active)-1);$('next').onclick=()=>openEditor(entries.indexOf(active)+1);$('filter').onchange=applyFilter;
$('editor-export').onclick=()=>{captureEdit();showExport(snapshot());};
$('undo').onclick=()=>{captureEdit();if(conflict||saving)return;const last=history.pop();if(last){const current=snapshot(),result=undoLocalEdit(last,current);flow=result.document;
 if(result.conflicts.length)showConflict({base:last.after,local:last.before,remote:current,revision:serverRevision,undo:true},result.conflicts);
 else{queueSave();syncAnnotations();refreshEditor();}}};
function showExport(document){const json=JSON.stringify({...document,exportedAt:new Date().toISOString()},null,2);if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=URL.createObjectURL(new Blob([json],{type:'application/json'}));$('export-text').value=json;$('download-file').href=exportUrl;$('download-file').download='max-asset-flow-'+new Date().toISOString().slice(0,10)+'.json';$('export-box').showModal();}
$('export-close').onclick=()=>$('export-box').close();$('export').onclick=()=>{captureEdit();showExport(snapshot());};$('export-recovery').onclick=()=>showExport(recoveryDocument);
$('conflict-export').onclick=()=>showExport(snapshot());$('conflict-close').onclick=()=>$('conflict-box').close();$('open-conflict').onclick=()=>$('conflict-box').showModal();
editorConflictButton.onclick=()=>$('conflict-box').showModal();
function resolveConflict(resolution){
 const state=conflictState;if(!state)return;
 try{
  const next=state.replace?structuredClone(resolution==='local'?state.local:state.remote):mergeFlowDocuments(state.base,state.local,state.remote,{resolution}).document;
  validateFlowDocument(next,catalog);flow=next;
  if(!state.undo){baseDocument=state.remote;serverRevision=state.revision;}
  replaceMode=Boolean(state.replace&&resolution==='local');conflict=false;conflictState=null;$('conflict-box').close();$('open-conflict').hidden=true;editorConflictButton.hidden=true;
  dirty=!sameDocument(flow,baseDocument);if(dirty)queueSave();else{cacheDraft();saveStatus('Общая версия синхронизирована');}repaintShared();
 }catch(error){$('conflict-message').textContent='Не удалось применить выбранную версию: '+error.message+'. Скачайте свою копию; конфликт остаётся открытым.';}
}
$('conflict-local').onclick=()=>resolveConflict('local');$('conflict-remote').onclick=()=>resolveConflict('remote');
$('restore-recovery').onclick=()=>{try{
 if(!flow||serverRevision===undefined||conflict||saving)return;
 if(!window.confirm(recoveryConfirmation(recoveryDocument,recoveryBaseRevision,serverRevision)))return;
 const next=importEditorDocument(flow,recoveryDocument,catalog);if(edit(()=>{flow=next;},{structural:true}))replaceMode=true;syncAnnotations();
 }catch(error){status('Не восстановлено: '+error.message,true);}};
$('import').onchange=async event=>{const file=event.target.files[0];if(!file)return;document.body.inert=true;
 try{if(saving||conflict)throw Error('Дождитесь сохранения или разрешите конфликт перед импортом');if(file.size>1048576)throw Error('Файл превышает 1 MiB');const value=JSON.parse(await file.text());if(saving||conflict)throw Error('Во время чтения файла началось сохранение. Дождитесь его и повторите импорт');const next=importEditorDocument(flow,value,catalog);if(value.schemaVersion===3&&!window.confirm('Загрузить полную копию v3 вместо текущего черновика? Текущая версия останется доступна через «Отменить правку».'))return;if(edit(()=>{flow=next;},{structural:true}))replaceMode=true;syncAnnotations();}
 catch(error){status('Импорт отменён: '+error.message,true);}finally{event.target.value='';document.body.inert=false;}};
window.addEventListener('beforeunload',event=>{captureEdit();if(dirty||saving){event.preventDefault();event.returnValue='';}});
function settleInteraction(){if(interactionBusy())return;if(repaintPending)repaintShared();if(remotePending)pollShared();}
document.addEventListener('pointerdown',()=>{pointerHeld=true;},true);
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,()=>{pointerHeld=false;setTimeout(settleInteraction,0);},true);
document.addEventListener('focusout',()=>setTimeout(settleInteraction,0));
window.addEventListener('blur',()=>{pointerHeld=false;});
window.addEventListener('focus',()=>{settleInteraction();pollShared();});
window.addEventListener('online',()=>{clearTimeout(retryTimer);retryTimer=null;if(dirty&&!conflict&&!writeBlocked)flush();pollShared();pollLocks();});
document.addEventListener('visibilitychange',()=>{clearTimeout(pollTimer);clearTimeout(locksTimer);if(!document.hidden){settleInteraction();pollShared();pollLocks();}});
window.addEventListener('pagehide',()=>{const grant=lease.grant;if(grant&&!dirty&&!saving&&csrf)fetch(api('max-asset-locks'),{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','X-VK-Token':csrf,'X-MAX-Editor-Id':clientId},body:JSON.stringify({action:'release',screenId:grant.screenId,token:grant.token})}).catch(()=>{});lease.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted){if(active){writeBlocked=true;$('lease-status').textContent='Доступ после возврата на страницу нужно получить заново. Закройте карточку.';refreshEditor();}pollLocks();}});
function renderCatalog(){
 $('missions').innerHTML=catalog.missions.map(m=>`<a href="#mission-${esc(m.missionId)}">${esc(m.title)}</a>`).join('');let index=0;
 $('catalog').innerHTML=catalog.missions.map(m=>`<section class="mission" id="mission-${esc(m.missionId)}"><span class="eyebrow">МИССИЯ</span><h2>${esc(m.title)}</h2>${m.tasks.map(t=>`<section class="task"><h3>${esc(t.title)} · ${t.screens.length} экранов</h3><div class="grid">${t.screens.map(s=>`<article class="card" data-entry="${index++}"><button class="preview" aria-label="Открыть ${esc(t.title)}, экран ${s.order}"><img src="${esc(s.asset.thumbnailUrl)}" loading="lazy" decoding="async" alt="${esc(t.title)}, экран ${s.order}"></button><p class="card-lock" role="status"></p><h4>Экран ${s.order}</h4><p class="screen-state"></p><p class="state"></p><div class="action-summary"></div><p class="screen-id">${esc(s.screenId)}</p><button class="edit secondary">Открыть крупно</button></article>`).join('')}</div></section>`).join('')}</section>`).join('');
 $('catalog').onclick=event=>{const card=event.target.closest('[data-entry]');if(card&&event.target.closest('button'))openEditor(Number(card.dataset.entry));};updateCards();
}
async function loadServer(){
 const server=await requestJson(api('max-asset-flow')),next=readEditorDocument(server,catalog);if(typeof server.revision!=='string')throw Error('Сервер не вернул версию');flow=next;baseDocument=structuredClone(next);serverRevision=server.revision;
 $('export').disabled=false;$('import').disabled=false;$('restore-recovery').hidden=!recoveryDocument;renderCatalog();validateRoutes();await pollLocks();document.documentElement.dataset.auditReady='true';saveStatus('Общая версия загружена. Сохранение и получение изменений команды — автоматически.');pollTimer=setTimeout(pollShared,2000);
}
$('retry-save').onclick=async()=>{clearTimeout(retryTimer);retries=0;try{if(active&&!lease.valid()){saveStatus('Закройте карточку перед повтором сохранения. Скачайте копию, если связь ещё недоступна.',true);return;}writeBlocked=false;if(serverRevision===undefined){await loadServer();refreshEditor();}else await flush();}catch(error){saveStatus('Не удалось подключиться: '+error.message,true);}};
async function boot(){
 const response=await fetch('./catalog.json');if(!response.ok)throw Error('Каталог недоступен');catalog=await response.json();entries=entriesOf(catalog);
 let localDraft;try{
  recoveryDb=await openDB('max-asset-flow-recovery-v3',1,{upgrade(db){db.createObjectStore('drafts');}});
  if(previousClientId)localDraft=await recoveryDb.get('drafts',recoveryKey(catalog.contentRevision,previousClientId));
  if(!localDraft?.dirty){
   // Repeated reloads without editing must still discover a prior unsaved copy.
   // Reading another tab's draft never consumes or deletes it.
   const prefix=recoveryKey(catalog.contentRevision,''),keys=(await recoveryDb.getAllKeys('drafts')).filter(key=>typeof key==='string'&&key.startsWith(prefix));
   const candidates=await Promise.all(keys.map(key=>recoveryDb.get('drafts',key)));
   localDraft=candidates.filter(value=>value?.dirty).sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).find(value=>{try{readEditorDocument(value.document,catalog);return true;}catch{return false;}});
  }
  if(!localDraft?.dirty){const old=await recoveryDb.get('drafts',catalog.contentRevision);if(old?.dirty)localDraft=old;}
  if(localDraft)readEditorDocument(localDraft.document,catalog);
 }catch{localDraft=null;}
 // Offer an unsaved legacy draft without mutating its database or silently merging it.
 if(!localDraft?.dirty){let legacyDb;try{const databases=await indexedDB.databases();if(databases.some(d=>d.name==='max-asset-audit-recovery-v2')){legacyDb=await openDB('max-asset-audit-recovery-v2');const legacyDraft=await legacyDb.get('drafts',catalog.contentRevision);if(legacyDraft?.dirty){readEditorDocument(legacyDraft.document,catalog);localDraft=legacyDraft;}}}catch{/* Legacy data remains untouched if discovery is unsupported. */}finally{legacyDb?.close();}}
 if(localDraft?.dirty){recoveryDocument=localDraft.document;recoveryBaseRevision=localDraft.baseRevision;$('export-recovery').hidden=false;}
 try{await loadServer();if(recoveryDocument)status('Загружено с сервера. Есть несохранённый черновик браузера — восстановите его с подтверждением замены или скачайте копию.');}
 catch(error){saveStatus('Не удалось загрузить разметку: '+error.message+'. Редактирование отключено, серверные данные не изменены.',true);}
}
boot().catch(error=>saveStatus('Не удалось открыть редактор: '+error.message,true));
