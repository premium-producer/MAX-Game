'use strict';
// Output workers use the separate local API. They never bind its port or stop it.
const {rpcPeer}=require('./runtime-ipc.cjs');

function createPortableServer({root,config,getOutput=()=>null}){
 const origin='http://127.0.0.1:'+config.port,peer=rpcPeer(process);let closing=false,lastParent=performance.now(),visualReady=false,checking=false,lastRenderer=performance.now();
 peer.handle(async(method,value)=>{lastParent=performance.now();if(method==='heartbeat')return true;if(method==='shutdown'){setImmediate(()=>require('electron').app.quit());return true;}const output=getOutput();if(method==='output'&&output&&['setArmed','configureLidar','beginCalibration','cancelCalibration','saveCalibration','captureCalibration','setCursor','gameControl'].includes(value?.method))return await output[value.method](value.value);throw Error('OUTPUT_NOT_READY');});
 const timer=setInterval(()=>{try{const o=getOutput();if(performance.now()-lastParent>4000){require('electron').app.exit(1);return;}if(!o&&!checking){const w=require('electron').BrowserWindow.getAllWindows()[0];if(w&&!w.isDestroyed()){checking=true;const timeout=setTimeout(()=>{visualReady=false;},1500);void w.webContents.executeJavaScript(`!!(${config.verifyExpression||'document.readyState === "complete"'})`).then(value=>{visualReady=!!value;lastRenderer=performance.now();}).catch(()=>{visualReady=false;}).finally(()=>{clearTimeout(timeout);checking=false;});}}if(!o&&performance.now()-lastRenderer>15000)require('electron').app.exit(1);process.send?.({runtimeEvent:'output',value:o?.operatorStatus()??{kind:'window',contentReady:visualReady,backgroundReady:visualReady}},()=>{});process.send?.({runtimeEvent:'heartbeat',memory:process.memoryUsage().rss},()=>{});}catch(e){process.send?.({runtimeEvent:'fault',code:e.code||e.message},()=>{});}},500);timer.unref();
 process.once('disconnect',()=>{closing=true;clearInterval(timer);require('electron').app.exit(1);});
 return{origin,health:{application:config.id,version:config.version,pid:process.pid,origin,entry:config.entry},async listen(){const r=await fetch(origin+'/__kdw/health',{signal:AbortSignal.timeout(4000)});const h=await r.json();if(!r.ok||h.application!==config.id)throw Error('API_IDENTITY_MISMATCH');},async close(){if(closing)return;closing=true;clearInterval(timer);peer.close();},journal:null};
}
module.exports={createPortableServer};
