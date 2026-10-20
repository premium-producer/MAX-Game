// Both activities use the live device rectangle and the same right-hand field.
// Never recenter the route or introduce another scene projection.
export function activityGeometry(){
 const phone=document.querySelector('.route-phone'),canvas=phone?.querySelector('.task-media-canvas'),arena=document.querySelector('#arena');
 if(!canvas||!arena)return null;
 const rect=canvas.getBoundingClientRect(),a=arena.getBoundingClientRect(),scale=a.width/parseFloat(arena.style.width);
 if(!(rect.width>0&&scale>0))return null;
 const host=phone.closest('.journey-zone');
 return {phone,rect,scale,alpha:Math.max(0,Math.min(1,Number(phone.dataset.pathPresence??0),Number(host?.dataset.contentPresence??1))),
  matched:phone.dataset.mediaReadyKey===phone.dataset.sceneVersion};
}
export function rightCardRect(g,spawn){
 const gap=32*g.scale,edge=64*g.scale,available=Math.max(2,innerWidth-g.rect.right-edge-16);
 const slot=Math.max(1,Math.min(440*g.scale,(available-gap)/2)),w=slot*(spawn.size??1);
 const x=g.rect.right+edge+(spawn.column%2)*(slot+gap)+(slot-w)*(spawn.offset??0);
 const entry=600*g.scale,y=-entry+(innerHeight+entry+64*g.scale)*Math.max(0,spawn.progress);
 return {x,y,w,unit:w/440};
}
export function alignActivityPhone(node,g){
 const scale=g.rect.width/390;
 Object.assign(node.style,{left:g.rect.left+'px',top:g.rect.top+'px',height:g.rect.height/scale+'px',transform:`scale(${scale})`,opacity:String(g.alpha)});
 node.inert=g.alpha<.97||g.phone.inert;
}
// Keep the outgoing visual briefly, but revoke all input immediately.
export function fadeActivityOut(root){
 if(root.hidden||!root.childElementCount||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const ghost=root.cloneNode(true);ghost.removeAttribute('id');ghost.dataset.activityGhost='true';ghost.inert=true;ghost.setAttribute('aria-hidden','true');
 Object.assign(ghost.style,{position:'fixed',inset:'0',zIndex:'102',overflow:'hidden',pointerEvents:'none',color:'#fff',fontFamily:"'Max Sans',sans-serif"});
 for(const node of ghost.querySelectorAll('[id]'))node.removeAttribute('id');
 document.body.append(ghost);
 const animation=ghost.animate([{opacity:1},{opacity:0}],{duration:280,easing:'ease-out',fill:'forwards'});
 animation.finished.catch(()=>{}).finally(()=>ghost.remove());
}
