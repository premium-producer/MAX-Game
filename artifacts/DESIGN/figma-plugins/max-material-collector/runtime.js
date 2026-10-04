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
