module.exports=async win=>{
 const result=await win.webContents.executeJavaScript(`(()=>{
  const e=document.querySelector('[data-palm] .object-label'),t=e.firstChild,range=document.createRange(),lines=new Map();
  for(let i=0;i<t.length;i++){if(t.textContent[i]==='\\n')continue;range.setStart(t,i);range.setEnd(t,i+1);const r=range.getBoundingClientRect(),y=Math.round(r.top*2)/2;lines.set(y,(lines.get(y)||'')+t.textContent[i]);}
  const r=e.getBoundingClientRect(),tile=e.parentElement.querySelector('.tile').getBoundingClientRect();
  return {lines:[...lines.values()].map(s=>s.trim()),overflow:e.scrollWidth-e.clientWidth,centerDelta:Math.abs(r.x+r.width/2-tile.x-tile.width/2),rect:r.toJSON(),fontSize:getComputedStyle(e).fontSize};
 })()`);
 if(JSON.stringify(result.lines)!==JSON.stringify(['Приложи ладонь,','чтобы начать'])||result.overflow>1||result.centerDelta>1)throw Error('Palm caption: '+JSON.stringify(result));
 return result;
};
