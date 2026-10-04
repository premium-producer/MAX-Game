/* Read-only selected-screen export. No renderer, selection or viewport mutations. */
let reviewBusy=false;
let reviewCancelled=false;
function reviewFileKey(){try{return figma.fileKey||'';}catch{return '';}}
async function exportReview(message){
 if(run||reviewBusy)throw Error('Дождитесь завершения текущей операции');
 reviewBusy=true;
 reviewCancelled=false;
 try{
  const page=figma.currentPage,selected=[...page.selection];
  if(!selected.length)throw Error('Выделите экраны или группы миссий на холсте');
  if(typeof message.fileKey!=='string'||!/^[A-Za-z0-9_-]{5,200}$/.test(message.fileKey))throw Error('Укажите ссылку на файл Figma');
  const currentFileKey=reviewFileKey();
  if(currentFileKey&&currentFileKey!==message.fileKey)throw Error('Ссылка не соответствует открытому файлу');
  if(!Array.isArray(message.comments)||message.comments.length>10000)throw Error('Некорректный список комментариев');
  const screens=[],warnings=[],seen=new Set();let visited=0;
  if(!currentFileKey)warnings.push({reason:'file-key-provided-by-user-not-verified-by-plugin-api'});
  function ancestors(node){const ids=[];let parent=node.parent;while(parent&&parent.type!=='DOCUMENT'){ids.push(parent.id);parent=parent.parent;}return ids;}
  function metadata(node){const raw=node.getPluginData?.('max-source');if(!raw)return null;try{const value=JSON.parse(raw);if(!value||typeof value!=='object'||typeof value.id!=='string')throw Error();return value;}catch{warnings.push({nodeId:node.id,reason:'invalid-max-source'});return null;}}
  function add(node,meta){
   if(screens.some(s=>s.nodeId===node.id))return;
   const bounds=node.absoluteBoundingBox,m=node.absoluteTransform;
   if(!bounds||!MAXReview.validTransform(m)||![node.width,node.height].every(Number.isFinite)||node.width<=0||node.height<=0){warnings.push({nodeId:node.id,reason:'missing-geometry'});return;}
   let visible=node.visible!==false;for(let p=node.parent;p&&p.type!=='PAGE';p=p.parent)visible=visible&&p.visible!==false;
   screens.push({nodeId:node.id,name:node.name,pageId:page.id,parentId:node.parent?.id||null,ancestorIds:ancestors(node),width:node.width,height:node.height,bounds:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height},absoluteTransform:m.map(row=>[...row]),visible,source:meta});
   if(screens.length>1000)throw Error('Выберите не более 1000 экранов');
  }
  // Tagged MAX frames are leaves of the screen map; their UI descendants are not screens.
  function tagged(node){
   if(seen.has(node.id))return false;seen.add(node.id);if(++visited>60000)throw Error('Область слишком велика; выделите меньше экранов');
   const meta=metadata(node);if(node.type==='FRAME'&&meta){add(node,meta);return true;}
   let found=false;for(const child of node.children||[])found=tagged(child)||found;return found;
  }
  const roots=selected.filter(n=>!selected.some(other=>other!==n&&ancestors(n).includes(other.id)));
  for(const root of roots){const count=screens.length;tagged(root);if(screens.length===count){if(root.type==='FRAME')add(root,null);else warnings.push({nodeId:root.id,reason:'selected-node-is-not-a-screen'});}}
  if(!screens.length)throw Error('В выделении не найдены экраны. Выделите фреймы или группы миссий MAX');
  const anchors={};const nodeIds=[...new Set(message.comments.map(c=>c.client_meta?.node_id).filter(id=>typeof id==='string'))];
  if(nodeIds.length>3000)throw Error('Слишком много привязанных узлов для одного экспорта');
  for(let i=0;i<nodeIds.length;i+=20){
   await Promise.all(nodeIds.slice(i,i+20).map(async id=>{
    try{const node=await figma.getNodeByIdAsync(id);if(!node)return;let owner=node;while(owner&&owner.type!=='PAGE')owner=owner.parent;if(!owner)return;
     anchors[id]={nodeId:id,name:node.name,pageId:owner.id,ancestorIds:ancestors(node),absoluteTransform:MAXReview.validTransform(node.absoluteTransform)?node.absoluteTransform.map(row=>[...row]):null};
    }catch{warnings.push({nodeId:id,reason:'unavailable-comment-anchor'});}
   }));
   if(reviewCancelled)throw Error('Экспорт остановлен');
   if(figma.currentPage!==page)throw Error('Страница изменилась. Повторите экспорт на нужной странице');
  }
  // Refresh geometry after async anchor reads; retain the explicitly captured selection scope.
  for(const screen of screens){const node=await figma.getNodeByIdAsync(screen.nodeId);if(!node||node.removed)throw Error('Выбранный экран удалён. Повторите экспорт');const b=node.absoluteBoundingBox;if(!b)throw Error('У экрана нет геометрии');screen.bounds={x:b.x,y:b.y,width:b.width,height:b.height};screen.width=node.width;screen.height=node.height;screen.absoluteTransform=node.absoluteTransform.map(row=>[...row]);screen.name=node.name;screen.ancestorIds=ancestors(node);}
  if(reviewCancelled)throw Error('Экспорт остановлен');
  if(figma.currentPage!==page)throw Error('Страница изменилась. Повторите экспорт');
  const result=MAXReview.assemble({page:{id:page.id,name:page.name},selectedNodeIds:selected.map(n=>n.id),screens,anchors,warnings},message.comments,{fileKey:message.fileKey,assumeCurrentPage:message.assumeCurrentPage===true,fetchedAt:message.fetchedAt});
  figma.ui.postMessage({type:'review-result',requestId:message.requestId,result});
 }finally{reviewBusy=false;}
}
