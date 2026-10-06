import {createMaxShowOverlay} from '/max-show-overlay.js';
import {createLidarOverlay} from '/lidar-overlay.js';
const lidarOverlay=createLidarOverlay();
window.vkNativeOutput.onLidarFrame(frame=>lidarOverlay.update(frame,frame.rect));
window.vkNativeOutput.onLidarCancel(async({requestId})=>{try{await showOverlay?.cancelLidar(requestId);}finally{window.vkNativeOutput.lidarCancelComplete(requestId);}});
addEventListener('pagehide',()=>lidarOverlay.dispose(),{once:true});

import {createNativeArtisticOutput,ArtisticAssets} from '/native-output.js';

import {requireContentEntity,createResultQrDataUrl} from '/master-views/content-entity-view.mjs';

// Fixed preload command channel. There is no timer, MASTER fetch or scenario.

let port,assets,bindingKey,busy=false,native,pendingAssets,showOverlay;

let diagnosticCount=0;const diagnostic=(phase,error)=>{if(diagnosticCount++<40)console.warn(`[native:${phase}] ${String(error?.stack??error??"unknown").slice(0,4096)}`);};

const clear=()=>{showOverlay?.dispose();showOverlay=null;pendingAssets?.discard();pendingAssets=null;port?.dispose();assets?.dispose();port=null;assets=null;bindingKey=null;outputControlKey=null;};

let outputControlKey=null,pendingOutputControl=null;
const frameOutputMetadata=()=>{const actual=port.getOutputControl(),c=actual.control;return {planEpoch:actual.planEpoch,ready:actual.lastFrame?.ready===true,backgroundDrawn:actual.lastFrame?.backgroundDrawn===true,maxMission:showOverlay?.missionEvidence()??null,outputSettings:{outputMode:c.mode,backgroundEnabled:c.backgroundEnabled,serviceContentEnabled:{[native.output]:c.contentEnabled}}};};
async function applyOutputControl(control,attempt=0){
 if(!control)return;
 const key=JSON.stringify(control);if(key===outputControlKey)return;
 const before=port.getOutputControl(),wanted=port.setOutputControl(control);
 try{
  const accepted=await window.vkNativeOutput.setOutputPlan(wanted.plan);
  port.setTransportPlan(accepted.plan,accepted.epoch);
  native={...native,plan:accepted.plan,epoch:accepted.epoch};
  if(typeof showOverlay!=='undefined')showOverlay?.setOutputPlan(accepted.plan);
  outputControlKey=key;
 }catch(error){
  port.setOutputControl(before.control);port.setTransportPlan(before.plan,before.planEpoch??native.epoch);
  if(String(error?.message).includes('OUTPUT_PLAN_NOT_AUTHORIZED')){
   // Rapid panel edits can supersede a pending plan. Keep the completed scene;
   // coalesce at this boundary, never reset its media, route clock or scenario.
   pendingOutputControl=await window.vkNativeOutput.getOutputControl();
   if(attempt<2&&pendingOutputControl)return applyOutputControl(pendingOutputControl,attempt+1);
   return; // A newer desired policy is retried on the next ordinary frame.
  }
  throw error;
 }
}
addEventListener('pagehide',clear);

try{

 native=await window.vkNativeOutput.configure();
 pendingOutputControl=native.outputControl;
 window.vkNativeOutput.onOutputControl(control=>{pendingOutputControl=control;});

 await document.fonts.load('500 26px "VK Sans Display"');

 window.vkNativeOutput.onPresentation(async message=>{

  const {requestId,command,payload:p}=message;

  if(busy){window.vkNativeOutput.complete(requestId,{ok:false,error:'PRESENTATION_BUSY'});return;}

  busy=true;

  try{

   let result;

   if(command==='start'){

    if(port)throw Error('PRESENTATION_ALREADY_STARTED');

    if(p.options.items.some(i=>['video','generation'].includes(i.kind)&&(i.ready===true||['ready','available'].includes(i.status))&&!Object.hasOwn(p.preparedResources??{},i.itemId)))throw Error('RESOURCE_NOT_PREPARED');

    const canvas=document.createElement('canvas');canvas.id='output';document.querySelector('#output').replaceWith(canvas);

    try{

     port=await createNativeArtisticOutput({canvas,output:native.output,epoch:native.epoch,prefix:native.prefix,programName:native.programName});

     if(native.output!=='ARCH'){assets=new ArtisticAssets(p.options,{requireContentEntity,createResultQrDataUrl});await assets.update(new Map(Object.entries(p.preparedResources??{})));await port.bind(p.options,assets);}

     if(native.output==='MAX_RIGHT')showOverlay=createMaxShowOverlay(native.plan);

     await applyOutputControl(p.outputControl??pendingOutputControl??native.outputControl);bindingKey=p.bindingKey;result={output:native.output,evidence:'PORT_READY',physicalOutput:false};

    }catch(error){clear();throw error;}

   }else{

    if(!port||bindingKey!==p.bindingKey)throw Error('PRESENTATION_STALE_BINDING');

    if(command==='stop'){await showOverlay?.close();clear();result={output:native.output,evidence:'PORT_STOPPED',physicalOutput:false};}
    else if(command==='resources'){

     if(pendingAssets)throw Error('RESOURCE_STAGE_BUSY');

     if(assets)pendingAssets=await assets.prepare(new Map(Object.entries(p.preparedResources??{})));

     result={output:native.output,evidence:'RESOURCES_PREPARED',physicalOutput:false};

    }else if(command==='resources-commit'){

     pendingAssets?.commit();pendingAssets=null;result={output:native.output,evidence:'RESOURCES_COMMITTED',physicalOutput:false};

    }else if(command==='resources-abort'){

     pendingAssets?.discard();pendingAssets=null;result={output:native.output,evidence:'RESOURCES_DISCARDED',physicalOutput:false};

    }

    else if(command==='output-control'){await applyOutputControl(p.control);result={output:native.output,evidence:'OUTPUT_CONTROL_APPLIED',actualOutputControl:port.getOutputControl(),physicalOutput:false};}
    else if(command==='update'){
     await applyOutputControl(p.outputControl??pendingOutputControl??native.outputControl);

     if(['ARCH','ARCH_RIBBON'].includes(native.output))await port.prepareArch(p.frame);

     await port.present(p.frame,p.frameId);

     showOverlay?.update(p.frame.maxShow);

     // Existing native present waits for the frame-stamped shared texture ACK.

     // First OSR paint may follow resize; resubmit that same completed atlas.

     let settled=false;const ack=window.vkNativeOutput.present(p.frameId,frameOutputMetadata()).finally(()=>{settled=true;});

     while(!settled){await Promise.race([ack,new Promise(r=>setTimeout(r,100))]);if(!settled)await port.resubmit(p.frameId);}

     const ackReceipt=await ack;if(ackReceipt.published!==true&&!(ackReceipt.accepted===true&&port.getOutputControl().plan.routes.length===0))throw Error('PRESENTATION_NOT_PUBLISHED');result={output:native.output,frameId:p.frameId,evidence:'WEBGL_SUBMIT',actualOutputControl:port.getOutputControl(),physicalOutput:false};

    }else throw Error('PRESENTATION_COMMAND_INVALID');

   }

   window.vkNativeOutput.complete(requestId,{ok:true,result});

  }catch(error){diagnostic(command,error);window.vkNativeOutput.complete(requestId,{ok:false,error:typeof error?.message==='string'&&/^[A-Z0-9_:.-]{1,160}$/.test(error.message)?error.message:'PRESENTATION_FAILED'});}

  finally{busy=false;}

 });

 window.vkNativeOutput.presentationReady();

}catch(error){diagnostic('bootstrap',error);window.vkNativeOutput.fault();}

