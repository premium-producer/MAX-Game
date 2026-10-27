'use strict';
const crypto=require('node:crypto');
function rpcPeer(channel,{timeout=5000}={}){
 const pending=new Map();let closed=false,handler=async()=>{throw Error('RPC_NOT_READY');};
 const send=m=>{if(!closed&&channel.connected!==false)channel.send(m,()=>{});};
 const listener=async m=>{if(!m||m.kdwRuntime!==1)return;if(m.reply){const p=pending.get(m.reply);if(!p)return;pending.delete(m.reply);clearTimeout(p.timer);m.error?p.reject(Object.assign(Error(m.error),{status:503})):p.resolve(m.value);return;}if(typeof m.id==='string'&&typeof m.method==='string'){try{const value=await handler(m.method,m.value);send({kdwRuntime:1,reply:m.id,value});}catch(e){send({kdwRuntime:1,reply:m.id,error:String(e.message).slice(0,400)});}}};
 channel.on('message',listener);
 function close(){if(closed)return;closed=true;channel.removeListener('message',listener);for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('WORKER_DISCONNECTED'));}pending.clear();}
 channel.once('disconnect',close);
 return{handle(fn){handler=fn;},request(method,value){if(closed||channel.connected===false)return Promise.reject(Error('WORKER_DISCONNECTED'));if(pending.size>=50)return Promise.reject(Error('RPC_QUEUE_FULL'));return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('RPC_TIMEOUT'));},timeout);pending.set(id,{resolve,reject,timer});send({kdwRuntime:1,id,method,value});});},close};
}
module.exports={rpcPeer};
