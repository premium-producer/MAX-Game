import {openDB} from 'idb';
import {createBrowserPersistence} from './browser-persistence.mjs';

// Native IndexedDB owns serialization, atomicity and rollback. This adapter only
// maps PersistencePort to its transactions. Legacy storage is a read-only backup.
export function createIndexedDBPersistence({key,legacyStorage,databaseName='max-game-local-v1'}){
 if(!key||!legacyStorage)throw new TypeError('Explicit profile and legacy storage required');
 const legacy=createBrowserPersistence({storage:legacyStorage,key});
 const failure=code=>Object.assign(new Error(code),{code});
 let connection,closed=false;
 const database=()=>{
  if(closed)throw failure('PERSISTENCE_CLOSED');
  if(!connection){
   connection=openDB(databaseName,1,{
    upgrade(db){db.createObjectStore('sessions');},
    blocking(){const previous=connection;connection=null;previous?.then(db=>db.close());},
    terminated(){connection=null;},
   }).catch(e=>{connection=null;throw e;});
  }
  return connection;
 };
 async function transaction(db,work){
  const tx=db.transaction('sessions','readwrite');
  // Attach a handler immediately: individual requests can reject before done.
  const completed=tx.done;completed.catch(()=>{});
  try{const result=await work(tx.store);await completed;return result;}
  catch(error){try{tx.abort();}catch{}await completed.catch(()=>{});throw error;}
 }
 async function load(id){
  const db=await database(),recordKey=[key,id];
  const saved=await db.get('sessions',recordKey);
  if(saved!==undefined)return saved;
  const previous=await legacy.load(id);
  if(previous===null)return null;
  // A second tab may already have imported and advanced this session. Never
  // overwrite that winner with the older localStorage copy.
  return transaction(db,async store=>{
   const current=await store.get(recordKey);if(current!==undefined)return current;
   await store.add(previous,recordKey);return previous;
  });
 }
 return {
  load,
  async create(id,record){
   if(await load(id)!==null)throw failure('STORE_CONFLICT');
   const db=await database();return transaction(db,async store=>{
    const recordKey=[key,id];if(await store.get(recordKey)!==undefined)throw failure('STORE_CONFLICT');
    await store.add({version:0,record},recordKey);return 0;
   });
  },
  async commit(id,version,record){
   await load(id);const db=await database();return transaction(db,async store=>{
    const recordKey=[key,id],saved=await store.get(recordKey);
    if(saved?.version!==version)throw failure('STORE_CONFLICT');
    await store.put({version:version+1,record},recordKey);return version+1;
   });
  },
  async close(){closed=true;const previous=connection;connection=null;if(previous)(await previous).close();},
 };
}
