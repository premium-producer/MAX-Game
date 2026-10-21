// Completion decoration owns only the unselected field cards, never the phone
// or its landing queue. One batch per activity; no timeout/navigation barrier.
export function createCardPop(){
 const animations=new Map();let started=false;
 function clear(){for(const [node,animation]of animations){animation.cancel();node.remove();}animations.clear();started=false;}
 return {clear,start(nodes){
  if(started)return;started=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visible=[];
  for(const node of nodes){
   node.disabled=true;node.inert=true;node.style.pointerEvents='none';
   delete node._press;delete node.dataset.held;
   const rect=node.getBoundingClientRect(),style=getComputedStyle(node);
   if(reduced||node.dataset.pending||style.visibility==='hidden'||rect.bottom<=0||rect.top>=innerHeight||rect.right<=0||rect.left>=innerWidth){node.remove();continue;}
   visible.push({node,rect,style});
  }
  visible.sort((a,b)=>a.rect.top-b.rect.top||a.rect.left-b.rect.left);
  visible.forEach(({node,style},index)=>{
   const origin=style.transformOrigin.split(' ').map(parseFloat),x=node.offsetWidth/2-origin[0],y=node.offsetHeight/2-origin[1];
   const base=style.transform==='none'?'':style.transform;
   const transform=scale=>`${base} translate(${x}px,${y}px) scale(${scale}) translate(${-x}px,${-y}px)`;
   node.dataset.cardPopping=String(index);
   const animation=node.animate([
    {transform:transform(1),opacity:style.opacity,filter:'brightness(1)',offset:0},
    {transform:transform(1.055),opacity:style.opacity,filter:'brightness(1.35)',offset:.3},
    {transform:transform(.55),opacity:0,filter:'brightness(1.1)',offset:1},
   ],{duration:240,delay:index*90,easing:'ease-in-out',fill:'both'});
   animations.set(node,animation);
   animation.finished.catch(()=>{}).finally(()=>{node.remove();animations.delete(node);});
  });
 }};
}
