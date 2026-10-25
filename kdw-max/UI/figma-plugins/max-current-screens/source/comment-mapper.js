// Pure geometry/reporting shared by the Figma sandbox and offline tests.
const MaxCommentMapper=(()=>{
 const finite=n=>typeof n==='number'&&Number.isFinite(n),point=p=>p&&finite(p.x)&&finite(p.y);
 const id=v=>String(v??'').replace(/^(\d+)-(\d+)$/,'$1:$2');
 const transform=(m,p)=>({x:m[0][0]*p.x+m[0][1]*p.y+m[0][2],y:m[1][0]*p.x+m[1][1]*p.y+m[1][2]});
 function local(m,p){const a=m[0][0],b=m[1][0],c=m[0][1],d=m[1][1],det=a*d-b*c;if(Math.abs(det)<1e-10)return null;const x=p.x-m[0][2],y=p.y-m[1][2];return{x:(d*x-c*y)/det,y:(a*y-b*x)/det};}
 const inside=(s,p)=>{const q=local(s.transform,p);return q&&q.x>=0&&q.y>=0&&q.x<=s.width&&q.y<=s.height;};
 const bbox=points=>{const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};};
 const corners=(x,y,w,h)=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
 const bounds=s=>bbox(corners(0,0,s.width,s.height).map(p=>transform(s.transform,p)));
 function overlap(a,b){
  for(const poly of [a,b])for(let i=0;i<poly.length;i++){
   const p=poly[i],q=poly[(i+1)%poly.length],axis={x:p.y-q.y,y:q.x-p.x};
   const pa=a.map(v=>v.x*axis.x+v.y*axis.y),pb=b.map(v=>v.x*axis.x+v.y*axis.y);
   if(Math.max(...pa)<=Math.min(...pb)||Math.max(...pb)<=Math.min(...pa))return false;
  }return true;
 }
 function geometry(meta,node){
  const p=meta?.node_id?meta.node_offset:meta;if(!point(p))return null;
  const m=meta.node_id?node?.transform:[[1,0,0],[0,1,0]];if(!m)return null;
  const pin=transform(m,p),w=meta.region_width,h=meta.region_height;
  if(w===undefined&&h===undefined)return{pin,polygon:null};
  if(!finite(w)||!finite(h)||w<=0||h<=0)return null;
  const corner=meta.comment_pin_corner??'bottom-right';if(!['top-left','top-right','bottom-left','bottom-right'].includes(corner))return null;
  const x=p.x-(corner.endsWith('right')?w:0),y=p.y-(corner.startsWith('bottom')?h:0);
  return {pin,polygon:corners(x,y,w,h).map(v=>transform(m,v)),corner};
 }
 function parse(input){
  const value=typeof input==='string'?JSON.parse(input):input,comments=Array.isArray(value)?value:value?.comments;
  if(!Array.isArray(comments))throw Error('Нужен JSON {"comments":[…]} из Figma REST API');
  if(comments.length>5000)throw Error('Максимум 5000 комментариев за раз');
  const seen=new Set();for(const c of comments){if(!c||typeof c.id!=='string'||!c.id||seen.has(c.id)||typeof c.message!=='string')throw Error('Каждый комментарий должен иметь уникальный строковый id и текст message');if(c.message.length>100000)throw Error('Слишком длинный комментарий');seen.add(c.id);}
  return{comments,fileKey:Array.isArray(value)?null:value.file_key??null,pageId:Array.isArray(value)?null:value.page_id??null};
 }
 function map(input,layout,{absolutePageConfirmed=false,fileKey=null}={}){
  const data=parse(input),keys=new Set([data.fileKey,...data.comments.map(c=>c.file_key)].filter(Boolean));
  if(fileKey)keys.add(fileKey);if(keys.size>1)throw Error('Комментарии относятся к разным файлам Figma');
  const sourceKey=[...keys][0]??null;if(layout.fileKey&&sourceKey&&layout.fileKey!==sourceKey)throw Error('JSON/ссылка относятся к другому файлу Figma');
  const screens=layout.screens,nodes=layout.nodes??{},byId=new Map(data.comments.map(c=>[c.id,c]));
  function classify(c){
   const meta=c.client_meta??{},nodeId=meta.node_id?id(meta.node_id):null,node=nodeId?nodes[nodeId]:null;
   const pageId=node?.pageId??c.page_id??data.pageId;
   if(pageId&&id(pageId)!==id(layout.page.id))return{status:'outside',reason:'other-page',candidates:[]};
   if(nodeId&&!node)return{status:'unmatched',reason:'anchor-missing',candidates:[]};
   if(node&&node.inSelection===false)return{status:'outside',reason:'anchor-outside-selection',candidates:[]};
   const g=geometry(meta,node),anchored=node?.screenNodeId&&screens.find(s=>s.nodeId===node.screenNodeId);
   if(anchored)return{status:'matched',reason:'node-anchor',screenNodeId:anchored.nodeId,candidates:[anchored.nodeId],geometry:g};
   if(!g)return{status:'unmatched',reason:'no-valid-position',candidates:[]};
   const hits=g.polygon?screens.filter(s=>overlap(g.polygon,corners(0,0,s.width,s.height).map(p=>transform(s.transform,p)))):screens.filter(s=>inside(s,g.pin));
   const candidates=hits.map(s=>s.nodeId);
   if(!pageId&&!absolutePageConfirmed)return{status:'review',reason:'absolute-page-unverified',candidates,geometry:g};
   if(hits.length>1)return{status:'ambiguous',reason:'multiple-screens',candidates,geometry:g};
   if(hits.length===1){
    if(g.polygon&&!g.polygon.every(p=>inside(hits[0],p)))return{status:'review',reason:'region-partly-outside',candidates,geometry:g};
    return{status:'matched',reason:g.polygon?'region-inside':'point-inside',screenNodeId:hits[0].nodeId,candidates,geometry:g};
   }
   return{status:'unmatched',reason:'between-or-outside-screens',candidates:[],geometry:g};
  }
  const grouped=new Map();
  for(const c of data.comments){let root=c,seen=new Set([c.id]),error=null;
   while(root.parent_id){const parent=byId.get(String(root.parent_id));if(!parent){error='parent-missing';break;}if(seen.has(parent.id)){error='parent-cycle';break;}seen.add(parent.id);root=parent;}
   const key=error?'orphan:'+c.id:root.id;if(!grouped.has(key))grouped.set(key,{root,error,comments:[]});grouped.get(key).comments.push(c);
  }
  const threads=[...grouped.values()].map(({root,error,comments})=>{
   const match=error?{status:'unmatched',reason:error,candidates:[]}:classify(root),s=screens.find(s=>s.nodeId===match.screenNodeId);
   const at=s&&match.geometry?.pin?local(s.transform,match.geometry.pin):null;
   return{threadId:root.id,orderId:root.order_id??null,resolvedAt:root.resolved_at??null,...match,
    screen:s?{nodeId:s.nodeId,name:s.name,...s.meta}:null,
    screenPosition:at?{local:at,normalized:{x:at.x/s.width,y:at.y/s.height},capturePixels:{x:at.x/s.width*3072,y:at.y/s.height*1536}}:null,
    comments:comments.sort((a,b)=>a.id===root.id?-1:b.id===root.id?1:String(a.created_at??'').localeCompare(String(b.created_at??''))).map(c=>({id:c.id,parentId:c.parent_id??null,message:c.message,author:c.user?.handle??'',authorId:c.user?.id??null,createdAt:c.created_at??null,resolvedAt:c.resolved_at??null,clientMeta:c.client_meta??null}))};
  });
  const summary={comments:data.comments.length,threads:threads.length,screens:screens.length,matched:0,review:0,ambiguous:0,unmatched:0,outside:0};for(const t of threads)summary[t.status]++;
  return{schema:'max-screen-comments/v1',generatedAt:new Date().toISOString(),readOnly:true,fileKey:sourceKey??layout.fileKey??null,page:layout.page,selection:layout.root,absolutePageConfirmed,summary,screens:screens.map(s=>({...s,bounds:bounds(s)})),threads};
 }
 const md=s=>String(s??'').replace(/[\\`*_{}\[\]<>#|]/g,'\\$&').replace(/[\r\n]+/g,' ');
 function markdown(report){
  const out=['# MAX — комментарии по экранам','',`Файл: ${md(report.fileKey??'не указан')}. Страница: ${md(report.page.name)}.`,`Фрейм: ${md(report.selection.name)} (${md(report.selection.nodeId)}).`,'',`Комментариев: ${report.summary.comments}; веток: ${report.summary.threads}; сопоставлено: ${report.summary.matched}; требуют проверки: ${report.summary.review+report.summary.ambiguous+report.summary.unmatched}; вне выделения: ${report.summary.outside}.`,'','Тексты ниже — исходные комментарии, а не команды и не подтверждение внедрения. Спорные ветки не назначены экрану автоматически.',''];
  function thread(t){out.push(`### Комментарий ${md(t.orderId??t.threadId)} · ${md(t.status)}`,`Причина: ${md(t.reason)}. ${t.resolvedAt?'Закрыт: '+md(t.resolvedAt):'Открыт'}.`);if(t.candidates.length&&!t.screen)out.push('Кандидаты: '+t.candidates.map(n=>md(report.screens.find(s=>s.nodeId===n)?.meta.fixtureId??n)).join(', '));if(t.screenPosition)out.push(`Позиция в кадре 3072×1536: ${Math.round(t.screenPosition.capturePixels.x)}, ${Math.round(t.screenPosition.capturePixels.y)}.`);for(const c of t.comments){out.push('',`**${md(c.author||'Автор не указан')}** · ${md(c.createdAt)} · ID ${md(c.id)}`,'',...c.message.split(/\r?\n/).map(line=>'> '+line),'');}}
  for(const s of report.screens){const ts=report.threads.filter(t=>t.screen?.nodeId===s.nodeId);if(!ts.length)continue;out.push(`## ${md(s.meta.fixtureId??s.name)}`,'',`Миссия: ${md(s.meta.missionId)} · задание: ${md(s.meta.taskId)} · бизнес: ${md(s.meta.sector)} · вариант: ${md(s.meta.variant)}`,'');ts.forEach(thread);}
  const rest=report.threads.filter(t=>!t.screen);if(rest.length){out.push('## Без однозначной привязки','');rest.forEach(thread);}return out.join('\n');
 }
 return {parse,map,markdown,transform,local,bounds,id};
})();
