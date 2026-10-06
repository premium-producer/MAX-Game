const KEY = 'max-selected-autoplay-command-v1';
const PROTOCOL = 'max-selected-autoplay-v1';
const validDelay = value => Number.isInteger(value) && value >= 500 && value <= 10000 && value % 100 === 0;
const validState = value => value?.protocol === PROTOCOL && typeof value.enabled === 'boolean' && validDelay(value.screenDelayMs) && Number.isSafeInteger(value.revision) && value.revision >= 0;
const validCommand = value => typeof value?.commandId === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value.commandId) && Number.isSafeInteger(value.expectedRevision) && value.expectedRevision >= 0 && typeof value.enabled === 'boolean' && validDelay(value.screenDelayMs);

// Uses the existing Fetch/Origin/CSRF protocol; retries preserve the complete command.
export class SelectedAutoplayController {
  constructor({request,storage,uuid=()=>crypto.randomUUID(),onChange=()=>{}}) {
    Object.assign(this,{request,storage,uuid,onChange});
    this.state=null;this.busy=false;this.pending=null;this.speedDraft=null;this.editRevision=null;this.notice='';
    try {
      const restored=JSON.parse(storage?.getItem(KEY)||'null');
      if(validCommand(restored?.body)&&['toggle','speed'].includes(restored.kind))this.pending=restored;
    } catch {}
  }
  notify(){this.onChange(this);}
  acceptState(value){
    if(!validState(value))throw Error('Некорректное состояние автопрохождения');
    if(!this.state||value.revision>=this.state.revision)this.state=value;
  }
  async refresh(){
    try {const reply=await this.request('GET');if(reply.status!==200)throw Error('Нет связи с мастером');this.acceptState(reply.body);}
    catch(error){this.notice='Не удалось обновить состояние: '+error.message;}
    this.notify();
  }
  editSpeed(seconds){
    if(this.busy||this.pending||!this.state)return;
    if(this.speedDraft===null)this.editRevision=this.state.revision;
    this.speedDraft=seconds;this.notify();
  }
  resetSpeed(){if(this.busy||this.pending)return;this.speedDraft=null;this.editRevision=null;this.notice='Показано сохранённое время';this.notify();}
  async toggle(enabled){
    if(typeof enabled!=='boolean'||!this.state||this.pending||this.busy)return;
    await this.send({commandId:this.uuid(),expectedRevision:this.state.revision,enabled,screenDelayMs:this.state.screenDelayMs},'toggle');
  }
  async saveSpeed(){
    if(!this.state||this.pending||this.busy)return;
    const screenDelayMs=Math.round(Number(this.speedDraft??this.state.screenDelayMs/1000)*1000);
    if(!validDelay(screenDelayMs)){this.notice='Укажите время от 0,5 до 10 секунд с шагом 0,1';this.notify();return;}
    await this.send({commandId:this.uuid(),expectedRevision:this.editRevision??this.state.revision,enabled:this.state.enabled,screenDelayMs},'speed');
  }
  async retry(){if(this.pending&&!this.busy)await this.send(this.pending.body,this.pending.kind);}
  async send(body,kind){
    if(this.busy)return;
    this.busy=true;this.pending={body,kind};
    try{this.storage?.setItem(KEY,JSON.stringify(this.pending));}catch{}
    this.notify();
    try {
      const reply=await this.request('POST',body);
      const result=reply.body;
      if(![200,409].includes(reply.status)||typeof result?.accepted!=='boolean'||!validState(result.state))throw Error('Не получено подтверждение мастера');
      this.acceptState(result.state);
      this.pending=null;try{this.storage?.removeItem(KEY);}catch{}
      if(result.accepted){
        if(kind==='speed'){this.speedDraft=null;this.editRevision=null;}
        this.notice=kind==='speed'?'Время сохранено для следующих миссий':body.enabled?'Автопрохождение следующих выбранных миссий включено':'Автопрохождение следующих выбранных миссий выключено';
      } else if(result.reason==='REVISION_CONFLICT'){
        this.notice='Настройки изменены другим оператором. Проверьте состояние; перед повторным сохранением нажмите «Вернуть сохранённое время» и задайте время заново.';
      } else this.notice='Команда отклонена: '+(result.reason||'причина не указана');
    } catch(error){this.notice='Команда не подтверждена: '+error.message+'. Повторите неподтверждённую команду.';}
    finally{this.busy=false;this.notify();}
  }
}

export function mountSelectedAutoplay({root=document,getCsrf,fetcher=fetch,storage=globalThis.sessionStorage}={}) {
  const find=id=>root.querySelector('#selected-autoplay-'+id);
  if(!find('panel'))return null;
  const controller=new SelectedAutoplayController({storage,request:async(method,body)=>{
    const response=await fetcher('/fleet/v1/max-autoplay',{method,cache:'no-store',signal:AbortSignal.timeout(6000),...(method==='POST'?{headers:{'Content-Type':'application/json','X-Fleet-CSRF':getCsrf()},body:JSON.stringify(body)}:{})});
    return {status:response.status,body:await response.json()};
  },onChange:control=>{
    const disabled=!control.state||!getCsrf()||control.busy||!!control.pending;
    find('enabled').checked=control.state?.enabled??false;find('enabled').disabled=disabled;
    if(control.speedDraft===null)find('speed').value=String((control.state?.screenDelayMs??1000)/1000);
    find('speed').disabled=disabled;find('save').disabled=disabled;find('reset').disabled=disabled||control.speedDraft===null;
    find('refresh').disabled=control.busy;find('retry').hidden=!control.pending;find('retry').disabled=control.busy||!getCsrf();
    find('state').textContent=control.state?`${control.state.enabled?'Автопрохождение включено':'Автопрохождение выключено'} · ${control.state.screenDelayMs/1000} с/экран · ревизия ${control.state.revision}`:'Состояние мастера не получено';
    find('notice').textContent=control.notice;
  }});
  find('enabled').onchange=()=>void controller.toggle(find('enabled').checked);
  find('speed').oninput=()=>controller.editSpeed(find('speed').value);
  find('speed-form').onsubmit=event=>{event.preventDefault();if(find('speed').reportValidity())void controller.saveSpeed();};
  find('reset').onclick=()=>controller.resetSpeed();find('refresh').onclick=()=>void controller.refresh();find('retry').onclick=()=>void controller.retry();
  controller.notify();void controller.refresh();
  const interval=setInterval(()=>{if(!controller.busy)void controller.refresh();},1500);
  return {controller,dispose:()=>clearInterval(interval)};
}
