// Browser lifecycle for a server-owned lease. Exclusivity is enforced by Verrou on the server.
export function createCardLeaseClient({request,onChange=()=>{},onLost=()=>{},now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout}){
 let grant=null,healthy=false,deadline=0,heartbeat,expiration,renewing=false,generation=0;
 const clear=()=>{cancel(heartbeat);cancel(expiration);};
 const valid=()=>Boolean(grant&&healthy&&now()<deadline);
 function lose(message){if(!grant||!healthy)return;healthy=false;clear();onChange();onLost(message);}
 function arm(start){
  deadline=start+(grant.validForMs??grant.ttlMs);
  if(now()>=deadline){lose('Ответ сервера получен слишком поздно. Откройте карточку заново.');return;}
  expiration=schedule(()=>lose('Время доступа истекло. Изменения сохранены в локальной копии.'),deadline-now());
  heartbeat=schedule(renew,Math.min(grant.heartbeatMs,Math.max(1,deadline-now()-1000)));
 }
 async function renew(){
  if(!valid()||renewing)return;
  renewing=true;const current=grant,ticket=generation,start=now();
  try{const reply=await request({action:'renew',screenId:current.screenId,token:current.token});
   if(ticket!==generation||!healthy)return;
   clear();grant=reply;arm(start);onChange();
  }catch{if(ticket===generation)lose('Связь с сервером потеряна: редактирование приостановлено. Скачайте копию и откройте карточку заново.');}
  finally{renewing=false;}
 }
 return {
  get grant(){return grant;},valid,
  async acquire(screenId){
   if(grant)throw Error('Закройте текущую карточку перед открытием следующей');
   const ticket=++generation,start=now(),reply=await request({action:'acquire',screenId});
   if(ticket!==generation){await request({action:'release',screenId:reply.screenId,token:reply.token});throw Error('Открытие отменено');}
   grant=reply;healthy=true;arm(start);onChange();
   if(!valid())throw Error('Не удалось подтвердить доступ к карточке');
   return grant;
  },
  async release(){
   const current=grant;++generation;clear();healthy=false;grant=null;onChange();
   if(current)await request({action:'release',screenId:current.screenId,token:current.token});
  },
  lose,
  headers(){if(!valid())return {};return {'X-MAX-Card-Id':grant.screenId,'X-MAX-Lock-Token':grant.token};},
  dispose(){++generation;clear();healthy=false;grant=null;}
 };
}
