// Browser compositor combines the live local GPU canvas with the game foreground.
// Isolated import map shares the viewer's actual module graph, not a copied shader.
export function commonMapBackground(canvas,{standMask=false}={}){
  const frame=document.createElement('iframe');
  frame.id=canvas.id;frame.title='Фон общей карты';frame.setAttribute('aria-hidden','true');
  frame.tabIndex=-1;frame.style.border='0';
  let closed=false;
  const receive=event=>{
    if(closed||event.source!==frame.contentWindow||event.origin!==location.origin)return;
    if(event.data?.type==='max-background-mask-status'){const m=event.data.mask;document.documentElement.dataset.backgroundMask=m.atlas;document.documentElement.dataset.backgroundMaskSequence=String(m.sequence);document.documentElement.dataset.backgroundMaskFrame=String(m.sourceFrame);}
    if(event.data?.type==='max-background-ready')document.documentElement.dataset.backgroundReady='true';
    if(event.data?.type==='max-background-error'){
      document.documentElement.dataset.backgroundReady='false';
      console.error('MAX background:',event.data.message);
    }
  };
  addEventListener('message',receive);
  frame.src='/viewer/common-map-game-background.html?output=1'+(standMask?'&mask=stand':'');canvas.replaceWith(frame);
  return {
    pause(paused){frame.contentWindow?.postMessage({type:'max-background-pause',paused},location.origin);},
    // Palm particles continue in the existing foreground renderer; no legacy grid under LumiCells.
    scanPulse(){},
    dispose(){closed=true;removeEventListener('message',receive);frame.remove();delete document.documentElement.dataset.backgroundReady;delete document.documentElement.dataset.backgroundMask;delete document.documentElement.dataset.backgroundMaskSequence;delete document.documentElement.dataset.backgroundMaskFrame;}
  };
}
