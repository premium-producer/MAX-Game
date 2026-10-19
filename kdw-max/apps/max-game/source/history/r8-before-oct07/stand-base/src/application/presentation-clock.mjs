/** Presentation-only bounded extrapolation; never changes a business phase. */
export function createPresentationClock({now=()=>performance.now()}={}){
 let snapshot=null,receivedAt=0,signature='',last=null;
 const valid=c=>c?.schemaVersion===1&&[c.serverTime,c.checkpointAt,c.maxExtrapolationMs].every(Number.isFinite)&&c.maxExtrapolationMs>=0&&c.maxExtrapolationMs<=1000&&c.serverTime<=c.checkpointAt+c.maxExtrapolationMs&&typeof c.held==='boolean';
 return {
  accept(next){const c=next?.view?.clock,key=JSON.stringify([next?.state?.sessionId,next?.state?.revision,c]);snapshot=next;if(key!==signature){signature=key;receivedAt=now();last=valid(c)?c.serverTime:null;}},
  read(connected=true){const c=snapshot?.view?.clock;if(!valid(c))return {time:null,stale:true};
   const age=Math.max(0,now()-receivedAt),held=c.held||snapshot.state.ownerActive!==true;
   if(connected&&!held)last=Math.max(last,Math.min(c.serverTime+age,c.checkpointAt+c.maxExtrapolationMs));
   return {time:last,stale:!connected||!held&&age>=c.maxExtrapolationMs,held};
  },
 };
}
