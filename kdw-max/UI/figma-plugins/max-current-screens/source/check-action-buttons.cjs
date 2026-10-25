// Measure glyph bounds as well as line count: nowrap alone can look consistent
// while painting the label outside its button (the original benefit bug).
module.exports=async win=>{
 const buttons=await win.webContents.executeJavaScript(`(()=>{
  return Array.from(document.querySelectorAll('.client-actions .client-action,.pc-forward button,.bn-source-forward button,.kdw-post-actions [data-post-finish],.kdw-store-actions [data-kdw-submit]')).filter(e=>{
   const r=e.getBoundingClientRect(),s=getComputedStyle(e);
   return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]');
  }).map(e=>{
   const s=getComputedStyle(e),w=parseFloat(s.width),box=e.getBoundingClientRect(),range=document.createRange(),rects=[],walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){
    const t=walker.currentNode;
    for(let i=0;i<t.length;i++){
     if(!t.textContent[i].trim())continue;
     range.setStart(t,i);range.setEnd(t,i+1);const r=range.getBoundingClientRect();if(r.width&&r.height)rects.push(r);
    }
   }
   const left=Math.min(...rects.map(r=>r.left)),right=Math.max(...rects.map(r=>r.right)),top=Math.min(...rects.map(r=>r.top)),bottom=Math.max(...rects.map(r=>r.bottom));
   return {label:e.textContent.trim(),font:s.fontFamily,background:s.backgroundImage,height:parseFloat(s.height)/w,radius:parseFloat(s.borderTopLeftRadius)/w,fontSize:parseFloat(s.fontSize)/w,lineHeight:parseFloat(s.lineHeight)/w,lines:new Set(rects.map(r=>Math.round(r.top))).size,
    transition:e.classList.contains('kdw-transition-button'),textOverflow:Math.max(0,box.left-left,right-box.right,box.top-top,bottom-box.bottom),horizontalInset:Math.min(left-box.left,box.right-right)/box.width,verticalInset:Math.min(top-box.top,box.bottom-bottom)/box.width};
  });
 })()`);
 for(const b of buttons){
  const height=b.lines===2&&!b.transition?96:64;
  for(const [key,target] of Object.entries({height:height/390,radius:25/390,fontSize:23/390,lineHeight:32/390}))if(Math.abs(b[key]-target)>.001)throw Error('Inconsistent action geometry: '+JSON.stringify(b));
  if(!b.font.includes('Max Sans')||b.lines<1||b.lines>2||(b.transition&&b.lines!==1))throw Error('Action label lines: '+JSON.stringify(b));
  if(b.textOverflow>.5||b.horizontalInset<.04||b.verticalInset<.015)throw Error('Action text outside padded surface: '+JSON.stringify(b));
 }
 return buttons;
};
