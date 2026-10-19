const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Local to the reachable zone, not the full wall. Phone ratio is fixed by CSS.
export function popupBounds(anchor,width,height,{compact=false,scale=1}={}){
 const h=Math.min((compact?218:520)*scale,height-16);
 const w=Math.min(compact?380*scale:h*1.22,width-16);
 const clearance=24+(anchor.radius||0),right=anchor.x+clearance,left=anchor.x-w-clearance;
 const x=right+w<=width-8?right:left>=8?left:clamp(anchor.x-w*.5,8,width-w-8);
 return {x,y:clamp(anchor.y-h*.66,8,height-h-8),w,h};
}

// Keep the node fixed; mirror the phone, never move the node to fit a popup.
export function anchoredTaskBounds(anchor,width,height,scale=1){
 if(scale>1){
  const h=Math.min(520*scale,height-32,(width-32)/1.22),w=h*1.22,phone=h*.49,gap=12*h/520;
  const x=(width-w)/2,y=(height-h)/2;
  return {x,y,w,h,tile:0,mirrored:false,iconX:0,iconY:h/2,copy:w-phone-gap,detached:true,originX:anchor.x-x,originY:anchor.y-y,instructionX:0,instructionTop:0,instructionBottom:h,above:true};
 }
 const detached=anchor.y-anchor.radius<26||anchor.y+anchor.radius>height-26;
 const original=anchor;
 if(detached)anchor={...anchor,y:clamp(anchor.y,80,height-80),radius:0};
 const h=Math.min(520*scale,height-16,(width-16)/1.22),w=Math.min(h*1.22,width-16);
 const tile=anchor.radius*2,pad=18,gap=12,phone=h*.49,copy=w-phone-gap;
 const mirrored=anchor.x-pad-tile/2+w>width-8;
 const x=clamp(mirrored?anchor.x+tile/2+pad-w:anchor.x-tile/2-pad,8,width-w-8);
 const y=clamp(anchor.y+tile/2+pad-h,8,height-h-8);
 const iconX=anchor.x-x,iconY=anchor.y-y;
 const above=iconY-tile/2-pad>=110*h/380;
 return {x,y,w,h,tile,mirrored,iconX,iconY,copy,detached,originX:original.x-x,originY:original.y-y,
  instructionX:mirrored?phone+gap:0,
  instructionTop:above?Math.min(48,Math.max(0,iconY-tile/2-160)):Math.max(0,iconY-tile/2-pad),
  instructionBottom:above?Math.min(h,iconY+tile/2+pad):h,above};
}

// The copy's browser-measured height drives the card, independently of the phone.
export function instructionLayout(bounds,copyHeight){
 const {iconY,tile,h}=bounds,pad=18,gap=18;
 if(bounds.detached){const height=copyHeight+pad*2;return {above:true,available:h-pad*2,top:clamp(iconY-height/2,0,Math.max(0,h-height)),height,iconTop:0};}
 const aboveSpace=iconY-tile/2-gap-pad;
 const belowSpace=h-iconY-tile/2-gap-pad;
 const above=copyHeight<=aboveSpace||aboveSpace>=belowSpace;
 const available=Math.max(0,above?aboveSpace:belowSpace);
 const height=copyHeight+tile+gap+pad*2;
 const top=above?iconY+tile/2+pad-height:iconY-tile/2-pad;
 return {above,available,top,height,iconTop:iconY-top-tile/2};
}
