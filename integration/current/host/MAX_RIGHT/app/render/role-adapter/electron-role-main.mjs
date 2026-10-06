import {app,BrowserWindow,ipcMain} from 'electron';

import {loadConfig} from '../../config.mjs';

import {requestMaster} from '../../transport.mjs';

import fs from 'node:fs';

import path from 'node:path';

import {renderSettings,readRoleConfig} from './role-settings.mjs';

import {startAssetServer} from '../asset-server.mjs';

import {startOutputHost} from '../output-host.mjs';
import {createLidarNativeRuntime} from '../lidar-native-runtime.mjs';
import {startRearOutputRuntime} from './render-output-runtime.mjs';

import {createPreparedAssets} from '../prepared-assets.mjs';

const index=process.argv.indexOf('--root');

if(index<0||!process.argv[index+1]||!process.send) throw Error('Managed package root and IPC required');

const {root,config}=readRoleConfig(process.argv[index+1]);

const settings=renderSettings(config),data=path.join(root,'data/render');

fs.mkdirSync(data,{recursive:true});

if(!fs.realpathSync(data).startsWith(root+path.sep))throw Error('Render data outside package');

app.setPath('userData',data);

app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');

app.commandLine.appendSwitch('force-device-scale-factor','1');

app.commandLine.appendSwitch('disable-renderer-backgrounding');

app.commandLine.appendSwitch('disable-background-timer-throttling');

if(!app.requestSingleInstanceLock()){process.send({type:'fatal',code:'DUPLICATE_RENDER_HOST'});app.exit(1);}

let assets,output,closing,preparedAssets,outputRuntime,lidarRuntime;

let diagnosticErrors=0;const frameLogTimes=new Map();

const diag=(phase,error)=>{if(diagnosticErrors++<40)console.error(`[render:${phase}] ${String(error?.stack??error??"unknown").slice(0,4096)}`);};

const frameDiagnostic=frame=>{const now=Date.now(),previous=frameLogTimes.get(frame.output)??0;if(now-previous>=5000){frameLogTimes.set(frame.output,now);console.log(JSON.stringify({event:"render-frame",output:frame.output,frameId:frame.frameId,published:frame.published,status:frame.status}));}};

const send=message=>{if(process.connected)process.send(message,()=>{});};

function stop(code=0){return closing??=(async()=>{

 const force=setTimeout(()=>app.exit(1),5000);

 try {await lidarRuntime?.close();outputRuntime?.close();await output?.close();await assets?.close();preparedAssets?.close();} finally {clearTimeout(force);app.exit(code);}

})();}

process.on('message',message=>{

 if(message?.type==='stop'){void stop();return;}

 if(message?.type==='presentation'&&typeof message.requestId==='string'&&message.requestId.length<=64){

  void (async()=>{try{if(!output||closing)throw Error('PRESENTATION_NOT_READY');const result=await output.command(message.command,message.payload);send({type:'presentation-result',requestId:message.requestId,ok:true,result});}

  catch(error){diag('presentation',error);send({type:'presentation-result',requestId:message.requestId,ok:false,error:typeof error?.message==='string'&&/^[A-Z0-9_:.-]{1,160}$/.test(error.message)?error.message:'PRESENTATION_FAILED'});}})();

 }

});

process.on('disconnect',()=>void stop());

app.on('before-quit',event=>{if(!closing){event.preventDefault();void stop();}});

// Do not await app readiness at ESM top level: Electron waits for module evaluation.

void (async()=>{

try {

 await app.whenReady();

 if(closing)throw Error('Startup cancelled');

 preparedAssets=await createPreparedAssets({root,budget:settings.assetBudget});

 const audioLoaded=loadConfig(root);

 assets=await startAssetServer({...settings,preparedAssets,requestMaster:request=>requestMaster(audioLoaded,request)});

 output=await startOutputHost({BrowserWindow,ipcMain,settings,preparedAssets,origin:assets.origin,onFailure:reason=>{diag('output-failure',reason);send({type:'fatal',code:'OUTPUT_FAILED'});void stop(1);},onFrame:frame=>{outputRuntime?.presentedNativeFrame(frame);frameDiagnostic(frame);send({type:'frame',...frame});}});

 if(closing){await output.close();await assets.close();}else{
  if(config.role==='MAX_RIGHT')lidarRuntime=createLidarNativeRuntime({host:output,onError:error=>diag('lidar',error)});
  outputRuntime=startRearOutputRuntime(audioLoaded,{requestMaster,host:output,onError:(error,context)=>diag('output-control-'+context.operation,error)});
  send({type:'ready',qualificationOnly:true,origin:assets.origin});
 }

}catch(error) {diag('startup',error);send({type:'fatal',code:'OUTPUT_START_FAILED'});await stop(1);}

})();

