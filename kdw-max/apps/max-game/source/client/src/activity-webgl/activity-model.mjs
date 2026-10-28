// Viewport pixels throughout. No DOM, timers, renderer or transport ownership.
export const mix=(a,b,t)=>a+(b-a)*t;
export const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
export const inside=(p,r)=>{
 if(!r||p.x<r.x||p.x>r.x+r.w||p.y<r.y||p.y>r.y+r.h)return false;
 const radius=Math.min(r.radius??0,r.w/2,r.h/2);if(radius<=0)return true;
 const dx=Math.max(0,Math.abs(p.x-r.x-r.w/2)-(r.w/2-radius)),dy=Math.max(0,Math.abs(p.y-r.y-r.h/2)-(r.h/2-radius));
 return dx*dx+dy*dy<=radius*radius;
};
export function hit(p,items){
 for(let i=items.length-1;i>=0;i--){const r=items[i];if(!r.interactive||r.clip&&!inside(p,r.clip))continue;
  const c=Math.cos(-(r.rotation??0)),s=Math.sin(-(r.rotation??0)),x=p.x-r.x-r.w/2,y=p.y-r.y-r.h/2;
  if(inside({x:x*c-y*s+r.x+r.w/2,y:x*s+y*c+r.y+r.h/2},r))return r;
 }return null;
}
export function flightPose(from,to,progress){
 const t=ease(progress),arc=Math.sin(Math.PI*t)*Math.min(100,Math.abs(from.x-to.x)*.16);
 return{x:mix(from.x,to.x,t),y:mix(from.y,to.y,t)-arc,w:mix(from.w,to.w,t),h:mix(from.h,to.h,t),radius:mix(from.radius??0,to.radius??0,t),rotation:-.12*Math.sin(Math.PI*t)};
}
// Integrate v(t)=v0*(1-t)^2: preserve incoming velocity, then stop without a snap.
export const SELECTION_BRAKE_MS=320;
// Selection acknowledgement fades as soon as the image leaves its held pose.
export function selectionRimOpacity(phase,age,reduced=false){
 if(phase==='pending'||phase==='queued')return reduced?1:ease(age/140);
 if(phase==='flying'||phase==='fading')return reduced?0:1-ease(age/140);
 return 0;
}
export function brakingPose(from,velocity,elapsed,duration=SELECTION_BRAKE_MS){
 const t=Math.max(0,Math.min(1,elapsed/duration)),distance=duration*(t-t*t+t*t*t/3);
 return {...from,x:from.x+(velocity.x??0)*distance,y:from.y+(velocity.y??0)*distance};
}
export const orderedSprites=sprites=>[...sprites].sort((a,b)=>(a.layerOrder??-1)-(b.layerOrder??-1));
export const placeholderOpacity=reveal=>1-Math.max(0,Math.min(1,reveal));
export function photoPose(card,photo,width){const k=card.w/width;return{x:card.x+photo.x*k,y:card.y+photo.y*k,w:photo.w*k,h:photo.h*k,radius:photo.radius*k};}
export function phoneLayout(kind,rect,resources,rows){
 const scale=rect.width/390,height=rect.height/scale,header=kind==='posts'?121.33:140,footer=kind==='posts'?78:14;
 const clip={x:rect.x,y:rect.y+header*scale,w:rect.width,h:Math.max(1,(height-header-footer)*scale),radius:kind==='posts'?0:29*scale};
 const slots=new Map();let total=0,contentHeight=0;
 if(kind==='posts')for(const row of rows){const asset=resources.get(row.postId);if(!asset)continue;slots.set(row.spawnId,{x:6.5,y:total,w:315.25,h:asset.stored.h,asset});total+=asset.stored.h+14;}
 else{let y=9;for(let i=0;i<rows.length;i+=2){let max=270;for(let j=i;j<Math.min(rows.length,i+2);j++){const row=rows[j],asset=resources.get(row.postId);if(!asset)continue;max=Math.max(max,asset.stored.h);slots.set(row.spawnId,{x:9+(j%2)*190,y,w:182,h:asset.stored.h,asset});}y+=max+8;}contentHeight=y;total=Math.max(y,4*278+9);}
 return{scale,height,header,footer,clip,slots,total,revealScroll:Math.max(0,(kind==='posts'?total:contentHeight)-clip.h/scale),maxScroll:Math.max(0,total-clip.h/scale)};
}
export function slotPose(layout,slot,scroll){return{x:layout.clip.x+slot.x*layout.scale,y:layout.clip.y+(slot.y-scroll)*layout.scale,w:slot.w*layout.scale,h:slot.h*layout.scale};}
export function generationKey(s){return `${s?.sessionId}:${s?.runId}:${s?.taskId}:${s?.screenId}`;}
export function wrapText(ctx,text,width){
 const lines=[];for(const paragraph of String(text??'').split('\n')){
  let line='';for(const word of paragraph.split(/[ \t]+/)){if(!word)continue;const trial=line?line+' '+word:word;
   if(ctx.measureText(trial).width<=width){line=trial;continue;}if(line){lines.push(line);line='';}
   if(ctx.measureText(word).width<=width){line=word;continue;}
   for(const letter of Array.from(word)){if(line&&ctx.measureText(line+letter).width>width){lines.push(line);line='';}line+=letter;}
  }lines.push(line);
 }return lines;
}
export function textureBytes(w,h,mipmaps=true){return Math.ceil(w*h*4*(mipmaps?4/3:1));}
export function summary(values){const rows=[...values].sort((a,b)=>a-b);return{count:rows.length,p95:rows[Math.max(0,Math.ceil(rows.length*.95)-1)]??0,p99:rows[Math.max(0,Math.ceil(rows.length*.99)-1)]??0,max:rows.at(-1)??0};}
