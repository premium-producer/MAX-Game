import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {CalibrationSession,MemoryStore} from '../calibration/calibration.mjs';
import {createHokuyoReceiver} from './hokuyo-osc.mjs';
const fail=(code,status=409)=>Object.assign(Error(code),{code,status});
const actions=new Set(['enable','disable','start','capture','save','cancel']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const sourceIdentity='hokuyo-osc-v1:10.0.0.11:9001:/create,/update,/delete';

export function createLidarControl({root,now=Date.now,log=()=>{},makeReceiver=createHokuyoReceiver}={}){
 const diagnostic=log;log=(...args)=>{try{diagnostic(...args);}catch{}};
 const file=path.join(root,'data/max-lidar/settings.json');
 let saved={schemaVersion:1,revision:0,enabled:false,calibrationStore:{schemaVersion:1,revision:0,calibration:null},receipts:[]};
 try{saved=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(saved.schemaVersion!==1||!Number.isSafeInteger(saved.revision)||typeof saved.enabled!=='boolean'||!Array.isArray(saved.receipts)||saved.receipts.length>64)throw Error('LIDAR_SETTINGS_INVALID');
 let store,calibration,receiver,ownerKey='',externalKey='',context={modeEligible:false,active:false},events=[],sequence=0,raw=null,closed=false;
 const restore=()=>{store=new MemoryStore(saved.calibrationStore);calibration=new CalibrationSession({store,sourceIdentity,now});};restore();
 let inputDiagnosticKey='',lastInputDiagnosticAt=-Infinity,mappedContact=null;
 const push=e=>{events.push({...e,sequence:++sequence});if(events.length>128)events.shift();};
 const traceInput=(e,p,phase,reason)=>{
  const key=JSON.stringify([e.id,e.sourceContactId,phase,p?.inside===true,reason,context.modeEligible,context.active]);
  if(e.phase==='move'&&key===inputDiagnosticKey&&now()-lastInputDiagnosticAt<1000)return;
  inputDiagnosticKey=key;lastInputDiagnosticAt=now();
  log('lidar-mapped-contact',{stage:'mapping',contactId:String(e.id),phase,reason,sequence:sequence+1,
   x:p?.x,y:p?.y,rawX:e.x,rawY:e.y,sourceContactId:e.sourceContactId,selectedY:e.selectedY,inside:p?.inside===true,enabled:saved.enabled,active:context.active===true,
   inputEligible:context.modeEligible===true,assignmentId:context.assignmentId,sessionId:context.sessionId});
 };
 const calibrating=()=>calibration.state().phase!=='idle';
 function input(e){
  if(closed)return;
  if(['up','cancel'].includes(e.phase)){
   mappedContact=null;
   let p=null;try{p=calibrating()?calibration.preview(e.x,e.y)??calibration.map(e.x,e.y):calibration.map(e.x,e.y);}catch{}
   traceInput(e,p,e.phase==='up'&&p?.inside?'up':'cancel',e.phase==='cancel'?'source_cancel':p?.inside?'release':'outside');calibration.release(e.id);raw=null;push({id:e.id,phase:e.phase==='up'&&p?.inside?'up':'cancel',x:p?.x??0,y:p?.y??0});return;
  }
  raw=e;
  if(e.phase==='down')mappedContact=saved.enabled&&context.modeEligible&&context.active&&!calibrating()?{id:e.id,inside:false}:null;
  let p;try{if(calibrating())calibration.update({contactId:e.id,x:e.x,y:e.y});
   p=calibrating()?calibration.preview(e.x,e.y)??calibration.map(e.x,e.y):calibration.map(e.x,e.y);
  }catch{if(mappedContact?.id===e.id)mappedContact.inside=false;traceInput(e,null,'cancel','invalid_mapping');push({id:e.id,phase:'cancel',x:0,y:0});log('lidar-point-rejected',{code:'INVALID_MAPPING'});return;}
  const reentered=e.phase==='move'&&p?.inside&&mappedContact?.id===e.id&&!mappedContact.inside&&saved.enabled&&context.modeEligible&&context.active&&!calibrating();
  const phase=reentered?'down':e.phase;
  if(mappedContact?.id===e.id)mappedContact.inside=p?.inside===true;
  traceInput(e,p,p?.inside?phase:'cancel',reentered?'reentered':p?.inside?'mapped':'outside');
  if(p?.inside)push({id:e.id,phase,x:p.x,y:p.y});
  else push({id:e.id,phase:'cancel',x:0,y:0});
 }
 const persist=()=>{
  fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+randomUUID()+'.tmp',fd=fs.openSync(temp,'wx');
  try{try{fs.writeFileSync(fd,JSON.stringify(saved,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);}
  finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
 };
 const snapshot=()=>{
  const c=calibration.state(),r=receiver.snapshot();
  let p=null;if(raw)try{p=calibrating()?calibration.preview(raw.x,raw.y)??calibration.map(raw.x,raw.y):calibration.map(raw.x,raw.y);}catch{}
  return {protocol:'max-lidar-v1',revision:saved.revision,enabled:saved.enabled,receiver:r,calibration:c,savedCalibration:c.savedCalibration,
   cursor:p?.inside?{id:raw.id,x:p.x,y:p.y}:null,rawCursor:raw?{id:raw.id,sourceContactId:raw.sourceContactId,x:raw.x,y:raw.y}:null,
   modeEligible:context.modeEligible,reason:!context.modeEligible?'mode_ineligible':!c.savedCalibration?'no_calibration':r.packetCount===0?'no_packets':null};
 };
 // Saved calibration defines screen-up even when the sensor axes are tilted.
 // Before a solver exists, calibration capture explicitly falls back to raw Y.
 receiver=makeReceiver({now,onContact:input,onDiagnostic:log,selectionSpace:'calibrated-y-or-raw-before-calibration',rankPoint:point=>{
  const p=calibrating()?calibration.preview(point.x,point.y)??calibration.map(point.x,point.y):calibration.map(point.x,point.y);
  return p?p.y:point.y;
 }});
 return {
  async start(){try{await receiver.start();}catch(e){receiver.close();throw e;}return this;},
  isEnabled:()=>saved.enabled,
  setContext(value){
   const external=JSON.stringify([value.bindingKey,value.assignmentId,value.sessionId,value.mode,value.modeEpoch,value.active,value.automatic]);
   const key=JSON.stringify([external,saved.revision]);
   context={...value,modeEligible:value.mode==='standard'&&!value.automatic};
   if(calibrating()&&(value.active||externalKey&&externalKey!==external||!context.modeEligible)){calibration.cancel();log('lidar-calibration-aborted',{code:'CONTEXT_CHANGED'});}
   if(externalKey&&externalKey!==external)receiver.reset('context-changed');externalKey=external;
   if(key!==ownerKey){mappedContact=null;log('lidar-input-gate',{stage:'mapping',phase:value.mode,active:value.active===true,enabled:saved.enabled,inputEligible:context.modeEligible,reason:!context.modeEligible?'mode_ineligible':!value.active?'mission_inactive':!saved.enabled?'operator_disabled':'eligible',assignmentId:value.assignmentId,sessionId:value.sessionId});ownerKey=key;events=[];push({id:raw?.id??'none',phase:'cancel',x:0,y:0});}
  },
  snapshot,
  frame(after=0){
   const s=snapshot(),available=events.filter(e=>e.sequence>after);
   return {...s,assignmentId:context.assignmentId,sessionId:context.sessionId,ownerKey,calibrating:calibrating(),enabled:calibrating()||saved.enabled&&context.modeEligible&&context.active&&!!s.savedCalibration,
    events:available,lastSequence:sequence,gap:after>sequence||events.length>0&&after<events[0].sequence-1};
  },
  command(body){
   if(!body||Object.keys(body).some(k=>!['commandId','expectedRevision','action'].includes(k))||!UUID.test(body.commandId??'')||!Number.isSafeInteger(body.expectedRevision)||!actions.has(body.action))throw fail('LIDAR_COMMAND_INVALID',400);
   const signature=JSON.stringify([body.expectedRevision,body.action]);const receipt=saved.receipts.find(r=>r.commandId===body.commandId);
   if(receipt){if(receipt.signature!==signature)throw fail('LIDAR_COMMAND_ID_CONFLICT');return snapshot();}
   if(body.expectedRevision!==saved.revision)throw fail('LIDAR_REVISION_CONFLICT');
   if(['enable','start'].includes(body.action)&&context.active)throw fail('GAME_BUSY');
   if(['enable','start'].includes(body.action)&&!context.modeEligible)throw fail('LIDAR_MODE_INELIGIBLE');
   const before=structuredClone(saved);let persisting=false;
   try{
    if(body.action==='enable'){if(!calibration.state().savedCalibration)throw fail('LIDAR_CALIBRATION_REQUIRED');if(calibrating())throw fail('LIDAR_CALIBRATING');saved.enabled=true;}
    if(['enable','disable','start','cancel'].includes(body.action))receiver.reset('operator-command');
    if(body.action==='disable'){saved.enabled=false;calibration.cancel();}
    if(body.action==='start')calibration.start(store.read().revision);
    if(body.action==='capture')calibration.capture();
    if(body.action==='cancel')calibration.cancel();
    if(body.action==='save'){calibration.save(store.read().revision);saved.calibrationStore=store.read();}
    saved.revision++;saved.receipts.push({commandId:body.commandId,signature});saved.receipts=saved.receipts.slice(-64);persisting=true;persist();persisting=false;
    ownerKey='';events=[];push({id:raw?.id??'none',phase:'cancel',x:0,y:0});
    log('lidar-command',{stage:body.action,revision:saved.revision});return snapshot();
   }catch(e){saved=before;if(persisting){restore();throw fail('LIDAR_STORAGE_FAILED',503);}if(e.status)throw e;throw fail(e.code??'LIDAR_CALIBRATION_FAILED',422);}
  },
  close(){closed=true;receiver.close();calibration.cancel();},
 };
}
