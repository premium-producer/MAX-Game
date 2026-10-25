module.exports=async win=>{
 const rows=await win.webContents.executeJavaScript(`(()=>{
  const reference=document.querySelector('.task-dialog .instruction'),device=document.querySelector('.route-phone');
  return [...document.querySelectorAll('button[data-reference-transition]')].map(button=>{
   const r=reference.getBoundingClientRect(),d=device.getBoundingClientRect(),b=button.getBoundingClientRect();
   const x=b.left+b.width/2,y=b.top+b.height/2,hit=document.elementFromPoint(x,y);
   return {label:button.textContent.trim(),reference:r.toJSON(),device:d.toJSON(),button:b.toJSON(),
    centreError:Math.abs((r.top+b.bottom)/2-(d.top+d.height/2)),gap:b.top-r.bottom,
    expectedGap:24*r.width/reference.offsetWidth,hit:!!hit&&(hit===button||button.contains(hit)),
    inert:!!button.closest('[inert]'),disabled:button.disabled};
  });
 })()`);
 for(const row of rows){
  if(row.centreError>1||Math.abs(row.gap-row.expectedGap)>1)throw Error('Reference navigation not centred: '+JSON.stringify(row));
  if(!row.inert&&!row.disabled&&!row.hit)throw Error('Reference navigation hit area blocked: '+JSON.stringify(row));
  if(row.button.left<560-.5||row.button.right>2320+.5)throw Error('Reference navigation outside touch display: '+JSON.stringify(row));
 }
 return rows;
};
