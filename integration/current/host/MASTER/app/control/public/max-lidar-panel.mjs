const actions=['enable','disable','start','capture','save','cancel'];
const reasonText={MODE_INELIGIBLE:'Сейчас игровой курсор недоступен в этом режиме.',NO_PACKETS:'Нет пакетов от LiDAR.',NO_CALIBRATION:'Сначала сохраните калибровку.',GAME_BUSY:'Сейчас идёт игра или назначена миссия. Дождитесь освобождения игры перед включением курсора или калибровкой.',NOT_ENOUGH_FRESH_SAMPLES:'Недостаточно свежих измерений. Удерживайте руку неподвижно в мишени и подтвердите точку ещё раз.',UNSTABLE_CONTACT:'Рука движется. Удерживайте её неподвижно и повторите подтверждение.',RELEASE_REQUIRED:'Уберите руку из зоны LiDAR, затем переходите к следующей точке.',CENTER_CHECK_REQUIRED:'Подтвердите центр мишени и уберите руку перед сохранением.',CENTER_CHECK_FAILED:'Ошибка центра слишком велика. Уберите руку и повторите проверку центра.',CALIBRATION_NOT_STARTED:'Сначала начните калибровку.',SOURCE_CHANGED:'Источник LiDAR изменился. Начните калибровку заново.',REVISION_CONFLICT:'Состояние изменилось. Обновите его и повторите действие.'};
const translated=value=>reasonText[String(value??'').toUpperCase()]??value;

export function createMaxLidarPanel({document,fetch,uuid=()=>crypto.randomUUID(),setInterval,clearInterval}){
 const find=id=>document.getElementById('lidar-'+id);
 const buttons=Object.fromEntries(actions.map(action=>[action,find(action)]));
 let state=null,csrf=null,busy=false,polling=false,pending=null,disposed=false,notice='';
 const request=async(path,options)=>{
  const response=await fetch(path,{cache:'no-store',...options});
  let value;try{value=await response.json();}catch{throw Object.assign(Error('Неверный ответ сервиса'),{unknown:true});}
  if(!response.ok)throw Object.assign(Error(value.error??'Сервис не ответил'),{status:response.status,unknown:response.status>=500});
  return value;
 };
 const render=()=>{
  const ready=state?.protocol==='max-lidar-v1';
  const phase=state?.calibration?.phase??'idle';
  find('status').textContent=ready?`Курсор: ${state.enabled?'включён':'выключен'} · ${state.modeEligible?'режим игры доступен':'режим игры недоступен'} · калибровка: ${{idle:'не запущена',capture:'сбор точек',verify:'проверка центра'}[phase]??phase}`:'LiDAR недоступен';
  find('notice').textContent=notice||(state?.reason?translated(state.reason):'')||(state?.calibration?.lastError?translated(state.calibration.lastError):'');
  find('receiver').textContent=ready?`UDP ${state.receiver?.port??9001} · источник ${state.receiver?.sourceAddress??'—'} · ${state.receiver?.bound?'приёмник запущен':'приёмник не запущен'} · пакетов ${state.receiver?.packetCount??0} · последний ${state.receiver?.lastPacketAgeMs==null?'не получен':Math.round(state.receiver.lastPacketAgeMs)+' мс назад'} · ошибок ${state.receiver?.decodeErrors??0}`:'Нет подтверждённого приёмника';
  const target=state?.calibration?.targets?.[state.calibration.index];
  const total=state?.calibration?.targets?.length??0;
  find('step').textContent=phase==='capture'?`Точка ${Math.min((state.calibration.index??0)+1,total)} из ${total}${target?` · ${target.id}`:''}. ${state.calibration.awaitingRelease?'Уберите руку, затем переходите к следующей точке.':'Поместите руку в мишень на стене, удерживайте неподвижно и нажмите «Подтвердить точку».'}`:phase==='verify'?`Проверка центра. Ошибка: ${Number.isFinite(state.calibration.centerErrorPx)?Math.round(state.calibration.centerErrorPx)+' px':'ожидается измерение'}. ${state.calibration.canSave?'Центр подтверждён, руку убрали. Калибровку можно сохранить.':state.calibration.awaitingRelease?'Уберите руку из зоны LiDAR. Если центр ещё не подтверждён, затем поместите руку в центр мишени и нажмите «Подтвердить центр».':'Поместите руку в центр мишени, удерживайте неподвижно, нажмите «Подтвердить центр» и уберите руку.'}`:'Начните калибровку и следуйте мишеням на правой стене. Игровые касания временно блокируются на время калибровки.';
  find('saved').textContent=state?.savedCalibration?'Сохранённая калибровка есть. Новая заменит её только после «Сохранить калибровку».':'Сохранённой калибровки нет.';
  find('cursor').textContent=state?.cursor?`Курсор: X ${Math.round(state.cursor.x)}, Y ${Math.round(state.cursor.y)}`:'Касание не обнаружено';
  for(const action of actions)buttons[action].disabled=!ready||!csrf||busy||!!pending;
  buttons.capture.textContent=phase==='verify'?'Подтвердить центр':'Подтвердить точку';
  buttons.disable.disabled=!ready||!csrf||busy;
  if(ready){
   const gameBusy=String(state.reason??'').toUpperCase()==='GAME_BUSY';
   buttons.enable.disabled ||=state.enabled||!state.modeEligible||gameBusy;
   buttons.start.disabled ||=phase!=='idle'||!state.modeEligible||gameBusy;
   buttons.capture.disabled ||=!['capture','verify'].includes(phase)||state.calibration.awaitingRelease;
   buttons.save.disabled ||=phase!=='verify'||!state.calibration.canSave;
   buttons.cancel.disabled ||=phase==='idle';
  }
  find('retry').hidden=!pending;find('retry').disabled=busy;
 };
 const refresh=async()=>{
  if(polling||disposed)return;polling=true;
  try{
   const fleet=await request('/fleet/v1/state');csrf=fleet.csrf;
   const value=await request('/fleet/v1/max-lidar');
   if(value.protocol!=='max-lidar-v1'||!Number.isSafeInteger(value.revision))throw Error('Неверная версия сервиса LiDAR');
   if(!state||value.revision>=state.revision)state=value;
   if(notice.startsWith('Нет подтверждённого состояния:'))notice='';
  }catch(error){state=null;notice=`Нет подтверждённого состояния: ${error.message}`;}
  finally{polling=false;if(!disposed)render();}
 };
 const submit=async(command)=>{
  if(busy||!csrf||disposed)return;
  busy=true;notice='Отправляем команду…';render();
  try{
   const result=await request('/fleet/v1/max-lidar',{method:'POST',headers:{'Content-Type':'application/json','X-Fleet-CSRF':csrf},body:JSON.stringify(command)});
   if(result.protocol!=='max-lidar-v1'||!Number.isSafeInteger(result.revision))throw Object.assign(Error('Неверная версия ответа'),{unknown:true});
   state=result;pending=null;notice=result.calibration?.lastError?translated(result.calibration.lastError):'Команда подтверждена.';
  }catch(error){
   if(error.status===409){pending=null;notice=reasonText[String(error.message).toUpperCase()]??'Состояние изменилось. Обновите его и повторите действие.';}
   else if(error.unknown||!error.status){pending=command;notice='Результат команды не подтверждён. Повтор использует тот же идентификатор.';}
   else{pending=null;notice=`Команда отклонена: ${translated(error.message)}`;}
  }finally{busy=false;render();}
 };
 for(const action of actions)buttons[action].addEventListener('click',()=>{if(state&&!buttons[action].disabled)void submit({commandId:uuid(),expectedRevision:state.revision,action});});
 find('retry').addEventListener('click',()=>{if(pending)void submit(pending);});
 find('refresh').addEventListener('click',()=>{notice='';void refresh();});
 const timer=setInterval(()=>void refresh(),1000);void refresh();
 return {refresh,dispose(){disposed=true;clearInterval(timer);},getState:()=>({state,pending,busy})};
}

if(typeof document!=='undefined'&&document.getElementById('lidar-status'))createMaxLidarPanel({document,fetch:globalThis.fetch.bind(globalThis),setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval});
