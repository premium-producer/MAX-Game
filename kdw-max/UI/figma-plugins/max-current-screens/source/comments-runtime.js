// Read-only scan of the selected MAX container. No fixed grid/offset assumptions.
async function exportScreenComments(m){
 const selection=figma.currentPage.selection;if(selection.length!==1)throw Error('Выделите один общий фрейм MAX с экранами');
 const root=selection[0],page=figma.currentPage,rootMeta=readMeta(root);
 if(rootMeta.owner!=='max-current-screens'&&rootMeta.role!=='screen')throw Error('Выделите набор «MAX · Финальные скриншоты · 3072×1536», созданный этим плагином');
 const data=MaxCommentMapper.parse(m.data),nodes={},screens=[],resolved=new Set();let visited=0;
 function visit(n,screenNodeId=null){
  checkpoint();if(++visited>20000)throw Error('Слишком большое выделение');const meta=readMeta(n);
  if(meta.role==='screen'){screenNodeId=n.id;screens.push({nodeId:n.id,name:n.name,width:n.width,height:n.height,transform:n.absoluteTransform,meta});}
  if(n.absoluteTransform)nodes[n.id]={transform:n.absoluteTransform,pageId:page.id,inSelection:true,screenNodeId};
  for(const child of n.children??[])visit(child,screenNodeId);
 }visit(root);if(!screens.length)throw Error('В выделении нет экранов с метаданными MAX');
 // Resolve anchors outside the selected tree to distinguish another page/set
 // from absolute coordinates. Never match those by coincident geometry.
 for(const c of data.comments){checkpoint();const key=MaxCommentMapper.id(c.client_meta?.node_id);if(!key||nodes[key]||resolved.has(key))continue;resolved.add(key);
  const node=await figma.getNodeByIdAsync(key);if(!node)continue;let p=node;while(p&&p.type!=='PAGE')p=p.parent;
  nodes[key]={transform:node.absoluteTransform??null,pageId:p?.id??null,inSelection:false,screenNodeId:null};
 }
 checkpoint();if(figma.currentPage!==page)throw Error('Страница изменилась во время чтения. Повторите сопоставление');
 const layout={fileKey:figma.fileKey??null,page:{id:page.id,name:page.name},root:{nodeId:root.id,name:root.name,width:root.width,height:root.height,transform:root.absoluteTransform,revision:rootMeta.revision??null},screens,nodes};
 return MaxCommentMapper.map(m.data,layout,{fileKey:m.fileKey||null,absolutePageConfirmed:m.absolutePageConfirmed===true});
}
