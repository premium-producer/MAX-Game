const SERVER='http://localhost:47831';
let serverRun=null,transfer=null,stopped=false,epoch=0;
async function serverRequest(route,method='GET',body,sha){
 const controller=new AbortController();transfer=controller;const timer=setTimeout(()=>controller.abort(),150000);
 try{
  const response=await fetch(SERVER+route,{method,headers:{'X-Frame-Archive':'1',...(serverRun?{Authorization:'Bearer '+serverRun.token}:{}),...(body?{'Content-Type':'application/json'}:{}),...(sha?{'X-Content-SHA256':sha}:{})},body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body),signal:controller.signal});
  const data=await response.json();if(!response.ok)throw Error(data.error||'HTTP '+response.status);return data;
 }catch(e){if(e.name==='AbortError')throw Error(stopped?'Выгрузка остановлена':'Сервер не подтвердил сохранение вовремя. Можно продолжить.');throw e;}
 finally{clearTimeout(timer);if(transfer===controller)transfer=null;}
}
async function beginExport(resume){
 if(busy||!scan)return;if(!scan.records.some(r=>r.include)){status('Выберите экраны.');return;}
 const current=++epoch;stopped=false;serverRun=null;lock(true);status('Подключаю сервер…');$('progress').value=0;
 try{
  const health=await serverRequest('/api/health');
  if(health.service!=='figma-frame-archive'||!health.capabilities?.includes('max-materials-v1'))throw Error('Обновите сервер через Start-Server.bat в папке сборщика MAX.');
  if(current!==epoch)return;
  if(stopped){lock(false);return;}
  post({type:'export',streaming:true,resume,scanId:scan.id,edits:scan.records.map(({id,task,include,reviewed,title,order})=>({id,task,include,reviewed,title,order})),scale:Number($('scale').value),structure:$('structure').checked,images:$('images').checked,svg:$('svg').checked});
 }catch(e){if(current===epoch){lock(false);status(e.message+' Запустите Start-Server.bat и повторите.');}}
}
$('export').onclick=()=>beginExport(true);
$('new-export').onclick=()=>beginExport(false);
$('cancel').onclick=()=>{stopped=true;transfer?.abort();post({type:'cancel'});status('Остановка. Уже проверенные экраны сохранены в папке экспорта.');};
const baseMessage=onmessage;
onmessage=event=>{
 const m=event.data?.pluginMessage;if(!m)return;
 if(m.type==='stream-plan'||m.type==='stream-frame'){
  const current=epoch;
  (async()=>{
   try{
    if(stopped)throw Error('Операция остановлена');
    if(m.type==='stream-plan'){
     status('Проверяю файлы и очередь на сервере…');
     const result=await serverRequest('/api/max/exports','POST',{...m.plan,resume:m.resume});
     if(current!==epoch)return;
     serverRun=result;
     $('saved').textContent='Папка экспорта: '+serverRun.outputPath;
     if(current!==epoch)return;
     if(stopped)throw Error('Операция остановлена');
     post({type:'stream-ack',job:m.job,key:m.key,completed:serverRun.completed});
    }else{
     const body=JSON.stringify(m.packet),bytes=new TextEncoder().encode(body),sha=await ArchiveHash.digest(bytes);
     if(current!==epoch)return;
     if(stopped)throw Error('Операция остановлена');
     status('Передаю и проверяю: '+m.packet.screens[0].name);
     const result=await serverRequest('/api/max/exports/'+serverRun.id+'/screens/'+encodeURIComponent(m.key),'PUT',body,sha);
     if(current!==epoch)return;
     if(result.verified!==true||result.screenId!==m.key||result.sha256!==sha||result.bytes!==bytes.length)throw Error('Сервер не подтвердил целостность экрана');
     post({type:'stream-ack',job:m.job,key:m.key});
    }
   }catch(e){if(current===epoch){post({type:'stream-ack',job:m.job,key:m.key,error:e.message});status(e.message);}}
  })();return;
 }
 if(m.type==='stream-finished'){
  epoch++;
  lock(false);status(m.status==='complete'?'Готово. Все выбранные экраны сохранены и проверены.':(m.error||'Выгрузка остановлена')+' Проверенные экраны сохранены. Нажмите «Экспортировать / продолжить».');return;
 }
 baseMessage(event);
};
