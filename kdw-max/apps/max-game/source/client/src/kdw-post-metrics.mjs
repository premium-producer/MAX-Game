// Presentation counters derived from the accepted publication clock, not wall time.
export const COUNTER_DURATION=700;
export function counterProgress(age){const t=Math.max(0,Math.min(1,age/COUNTER_DURATION));return 1-(1-t)**3;}
export function postMetrics(row,elapsed,reactionAge=null){
 const age=Math.max(0,elapsed-(row.elapsedMs??0)),progress=1-Math.exp(-age/4500);
 const reactions=counterProgress(reactionAge??age);
 const variation=(row.index??0)%7;
 return {views:1+Math.floor(progress*(row.good?1199+variation*83:179+variation*19)),
  fire:Math.round(reactions*(row.good?1200+variation*17:8+variation)),
  heart:Math.round(reactions*(row.good?108+variation*7:3+variation)),
  time:`09:${String(41+Math.floor((row.elapsedMs??0)/60000)%19).padStart(2,'0')}`};
}
export function formatPostCount(value){return value>=1000?(value/1000).toFixed(1).replace('.',',')+'К':String(value);}
