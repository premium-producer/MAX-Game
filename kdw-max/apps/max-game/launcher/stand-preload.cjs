const {contextBridge,ipcRenderer}=require('electron');
let active=false,presenting=true,diagnosticAt=0,lastPointer=null,pointerCount=0;
for(const type of ['pointerdown','pointerup','pointercancel'])document.addEventListener(type,e=>{if(!e.isTrusted)return;pointerCount++;lastPointer={type,x:Math.round(e.clientX),y:Math.round(e.clientY),mission:e.target.closest?.('[data-idle-mission]')?.dataset.idleMission??null,at:Date.now()};},{capture:true,passive:true});
function uiDiagnostic(){const now=performance.now();if(now-diagnosticAt<1000)return;diagnosticAt=now;const d=document.documentElement.dataset,host=document.querySelector('.journey-zone');return {game:(()=>{try{const raw=d.operatorGame;return raw&&raw.length<6000?JSON.parse(raw):null;}catch{return null;}})(),at:Date.now(),screen:d.kdwScreen??null,phase:host?.dataset.revealPhase??null,entry:d.standEntryMode??null,menuReady:!!d.idleMenuReady,selection:d.idleSelection??'ready',error:d.idleSelectionError??null,rootInert:document.querySelector('#circles')?.inert??null,pointerCount,lastPointer,activity:(()=>{try{const raw=document.querySelector('[data-activity-metrics]:not([hidden])')?.dataset.activityMetrics;return raw&&raw.length<2000?JSON.parse(raw):null;}catch{return null;}})(),buttons:[...document.querySelectorAll('[data-idle-mission]')].slice(0,4).map(el=>{const r=el.getBoundingClientRect();return {id:el.dataset.idleMission,inert:!!el.closest('[inert]'),presence:Number(el.dataset.pathPresence??0),rect:[r.x,r.y,r.width,r.height].map(Math.round)};})};}

let gameControlHandler=null;
ipcRenderer.on('kdw:game-control',async(_event,packet)=>{if(typeof packet?.id!=='string')return;let value,error;try{if(!gameControlHandler)throw Error('OPERATOR_NOT_READY');value=await gameControlHandler(packet.input);}catch(e){error=String(e.message).slice(0,200);}ipcRenderer.send('kdw:game-control-result',{id:packet.id,value,error});});
let overlay;
ipcRenderer.on('kdw:operator-overlay',(_event,value)=>{
 if(!document.body)return;
 if(!overlay){overlay=document.createElement('canvas');overlay.width=3072;overlay.height=1536;overlay.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none';overlay.setAttribute('aria-hidden','true');document.body.append(overlay);}
 const c=overlay.getContext('2d');c.clearRect(0,0,3072,1536);
 if(value.calibration){
  const s=value.calibration;c.fillStyle='#10091f';c.fillRect(0,0,3072,1536);c.strokeStyle='#595071';c.lineWidth=2;c.strokeRect(560,0,1760,1536);
  c.fillStyle='white';c.font='42px sans-serif';c.textAlign='center';c.fillText(s.complete?'Проверка пройдена — сохраните калибровку в редакторе':'Калибровка лидара · '+(s.targetLabel||'Точка '+(s.step+1)),1536,100);
  c.font='28px sans-serif';c.fillText(s.autoError||(s.waitingForRelease?'Уберите руку, затем приложите к следующей мишени':s.autoCapture?'Удерживайте руку на мишени до подтверждения':'Удерживайте руку и нажмите «Зафиксировать точку» в редакторе'),1536,1420);
  for(const [i,p]of s.targets.entries()){c.strokeStyle=i<Math.min(s.step,4)?'#5af2ad':'#51475e';c.lineWidth=3;c.beginPath();c.arc(p[0],p[1],20,0,Math.PI*2);c.stroke();}
  const [x,y]=s.target;c.strokeStyle=s.complete?'#5af2ad':'#00dfff';c.lineWidth=6;c.beginPath();c.arc(x,y,40,0,Math.PI*2);c.moveTo(x-60,y);c.lineTo(x+60,y);c.moveTo(x,y-60);c.lineTo(x,y+60);c.stroke();
  if(s.holdProgress>0){c.strokeStyle='#5af2ad';c.lineWidth=10;c.beginPath();c.arc(x,y,56,-Math.PI/2,-Math.PI/2+s.holdProgress*2*Math.PI);c.stroke();}
  // Calibration cursor is independent of ARM and the gameplay cursor toggle.
  if(s.cursor){const p=s.cursor,cx=Math.max(24,Math.min(3048,p.x)),cy=Math.max(24,Math.min(1512,p.y));c.beginPath();c.arc(cx,cy,26,0,Math.PI*2);c.fillStyle='#ff3fcf99';c.fill();c.strokeStyle='#fff';c.lineWidth=5;c.stroke();c.beginPath();c.moveTo(cx-38,cy);c.lineTo(cx+38,cy);c.moveTo(cx,cy-38);c.lineTo(cx,cy+38);c.stroke();}
  c.font='25px sans-serif';c.fillStyle='#ff99e6';
  const p=s.cursor,raw=s.latest;
  c.fillText(p?`Касание: ${Math.round(p.x)}, ${Math.round(p.y)} · ${p.source==='preview'?'новая калибровка':'сохранённая калибровка'}${p.x<0||p.x>3072||p.y<0||p.y>1536?' · за экраном, маркер у края':''}`:raw?`Сигнал получен · X ${raw.x.toFixed(3)} · Y ${raw.y.toFixed(3)}`:'Нет текущего касания',1536,1470);
  if(s.cursorMapping==='unavailable'){c.font='22px sans-serif';c.fillText('Позиция на экране появится после четырёх углов — сохранённой калибровки нет',1536,1505);}
 }
 else if(value.cursor){c.beginPath();c.arc(value.cursor.x,value.cursor.y,18,0,Math.PI*2);c.fillStyle='#00dfffaa';c.fill();c.lineWidth=4;c.strokeStyle='#fff';c.stroke();}
});
ipcRenderer.on('kdw:output-state',(_event,value)=>{
 const next=typeof value==='boolean'?value:value?.active===true;
 const visible=typeof value==='boolean'?value:value?.presenting!==false;
 if(next===active&&visible===presenting)return;active=next;presenting=visible;
 window.dispatchEvent(new Event('kdw-output-state'));
});
contextBridge.exposeInMainWorld('kdwStandOutput',Object.freeze({
 onGameControl:handler=>{gameControlHandler=handler;return()=>{if(gameControlHandler===handler)gameControlHandler=null;};},
 active:()=>active,
 presenting:()=>presenting,
 tick:(delta,options)=>ipcRenderer.send('kdw:background-tick',{delta,reduced:options?.reduced===true,ready:document.documentElement.dataset.gameReady==='true',epoch:document.documentElement.dataset.kdwRun+':'+document.documentElement.dataset.kdwScreen,ui:uiDiagnostic()}),
}));
