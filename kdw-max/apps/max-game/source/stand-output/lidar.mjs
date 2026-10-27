import {createHokuyoReceiver} from './hokuyo-osc.mjs';
import {solveCalibration} from './calibration.mjs';

// Native CDP touch events generate trusted DOM PointerEvents and preserve the
// existing game admission/hold/hotspot path. OSC never calls mission commands.
export async function startLidar({config,contents,active,log,width=3072,height=1536}){
 if(!config?.enabled)return {snapshot:()=>({enabled:false}),reset(){},close(){}};
 if(!config.sourceAddress||!config.bindAddress||!config.rawPoints||!config.targetPoints)
  throw Error('LiDAR requires an explicit source, bind address and measured calibration');
 if(config.width!==width||config.height!==height)throw Error('LiDAR calibration viewport mismatch');
 if(!Number.isFinite(config.timeoutMs)||config.timeoutMs<100||config.timeoutMs>3000)throw Error('Invalid LiDAR watchdog');
 const mapping=solveCalibration(config.rawPoints,config.targetPoints,[width,height]);
 if(!contents.debugger.isAttached())contents.debugger.attach('1.3');
 let down=false,closed=false,chain=Promise.resolve(),pendingMove=null,moving=false;
 const send=(type,p)=>{
  chain=chain.then(()=>contents.debugger.sendCommand('Input.dispatchTouchEvent',{
   type,touchPoints:p?[{x:p.x,y:p.y,id:1,radiusX:2,radiusY:2,force:1}]:[],
  })).catch(error=>{log({event:'lidar-input-error',message:error.message});throw error;});
  // Consume rejection now as well as in the next serialized command.
  chain.catch(()=>{closed=true;});
 };
 const cancel=()=>{pendingMove=null;if(down){down=false;send('touchCancel');}};
 const receiver=createHokuyoReceiver({port:config.port??9001,address:config.bindAddress,sourceAddress:config.sourceAddress,timeoutMs:config.timeoutMs,rankPoint:p=>mapping.map(p.x,p.y).y,selectionSpace:'calibrated-screen-y',
  onDiagnostic:(event,details)=>log({event,...details}),
  onContact:event=>{
   if(closed)return;
   if(!active()){cancel();return;}
   if(event.phase==='cancel'){cancel();return;}
   if(event.phase==='up'){pendingMove=null;if(down){down=false;send('touchEnd');}return;}
   let p;try{p=mapping.map(event.x,event.y);}catch{cancel();return;}
   // Preserve the real pixel-map touch field; never clamp an outside point onto a button.
   if(!p.inside||p.x<560||p.x>2320){cancel();return;}
   if(event.phase==='down'){if(down)cancel();down=true;send('touchStart',p);}
   else if(down){pendingMove=p;if(!moving){moving=true;setImmediate(()=>{moving=false;const move=pendingMove;pendingMove=null;if(move&&down&&active())send('touchMove',move);});}}
  }});
 await receiver.start();
 return {snapshot:()=>({enabled:true,...receiver.snapshot(),cornerErrorPx:mapping.cornerErrorPx}),
  reset(){cancel();receiver.reset();},async close(){cancel();receiver.close();await chain.catch(()=>{});closed=true;}};
}
