/* PACK is injected by build.mjs. Native Figma plugin; no network or MCP. */
const TAG='max-content-builder-v2';
const ROOT_KEY='content-root-v2';
const FONT={family:'Inter',style:'Regular'};
const catalog=PACK.catalog;
const pending=new Map(), images=new Map();
let running=false,cancelled=false,requestId=0,conflicts=0,completed=0;
const white=[{type:'SOLID',color:{r:1,g:1,b:1}}];
const ink=[{type:'SOLID',color:{r:.08,g:.06,b:.12}}];
const reviewFill={green:[{type:'SOLID',color:{r:.72,g:.96,b:.78}}],yellow:[{type:'SOLID',color:{r:1,g:.9,b:.42}}],red:[{type:'SOLID',color:{r:1,g:.25,b:.25}}]};
function emit(text,done=false){figma.ui.postMessage({type:'status',text,done});}
function metadata(node,data){node.setPluginData('meta',JSON.stringify(data));}
function meta(node){try{return JSON.parse(node.getPluginData('meta')||'{}');}catch{return {};}}
function find(parent,key){return parent.children.find(n=>n.getPluginData('key')===key);}
function bind(n,key,role,data={}){n.setPluginData('key',key);metadata(n,{...data,role});return n;}
function frame(parent,key,name,direction='VERTICAL',gap=0,pad=0,fill=false){
 let n=find(parent,key);if(!n){n=bind(figma.createFrame(),key,'layout');parent.appendChild(n);}
 n.name=name;n.layoutMode=direction;n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='AUTO';
 n.itemSpacing=gap;n.paddingTop=n.paddingBottom=pad;n.paddingLeft=n.paddingRight=pad;n.fills=fill?white:[];n.clipsContent=false;
 parent.appendChild(n);return n;
}
function label(parent,key,value,width,size=32,data={}){
 let n=find(parent,key);const valueString=String(value||'');
 if(!n){n=bind(figma.createText(),key,'text',data);parent.appendChild(n);n.fontName=FONT;n.fontSize=size;n.fills=ink;n.textAutoResize='HEIGHT';n.resize(width,Math.max(size,1));n.characters=valueString;n.setPluginData('base',valueString);}
 else {const base=n.getPluginData('base');if(n.characters===base){if(n.characters!==valueString){if(JSON.stringify(n.fontName)===JSON.stringify(FONT))n.characters=valueString;else conflicts++;}if(n.characters===valueString)n.setPluginData('base',valueString);}else if(valueString!==base&&n.characters!==valueString)conflicts++;metadata(n,{...data,role:'text'});}
 parent.appendChild(n);n.textAutoResize='HEIGHT';n.layoutSizingVertical='HUG';return n;
}
function checkpoint(){if(cancelled)throw Error('CANCELLED');}
function asset(id){return new Promise((resolve,reject)=>{const request=++requestId;const timer=setTimeout(()=>{pending.delete(request);reject(Error('Не удалось получить встроенный ресурс '+id));},15000);pending.set(request,{resolve,reject,timer});figma.ui.postMessage({type:'asset',id,request});});}
// Compact change-detection fingerprint. Never persist a whole native screen tree:
// Figma limits each pluginData entry to 100 kB.
function fingerprint(text){let a=2166136261,b=3335557771;for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822519);}return 'fp1:'+text.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);}
function signature(n){function snapshot(x){return {type:x.type,width:x.width,height:x.height,...(x.type==='TEXT'?{text:x.characters}:{}),...('fills' in x&&Array.isArray(x.fills)?{fills:x.fills}:{}),...('children' in x?{children:x.children.map(snapshot)}:{})};}return fingerprint(JSON.stringify(snapshot(n)));}
function assetBase(n){const base=n.getPluginData('base');if(base.startsWith('fp1:'))return base;const value=base?fingerprint(base):signature(n);n.setPluginData('base',value);if(!base)n.setPluginData('baselineRecovered','true');return value;}
async function visual(parent,key,id,width,height,data){
 let n=find(parent,key);if(n){parent.appendChild(n);assetBase(n);if(n.getPluginData('assetId')!==id||n.getPluginData('sourceSha')!==catalog.assets[id].sha256)conflicts++;return n;}
 // Only reuse the two verified native screens in the user's exact template tree.
 const sourceIds={'client.frame-91504':'1:47469','client.frame-91516':'1:46967'};
 if(!catalog.reviewSource?.legacyRevision&&sourceIds[id]&&(!figma.fileKey||figma.fileKey==='N1Z1xwnG25QrCqrWEVREFk')){
  const root=await figma.getNodeByIdAsync('1:10663');
  if(root&&root.type==='FRAME'&&root.name==='МИССИЯ 1 - стать блогером'){
   const source=await figma.getNodeByIdAsync(sourceIds[id]);let p=source;
   while(p&&p!==root)p=p.parent;
   if(p===root&&source.type==='FRAME'){
    n=source.clone();parent.appendChild(n);n.rescale(Math.min(width/n.width,height/n.height));
    n.name='Исходный интерфейс · редактируемые слои';bind(n,key,'asset',{...data,assetId:id,sourceNodeId:source.id});n.setPluginData('assetId',id);n.setPluginData('sourceSha',catalog.assets[id].sha256);n.setPluginData('base',signature(n));return n;
   }
  }
 }
 const a=await asset(id);checkpoint();
 if(a.svg){n=figma.createNodeFromSvg(a.svg);n.resize(width,height);}else{
  let hash=images.get(id);if(!hash){hash=figma.createImage(new Uint8Array(a.bytes)).hash;images.set(id,hash);}
  n=figma.createRectangle();n.resize(width,height);n.fills=[{type:'IMAGE',imageHash:hash,scaleMode:'FIT'}];
 }
 parent.appendChild(n);n.name='Исходный экран';bind(n,key,'asset',{...data,assetId:id});n.setPluginData('assetId',id);n.setPluginData('sourceSha',catalog.assets[id].sha256);n.setPluginData('base',signature(n));return n;
}
const iconMap={'blogger.channel':'channel','blogger.comments':'comments','blogger.statistics':'statistics','digital-id.create-id':'id','digital-id.hotel':'hotel','digital-id.benefit':'benefit','digital-id.age':'age','communication.call':'call','communication.message':'message','communication.reaction':'reaction','communication.story':'story','business.sector':'sector','business.platform':'sector','business.channel':'channel','business.bot':'bot','business.store':'store'};
function icon(parent,key,title,taskId,data){
 const box=frame(parent,key,'игровая иконка','VERTICAL',24,44,true);box.resize(512,box.height);box.layoutSizingHorizontal='FIXED';box.counterAxisAlignItems='CENTER';
 if(!find(box,'symbol')){const shape=PACK.shapes[catalog.tasks[taskId]?.iconKey||iconMap[taskId]]||PACK.shapes.missions;const svg=taskId?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#471AFF" fill-rule="evenodd" d="${shape}"/></svg>`:PACK.logo;const n=figma.createNodeFromSvg(svg);n.resize(128,128);n.name=taskId?'Пиктограмма':'Знак MAX';bind(n,'symbol','icon',data);box.appendChild(n);}
 const t=label(box,'title',title,424,55,data);t.textAutoResize='HEIGHT';t.layoutSizingHorizontal='FILL';t.layoutSizingVertical='HUG';t.textAlignHorizontal='CENTER';box.primaryAxisSizingMode='AUTO';box.layoutSizingVertical='HUG';return box;
}
function archiveUnknown(parent,keys){const stale=parent.children.filter(n=>n.getPluginData('key')&&!keys.has(n.getPluginData('key'))&&n.getPluginData('key')!=='archive');if(!stale.length)return;const archive=frame(parent,'archive','Вне текущего сценария','VERTICAL',100);for(const n of stale)archive.appendChild(n);}
async function screen(parent,s,missionId,taskId){
 checkpoint();const data={missionId,taskId,screenId:s.screenId,instructionSource:s.instructionSource,presentationOnly:!!s.presentationOnly,source:s.source,review:s.review,originalInstruction:s.originalInstruction,originalTitle:s.originalTitle,supplemental:s.supplemental};
 const row=frame(parent,s.screenId,'этап задания · '+s.screenId,'HORIZONTAL',48,41);row.paddingLeft=row.paddingRight=60;row.counterAxisAlignItems='CENTER';metadata(row,{...data,role:'screen',deviceKind:s.deviceKind,actions:s.actions,automaticMs:s.automaticMs,missing:s.missing});
 row.name=(s.review?.content==='remove'?'УБРАТЬ · ':s.review?.content==='added'?'ДОБАВЛЕНО · ':'')+(s.name||s.screenId);
 row.fills=s.review?.content==='remove'?reviewFill.yellow:s.review?.content==='added'?reviewFill.green:[];
 const isFinal=s.kind==='complete'||s.layoutKind==='complete';
 const device=frame(row,'device',isFinal?'финальный экран миссии':s.deviceKind==='pc'?'экран задания · ПК':'экран задания','VERTICAL',24,32,true);device.counterAxisAlignItems='CENTER';
 // A completed session may still reference the last task image. It is not the final screen.
 const a=isFinal?null:catalog.assets[s.assetId];const available=!!a;
 if(s.missing||(!available&&!s.contentKind))device.fills=reviewFill.red;
 const w=s.deviceKind==='pc'?1000:available?Math.min(456,896*a.width/a.height):456,h=available?w*a.height/a.width:(s.deviceKind==='pc'?560:800);
 device.resize(s.deviceKind==='pc'?1064:520,device.height);device.layoutSizingHorizontal='FIXED';
 label(device,'editor-title',s.name||s.screenId,w,24,{...data,role:'editor-note'});
 if(s.review?.content==='remove'||s.review?.content==='added')label(device,'review-status',s.review.content==='remove'?'Клиент просил убрать · сохранено для сверки':'Добавлено / включено в последовательность по правкам',w,24,{...data,role:'editor-note'});
 if(s.supplemental)label(device,'reference-only','Дополнительный кадр исходника · не отдельное обязательное действие',w,24,{...data,role:'editor-note'});
 if(isFinal){
  // Repair an already built v2 in place, preserving the old nodes and any manual edits.
  for(const key of ['media','feedback','warning','missing','actions']){const stale=find(device,key);if(stale)stale.visible=false;}
  label(device,'final-title','Миссия выполнена',w,40,data);
  await visual(device,'final-qr',catalog.missions[missionId].qr.assetId,300,300,data);
  label(device,'qr-label',catalog.missions[missionId].qr.label,w,24,data);
  const back=frame(device,'final-back','Кнопка · К миссиям','VERTICAL',0,16,true);back.strokes=[{type:'SOLID',color:{r:.43,g:.1,b:1}}];back.strokeWeight=1;back.cornerRadius=12;
  label(back,'label','К миссиям',w-32,28,{...data,role:'reference-action'});
 }else if(available){
  const media=frame(device,'media','Ассет и области действия','VERTICAL');media.counterAxisSizingMode='FIXED';media.primaryAxisSizingMode='FIXED';media.resize(w,h);media.clipsContent=true;
  await visual(media,'asset',s.assetId,w,h,data);
  const scale=w/a.width;
  for(const annotation of s.annotations||[]){const r=annotation.rect;const cover=frame(media,'annotation-'+annotation.annotationId,'Коррекция заголовка','VERTICAL',0,0,true);cover.layoutPositioning='ABSOLUTE';cover.counterAxisSizingMode='FIXED';cover.primaryAxisSizingMode='FIXED';cover.resize(r[2]*scale,r[3]*scale);cover.x=r[0]*scale;cover.y=r[1]*scale;label(cover,'copy',annotation.text,r[2]*scale,16*scale,{...data,annotationId:annotation.annotationId});}
  for(const action of s.actions.filter(x=>x.placement==='hotspot')){
   let hit=find(media,action.actionId);if(!hit){hit=bind(figma.createRectangle(),action.actionId,'hotspot',{...data,actionId:action.actionId,label:action.label,rect:action.rect,outcome:action.outcome});media.appendChild(hit);hit.layoutPositioning='ABSOLUTE';const [x,y,rw,rh]=action.rect;hit.resize(rw*scale,rh*scale);hit.x=x*scale;hit.y=y*scale;hit.fills=[];hit.strokes=[];hit.name='Действие · '+action.label;hit.setPluginData('baseRect',JSON.stringify([hit.x,hit.y,hit.width,hit.height]));}
   media.appendChild(hit);
  }
 }else if(s.contentKind==='layout'){
  if(s.layoutKind==='palm'){
   if(!find(device,'palm')){const n=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#471AFF" d="M16 33V17c0-6 7-6 7 0v14-21c0-6 7-6 7 0v20-24c0-6 7-6 7 0v24-19c0-6 7-6 7 0v23l4-8c3-6 10-2 7 4l-9 22c-3 7-8 11-16 11-8 0-13-4-17-10L5 39c-4-6 2-10 6-6l5 5Z"/></svg>');n.resize(160,160);bind(n,'palm','source-icon',data);device.appendChild(n);}
   label(device,'palm-copy','Приложи ладонь, чтобы открыть возможности',w,32,data);label(device,'hold','Удерживай 0,8 секунды',w,24,data);
  }else{
   label(device,'layout-purpose',s.layoutKind==='menu'?'Выбор миссии':s.layoutKind==='branch'?'Выбор инструмента':'Состав исходной раскладки',w,28,data);
   const choices=s.layoutKind==='menu'?Object.values(catalog.missions).map(m=>m.title):s.layoutKind==='branch'?['Канал','Бот для заказов','Мини-приложение']:(s.layoutLabels||[]).map(n=>n.label);
   choices.forEach((name,i)=>label(device,'layout-item-'+i,name,w,28,data));
  }
 }else label(device,'missing','Нет материала:\n'+(s.missing||'Ассет не предоставлен'),w,32,{...data,field:'missing'});
 if(available&&s.missing)label(device,'warning','Нужна замена: '+s.missing,w,24,{...data,field:'missing'});
 if(s.feedback&&!isFinal)label(device,'feedback',s.feedback,w,24,{...data,field:'feedback'});
 const buttons=frame(device,'actions','Действия внутри устройства','VERTICAL',12);
 for(const action of s.actions.filter(x=>x.placement!=='hotspot')){const b=frame(buttons,action.actionId,'Кнопка · '+action.label,'VERTICAL',0,16,true);b.strokes=[{type:'SOLID',color:{r:.43,g:.1,b:1}}];b.strokeWeight=1;b.cornerRadius=12;label(b,'label',action.label,w-32,28,{...data,actionId:action.actionId,field:'actionLabel',outcome:action.outcome});}
 archiveUnknown(buttons,new Set(s.actions.filter(x=>x.placement!=='hotspot').map(x=>x.actionId)));
 buttons.visible=!isFinal;
 device.primaryAxisSizingMode='AUTO';device.layoutSizingVertical='HUG';
 if(s.instruction||s.review?.textRemoved){const help=frame(row,'instruction','справка к заданию','VERTICAL',0,44,true);help.fills=s.review?.textChanged?reviewFill.green:white;help.paddingTop=help.paddingBottom=72;help.primaryAxisAlignItems='CENTER';help.counterAxisAlignItems='CENTER';const copy=label(help,'copy',s.instruction,547,32,{...data,field:'instruction'});copy.visible=!!s.instruction;copy.textAutoResize='HEIGHT';copy.layoutSizingHorizontal='FIXED';copy.layoutSizingVertical='HUG';copy.textAlignHorizontal='CENTER';copy.textAlignVertical='CENTER';if(s.review?.textRemoved)label(help,'removed-note','Текст справки удалён по комментарию клиента',547,24,{...data,role:'editor-note'});help.primaryAxisSizingMode='AUTO';help.layoutSizingVertical='HUG';}
 else{const help=find(row,'instruction');if(help)help.visible=false;}
 const help=find(row,'instruction');if(help&&(s.instruction||s.review?.textRemoved))help.visible=true;
 completed++;emit('Разложено экранов: '+completed+'\n'+catalog.missions[missionId].title);await new Promise(r=>setTimeout(r,0));
}
async function task(parent,t,missionId){
 const data={missionId,taskId:t.taskId};const block=frame(parent,t.taskId,'иконка_задание · '+t.title,'VERTICAL',350);block.primaryAxisAlignItems='MIN';block.counterAxisAlignItems='CENTER';block.paddingLeft=block.paddingRight=20;block.paddingTop=block.paddingBottom=40;block.strokes=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.4}];block.strokeWeight=5;metadata(block,{...data,role:'task'});icon(block,'icon',t.title,t.taskId,{...data,field:'taskTitle'});
 if(t.iconMissing){const pending=frame(block,'icon-missing','Нужна клиентская иконка','VERTICAL',0,24,true);pending.fills=reviewFill.red;label(pending,'copy',t.iconMissing,464,24,{...data,role:'editor-note'});}
 const stack=frame(block,'steps','задание миссии','VERTICAL',100);stack.counterAxisAlignItems='MIN';const ids=Object.keys(t.screens);
 // Flatten the previous branch layout in place: keep screen IDs and edits.
 const branches=find(stack,'branches');
 if(branches){for(const n of branches.findAll(n=>meta(n).role==='screen')){if(!find(stack,n.getPluginData('key')))stack.appendChild(n);}branches.visible=false;}
 let referenceHeading=false;
 for(const s of Object.values(t.screens)){if(s.supplemental&&!referenceHeading){label(stack,'references-heading','Дополнительные кадры прежнего плагина',900,32,{...data,role:'editor-note'});referenceHeading=true;}await screen(stack,s,missionId,t.taskId);}
 archiveUnknown(stack,new Set([...ids,'branches','references-heading']));
}
async function build(ids){
 if(running)return;running=true;cancelled=false;completed=0;conflicts=0;
 const page=figma.currentPage;
 try{
  const selected=Object.values(catalog.missions).filter(m=>ids.includes(m.missionId));if(!selected.length)throw Error('Миссии не выбраны');
  await figma.loadFontAsync(FONT);checkpoint();
  const existing=find(page,ROOT_KEY);
  const bounds=page.children.map(n=>n.absoluteBoundingBox).filter(Boolean);
  const start=bounds.length?{x:Math.max(...bounds.map(b=>b.x+b.width))+240,y:Math.min(...bounds.map(b=>b.y))}:(figma.viewport.center||{x:0,y:0});
  const root=frame(page,ROOT_KEY,'MAX · Все миссии · восстановленная карта v2','HORIZONTAL',240);if(!existing){root.x=start.x;root.y=start.y;}root.setPluginData('owner',TAG);root.setPluginData('revision',catalog.contentRevision);
  for(const m of selected){
   checkpoint();const section=frame(root,m.missionId,m.title,'VERTICAL',48,200);section.strokes=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.6}];section.strokeWeight=6;metadata(section,{missionId:m.missionId,role:'mission'});
   label(section,'title',m.title,1600,64,{missionId:m.missionId,field:'missionTitle'});
   label(section,'legend','Зелёный — изменённый текст / добавленный этап. Жёлтый — убрать, оставлено для сверки. Красный — нужен материал клиента.',1600,28,{missionId:m.missionId,role:'editor-note'});
   if(m.missing.length)label(section,'gaps','Есть недостающие материалы — отмечены внутри заданий.',1600,28);
   const row=frame(section,'route','Миссия · возможности слева направо','HORIZONTAL',225);icon(row,'max','MAX',null,{missionId:m.missionId});
   for(const id of m.taskIds)await task(row,catalog.tasks[id],m.missionId);
   archiveUnknown(row,new Set(['max',...m.taskIds]));
  }
  // Canonical ordering even when only a subset was refreshed; other missions stay intact.
  for(const id of Object.keys(catalog.missions)){const n=find(root,id);if(n)root.appendChild(n);}
  const first=find(root,selected[0].missionId);if(figma.currentPage===page&&first){page.selection=[];figma.viewport.center={x:first.absoluteBoundingBox.x+900,y:first.absoluteBoundingBox.y+550};figma.viewport.zoom=.32;}
  emit('Готово: '+selected.length+' миссий, '+completed+' экранов.\n'+(conflicts?'Сохранены ручные изменения; конфликтов с каталогом: '+conflicts+'. Скачайте JSON для разбора.':'Тексты редактируются прямо на холсте. Повторная сборка сохраняет ручные правки.'),true);
 }catch(e){emit(e.message==='CANCELLED'?'Остановлено. Готовые блоки сохранены; повторный запуск продолжит сборку.':'Ошибка: '+e.message,true);}finally{running=false;}
}
async function exportEdits(){
 if(running)return;running=true;try{
  const page=figma.currentPage,root=find(page,ROOT_KEY);if(!root)throw Error('Сначала соберите миссии на текущей странице');
  const rows=root.findAll(n=>!!n.getPluginData('meta')).map(n=>{const data=meta(n);let value=null;if(n.type==='TEXT')value=n.characters;else if(data.role==='asset')value=signature(n);else if(data.role==='hotspot')value=[n.x,n.y,n.width,n.height];const base=data.role==='asset'?assetBase(n):n.getPluginData(data.role==='hotspot'?'baseRect':'base')||null;return {...data,nodeId:n.id,nodeName:n.name,base,value,...(n.getPluginData('baselineRecovered')?{baselineRecovered:true}:{})};});
  const changes=rows.filter(r=>r.base!==null&&JSON.stringify(r.value)!==JSON.stringify(r.base)&&!(Array.isArray(r.value)&&JSON.stringify(r.value)===r.base));
  figma.ui.postMessage({type:'export',data:{schemaVersion:2,contentRevision:root.getPluginData('revision'),reviewSource:catalog.reviewSource,legend:{green:'changed text / added content',yellow:'requested removal retained',red:'missing client material'},legacyCoverage:catalog.legacyCoverage,commentLedger:catalog.commentLedger,screens:rows.filter(r=>r.role==='screen'),elements:rows,changes,notes:['Растровый исходник не содержит редактируемых внутренних текстов.','Изменения SVG/вложенных слоёв требуют отдельного экспорта ассета.','Редакторские цветные пометки не являются частью игрового интерфейса.']}});
 }catch(e){emit(e.message,true);}finally{running=false;}
}
figma.showUI(__html__,{width:390,height:610});
figma.ui.onmessage=m=>{
 if(m.type==='asset-result'){const p=pending.get(m.request);if(!p)return;clearTimeout(p.timer);pending.delete(m.request);m.error?p.reject(Error(m.error)):p.resolve(m);return;}
 if(m.type==='ready')figma.ui.postMessage({type:'init',missions:Object.values(catalog.missions).map(({missionId,title})=>({missionId,title}))});
 if(m.type==='build')void build(Array.isArray(m.missionIds)?m.missionIds:[]);
 if(m.type==='cancel')cancelled=true;
 if(m.type==='export')void exportEdits();
};
