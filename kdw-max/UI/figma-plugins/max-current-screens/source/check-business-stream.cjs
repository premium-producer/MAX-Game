const fs=require('fs'),path=require('path');
const content=require('../../../../apps/max-game/source/client/src/kdw-business-content.json');
const images=require('../../../../apps/max-game/source/client/src/kdw-business-images.json');
module.exports=async(win,f,clock,report)=>{
 const posts=f.taskId==='business.channel',bank=content.banks[f.sector][posts?'posts':'products'],seen=new Map();
 const selector=posts?'.kdw-falling-post':'.kdw-product-stream .kdw-product';
 for(let ms=6000;ms<=50000&&seen.size<10;ms+=200){
  await win.webContents.executeJavaScript(`__figmaCapture.clock(${clock-4500+ms})`);
  await new Promise(r=>setTimeout(r,35));
  const rows=await win.webContents.executeJavaScript(`(()=>{
   const clean=s=>s.replace(/\\s+/g,' ').trim();
   return [...document.querySelectorAll(${JSON.stringify(selector)})].filter(n=>getComputedStyle(n).visibility!=='hidden').map(n=>{
    const t=n.querySelector('${posts?'.kdw-fall-title':'.kdw-product-title'}'),d=n.querySelector('${posts?'.kdw-fall-body':'.kdw-product-description'}'),r=n.getBoundingClientRect(),title=t.getBoundingClientRect();
    const image=n.querySelector('${posts?'.kdw-fall-photo img':'img.kdw-product-photo'}');
    return {id:n.dataset.${posts?'post':'kdwProduct'},image:image?{src:image.currentSrc,complete:image.complete,width:image.naturalWidth,height:image.naturalHeight}:null,title:clean(t.textContent),description:clean(d.textContent),price:${posts?'null':"clean(n.querySelector('strong').textContent)"},overflow:Math.max(0,title.right-r.right,r.left-title.left,t.scrollWidth-t.clientWidth),disabled:n.disabled};
   });
  })()`);
  for(const row of rows){
   const expected=bank.find(p=>p.id===row.id);if(!expected)throw Error('Unknown live card '+row.id);
   const clean=s=>s.replace(/\s+/g,' ').trim();
   if(row.title!==clean(expected.title)||row.description!==clean(expected.description))throw Error('Wrong rendered copy '+JSON.stringify(row));
   if(!posts&&Number(row.price.replace(/\D/g,''))!==expected.price)throw Error('Wrong rendered price '+row.id);
   if(row.overflow>1)throw Error('Card title overflows '+JSON.stringify(row));
   if(!row.image?.complete||row.image.width!==960||row.image.height!==640||!row.image.src.endsWith('/'+images[row.id].path))throw Error('Missing or wrong photograph '+JSON.stringify(row));
   seen.set(row.id,row);
  }
 }
 if(seen.size!==10)throw Error('Incomplete live stream '+f.id+': '+[...seen.keys()].join(','));
 fs.writeFileSync(path.join(report,'business-stream-'+f.sector+'-'+(posts?'posts':'products')+'.json'),JSON.stringify({passed:true,cards:[...seen.values()]},null,2));
};
