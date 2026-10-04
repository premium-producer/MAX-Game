// This explicit local adapter reports readiness only after the pinned v5 GPU boot
// reports gameReady and the browser has had two frame opportunities to paint.
const params=new URLSearchParams(location.search),assignmentId=params.get('assignment'),sessionId=params.get('session');
let stopped=false,accepted=false;
addEventListener('pagehide',()=>{stopped=true;},{once:true});
async function ready(){
 if(stopped||accepted)return;
 if(document.documentElement.dataset.gameReady!=='true'||document.visibilityState!=='visible'){setTimeout(ready,500);return;}
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 try{
  const auth=await(await fetch('/bridge/player')).json();
  const response=await fetch('/bridge/presented',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Player':auth.token},body:JSON.stringify({assignmentId,sessionId})});
  const result=await response.json();accepted=response.ok&&result.accepted===true;
  if(accepted)document.documentElement.dataset.masterPresented='true';
 }catch{}
 if(!accepted&&!stopped)setTimeout(ready,500);
}
ready();
