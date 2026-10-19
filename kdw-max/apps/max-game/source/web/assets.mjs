export class WebAssets {
 constructor(manifest,base=new URL('.',document.baseURI),{fetchImpl=fetch}={}){this.manifest=manifest;this.base=new URL(base);this.fetch=(...args)=>fetchImpl(...args);this.pending=new Map();this.ready=new Set();}
 record(path){return this.manifest.files[this.manifest.aliases?.[path]??path];}
 url(path){if(!this.record(path)||path.startsWith('/')||path.split('/').includes('..'))throw Error('UNKNOWN_ASSET: '+path);return new URL(this.manifest.aliases?.[path]??path,this.base).href;}
 async load(path){
  if(this.pending.has(path))return this.pending.get(path);
  const operation=(async()=>{let error;for(let attempt=0;attempt<3;attempt++){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{const response=await this.fetch(this.url(path),{signal:controller.signal,cache:attempt?'reload':'force-cache'});if(!response.ok)throw Error('HTTP '+response.status);const bytes=await response.arrayBuffer();if(bytes.byteLength!==this.record(path).bytes)throw Error('ASSET_SIZE_MISMATCH');
    if(globalThis.crypto?.subtle){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==this.record(path).sha256)throw Error('ASSET_HASH_MISMATCH');}this.ready.add(path);return this.url(path);
   }catch(e){error=e;}finally{clearTimeout(timer);}if(attempt<2)await new Promise(r=>setTimeout(r,250*(attempt+1)));
  }throw Object.assign(Error('Не удалось загрузить ресурс: '+path),{cause:error});})();
  this.pending.set(path,operation);operation.catch(()=>this.pending.delete(path));return operation;
 }
 async preload(paths,onProgress=()=>{}){const list=[...new Set(paths.filter(Boolean))];let index=0,done=0;onProgress(0,list.length);await Promise.all(Array.from({length:Math.min(3,list.length)},async()=>{while(index<list.length){await this.load(list[index++]);onProgress(++done,list.length);}}));}
}
