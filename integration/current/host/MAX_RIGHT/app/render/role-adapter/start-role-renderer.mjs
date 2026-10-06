import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {renderSettings} from './role-settings.mjs';
import {randomUUID} from 'node:crypto';
import {presentationCommand} from '../presentation-command.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
export async function startRoleRenderer(loaded,{spawnProcess=spawn,startTimeoutMs=15000,stopTimeoutMs=5500,signal,onNativeFrame}={}) {
 if(signal?.aborted)throw Error('NATIVE_ROLE_REVOKED');
 const {root,config}=loaded;const settings=renderSettings(config),requests=new Map();
 const runtime=path.join(root,'runtime/electron/electron.exe');
 const realRuntime=await fs.realpath(runtime),realRoot=await fs.realpath(root);
 if(!realRuntime.startsWith(realRoot+path.sep))throw Error('Electron runtime outside package');
 const version=(await fs.readFile(path.join(root,'runtime/electron/version'),'utf8')).trim();
 if(version!=='44.4.5')throw Error('Pinned Electron 44.4.5 required');
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;delete env.NODE_OPTIONS;delete env.NODE_PATH;
 const child=spawnProcess(realRuntime,[here,'--root',root],{cwd:root,windowsHide:true,env,stdio:['ignore','inherit','inherit','ipc']});
 let exited=false,closing,snapshot={qualificationOnly:true,physicalOutputVerified:false,state:'starting',frameId:0};
 const rejectRequests=()=>{for(const r of requests.values()){clearTimeout(r.timer);r.reject(Error('PRESENTATION_HOST_CLOSED'));}requests.clear();};
 const exit=new Promise(resolve=>{child.once('exit',()=>{exited=true;snapshot={...snapshot,state:'stopped'};rejectRequests();resolve();});child.once('error',()=>{exited=true;snapshot={...snapshot,state:'failed'};rejectRequests();resolve();});});
 const close=()=>closing??=(async()=>{
  rejectRequests();
  if(exited)return;
  if(child.connected)child.send({type:'stop'},()=>{});
  let timer;
  const stopped=await Promise.race([exit.then(()=>true),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),stopTimeoutMs);})]);clearTimeout(timer);
  // Exact child handle only: never a PID from a file, process name or taskkill /IM.
  if(!stopped){child.kill();await Promise.race([exit,new Promise(resolve=>setTimeout(resolve,250))]);}
 })();
 const abort=()=>{void close();};signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 exit.then(()=>signal?.removeEventListener('abort',abort));
 try {
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>finish(Error('Render startup timed out')),startTimeoutMs);
   const finish=error=>{clearTimeout(timer);child.removeListener('message',message);child.removeListener('exit',died);child.removeListener('error',failed);error?reject(error):resolve();};
   const message=m=>{if(m?.type==='ready'&&m.qualificationOnly===true){snapshot={...snapshot,state:'native-host-loaded'};finish();}else if(m?.type==='fatal')finish(Error('Render startup failed'));};
   const died=()=>finish(Error('Render exited during startup')),failed=()=>finish(Error('Cannot start bundled Electron'));
   child.on('message',message);child.once('exit',died);child.once('error',failed);
  });
  if(signal?.aborted)throw Error('NATIVE_ROLE_REVOKED');
  child.on('message',m=>{
   if(m?.type==='frame'&&Number.isSafeInteger(m.frameId)){
    const id=m.output??settings.outputs[0].output.id;if(!settings.outputs.some(o=>o.output.id===id))return;
    const previous=snapshot.outputs?.[id]?.frameId??0;if(m.frameId>previous){
     snapshot={...snapshot,state:'fixture-frame',frameId:Math.max(snapshot.frameId,m.frameId),published:m.published===true,outputs:{...snapshot.outputs,[id]:{frameId:m.frameId,published:m.published===true}}};
     // Only messages from this exact owned IPC child; no HTTP/browser evidence.
     if(!exited&&!closing&&typeof onNativeFrame==='function')try{Promise.resolve(onNativeFrame(m)).catch(()=>{});}catch{}
    }
   }else if(m?.type==='fatal'){snapshot={...snapshot,state:'failed'};rejectRequests();}
   else if(m?.type==='presentation-result'){
    const r=requests.get(m.requestId);if(!r)return;requests.delete(m.requestId);clearTimeout(r.timer);
    if(m.ok===true)r.resolve(m.result);else r.reject(Error(typeof m.error==='string'&&/^[A-Z0-9_:.-]{1,160}$/.test(m.error)?m.error:'PRESENTATION_FAILED'));
   }
  });
  const command=(action,payload)=>{
   if(settings.mode!=='role-artistic-external'||exited||closing||requests.size)throw Error('PRESENTATION_UNAVAILABLE');
   const body=presentationCommand(action,payload,settings.assetBudget),requestId=randomUUID();
   return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{requests.delete(requestId);reject(Error('PRESENTATION_TIMEOUT'));void close();},action==='start'?70000:35000);
    requests.set(requestId,{resolve,reject,timer});
    const failed=()=>{requests.delete(requestId);clearTimeout(timer);reject(Error('PRESENTATION_IPC_FAILED'));};
    try{child.send({type:'presentation',requestId,command:action,payload:body},error=>{if(error)failed();});}catch{failed();}
   });
  };
  return {close,start:payload=>command('start',payload),update:payload=>command('update',payload),resources:payload=>command('resources',payload),stop:payload=>command('stop',payload),get readiness(){return {application:'native-host',renderer:['failed','stopped'].includes(snapshot.state)?snapshot.state:settings.mode==='role-artistic-external'?'external-adapter-loaded':'fixture-loaded',spout:'not-checked',td:'not-checked'};},capabilities:['render.native-fixture.v1','render.external-presentation.v1','render.prepared-assets.v2'],snapshot:()=>structuredClone(snapshot)};
 } catch(error) {await close();throw error;}
}

