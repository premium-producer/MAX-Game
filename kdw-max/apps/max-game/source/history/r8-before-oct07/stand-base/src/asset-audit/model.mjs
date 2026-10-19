export function entriesOf(catalog){
 return catalog.missions.flatMap(mission=>mission.tasks.flatMap(task=>task.screens.map(screen=>({mission,task,screen}))));
}
export const keyOf=(screenId,actionId)=>JSON.stringify([screenId,actionId]);
export function clampRect(rect,asset){
 const [x,y,w,h]=rect;
 if(![x,y,w,h,asset.width,asset.height].every(Number.isFinite)||w<=0||h<=0)throw Error('Некорректная область');
 const down=n=>Math.floor(n*100+1e-8)/100;
 const width=Math.min(asset.width,Math.max(.01,down(Math.min(w,asset.width)))),height=Math.min(asset.height,Math.max(.01,down(Math.min(h,asset.height))));
 return [Math.max(0,Math.min(Math.round(x*100)/100,down(asset.width-width))),Math.max(0,Math.min(Math.round(y*100)/100,down(asset.height-height))),width,height];
}
export function rectAt(x,y,asset){
 const w=Math.min(asset.width,Math.max(60,asset.width*.28)),h=Math.min(asset.height,Math.max(40,asset.height*.055));
 return clampRect([x-w/2,y-h/2,w,h],asset);
}
export function makeRecord(screen,action,placement,rect){
 if(!['hotspot','below-screen'].includes(placement))throw Error('Неизвестный тип действия');
 return {screenId:screen.screenId,assetId:screen.assetId,assetSha256:screen.asset.sha256,actionId:action.actionId,label:action.label,placement,...(placement==='hotspot'?{rect:clampRect(rect,screen.asset)}:{}),reviewed:true,updatedAt:new Date().toISOString()};
}
export function validateImport(value,catalog){
 if(value?.schemaVersion!==1||value.contentRevision!==catalog.contentRevision||!Array.isArray(value.records))throw Error('Файл относится к другой версии каталога или имеет неверный формат');
 const screens=new Map(entriesOf(catalog).map(e=>[e.screen.screenId,e.screen])),seen=new Set();
 return value.records.map(r=>{
  const s=screens.get(r.screenId),a=s?.actions.find(a=>a.actionId===r.actionId),key=keyOf(r.screenId,r.actionId);
  if(!a||seen.has(key)||r.assetId!==s.assetId||r.assetSha256!==s.asset.sha256||r.reviewed!==true)throw Error('Разметка не соответствует экрану: '+String(r.screenId));
  seen.add(key);
  if(r.placement==='hotspot'){
   if(!Array.isArray(r.rect)||r.rect.length!==4)throw Error('Неверный прямоугольник');
   const [x,y,w,h]=r.rect;
   if(!r.rect.every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>s.asset.width||y+h>s.asset.height)throw Error('Область выходит за изображение');
  }
  const record=makeRecord(s,a,r.placement,r.rect);
  if(typeof r.updatedAt==='string'&&Number.isFinite(Date.parse(r.updatedAt)))record.updatedAt=r.updatedAt;
  return record;
 });
}

export function validateDocument(value,catalog){
 if(![1,2].includes(value?.schemaVersion))throw Error('Неверный формат разметки');
 const records=validateImport({...value,schemaVersion:1},catalog);
 const screens=value.schemaVersion===1?[]:value.screens;
 if(!Array.isArray(screens))throw Error('Отсутствуют настройки экранов');
 const entries=entriesOf(catalog),seen=new Set(),finals=new Set();
 const settings=screens.map(r=>{
  const e=entries.find(e=>e.task.taskId===r.taskId&&e.screen.screenId===r.screenId);
  if(!e||seen.has(r.screenId)||r.assetId!==e.screen.assetId||r.assetSha256!==e.screen.asset?.sha256||typeof r.enabled!=='boolean'||typeof r.final!=='boolean')throw Error('Некорректная настройка экрана: '+String(r.screenId));
  seen.add(r.screenId);
  if(r.final){if(!r.enabled)throw Error('Финальный экран должен быть активным');if(finals.has(r.taskId))throw Error('У задания может быть только один назначенный финальный экран');finals.add(r.taskId);}
  return {taskId:r.taskId,screenId:r.screenId,assetId:r.assetId,assetSha256:r.assetSha256,enabled:r.enabled,final:r.final,updatedAt:typeof r.updatedAt==='string'&&Number.isFinite(Date.parse(r.updatedAt))?r.updatedAt:new Date().toISOString()};
 });
 const byId=new Map(settings.map(r=>[r.screenId,r]));
 for(const mission of catalog.missions)for(const task of mission.tasks)if(task.screens.every(s=>byId.get(s.screenId)?.enabled===false))throw Error('В задании должен остаться хотя бы один активный экран: '+task.title);
 return {schemaVersion:2,contentRevision:catalog.contentRevision,records,screens:settings};
}
