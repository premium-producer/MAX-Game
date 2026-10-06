/** Browser facade for an explicitly enabled, trusted loopback mobile-mode host.
 * Read-only game input: the broker owns canonical lease. Physical actions cannot
 * race the connected phone; renderer layout is the only accepted wall command.
 */
export function createMobileWallSessionPort({base='/mobile-wall',fetch:request=globalThis.fetch,eventSourceFactory=url=>new EventSource(url)}={}){
 let closed=false;const streams=new Set();
 async function call(route,body){if(closed)throw Error('PORT_CLOSED');const response=await request(base+route,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.code??'WALL_OFFLINE'),{code:data.code??'WALL_OFFLINE'});return data;}
 let lastSnapshot=null;const snapshot=async()=>lastSnapshot=await call('/snapshot');
 return {getSnapshot:snapshot,reconnect:snapshot,reconcilePending:async()=>[],retryPending:async()=>null,
  acquireInputOwner:async()=>({readOnly:true}),releaseInputOwner:async()=>{},
  handleContact:async()=>{throw Object.assign(Error('PHONE_CONTROLLED'),{code:'PHONE_CONTROLLED'});},
  sendCommand:command=>{if(command.type!=='SET_LAYOUT')return Promise.reject(Object.assign(Error('PHONE_CONTROLLED'),{code:'PHONE_CONTROLLED'}));return call('/layout',{command});},
  async subscribe(id,listener){listener({snapshot:await snapshot(),connected:true,pending:false});const events=eventSourceFactory(base+'/events');streams.add(events);
   events.addEventListener('state',event=>{try{lastSnapshot=JSON.parse(event.data);listener({snapshot:lastSnapshot,connected:true,pending:false});}catch{}});
   events.addEventListener('error',()=>{if(lastSnapshot)listener({snapshot:lastSnapshot,connected:false,pending:false});});
   return ()=>{events.close();streams.delete(events);};
  },async close(){closed=true;for(const stream of streams)stream.close();streams.clear();},
 };
}

export function installMobileWallBridge({base='/mobile-wall',fetch:request=globalThis.fetch}={}){
 let current=null,inflight=false,closed=false,acked='',lastAck=0,pairingUrl='';
 const qr=document.createElement('div');qr.id='max-mobile-pairing';qr.hidden=true;
 Object.assign(qr.style,{position:'fixed',zIndex:'40',width:'112px',textAlign:'center',pointerEvents:'none',fontFamily:'sans-serif',fontSize:'12px',color:'#fff'});
 const image=document.createElement('img');image.alt='Пройти MAX с телефона';image.width=96;image.height=96;
 const label=document.createElement('div');label.textContent='Пройти с телефона';qr.append(image,label);document.body.append(qr);
 async function refresh(){try{const response=await request(base+'/control');if(!response.ok)throw Error('offline');const next=await response.json();current=next.projection;
   const url=next.pairing?.url??'';if(url!==pairingUrl){pairingUrl=url;image.src=url?base+'/qr.svg?epoch='+encodeURIComponent(next.pairing.expiresAt):'';}
  }catch{current=null;qr.hidden=true;}}
 const timer=setInterval(refresh,500);void refresh();
 return {update({snapshot,ready,palm}){
  if(closed)return;const state=snapshot?.state,p=current;
  const match=p&&state&&p.runId===state.runId&&p.screenId===state.screenId&&p.phase===state.status;
  qr.hidden=!(match&&ready&&state.status==='scan'&&pairingUrl&&palm);
  if(!qr.hidden){const rect=palm.getBoundingClientRect();qr.style.left=`${rect.left+rect.width/2-56}px`;qr.style.top=`${rect.bottom+12}px`;}
  if(!match||!ready||inflight)return;
  const key=JSON.stringify([p.runId,p.screenId,p.presentationEpoch]);if(acked===key&&Date.now()-lastAck<1000)return;inflight=true;
  void request(base+'/presented',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:p.runId,screenId:p.screenId,presentationEpoch:p.presentationEpoch})}).then(response=>{if(response.ok){acked=key;lastAck=Date.now();}}).catch(()=>{}).finally(()=>{inflight=false;});
 },close(){closed=true;clearInterval(timer);qr.remove();}};
}
