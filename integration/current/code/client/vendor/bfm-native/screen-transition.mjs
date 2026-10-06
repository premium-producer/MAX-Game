// Adapted from BFM-DESIGN-ENGINE app/public/app.js setState/playScreenEntrance.
// Upstream excerpts and SHA provenance are adjacent. Browser APIs own animation.
export function createBFMTransition({document, app, screens, reduced, entrance}) {
  let generation=0, transition=null, current=null, disposed=false;
  const stop=()=>{ generation++; transition?.skipTransition(); transition=null; };
  const apply=state=>{
    app.dataset.state=state;
    for(const screen of screens) screen.hidden=screen.dataset.screen!==state;
    current=state;
  };
  return {
    async show(state,{immediate=false,refresh=false,update=()=>{},componentEntry=true}={}) {
      if(disposed||state===current&&!immediate&&!refresh)return false;
      stop(); const ticket=generation;
      const valid=()=>!disposed&&ticket===generation;
      const incoming=screens.find(screen=>screen.dataset.screen===state);
      if(!incoming)throw Error(`Unknown BFM screen: ${state}`);
      screens.forEach(screen=>screen.classList.remove('is-pending-entrance'));
      const updateState=()=>{if(valid()){update();if(componentEntry)incoming.classList.add('is-pending-entrance');apply(state);}};
      app.classList.add('is-view-transitioning');app.inert=true;
      try {
        if(!immediate&&!reduced()&&document.startViewTransition){
          transition=document.startViewTransition(updateState);
          // ready may reject when the browser skips a snapshot. The DOM update
          // and finished still have their own lifecycle (MDN ViewTransition).
          transition.ready?.catch(()=>{});
          await transition.finished;
        }else updateState();
        if(!valid())return false;
        incoming.classList.remove('is-pending-entrance');
        if(componentEntry)await entrance(incoming,{immediate:immediate||reduced()});
        return valid();
      } finally {
        if(valid()){
          transition=null;app.inert=false;
          app.classList.remove('is-view-transitioning');
          incoming.classList.remove('is-pending-entrance');
        }
      }
    },
    cancel(){stop();app.inert=false;app.classList.remove('is-view-transitioning');},
    dispose(){disposed=true;this.cancel();}
  };
}
