// Browser-only, offline reader. Opening retains a File handle and a small index;
// PNG bytes are read/verified individually, never as one large ArrayBuffer.
(() => {
 const MAGIC='MAXSCREENPACK1\n',MAX_IMAGE=8*1024*1024,MAX_INDEX=1024*1024;
 const primes=[];for(let n=2;primes.length<64;n++){let prime=true;for(let j=2;j*j<=n;j++)if(n%j===0){prime=false;break;}if(prime)primes.push(n);}
 const word=x=>(x-Math.floor(x))*4294967296|0,K=primes.map(p=>word(Math.cbrt(p))),INITIAL=primes.slice(0,8).map(p=>word(Math.sqrt(p)));
 const rotate=(x,n)=>(x>>>n)|(x<<(32-n));
 function sha256(bytes){
  const size=Math.ceil((bytes.length+9)/64)*64,padded=new Uint8Array(size);padded.set(bytes);padded[bytes.length]=128;
  const view=new DataView(padded.buffer),bits=bytes.length*8;view.setUint32(size-8,Math.floor(bits/4294967296));view.setUint32(size-4,bits>>>0);
  const hash=INITIAL.slice(),w=new Int32Array(64);
  for(let offset=0;offset<size;offset+=64){
   for(let i=0;i<16;i++)w[i]=view.getInt32(offset+i*4);
   for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(rotate(a,7)^rotate(a,18)^(a>>>3))+w[i-7]+(rotate(b,17)^rotate(b,19)^(b>>>10)))|0;}
   let [a,b,c,d,e,f,g,h]=hash;
   for(let i=0;i<64;i++){const t1=(h+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0,t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
   for(const [i,v]of [a,b,c,d,e,f,g,h].entries())hash[i]=(hash[i]+v)|0;
  }
  return hash.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
 }
 async function digest(bytes){return globalThis.crypto?.subtle?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join(''):sha256(bytes);}
 async function open(file,expected){
  const stats={reads:0,maxRead:0,totalRead:0,inFlight:0,maxInFlight:0};
  async function slice(start,end){const length=end-start;if(length<0||length>MAX_IMAGE)throw Error('Слишком большой блок пакета');stats.reads++;stats.totalRead+=length;stats.maxRead=Math.max(stats.maxRead,length);return new Uint8Array(await file.slice(start,end).arrayBuffer());}
  const prefix=await slice(0,MAGIC.length+4);if(prefix.length!==MAGIC.length+4||new TextDecoder().decode(prefix.subarray(0,MAGIC.length))!==MAGIC)throw Error('Выберите файл screens.maxscreens из папки плагина');
  const indexSize=new DataView(prefix.buffer,prefix.byteOffset+MAGIC.length,4).getUint32(0,true);if(indexSize<2||indexSize>MAX_INDEX)throw Error('Повреждён индекс пакета');
  const start=MAGIC.length+4,indexBytes=await slice(start,start+indexSize);if(await digest(indexBytes)!==expected)throw Error('Пакет другой версии. Выберите screens.maxscreens из этой папки');
  const index=JSON.parse(new TextDecoder().decode(indexBytes)),dataStart=start+indexSize;if(index.schema!=='max-screen-pack/v1'||!index.assets||!Number.isSafeInteger(index.payloadBytes)||dataStart+index.payloadBytes!==file.size)throw Error('Неполный или повреждённый пакет');
  for(const a of Object.values(index.assets))if(!Number.isSafeInteger(a.offset)||a.offset<0||!Number.isSafeInteger(a.bytes)||a.bytes<8||a.bytes>MAX_IMAGE||a.offset+a.bytes>index.payloadBytes||!/^[a-f0-9]{64}$/.test(a.sha256))throw Error('Повреждён список кадров');
  return {stats,count:Object.keys(index.assets).length,async read(id){
   const a=index.assets[id];if(!Object.hasOwn(index.assets,id)||!a)throw Error('Нет кадра '+id);if(stats.inFlight)throw Error('Предыдущий кадр ещё читается');stats.inFlight++;stats.maxInFlight=Math.max(stats.maxInFlight,stats.inFlight);
   try{const bytes=await slice(dataStart+a.offset,dataStart+a.offset+a.bytes);if(bytes.length!==a.bytes||await digest(bytes)!==a.sha256)throw Error('Повреждён кадр '+id);return bytes;}finally{stats.inFlight--;}
  }};
 }
 globalThis.MaxScreenPack={open,sha256};
})();
