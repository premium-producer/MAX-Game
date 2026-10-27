import {createHokuyoReceiver} from './hokuyo-osc.mjs';
import {solveCalibration} from './calibration.mjs';
import {isIP} from 'node:net';
export {solveCalibration};
// A configured primary input cannot be disabled by a legacy profile toggle.
// Missing calibration remains a setup state; never invent sensor coordinates.
export const automaticLidarConfig=value=>value?{...value,enabled:value.enabled===true||!!(value.rawPoints&&value.targetPoints)}:value;
export function validateLidarConfig(value){
 const keys=['enabled','bindAddress','sourceAddress','port','timeoutMs','width','height','rawPoints','targetPoints'];
 if(!value||Object.keys(value).some(k=>!keys.includes(k))||typeof value.enabled!=='boolean'||!isIP(value.bindAddress)||!isIP(value.sourceAddress)||value.sourceAddress==='0.0.0.0'||!Number.isInteger(value.port)||value.port<1024||value.port>65535||!Number.isFinite(value.timeoutMs)||value.timeoutMs<100||value.timeoutMs>3000||value.width!==3072||value.height!==1536)throw Error('Проверьте IP, порт, watchdog и размер 3072×1536');
 if(value.rawPoints!==null||value.targetPoints!==null){solveCalibration(value.rawPoints,value.targetPoints,[value.width,value.height]);if(value.targetPoints.some(([x,y])=>x<0||x>value.width||y<0||y>value.height)||value.rawPoints.some(p=>p.some(n=>Math.abs(n)>10000)))throw Error('Точки вне допустимого диапазона');}
 else if(value.enabled)throw Error('Сначала выполните калибровку');
 return structuredClone(value);
}

// Native CDP touch events generate trusted DOM PointerEvents and preserve the
// existing game admission/hold/hotspot path. OSC never calls mission commands.
export async function startLidar({config,contents,active,log,width=3072,height=1536,calibrating=false,onPoint=()=>{},makeReceiver=createHokuyoReceiver}){
 config=automaticLidarConfig(config);
 if(!config?.enabled&&!calibrating)return {snapshot:()=>({enabled:false}),reset(){},close(){}};
 const prepare=(value,raw)=>{
  validateLidarConfig(raw?{...value,enabled:false}:value);
  if(value.width!==width||value.height!==height)throw Error('LiDAR calibration viewport mismatch');
  const mapping=value.rawPoints&&value.targetPoints?solveCalibration(value.rawPoints,value.targetPoints,[width,height]):null;
  if(value.enabled&&!raw&&!contents.debugger.isAttached())contents.debugger.attach('1.3');
  return mapping;
 };
 let mapping=prepare(config,calibrating);
 let down=false,closed=false,chain=Promise.resolve(),pendingMove=null,moving=false,inputEpoch=0,needsCancel=false;
 const send=(type,p)=>{
  const epoch=inputEpoch;
  chain=chain.then(async()=>{
   if(closed||p&&(epoch!==inputEpoch||calibrating||!config.enabled||!active()))return;
   if(!contents.debugger.isAttached())contents.debugger.attach('1.3');
   if(needsCancel&&p){await contents.debugger.sendCommand('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});needsCancel=false;}
   return contents.debugger.sendCommand('Input.dispatchTouchEvent',{
    type,touchPoints:p?[{x:p.x,y:p.y,id:1,radiusX:2,radiusY:2,force:1}]:[],
   });
  }).catch(error=>{down=false;pendingMove=null;needsCancel=true;inputEpoch++;log({event:'lidar-input-error',message:error.message,retryOnNextContact:true});});
 };
 const cancel=()=>{inputEpoch++;pendingMove=null;if(down){down=false;send('touchCancel');}};
 // A calibration changes only consumers/mapping. Keep the mapper's UDP target
 // bound, including return to a disabled profile after first-time calibration.
 const receiver=makeReceiver({port:config.port,address:config.bindAddress,sourceAddress:config.sourceAddress,timeoutMs:config.timeoutMs,
  rankPoint:p=>!calibrating&&mapping?mapping.map(p.x,p.y).y:p.y,
  selectionSpace:calibrating?'raw-y':'calibrated-screen-y',
  onDiagnostic:(event,details)=>log({event,...details}),
  onContact:event=>{
   if(closed)return;
   let cursor=null;try{if(mapping&&['down','move'].includes(event.phase))cursor=mapping.map(event.x,event.y);}catch{}
   onPoint({...event,mapped:cursor});
   if(calibrating||!config.enabled||!active()){cancel();return;}
   if(event.phase==='cancel'){cancel();return;}
   if(event.phase==='up'){pendingMove=null;if(down){down=false;send('touchEnd');}return;}
   let p;try{p=mapping.map(event.x,event.y);}catch{cancel();return;}
   if(!p.inside||p.x<560||p.x>2320){cancel();return;}
   if(event.phase==='down'||event.phase==='move'&&!down){if(down)cancel();down=true;send('touchStart',p);}
   else if(down){pendingMove=p;if(!moving){moving=true;setImmediate(()=>{moving=false;const move=pendingMove;pendingMove=null;if(move&&down&&!calibrating&&config.enabled&&active())send('touchMove',move);});}}
  }});
 try{await receiver.start();}catch(error){await receiver.close();throw error;}
 return {
  snapshot:()=>({...receiver.snapshot(),enabled:config.enabled&&!calibrating,calibrating,selectionSpace:calibrating?'raw-y':'calibrated-screen-y',cornerErrorPx:mapping?.cornerErrorPx??null}),
  reconfigure(value,raw=false){
   if(closed)return false;
   value=automaticLidarConfig(value);
   if(['port','bindAddress','sourceAddress','timeoutMs'].some(k=>value?.[k]!==config[k]))return false;
   const next=prepare(value,raw);cancel();receiver.reset();config=value;mapping=next;calibrating=raw;
   log({event:'lidar-mode-changed',calibrating,enabled:config.enabled,port:config.port,receiverRetained:true});return true;
  },
  reset(){cancel();receiver.reset();},
  async close(){cancel();await receiver.close();await chain.catch(()=>{});closed=true;}
 };
}
