// Native HTML dialog owns modality/focus. SessionPort owns all saved state.
export function recoveryDetails(snapshot,catalog){
 const s=snapshot?.state;
 if(!s?.missionId||s.status==='menu')return null;
 return {title:catalog.missions[s.missionId]?.title??'Миссия MAX',
  canContinue:['completed','incomplete'].includes(s.status)||s.status!=='expired'&&snapshot.view.remainingMs>0};
}

export async function applyRecoveryChoice(session,choice){
 if(choice==='continue')return;
 const result=choice==='restart'?await session.restart():await session.command('RETURN_MENU');
 if(!result?.reply.ok)throw Error('Не удалось восстановить миссию. Попробуйте ещё раз.');
}

export function showV5Recovery({snapshot,catalog,onChoose,document}){
 const details=recoveryDetails(snapshot,catalog);if(!details)return Promise.resolve(null);
 const dialog=document.createElement('dialog');dialog.className='v5-recovery';
 dialog.setAttribute('aria-labelledby','v5-recovery-title');
 const title=document.createElement('h1');title.id='v5-recovery-title';title.textContent='Продолжить игру?';
 const mission=document.createElement('p');mission.textContent=details.title;
 const description=document.createElement('p');description.className='v5-recovery-note';
 description.textContent=details.canContinue?'Прогресс сохранён. «Начать заново» сбросит только эту миссию.':'Время миссии истекло. Можно начать её заново или выбрать другую.';
 const actions=document.createElement('form');actions.method='dialog';
 const choices=[...(details.canContinue?[['continue','Продолжить']]:[]),['restart','Начать заново'],['menu','К выбору миссий']];
 for(const [value,label]of choices){const b=document.createElement('button');b.value=value;b.type='submit';b.textContent=label;actions.append(b);}
 actions.firstElementChild.autofocus=true;
 const error=document.createElement('p');error.setAttribute('role','status');
 dialog.append(title,mission,description,actions,error);document.body.append(dialog);
 return new Promise(resolve=>{
  let pending=false;
  const choose=async choice=>{
   if(pending)return;pending=true;error.textContent='';
   for(const b of actions.elements)b.disabled=true;
   try{await onChoose(choice);dialog.close(choice);}
   catch(e){error.textContent=e.message;pending=false;for(const b of actions.elements)b.disabled=false;}
  };
  actions.addEventListener('submit',e=>{e.preventDefault();void choose(e.submitter?.value??'menu');});
  dialog.addEventListener('cancel',e=>{e.preventDefault();void choose('menu');});
  dialog.addEventListener('close',()=>{const choice=dialog.returnValue;dialog.remove();resolve(choice);},{once:true});
  dialog.showModal();
 });
}
