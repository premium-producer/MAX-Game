// Native WAAPI owns time/interpolation. DOM uses transform; WebGL reads its
// currentTime in the existing render loop, without a second clock/solver.
export function createGradientController({random=Math.random,speed=30,spread=.15,createClock=()=>new Animation(new KeyframeEffect(null,[],{duration:1000,iterations:Infinity}),document.timeline)}={}){
 const entries=new Map(),seeds=new Map();let paused=false,phaseSpread=360;
 const wrap=time=>(time%1000+1000)%1000;
 const baseTime=()=>{const first=entries.values().next().value;return first?(first.animation.currentTime??0)-first.phaseSeed*phaseSpread/360*1000:0;};
 const apply=entry=>{
  entry.animation.updatePlaybackRate(speed/360*(1+entry.variation*spread));
  if(paused)entry.animation.pause();else entry.animation.play();
 };
 return {
  angle(id){
   if(!entries.has(id)){
    if(!seeds.has(id))seeds.set(id,{phase:random(),variation:random()*2-1});
    const seed=seeds.get(id),base=baseTime(),animation=createClock();
    animation.currentTime=wrap(base+seed.phase*phaseSpread/360*1000);
    const entry={animation,variation:seed.variation,phaseSeed:seed.phase};entries.set(id,entry);apply(entry);
   }
   return wrap(entries.get(id).animation.currentTime??0)/1000*Math.PI*2;
  },
  sync(root){
   for(const [tile,entry] of entries)if(typeof tile!=='string'&&!tile.isConnected){entry.animation.cancel();entries.delete(tile);}
   const base=baseTime();
   for(const tile of root.querySelectorAll('.tile')){
    if(entries.has(tile))continue;
    const id=tile.id||tile.closest('[data-node-id]')?.dataset.nodeId;
    if(!id)continue;
    if(!seeds.has(id))seeds.set(id,{phase:random(),variation:random()*2-1});
    const seed=seeds.get(id),clip=tile.ownerDocument.createElement('span'),surface=tile.ownerDocument.createElement('span');
    clip.className='gradient-clip';surface.className='gradient-surface';clip.setAttribute('aria-hidden','true');clip.append(surface);tile.prepend(clip);
    const animation=surface.animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:1000,iterations:Infinity,easing:'linear'});
    animation.currentTime=wrap(base+seed.phase*phaseSpread/360*1000);
    const entry={animation,variation:seed.variation,phaseSeed:seed.phase,clip};entries.set(tile,entry);apply(entry);
   }
  },
  configure(options={}){
   if(Number.isFinite(options.phaseSpread)){
    const next=Math.min(360,Math.max(0,options.phaseSpread));
    // Native seek distributes stable per-button seeds around one shared phase.
    // Rebase only when this control changes; speed/pause never reset the phase.
    if(next!==phaseSpread){const base=baseTime();for(const {animation,phaseSeed} of entries.values())animation.currentTime=wrap(base+phaseSeed*next/360*1000);}
    phaseSpread=next;
   }
   if(Number.isFinite(options.speed))speed=Math.min(90,Math.max(5,options.speed));
   if(Number.isFinite(options.spread))spread=Math.min(.35,Math.max(0,options.spread));
   if(typeof options.paused==='boolean')paused=options.paused;
   for(const entry of entries.values())apply(entry);
  },
  dispose(){for(const entry of entries.values()){entry.animation.cancel();entry.clip?.remove();}entries.clear();seeds.clear();}
 };
}
