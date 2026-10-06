// Explicit-entry preparation only. The manual host owns warm-shell readiness.
// Physical presentation is acknowledged only after the native texture receipt.
const params=new URLSearchParams(location.search),assignmentId=params.get('assignment'),sessionId=params.get('session');
let stopped=false,prepared=false;
addEventListener('pagehide',()=>{stopped=true;},{once:true});
async function ready(){
 if(stopped||prepared||params.get('shell')==='1'||!assignmentId||!sessionId)return;
 if(document.documentElement.dataset.gameReady!=='true'||document.visibilityState!=='visible'){setTimeout(ready,500);return;}
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 try{
  const auth=await(await fetch('/bridge/player')).json();
  const response=await fetch('/bridge/presented',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Player':auth.token},body:JSON.stringify({assignmentId,sessionId})});
  const result=await response.json();prepared=response.ok&&result.browserPrepared===true&&result.physicalPresented===false;
  if(prepared)document.documentElement.dataset.browserPrepared='true';
 }catch{}
 if(!prepared&&!stopped)setTimeout(ready,500);
}
ready();
