import {migrateFlowDocument, validateFlowDocument, DEFAULT_AUTO_DELAY_MS} from './flow-document.mjs';
import {validateDocument} from './model.mjs';

export function readEditorDocument(value,catalog){
 const {revision,exportedAt,...document}=value;
 return migrateFlowDocument(document,catalog);
}
export const findFlowScreen=(document,screenId)=>document.tasks.flatMap(t=>t.screens).find(s=>s.screenId===screenId);
export function recoveryConfirmation(value,baseRevision,currentRevision){
 const legacy=value.schemaVersion!==3;
 const mismatch=legacy||typeof baseRevision!=='string'||baseRevision!==currentRevision;
 return (mismatch?'Внимание: черновик сделан для другой или неизвестной версии. На сервере могут быть более новые правки. ':'')+
  (legacy?'Это черновик старого редактора v1/v2. Его явно указанные разметки и флаги заменят соответствующие значения текущего черновика; добавленные зоны и кнопки v3 сохранятся. ':'Это полная копия v3. Она заменит весь текущий черновик, включая зоны, кнопки, таймеры, удаления и тексты. ')+
  'Восстановленные изменения будут сохранены на сервере автоматически. Продолжить? Отмена ничего не изменяет.';
}
export function newInteraction(kind,screen,task,id,rect){
 if(kind==='timer'&&screen.interactions.some(i=>i.kind==='timer'))throw Error('На экране уже есть автопереход');
 const index=task.screens.findIndex(s=>s.screenId===screen.screenId);
 const target=screen.final||index===task.screens.length-1?{kind:'complete-task'}:{kind:'screen',screenId:task.screens[index+1].screenId};
 return {interactionId:id,enabled:kind!=='timer',kind,target,...(kind==='hotspot'?{name:'Новая зона',rect}:kind==='button'?{label:'Далее',order:screen.interactions.filter(i=>i.kind==='button').length}:{delayMs:DEFAULT_AUTO_DELAY_MS})};
}
export function deleteInteraction(screen,id){
 const item=screen.interactions.find(i=>i.interactionId===id);
 screen.interactions=screen.interactions.filter(i=>i.interactionId!==id);
 if(item?.sourceActionId&&!screen.interactions.some(i=>i.sourceActionId===item.sourceActionId)&&!screen.deletedSourceActionIds.includes(item.sourceActionId))screen.deletedSourceActionIds.push(item.sourceActionId);
}
// A v3 import replaces its complete document (including explicit deletions).
// Legacy imports patch only the records/settings actually present in that file.
export function importEditorDocument(current,value,catalog){
 if(value.schemaVersion===3)return readEditorDocument(value,catalog);
 const legacy=validateDocument(value,catalog),migrated=migrateFlowDocument(legacy,catalog),next=structuredClone(current);
 for(const record of legacy.records){
  const screen=findFlowScreen(next,record.screenId),source=findFlowScreen(migrated,record.screenId);
  const replacement=source.interactions.find(i=>i.interactionId===record.actionId);
  const at=screen.interactions.findIndex(i=>i.interactionId===record.actionId);
  if(at<0)screen.interactions.push(replacement);else screen.interactions[at]=replacement;
  screen.deletedSourceActionIds=screen.deletedSourceActionIds.filter(id=>id!==record.actionId);
  for(const i of screen.interactions)if(i.kind==='timer'&&i.sourceActionId===record.actionId)i.enabled=false;
 }
 for(const flags of legacy.screens){
  const task=next.tasks.find(t=>t.taskId===flags.taskId),screen=findFlowScreen(next,flags.screenId);
  if(flags.final)for(const sibling of task.screens)sibling.final=false;
  screen.enabled=flags.enabled;screen.final=flags.final;
 }
 return validateFlowDocument(next,catalog);
}
