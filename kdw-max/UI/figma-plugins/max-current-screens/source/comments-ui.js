function installMaxCommentsUI({post,el,setBusy}){
 let source=null,sourceKey=null,report=null,busy=false,activeAbort=null;
 const say=s=>el('commentStatus').textContent=s;
 function controls(value){busy=value;for(const id of ['commentFile','figmaFile','figmaToken','fetchComments','absolutePage'])el(id).disabled=value;el('mapComments').disabled=value||!source;for(const id of ['commentsJson','commentsMd'])el(id).disabled=value||!report;}
 function validate(value){const rows=Array.isArray(value)?value:value?.comments;if(!Array.isArray(rows))throw Error('Ожидается JSON с массивом comments');if(rows.length>5000)throw Error('Максимум 5000 комментариев');return value;}
 function fileKey(value){const s=value.trim();if(/^[a-zA-Z0-9]+$/.test(s))return s;let u;try{u=new URL(s)}catch{throw Error('Укажите ссылку на файл Figma или его ключ')};if(!['www.figma.com','figma.com'].includes(u.hostname)||u.protocol!=='https:')throw Error('Нужна https-ссылка figma.com');const parts=u.pathname.split('/'),branch=parts.indexOf('branch');if(branch>=0&&/^[a-zA-Z0-9]+$/.test(parts[branch+1]??''))return parts[branch+1];if(!['file','design'].includes(parts[1])||!/^[a-zA-Z0-9]+$/.test(parts[2]??''))throw Error('Не удалось определить ключ файла');return parts[2];}
 function run(){if(!source||busy)return;report=null;setBusy(true);say('Читаем геометрию выделенного фрейма и сопоставляем ветки…');post({type:'comments-map',data:source,fileKey:sourceKey,absolutePageConfirmed:el('absolutePage').checked});}
 el('commentFile').onchange=async()=>{report=null;source=null;sourceKey=null;controls(false);const file=el('commentFile').files[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('JSON должен быть меньше 10 МБ');source=validate(JSON.parse(await file.text()));sourceKey=source.file_key??null;say('JSON загружен. Выделите общий фрейм и нажмите «Сопоставить».');controls(false);}catch(e){say('Ошибка: '+e.message);}};
 el('fetchComments').onclick=async()=>{
  if(busy)return;let token=el('figmaToken').value.trim(),key;try{key=fileKey(el('figmaFile').value);if(!token)throw Error('Введите персональный токен Figma с file_comments:read');}catch(e){say(e.message);return;}
  source=null;report=null;setBusy(true);say('Получаем комментарии из Figma…');const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),30000);activeAbort=abort;
  try{
   const r=await fetch('https://api.figma.com/v1/files/'+encodeURIComponent(key)+'/comments',{method:'GET',headers:{'X-Figma-Token':token},credentials:'omit',redirect:'error',signal:abort.signal});
   if(!r.ok)throw Error(r.status===429?'Лимит Figma API. Повторите позже.':r.status===403?'Нет доступа: проверьте токен и разрешение file_comments:read.':r.status===404?'Файл не найден или недоступен.':'Figma API: HTTP '+r.status);
   if(Number(r.headers.get('content-length'))>10*1024*1024)throw Error('Ответ больше 10 МБ');const text=await r.text();if(text.length>10*1024*1024)throw Error('Ответ больше 10 МБ');source=validate(JSON.parse(text));sourceKey=key;
  }catch(e){say(e.name==='AbortError'?'Время ожидания истекло. Повторите загрузку.':e instanceof TypeError?'Не удалось связаться с Figma API. Можно импортировать JSON.':e.message);}
  finally{clearTimeout(timer);activeAbort=null;token='';el('figmaToken').value='';setBusy(false);}
  if(source)run();
 };
 el('mapComments').onclick=run;
 function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 el('commentsJson').onclick=()=>report&&download(JSON.stringify(report.data,null,2),'max-screen-comments.json','application/json');
 el('commentsMd').onclick=()=>report&&download(report.markdown,'max-screen-comments.md','text/markdown;charset=utf-8');
 return{setBusy:controls,cancel(){activeAbort?.abort();},handle(m){
  if(m.type==='init'&&m.fileKey&&!el('figmaFile').value)el('figmaFile').value=m.fileKey;
  if(m.type==='comments-result'){report=m;setBusy(false);const s=m.data.summary;say(`Веток: ${s.threads}; комментариев с ответами: ${s.comments}.\nПривязано: ${s.matched}. Проверить: ${s.review+s.ambiguous+s.unmatched}. Вне выделения: ${s.outside}.\nJSON содержит координаты и ID экранов; MD — правки по экранам.`);el('commentPreview').textContent=m.data.threads.slice(0,100).map(t=>`${t.orderId??t.threadId} · ${t.screen?.fixtureId??t.status+' / '+t.reason}\n${t.comments[0]?.message.slice(0,180)??''}`).join('\n\n');}
  if(m.type==='comments-error'){report=null;setBusy(false);say('Ошибка: '+m.message);}
 }};
}
