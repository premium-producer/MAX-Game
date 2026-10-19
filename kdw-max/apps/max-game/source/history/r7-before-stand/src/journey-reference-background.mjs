// Keep Figma's conic foreignObject fills in a document: SVG loaded as img drops them.
export function referenceBackground(canvas){
  const frame=document.createElement('iframe');
  frame.id=canvas.id;
  frame.title='Фон MAX из макета';
  frame.setAttribute('aria-hidden','true');
  frame.setAttribute('sandbox','');
  frame.tabIndex=-1;
  frame.style.cssText='border:0;background:#0D001A;pointer-events:none';
  let disposed=false;
  frame.addEventListener('load',()=>{
    if(!disposed)document.documentElement.dataset.backgroundReady='true';
  },{once:true});
  frame.src=new URL('./assets/backgrounds/figma-game-background.svg',import.meta.url).href;
  canvas.replaceWith(frame);
  return {
    pause(){}, // Static reference: no render loop or live wall subscription.
    scanPulse(){}, // Existing foreground owns the palm particles.
    dispose(){disposed=true;frame.remove();delete document.documentElement.dataset.backgroundReady;}
  };
}
