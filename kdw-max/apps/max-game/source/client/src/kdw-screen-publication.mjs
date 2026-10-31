// Observers read the rendered screen, never acquire or advance a game session.
export function screenPublication({state,phase='loading',active=true,ready=false,transitioning=false}){
 const stage=state?.status??'loading',menu=stage==='menu';
 return {stage,screenId:menu?'max-menu':state?.screenId??'max-'+stage,
  missionId:menu?null:state?.missionId??null,taskId:menu?null:state?.taskId??null,
  phase:menu?'menu':phase,presentation:!active?'paused':!ready?'loading':transitioning?'transitioning':'visible',ready:!!ready};
}
export function startScreenPublication(getState,{fetch=globalThis.fetch,now=()=>performance.now()}={}){
 const publisherId=crypto.randomUUID();let stopped=false,busy=false,sequence=0,sent='',sentAt=-Infinity,request=null;
 async function tick(){
  if(stopped||busy)return;
  const data=screenPublication(getState()),signature=JSON.stringify(data);
  if(signature===sent&&now()-sentAt<2000)return;
  busy=true;request=new AbortController();const timeout=setTimeout(()=>request?.abort(),1500);
  try{const response=await fetch('/__kdw/screen/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({publisherId,sequence:++sequence,...data}),signal:request.signal});if(response.ok){sent=signature;sentAt=now();}}
  catch{/* Telemetry must never block the visitor. */}
  finally{clearTimeout(timeout);request=null;busy=false;}
 }
 const timer=setInterval(()=>void tick(),200);void tick();
 return()=>{stopped=true;clearInterval(timer);request?.abort();};
}
