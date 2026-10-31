'use strict';
class RecoveryBudget{
 constructor({now=()=>performance.now(),limit=3,windowMs=300000,delays=[1000,3000,10000]}={}){Object.assign(this,{now,limit,windowMs,delays});this.failures=[];}
 take(){const time=this.now();this.failures=this.failures.filter(t=>time-t<this.windowMs);if(this.failures.length>=this.limit)return null;this.failures.push(time);return this.delays[Math.min(this.failures.length-1,this.delays.length-1)];}
 snapshot(){return{attempts:this.failures.length,limit:this.limit};}
}
function classifyTexture(texture,width,height){
 if(!texture)return{code:'NO_SHARED_TEXTURE'};const i=texture.textureInfo;
 if(i?.widgetType!=='frame')return{code:'NON_FRAME_WIDGET',widgetType:i?.widgetType};
 if(!i.handle?.ntHandle)return{code:'MISSING_TEXTURE_HANDLE',actual:i.codedSize};
 if(i.codedSize?.width!==width||i.codedSize?.height!==height)return{code:'TEXTURE_SIZE_MISMATCH',expected:{width,height},actual:i.codedSize};
 return null;
}
// A cold operator launch may clear the previous visitor. Output/API recovery
// and a watchdog relaunch must never cancel the current visitor or their photo.
class OutputStartupGate{
 constructor({recovering=false}={}){this.initialized=recovering;this.pending=null;}
 async prepare(reset){
  if(this.initialized)return{preserved:true};
  if(this.pending)return this.pending;
  this.pending=(async()=>{const result=await reset();this.initialized=true;return{preserved:false,...result};})();
  try{return await this.pending;}finally{this.pending=null;}
 }
}
module.exports={RecoveryBudget,classifyTexture,OutputStartupGate};
