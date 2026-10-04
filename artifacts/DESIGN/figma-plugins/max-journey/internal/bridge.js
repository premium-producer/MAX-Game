// Export-only: appended to Guided's module scope, never shipped into the live game.
let exportBusy=false,exportFrozen=true;
const exportWait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function exportScreen(item){
 if(exportBusy)throw Error('Экспорт уже выполняется');exportBusy=true;
 try{
  if(!item.state||!['palm','ring','line','task','result','error','branch','complete','menu'].includes(item.kind))throw Error('Неизвестный кадр');
  window.__maxExportSize={width:item.width,height:item.height};
  foreground.cancelTransitions();foreground.dispose();host.replaceChildren();view='';phoneStep='';phoneToken='';phonePending='';popupToken='';edgePorts.clear();gesture=null;
  foreground=createJourneyWebGLUI({root,arena,getSize:()=>size,onFrame:tick,onMotion:()=>{changed();syncScene();}});field.setScreenForeground(foreground);
  controller=new RevealJourney(content,item.state.saved);controller.session=structuredClone(item.state.session);controller.activeId=item.state.activeId;controller.phase=item.state.phase;controller.elapsed=item.state.elapsed;controller.configure(item.width-48,item.height-48);controller.remaining[controller.session.mission]=180;
  camera.value=0;camera.velocity=0;focusTarget=0;palmPresence.value=['palm','holding','burst'].includes(controller.phase)?1:0;
  fit();render();if(item.kind==='line'){camera.value=0;focusTarget=0;}
  if(controller.phone){phoneX.value=controller.phone.x;phoneY.value=controller.phone.y;phoneX.velocity=0;phoneY.velocity=0;}
  phonePresence.value=Number(controller.phoneVisible);phonePresence.velocity=0;
  const scan=host.querySelector('[data-palm]');if(scan)scan.dataset.pathPresence='1';
  if(item.mediaIndex){const gallery=host.querySelector('[data-media-ids]');if(!gallery)throw Error('Нет галереи');const frames=mediaFrames({ids:gallery.dataset.mediaIds.split(',')}),selected=frames[item.mediaIndex];if(!selected)throw Error('Нет кадра галереи');const image=gallery.querySelector('img');image.src=selected.src;image.alt=selected.label;gallery.dataset.mediaIndex=String(item.mediaIndex);gallery.querySelector('.media-counter').textContent=`${item.mediaIndex+1} / ${frames.length}`;for(const b of gallery.querySelectorAll('[data-media-page]'))b.disabled=Number(b.dataset.mediaPage)<0?item.mediaIndex===0:item.mediaIndex===frames.length-1;}
  updateTargets();foreground.invalidate({layout:true});changed();syncScene();
  await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()));field.setServicePaused(false);ambient?.pause(false);
  await exportWait(1700);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));syncScene();field.setServicePaused(true);ambient?.pause(true);
  const capture=field.__figmaCapture(),combined=document.createElement('canvas');combined.width=size.width;combined.height=size.height;
  const ctx=combined.getContext('2d'),ambientCanvas=document.querySelector('#ambient');
  const composite=async url=>{ctx.clearRect(0,0,size.width,size.height);ctx.drawImage(ambientCanvas,0,0,size.width,size.height);const image=new Image();image.src=url;await image.decode();ctx.drawImage(image,0,0,size.width,size.height);return combined.toDataURL('image/png');};
  const result={...item,width:size.width,height:size.height,base:await composite(capture.base),reference:await composite(capture.full),layers:capture.layers,proof:{phase:controller.phase,labels:[...host.querySelectorAll('[data-object]')].filter(n=>n.dataset.captionVisible==='true').length,informationButtons:host.querySelectorAll('.instruction button').length,device:controller.phoneVisible?deviceMetrics():null}};delete result.state;return result;
 }finally{exportBusy=false;}
}
window.addEventListener('message',async event=>{if(event.source!==parent||event.data?.type!=='max-export-screen')return;try{parent.postMessage({type:'max-export-result',token:event.data.token,result:await exportScreen(event.data.screen)},'*');}catch(error){parent.postMessage({type:'max-export-error',token:event.data.token,error:error.message},'*');}});
