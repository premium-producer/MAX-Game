import jsonPatch from 'fast-json-patch';

const clone=value=>structuredClone(value);
// Whole editor objects are atomic values. JSON Patch compares canonical strings,
// so its test operation protects the entire rectangle/target, not one nested field.
const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)
 ?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
const keyOf=(...parts)=>JSON.stringify(parts);
const identity=document=>canonical({schemaVersion:document.schemaVersion,sourceContentRevision:document.sourceContentRevision,
 missions:document.missions.map(m=>m.missionId).sort(),tasks:document.tasks.map(t=>({taskId:t.taskId,
 screens:t.screens.map(s=>({screenId:s.screenId,assetId:s.assetId,assetSha256:s.assetSha256})).sort((a,b)=>a.screenId.localeCompare(b.screenId))
 })).sort((a,b)=>a.taskId.localeCompare(b.taskId))});

function slots(document,groupedSources,timerIds){
 const values={},labels={};
 const put=(parts,value,label)=>{const key=keyOf(...parts);values[key]=canonical(value);labels[key]=label;};
 for(const mission of document.missions)put(['mission',mission.missionId,'helpText'],mission.helpText,`Справка миссии ${mission.missionId}`);
 for(const task of document.tasks){
  put(['task',task.taskId,'helpText'],task.helpText,`Справка задания ${task.taskId}`);
  put(['task',task.taskId,'startScreenId'],task.startScreenId,`Старт задания ${task.taskId}`);
  put(['task',task.taskId,'finalScreenId'],task.screens.find(s=>s.final)?.screenId??null,`Финальный экран задания ${task.taskId}`);
  for(const screen of task.screens){
   for(const field of ['enabled','help'])put(['screen',task.taskId,screen.screenId,field],screen[field],`${screen.screenId}: ${field==='enabled'?'активность':'справка'}`);
   const groups=groupedSources.get(keyOf(task.taskId,screen.screenId))||new Set();
   const timers=timerIds.get(keyOf(task.taskId,screen.screenId))||new Set();
   for(const item of screen.interactions)if(!timers.has(item.interactionId)&&!groups.has(item.sourceActionId))put(['interaction',task.taskId,screen.screenId,item.interactionId],item,`${screen.screenId}: ${item.name||item.label||'действие'}`);
   put(['timer',task.taskId,screen.screenId],screen.interactions.filter(i=>timers.has(i.interactionId)).sort((a,b)=>a.interactionId.localeCompare(b.interactionId)),`${screen.screenId}: автопереход`);
   // A deleted source action and every surviving copy of it form one deletion
   // unit. This prevents deletion racing with an edit/addition from resurrecting
   // a partial action or leaving an interaction beside its deletion tombstone.
   for(const id of groups)put(['source',task.taskId,screen.screenId,id],{
    interactions:screen.interactions.filter(i=>!timers.has(i.interactionId)&&i.sourceActionId===id).sort((a,b)=>a.interactionId.localeCompare(b.interactionId)),
    deleted:screen.deletedSourceActionIds.includes(id)
   },`${screen.screenId}: удаление или изменение ${id}`);
  }
 }
 return {values,labels};
}

function restore(remote,values){
 const result=clone(remote);
 const get=(...parts)=>{const value=values[keyOf(...parts)];return value==null?null:JSON.parse(value);};
 for(const mission of result.missions)mission.helpText=get('mission',mission.missionId,'helpText');
 for(const task of result.tasks){
  task.helpText=get('task',task.taskId,'helpText');task.startScreenId=get('task',task.taskId,'startScreenId');
  for(const screen of task.screens){
   for(const field of ['enabled','help'])screen[field]=get('screen',task.taskId,screen.screenId,field);
   screen.final=get('task',task.taskId,'finalScreenId')===screen.screenId;
   // Keep the remote display order. IDs newly introduced by this edit are appended
   // in a deterministic order; array reordering is not an implicit edit operation.
   const ids=(kind,existing)=>{
    const present=Object.keys(values).filter(key=>values[key]!==null).map(key=>JSON.parse(key))
     .filter(parts=>parts[0]===kind&&parts[1]===task.taskId&&parts[2]===screen.screenId).map(parts=>parts[3]);
    return [...existing.filter(id=>present.includes(id)),...present.filter(id=>!existing.includes(id)).sort()];
   };
   const interactions=ids('interaction',[]).map(id=>get('interaction',task.taskId,screen.screenId,id));
   const deleted=[];
   for(const id of ids('source',[])){
    const source=get('source',task.taskId,screen.screenId,id);interactions.push(...source.interactions);
    if(source.deleted)deleted.push(id);
   }
   interactions.push(...get('timer',task.taskId,screen.screenId));
   const byId=new Map(interactions.map(item=>[item.interactionId,item]));
   if(byId.size!==interactions.length)throw Object.assign(Error('Совместное изменение типа или источника действия требует проверки'),{code:'FLOW_MERGE_INVARIANT'});
   const ordered=[...screen.interactions.map(item=>item.interactionId).filter(id=>byId.has(id)),...interactions.map(item=>item.interactionId).filter(id=>!screen.interactions.some(item=>item.interactionId===id)).sort()];
   screen.interactions=ordered.map(id=>byId.get(id));
   const retainedDeletes=deleted.filter(id=>!screen.interactions.some(item=>item.sourceActionId===id));
   screen.deletedSourceActionIds=[...screen.deletedSourceActionIds.filter(id=>retainedDeletes.includes(id)),...retainedDeletes.filter(id=>!screen.deletedSourceActionIds.includes(id)).sort()];
  }
 }
 return result;
}

/** Three-way optimistic merge using RFC 6902 tests, with stable IDs instead of array indices.
 * Inputs are validated schema-v3 documents. This function never mutates them.
 * Without resolution, conflicting slots retain the local draft and are reported.
 * Explicit resolution affects only conflicts, leaving independent edits intact.
 */
export function mergeFlowDocuments(base,local,remote,{resolution,preferLocal=false}={}){
 if(resolution!==undefined&&!['local','remote'].includes(resolution))throw Error('Unknown flow conflict resolution');
 const originalIdentity=identity(base);
 if(originalIdentity!==identity(local)||originalIdentity!==identity(remote))throw Object.assign(Error('Нельзя объединить разные каталоги или состав экранов'),{code:'FLOW_MERGE_IDENTITY'});
 const groupedSources=new Map(),timerIds=new Map();
 for(const document of [base,local,remote])for(const task of document.tasks)for(const screen of task.screens){
  const key=keyOf(task.taskId,screen.screenId),ids=groupedSources.get(key)||new Set();
  for(const id of screen.deletedSourceActionIds)ids.add(id);
  groupedSources.set(key,ids);
  const timers=timerIds.get(key)||new Set();for(const item of screen.interactions)if(item.kind==='timer')timers.add(item.interactionId);
  timerIds.set(key,timers);
 }
 const b=slots(base,groupedSources,timerIds),l=slots(local,groupedSources,timerIds),r=slots(remote,groupedSources,timerIds);
 const keys=new Set([...Object.keys(b.values),...Object.keys(l.values),...Object.keys(r.values)]);
 // Real null placeholders make concurrent additions testable; JSON Patch add alone
 // would otherwise overwrite an independently added ID without a precondition.
 for(const key of keys)for(const values of [b.values,l.values,r.values])if(!Object.hasOwn(values,key))values[key]=null;
 const merged=clone(r.values),conflicts=[],patch=jsonPatch.compare(b.values,l.values,true);
 for(let index=0;index<patch.length;index+=2){
  const test=patch[index],change=patch[index+1];
  if(test?.op!=='test'||change?.op!=='replace'||test.path!==change.path)throw Error('Unexpected collaboration patch');
  const key=jsonPatch.unescapePathComponent(change.path.slice(1));
  if(merged[key]===l.values[key])continue; // A retry after a lost acknowledgement.
  try{jsonPatch.applyPatch(merged,[test,change],true,true,true);}
  catch(error){
   if(error.name!=='TEST_OPERATION_FAILED')throw error;
   const chosen=resolution??(preferLocal?'local':undefined);
   if(!chosen)conflicts.push({key,label:l.labels[key]||r.labels[key]||b.labels[key],
    base:b.values[key]===null?null:JSON.parse(b.values[key]),local:l.values[key]===null?null:JSON.parse(l.values[key]),remote:r.values[key]===null?null:JSON.parse(r.values[key])});
   if(chosen!=='remote')merged[key]=l.values[key];
  }
 }
 return {document:restore(remote,merged),conflicts};
}

export const flowDocumentsEqual=(first,second)=>jsonPatch.compare(first,second).length===0;
