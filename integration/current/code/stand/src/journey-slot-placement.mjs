// A slot is a tile-centre anchor plus its complete caption/hit-target envelope.
// Search only when the current destination is blocked; never rearrange the field.
export const slotBox=(p,shape)=>({x:p.x-shape.left,y:p.y-shape.top,w:shape.left+shape.right,h:shape.top+shape.bottom});
const overlaps=(a,b,gap)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
export function findFreeSlot(preferred,shape,bounds,obstacles,gap=18){
 const minX=bounds.x+shape.left,maxX=bounds.x+bounds.w-shape.right;
 const minY=bounds.y+shape.top,maxY=bounds.y+bounds.h-shape.bottom;
 if(minX>maxX||minY>maxY)return null;
 const fits=p=>p.x>=minX&&p.x<=maxX&&p.y>=minY&&p.y<=maxY&&!obstacles.some(o=>overlaps(slotBox(p,shape),o,gap));
 if(fits(preferred))return {...preferred};
 const origin={x:Math.max(minX,Math.min(maxX,preferred.x)),y:Math.max(minY,Math.min(maxY,preferred.y))};
 const xs=[origin.x,minX,maxX,...obstacles.flatMap(o=>[o.x-shape.right-gap,o.x+o.w+shape.left+gap])];
 const ys=[origin.y,minY,maxY,...obstacles.flatMap(o=>[o.y-shape.bottom-gap,o.y+o.h+shape.top+gap])];
 const unique=(values,min,max)=>[...new Set(values.filter(v=>v>=min&&v<=max))];
 const yValues=unique(ys,minY,maxY);
 // Same column: below, then above. The full control must stay in the UX band.
 const vertical=yValues.filter(y=>y>=origin.y).sort((a,b)=>a-b)
  .concat(yValues.filter(y=>y<origin.y).sort((a,b)=>b-a));
 for(const y of vertical){const p={x:origin.x,y};if(fits(p))return p;}
 // Then right before left, preferring the closest row at each horizontal offset.
 const xValues=unique(xs,minX,maxX),nearY=yValues.sort((a,b)=>Math.abs(a-origin.y)-Math.abs(b-origin.y)||b-a);
 const lateral=xValues.filter(x=>x>origin.x).sort((a,b)=>a-b)
  .concat(xValues.filter(x=>x<origin.x).sort((a,b)=>b-a));
 for(const x of lateral)for(const y of nearY){const p={x,y};if(fits(p))return p;}
 return null;
}
