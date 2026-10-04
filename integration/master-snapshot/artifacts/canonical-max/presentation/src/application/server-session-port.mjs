const fail=(code,cause)=>Object.assign(new Error(code,cause?{cause}:undefined),{code});
const frozen=value=>{const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};return freeze(structuredClone(value));};
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id);

/** Network SessionPort. One confirmed snapshot, no local game rules or storage fallback. */
export function createServerSessionPort({baseUrl='/api/max-game/v1',fetch:fetchImpl=globalThis.fetch,eventSourceFactory=url=>new EventSource(url),getAuthHeaders=()=>({}),ownerId=globalThis.crypto.randomUUID(),onObserverError=()=>{},now=Date.now,heartbeatMs=5000,managed=false}={}) {
  if(!validId(ownerId)||typeof fetchImpl!=='function'||typeof getAuthHeaders!=='function')throw new TypeError('Invalid server SessionPort options');
  const sessions=new Map(),controller=new AbortController();let closed=false,acquisitions=0;
  function entry(id){if(!validId(id))throw fail('INVALID_SESSION_ID');if(!sessions.has(id))sessions.set(id,{id,snapshot:null,online:false,owner:null,pending:null,queue:Promise.resolve(),listeners:new Set(),events:null});return sessions.get(id);}
  function queue(id,work){if(closed)return Promise.reject(fail('PORT_CLOSED'));const e=entry(id),result=e.queue.catch(()=>{}).then(()=>{if(closed)throw fail('PORT_CLOSED');return work(e);});e.queue=result.catch(()=>{});return result;}
  function report(cause){try{onObserverError(cause);}catch{}}
  function emit(e){if(closed)return;const event=frozen({snapshot:e.snapshot,connected:e.online,pending:Boolean(e.pending)});for(const listener of e.listeners)try{Promise.resolve(listener(event)).catch(report);}catch(cause){report(cause);}}
  function accept(e,snapshot,online=true){
    if(!snapshot?.state||snapshot.state.sessionId!==e.id||!Number.isSafeInteger(snapshot.state.revision)||snapshot.state.revision<0)throw fail('INVALID_BACKEND_SNAPSHOT');
    const previous=e.snapshot;
    if(managed&&previous?.assignment&&!snapshot.assignment)snapshot={...snapshot,assignment:previous.assignment};
    if(managed&&previous?.assignment?.lifecycle.status!=='active'&&previous?.assignment&&snapshot.assignment?.lifecycle.status==='active')return previous;
    if(previous&&snapshot.state.sessionId!==previous.state.sessionId)throw fail('INVALID_BACKEND_SNAPSHOT');
    if(!previous||snapshot.state.revision>previous.state.revision||snapshot.state.revision===previous.state.revision&&(snapshot.layouts?.layoutRevision??0)>=(previous.layouts?.layoutRevision??0))e.snapshot=frozen(snapshot);
    if(managed&&e.snapshot?.assignment?.lifecycle.status!=='active'){e.owner=null;e.pending=null;e.pendingSent=false;} if(online)e.online=true;emit(e);return e.snapshot;
  }
  async function request(route,{method='GET',body}={}) {
    if(closed)throw fail('PORT_CLOSED');
    let response,data;
    try{
      response=await fetchImpl(baseUrl.replace(/\/$/,'')+route,{method,headers:{...await getAuthHeaders(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal});
      data=await response.json();
    }catch(cause){throw fail(closed?'PORT_CLOSED':'BACKEND_OFFLINE',cause);}
    if(closed)throw fail('PORT_CLOSED');
    if(!response.ok&&!data?.reply){const cause=fail(data?.error?.code??'BACKEND_UNAVAILABLE');cause.offline=response.status>=500;throw cause;}
    return data;
  }
  function offline(e,cause){if(cause.offline||['BACKEND_OFFLINE','BACKEND_UNAVAILABLE','STORAGE_UNAVAILABLE','MAX_BACKEND_UNAVAILABLE','INVALID_BACKEND_SNAPSHOT'].includes(cause.code)){e.online=false;emit(e);}throw cause;}
  async function get(id,e){try{return accept(e,await request(`/sessions/${id}`));}catch(cause){return offline(e,cause);}}
  async function acquire(id,e){
    if(managed&&e.snapshot?.assignment?.lifecycle.status!=='active')throw fail('ASSIGNMENT_TERMINAL_CONFLICT');
    const received=lease=>{e.owner=lease;e.renewAt=now()+Math.max(0,(lease.expiresAt-(lease.serverTime??lease.expiresAt))-5000);return lease;};
    if(e.owner&&now()<e.renewAt)return e.owner;
    if(e.owner){try{return received(await request(`/sessions/${id}/input-owner`,{method:'POST',body:{action:'renew',owner:e.owner}}));}catch(cause){if(cause.code!=='OWNER_REQUIRED')throw cause;e.owner=null;}}
    // Retain the acquisition ID if its response is lost; the lease claim is idempotent.
    e.acquisitionId??=`${ownerId.slice(0,95)}.${++acquisitions}`;
    const lease=received(await request(`/sessions/${id}/input-owner`,{method:'POST',body:{action:'acquire',ownerId,acquisitionId:e.acquisitionId}}));
    await get(id,e);return lease;
  }
  async function transmit(id,e,command){
    try{
      const owner=await acquire(id,e);e.pendingSent=true;
      const result=await request(`/sessions/${id}/commands`,{method:'POST',body:{owner,command}});
      accept(e,result.snapshot);e.pending=null;e.pendingSent=false;emit(e);return frozen(result);
    }catch(cause){if(cause.code==='OWNER_REQUIRED'){e.owner=null;e.online=false;emit(e);throw cause;}if(!['BACKEND_OFFLINE','STORAGE_UNAVAILABLE','BACKEND_UNAVAILABLE','MAX_BACKEND_UNAVAILABLE','INVALID_BACKEND_SNAPSHOT'].includes(cause.code)&&!(cause.code==='OWNER_BUSY'&&e.pendingSent)){e.pending=null;e.pendingSent=false;}return offline(e,cause);}
  }
  function startEvents(id,e){
    if(e.events||!eventSourceFactory)return;
    const events=eventSourceFactory(baseUrl.replace(/\/$/,'')+`/sessions/${id}/events`);e.events=events;
    events.addEventListener('state',event=>{if(closed||e.events!==events)return;try{accept(e,JSON.parse(event.data).snapshot,e.online);}catch(cause){e.online=false;emit(e);report(cause);}});
    events.addEventListener('error',()=>{if(closed||e.events!==events)return;e.online=false;emit(e);});
    // SSE is notification, not authority for recovery after a transport gap.
    events.addEventListener('open',()=>{if(!closed&&e.events===events)api.reconnect(id).catch(cause=>{try{onObserverError(cause);}catch{}});});
  }
  const api={
    createSession(options){if(managed)return Promise.reject(fail('MANAGED_SESSION_FORBIDDEN'));const captured=structuredClone(options);return queue(captured.sessionId,async e=>{try{accept(e,await request('/sessions',{method:'POST',body:captured}));await acquire(captured.sessionId,e);return e.snapshot;}catch(cause){return offline(e,cause);}});},
    getSnapshot(id){return queue(id,e=>get(id,e));},
    sendCommand(input){let command;try{command=structuredClone(input);}catch{return Promise.reject(fail('INVALID_COMMAND'));}return queue(command?.sessionId,async e=>{
      if(!e.online)throw fail('BACKEND_OFFLINE');
      if(e.pending&&e.pending.commandId!==command.commandId)throw fail('PENDING_COMMAND');
      if(e.pending&&JSON.stringify(e.pending)!==JSON.stringify(command))throw fail('COMMAND_ID_REUSED');
      e.pending=command;return transmit(command.sessionId,e,command);
    });},
    reconnect(id){return queue(id,async e=>{await get(id,e);if(!managed||e.owner)await acquire(id,e);if(e.pending)await transmit(id,e,e.pending);return e.snapshot;});},
    subscribe(id,callback){if(typeof callback!=='function')return Promise.reject(new TypeError('Listener required'));return queue(id,async e=>{if(!e.snapshot)await get(id,e);if(closed)throw fail('PORT_CLOSED');const wrapper=event=>callback(event);e.listeners.add(wrapper);startEvents(id,e);emit(e);return()=>{e.listeners.delete(wrapper);if(!e.listeners.size){e.events?.close();e.events=null;}};});},
    acquireInputOwner(id){return queue(id,e=>acquire(id,e));},
    releaseInputOwner(id){return queue(id,async e=>{if(!e.owner)return;await request(`/sessions/${id}/input-owner`,{method:'POST',body:{action:'release',owner:e.owner}});e.owner=null;e.acquisitionId=null;});},
    renewInputOwner(id){return queue(id,e=>{e.renewAt=0;return acquire(id,e);});},
    handleContact(id,event){const captured=structuredClone(event);return queue(id,async e=>{if(!e.online||e.pending)throw fail('BACKEND_OFFLINE');try{return accept(e,await request(`/sessions/${id}/contacts`,{method:'POST',body:{owner:await acquire(id,e),event:captured}}));}catch(cause){return offline(e,cause);}});},
    async close(){
      if(closed)return;closed=true;clearInterval(heartbeat);controller.abort();
      for(const e of sessions.values()){e.events?.close();e.events=null;e.listeners.clear();}
      await Promise.all([...sessions.values()].map(e=>e.queue));
      // Teardown releases the input lease before another renderer takes ownership.
      // An offline transport leaves server expiry as the safety boundary.
      await Promise.allSettled([...sessions].filter(([,e])=>e.owner).map(async([id,e])=>fetchImpl(baseUrl.replace(/\/$/,'')+`/sessions/${id}/input-owner`,{
        method:'POST',headers:{...await getAuthHeaders(),'Content-Type':'application/json'},body:JSON.stringify({action:'release',owner:e.owner}),signal:AbortSignal.timeout(1500),
      })));
      sessions.clear();
    },
  };
  const heartbeat=heartbeatMs>0?setInterval(()=>{for(const [id,e] of sessions)if(e.owner&&e.online&&!e.heartbeatPending){e.heartbeatPending=true;queue(id,()=>acquire(id,e)).catch(cause=>{try{offline(e,cause);}catch{}report(cause);}).finally(()=>{e.heartbeatPending=false;});}},heartbeatMs):null;
  heartbeat?.unref?.();
  return Object.freeze(api);
}
