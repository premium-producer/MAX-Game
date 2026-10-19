import Ajv from 'ajv';
import graphlib from '@dagrejs/graphlib';
import {entriesOf, keyOf, validateDocument} from './model.mjs';

export const DEFAULT_AUTO_DELAY_MS = 500;
const id = {type:'string',minLength:1,maxLength:256};
const text = {type:'string',maxLength:10000};
const object = (properties,required=Object.keys(properties)) => ({type:'object',properties,required,additionalProperties:false});
const array = (items,maxItems) => ({type:'array',items,maxItems});
const target = {anyOf:[{type:'null'},object({kind:{const:'screen'},screenId:id}),object({kind:{const:'complete-task'}})]};
const interactionProperties = {
 interactionId:id,enabled:{type:'boolean'},kind:{enum:['hotspot','button','timer']},target,
 sourceActionId:id,semanticRef:id,name:{type:'string',maxLength:500},
 rect:{type:'array',items:{type:'number'},minItems:4,maxItems:4},
 label:{type:'string',maxLength:2000},order:{type:'integer',minimum:0,maximum:10000},
 delayMs:{type:'integer',minimum:0,maximum:86400000},
};
export const FLOW_DOCUMENT_SCHEMA = {
 $schema:'http://json-schema.org/draft-07/schema#',
 ...object({schemaVersion:{const:3},sourceContentRevision:id,
  missions:array(object({missionId:id,helpText:{anyOf:[text,{type:'null'}]}}),32),
  tasks:array(object({taskId:id,startScreenId:id,helpText:{anyOf:[text,{type:'null'}]},screens:array(object({
   screenId:id,assetId:id,assetSha256:{type:'string',pattern:'^[a-f0-9]{64}$'},
   enabled:{type:'boolean'},final:{type:'boolean'},
   help:object({mode:{enum:['inherit','override','hide']},text}),
   interactions:array(object(interactionProperties,['interactionId','enabled','kind','target']),128),
   deletedSourceActionIds:array(id,128),
  }),256)}),64),
 }),
};
const schemaCheck = new Ajv({strict:true,allErrors:true,coerceTypes:false,useDefaults:false,removeAdditional:false}).compile(FLOW_DOCUMENT_SCHEMA);
function fail(message,code='FLOW_INVALID') { const error = new Error(message); error.code=code; throw error; }
function unique(values,label) { if(new Set(values).size!==values.length)fail(`Повторный ID: ${label}`); }
function sameSet(actual,expected,label) {
 unique(actual,label);
 if(actual.length!==expected.length||actual.some(id=>!expected.includes(id)))fail(`Неполный или неизвестный состав: ${label}`);
}
const protectedOutcome = outcome => !['navigate','complete-task'].includes(outcome.kind) || Object.keys(outcome).some(k=>!['kind','screenId'].includes(k));
function outcomeTarget(outcome) {
 if(['navigate','skip-screen'].includes(outcome.kind))return {kind:'screen',screenId:outcome.screenId};
 return outcome.kind==='complete-task'?{kind:'complete-task'}:null;
}
const equalTarget=(a,b)=>a?.kind===b?.kind&&a?.screenId===b?.screenId;
function catalogIndex(catalog) {
 return {tasks:new Map(catalog.missions.flatMap(m=>m.tasks.map(t=>[t.taskId,t]))),
  screens:new Map(entriesOf(catalog).map(e=>[e.screen.screenId,e.screen]))};
}

/** Read-only legacy migration. Disabled destinations remain explicit for review. */
export function migrateFlowDocument(legacy,auditCatalog) {
 if(legacy?.schemaVersion===3)return validateFlowDocument(legacy,auditCatalog);
 const valid=validateDocument(legacy,auditCatalog);
 const records=new Map(valid.records.map(r=>[keyOf(r.screenId,r.actionId),r]));
 const settings=new Map(valid.screens.map(s=>[s.screenId,s]));
 const document={schemaVersion:3,sourceContentRevision:auditCatalog.contentRevision,
  missions:auditCatalog.missions.map(m=>({missionId:m.missionId,helpText:null})),tasks:[]};
 for(const mission of auditCatalog.missions)for(const task of mission.tasks){
  document.tasks.push({taskId:task.taskId,startScreenId:task.startScreenId,helpText:null,screens:task.screens.map(screen=>{
   const setting=settings.get(screen.screenId),reviewed=screen.actions.some(a=>records.has(keyOf(screen.screenId,a.actionId)));
   const automatic=screen.automaticMs!=null&&!reviewed;
   const actionInteraction=(action,index,timer=false)=>{
    const r=records.get(keyOf(screen.screenId,action.actionId));
    let outcome=action.outcome;
    if(setting?.final&&['navigate','skip-screen'].includes(outcome.kind)){
     if(outcome.answer)fail(`Финал скрыл бы смысловое действие: ${screen.screenId}`);
     outcome={kind:'complete-task'};
    }
    const isProtected=protectedOutcome(action.outcome);
    const placement=r?.placement??action.placement;
    const kind=timer?'timer':placement==='hotspot'?'hotspot':'button';
    return {interactionId:timer?`auto:${action.actionId}`:action.actionId,enabled:timer||!automatic,kind,
     target:outcomeTarget(outcome),sourceActionId:action.actionId,...(isProtected?{semanticRef:action.actionId}:{}),
     ...(kind==='timer'?{delayMs:screen.automaticMs}:kind==='hotspot'?{name:action.label,rect:[...(r?.rect??action.rect)]}:{label:action.label,order:index})};
   };
   const interactions=screen.actions.map((a,i)=>actionInteraction(a,i));
   if(automatic){if(!screen.actions[0])fail(`Автоэкран без исходного действия: ${screen.screenId}`);interactions.push(actionInteraction(screen.actions[0],0,true));}
   return {screenId:screen.screenId,assetId:screen.assetId,assetSha256:screen.asset.sha256,
    enabled:setting?.enabled??true,final:setting?.final??false,
    help:{mode:'override',text:screen.instruction??''},interactions,deletedSourceActionIds:[]};
  })});
 }
 return validateFlowDocument(document,auditCatalog);
}

/** Strict shape/provenance validation. Drafts can retain incomplete routes. No input mutations. */
export function validateFlowDocument(value,auditCatalog,{publish=false}={}) {
 let bytes;
 try{bytes=new TextEncoder().encode(JSON.stringify(value)).length;}catch{fail('Документ не является JSON');}
 if(bytes>1048576)fail('Документ превышает 1 MiB');
 if(!schemaCheck(value))fail('Неверный формат v3: '+schemaCheck.errors.map(e=>`${e.instancePath} ${e.message}`).join('; '),'FLOW_SCHEMA');
 if(value.sourceContentRevision!==auditCatalog.contentRevision)fail('Документ относится к другой версии каталога');
 const index=catalogIndex(auditCatalog);
 sameSet(value.missions.map(m=>m.missionId),auditCatalog.missions.map(m=>m.missionId),'missions');
 sameSet(value.tasks.map(t=>t.taskId),[...index.tasks.keys()],'tasks');
 for(const task of value.tasks){
  const original=index.tasks.get(task.taskId);
  sameSet(task.screens.map(s=>s.screenId),original.screens.map(s=>s.screenId),task.taskId);
  if(task.screens.filter(s=>s.final).length>1)fail(`Несколько финальных экранов: ${task.taskId}`);
  for(const screen of task.screens){
   const source=index.screens.get(screen.screenId);
   if(screen.assetId!==source.assetId||screen.assetSha256!==source.asset.sha256)fail(`Изменён ассет: ${screen.screenId}`);
   unique(screen.interactions.map(i=>i.interactionId),screen.screenId);
   unique(screen.deletedSourceActionIds,screen.screenId+' tombstones');
   if(screen.interactions.filter(i=>i.kind==='timer').length>1)fail(`Несколько таймеров: ${screen.screenId}`);
   for(const id of screen.deletedSourceActionIds)if(!source.actions.some(a=>a.actionId===id))fail(`Неизвестное удалённое действие: ${id}`);
   for(const action of source.actions){
    const retained=screen.interactions.some(i=>i.sourceActionId===action.actionId),deleted=screen.deletedSourceActionIds.includes(action.actionId);
    if(retained===deleted)fail(`Исходное действие должно сохраняться либо быть явно удалено: ${action.actionId}`);
   }
   for(const interaction of screen.interactions){
    const action=source.actions.find(a=>a.actionId===interaction.sourceActionId);
    if(interaction.sourceActionId&&!action)fail(`Неизвестное исходное действие: ${interaction.sourceActionId}`);
    if(interaction.semanticRef&&(!action||interaction.semanticRef!==action.actionId||!protectedOutcome(action.outcome)))fail('Неизвестный смысловой эффект');
    if(action&&protectedOutcome(action.outcome)){
     if(interaction.semanticRef!==action.actionId||!equalTarget(interaction.target,outcomeTarget(action.outcome)))fail(`Смысловое действие изменено: ${action.actionId}`);
    }
    if(interaction.kind==='hotspot'){
     const rect=interaction.rect;
     if(!rect||rect[0]<0||rect[1]<0||rect[2]<=0||rect[3]<=0||rect[0]+rect[2]>source.asset.width||rect[1]+rect[3]>source.asset.height)fail(`Область выходит за изображение: ${interaction.interactionId}`);
     if(interaction.label!==undefined||interaction.order!==undefined||interaction.delayMs!==undefined)fail('Лишние поля зоны');
    }else if(interaction.kind==='button'){
     if(typeof interaction.label!=='string'||interaction.order===undefined||interaction.rect!==undefined||interaction.delayMs!==undefined)fail('Неверные поля кнопки');
    }else if(interaction.delayMs===undefined||interaction.rect!==undefined||interaction.label!==undefined||interaction.order!==undefined)fail('Неверные поля таймера');
   }
  }
  if(publish)validatePublishedTask(task,index.screens);
 }
 return structuredClone(value);
}

function validatePublishedTask(task,sources){
 const active=task.screens.filter(s=>s.enabled),byId=new Map(active.map(s=>[s.screenId,s]));
 if(!active.length||!byId.has(task.startScreenId))fail(`Нет активного стартового экрана: ${task.taskId}`,'FLOW_GRAPH');
 if(task.screens.some(s=>s.final&&!s.enabled))fail('Финальный экран отключён','FLOW_GRAPH');
 const graph=new graphlib.Graph({directed:true}),reverse=new graphlib.Graph({directed:true});
 // Graphlib keys are strings: reserve an exit key that cannot collide with screen IDs.
 let exit='__flow_exit__';while(task.screens.some(s=>s.screenId===exit))exit+='_' ;
 for(const id of [exit,...byId.keys()]){graph.setNode(id);reverse.setNode(id);}
 for(const screen of active){
  const interactions=screen.interactions.filter(i=>i.enabled),zones=interactions.filter(i=>i.kind==='hotspot');
  for(const interaction of interactions){
   if(interaction.kind==='timer'&&interaction.delayMs<=0)fail('Задержка автоперехода должна быть положительной','FLOW_GRAPH');
   if(interaction.kind==='button'&&!interaction.label.trim())fail('У активной кнопки нет текста','FLOW_GRAPH');
   if(interaction.target===null&&!interaction.semanticRef)fail(`Не задано назначение: ${interaction.interactionId}`,'FLOW_GRAPH');
   if(interaction.target?.kind==='screen'&&!byId.has(interaction.target.screenId))fail(`Назначение отсутствует или отключено: ${interaction.target.screenId}`,'FLOW_GRAPH');
   const destination=interaction.target?.kind==='complete-task'?exit:interaction.target?.screenId;
   if(destination!==undefined){
    if(destination!==exit&&!byId.has(destination))fail(`Назначение отсутствует или отключено: ${destination}`,'FLOW_GRAPH');
    graph.setEdge(screen.screenId,destination);reverse.setEdge(destination,screen.screenId);
   }else if(interaction.semanticRef){
    const effect=sources.get(screen.screenId).actions.find(a=>a.actionId===interaction.sourceActionId).outcome;
    if(effect.kind!=='incorrect')fail(`Эффект требует доменной проверки перед применением: ${effect.kind}`,'FLOW_GRAPH');
   }
  }
  for(let i=0;i<zones.length;i++)for(let j=i+1;j<zones.length;j++){
   const a=zones[i],b=zones[j],[ax,ay,aw,ah]=a.rect,[bx,by,bw,bh]=b.rect;
   if(ax<bx+bw&&bx<ax+aw&&ay<by+bh&&by<ay+ah&&(!equalTarget(a.target,b.target)||a.semanticRef!==b.semanticRef))fail(`Перекрывающиеся зоны с разными исходами: ${a.interactionId}, ${b.interactionId}`,'FLOW_GRAPH');
  }
 }
 const reachable=graphlib.alg.preorder(graph,task.startScreenId),canExit=new Set(graphlib.alg.preorder(reverse,exit));
 const trapped=reachable.filter(id=>!canExit.has(id));
 if(trapped.length)fail(`Нет пути к завершению: ${trapped.join(', ')}`,'FLOW_GRAPH');
 // An automatic cycle needs a separate preview/acknowledgement contract, not silent publication.
 const timers=new graphlib.Graph({directed:true});for(const s of active)timers.setNode(s.screenId);
 for(const s of active)for(const i of s.interactions)if(i.enabled&&i.kind==='timer'&&i.target?.kind==='screen')timers.setEdge(s.screenId,i.target.screenId);
 if(graphlib.alg.findCycles(timers).some(ids=>ids.some(id=>reachable.includes(id))))fail('Автоматический цикл требует проверки и подтверждения перед применением','FLOW_AUTO_CYCLE');
}
