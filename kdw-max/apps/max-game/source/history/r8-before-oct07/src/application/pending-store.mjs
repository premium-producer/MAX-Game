import {openDB} from './vendor/idb.mjs';
export const stableJSON=value=>JSON.stringify(value,(_key,next)=>next&&typeof next==='object'&&!Array.isArray(next)?Object.fromEntries(Object.keys(next).sort().map(key=>[key,next[key]])):next);
const fail=code=>Object.assign(Error(code),{code});
const token=v=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(v);
export function businessScope(context){
 const {apiOrigin,datasetIdentity,assignmentId,sessionId,contentRevision}=context??{};
 if(typeof apiOrigin!=='string'||new URL(apiOrigin).origin!==apiOrigin||![datasetIdentity?.instanceKey,assignmentId,sessionId,contentRevision].every(token))throw fail('DURABLE_CONTEXT_REQUIRED');
 return {apiOrigin,instanceKey:datasetIdentity.instanceKey,assignmentId,sessionId,contentRevision};
}
const key=s=>[s.apiOrigin,s.instanceKey,s.assignmentId,s.sessionId,s.contentRevision];
/** idb/native IndexedDB implements transactions and serialization; no network inside a transaction. */
export function createPendingStore({databaseName='max-managed-pending-v1'}={}){
 let connection,closed=false;
 const database=()=>{
  if(closed)throw fail('PENDING_STORE_CLOSED');
  return connection??=openDB(databaseName,1,{upgrade(db){db.createObjectStore('intents');},blocking(){connection?.then(db=>db.close());connection=null;},terminated(){connection=null;}}).catch(error=>{connection=null;throw error;});
 };
 async function write(work){const db=await database(),tx=db.transaction('intents','readwrite',{durability:'strict'});tx.done.catch(()=>{});try{const value=await work(tx.store);await tx.done;return value;}catch(error){try{tx.abort();}catch{}await tx.done.catch(()=>{});throw error;}}
 return {
  async list(){return (await database()).getAll('intents');},
  async load(scope){return (await database()).get('intents',key(scope));},
  put(scope,command){return write(async store=>{
   if(command.sessionId!==scope.sessionId||command.contentRevision!==scope.contentRevision||!token(command.commandId))throw fail('DURABLE_COMMAND_SCOPE_CONFLICT');
   const current=await store.get(key(scope));
   if(current?.status==='pending'){if(stableJSON(current.command)!==stableJSON(command))throw fail('PENDING_COMMAND');return current;}
   const record={schemaVersion:1,scope,command:structuredClone(command),status:'pending'};await store.put(record,key(scope));return record;
  });},
  settle(scope,command,receipt){return write(async store=>{
   const current=await store.get(key(scope));if(!current||stableJSON(current.command)!==stableJSON(command)||stableJSON(receipt.command)!==stableJSON(command))throw fail('DURABLE_RECEIPT_CONFLICT');
   const record={...current,status:'committed',receipt:structuredClone(receipt)};await store.put(record,key(scope));return record;
  });},
  async close(){closed=true;if(connection)(await connection).close();connection=null;},
 };
}
