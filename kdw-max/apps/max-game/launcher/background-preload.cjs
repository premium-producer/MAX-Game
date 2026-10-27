const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('kdwBackgroundOutput',Object.freeze({
 onFrame:callback=>ipcRenderer.on('kdw:background-frame',(_e,packet)=>callback(packet)),
 ack:()=>ipcRenderer.send('kdw:background-ack',{ready:document.documentElement.dataset.backgroundReady}),
}));
