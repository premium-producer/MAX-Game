const {contextBridge,ipcRenderer}=require('electron');
let active=false;
let overlay;
ipcRenderer.on('kdw:operator-overlay',(_event,value)=>{
 if(!document.body)return;
 if(!overlay){overlay=document.createElement('canvas');overlay.width=3072;overlay.height=1536;overlay.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none';overlay.setAttribute('aria-hidden','true');document.body.append(overlay);}
 const c=overlay.getContext('2d');c.clearRect(0,0,3072,1536);
 if(value.calibration){const s=value.calibration;c.fillStyle='#10091f';c.fillRect(0,0,3072,1536);c.strokeStyle='#595071';c.lineWidth=2;c.strokeRect(560,0,1760,1536);c.fillStyle='white';c.font='48px sans-serif';c.textAlign='center';c.fillText(s.complete?'Проверка пройдена — сохраните в панели':s.step<4?'Калибровка лидара · угол '+(s.step+1)+' из 4':'Проверка центра',1536,80);c.font='30px sans-serif';c.fillText('Удерживайте руку на мишени. Оператор нажимает «Зафиксировать точку»',1536,1460);const [x,y]=s.target;c.strokeStyle='#00dfff';c.lineWidth=6;c.beginPath();c.arc(x,y,40,0,Math.PI*2);c.moveTo(x-60,y);c.lineTo(x+60,y);c.moveTo(x,y-60);c.lineTo(x,y+60);c.stroke();}
 else if(value.cursor){c.beginPath();c.arc(value.cursor.x,value.cursor.y,18,0,Math.PI*2);c.fillStyle='#00dfffaa';c.fill();c.lineWidth=4;c.strokeStyle='#fff';c.stroke();}
});
ipcRenderer.on('kdw:output-state',(_event,value)=>{
 active=value===true;
 window.dispatchEvent(new Event('kdw-output-state'));
});
contextBridge.exposeInMainWorld('kdwStandOutput',Object.freeze({
 active:()=>active,
 tick:(delta,options)=>ipcRenderer.send('kdw:background-tick',{delta,reduced:options?.reduced===true,ready:document.documentElement.dataset.gameReady==='true',epoch:document.documentElement.dataset.kdwRun+':'+document.documentElement.dataset.kdwScreen}),
}));
