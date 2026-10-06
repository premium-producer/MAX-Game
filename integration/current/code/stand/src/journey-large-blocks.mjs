// Experimental controls and hit targets share the same geometry.
export const LARGE_BLOCK_SCALE=2.5/1.5;
export function enlargeRouteLayout(layout,width,height,metrics){
 const ids=Object.keys(layout.points),n=ids.length,cx=metrics.cx??metrics.w/2;
 // Two-pixel control envelopes must also fit at the outside edges; otherwise
 // the first clamped right-hand slot steals the row below it.
 const factor=metrics.tile/270;
 const left=18+364*factor+cx,right=width-20-metrics.w+cx;
 const top=20+metrics.tile/2,bottom=height-20-metrics.h+metrics.tile/2;
 const cells=n<=4?[[0,0],[1,0],[1,1],[0,1]]:[[0,0],[1,0],[1,.5],[1,1],[0,1],[0,.5]];
 ids.forEach((id,i)=>{const [x,y]=cells[i];Object.assign(layout.points[id],{x:left+(right-left)*x,y:top+(bottom-top)*y});});
 for(const slot of layout.slots)Object.assign(slot,layout.points[slot.id]);
 layout.captionWidth=290*factor;return layout;
}

// Measure at final line wrapping. Only windows shrink further to fit the screen.
export function fitLargeWindows(host,requested=LARGE_BLOCK_SCALE){
 for(const window of host.querySelectorAll('.cta-copy,.mission-choices,.final-copy,.field-success,.reset-popup')){
  let scale=requested;
  for(let pass=0;pass<24;pass++){
   window.style.setProperty('--window-ui-scale',String(scale));
   const containers=window.matches('.mission-choices')?[...window.querySelectorAll('.mission-card')]:[window];
   const outside=containers.some(box=>{
    const r=box.getBoundingClientRect();
    return [...box.children].some(child=>{const c=child.getBoundingClientRect();return c.left<r.left-1||c.right>r.right+1||c.top<r.top-1||c.bottom>r.bottom+1;});
   })||window.scrollHeight>window.clientHeight+1;
   const parent=host.getBoundingClientRect(),r=window.getBoundingClientRect();
   if(!outside&&r.height<=parent.height-24)break;
   scale*=.92;
  }
  window.dataset.fittedScale=String(scale);
 }
}
