// Presentation facade over SessionPort. No renderer, storage, or game rules.
// Keep the already deployed preview key so a renderer switch retains its session.
export const WEBGL_SHARED_KEY = 'max-site-shared:v1';

export function createWebGLSession({port,catalog,sessionId,profile='local',initialOwnerActive=true,assignmentId=null,onSnapshot=()=>{},onError=()=>{}}){
 if(!port||!catalog?.contentRevision||!sessionId||!['local','server'].includes(profile))throw new TypeError('Explicit WebGL SessionPort profile required');
 const managed=assignmentId!==null;let contacted=false;
 let pendingCommand=null,restartPromise=null;
 let snapshot=null,unsubscribe=null,busy=false,polling=false,closed=false,serial=0,contactSerial=0,lastPoll=-Infinity,startPromise=null,connected=profile==='local';
 const report=error=>{if(!closed)try{onError(error);}catch{}};
 const accept=value=>{
  if(closed||!value)return;
  let next=value.snapshot??value;
  if(managed&&snapshot?.assignment&&!next.assignment)next={...next,assignment:snapshot.assignment};
  if(managed&&(next.assignment?.receipt.assignmentId!==assignmentId||next.assignment?.receipt.sessionId!==sessionId||next.state?.contentRevision!==catalog.contentRevision))throw Object.assign(Error('ASSIGNMENT_CONTEXT_CONFLICT'),{code:'ASSIGNMENT_CONTEXT_CONFLICT'});
  if(!next.state||next.state.sessionId!==sessionId||!next.layouts)throw Object.assign(new Error('INVALID_BACKEND_SNAPSHOT'),{code:'INVALID_BACKEND_SNAPSHOT'});
  if(snapshot&&(next.state.revision<snapshot.state.revision||next.layouts.layoutRevision<snapshot.layouts.layoutRevision))return;
  const online=value.connected??connected;
  const changed=!snapshot||next.assignment?.lifecycle.status!==snapshot.assignment?.lifecycle.status||next.state.revision!==snapshot.state.revision||next.layouts.layoutRevision!==snapshot.layouts.layoutRevision||online!==connected;
  snapshot=next;connected=online;
  if(changed)try{onSnapshot(next);}catch(error){report(error);}
 };
 const make=(type,fields={})=>({...fields,schemaVersion:1,type,commandId:`webgl.${Date.now()}.${++serial}.${globalThis.crypto?.randomUUID?.()??Math.random().toString(36).slice(2)}`,sessionId,contentRevision:catalog.contentRevision,expectedRevision:fields.expectedRevision??snapshot.state.revision});
 function command(type,fields={}){
  if(managed&&(snapshot?.assignment?.lifecycle.status!=='active'||['SELECT_MISSION','RETURN_MENU','RESET_PROGRESS','RESTART_MISSION'].includes(type)))return Promise.reject(Object.assign(Error('MANAGED_SESSION_FORBIDDEN'),{code:'MANAGED_SESSION_FORBIDDEN'}));
  if(closed||busy||!snapshot||profile==='server'&&!connected)return Promise.resolve(null);
  busy=true;
  pendingCommand=(async()=>{
   try{if(managed){const before=snapshot.state;if(fields.expectedRevision!==undefined&&fields.expectedRevision!==before.revision)throw Object.assign(Error('REVISION_CONFLICT'),{code:'REVISION_CONFLICT'});await port.acquireInputOwner(sessionId);accept(await port.getSnapshot(sessionId));const after=snapshot.state;if(after.revision!==before.revision+(before.ownerActive?0:1)||after.screenId!==before.screenId||after.runId!==before.runId||after.taskId!==before.taskId)throw Object.assign(Error('REVISION_CONFLICT'),{code:'REVISION_CONFLICT'});contacted=true;}const result=await port.sendCommand(make(type,{...fields,...(managed?{expectedRevision:snapshot.state.revision}:{})}));accept(result);if(!result.reply.ok)report(Object.assign(new Error(result.reply.code),{code:result.reply.code}));return closed?null:result;}
   catch(error){report(error);return null;}finally{busy=false;pendingCommand=null;}
  })();
  return pendingCommand;
 }
 async function ownership(active){
  if(managed&&(snapshot?.assignment?.lifecycle.status!=='active'||active&&!contacted))return port.getSnapshot(sessionId);
  if(profile==='local')return port.inputOwnerChanged(sessionId,{active});
  if(active){await port.acquireInputOwner(sessionId);return port.getSnapshot(sessionId);}
  await port.releaseInputOwner(sessionId);return port.getSnapshot(sessionId);
 }
 const api={
  get snapshot(){return snapshot;},get busy(){return busy;},get profile(){return profile;},get connected(){return connected;},
  start(){
   if(closed)return Promise.reject(Object.assign(new Error('SESSION_CLOSED'),{code:'SESSION_CLOSED'}));
   if(startPromise)return startPromise;
   startPromise=(async()=>{
    try{accept(await port.getSnapshot(sessionId));}catch(error){if(managed||!['SESSION_NOT_FOUND','NOT_FOUND'].includes(error.code))throw error;if(!closed)accept(await port.createSession({sessionId}));}
    if(closed)return null;
    accept({snapshot:await ownership(initialOwnerActive),connected:true});if(closed)return null;
    const stop=await port.subscribe(sessionId,event=>{try{accept(event);}catch(error){report(error);}});
    if(closed){stop();return null;}unsubscribe=stop;return snapshot;
   })().catch(error=>{startPromise=null;throw error;});
   return startPromise;
  },
  command,
  restart(){
   // Finish a previously sent answer, then restart against its confirmed revision.
   // Repeated restart clicks share one command instead of restarting twice.
   if(restartPromise)return restartPromise;
   const previous=pendingCommand;
   restartPromise=(async()=>{
    if(previous)await previous;
    if(closed||profile==='server'&&!connected)return null;
    try{accept(await port.getSnapshot(sessionId));return closed?null:command('RESTART_MISSION');}
    catch(error){report(error);return null;}
   })().finally(()=>{restartPromise=null;});
   return restartPromise;
  },
  act(screenId,actionId,expectedRevision=snapshot?.state.revision){
   if(snapshot?.state.screenId!==screenId||snapshot.state.revision!==expectedRevision||!snapshot.view.actions.some(a=>a.actionId===actionId))return Promise.resolve(null);
   return command('ACT',{taskId:snapshot.state.taskId,screenId,actionId,expectedRevision});
  },
  async contact(contactId,type,inside){
   if(closed||!snapshot||profile==='server'&&!connected||managed&&snapshot.assignment?.lifecycle.status!=='active')return null;
   if(type==='down')contacted=true;
   try{const result=await port.handleContact(sessionId,{contactId:String(contactId),sequence:++contactSerial,type,inside});accept(result);return closed?null:snapshot;}catch(error){report(error);return null;}
  },
  async owner(active){if(closed||!snapshot)return null;try{accept(await ownership(active));return closed?null:snapshot;}catch(error){report(error);return null;}},
  poll(time,{pauseResult=false}={}){
   if(profile!=='local'||closed||polling||!snapshot||time-lastPoll<100||pauseResult&&snapshot.state.status==='result')return Promise.resolve(null);
   lastPoll=time;polling=true;
   return port.pollTime(sessionId).then(value=>{accept(value);return closed?null:snapshot;},error=>{report(error);return null;}).finally(()=>{polling=false;});
  },
  async layout(positions){
   if(closed||!snapshot||profile==='server'&&!connected)return null;
   try{const result=await port.sendCommand(make('SET_LAYOUT',{layoutId:'base',expectedLayoutRevision:snapshot.layouts.layoutRevision,positions}));accept(result);if(!result.reply.ok)report(Object.assign(new Error(result.reply.code),{code:result.reply.code}));return closed?null:result;}catch(error){report(error);return null;}
  },
  async reconnect(){if(profile!=='server'||closed)return null;try{const value=await port.reconnect(sessionId);accept({snapshot:value,connected:true});return closed?null:snapshot;}catch(error){report(error);return null;}},
  async close(){
   if(closed)return;closed=true;unsubscribe?.();unsubscribe=null;
   try{if(snapshot)await ownership(false);}finally{await port.close();}
  },
 };
 return api;
}
