import {V5DeviceMorph} from './journey-v5-device-morph.mjs';

// One distance/clock drives both dimensions; the frozen stand sequencer still
// owns fade-out, resize, resource readiness and fade-in.
export function deviceMorphPath(options){
 const from=options.from??0,to=options.to??from;
 const fromHeight=options.fromHeight??0,toHeight=options.toHeight??fromHeight;
 const distance=Math.max(Math.abs(to-from),Math.abs(toHeight-fromHeight));
 return {distance,at(value){const t=distance?Math.min(1,Math.max(0,value/distance)):1;return {width:from+(to-from)*t,height:fromHeight+(toHeight-fromHeight)*t};}};
}
export class KdwDeviceMorph extends V5DeviceMorph{
 start(commit,reduced=false,options={}){
  const path=deviceMorphPath(options);
  return super.start(commit,reduced,{...options,from:0,to:path.distance,
   resize:value=>{const size=path.at(value);options.resize?.(size.width,size.height);}});
 }
}
