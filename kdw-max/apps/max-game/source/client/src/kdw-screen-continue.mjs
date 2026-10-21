const contains=(r,x,y)=>r.width>0&&r.height>0&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
const controls='button,input,textarea,select,a,[contenteditable="true"],[role="button"]';

// Expand the existing single footer action to the device's image surface.
// Keep the original button/token/command and all host eligibility checks.
export function screenContinuationTarget(root,target,x,y,screenId){
 if(target?.closest?.(controls))return null;
 for(const shell of root.querySelectorAll('.route-phone')){
  if(shell.closest('[inert],[hidden]')||shell.dataset.mediaReadyKey!==shell.dataset.sceneVersion)continue;
  const canvas=shell.querySelector('.task-media-canvas'),rect=canvas?.getBoundingClientRect();
  if(!rect||!contains(rect,x,y))continue;
  const actions=[...shell.querySelectorAll('.client-actions button[data-answer]')];
  if(actions.length!==1)continue;
  const button=actions[0];
  if(button.disabled||button.dataset.actionDisabled==='true'||button.dataset.screenId!==screenId)continue;
  // Hotspots retain their precise semantic action, including disabled ones.
  if([...canvas.querySelectorAll(controls)].some(n=>contains(n.getBoundingClientRect(),x,y)))continue;
  return {button,rect};
 }
 return null;
}
