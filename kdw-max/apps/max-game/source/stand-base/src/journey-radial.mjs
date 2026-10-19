const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const objectMetrics=(service,scale=1)=>{
 const base=service?{w:116,h:116,tile:76}:{w:170,h:160,tile:108};
 if(scale===1)return base;
 return {w:580*scale/2.5,h:base.tile*scale,tile:base.tile*scale,cx:base.tile*scale/2};
};
// Stored positions describe the top-left travel interval, while taps target the
// centre of the icon (not its caption or the menu's adjusted centre).
export function placementAt(x,y,field,metrics){
 return {x:clamp((x-field.x-(metrics.cx??metrics.w/2))/Math.max(1,field.w-metrics.w),0,1),y:clamp((y-field.y-metrics.tile/2)/Math.max(1,field.h-metrics.h),0,1)};
}
export function placementAnchor(p,field,metrics){return{x:field.x+p.x*(field.w-metrics.w)+(metrics.cx??metrics.w/2),y:field.y+p.y*(field.h-metrics.h)+metrics.tile/2};}
export const intersects=(a,b,gap=0)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
export function paddedBounds(rects,padding=18){
 if(!rects.length)return null;
 const x=Math.min(...rects.map(r=>r.x))-padding,y=Math.min(...rects.map(r=>r.y))-padding;
 return{x,y,w:Math.max(...rects.map(r=>r.x+r.w))+padding-x,h:Math.max(...rects.map(r=>r.y+r.h))+padding-y};
}
export function radialLayout(point,count,width,height,compact=false,obstacles=[],sizes=[],scale=1){
 const w=(compact?100:128)*scale,h=(compact?104:142)*scale,tile=(compact?64:88)*scale,margin=14;
 const radius=Math.min(compact?112:176,(height-h)/2-margin,(width-w)/2-margin);
 const cx=clamp(point.x,radius+w/2+margin,width-radius-w/2-margin),cy=clamp(point.y,radius+tile/2+margin,height-radius-(h-tile/2)-margin);
 const ring=Array.from({length:count},(_,i)=>{const angle=-Math.PI/2+(count===4?Math.PI/4:0)+i*Math.PI*2/Math.max(1,count);
  return {x:cx+Math.cos(angle)*radius-w/2,y:cy+Math.sin(angle)*radius-tile/2,w,h,tile};
 });
 if(!obstacles.length&&!sizes.length)return ring;
 // Solve only on menu layout, never on the render clock. Keep installed objects
 // fixed, and score free slots against the familiar ring rather than a fixed grid.
 const candidates=ring.map((ideal,i)=>{
  const box={w:sizes[i]?.w||w,h:Math.max(h,sizes[i]?.h||0),tile};
  const xs=new Set([clamp(ideal.x,margin,width-box.w-margin),margin,width-box.w-margin]);
  const ys=new Set([clamp(ideal.y,margin,height-box.h-margin),margin,height-box.h-margin]);
  for(let x=margin;x<=width-box.w-margin;x+=24)xs.add(x);
  for(let y=margin;y<=height-box.h-margin;y+=24)ys.add(y);
  for(const o of obstacles){xs.add(o.x-box.w-6);xs.add(o.x+o.w+6);ys.add(o.y-box.h-6);ys.add(o.y+o.h+6);}
  const slots=[];
  for(const x of xs)for(const y of ys){
   const r={x,y,...box};
   if(x<margin||y<margin||x+box.w>width-margin||y+box.h>height-margin||obstacles.some(o=>intersects(r,o,6)))continue;
   const distance=Math.hypot(x+box.w/2-point.x,y+tile/2-point.y);
   slots.push({...r,score:(x-ideal.x)**2+(y-ideal.y)**2+Math.max(0,distance-radius*1.8)**2});
  }
  return slots.sort((a,b)=>a.score-b.score);
 });
 let beam=[{slots:[],score:0}];
 for(const list of candidates){
  const next=[];
  for(const state of beam){let accepted=0;for(const r of list){
   if(state.slots.some(o=>intersects(r,o,12)))continue;
   next.push({slots:[...state.slots,r],score:state.score+r.score});
   if(++accepted===16)break;
  }}
  beam=next.sort((a,b)=>a.score-b.score).slice(0,32);
  if(!beam.length)return []; // Fail closed rather than cover another object's controls.
 }
 return beam[0].slots.map(({score,...r})=>r);
}

// A blocked ray must not sweep a newly appearing label through an existing node.
// Start in the final free corridor instead; size/alpha still use the same spring.
export function revealOrigin(point,rect,obstacles){
 const end={x:rect.x+rect.w/2,y:rect.y+rect.tile/2};
 let origin=end;
 for(let n=1;n<=40;n++){
  const t=n/40,p={x:end.x+(point.x-end.x)*t,y:end.y+(point.y-end.y)*t};
  const swept={x:Math.min(p.x,end.x)-rect.w/2,y:Math.min(p.y,end.y)-rect.tile/2,
   w:rect.w+Math.abs(p.x-end.x),h:rect.h+Math.abs(p.y-end.y)};
  if(obstacles.some(o=>intersects(swept,o,6)))break;
  origin=p;
 }
 return origin;
}
