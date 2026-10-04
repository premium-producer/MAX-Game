/* Review export owns its request lifecycle; never starts the game renderer. */
let reviewRunning=false,reviewController=null,reviewRequest=0,reviewDownloadUrl=null,reviewWaiting=false;
function reviewStatus(text,error=false){$('review-status').textContent=text;$('review-status').dataset.error=String(error);}
function reviewLock(lock){reviewRunning=lock;for(const id of ['review-export','review-file','review-token','review-import','review-page','edition','mission','scope','editable','reference'])$(id).disabled=lock;$('review-cancel').disabled=!lock;$('run').disabled=lock||active;$('review-export').disabled=lock||active;}
function reviewKey(value){const text=value.trim();if(/^[A-Za-z0-9_-]{5,200}$/.test(text))return text;let url;try{url=new URL(text);}catch{throw Error('Вставьте ссылку на файл Figma');}if(!['www.figma.com','figma.com'].includes(url.hostname))throw Error('Нужна ссылка figma.com');const parts=url.pathname.split('/');if(!['design','file','board','proto'].includes(parts[1])||!parts[2])throw Error('Не удалось определить файл Figma');const branchIndex=parts.indexOf('branch');return parts[branchIndex>=0?branchIndex+1:2];}
async function reviewComments(fileKey,signal){
 const imported=$('review-import').files?.[0];
 if(imported){$('review-token').value='';if(imported.size>20*1024*1024)throw Error('JSON комментариев превышает 20 МБ');const data=JSON.parse(await imported.text());const comments=Array.isArray(data)?data:data.comments;if(!Array.isArray(comments))throw Error('В JSON ожидается массив comments');return {comments,fetchedAt:null};}
 const token=$('review-token').value.trim();
 if(!token)throw Error('Введите токен Figma с правом file_comments:read или выберите JSON комментариев');
 try{
  const response=await fetch(`https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/comments`,{headers:{'X-Figma-Token':token},signal,credentials:'omit',redirect:'error'});
  if(!response.ok){const errors={401:'Токен недействителен',403:'Нет доступа к комментариям. Проверьте токен, file_comments:read и доступ к файлу',404:'Файл Figma не найден',429:'Figma ограничила частоту запросов. Повторите позже'};throw Error(errors[response.status]||`Figma API: HTTP ${response.status}`);}
  const text=await response.text();if(text.length>20*1024*1024)throw Error('Ответ Figma превышает 20 МБ');const data=JSON.parse(text);if(!Array.isArray(data.comments))throw Error('Figma вернула некорректный список комментариев');
  return {comments:data.comments,fetchedAt:new Date().toISOString()};
 }finally{$('review-token').value='';}
}
$('review-export').onclick=async()=>{
 if(reviewRunning||active)return;
 if(isPreview){reviewStatus('Запустите плагин в Figma и выделите экраны',true);return;}
 let fileKey;try{fileKey=reviewKey($('review-file').value);}catch(error){reviewStatus(error.message,true);return;}
 reviewLock(true);reviewWaiting=false;reviewController=new AbortController();const requestId=++reviewRequest;
 const timeout=setTimeout(()=>reviewController?.abort(),45000);
 try{
  reviewStatus('Получаю комментарии…');const {comments,fetchedAt}=await reviewComments(fileKey,reviewController.signal);clearTimeout(timeout);
  if(requestId!==reviewRequest||reviewController.signal.aborted)throw Error('Экспорт остановлен');
  reviewWaiting=true;reviewStatus(`Комментарии получены: ${comments.length}. Читаю выделенные экраны и сопоставляю позиции…`);
  post({type:'review-export',requestId,fileKey,comments,fetchedAt,assumeCurrentPage:$('review-page').checked});
 }catch(error){clearTimeout(timeout);reviewStatus(error.name==='AbortError'?'Запрос остановлен или истекло время ожидания':error.message,true);reviewController=null;reviewLock(false);}
};
$('review-cancel').onclick=()=>{if(!reviewRunning)return;reviewController?.abort();$('review-token').value='';if(reviewWaiting){post({type:'review-cancel',requestId:reviewRequest});reviewStatus('Останавливаю экспорт…');}else reviewStatus('Останавливаю запрос…');};
window.addEventListener('message',event=>{
 const message=event.data?.pluginMessage;if(!message)return;
 if(message.type==='review-init'){if(message.fileKey&&!$('review-file').value)$('review-file').value=message.fileKey;return;}
 if(!reviewRunning||message.requestId!==reviewRequest)return;
 if(message.type==='review-result'){
  try{
   if(reviewDownloadUrl)URL.revokeObjectURL(reviewDownloadUrl);
   const json=JSON.stringify(message.result,null,2);reviewDownloadUrl=URL.createObjectURL(new Blob([json+'\n'],{type:'application/json'}));
   const link=$('review-download');link.href=reviewDownloadUrl;link.download='max-review.json';link.hidden=false;link.click();
   const summary=message.result.summary;reviewStatus(`Готово: ${summary.screens} экранов, ${summary.comments} комментариев. Без однозначной привязки: ${message.result.unassignedCommentIds.length}. Всё в одном max-review.json.`);
  }catch(error){reviewStatus('Не удалось сохранить JSON: '+error.message,true);}
  reviewWaiting=false;reviewController=null;reviewLock(false);
 }
 if(message.type==='review-error'){reviewStatus(message.error,true);reviewWaiting=false;reviewController=null;reviewLock(false);}
});
if(!isPreview)post({type:'review-init'});
