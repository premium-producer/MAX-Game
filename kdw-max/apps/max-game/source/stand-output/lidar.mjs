import {LIDAR_CONTACT_RADIUS} from '../client/src/kdw-contact-area.mjs';
import {createHokuyoReceiver} from './hokuyo-osc.mjs';
import {solveCalibration} from './calibration.mjs';
import {createLidarFilter,inputFilterOptions} from './lidar-filter.mjs';
import {isIP} from 'node:net';
export {solveCalibration};
// A configured primary input cannot be disabled by a legacy profile toggle.
// Missing calibration remains a setup state; never invent sensor coordinates.
export const automaticLidarConfig=value=>value?{...value,enabled:value.enabled===true||!!(value.rawPoints&&value.targetPoints)}:value;
export function validateLidarConfig(value){
 const keys=['enabled','bindAddress','sourceAddress','port','timeoutMs','width','height','rawPoints','targetPoints','inputFilter'];
 if(!value||Object.keys(value).some(k=>!keys.includes(k))||typeof value.enabled!=='boolean'||!isIP(value.bindAddress)||!isIP(value.sourceAddress)||value.sourceAddress==='0.0.0.0'||!Number.isInteger(value.port)||value.port<1024||value.port>65535||!Number.isFinite(value.timeoutMs)||value.timeoutMs<100||value.timeoutMs>3000||value.width!==3072||value.height!==1536)throw Error('Проверьте IP, порт, watchdog и размер 3072×1536');
 if(value.rawPoints!==null||value.targetPoints!==null){solveCalibration(value.rawPoints,value.targetPoints,[value.width,value.height]);if(value.targetPoints.some(([x,y])=>x<0||x>value.width||y<0||y>value.height)||value.rawPoints.some(p=>p.some(n=>Math.abs(n)>10000)))throw Error('Точки вне допустимого диапазона');}
 else if(value.enabled)throw Error('Сначала выполните калибровку');
 inputFilterOptions(value.inputFilter);
 return structuredClone(value);
}

// Native CDP touch events generate trusted DOM PointerEvents and preserve the
// existing game admission/hold/hotspot path. OSC never calls mission commands.
export async function startLidar({config,contents,active,log,width=3072,height=1536,calibrating=false,onPoint=()=>{},makeReceiver=createHokuyoReceiver,commandTimeoutMs=1000,now=()=>performance.now()}){
 config=automaticLidarConfig(config);
 if(!config?.enabled&&!calibrating)return {snapshot:()=>({enabled:false}),reset(){},close(){}};
 const prepare=(value,raw)=>{
  validateLidarConfig(raw?{...value,enabled:false}:value);
  if(value.width!==width||value.height!==height)throw Error('LiDAR calibration viewport mismatch');
  const mapping=value.rawPoints&&value.targetPoints?solveCalibration(value.rawPoints,value.targetPoints,[width,height]):null;
  if(value.enabled&&!raw&&!contents.debugger.isAttached())contents.debugger.attach('1.3');
  return mapping;
 };
 let mapping=prepare(config,calibrating),filter=createLidarFilter(config.inputFilter);
 let down=false,closed=false,chain=Promise.resolve(),pendingMove=null,moving=false,inputEpoch=0,needsCancel=false,generation=0,abortDispatch=null;
 const input={errors:0,recoveries:0,alreadyReleased:0,lastError:null,lastCommand:null,lastSuccessAt:null,timeouts:0,resets:0};
 const dispatch=async(type,p,gen)=>{
  input.lastCommand=type;let timer,abort;
  const deadline=new Promise((_,reject)=>{abort=()=>reject(Error('LIDAR_INPUT_RESET'));abortDispatch=abort;timer=setTimeout(()=>reject(Error('LIDAR_INPUT_TIMEOUT')),commandTimeoutMs);});
  try{
   await Promise.race([deadline,contents.debugger.sendCommand('Input.dispatchTouchEvent',{
    type,touchPoints:p?[{x:p.x,y:p.y,id:1,radiusX:LIDAR_CONTACT_RADIUS,radiusY:LIDAR_CONTACT_RADIUS,force:1}]:[],
   })]);
  }catch(error){
   if(gen!==generation)throw error;
   // Chromium has already released this contact (or a queued start was reset).
   // Retrying its cancellation would prevent every subsequent TouchStart.
   if(!p&&['touchCancel','touchEnd'].includes(type)&&/Must send a TouchStart first to start a new touch\./i.test(error.message)){
    input.alreadyReleased++;return;
   }
   throw error;
  }finally{clearTimeout(timer);if(abortDispatch===abort)abortDispatch=null;}
  if(gen===generation)input.lastSuccessAt=Date.now();
 };
 const send=(type,p)=>{
  const epoch=inputEpoch,gen=generation;
  chain=chain.then(async()=>{
   if(closed||gen!==generation||epoch!==inputEpoch||p&&(calibrating||!config.enabled||!active()))return;
   if(!contents.debugger.isAttached())contents.debugger.attach('1.3');
   const recovering=needsCancel&&!!p;
   if(recovering){await dispatch('touchCancel',null,gen);if(gen!==generation)return;needsCancel=false;}
   await dispatch(type,p,gen);
   if(gen!==generation)return;
   if(recovering){input.recoveries++;log({event:'lidar-input-recovered',command:type,recoveries:input.recoveries});}
  }).catch(error=>{if(gen!==generation||closed)return;if(error.message==='LIDAR_INPUT_TIMEOUT'){input.timeouts++;try{if(contents.debugger.isAttached())contents.debugger.detach();}catch{}}down=false;pendingMove=null;filter.reset();needsCancel=true;inputEpoch++;input.errors++;input.lastError={command:input.lastCommand,message:error.message,at:Date.now()};log({event:'lidar-input-error',...input.lastError,count:input.errors,retryOnNextContact:true});});
 };
 const cancelTouch=()=>{inputEpoch++;pendingMove=null;if(down){down=false;send('touchCancel');}};
 const cancel=()=>{filter.reset();cancelTouch();};
 // A calibration changes only consumers/mapping. Keep the mapper's UDP target
 // bound, including return to a disabled profile after first-time calibration.
 const receiver=makeReceiver({port:config.port,address:config.bindAddress,sourceAddress:config.sourceAddress,timeoutMs:config.timeoutMs,now,
  rankPoint:p=>!calibrating&&mapping?mapping.map(p.x,p.y).y:p.y,
  selectionSpace:calibrating?'raw-y':'calibrated-screen-y',
  onDiagnostic:(event,details)=>log({event,...details}),
  onContact:event=>{
   if(closed)return;
   let cursor=null;try{if(mapping&&['down','move'].includes(event.phase))cursor=mapping.map(event.x,event.y);}catch{}
   const observe=mapped=>onPoint({...event,mapped,rawMapped:cursor});
   if(calibrating||!config.enabled||!active()){observe(cursor);cancel();return;}
   if(event.phase==='cancel'){observe(null);cancel();return;}
   if(event.phase==='up'){observe(null);filter.reset();pendingMove=null;if(down){down=false;send('touchEnd');}return;}
   let p;try{p=mapping.map(event.x,event.y);}catch{observe(null);cancel();return;}
   if(!p.inside||p.x<560||p.x>2320){observe(null);cancel();return;}
   const result=filter.update(p,event.sourceContactId??event.id,event.seenAt??now());
   const held=filter.snapshot().point;observe(result?.point??(held?{...held,inside:true}:null));
   if(!result)return;
   if(result.cancel){cancelTouch();return;}
   if(result.restart&&down)cancelTouch();
   p=result.point;
   if(!down){down=true;send('touchStart',p);}
   else if(down){pendingMove=p;if(!moving){moving=true;setImmediate(()=>{moving=false;const move=pendingMove;pendingMove=null;if(move&&down&&!calibrating&&config.enabled&&active())send('touchMove',move);});}}
  }});
 try{await receiver.start();}catch(error){await receiver.close();throw error;}
 return {
  snapshot:()=>({...receiver.snapshot(),enabled:config.enabled&&!calibrating,calibrating,selectionSpace:calibrating?'raw-y':'calibrated-screen-y',cornerErrorPx:mapping?.cornerErrorPx??null,input:{...input,recoveryPending:needsCancel},filter:filter.snapshot()}),
  reconfigure(value,raw=false){
   if(closed)return false;
   value=automaticLidarConfig(value);
   if(['port','bindAddress','sourceAddress','timeoutMs'].some(k=>value?.[k]!==config[k]))return false;
   const next=prepare(value,raw);cancel();receiver.reset();config=value;mapping=next;calibrating=raw;filter=createLidarFilter(value.inputFilter);
   log({event:'lidar-mode-changed',calibrating,enabled:config.enabled,port:config.port,receiverRetained:true});return true;
  },
  reset(){generation++;inputEpoch++;abortDispatch?.();chain=Promise.resolve();down=false;pendingMove=null;filter.reset();needsCancel=true;input.resets++;try{if(contents.debugger.isAttached())contents.debugger.detach();}catch{}receiver.reset();log({event:'lidar-input-reset',generation,receiverRetained:true});send('touchCancel');},
  async close(){cancel();await receiver.close();await chain.catch(()=>{});closed=true;}
 };
}
