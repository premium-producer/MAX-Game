// Measure actual browser line boxes used by the GPU text renderer.
module.exports=async win=>{
 const blocks=await win.webContents.executeJavaScript(`(()=>{
  return [...document.querySelectorAll('.instruction-copy h2,.instruction-copy p')].filter(e=>e.getBoundingClientRect().width>0&&!e.closest('[hidden]')).map(e=>{
   const lines=new Map(),range=document.createRange(),walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){const t=walker.currentNode;for(let i=0;i<t.length;i++){
    range.setStart(t,i);range.setEnd(t,i+1);const r=range.getBoundingClientRect();if(!r.height)continue;
    const y=Math.round(r.top*2)/2;lines.set(y,(lines.get(y)||'')+t.textContent[i]);
   }}
   return {tag:e.tagName,text:e.textContent,lines:[...lines.values()].map(s=>s.trim()).filter(Boolean),overflow:e.scrollWidth-e.clientWidth};
  });
 })()`);
 const dangling=/(?:^|\s)(?:из-за|из-под|без|для|при|над|под|про|или|во|со|ко|об|от|до|по|из|за|на|не|ни|но|да|в|с|к|у|о|и|а)$/iu;
 for(const b of blocks){
  if(/\.$/u.test(b.text.trim()))throw Error('Trailing period in reference copy: '+JSON.stringify(b));
  if(b.overflow>1)throw Error('Typography overflow: '+JSON.stringify(b));
  if(b.lines.slice(0,-1).some(line=>dangling.test(line)))throw Error('Dangling short word: '+JSON.stringify(b));
  const normalized=b.text.replace(/\s+/gu,' ').trim(),expected={
   'Настроим тип канала – приватный или публичный':['Настроим тип канала –','приватный или публичный'],
   'Канал создан! Начинаем делиться самым важным':['Канал создан!','Начинаем делиться самым важным']
  }[normalized];
  if(expected&&JSON.stringify(b.lines.map(s=>s.replace(/\s+/gu,' ')))!==JSON.stringify(expected))throw Error('Semantic line break: '+JSON.stringify(b));
 }
 return blocks;
};
