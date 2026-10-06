export const DEFAULT_CYCLE_IDS=Object.freeze(['device.custom.home-photo-no-benefits','device.custom.tv-first-30s']);
const defaults=()=>({iconSizePx:256,cycleEnabled:false,cycleAssetIds:[...DEFAULT_CYCLE_IDS],staticWaitSeconds:5});
export const EMPTY_SCENE=Object.freeze({deviceAssetId:null,deviceVisible:false,iconsVisible:false,icons:[],...defaults()});
const clone=value=>JSON.parse(JSON.stringify(value));
export function sceneIssue(scene,catalog){
 if(!scene||!Array.isArray(scene.icons))return 'Нет сохранённой сцены';
 const iconSize=scene.iconSizePx===undefined?256:scene.iconSizePx;
 if(!Number.isInteger(iconSize)||iconSize<64||iconSize>1024)return 'Размер иконок: целое число от 64 до 1024 px.';
 const cycleEnabled=scene.cycleEnabled===undefined?false:scene.cycleEnabled,cycleIds=scene.cycleAssetIds===undefined?DEFAULT_CYCLE_IDS:scene.cycleAssetIds,wait=scene.staticWaitSeconds===undefined?5:scene.staticWaitSeconds;
 if(typeof cycleEnabled!=='boolean')return 'Неверное значение режима цикла.';
 if(!Array.isArray(cycleIds)||cycleIds.length!==2||cycleIds.some(x=>typeof x!=='string'||!x)||new Set(cycleIds).size!==2)return 'Для цикла выберите два разных экрана.';
 if(typeof wait!=='number'||!Number.isFinite(wait)||wait<0.5||wait>3600)return 'Пауза изображения: от 0,5 до 3600 секунд.';
 if(cycleEnabled&&cycleIds.some(id=>!catalog.devices.some(x=>x.id===id)))return 'Экран цикла отсутствует в каталоге.';
 if((scene.deviceVisible||scene.iconsVisible)&&!scene.deviceAssetId&&!cycleEnabled)return 'Для устройства и иконок сначала выберите ассет устройства.';
 if(scene.deviceAssetId&&!catalog.devices.some(x=>x.id===scene.deviceAssetId))return 'Выбранный ассет устройства отсутствует в каталоге.';
 if(scene.icons.length>8)return 'Можно добавить не более 8 иконок.';
 if(new Set(scene.icons.map(x=>x.instanceId)).size!==scene.icons.length)return 'Иконки должны иметь разные идентификаторы.';
 if(scene.icons.some(x=>!catalog.icons.some(a=>a.id===x.assetId)||!['left','right'].includes(x.side)||typeof x.enabled!=='boolean'))return 'Одна из иконок отсутствует в каталоге или задана неверно.';
 return '';
}
export function moveIcon(scene,id,direction){
 const next=clone(scene),index=next.icons.findIndex(x=>x.instanceId===id);if(index<0)return next;
 const same=next.icons.map((x,i)=>x.side===next.icons[index].side?i:-1).filter(i=>i>=0),position=same.indexOf(index),other=same[position+direction];
 if(other!==undefined)[next.icons[index],next.icons[other]]=[next.icons[other],next.icons[index]];
 return next;
}

// Local drafts never write on change. Visibility actions use only the last
// confirmed saved scene; a dirty layout must be applied or discarded first.
export function createAssetsDraft(){
 let saved=null,draft=null,revision=null,dirty=false;
 return {
  sync(state){saved=state?.assetsSettings?{...defaults(),...clone(state.assetsSettings)}:null;if(dirty&&JSON.stringify(draft)===JSON.stringify(saved))dirty=false;if(!dirty){draft=saved?clone(saved):null;revision=state?.revision??null;}},
  edit(change){if(!draft)return;draft=change(clone(draft));dirty=JSON.stringify(draft)!==JSON.stringify(saved);},
  reset(state){dirty=false;this.sync(state);},
  rebaseRevision(state){revision=state?.revision??revision;},
  snapshot(){return {saved:clone(saved),draft:clone(draft),revision,dirty};},
 };
}

export function mountAssetsEditor({root,controller,getCsrf,fetchImpl=fetch,newId=()=>crypto.randomUUID()}){
 const el=id=>root.querySelector('#'+id),model=createAssetsDraft();
 let catalog=null,view=null,notice='',catalogError='',disposed=false,renderKey='';
 const append=(parent,tag,label)=>{const node=root.createElement?root.createElement(tag):root.ownerDocument.createElement(tag);node.textContent=label;parent.append(node);return node;};
 function edit(change){model.edit(change);notice='';render();}
 function render(){
  if(disposed)return;
  const {draft,dirty}=model.snapshot(),blocked=!view?.state||view.busy||!!view.pending||!getCsrf()||!catalog||!draft;
  el('assets-editor').disabled=blocked;
  el('assets-status').textContent=catalogError||notice||(catalog&&draft&&sceneIssue(draft,catalog))||(dirty?'Есть неприменённые изменения. Примените сцену перед переключением её видимости.':catalog&&draft?`Сцена сохранена · ревизия настроек ${view.state.settingsRevision??0}`:'Читаем каталог и сохранённую сцену…');
  const hasDevice=!!draft?.deviceAssetId||draft?.cycleEnabled===true;
  el('assets-device-toggle').disabled=blocked||dirty||(!draft?.deviceVisible&&!hasDevice);
  el('assets-icons-toggle').disabled=blocked||dirty||(!draft?.iconsVisible&&!hasDevice);
  el('assets-device').disabled=blocked||draft?.cycleEnabled===true;
  el('assets-cycle-options').disabled=blocked||draft?.cycleEnabled!==true;
  el('assets-device-toggle').textContent=draft?.deviceVisible?'Скрыть устройство':'Показать устройство';
  el('assets-icons-toggle').textContent=draft?.iconsVisible?'Скрыть иконки':'Показать иконки';
  el('assets-device-state').textContent=draft?.deviceVisible?'Устройство показано в настройках сцены':'Устройство скрыто в настройках сцены';
  el('assets-icons-state').textContent=draft?.iconsVisible?'Группа иконок показана в настройках сцены':'Группа иконок скрыта в настройках сцены';
  el('assets-apply').disabled=blocked||!dirty||!!sceneIssue(draft,catalog);
  el('assets-reset').disabled=blocked||!dirty;
  el('assets-add').disabled=blocked||(draft?.icons.length??8)>=8||!catalog?.icons.length;
  const nextKey=JSON.stringify([catalog,draft]);if(nextKey===renderKey||!catalog||!draft)return;renderKey=nextKey;
  el('assets-icon-size').value=draft.iconSizePx===null?'':String(draft.iconSizePx);
  el('assets-cycle-enabled').checked=draft.cycleEnabled;
  el('assets-static-wait').value=draft.staticWaitSeconds===null?'':String(draft.staticWaitSeconds);
  const selectedAdd=el('assets-add-icon').value;
  el('assets-device').replaceChildren();const none=append(el('assets-device'),'option','Не выбрано');none.value='';
  for(const item of catalog.devices){const option=append(el('assets-device'),'option',item.label||item.id);option.value=item.id;}
  el('assets-device').value=draft.deviceAssetId||'';
  for(let i=0;i<2;i++){
   const select=el('assets-cycle-'+i);select.replaceChildren();
   for(const item of catalog.devices){const option=append(select,'option',item.label||item.id);option.value=item.id;}
   select.value=draft.cycleAssetIds[i];
  }
  el('assets-add-icon').replaceChildren();for(const item of catalog.icons){const option=append(el('assets-add-icon'),'option',item.label||item.id);option.value=item.id;}
  if(catalog.icons.some(x=>x.id===selectedAdd))el('assets-add-icon').value=selectedAdd;
  for(const side of ['left','right']){
   const list=el('assets-'+side);list.replaceChildren();const icons=draft.icons.filter(x=>x.side===side);
   if(!icons.length)append(list,'li','Иконок нет');
   icons.forEach((icon,index)=>{
    const item=append(list,'li',''),label=append(item,'label',''),input=append(label,'input','');input.type='checkbox';input.checked=icon.enabled;input.setAttribute('aria-label','Включить '+(catalog.icons.find(x=>x.id===icon.assetId)?.label||icon.assetId));
    append(label,'span',catalog.icons.find(x=>x.id===icon.assetId)?.label||icon.assetId);
    input.onchange=()=>edit(s=>({...s,icons:s.icons.map(x=>x.instanceId===icon.instanceId?{...x,enabled:input.checked}:x)}));
    const button=(text,action,disabled=false)=>{const b=append(item,'button',text);b.type='button';b.disabled=disabled;b.onclick=action;};
    button('Ближе к устройству',()=>edit(s=>moveIcon(s,icon.instanceId,-1)),index===0);
    button('Дальше от устройства',()=>edit(s=>moveIcon(s,icon.instanceId,1)),index===icons.length-1);
    button(side==='left'?'Перенести вправо':'Перенести влево',()=>edit(s=>({...s,icons:s.icons.map(x=>x.instanceId===icon.instanceId?{...x,side:side==='left'?'right':'left'}:x)})));
    button('Удалить',()=>edit(s=>({...s,icons:s.icons.filter(x=>x.instanceId!==icon.instanceId)})));
   });
  }
 }
 async function apply(scene,revision){
  const issue=sceneIssue(scene,catalog);if(issue){notice=issue;render();return;}
  const result=await controller.configureSettings(scene,revision);if(disposed)return;
  if(result?.accepted){model.reset(controller.snapshot().state);notice='Сцена сохранена.';}
  else if(result?.reason==='REVISION_CONFLICT'){model.rebaseRevision(controller.snapshot().state);notice='Сцена изменилась у другого оператора. Ваш черновик сохранён: проверьте его и нажмите «Применить сцену» снова или верните сохранённую сцену.';}
  else notice=result?'Сцена не применена. Причина указана в состоянии режима выше.':'Результат неизвестен. Используйте «Повторить неподтверждённую команду» выше.';
  render();
 }
 async function toggle(field){const snapshot=model.snapshot();if(snapshot.dirty){notice='Сначала примените изменения сцены или верните сохранённую сцену.';render();return;}if(!snapshot.saved)return;await apply({...snapshot.saved,[field]:!snapshot.saved[field]},view.state.revision);}
 el('assets-device').onchange=()=>edit(s=>({...s,deviceAssetId:el('assets-device').value||null}));
 el('assets-cycle-enabled').onchange=()=>edit(s=>({...s,cycleEnabled:el('assets-cycle-enabled').checked,deviceAssetId:el('assets-cycle-enabled').checked&&!s.deviceAssetId?s.cycleAssetIds[0]:s.deviceAssetId}));
 for(let i=0;i<2;i++)el('assets-cycle-'+i).onchange=()=>edit(s=>({...s,cycleAssetIds:s.cycleAssetIds.map((id,index)=>index===i?el('assets-cycle-'+i).value:id)}));
 el('assets-static-wait').oninput=()=>{const text=el('assets-static-wait').value;edit(s=>({...s,staticWaitSeconds:text.trim()===''?null:Number(text)}));};
 el('assets-icon-size').oninput=()=>{const text=el('assets-icon-size').value;edit(s=>({...s,iconSizePx:text.trim()===''?null:Number(text)}));};
 el('assets-device-toggle').onclick=()=>void toggle('deviceVisible');el('assets-icons-toggle').onclick=()=>void toggle('iconsVisible');
 el('assets-add').onclick=()=>edit(s=>s.icons.length>=8?s:{...s,icons:[...s.icons,{instanceId:newId(),assetId:el('assets-add-icon').value,side:el('assets-add-side').value,enabled:true}]});
 el('assets-apply').onclick=()=>{const s=model.snapshot();void apply(s.draft,s.revision);};
 el('assets-reset').onclick=()=>{model.reset(view?.state);notice='';render();};
 async function loadCatalog(){
  try{const response=await fetchImpl('/fleet/v1/max-presentation/catalog',{cache:'no-store',signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error('HTTP '+response.status);const value=await response.json();if(value?.schemaVersion!==1||!Array.isArray(value.devices)||!Array.isArray(value.icons))throw Error('Неверный формат каталога');catalog=value;catalogError='';}
  catch(e){catalogError='Каталог недоступен: '+e.message;}
  render();
 }
 el('assets-reload-catalog').onclick=()=>void loadCatalog();void loadCatalog();
 return {update(next){view=next;model.sync(next.state);render();},destroy(){disposed=true;},model};
}
