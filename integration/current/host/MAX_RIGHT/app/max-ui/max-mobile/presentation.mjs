const MODES=new Set(['standard','background','assets']);
export function validPresentation(state){return !!state&&MODES.has(state.desiredMode)&&(state.effectiveMode===null||MODES.has(state.effectiveMode))&&Number.isSafeInteger(state.revision)&&state.revision>=0&&Number.isSafeInteger(state.modeEpoch)&&state.modeEpoch>=0&&typeof state.phase==='string';}

// This client acknowledges rendered policy, never physical LED output or gameplay.
export function createPresentationClient({fetchImpl=globalThis.fetch,rendererBootId=globalThis.crypto.randomUUID(),nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve))}={}){
 let owner=null,attached=false,attachedBoot=null,current=null,serial=0,closed=false,acked='',pending=null;
 const key=s=>`${s.revision}:${s.modeEpoch}:${s.desiredMode}`;
 async function wait(work,signal){
  if(!signal)return work();
  if(signal.aborted)throw Error('PRESENTATION_ABORTED');
  let abort;
  try{return await Promise.race([Promise.resolve().then(work),new Promise((_,reject)=>{abort=()=>reject(Error('PRESENTATION_ABORTED'));signal.addEventListener('abort',abort,{once:true});})]);}
  finally{signal.removeEventListener('abort',abort);}
 }
 async function post(action,body,signal){
  const credential=await fetchImpl('/bridge/player',{cache:'no-store',signal});
  if(!credential.ok)throw Error('PRESENTATION_CREDENTIAL_UNAVAILABLE');
  const {token}=await credential.json();
  if(typeof token!=='string'||token.length<32)throw Error('PRESENTATION_CREDENTIAL_INVALID');
  const response=await fetchImpl('/bridge/presentation/'+action,{method:'POST',cache:'no-store',signal,headers:{'Content-Type':'application/json','X-Local-Player':token},body:JSON.stringify({rendererBootId,...body})});
  if(!response.ok)throw Error('PRESENTATION_'+action.toUpperCase()+'_REJECTED');
  const state=await response.json();if(!validPresentation(state))throw Error('PRESENTATION_RESPONSE_INVALID');return state;
 }
 return {
  async accept(state,signal){
   if(closed||!validPresentation(state)||typeof state.owner!=='string'||!state.owner)throw Error('PRESENTATION_CONTEXT_INVALID');
   if(owner!==state.owner){owner=state.owner;attached=false;attachedBoot=null;current=null;acked='';serial++;}
   if(current&&(state.modeEpoch<current.modeEpoch||state.revision<current.revision))throw Error('PRESENTATION_STALE_CONTEXT');
   // MASTER can restart without replacing this role's gateway lease. Its boot
   // fence explicitly revokes the renderer in a newer epoch; reattach by CAS.
   // A non-null replacement belongs to another renderer and is never stolen.
   if(attached&&current&&state.rendererBootId===null&&state.modeEpoch>current.modeEpoch&&state.phase==='pending'&&state.effectiveMode===null){
    attached=false;attachedBoot=null;acked='';serial++;
   }
   if(!attached){
    const generation=serial,reply=await post('attach',{expectedEpoch:state.modeEpoch},signal);
    if(closed||generation!==serial)throw Error('PRESENTATION_SUPERSEDED');
    attached=true;attachedBoot=reply.rendererBootId??null;state={...reply,owner};
   }else if(attachedBoot&&state.rendererBootId!==attachedBoot){throw Error('PRESENTATION_RENDERER_REPLACED');}
   if(!current||key(current)!==key(state)){serial++;current=state;acked='';}
   else current=state;
   return {...state,backgroundOnly:state.desiredMode==='background'};
  },
  isCurrent(state){return !closed&&!!current&&key(current)===key(state)&&current.owner===state.owner;},
  async applied(state,waitUntilSettled,signal){
   if(!this.isCurrent(state)||acked===key(state)||pending===key(state))return false;
   const generation=serial,id=key(state);pending=id;
   try{
    // A hidden/detached document can stop requestAnimationFrame indefinitely.
    // Abort releases this poll and prevents an old frame from publishing ACK.
    await wait(waitUntilSettled,signal);await wait(nextFrame,signal);
    if(closed||generation!==serial||!this.isCurrent(state))return false;
    const reply=await post('ack',{revision:state.revision,modeEpoch:state.modeEpoch,mode:state.desiredMode},signal);
    if(closed||generation!==serial||!this.isCurrent(state))return false;
    if(key(reply)!==id)throw Error('PRESENTATION_ACK_SUPERSEDED');
    acked=id;return true;
   }finally{if(pending===id)pending=null;}
  },
  invalidate(){serial++;},
  close(){closed=true;serial++;},
  snapshot(){return {rendererBootId,owner,attached,current,acked};},
 };
}
