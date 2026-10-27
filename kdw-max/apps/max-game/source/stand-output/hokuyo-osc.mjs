import osc from 'osc';
const SOCKET_ERRORS=new Set(['EADDRINUSE','EADDRNOTAVAIL','EACCES','EBADF','EINVAL','ECONNRESET','ENETDOWN','ENETUNREACH','EHOSTUNREACH','ENOTCONN','ENOBUFS']);

// osc.js owns binary decoding/UDP. Selection runs once per complete packet.
// Compact [id,x,y] and legacy [id,x,y,a,b] are both captured producer profiles.
export function createHokuyoReceiver({port=9001,address='0.0.0.0',sourceAddress='10.0.0.11',now=Date.now,onContact=()=>{},onDiagnostic=()=>{},rankPoint=p=>p.y,selectionSpace='raw-y',makePort=options=>new osc.UDPPort(options),setRetryTimer=setTimeout,clearRetryTimer=clearTimeout,timeoutMs=350}={}){
 let transport,closed=false,bound=false,lastPacketAt=0,primary=null,gesture=null,lastPoint=null,sequence=0,timer,selectedY=null,started=false,retryTimer=null,retryCount=0,opening=false,lastTransportError=null;
 const contacts=new Map(),addresses=new Set(),quarantine=new Set();
 const stats={packetCount:0,decodeErrors:0,rejectedSources:0,acceptedUpdates:0,ignoredContacts:0,selectionChanges:0,connectionAttempts:0,transportErrors:0};
 const emit=(id,phase,p)=>onContact({id,phase,sequence:++sequence,at:now(),...p});
 function finish(phase){const id=gesture,p=lastPoint;primary=null;gesture=null;lastPoint=null;selectedY=null;if(id!==null)emit(id,phase,p??{});}
 const quarantineId=id=>{quarantine.add(id);if(quarantine.size>128)quarantine.delete(quarantine.values().next().value);};
 function prune(){let changed=false;for(const [id,p] of contacts)if(now()-p.seenAt>timeoutMs){contacts.delete(id);quarantineId(id);changed=true;}return changed;}
 function select(emptyPhase='up'){
  let best=null,y=Infinity;
  for(const [id,p] of contacts){let rank;try{rank=rankPoint(p);}catch{continue;}
   if(!Number.isFinite(rank))continue;
   if(rank<y||rank===y&&(id===primary||best!==primary&&id<best)){best=id;y=rank;}
  }
  if(best===null){finish(contacts.size?'cancel':emptyPhase);return;}
  const previous=primary;primary=best;selectedY=y;
  lastPoint={...contacts.get(best),sourceContactId:String(best),selectedY:y};
  if(gesture===null){gesture=String(best);emit(gesture,'down',lastPoint);}
  else {if(previous!==best)stats.selectionChanges++;emit(gesture,'move',lastPoint);}
 }
 function message(m){
  stats.packetCount++;if(addresses.size<16)addresses.add(m.address);
  const args=m.args?.map(a=>a?.value),id=args?.[0];
  if(!Number.isSafeInteger(id)||id<0||id>2147483647){stats.decodeErrors++;return false;}
  if(m.address==='/delete'&&args.length===1){const changed=contacts.delete(id);quarantine.delete(id);return changed;}
  if(!['/update','/create'].includes(m.address)||![3,5].includes(args?.length)||!args.slice(1).every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=10000)){stats.decodeErrors++;return false;}
  if(m.address==='/create')quarantine.delete(id);else if(quarantine.has(id)){stats.ignoredContacts++;return false;}
  if(!contacts.has(id)&&contacts.size>=128){stats.decodeErrors++;return false;}
  contacts.set(id,{x:args[1],y:args[2],seenAt:lastPacketAt});stats.acceptedUpdates++;return true;
 }
 function packet(p,info){
  if(closed)return;
  if(info?.address!==sourceAddress){stats.rejectedSources++;return;}
  lastPacketAt=now();const expired=prune();let changed=expired;
  // A complete source gap ends the old gesture before accepting a fresh create.
  if(expired&&!contacts.size)finish('cancel');
  if(closed)return;
  const walk=m=>{if(m.packets)m.packets.forEach(walk);else changed=message(m)||changed;};walk(p);
  if(changed)select(expired?'cancel':'up');
 }
 function expire(){if(prune())select('cancel');}
 function reset(){for(const id of contacts.keys())quarantineId(id);contacts.clear();finish('cancel');}
 // Rebind only our local OSC listener after a socket failure. Silence while
 // nobody touches the wall is normal and must never restart the mapper/sensor.
 function retry(){
  if(closed||retryTimer!==null)return;
  const delay=Math.min(5000,250*2**Math.min(retryCount++,5));
  retryTimer=setRetryTimer(()=>{retryTimer=null;if(!closed)void connect();},delay);retryTimer?.unref?.();
  onDiagnostic('lidar-receiver-retry',{port,delay,code:lastTransportError});
 }
 function connect(){
  if(closed||opening||bound)return Promise.resolve();opening=true;stats.connectionAttempts++;
  return new Promise(resolve=>{
   let current,settled=false;
   const done=()=>{if(!settled){settled=true;resolve();}};
   const failed=e=>{
    if(closed||current&&current!==transport){done();return;}
    lastTransportError=e?.code??'OSC_TRANSPORT_ERROR';stats.transportErrors++;bound=false;opening=false;transport=null;reset();
    try{current?.close();}catch{}
    onDiagnostic('lidar-receiver-error',{code:lastTransportError,reconnecting:true});retry();done();
   };
   try{
    current=makePort({localAddress:address,localPort:port,metadata:true});transport=current;
    current.on('osc',(p,info)=>{if(!closed&&transport===current&&bound)packet(p,info);});
    current.on('ready',()=>{
     if(closed||transport!==current){try{current.close();}catch{}done();return;}
     bound=true;opening=false;retryCount=0;lastTransportError=null;
     onDiagnostic('lidar-receiver-ready',{port,sourceAddress,selection:'topmost',selectionSpace});done();
    });
    current.on('error',e=>{
     if(closed||transport!==current)return;
     // Decoder errors do not invalidate a healthy socket.
     if(bound&&!SOCKET_ERRORS.has(e?.code)&&!e?.code?.startsWith('ERR_SOCKET_')){stats.decodeErrors++;onDiagnostic('lidar-receiver-error',{code:'OSC_DECODE_ERROR'});return;}
     failed(e);
    });
    current.on('close',()=>{if(transport===current){transport=null;bound=false;opening=false;reset();if(!closed)retry();}done();});
    current.open();
   }catch(e){failed(e);}
  });
 }
 return {
  async start(){
   if(closed)throw Error('OSC_RECEIVER_CLOSED');
   if(started)return this;started=true;
   timer=setInterval(expire,50);timer.unref?.();await connect();return this;
  },
  snapshot(){return {bound,reconnecting:!closed&&(opening||retryTimer!==null),lastTransportError,port,sourceAddress,...stats,lastPacketAgeMs:lastPacketAt?Math.max(0,now()-lastPacketAt):null,addresses:[...addresses],activeContactId:gesture,selectedContactId:primary===null?null:String(primary),selection:'topmost',selectionSpace,selectedY,contactCount:contacts.size};},
  reset,
  close(){if(closed)return;closed=true;if(retryTimer!==null){clearRetryTimer(retryTimer);retryTimer=null;}clearInterval(timer);reset();if(!transport)return;const wasBound=bound;bound=false;return new Promise(resolve=>{transport.once('close',resolve);try{transport.close();}catch{resolve();}if(!wasBound)resolve();});},
  decodePacket(bytes,info){packet(osc.readPacket(bytes,{metadata:true}),info);},
  expire,
 };
}
