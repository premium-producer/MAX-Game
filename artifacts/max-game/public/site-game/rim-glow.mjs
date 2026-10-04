import config from './rim-glow.json?v=phase50' with {type:'json'};

const validRange=(value,fallback,positive=false)=>{
 const min=Number(value?.min),max=Number(value?.max);
 return Number.isFinite(min)&&Number.isFinite(max)&&min<=max&&(!positive||min>0)?{min,max}:fallback;
};
const baseDuration=Number.isFinite(config.baseDurationSeconds)&&config.baseDurationSeconds>0?config.baseDurationSeconds:12;
const speedRange=validRange(config.speedMultiplier,{min:.96,max:1.04},true);
const phaseRange=validRange(config.phaseCycles,{min:0,max:1});
const seed=typeof config.seed==='string'?config.seed:'max-site-rim-v1';
const unit=(key,channel)=>{
 let hash=2166136261;
 for(const char of `${seed}:${channel}:${key}`){hash=Math.imul(hash^char.charCodeAt(0),16777619);}
 if(channel==='phase'){
  hash=Math.imul(hash^(hash>>>16),0x7feb352d);
  hash=Math.imul(hash^(hash>>>15),0x846ca68b);
  hash^=hash>>>16;
 }
 return (hash>>>0)/4294967296;
};
const within=(range,value)=>range.min+(range.max-range.min)*value;
const activeAnimations=new Set();

export function glowTiming(key){
 const speed=within(speedRange,unit(key,'speed'));
 const durationSeconds=baseDuration/speed;
 const phaseCycles=within(phaseRange,unit(key,'phase'));
 return {durationSeconds,phaseCycles};
}

// Keep the same eight points as the brandbook orbit, but allot time by the
// distance between points rather than giving every half-edge one eighth.
export function glowTravelFrames(width,height,glowWidth,glowHeight,inner,outer){
 const midX=(width-glowWidth)/2,midY=(height-glowHeight)/2;
 const points=[
  [outer,outer],[midX,outer],[width+inner,outer],
  [width+inner,midY],[width+inner,height+inner],
  [midX,height+inner],[outer,height+inner],[outer,midY],[outer,outer]
 ];
 const distances=points.slice(1).map(([x,y],i)=>Math.hypot(x-points[i][0],y-points[i][1]));
 const perimeter=distances.reduce((sum,distance)=>sum+distance,0);
 let traveled=0;
 return points.map(([x,y],i)=>{
  if(i)traveled+=distances[i-1];
  return {transform:`translate(${x}px,${y}px)`,offset:i===points.length-1?1:traveled/perimeter};
 });
}

export function applyGlowTiming(element,key){
 const {durationSeconds,phaseCycles}=glowTiming(key);
 element.style.setProperty('--animated-card-glow-duration',`${durationSeconds.toFixed(3)}s`);
 element.style.setProperty('--animated-card-glow-delay',`${(-durationSeconds*phaseCycles).toFixed(3)}s`);
 const track=element.querySelector('.animated-card__glow-track');
 const glow=element.querySelector('.animated-card__glow');
 if(!track||!glow||!track.offsetWidth||!track.offsetHeight||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const style=getComputedStyle(element);
 const inner=Number.parseFloat(style.getPropertyValue('--animated-card-glow-in'));
 const outer=Number.parseFloat(style.getPropertyValue('--animated-card-glow-out'));
 const frames=glowTravelFrames(track.offsetWidth,track.offsetHeight,glow.offsetWidth,glow.offsetHeight,Number.isFinite(inner)?inner:-60,Number.isFinite(outer)?outer:-100);
 const animation=glow.animate(frames,{duration:durationSeconds*1000,delay:-durationSeconds*phaseCycles*1000,iterations:Infinity,easing:'linear',fill:'both'});
 if(document.hidden)animation.pause();
 activeAnimations.add(animation);
}

export function setGlowPaused(paused){for(const animation of activeAnimations){if(paused)animation.pause();else animation.play();}}
export function clearGlowTiming(){for(const animation of activeAnimations)animation.cancel();activeAnimations.clear();}
