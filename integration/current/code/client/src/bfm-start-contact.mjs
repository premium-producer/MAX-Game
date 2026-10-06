// MAX contact adapter. Native pointer capture owns the gesture; SessionPort
// measures/validates the 800ms hold. No presentation timer grants completion.
export function bindBFMPalm({button,session,enabled,onHeld=()=>{}}){
 let contact=null;
 const inside=e=>{const r=button.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;};
 const finish=(type,within=false)=>{
  if(contact===null)return;
  const id=contact;contact=null;onHeld(false);
  if(typeof id==='number'&&button.hasPointerCapture(id))button.releasePointerCapture(id);
  void session.contact(id,type,within);
 };
 const down=e=>{
  if(contact!==null||!enabled()||e.button!==0||e.isPrimary===false)return;
  e.preventDefault();button.setPointerCapture(e.pointerId);contact=e.pointerId;
  onHeld(true);void session.contact(contact,'down',true);
 };
 const move=e=>{if(e.pointerId===contact&&!inside(e))finish('cancel');};
 const up=e=>{if(e.pointerId===contact)finish('up',inside(e));};
 const cancel=e=>{if(e.pointerId===contact)finish('cancel');};
 const keydown=e=>{if(![' ','Enter'].includes(e.key)||e.repeat)return;e.preventDefault();if(contact===null&&enabled()){contact='keyboard';onHeld(true);void session.contact(contact,'down',true);}};
 const keyup=e=>{if([' ','Enter'].includes(e.key)&&contact==='keyboard'){e.preventDefault();finish('up',true);}};
 const blur=()=>finish('cancel');
 const handlers={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,lostpointercapture:cancel,keydown,keyup,blur};
 Object.entries(handlers).forEach(([type,fn])=>button.addEventListener(type,fn));
 return {cancel:()=>finish('cancel'),dispose(){finish('cancel');Object.entries(handlers).forEach(([type,fn])=>button.removeEventListener(type,fn));}};
}
