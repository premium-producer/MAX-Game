// Persisted receipts use epoch milliseconds. Elapsed time must never go backwards.
export function createTrustedClock({wall=()=>Date.now(),monotonic=()=>performance.now()}={}){
 let last=null,mark=monotonic();
 const read=()=>{
  const raw=Math.floor(wall()),next=monotonic();
  if(!Number.isSafeInteger(raw)||raw<0||!Number.isFinite(next))throw Object.assign(Error('INVALID_TRUSTED_TIME'),{code:'INVALID_TRUSTED_TIME'});
  last=Math.max(raw,last===null?raw:last+Math.max(0,next-mark));mark=next;
  return Math.floor(last);
 };
 read.recover=checkpoint=>{
  const current=read();
  // A valid receipt chain can legitimately be ahead after an OS clock correction.
  // Larger jumps require operator correction, not silent replacement of saved data.
  if(checkpoint-current>86400000)throw Object.assign(Error('CLOCK_CORRECTION_REQUIRED'),{code:'CLOCK_CORRECTION_REQUIRED'});
  last=Math.max(last,checkpoint);
 };
 return read;
}
