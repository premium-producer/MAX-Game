const {contextBridge,ipcRenderer}=require('electron');
let active=false;
ipcRenderer.on('kdw:output-state',(_event,value)=>{
 active=value===true;
 window.dispatchEvent(new Event('kdw-output-state'));
});
contextBridge.exposeInMainWorld('kdwStandOutput',Object.freeze({
 active:()=>active,
 tick:(delta,options)=>ipcRenderer.send('kdw:background-tick',{delta,reduced:options?.reduced===true,ready:document.documentElement.dataset.gameReady==='true',epoch:document.documentElement.dataset.kdwRun+':'+document.documentElement.dataset.kdwScreen}),
}));
