// Exact vertical overlap integral for two constant-speed rectangles. Evaluate
// corners of the piecewise-linear function, including viewport entry/exit:
// no frame-rate dependence and no missed fast crossing between samples.
export function flightOverlap(a,b,fieldHeight){
 const end=Math.max(0,Math.min((fieldHeight-a.y)/a.v,(fieldHeight-b.y)/b.v));
 const times=[0,end],edges=[[a.y,a.v],[a.y+a.h,a.v],[b.y,b.v],[b.y+b.h,b.v],[0,0],[fieldHeight,0]];
 for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){
  const [p,v]=edges[i],[q,w]=edges[j],t=(q-p)/(v-w);
  if(Number.isFinite(t)&&t>0&&t<end)times.push(t);
 }
 times.sort((a,b)=>a-b);
 const height=t=>Math.max(0,Math.min(a.y+a.h+a.v*t,b.y+b.h+b.v*t,fieldHeight)-Math.max(a.y+a.v*t,b.y+b.v*t,0));
 let area=0,peak=0,previous=height(0);
 for(let i=1;i<times.length;i++){
  const next=height(times[i]);area+=(previous+next)*.5*(times[i]-times[i-1]);peak=Math.max(peak,previous,next);previous=next;
 }
 return {area,peak};
}

// Search the whole continuous interval: all obstacle boundaries plus evenly
// spaced candidates and the seeded preferred location. Existing flights never
// move sideways to make room for a new one.
export function chooseFlightX(card,peers,field,preferred=.5){
 const left=field.left,right=Math.max(left,field.right-card.w),clamp=x=>Math.max(left,Math.min(right,x));
 const target=left+(right-left)*preferred,candidates=[target,left,right];
 const risks=peers.map(p=>({p,...flightOverlap(card,p,field.height)})).filter(r=>r.peak>0);
 for(let i=1;i<32;i++)candidates.push(left+(right-left)*i/32);
 // Include every breakpoint of horizontal intersection width, so the minimum
 // of the piecewise-linear total cost is covered even when overlap is forced.
 for(const {p} of risks)candidates.push(...[p.x-card.w-8,p.x-card.w,p.x,p.x+p.w-card.w,p.x+p.w,p.x+p.w+8].map(clamp));
 let best=null;
 for(const x of candidates){
  let cost=0,peak=0;
  for(const r of risks){
   const overlap=Math.max(0,Math.min(x+card.w,r.p.x+r.p.w)-Math.max(x,r.p.x));
   cost+=overlap*r.area;peak=Math.max(peak,overlap*r.peak);
  }
  const row={x,cost,peak,distance:Math.abs(x-target)};
  // Minimise total overlap over the remaining flight; peak breaks ties,
  // preference gives variety only among equally safe positions.
  if(!best||cost<best.cost-1e-5||Math.abs(cost-best.cost)<=1e-5&&(peak<best.peak-1e-5||
    Math.abs(peak-best.peak)<=1e-5&&row.distance<best.distance))best=row;
 }
 return best;
}

export function createFlightPlacement(){
 let placements=new Map(),signature='';
 return {
  clear(){placements.clear();signature='';},
  layout(cards,field){
   const next=[field.left,field.right,field.height,cards[0]?.entry].map(n=>Math.round(n??0)).join(':');
   if(next!==signature){placements.clear();signature=next;}
   const ids=new Set(cards.map(c=>c.id));
   for(const id of placements.keys())if(!ids.has(id))placements.delete(id);
   const placed=cards.filter(c=>placements.has(c.id)).map(c=>({...c,x:placements.get(c.id)}));
   for(const c of cards.filter(c=>!placements.has(c.id))){
    const choice=chooseFlightX(c,placed,field,c.offset);
    placements.set(c.id,choice.x);placed.push({...c,x:choice.x});
   }
   return new Map(placed.map(c=>[c.id,c]));
  },
 };
}
