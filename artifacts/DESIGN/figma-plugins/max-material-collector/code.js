/* Pure classification: no canvas mutations, OCR or external requests. */
const Collector = (() => {
 const tasks=[
  ['blogger.channel','Блогер · Создание канала',/создани[ея]\s+(публичного\s+|приватного\s+)?канала|^публичный канал$|^приватный канал$|public channel|private channel/i],
  ['blogger.comments','Блогер · Комментарии',/комментари|комментировать|comments/i],
  ['blogger.statistics','Блогер · Статистика',/статистик|рост канала|analytics|statistics/i],
  ['digital-id.create','Цифровой ID · Создание',/создани[ея].*(цид|цифров|id)|флоу.*цид/i],
  ['digital-id.photo','Цифровой ID · Подтверждённое фото (общий материал)',/добавлени[ея].*фото|подтвержд[её]нн.*фото/i],
  ['digital-id.hotel','Цифровой ID · Отель',/заселени|отель|hotel/i],
  ['digital-id.benefit','Цифровой ID · Льгота',/льгот|студенческ|музе/i],
  ['digital-id.age','Цифровой ID · Возраст',/подтверждени[ея] возраста|возраст|18\+/i],
  ['communication.call','Общение · Звонок',/звонк|звонок|видео.?звон|calls?/i],
  ['communication.video','Общение · Видеокружок',/видеосообщени|кружк|video message/i],
  ['communication.voice','Общение · Голосовое сообщение',/голосов|voice message/i],
  ['communication.group','Общение · Групповой чат',/группов.*чат|создани[ея] группы|group chat/i],
  ['communication.reaction','Общение · Стикеры / реакции',/стикер|реакци|stickers?|reactions?/i],
  ['communication.story','Общение · История',/публикаци[яи] истори|истории|stories/i],
  ['business.account','Бизнес · Аккаунт / сфера',/бизнес.?аккаунт|сфера бизнеса|платформ.*MAX.*бизнес/i],
  ['business.channel','Бизнес · Канал / планирование',/канал бизнеса|планирован.*публикац|запланир.*пост|отложенн.*публикац/i],
  ['business.bot','Бизнес · Бот',/бот.*заказ|запуск бота|при[её]м заказ/i],
  ['business.store','Бизнес · Витрина',/витрин|мини.?приложени/i],
  ['unassigned','Не определено',/$a/]
 ];
 const valid=new Set(tasks.map(x=>x[0]));
 const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
 const area=b=>b.width*b.height;
 const contains=(a,b)=>a&&b&&a.x<=b.x+2&&a.y<=b.y+2&&a.x+a.width>=b.x+b.width-2&&a.y+a.height>=b.y+b.height-2;
 const ancestor=(a,b,map)=>{let n=map.get(b.parent);while(n){if(n.id===a.id)return true;n=map.get(n.parent);}return false;};
 const matches=s=>{const text=norm(s).split('(')[0],found=tasks.filter(t=>t[0]!=='unassigned'&&t[2].test(text)).map(t=>t[0]);return found.includes('digital-id.photo')?['digital-id.photo']:found;};
 function candidates(nodes,selected,mode){
  const map=new Map(nodes.map(n=>[n.id,n])),selection=new Set(selected||[]);
  const scoped=n=>mode!=='selection'||selection.has(n.id)||[...selection].some(id=>map.has(id)&&ancestor(map.get(id),n,map));
  const phone=n=>n.bounds&&n.bounds.width>=60&&n.bounds.height>=160&&n.bounds.width/n.bounds.height>=.3&&n.bounds.width/n.bounds.height<=.82;
  const allowed=n=>['FRAME','COMPONENT','INSTANCE','GROUP'].includes(n.type)||(n.type==='RECTANGLE'&&n.hasImage);
  const phones=nodes.filter(n=>scoped(n)&&n.visible&&allowed(n)&&phone(n));
  const possible=[...phones,...nodes.filter(n=>selection.has(n.id)&&n.visible&&allowed(n)&&!phone(n)&&!phones.some(c=>ancestor(n,c,map)))];
  const possibleIds=new Set(possible.map(n=>n.id)),boards=new Set();
  for(const n of possible){let p=map.get(n.parent);while(p){if(possibleIds.has(p.id)&&p.bounds.width>n.bounds.width/0.65&&p.bounds.height>n.bounds.height/0.65)boards.add(p.id);p=map.get(p.parent);}}
  const actual=possible.filter(n=>!boards.has(n.id)),ids=new Set(actual.map(n=>n.id));
  return actual.filter(n=>{let p=map.get(n.parent);while(p){if(ids.has(p.id))return false;p=map.get(p.parent);}return true;});
 }
 function classify(nodes,screens){
  const map=new Map(nodes.map(n=>[n.id,n]));
  const screenIds=new Set(screens.map(n=>n.id));
  const insideScreen=n=>{let p=n;while(p){if(screenIds.has(p.id))return true;p=map.get(p.parent);}return false;};
  const headings=nodes.filter(n=>n.visible&&n.type==='TEXT'&&n.bounds&&n.text?.length<180&&(n.fontSize>=18||matches(n.text).length)&&!insideScreen(n));
  const sections=nodes.filter(n=>n.visible&&n.bounds&&n.type==='SECTION');
  const backdrops=nodes.filter(n=>n.visible&&n.bounds&&['SECTION','FRAME','GROUP','RECTANGLE'].includes(n.type)&&!n.hasImage&&!insideScreen(n));
  // Spatial index: headings in the same vertical band, no all-node scan per screen.
  const bands=new Map();for(const h of headings){const k=Math.floor(h.bounds.y/1000);if(!bands.has(k))bands.set(k,[]);bands.get(k).push(h);}
  return screens.map(s=>{
   const chain=[];let p=map.get(s.parent);while(p){chain.push({id:p.id,name:p.name,type:p.type});p=map.get(p.parent);}
   const section=sections.filter(n=>contains(n.bounds,s.bounds)).sort((a,b)=>area(a.bounds)-area(b.bounds))[0];
   const context=[],b=s.bounds,region=section||backdrops.filter(n=>contains(n.bounds,b)&&n.bounds.width>b.width*2&&area(n.bounds)>area(b)*3).sort((a,b)=>area(a.bounds)-area(b.bounds))[0];
   const maxGap=Math.max(600,b.height*1.8),above=region?Math.max(200,b.height*.5):0,minY=region?region.bounds.y-above:b.y-maxGap,band=Math.floor(b.y/1000);
   for(let k=Math.floor(minY/1000);k<=band;k++)for(const h of bands.get(k)||[]){
    const r=h.bounds,gap=b.y-r.y-r.height;
    if(gap< -4||r.y<minY||r.x>b.x+b.width*.5||b.x-r.x>Math.max(2000,b.width*12,region?.bounds.width||0))continue;
    const aboveRegion=region&&r.y+r.height<=region.bounds.y+4&&r.x>=region.bounds.x-b.width*.5&&r.x<region.bounds.x+region.bounds.width;
    if(region&&!contains(region.bounds,r)&&!aboveRegion)continue;
    // A heading in a sibling container never labels this screen.
    const hp=map.get(h.parent);if(hp&&['SECTION','FRAME','GROUP'].includes(hp.type)&&!contains(hp.bounds,b))continue;
    context.push({id:h.id,text:h.text,bounds:r,fontSize:h.fontSize,score:gap+Math.max(0,b.x-r.x)*.06});
   }
   context.sort((a,b)=>a.score-b.score);
   const evidence=[];
   function add(text,source,id,weight){for(const task of matches(text))evidence.push({task,source,id,text,weight});}
   add(s.name,'frame-name',s.id,100);
   chain.forEach((n,i)=>add(n.name,'ancestor',n.id,90-Math.min(i,8)*3));
   if(section)add(section.name,'section',section.id,90);
   context.slice(0,12).forEach((h,i)=>add(h.text,'heading',h.id,94-i*3));
   evidence.sort((a,b)=>b.weight-a.weight);
   const top=evidence[0],alternative=evidence.find(e=>e.task!==top?.task&&e.weight>=top.weight-10);
   const task=top?.task||'unassigned',confidence=!top?'none':alternative?'review':top.source==='heading'?'inferred':'high';
   const anchor=top?.id||context[0]?.id||section?.id||s.parent||s.id;
   return {...s,task,confidence,reviewed:false,include:true,group:anchor,evidence,ancestors:chain,contextRegion:region?{id:region.id,name:region.name,type:region.type,bounds:region.bounds}:null,nearbyHeadings:context.slice(0,12),warnings:[...(!top?['Нет надёжного тематического заголовка']:[]),...(alternative?['Контекст указывает на несколько заданий']:[]),...(s.type==='RECTANGLE'?['Растровый экран: текстовые слои могут отсутствовать']:[]) ]};
  });
 }
 function order(items){
  const sorted=[...items].sort((a,b)=>a.bounds.y-b.bounds.y||a.bounds.x-b.bounds.x),rows=[];
  for(const s of sorted){let row=rows.find(r=>Math.abs(r.y-s.bounds.y)<=Math.min(r.h,s.bounds.height)*.25);if(!row){row={y:s.bounds.y,h:s.bounds.height,items:[]};rows.push(row);}row.items.push(s);}
  return rows.flatMap((r,row)=>r.items.sort((a,b)=>a.bounds.x-b.bounds.x).map((s,col)=>({...s,layoutRow:row+1,layoutColumn:col+1})));
 }
 function frameName(name){
  const m=norm(name).match(/^(.*?)\s*[-–—]\s*(\d+)\s*(?:\((.*)\))?$/);
  return m?{series:m[1].trim(),number:Number(m[2]),description:m[3]||''}:null;
 }
 function structured(nodes,selected=[],scope='page'){
  const map=new Map(nodes.map(n=>[n.id,n])),children=new Map(),selection=new Set(selected),screens=[];
  for(const n of nodes){if(!children.has(n.parent))children.set(n.parent,[]);children.get(n.parent).push(n);}
  const inScope=n=>scope!=='selection'||selection.has(n.id)||[...selection].some(id=>map.has(id)&&ancestor(map.get(id),n,map));
  const visit=n=>{
   if(!n.visible)return;
   const kids=children.get(n.id)||[],isFrame=['FRAME','COMPONENT','INSTANCE'].includes(n.type);
   // A SECTION/GROUP is a container. A named screen is atomic: its nested UI is not another screen.
   if(isFrame&&inScope(n)&&n.bounds&&n.bounds.width>0&&n.bounds.height>0){
    const isContainer=!frameName(n.name)&&kids.some(c=>c.visible&&(c.type==='SECTION'||(['FRAME','COMPONENT','INSTANCE'].includes(c.type)&&frameName(c.name))));
    if(!isContainer){screens.push(n);return;}
   }
   for(const child of kids)visit(child);
  };
  for(const n of nodes)if(!map.has(n.parent))visit(n);
  const records=screens.map(s=>{
   const ancestors=[];let p=map.get(s.parent);while(p){ancestors.push({id:p.id,name:p.name,type:p.type});p=map.get(p.parent);}
   const containerPath=[...ancestors].reverse(),sectionPath=containerPath.filter(n=>n.type==='SECTION');
   const evidence=[];for(const [i,n] of [s,...ancestors].entries())for(const task of matches(n.name))evidence.push({task,source:i?'ancestor':'frame-name',id:n.id,text:n.name,weight:100-i});
   const top=evidence[0],conflict=!!top&&evidence.some(e=>e.task!==top.task);
   return {...s,task:top?.task||'unassigned',confidence:conflict?'review':top?'high':'none',reviewed:false,include:true,
    group:s.parent||s.id,groupName:containerPath.map(n=>n.name).join(' / ')||'Экраны страницы',containerPath,sectionPath,
    sequence:frameName(s.name),detection:'structure',evidence,ancestors,nearbyHeadings:[],contextRegion:null,
    warnings:[...(!top?['Задание не указано в названиях — назначьте при необходимости']:[]),...(conflict?['Названия экрана и контейнеров указывают на разные задания']:[])]};
  });
  const groups=new Map();for(const r of records){if(!groups.has(r.group))groups.set(r.group,[]);groups.get(r.group).push(r);}
  const key=r=>r.sequence?`${r.sequence.series} - ${r.sequence.number}`:r.name;
  // Numeric sorting must also work in Figma's sandbox without Intl collation options.
  const natural=(a,b)=>{
   const left=key(a).toLowerCase().match(/\d+|\D+/g)||[],right=key(b).toLowerCase().match(/\d+|\D+/g)||[];
   for(let i=0;i<Math.min(left.length,right.length);i++){
    const diff=/^\d+$/.test(left[i])&&/^\d+$/.test(right[i])?Number(left[i])-Number(right[i]):left[i].localeCompare(right[i]);
    if(diff)return diff;
   }
   return left.length-right.length;
  };
  return [...groups.values()].flatMap(group=>group.sort(natural));
 }
 function plan(records,edits){
  const map=new Map(records.map(n=>[n.id,n])),seen=new Set();
  return edits.filter(e=>e.include).map(e=>{const n=map.get(e.id);if(!n||seen.has(e.id))throw Error('Повторный или неизвестный экран');seen.add(e.id);if(!valid.has(e.task))throw Error('Неизвестное задание');return {...n,task:e.task,reviewed:!!e.reviewed,manualTask:e.task!==n.task,title:norm(e.title)||n.name,order:Math.max(1,Number(e.order)||1)};}).sort((a,b)=>a.detection==='structure'&&b.detection==='structure'?a.order-b.order||a.id.localeCompare(b.id):a.task.localeCompare(b.task)||a.order-b.order||a.id.localeCompare(b.id));
 }
 function coverage(screens){return tasks.filter(t=>t[0]!=='unassigned').map(([id,label])=>({id,label,count:screens.filter(s=>s.task===id).length,status:screens.some(s=>s.task===id)?'screens-found-content-not-verified':'not-found-in-export',note:'Наличие экрана не подтверждает полноту сценария или его результат.'}));}
 return {tasks:tasks.map(([id,label])=>({id,label})),norm,matches,candidates,classify,order,frameName,structured,plan,coverage};
})();
if(typeof module!=='undefined')module.exports=Collector;

figma.showUI(__html__,{width:760,height:740,themeColors:true});
const send=m=>figma.ui.postMessage(m),pause=()=>new Promise(r=>setTimeout(r,0));
let scan=null,run=null,serial=0;
const contentAdapter=typeof ContentMapExport==='undefined'?null:ContentMapExport;
const recordFingerprint=(r,nodes,diagnostics=[])=>contentAdapter?contentAdapter.fingerprint(r,nodes,fingerprint,diagnostics):fingerprint(nodes.get(r.id),diagnostics);
const exportFingerprint=(r,nodes,job)=>contentAdapter?contentAdapter.fingerprintAsync(r,nodes,n=>fingerprintAsync(n,job)):Promise.resolve(recordFingerprint(r,nodes));
function confirmation(job,key,message){return new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>{job.pending=null;reject(Error('Сервер не подтвердил сохранение. Продолжите выгрузку.'));},180000);
 job.pending={key,resolve:value=>{clearTimeout(timer);job.pending=null;resolve(value);},reject:error=>{clearTimeout(timer);job.pending=null;reject(error);}};
 send({...message,job:job.id,key});
});}
function plain(value){if(value===undefined)return null;return JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='symbol'?null:v));}
function bounds(n){return n.absoluteBoundingBox?plain(n.absoluteBoundingBox):null;}
function* fingerprintSteps(n,readWarnings=[]){
 const parents=[];let p=n.parent;while(p&&p.type!=='DOCUMENT'){parents.push([p.id,p.name,p.type]);p=p.parent;}
 // A cheap change detector for resume identity; saved bytes are independently verified with SHA-256.
 let a=2166136261,b=5381,count=0;const stack=[n];
 while(stack.length){const node=stack.pop();if(++count>12000)throw Error('Более 12 000 слоёв в одном экране');
  const values=[node.id,node.name,node.type,node.visible,bounds(node)];
  for(const key of ['characters','fills','strokes','effects','opacity','blendMode','fontName','fontSize','textStyleId','fillStyleId','strokeWeight','cornerRadius','vectorPaths','relativeTransform','clipsContent','layoutMode','itemSpacing','paddingLeft','paddingRight','paddingTop','paddingBottom','lineHeight','letterSpacing','textAlignHorizontal','componentProperties'])if(key in node){
   if(key==='componentProperties'){
    // Figma exposes this getter even when its component set is invalid.
    // Preserve a stable unavailable marker; never alter/detach the source instance.
    try{values.push([key,plain(node[key])]);}catch(e){values.push([key,{collectorUnavailable:true}]);readWarnings.push({nodeId:node.id,nodeName:node.name,property:key,message:e.message||String(e)});}
   }else values.push([key,node[key]]);
  }
  if(node.type==='TEXT'&&node.getStyledTextSegments)values.push(node.getStyledTextSegments(['fontName','fontSize','fills','textStyleId']));
  const text=JSON.stringify(values,(_,v)=>typeof v==='symbol'?null:v);for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i);}
  if('children'in node)stack.push(...[...node.children].reverse());
  if(count%64===0)yield count;
 }
 return JSON.stringify([n.name,bounds(n),n.type,parents,'content-v1',a>>>0,b>>>0,count]);
}
function fingerprint(n,readWarnings=[]){const steps=fingerprintSteps(n,readWarnings);let result;do{result=steps.next();}while(!result.done);return result.value;}
async function fingerprintAsync(n,job){
 const steps=fingerprintSteps(n);let result;
 do{assertRun(job);result=steps.next();if(!result.done){send({type:'status',text:`${job.phase} · проверено слоёв: ${result.value}`});await pause();}}while(!result.done);
 assertRun(job);return result.value;
}
function assertRun(job){if(run!==job||job.cancelled)throw Error('Операция отменена');if(job.overBudget)throw Error('Лимит 200 МБ: выберите меньшую область.');}
async function scanPage(scope,detection='structure'){
 const job={id:++serial};run=job;const page=figma.currentPage,selected=page.selection.map(n=>n.id);
 if(scope==='selection'&&!selected.length)throw Error('Выделите секцию, группу или экраны.');
 const mapped=contentAdapter?contentAdapter.scan(page,selected,scope):null;
 const flat=[],nodes=mapped?mapped.nodes:new Map(),stack=mapped?[]:[...page.children].reverse(),warnings=[];
 while(stack.length){assertRun(job);const n=stack.pop();if(n.visible===false)continue;
  if(flat.length>=30000){warnings.push('Лимит 30 000 слоёв. Выберите меньшую область; неполный скан нельзя считать полным комплектом.');break;}
  const text=n.type==='TEXT'?n.characters:undefined;
  flat.push({id:n.id,name:n.name,type:n.type,parent:n.parent?.id,bounds:bounds(n),visible:true,text,fontSize:typeof n.fontSize==='number'?n.fontSize:0,hasImage:Array.isArray(n.fills)&&n.fills.some(p=>p.type==='IMAGE')});nodes.set(n.id,n);
  if('children'in n)stack.push(...[...n.children].reverse());
  if(flat.length%200===0){send({type:'status',text:`Читаю структуру: ${flat.length} слоёв`});await pause();}
 }
 const records=mapped?mapped.records:detection==='structure'?Collector.structured(flat,selected,scope):Collector.order(Collector.classify(flat,Collector.candidates(flat,selected,scope)));
 if(mapped)warnings.push(...mapped.warnings);
 if(records.length>500)throw Error('Найдено больше 500 экранов. Выберите меньшую область.');
 records.forEach((r,i)=>{r.order=i+1;const diagnostics=[];r.fingerprint=contentAdapter?contentAdapter.auditFingerprint(r,nodes):recordFingerprint(r,nodes,diagnostics);if(diagnostics.length)r.readWarnings=diagnostics;for(const w of diagnostics)r.warnings.push(`Слой «${w.nodeName}» (${w.nodeId}): недоступно ${w.property}. ${w.message}`);});
 const affected=records.filter(r=>r.readWarnings?.length).length;
 if(affected)warnings.push(`У ${affected} экранов недоступны свойства компонентов. Экраны оставлены в списке; подробности — в предупреждениях экранов.`);
 const screenIds=new Set(records.map(r=>r.id));
 const screenFor=n=>{while(n&&n!==page){if(screenIds.has(n.id))return n.id;n=n.parent;}return null;};
 const links=[];
 for(const n of nodes.values()){
  if('reactions'in n)for(const reaction of n.reactions||[])for(const action of reaction.actions||(reaction.action?[reaction.action]:[])){
   if(action.destinationId)links.push({kind:'prototype',sourceNode:n.id,sourceScreen:screenFor(n),targetNode:action.destinationId,targetScreen:screenFor(nodes.get(action.destinationId)),trigger:plain(reaction.trigger),action:plain(action)});
  }
  if(n.type==='CONNECTOR')links.push({kind:'connector',id:n.id,start:plain(n.connectorStart),end:plain(n.connectorEnd),sourceScreen:screenFor(nodes.get(n.connectorStart?.endpointNodeId)),targetScreen:screenFor(nodes.get(n.connectorEnd?.endpointNodeId))});
 }
 assertRun(job);
 scan={id:job.id,page,nodes,flat,records,source:{pageId:page.id,pageName:page.name,fileName:figma.root.name,fileKey:figma.fileKey||null,scope,detection,selected,scannedAt:new Date().toISOString()},links,warnings};run=null;
 if(mapped){scan.source.contentMap=mapped.contentMap;scan.source.detection='max-content-autolayout-v1';}
 send({type:'scan',id:scan.id,records,tasks:Collector.tasks,source:scan.source,warnings,layerCount:flat.length});
}
async function preview(ids){
 if(!scan)throw Error('Сначала прочитайте страницу.');
 const job={id:++serial};run=job;
 for(const id of ids.slice(0,24)){assertRun(job);const n=scan.nodes.get(id);if(!n||n.removed)continue;
  try{const bytes=await n.exportAsync({format:'PNG',constraint:{type:'WIDTH',value:160},contentsOnly:true});assertRun(job);send({type:'preview',id,data:figma.base64Encode(bytes)});}catch(e){assertRun(job);send({type:'status',text:`Превью ${n.name}: ${e.message}`});}
 }
 run=null;send({type:'idle',text:'Превью готовы (до 24 экранов группы).'});
}
async function exportMaterials(msg){
 if(!scan||scan.id!==msg.scanId)throw Error('Список устарел. Повторите чтение страницы.');
 const snapshot=scan;let plan=contentAdapter?contentAdapter.plan(snapshot.records,msg.edits):Collector.plan(snapshot.records,msg.edits);
 if(!plan.length)throw Error('Не выбраны экраны.');
 const job={id:++serial,cancelled:false};run=job;
 const options={scale:msg.scale===2?2:1,svg:!!msg.svg,structure:msg.structure!==false,images:msg.images!==false};
 const selectedIds=new Set(plan.map(r=>r.id)),contextIds=new Set(plan.flatMap(r=>[...r.ancestors.map(a=>a.id),...r.nearbyHeadings.map(h=>h.id)]));
 const bundle={schema:'max-client-materials',version:1,source:snapshot.source,exportedAt:new Date().toISOString(),options,status:'in-progress',coverage:Collector.coverage(plan),warnings:[...snapshot.warnings,'Шрифты и видео не выгружаются. Нарисованные стрелки без связей прототипа не преобразуются в переходы.'],ordering:snapshot.source.detection==='structure'?'Section/container hierarchy; natural frame-name order within each group, with manual order overrides. Prototype links are separate.':'Reading order is geometric; prototype links are separate evidence, not a reconstructed flow.',context:snapshot.flat.filter(n=>contextIds.has(n.id)),links:snapshot.links.filter(l=>selectedIds.has(l.sourceScreen)||selectedIds.has(l.targetScreen)),screens:[],images:[],errors:[]};
 const imageHashes=new Set();let byteCount=0;
 if(contentAdapter){bundle.ordering='Auto Layout children: mission → icon → screen; layer names and old IDs never determine order or content.';bundle.context=[snapshot.source.contentMap];}
 function count(n){byteCount+=n;if(byteCount>200*1024*1024){job.overBudget=true;throw Error('Лимит 200 МБ. Выгрузите меньше экранов или отключите исходные изображения/SVG.');}}
 send({type:'export-start',id:job.id,total:plan.length});
 try{
  if(contentAdapter){
   // Full content identity is needed only for export/resume, never for the audit.
   const prepared=[];
   for(const r of plan){
    job.phase=`Подготовка ${prepared.length+1} / ${plan.length} · ${r.content.iconText} · ${r.name}`;
    send({type:'status',text:job.phase});await pause();assertRun(job);
    if(contentAdapter.auditFingerprint(r,snapshot.nodes)!==r.fingerprint)throw Error('Карта изменилась: повторите чтение.');
    prepared.push({...r,fingerprint:await exportFingerprint(r,snapshot.nodes,job)});
   }
   plan=prepared;
  }
  let completed=new Set(),saved=0;
  if(msg.streaming){const response=await confirmation(job,'plan',{type:'stream-plan',resume:msg.resume!==false,plan:{source:snapshot.source,options,frames:plan,links:bundle.links,context:bundle.context,coverage:bundle.coverage}});assertRun(job);completed=new Set(response.completed||[]);saved=completed.size;send({type:'progress',count:saved,total:plan.length});}
  for(const record of plan){assertRun(job);const n=snapshot.nodes.get(record.id);const out={...record,exportStatus:'pending'};
   job.phase=`Проверка · ${record.content?.iconText||''} · ${record.name}`;
   if(completed.has(record.id)){if(!n||n.removed||await exportFingerprint(record,snapshot.nodes,job)!==record.fingerprint)throw Error('Экран изменился после сканирования; повторите чтение страницы.');continue;}
   if(msg.streaming){bundle.images=[];bundle.errors=[];imageHashes.clear();byteCount=0;}
   try{
    if(!n||n.removed)throw Error('Экран удалён после сканирования');
    if(await exportFingerprint(record,snapshot.nodes,job)!==record.fingerprint)throw Error(contentAdapter?'Содержимое или порядок изменились: повторите сканирование':'Имя, геометрия или иерархия изменились: повторите сканирование');
    const stack=[n],texts=[],layers=[],hashes=new Set();let visited=0;
    while(stack.length){assertRun(job);const child=stack.pop();if(child.visible===false)continue;
     if(++visited>12000)throw Error('Более 12 000 слоёв в одном экране');
     const base={id:child.id,name:child.name,type:child.type,parent:child.parent?.id,bounds:bounds(child)};
     if(child.type==='TEXT')texts.push({...base,text:child.characters,fontName:plain(child.fontName),fontSize:plain(child.fontSize),segments:plain(child.getStyledTextSegments(['fontName','fontSize','fontWeight','fills','textStyleId','hyperlink']))});
     if(Array.isArray(child.fills))for(const paint of child.fills)if(paint.type==='IMAGE'&&paint.imageHash)hashes.add(paint.imageHash);
     layers.push(base);if('children'in child)stack.push(...[...child.children].reverse());if(visited%200===0)await pause();
    }
    out.texts=texts;out.layers=layers;out.imageHashes=[...hashes];out.notes=texts.length?[]:['Нет текстовых слоёв: содержимое может быть растром/кривыми; потребуется визуальная проверка этой группы.'];
    if(contentAdapter){out.visualTexts=texts;out.instruction=record.instruction;out.texts=[...texts.map(t=>({...t,contentRole:'visual'})),...(record.instruction?.blocks||[]).map(t=>({...t,contentRole:'instruction'}))];}
    const scale=Math.min(options.scale,4096/Math.max(n.width,n.height));
    send({type:'status',text:`Создаю PNG · ${record.name} (${record.id})`});
    out.pngScale=scale;const png=await n.exportAsync({format:'PNG',constraint:{type:'SCALE',value:scale},contentsOnly:true,useAbsoluteBounds:true});assertRun(job);count(png.length);out.png=figma.base64Encode(png);
    const thumb=await n.exportAsync({format:'PNG',constraint:{type:'WIDTH',value:160},contentsOnly:true});assertRun(job);count(thumb.length);out.thumbnail=figma.base64Encode(thumb);
    if(options.structure){try{out.document=plain(await n.exportAsync({format:'JSON_REST_V1'}));count(JSON.stringify(out.document).length*2);}catch(e){out.notes.push('Структура REST не выгружена: '+e.message);}}
    if(options.svg){try{const svg=await n.exportAsync({format:'SVG',svgOutlineText:true,contentsOnly:true});assertRun(job);count(svg.length);out.svg=figma.base64Encode(svg);}catch(e){out.notes.push('SVG не выгружен: '+e.message);}}
    if(options.images)for(const hash of hashes){assertRun(job);if(imageHashes.has(hash))continue;imageHashes.add(hash);try{const image=figma.getImageByHash(hash);if(!image)throw Error('Не найдено');const bytes=await image.getBytesAsync();assertRun(job);count(bytes.length);bundle.images.push({hash,data:figma.base64Encode(bytes)});}catch(e){bundle.errors.push({node:record.id,image:hash,error:e.message});}}
    assertRun(job);if(contentAdapter&&await exportFingerprint(record,snapshot.nodes,job)!==record.fingerprint)throw Error('Макет изменён во время экспорта: повторите чтение.');out.exportStatus='ok';
   }catch(e){if(job.cancelled||run!==job)throw e;out.exportStatus='error';out.error=e.message;bundle.errors.push({node:record.id,error:e.message});}
   if(msg.streaming){
    if(out.exportStatus!=='ok'||bundle.errors.length||out.notes?.some(n=>n.includes('не выгружен')))throw Error(out.error||bundle.errors[0]?.error||out.notes.find(n=>n.includes('не выгружен')));
    await confirmation(job,record.id,{type:'stream-frame',packet:{...bundle,screens:[out],status:'complete'}});assertRun(job);saved++;send({type:'progress',count:saved,total:plan.length});
   }else{bundle.screens.push(out);send({type:'progress',id:job.id,count:bundle.screens.length,total:plan.length});}
   if(byteCount>200*1024*1024)throw Error('Достигнут лимит выгрузки 200 МБ');await pause();
  }
  assertRun(job);bundle.status=bundle.errors.length||bundle.screens.some(s=>s.notes?.some(n=>n.includes('не выгружен')))?'partial':'complete';
 }catch(e){bundle.status=job.cancelled?'cancelled':'partial';bundle.errors.push({error:e.message});}
 if(msg.streaming){run=null;send({type:'stream-finished',status:bundle.status,error:bundle.errors[0]?.error||null});return;}
 bundle.requested=plan.map(p=>p.id);bundle.unexported=plan.filter(p=>!bundle.screens.some(s=>s.id===p.id&&s.exportStatus==='ok')).map(p=>p.id);
 bundle.coverage=Collector.coverage(bundle.screens.filter(s=>s.exportStatus==='ok'));
 bundle.fonts=[...new Set(bundle.screens.flatMap(s=>(s.texts||[]).flatMap(t=>[t.fontName,...(t.segments||[]).map(x=>x.fontName)]).filter(Boolean).map(f=>JSON.stringify(f))))].map(s=>JSON.parse(s));
 bundle.fontFilesIncluded=false;
 run=null;send({type:'bundle',id:job.id,bundle});
}
figma.ui.onmessage=async msg=>{
 try{
  if(msg.type==='stream-ack'){if(run&&msg.job===run.id&&run.pending?.key===msg.key){if(msg.error)run.pending.reject(Error(msg.error));else run.pending.resolve(msg);}return;}
  if(msg.type==='cancel'){if(run){run.cancelled=true;run.pending?.reject(Error('Операция отменена'));}return;}
  if(run){send({type:'status',text:'Дождитесь завершения текущей операции или отмените её.'});return;}
  if(msg.type==='scan')await scanPage(msg.scope==='selection'?'selection':'page',msg.detection==='legacy'?'legacy':'structure');
  else if(msg.type==='preview')await preview(msg.ids||[]);
  else if(msg.type==='export')await exportMaterials(msg);
 }catch(e){run=null;send({type:'error',text:e.message||String(e)});}
};
