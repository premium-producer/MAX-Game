// Sibling overlay: never nest a button in the task icon's existing button.
export function mountTaskSkip({host,onSkip}){
 const button=document.createElement('button');
 button.type='button';button.className='kdw-task-skip';button.textContent='Пропустить';button.hidden=true;
 document.body.append(button);
 let pending=false;
 button.addEventListener('click',async()=>{
  if(pending||button.disabled||button.hidden)return;
  pending=true;button.disabled=true;
  try{await onSkip(button.dataset.skipTask);}
  finally{pending=false;}
 });
 return {
  update(state,enabled){
   const node=state?.taskId?host.querySelector(`[data-object="${state.taskId}"]`):null;
   const label=node?.querySelector('.object-label'),tile=node?.querySelector('.tile');
   button.hidden=!enabled||state?.status!=='task'||!node||node.inert||!label||!tile||getComputedStyle(node).visibility==='hidden';
   if(button.hidden)return;
   const r=tile.getBoundingClientRect(),caption=label.getBoundingClientRect(),scale=r.width/256;
   button.dataset.skipTask=state.taskId;button.setAttribute('aria-label',`Пропустить задание ${label.textContent.trim()}`);
   button.disabled=pending||!state.ownerActive;
   Object.assign(button.style,{left:`${r.left+r.width/2}px`,top:`${caption.bottom+12*scale}px`,fontSize:`${Math.max(14,28*scale)}px`,padding:`${Math.max(8,12*scale)}px ${Math.max(16,28*scale)}px`});
  },
  dispose(){button.remove();},
 };
}
