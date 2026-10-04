// Site owns presentation only. Persistence is an explicitly selected local profile.
export const SITE_SHARED_KEY='max-site-shared:v1';
export function createSiteSession({port,catalog,sessionId,profile='local',onSnapshot=()=>{},onError=()=>{}}){
 let snapshot=null,unsubscribe=null,busy=false,polling=false,closed=false,serial=0,contactSerial=0,lastPoll=0;
 const accept=value=>{if(closed||!value)return;const changed=!snapshot||value.state.revision!==snapshot.state.revision||value.layouts.layoutRevision!==snapshot.layouts.layoutRevision;snapshot=value;if(changed)onSnapshot(value);};
 const make=(type,fields={})=>({schemaVersion:1,type,commandId:`site.${Date.now()}.${++serial}.${globalThis.crypto?.randomUUID?.()??Math.random().toString(36).slice(2)}`,sessionId,contentRevision:catalog.contentRevision,expectedRevision:snapshot.state.revision,...fields});
 async function command(type,fields={}){if(closed||busy||!snapshot)return null;busy=true;try{const result=await port.sendCommand(make(type,fields));accept(result.snapshot);if(!result.reply.ok)onError(Object.assign(new Error(result.reply.code),{code:result.reply.code}));return result;}catch(error){onError(error);return null;}finally{busy=false;}}
 return {
  get snapshot(){return snapshot;},get busy(){return busy;},get profile(){return profile;},
  async start(){try{accept(await port.getSnapshot(sessionId));}catch(error){if(error.code!=='SESSION_NOT_FOUND'&&error.code!=='NOT_FOUND')throw error;accept(await port.createSession({sessionId}));}if(profile==='local')accept(await port.inputOwnerChanged(sessionId,{active:true}));else{await port.acquireInputOwner(sessionId);accept(await port.getSnapshot(sessionId));}unsubscribe=await port.subscribe(sessionId,event=>accept(event.snapshot));return snapshot;},
  command,
  async act(screenId,actionId,expectedRevision=snapshot?.state.revision){if(snapshot?.state.screenId!==screenId||snapshot.state.revision!==expectedRevision||!snapshot.view.actions.some(a=>a.actionId===actionId))return null;return command('ACT',{taskId:snapshot.state.taskId,screenId,actionId,expectedRevision});},
  async contact(contactId,type,inside){if(closed||!snapshot)return;try{accept(await port.handleContact(sessionId,{contactId:String(contactId),sequence:++contactSerial,type,inside}));}catch(error){onError(error);}},
  async owner(active){if(closed)return;try{if(profile==='local')accept(await port.inputOwnerChanged(sessionId,{active}));else if(active){await port.acquireInputOwner(sessionId);accept(await port.getSnapshot(sessionId));}else await port.releaseInputOwner(sessionId);}catch(error){onError(error);}},
  poll(time,{pauseResult=false}={}){if(profile!=='local'||closed||polling||!snapshot||time-lastPoll<100||pauseResult&&snapshot.state.status==='result')return;lastPoll=time;polling=true;return port.pollTime(sessionId).then(value=>accept(value.snapshot),onError).finally(()=>{polling=false;});},
  async layout(positions){if(closed||!snapshot)return;try{const result=await port.sendCommand(make('SET_LAYOUT',{layoutId:'base',expectedLayoutRevision:snapshot.layouts.layoutRevision,positions}));accept(result.snapshot);if(!result.reply.ok)onError(new Error(result.reply.code));}catch(error){onError(error);}},
  async reconnect(){if(profile!=='server')return;accept(await port.reconnect(sessionId));},
  async close(){if(closed)return;await this.owner(false);closed=true;unsubscribe?.();await port.close();},
 };
}
