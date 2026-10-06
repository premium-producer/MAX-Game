// Presentation-only constraints, in the same logical coordinates as scenePose.
export function referenceDrift(time, seed=0, reduced=false){
 if(reduced)return {x:0,y:0};
 return {x:4*Math.cos(time*.85+seed),y:6*Math.sin(time*.85+seed)};
}
export function rectanglesOverlap(a,b,gap=0){
 return a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
}
// Keep the nearest free position. Stable caller order supplies deterministic
// priority. Include all box boundaries: even a dense layout has a free edge.
export function separateReferenceObjects(objects,obstacles=[],gap=18){
 // Fixed owners (the scan target) participate exactly once, as obstacles.
 // Never resolve an owner against its own previous-frame rectangle.
 const fixed=objects.filter(b=>b.fixed),occupied=[...obstacles,...fixed].map(b=>({...b})),result=new Map(fixed.map(b=>[b.id,{x:0,y:0}]));
 for(const object of objects){
  if(object.fixed)continue;
  const b={...object},xs=[b.x],ys=[b.y];
  for(const o of occupied){xs.push(o.x-b.w-gap,o.x+o.w+gap);ys.push(o.y-b.h-gap,o.y+o.h+gap);}
  let best=null,score=Infinity;
  for(const x of xs)for(const y of ys){
   const candidate={...b,x,y},distance=(x-b.x)**2+(y-b.y)**2;
   if(distance<score&&!occupied.some(o=>rectanglesOverlap(candidate,o,gap-1e-6))){best=candidate;score=distance;}
  }
  result.set(object.id,{x:best.x-b.x,y:best.y-b.y});occupied.push(best);
 }
 return result;
}
