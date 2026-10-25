// Full PNG captures only. Never reconstruct text, buttons, SVG or backgrounds.
const catalog=PACK.catalog,pending=new Map(),images=new Map();
let mediaReady=false,running=false,cancelled=false,serial=0;
const status=(text,done=false)=>figma.ui.postMessage({type:'status',text,done});
const meta=(n,m)=>(n.setPluginData('maxClean',JSON.stringify(m)),n);
const readMeta=n=>{try{return JSON.parse(n.getPluginData('maxClean')||'{}')}catch{return {}}};
const checkpoint=()=>{if(cancelled)throw Error('CANCELLED');};
function frame(parent,name,w,h){const n=figma.createFrame();parent.appendChild(n);n.name=name;n.resize(w,h);n.fills=[];n.clipsContent=false;return n;}
function stack(parent,name,direction='VERTICAL'){const n=frame(parent,name,100,100);n.layoutMode=direction;n.primaryAxisSizingMode=n.counterAxisSizingMode='AUTO';n.itemSpacing=120;return n;}
function asset(id){checkpoint();if(images.has(id))return Promise.resolve(images.get(id));return new Promise((resolve,reject)=>{const request=++serial,timer=setTimeout(()=>{pending.delete(request);reject(Error('Не получен кадр '+id));},30000);pending.set(request,{id,resolve,reject,timer});figma.ui.postMessage({type:'asset',id,request});});}
function selectedFrames(){const out=[];function visit(n){if(readMeta(n).role==='screen'){out.push(n);return;}for(const c of n.children??[])visit(c);}figma.currentPage.selection.forEach(visit);return out;}
function exportTexts(){const selected=selectedFrames(),tasks=[],screens=[],seenTasks=new Set(),seenScreens=new Set();if(!selected.length)throw Error('Выделите собранный набор или кадры');for(const n of selected){const {missionId,taskId,screenId}=readMeta(n),t=catalog.tasks[taskId],s=t?.screens[screenId];if(!s)continue;if(!seenTasks.has(taskId)){seenTasks.add(taskId);tasks.push({missionId,taskId,title:t.title,baselineTitle:t.title,changed:false});}if(!seenScreens.has(screenId)){seenScreens.add(screenId);screens.push({missionId,taskId,screenId,instruction:s.instruction??'',baselineInstruction:s.instruction??'',changed:false});}}return {schema:'max-clean-screen-texts/v1',pluginRevision:PACK.revision,contentRevision:catalog.contentRevision,source:'Figma · MAX · Скриншоты финальной игры',readOnly:true,coverage:{tasks:tasks.length,screens:screens.length,frames:selected.length,expectedScreens:PACK.summary.uniqueScreens},tasks,screens,changes:[]};}
async function build(m){
 if(running)return;if(!mediaReady){status('Выберите screens.maxscreens из этой версии.',true);return;}running=true;cancelled=false;
 try{
  const missions=Array.isArray(m.missionIds)?m.missionIds:[],sectors=Array.isArray(m.sectors)?m.sectors:Object.keys(PACK.sectors),chosen=PACK.frames.filter(f=>f.missionId?missions.includes(f.missionId)&&(f.missionId!=='business'||sectors.includes(f.sector)):m.shared===true);
  if(!chosen.length)throw Error('Выберите миссию, бизнес или главное меню');
  const page=figma.currentPage,bounds=page.children.map(n=>n.absoluteBoundingBox).filter(Boolean),output=meta(stack(page,'MAX · Финальные скриншоты · 3072×1536','HORIZONTAL'),{owner:'max-current-screens',revision:PACK.revision,renderMode:'screenshot',width:3072,height:1536});
  output.x=bounds.length?Math.max(...bounds.map(b=>b.x+b.width))+240:figma.viewport.center.x;output.y=bounds.length?Math.min(...bounds.map(b=>b.y)):figma.viewport.center.y;
  const columns=new Map(),tasks=new Map();let count=0;
  for(const f of chosen){
   checkpoint();const hash=await asset(f.image);checkpoint();
   const key=f.missionId?f.missionId+(f.sector?'.'+f.sector:''):'shared';let column=columns.get(key);if(!column){column=stack(output,f.missionId?catalog.missions[f.missionId].title+(f.sector?' · '+PACK.sectors[f.sector]:''):'Главное меню');columns.set(key,column);}
   const taskKey=key+'.'+(f.taskId??f.variant);let parent=tasks.get(taskKey);if(!parent){parent=stack(column,catalog.tasks[f.taskId]?.title??f.variant);tasks.set(taskKey,parent);}
   const n=meta(frame(parent,f.screenId+(f.variant==='screen'?'':' · '+f.variant),f.width,f.height),{role:'screen',fixtureId:f.id,missionId:f.missionId,taskId:f.taskId,screenId:f.screenId,sector:f.sector,variant:f.variant,renderMode:'screenshot',revision:PACK.revision,sha256:PACK.assets[f.image].sha256});n.clipsContent=true;
   const photo=figma.createRectangle();n.appendChild(photo);photo.name='Скриншот игры · '+f.width+'×'+f.height;photo.resize(f.width,f.height);photo.x=photo.y=0;photo.fills=[{type:'IMAGE',imageHash:hash,scaleMode:'FILL'}];photo.locked=true;meta(photo,{assetId:f.image,sha256:PACK.assets[f.image].sha256});
   status('Собрано '+(++count)+' / '+chosen.length+' кадров');await new Promise(r=>setTimeout(r,0));
  }
  if(figma.currentPage===page){page.selection=[output];figma.viewport.scrollAndZoomIntoView([output.children[0]]);}status('Готово: '+count+' кадров 3072×1536. Полные PNG игры, без перевёрстки.',true);
 }catch(e){status(e.message==='CANCELLED'?'Остановлено. Готовые кадры сохранены.':'Ошибка: '+e.message,true);}finally{running=false;}
}
figma.showUI(__html__,{width:460,height:780,themeColors:true});
figma.ui.onmessage=async m=>{
 if(m.type==='ready')figma.ui.postMessage({type:'init',missions:Object.values(catalog.missions),sectors:PACK.sectors,summary:PACK.summary,transport:PACK.transport,revision:PACK.revision,fileKey:figma.fileKey??null});
 if(m.type==='comments-map'){
  if(running){figma.ui.postMessage({type:'comments-error',message:'Дождитесь завершения текущей операции'});return;}
  running=true;cancelled=false;try{const data=await exportScreenComments(m);figma.ui.postMessage({type:'comments-result',data,markdown:MaxCommentMapper.markdown(data)});}catch(e){figma.ui.postMessage({type:'comments-error',message:e.message==='CANCELLED'?'Сопоставление остановлено':e.message});}finally{running=false;}return;
 }
 if(m.type==='media-ready')mediaReady=m.indexSha256===PACK.transport.indexSha256;
 if(m.type==='media-clear'&&!running)mediaReady=false;
 if(m.type==='build')await build(m);
 if(m.type==='export')try{figma.ui.postMessage({type:'export',data:exportTexts()});}catch(e){status('Ошибка экспорта: '+e.message,true);}
 if(m.type==='cancel'){cancelled=true;for(const [id,p]of pending){clearTimeout(p.timer);p.reject(Error('CANCELLED'));pending.delete(id);}}
 if(m.type==='asset-result'){
  const p=pending.get(m.request);if(!p)return;pending.delete(m.request);clearTimeout(p.timer);
  try{if(m.error)throw Error(m.error);if(!(m.bytes instanceof Uint8Array)||m.bytes.byteLength!==PACK.assets[p.id].bytes)throw Error('Неверный размер PNG '+p.id);if(m.bytes.length<24||![137,80,78,71,13,10,26,10].every((v,i)=>m.bytes[i]===v))throw Error('Неверный формат PNG '+p.id);const hash=figma.createImage(m.bytes).hash;images.set(p.id,hash);p.resolve(hash);}catch(e){p.reject(Error(p.id+': '+e.message));}
 }
};
