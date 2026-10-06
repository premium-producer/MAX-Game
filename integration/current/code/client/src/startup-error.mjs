// Error.cause retains the browser's original failure through SessionPort.
// Report types only: never serialize saved progress or arbitrary error payloads.
export function startupErrorText(error){
 const chain=[],seen=new Set();
 for(let e=error;e&&typeof e==='object'&&!seen.has(e)&&chain.length<8;e=e.cause){
  seen.add(e);
  const type=typeof e.code==='string'?e.code:e.name;
  if(typeof type==='string'&&/^[\w.-]{1,80}$/.test(type)&&chain.at(-1)!==type)chain.push(type);
 }
 const quota=chain.includes('QuotaExceededError')||chain.includes('NS_ERROR_DOM_QUOTA_REACHED');
 const denied=chain.includes('SecurityError')||chain.includes('NotAllowedError');
 const invalid=chain.includes('INVALID_SAVED_SESSION')||chain.includes('SyntaxError');
 const reason=quota?'Браузер сообщил о переполнении локального хранилища.':denied?'Браузер запретил доступ к локальному хранилищу.':invalid?'Не удалось прочитать формат сохранения.':'Причина запуска требует проверки по коду ниже.';
 return `Не удалось запустить MAX.\n${reason}\nДиагностика: ${chain.join(' → ')||'UNKNOWN_ERROR'}\nСохранения не сбрасывались. Пришлите этот код ошибки; не очищайте данные сайта.`;
}
