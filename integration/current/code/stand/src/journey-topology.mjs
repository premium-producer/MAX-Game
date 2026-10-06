import {presentationSteps} from './journey-presentation.mjs';
// Small scenario templates. Coordinates belong to one zone; no shared session.
const tasks=s=>s.runs?.[s.mission]||[];
const BLOG=['channel','comments','statistics'];
const ID=['hotel','benefit','age'];
const CHAT=['call','message','group','reaction','story'];
export function routeSchema(mission){
 const demo=presentationSteps(mission);
 if(demo)return demo.map((step,i)=>({id:`demo-${i}`,accept:[step],parent:i?`demo-${i-1}`:'start'}));
 if(mission==='blogger')return BLOG.map((step,i)=>({id:`blog-${i}`,accept:[step],parent:i?`blog-${i-1}`:'start'}));
 if(mission==='digital-id')return [{id:'create-id',accept:['create-id'],parent:'start'},...ID.map((_,i)=>({id:`id-${i}`,accept:ID,parent:'create-id'}))];
 if(mission==='communication')return CHAT.map((_,i)=>({id:`chat-${i}`,accept:CHAT,parent:'start'}));
 return [{id:'account',accept:['account'],parent:'start'},{id:'business-tool',accept:['business-channel','business-bot','business-store'],parent:'account'}];
}
export function routeChoices(s,replacing=null){
 const placed=tasks(s),current=placed.find(o=>o.step===replacing);
 const pool=[...new Set(routeSchema(s.mission).flatMap(v=>v.accept))];
 return pool.filter(id=>id!==current?.step&&(replacing||!placed.some(o=>o.step===id)))
  .filter(id=>!id.startsWith('business-')||!placed.some(o=>o.step!==replacing&&o.step.startsWith('business-'))||placed.some(o=>o.step===id));
}
export function routeValid(s){const assigned=routeAssignments(s);return tasks(s).every(o=>routeSchema(s.mission).find(v=>v.id===assigned[o.step])?.accept.includes(o.step));}
export function routeAssignments(s){
 const result={'open-max':'start'},used=new Set();
 for(const o of tasks(s)){
  let slot;
  if(presentationSteps(s.mission))slot=`demo-${presentationSteps(s.mission).indexOf(o.step)}`;
  else if(s.mission==='blogger')slot=`blog-${BLOG.indexOf(o.step)}`;
  else if(o.step==='create-id'||o.step==='account')slot=o.step;
  else if(s.mission==='business')slot='business-tool';
  else {
   const prefix=s.mission==='digital-id'?'id':'chat',count=prefix==='id'?3:5;
   const allowed=Array.from({length:count},(_,i)=>`${prefix}-${i}`);
   slot=allowed.includes(o.slot)&&!used.has(o.slot)?o.slot:allowed.find(id=>!used.has(id));
  }
  const schema=routeSchema(s.mission);
  if(schema.some(v=>v.id===o.slot)&&!used.has(o.slot))slot=o.slot;
  if(used.has(slot))slot=schema.find(v=>!used.has(v.id))?.id;
  if(slot){result[o.step]=slot;used.add(slot);}
 }
 return result;
}
export function routeSlots(s){
 if(!s.starts?.[s.mission])return [];
 const assignedSlots=new Set(Object.values(routeAssignments(s))),schema=routeSchema(s.mission),allowed=routeChoices(s);
 const free=schema.filter(v=>!assignedSlots.has(v.id));
 const visible=s.mission==='digital-id'&&assignedSlots.has('create-id')?free:free.slice(0,1);
 return visible.map(v=>({id:v.id,label:allowed.length===1?'Финальный шаг':s.mission==='digital-id'&&v.id!=='create-id'?'Открой свои возможности':'Твой следующий шаг',allowed,named:false}));
}
// Aim for half the centre spacing, retaining room for full captions and hit targets.
// A single scale keeps the scenario shape and is independent of placement order.
export function compactRoutePoints(points,compact=false){
 const values=Object.values(points),cx=(Math.min(...values.map(p=>p.x))+Math.max(...values.map(p=>p.x)))/2,
 cy=(Math.min(...values.map(p=>p.y))+Math.max(...values.map(p=>p.y)))/2;
 const tile=compact?76:108,caption=compact?164:210,captionHeight=compact?56:72,gap=compact?10:12;
 const parts=p=>[{x:p.x-tile/2,y:p.y-tile/2,w:tile,h:tile},{x:p.x-caption/2,y:p.y+tile/2+8,w:caption,h:captionHeight}];
 const overlaps=(a,b)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
 for(let n=0;n<=100;n++){
  const scale=.5+n*.005,candidate=values.map(p=>({x:cx+(p.x-cx)*scale,y:cy+(p.y-cy)*scale}));
  if(candidate.some((p,i)=>candidate.slice(i+1).some(q=>parts(p).some(a=>parts(q).some(b=>overlaps(a,b))))))continue;
  Object.keys(points).forEach((id,i)=>Object.assign(points[id],candidate[i]));return scale;
 }
 return 1;
}
export function scenarioLayout(s,width,height,compact=false){
 const short=height<540,captionWidth=compact?164:210;
 const cx=width/2,rx=Math.min(compact?270:310,(width-captionWidth-80)/2);
 const top=compact?62:110,bottom=height-(compact?128:172),mid=(top+bottom)/2;
 const points={},at=(id,x,y)=>points[id]={x:cx+x*rx,y};
 if(presentationSteps(s.mission)){
  const ids=['start',...presentationSteps(s.mission).map((_,i)=>`demo-${i}`)];
  ids.forEach((id,i)=>{const cells=ids.length===3?[[0,top],[-.65,bottom],[.65,bottom]]:ids.length===4?[[-.65,top],[.65,top],[.65,bottom],[-.65,bottom]]:[[-1,top],[0,top],[1,top],[.65,bottom],[-.65,bottom]];at(id,...cells[i]);});
 }else if(s.mission==='digital-id'){
  if(short){at('start',-.55,top);at('create-id',.55,top);}
  else {at('start',0,top);at('create-id',0,mid);}
  [0,1,2].forEach(i=>at(`id-${i}`,i-1,bottom));
 }else if(s.mission==='blogger'){
  if(short){at('start',-.65,top);at('blog-0',.65,top);at('blog-1',.65,bottom);at('blog-2',-.65,bottom);}
  else {at('start',0,top);at('blog-0',1,mid);at('blog-1',0,bottom);at('blog-2',-1,mid);}
 }else if(s.mission==='communication'){
  ['start',...CHAT.map((_,i)=>`chat-${i}`)].forEach((id,i)=>{
   if(short){const cells=[[0,0],[1,0],[2,0],[2,1],[1,1],[0,1]];at(id,cells[i][0]-1,cells[i][1]?bottom:top);}
   else {const a=-Math.PI/2+i*Math.PI/3;at(id,Math.cos(a),mid+Math.sin(a)*(bottom-top)/2);}
  });
 }else {at('start',0,top);at('account',-.65,bottom);at('business-tool',.65,bottom);}
 compactRoutePoints(points,compact);
 const assigned=routeAssignments(s),positions=Object.fromEntries(Object.entries(assigned).map(([id,slot])=>[id,points[slot]]).filter(([,p])=>p));
 return {positions,slots:routeSlots(s).map(slot=>({...slot,...points[slot.id]})),captionWidth,points};
}
export function scenarioLinks(mission,nodes,maxDistance=Infinity){
 if(nodes.some(n=>n.slot)){
  const schema=routeSchema(mission),bySlot=new Map(nodes.map(n=>[n.step==='open-max'?'start':n.slot,n]));
  return schema.flatMap(slot=>{const a=bySlot.get(slot.parent),b=bySlot.get(slot.id);if(!a||!b)return[];
   const distance=Math.hypot(a.x-b.x,a.y-b.y),parent=schema.find(v=>v.id===slot.parent);
   return distance<=maxDistance?[{a:a.id,b:b.id,distance,correct:slot.accept.includes(b.step)&&(!parent||parent.accept.includes(a.step)),screen:true}]:[];
  });
 }
 const byStep=new Map(nodes.map(n=>[n.step,n]));
 const demo=presentationSteps(mission),chain=demo?['open-max',...demo]:[];
 const pairs=demo?chain.slice(1).map((id,i)=>[chain[i],id]):mission==='digital-id'?[['open-max','create-id'],...ID.map(id=>['create-id',id])]:
  mission==='blogger'?[['open-max','channel'],['channel','comments'],['comments','statistics']]:
  mission==='communication'?CHAT.map(id=>['open-max',id]):[['open-max','account'],...['channel','bot','store'].map(id=>['account',`business-${id}`])];
 return pairs.flatMap(([a,b])=>{const first=byStep.get(a),second=byStep.get(b);if(!first||!second)return[];
  const distance=Math.hypot(first.x-second.x,first.y-second.y);
  return distance<=maxDistance?[{a:first.id,b:second.id,distance,correct:true,screen:true}]:[];
 });
}

// Visibility graph of inflated obstacles, calculated once per placement.
// Clearance around labels is a routing preference, never a condition for PLACE.
// Dense layouts can put the destination inside that clearance. Retry around the
// actual tiles; if no corridor exists, retain the normal direct flight.
export function placementFlightPath(start,end,obstacles,tiles,width,height,radius){
 return safeFlightPath(start,end,obstacles,width,height,radius)
  ?? safeFlightPath(start,end,tiles,width,height,radius)
  ?? [end];
}

export function safeFlightPath(start,end,obstacles,width,height,radius){
 const boxes=obstacles.map(b=>({x:b.x-radius,y:b.y-radius,w:b.w+2*radius,h:b.h+2*radius}));
 const inside=(p,b)=>p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h;
 const blocked=(a,b)=>boxes.some(r=>{
  if(inside(a,r)||inside(b,r))return true;
  let lo=0,hi=1;
  for(const [v,d,min,max] of [[a.x,b.x-a.x,r.x,r.x+r.w],[a.y,b.y-a.y,r.y,r.y+r.h]]){
   if(Math.abs(d)<1e-8){if(v<=min||v>=max)return false;continue;}
   const t1=(min-v)/d,t2=(max-v)/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));
  }
  return lo<hi&&hi>0&&lo<1;
 });
 if(!blocked(start,end))return[end];
 const vertices=[start,end,...boxes.flatMap(b=>[{x:b.x-2,y:b.y-2},{x:b.x+b.w+2,y:b.y-2},{x:b.x-2,y:b.y+b.h+2},{x:b.x+b.w+2,y:b.y+b.h+2}]).filter(p=>p.x>=radius&&p.y>=radius&&p.x<=width-radius&&p.y<=height-radius&&!boxes.some(b=>inside(p,b)))];
 const dist=vertices.map(()=>Infinity),prev=[],seen=new Set();dist[0]=0;
 for(let n=0;n<vertices.length;n++){
  let u=-1;for(let i=0;i<vertices.length;i++)if(!seen.has(i)&&(u<0||dist[i]<dist[u]))u=i;
  if(u<0||!Number.isFinite(dist[u]))break;if(u===1){const path=[];for(let v=1;v!==0;v=prev[v])path.unshift(vertices[v]);return path;}
  seen.add(u);
  for(let v=0;v<vertices.length;v++)if(!seen.has(v)&&!blocked(vertices[u],vertices[v])){
   const d=dist[u]+Math.hypot(vertices[u].x-vertices[v].x,vertices[u].y-vertices[v].y);if(d<dist[v]){dist[v]=d;prev[v]=u;}
  }
 }
 return null;
}
