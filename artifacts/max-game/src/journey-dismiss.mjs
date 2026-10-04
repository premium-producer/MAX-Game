// Only the visible task panels protect a tap. Empty layout space and the rest
// of the viewport dismiss without passing the same gesture to the field below.
export function installTaskDismiss({root,getOpen,close,enabled=()=>true}){
 const pointers=new Map();let suppressClick=false;
 const outside=target=>{
  const open=getOpen();
  return open.some(item=>item.panels.some(panel=>panel.contains(target)))?[]:open;
 };
 const consume=e=>{e.preventDefault();e.stopImmediatePropagation();};
 const down=e=>{
  suppressClick=false;
  if(!enabled()||e.button!==0)return;
  const open=outside(e.target);if(open.length)pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,open});
 };
 const up=e=>{
  const start=pointers.get(e.pointerId);pointers.delete(e.pointerId);
  if(!enabled()||!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>18)return;
  const open=outside(e.target).filter(item=>start.open.some(p=>p.popup===item.popup));
  if(!open.length)return;
  consume(e);suppressClick=true;open.forEach(close);
 };
 const click=e=>{
  if(suppressClick&&e.detail!==0){suppressClick=false;consume(e);return;}
  if(!enabled()||e.detail!==0)return;
  const open=outside(e.target);if(open.length){consume(e);open.forEach(close);}
 };
 const cancel=e=>pointers.delete(e.pointerId);
 for(const [event,handler]of [['pointerdown',down],['pointerup',up],['pointercancel',cancel],['click',click]])root.addEventListener(event,handler,true);
}
