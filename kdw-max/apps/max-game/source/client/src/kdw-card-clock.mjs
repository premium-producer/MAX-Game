/** Card-only visual clock; the session/timer clock remains untouched.
 * Document timeline stays constant throughout a frame: variable DOM/WebGL work
 * must not change the distance travelled by cards between equal frame times.
 */
export function createPresentationClock({now=()=>globalThis.document?.timeline?.currentTime??performance.now(),smooth=false}={}){
 let snapshot=null,receivedAt=0,signature='',last=null,readAt=0,context='',running=false;
 const valid=c=>c?.schemaVersion===1&&[c.serverTime,c.checkpointAt,c.maxExtrapolationMs].every(Number.isFinite)&&c.maxExtrapolationMs>=0&&c.maxExtrapolationMs<=1000&&c.serverTime<=c.checkpointAt+c.maxExtrapolationMs&&typeof c.held==='boolean';
 return {
  accept(next){
   const c=next?.view?.clock,key=JSON.stringify([next?.state?.sessionId,next?.state?.revision,c]);
   const nextContext=JSON.stringify([next?.state?.sessionId,next?.state?.runId,next?.state?.taskId,next?.state?.screenId]);
   const continuous=smooth&&running&&context===nextContext&&valid(c)&&!c.held&&next.state.ownerActive===true&&now()-receivedAt<snapshot.view.clock.maxExtrapolationMs;
   snapshot=next;context=nextContext;
   if(key!==signature){signature=key;receivedAt=now();if(!continuous){last=valid(c)?c.serverTime:null;readAt=receivedAt;running=false;}}
  },
  read(connected=true){const c=snapshot?.view?.clock;if(!valid(c)){running=false;return {time:null,stale:true};}
   const age=Math.max(0,now()-receivedAt),held=c.held||snapshot.state.ownerActive!==true;
   const tick=now(),dt=Math.max(0,tick-readAt);readAt=tick;
   if(connected&&!held){
    const target=Math.min(c.serverTime+age,c.checkpointAt+c.maxExtrapolationMs);
    // Network checkpoints correct the visual clock gradually, not in one frame.
    // Gameplay still uses authoritative timestamps and the same extrapolation cap.
    const predicted=last+dt,correction=Math.max(-dt*.1,Math.min(dt*.1,(target-predicted)*.08));
    last=smooth?Math.max(last,Math.min(predicted+correction,c.checkpointAt+c.maxExtrapolationMs)):Math.max(last,target);
   }
   running=connected&&!held&&age<c.maxExtrapolationMs;
   return {time:last,stale:!connected||!held&&age>=c.maxExtrapolationMs,held};
  },
 };
}
