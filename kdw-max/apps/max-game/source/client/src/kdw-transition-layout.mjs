// Iteration 2: the reference and navigation form one vertically centred block.
// Coordinates here are viewport pixels, shared by the GPU and pointer targets.
export function referenceTransitionGeometry(device,reference,button,gap){
 const top=device.top+device.height/2-(reference.height+gap+button.height)/2;
 const left=reference.left+(reference.width-button.width)/2;

 return {referenceTop:top,buttonLeft:left,buttonTop:top+reference.height+gap};
}

// Iteration 1 remains the original device-relative layout in each renderer.
// Removing only our individual translation restores it without reparenting or
// changing the existing transforms, delegated events, opacity or input guards.
export function layoutDeviceTransitions(nodes){
 for(const node of nodes){node.style.removeProperty('translate');delete node.dataset.referenceTransition;}
 nodes.clear();
}
const selector='.kdw-transition-actions .kdw-transition-button,.client-actions .kdw-transition-button,.pc-forward .kdw-transition-button,.bn-source-forward .kdw-transition-button,.kdw-post-actions .kdw-transition-button,.kdw-store-actions .kdw-transition-button';
export function createTransitionLayout({document,params}){
 const moved=new Set();
 const visible=e=>{
  if(e.hasAttribute('data-transition-source')||e.closest('[hidden],[data-activity-ghost]'))return false;
  const s=getComputedStyle(e),r=e.getBoundingClientRect();
  return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
 };
 const shift=(node,dx,dy)=>{
  const r=node.getBoundingClientRect(),scale=r.width/node.offsetWidth;
  if(!(scale>0))return;
  node.style.translate=`${dx/scale}px ${dy/scale}px`;
  node.dataset.referenceTransition='true';moved.add(node);
 };
 return function layoutReferenceTransitions(){
  layoutDeviceTransitions(moved);
  // Preserve the previous browser/wall iterations; production pixel-map uses
  // the new layout by default. ?transitionLayout=device selects iteration 1.
  if(document.documentElement.dataset.pixelMap!=='true'||params.get('transitionLayout')==='device')return;
  const reference=document.querySelector('.task-dialog .instruction'),device=document.querySelector('.route-phone');
  if(!reference||!device||!visible(reference)||!visible(device))return;
  const buttons=[...document.querySelectorAll(selector)].filter(visible);
  if(buttons.length!==1)return;
  const button=buttons[0],r=reference.getBoundingClientRect(),b=button.getBoundingClientRect();
  const gap=24*r.width/reference.offsetWidth;
  const target=referenceTransitionGeometry(device.getBoundingClientRect(),r,b,gap);
  shift(reference,0,target.referenceTop-r.top);
  shift(button,target.buttonLeft-b.left,target.buttonTop-b.top);
 };
}
