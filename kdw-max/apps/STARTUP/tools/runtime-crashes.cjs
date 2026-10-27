'use strict';
const fs=require('node:fs'),path=require('node:path');
// Keep dumps local. They may contain process memory; never include them in HTTP diagnostics.
function trimDumps(dir,{maxFiles=3,maxBytes=60*1024*1024}={}){
 const files=[];
 function walk(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){if(e.isSymbolicLink())continue;const p=path.join(folder,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.dmp')){const s=fs.statSync(p);files.push({p,size:s.size,time:s.mtimeMs});}}}
 if(!fs.existsSync(dir))return;walk(dir);files.sort((a,b)=>b.time-a.time);let bytes=0;
 for(let i=0;i<files.length;i++){bytes+=files[i].size;if(i>=maxFiles||bytes>maxBytes)fs.unlinkSync(files[i].p);}
}
function startCrashCapture({root,role}){
 const {app,crashReporter}=require('electron'),dir=path.join(root,'data/runtime-crashes',role);
 try{fs.mkdirSync(dir,{recursive:true});trimDumps(dir);app.setPath('crashDumps',dir);crashReporter.start({uploadToServer:false,globalExtra:{kdwRole:role}});}catch{}
 const timer=setInterval(()=>{try{trimDumps(dir);}catch{}},60000);timer.unref();
}
module.exports={startCrashCapture,trimDumps};
