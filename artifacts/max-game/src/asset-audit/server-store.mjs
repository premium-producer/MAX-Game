import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {writeFile} from 'atomically';
import {validateDocument} from './model.mjs';
import {migrateFlowDocument,validateFlowDocument} from './flow-document.mjs';
import {mergeFlowDocuments,flowDocumentsEqual} from './collaboration.mjs';
import {createCardLocks,changedCardIds,changedLegacyCardIds} from './card-locks.mjs';

const fail=(status,message)=>Object.assign(Error(message),{status});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

// One Stand Service owns the file. atomically implements durable replacement,
// queuing and Windows retries; CAS/validation belong to the application boundary.
export function createAssetAuditStore({file,catalogFile,flowFile=path.join(path.dirname(file),'flow-v3.json'),write=writeFile,cardLockOptions}){
 if([file,catalogFile].some(value=>path.resolve(value)===path.resolve(flowFile)))throw Error('Flow file must be separate from legacy annotations and catalog');
 let queue=Promise.resolve();
 const cardLocks=createCardLocks(cardLockOptions);
 const serial=operation=>{const next=queue.then(operation);queue=next.catch(()=>{});return next;};
 async function readOptional(filename){try{return await fs.readFile(filename);}catch(error){if(error.code!=='ENOENT')throw error;return null;}}
 async function load(){
  const catalog=JSON.parse(await fs.readFile(catalogFile,'utf8'));
  let bytes;try{bytes=await fs.readFile(file);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!bytes)return {catalog,document:{schemaVersion:2,contentRevision:catalog.contentRevision,revision:'0',records:[],screens:[]}};
  try{return {catalog,document:{...validateDocument(JSON.parse(bytes.toString()),catalog),revision:hash(bytes)}};}
  catch(error){throw fail(409,'Сохранённая разметка требует проверки: '+error.message);}
 }
 async function loadFlow(){
  const bytes=await readOptional(flowFile);
  if(bytes){
   const catalog=JSON.parse(await fs.readFile(catalogFile,'utf8'));
   try{return {catalog,document:{...validateFlowDocument(JSON.parse(bytes.toString()),catalog),revision:hash(bytes)}};}
   catch(error){throw fail(409,'Сохранённый сценарий требует проверки: '+error.message);}
  }
  const {catalog,document:legacy}=await load();
  try{return {catalog,document:{...migrateFlowDocument(legacy,catalog),revision:`legacy:${legacy.revision}`}};}
  catch(error){throw fail(409,'Существующая разметка не перенесена: '+error.message);}
 }
 return {
  close:()=>queue,
  read:()=>serial(async()=>(await load()).document),
  readFlow:()=>serial(async()=>(await loadFlow()).document),
  readCardLocks:clientId=>serial(()=>cardLocks.list(clientId)),
  mutateCardLock:(input,clientId)=>serial(async()=>{
   const catalog=JSON.parse(await fs.readFile(catalogFile,'utf8'));
   if(!catalog.missions.some(m=>m.tasks.some(t=>t.screens.some(s=>s.screenId===input?.screenId))))throw fail(400,'Неизвестный экран');
   return cardLocks.mutate(input,clientId);
  }),
  save:(input,context)=>serial(async()=>{
   await cardLocks.guard([],context);
   if(await readOptional(flowFile))throw fail(409,'Сценарий уже обновлён до v3. Откройте новый редактор.');
   const {catalog,document:current}=await load();
   if(input?.expectedRevision!==current.revision)throw fail(409,'Разметка уже изменена в другом окне. Сохраните резервную копию и обновите страницу.');
   let next;try{next=validateDocument(input.document,catalog);}catch(error){throw fail(400,error.message);}
   await cardLocks.guard(changedLegacyCardIds(current,next,catalog),context);
   const bytes=JSON.stringify(next,null,2)+'\n';
   await fs.mkdir(path.dirname(file),{recursive:true});
   await write(file,bytes,{fsync:true});
   return {...next,revision:hash(bytes)};
  }),
  saveFlow:(input,context)=>serial(async()=>{
   await cardLocks.guard([],context);
   const {catalog,document:current}=await loadFlow();
   if(input?.expectedRevision!==current.revision)throw fail(409,'Сценарий уже изменён в другом окне. Сохраните резервную копию и обновите страницу.');
   let next;try{next=validateFlowDocument(input.document,catalog);}catch(error){throw fail(400,error.message);}
   await cardLocks.guard(changedCardIds(current,next,catalog),context);
   const bytes=JSON.stringify(next,null,2)+'\n';
   await fs.mkdir(path.dirname(flowFile),{recursive:true});
   await write(flowFile,bytes,{fsync:true});
   return {...next,revision:hash(bytes)};
  }),
  saveMergedFlow:(input,context)=>serial(async()=>{
   await cardLocks.guard([],context);
   const {catalog,document:current}=await loadFlow();
   const {revision,...remote}=current;
   let base,local;
   try{base=validateFlowDocument(input?.baseDocument,catalog);local=validateFlowDocument(input?.document,catalog);}
   catch(error){throw fail(400,error.message);}
   const conflict=conflicts=>Object.assign(fail(409,'Изменения пересекаются с правками другого участника'),{
    code:'FLOW_MERGE_CONFLICT',conflicts,currentDocument:current
   });
   const constraintsConflict=()=>conflict([{key:'document',label:'Совместные изменения нарушают ограничения сценария. Проверьте таймеры, финалы и удалённые действия.',base:null,local:null,remote:null}]);
   let merged;
   try{merged=mergeFlowDocuments(base,local,remote);}
   catch(error){if(error.code==='FLOW_MERGE_INVARIANT')throw constraintsConflict();throw fail(400,error.message);}
   if(merged.conflicts.length)throw conflict(merged.conflicts);
   let next;
   try{next=validateFlowDocument(merged.document,catalog);}
   catch{
    // Both edits were independently valid, but their combination can violate
    // constraints such as one timer per screen or one final screen per task.
    throw constraintsConflict();
   }
   await cardLocks.guard(changedCardIds(remote,next,catalog),context);
   if(flowDocumentsEqual(next,remote))return current;
   const bytes=JSON.stringify(next,null,2)+'\n';
   await fs.mkdir(path.dirname(flowFile),{recursive:true});
   await write(flowFile,bytes,{fsync:true});
   return {...next,revision:hash(bytes)};
  })
 };
}
