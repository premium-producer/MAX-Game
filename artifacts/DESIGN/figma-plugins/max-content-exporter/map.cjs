/* Read-only Auto Layout adapter. The named actions container is an explicit exclusion. */
const ContentMapExport=(()=>{
 const children=n=>(n?.children||[]).filter(x=>x.visible!==false);
 const frames=n=>children(n).filter(x=>x.type!=='TEXT');
 const meta=n=>{try{return JSON.parse(n.getPluginData?.('meta')||'{}');}catch{return {};}};
 const key=n=>n.getPluginData?.('key')||'';
 const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='symbol'?null:v));
 const walk=n=>[n,...children(n).flatMap(walk)];
 function texts(n){return n?walk(n).filter(x=>x.type==='TEXT').map((x,i)=>({id:x.id,order:i+1,text:x.characters,fontName:plain(x.fontName??null),fontSize:plain(x.fontSize??null),segments:x.getStyledTextSegments?plain(x.getStyledTextSegments(['fontName','fontSize','fills','hyperlink'])):[],bounds:plain(x.absoluteBoundingBox??null)})):[];}
 const textValue=n=>texts(n).map(t=>t.text).join('\n');
 const graphic=n=>['VECTOR','BOOLEAN_OPERATION','ELLIPSE','POLYGON','STAR','LINE'].includes(n.type)||Array.isArray(n.fills)&&n.fills.some(p=>p.type==='IMAGE');
 const column=n=>n.layoutMode==='VERTICAL'&&frames(n).some(c=>c.layoutMode==='VERTICAL'&&children(c).some(r=>r.layoutMode==='HORIZONTAL'));
 const route=n=>n.layoutMode==='HORIZONTAL'&&frames(n).some(column);
 function missionRoute(n){const candidates=frames(n).filter(route);return candidates.length===1?candidates[0]:null;}
 function visuals(n,taskScreen=false){
  const kids=frames(n).filter(c=>meta(c).role!=='hotspot'&&!['actions','final-back'].includes(key(c))&&!(taskScreen&&String(c.name||'').trim()==='Действия внутри устройства'));
  const inner=kids.filter(c=>graphic(c)||['FRAME','GROUP','INSTANCE','COMPONENT','COMPONENT_SET'].includes(c.type));
  // The direct visual container includes screenshot annotations but not its surrounding editorial label/buttons.
  if(inner.length)return inner;
  return graphic(n)?[n]:[];
 }
 function scan(page,selected,scope){
  const selectedSet=new Set(selected),inScope=n=>{if(scope!=='selection')return true;for(let p=n;p&&p!==page;p=p.parent)if(selectedSet.has(p.id))return true;return false;};
  const missions=[],nodes=new Map();
  // Stop at the mission boundary: screenshots are opaque for map discovery.
  const search=n=>{
   if(n.layoutMode==='VERTICAL'&&missionRoute(n)){if(inScope(n))missions.push(n);return;}
   for(const c of children(n))search(c);
  };
  search(page);
  if(!missions.length)throw Error('Выделите миссию или общий контейнер: миссия → горизонтальный ряд иконок → вертикальные задания. Имена фреймов не используются.');
  const records=[],warnings=[],contentMap={schema:'max-content-map',version:1,orderPolicy:'autolayout-children',missions:[]};
  function record(visual,info){
   const {mission,icon,screen,help}=info;const index=records.length+1;
   for(const n of [visual,info.owner,help,...info.parents])if(n)nodes.set(n.id,n);
   const missionTitle=mission.text||`Миссия ${mission.order}`,iconTitle=icon.text||`Иконка ${icon.order}`;
   const r={id:visual.id,name:info.kind==='icon'?`Иконка ${icon.order}`:`Экран ${screen.order}`,title:info.kind==='icon'?`000-Иконка`:`${String(screen.order).padStart(3,'0')}-Экран`,bounds:plain(visual.absoluteBoundingBox||{x:0,y:0,width:visual.width,height:visual.height}),task:'unassigned',include:true,reviewed:false,confidence:'structure',group:icon.nodeId,groupName:`${missionTitle} / ${iconTitle}`,containerPath:[{id:mission.nodeId,name:`${String(mission.order).padStart(2,'0')}-${missionTitle}`},{id:icon.nodeId,name:`${String(icon.order).padStart(2,'0')}-${iconTitle}`}],ancestors:[],nearbyHeadings:[],evidence:[{source:'autolayout',text:'Порядок children; названия фреймов не используются'}],warnings:[],detection:'structure',order:index,content:{kind:info.kind,missionOrder:mission.order,missionNodeId:mission.nodeId,iconOrder:icon.order,iconNodeId:icon.nodeId,iconText:icon.text,iconTexts:icon.textBlocks,screenOrder:screen?.order??null,screenNodeId:screen?.nodeId??null,visualNodeId:visual.id,helpNodeId:help?.id??null},instruction:{blocks:texts(help),text:textValue(help)},watchNodeId:info.owner.id,contextNodeIds:[icon.headerNodeId,mission.headingNodeId].filter(Boolean),sequenceParents:info.parents.map(n=>n.id)};
   records.push(r);return visual.id;
  }
  for(const [mi,m] of missions.entries()){
   const r=missionRoute(m),heading=children(m).find(n=>n.type==='TEXT'&&meta(n).role!=='editor-note');
   const mission={order:mi+1,nodeId:m.id,headingNodeId:heading?.id,text:heading?.characters||'',icons:[]};contentMap.missions.push(mission);
   if(heading)nodes.set(heading.id,heading);
   for(const [ii,c] of frames(r).entries()){
    // No hidden/old archive is interpreted as a game icon.
    if(key(c)==='archive'){warnings.push(`Пропущен архив ${c.id}`);continue;}
    const f=frames(c),stacks=f.filter(s=>s.layoutMode==='VERTICAL'&&children(s).some(x=>x.layoutMode==='HORIZONTAL'));
    const stack=stacks.length===1?stacks[0]:null;
    const header=stack?f.find(x=>x!==stack&&texts(x).length):c;
    if(!header){warnings.push(`Не определена иконка ${c.id}`);continue;}
    nodes.set(header.id,header);
    const icon={order:ii+1,nodeId:c.id,headerNodeId:header.id,text:textValue(header),textBlocks:texts(header),screens:[],status:'ready'};mission.icons.push(icon);
    const iv=visuals(header);
    if(iv.length===1)icon.visualNodeId=record(iv[0],{mission,icon,kind:'icon',owner:header,parents:[r,m]});
    else{icon.status='missing-or-ambiguous-icon';warnings.push(`Иконка ${ii+1}: визуалов ${iv.length}; автоматический выбор отключён.`);}
    if(stacks.length>1){icon.status='ambiguous';warnings.push(`Иконка ${ii+1}: несколько колонок заданий (${c.id}).`);continue;}
    if(!stack)continue;
    let order=0;
    for(const row of children(stack)){
     if(row.type==='TEXT')continue;
     const entry={order:++order,nodeId:row.id,status:'pending',visualCount:null};icon.screens.push(entry);
     if(row.layoutMode!=='HORIZONTAL'){entry.status='unsupported-layout';warnings.push(`Экран ${row.id}: ожидается горизонтальный Auto Layout «визуал / справка».`);continue;}
     const parts=frames(row),device=parts[0],help=parts[1];
     const vv=device?visuals(device,true):[];
     entry.visualCount=device?vv.length:null;entry.candidateNodeIds=vv.map(x=>x.id);
     entry.instruction={blocks:texts(help),text:textValue(help)};
     if(!device||parts.length>2){entry.status='ambiguous';warnings.push(`Экран ${row.id}: неоднозначная структура (${parts.length} блоков).`);continue;}
     if(help&&walk(help).some(graphic)){entry.status='ambiguous';warnings.push(`Экран ${row.id}: справа найден визуал, нельзя принять блок за справку.`);continue;}
     if(vv.length!==1){entry.status=vv.length?'ambiguous':'missing-visual';entry.candidateNodeIds=vv.map(x=>x.id);warnings.push(`Экран ${row.id}: ${vv.length?'несколько визуалов':'нет визуала'}; сохранён как пробел в карте.`);continue;}
     const v=vv[0];entry.status='ready';entry.visualNodeId=record(v,{mission,icon,screen:entry,help,kind:'screen',owner:row,parents:[stack,c,r,m]});
    }
   }
  }
  if(new Set(records.map(r=>r.id)).size!==records.length)throw Error('Визуальный узел распознан дважды. Выберите только один общий контейнер.');
  return {records,warnings,contentMap,nodes};
 }
 function auditFingerprint(r,nodes){
  const describe=n=>{if(!n||n.removed)throw Error('Содержимое удалено; повторите чтение');return [n.id,n.name,n.type,n.visible,n.characters,plain(n.absoluteBoundingBox??null)];};
  const owner=nodes.get(r.watchNodeId),parts=children(owner);
  return JSON.stringify(['shallow-audit-v1',describe(owner),parts.map(describe),r.content.kind==='screen'?frames(parts[0]).map(describe):[],r.contextNodeIds.map(id=>texts(nodes.get(id))),texts(nodes.get(r.content.helpNodeId)),r.sequenceParents.map(id=>[id,children(nodes.get(id)).map(describe)])]);
 }
 function fingerprint(r,nodes,fn,diagnostics){
  const owner=nodes.get(r.watchNodeId);if(!owner||owner.removed)throw Error('Содержимое удалено; повторите чтение');
  return JSON.stringify([fn(owner,diagnostics),r.contextNodeIds.map(id=>fn(nodes.get(id),diagnostics)),r.sequenceParents.map(id=>{const n=nodes.get(id);if(!n||n.removed)throw Error('Контейнер удалён');return [id,children(n).map(x=>x.id)];})]);
 }
 function plan(records,edits){const selected=new Set(edits.filter(e=>e.include).map(e=>e.id));return records.filter(r=>selected.has(r.id));}
 async function fingerprintAsync(r,nodes,fn){
  const owner=nodes.get(r.watchNodeId);if(!owner||owner.removed)throw Error('Содержимое удалено; повторите чтение');
  const value=await fn(owner),context=[];
  for(const id of r.contextNodeIds)context.push(await fn(nodes.get(id)));
  return JSON.stringify([value,context,r.sequenceParents.map(id=>{const n=nodes.get(id);if(!n||n.removed)throw Error('Контейнер удалён');return [id,children(n).map(x=>x.id)];})]);
 }
 return {scan,texts,visuals,fingerprint,fingerprintAsync,auditFingerprint,plan};
})();
if(typeof module!=='undefined')module.exports=ContentMapExport;
