/* Shared, network-free review geometry. Included in the sandbox and CPU tests. */
const MAXReview=(()=>{
 const finite=Number.isFinite;
 const transform=(m,p)=>({x:m[0][0]*p.x+m[0][1]*p.y+m[0][2],y:m[1][0]*p.x+m[1][1]*p.y+m[1][2]});
 function validTransform(m){return Array.isArray(m)&&m.length===2&&m.every(row=>Array.isArray(row)&&row.length===3&&row.every(finite));}
 function polygon(screen){const m=screen.absoluteTransform;return [{x:0,y:0},{x:screen.width,y:0},{x:screen.width,y:screen.height},{x:0,y:screen.height}].map(p=>transform(m,p));}
 function inside(screen,p){const m=screen.absoluteTransform,a=m[0][0],b=m[0][1],c=m[1][0],d=m[1][1],det=a*d-b*c;if(Math.abs(det)<1e-9)return false;const x=p.x-m[0][2],y=p.y-m[1][2],u=(d*x-b*y)/det,v=(-c*x+a*y)/det;return u>=0&&v>=0&&u<=screen.width&&v<=screen.height;}
 function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,s=dx*dx+dy*dy,t=s?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/s)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
 function distance(screen,p){if(inside(screen,p))return 0;const poly=polygon(screen);return Math.min(...poly.map((a,i)=>segmentDistance(p,a,poly[(i+1)%4])));}
 function area(poly){return Math.abs(poly.reduce((s,a,i)=>{const b=poly[(i+1)%poly.length];return s+a.x*b.y-b.x*a.y;},0))/2;}
 function clip(subject,clipper){
  const signed=clipper.reduce((s,a,i)=>{const b=clipper[(i+1)%clipper.length];return s+a.x*b.y-b.x*a.y;},0),sign=signed>=0?1:-1;
  let result=subject;
  for(let i=0;i<clipper.length&&result.length;i++){
   const a=clipper[i],b=clipper[(i+1)%clipper.length],side=p=>sign*((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x));
   const input=result;result=[];
   for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],sp=side(p),sq=side(q),pin=sp>=-1e-8,qin=sq>=-1e-8;if(pin)result.push(p);if(pin!==qin){const t=sp/(sp-sq);result.push({x:p.x+t*(q.x-p.x),y:p.y+t*(q.y-p.y)});}}
  }
  return result;
 }
 function geometry(meta,anchors){
  if(!meta||typeof meta!=='object')return {error:'missing-position'};
  const anchor=meta.node_id?anchors[meta.node_id]:null;
  if(meta.node_id&&!anchor)return {error:'unknown-node',nodeId:meta.node_id};
  const p=meta.node_id?meta.node_offset:meta;
  if(!p||![p.x,p.y].every(finite))return {error:'missing-position'};
  const m=anchor?.absoluteTransform;
  if(anchor&&!validTransform(m))return {error:'invalid-node-transform',nodeId:meta.node_id};
  const point=anchor?transform(m,p):{x:p.x,y:p.y};
  let region=null;
  if(finite(meta.region_width)&&finite(meta.region_height)&&meta.region_width>0&&meta.region_height>0){
   const corner=meta.comment_pin_corner||'bottom-right';
   if(!['bottom-right','bottom-left','top-right','top-left'].includes(corner))return {error:'invalid-region-corner'};
   const x=p.x-(corner.endsWith('right')?meta.region_width:0),y=p.y-(corner.startsWith('bottom')?meta.region_height:0);
   region=[{x,y},{x:x+meta.region_width,y},{x:x+meta.region_width,y:y+meta.region_height},{x,y:y+meta.region_height}].map(q=>anchor?transform(m,q):q);
  }
  return {point,region,pageId:anchor?.pageId||null,nodeId:meta.node_id||null,anchor};
 }
 function match(meta,map,assumePage){
  const g=geometry(meta,map.anchors),base={status:'unassigned',screenIds:[],candidates:[],reason:g.error||null,position:g.point||null,region:g.region||null,pageId:g.pageId||null};
  if(g.error)return base;
  const candidates=map.screens.filter(s=>s.visible&&(!g.pageId||s.pageId===g.pageId));
  if(g.anchor){
   const chain=[g.nodeId,...g.anchor.ancestorIds];const bound=candidates.filter(s=>chain.includes(s.nodeId));
   if(bound.length===1)return {...base,status:'bound',screenIds:[bound[0].nodeId],reason:'explicit-node-ancestor'};
   if(!candidates.some(s=>s.ancestorIds.includes(g.nodeId)))return {...base,status:'outside-selection',reason:'bound-node-outside-selected-screens'};
  }
  const knownPage=g.pageId||assumePage;
  const scope=knownPage?candidates.filter(s=>s.pageId===knownPage):candidates;
  const scored=scope.map(s=>({screenId:s.nodeId,distance:distance(s,g.point),overlap:g.region?area(clip(g.region,polygon(s)))/area(g.region):0}));
  const hits=g.region?scored.filter(c=>c.overlap>1e-8):scored.filter(c=>c.distance===0);
  if(!knownPage)return {...base,status:'unknown-page',reason:'absolute-position-has-no-page-id',candidates:(hits.length?hits:scored.sort((a,b)=>a.distance-b.distance).slice(0,3))};
  base.pageId=knownPage;
  if(hits.length){
   const status=hits.length===1?'contained':g.region?'multi-screen':'ambiguous';
   return {...base,status,screenIds:status==='ambiguous'?[]:hits.map(c=>c.screenId),candidates:hits,reason:g.region?'region-intersection':'point-inside-frame'};
  }
  const nearby=scored.filter(c=>{const s=scope.find(s=>s.nodeId===c.screenId);return c.distance<=Math.min(80,.08*Math.min(s.bounds.width,s.bounds.height));}).sort((a,b)=>a.distance-b.distance);
  if(!nearby.length)return {...base,reason:'no-screen-within-nearby-threshold',candidates:scored.sort((a,b)=>a.distance-b.distance).slice(0,3)};
  const tied=nearby.filter(c=>c.distance-nearby[0].distance<=Math.max(8,nearby[0].distance*.2));
  return {...base,status:tied.length>1?'ambiguous':'nearby',reason:tied.length>1?'similar-distance-to-multiple-frames':'near-frame-needs-review',candidates:tied};
 }
 function assemble(map,raw,{fileKey,assumeCurrentPage=false,fetchedAt}={}){
  if(!Array.isArray(raw)||raw.length>10000)throw Error('Ожидается до 10 000 комментариев');
  const ids=new Map();for(const c of raw){if(!c||typeof c.id!=='string'||ids.has(c.id))throw Error('Некорректные или повторяющиеся ID комментариев');if(c.file_key&&c.file_key!==fileKey)throw Error('Комментарии относятся к другому файлу');ids.set(c.id,c);}
  const roots=new Map(),associations=new Map();
  function root(c){if(roots.has(c.id))return roots.get(c.id);let item=c;const seen=new Set();while(item.parent_id){if(seen.has(item.id))return null;seen.add(item.id);item=ids.get(item.parent_id);if(!item)return null;}roots.set(c.id,item.id);return item.id;}
  for(const c of raw){const rootId=root(c);if(rootId&&!associations.has(rootId))associations.set(rootId,match(ids.get(rootId).client_meta,map,assumeCurrentPage?map.page.id:null));}
  const comments=raw.map(c=>{const rootId=root(c);return {...c,threadRootId:rootId,association:rootId?{...associations.get(rootId),inheritedFrom:c.id!==rootId?rootId:null}:{status:'unassigned',screenIds:[],candidates:[],reason:'missing-or-cyclic-parent'}};});
  const grouped=new Map();for(const c of comments)if(c.threadRootId){if(!grouped.has(c.threadRootId))grouped.set(c.threadRootId,[]);grouped.get(c.threadRootId).push(c.id);}
  const threads=[...associations].map(([rootId,association])=>({rootId,commentIds:grouped.get(rootId),association}));
  const counts={screens:map.screens.length,comments:comments.length,threads:threads.length};for(const c of comments)counts[c.association.status]=(counts[c.association.status]||0)+1;
  return {schema:'max-review',version:1,exportedAt:new Date().toISOString(),fileKey,commentsFetchedAt:fetchedAt||null,coordinateSystem:'Figma page coordinates; screen bounds exclude rendered shadows',scope:{page:map.page,selectedNodeIds:map.selectedNodeIds,freeCommentPageAssumption:assumeCurrentPage?map.page.id:null},screenMap:map.screens,commentMap:comments,threads,unassignedCommentIds:comments.filter(c=>!c.association.screenIds.length).map(c=>c.id),anchors:map.anchors,warnings:map.warnings,summary:counts};
 }
 return {assemble,match,geometry,validTransform};
})();
