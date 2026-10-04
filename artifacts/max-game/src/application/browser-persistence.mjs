// Explicit local preview profile; this is a PersistencePort, not renderer state.
const clone=value=>structuredClone(value);
export function createBrowserPersistence({storage,key}){
 if(!storage||!key)throw new TypeError('Explicit local storage required');
 const failure=code=>Object.assign(new Error(code),{code});
 const plain=value=>value!==null&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype;
 const load=()=>{const raw=storage.getItem(key);if(raw===null)return {};const records=JSON.parse(raw);
  if(!plain(records)||Object.values(records).some(entry=>!plain(entry)||Object.keys(entry).sort().join(',')!=='record,version'||!Number.isSafeInteger(entry.version)||entry.version<0||!plain(entry.record)))throw failure('INVALID_SAVED_SESSION');
  return records;
 };
 return {
  async load(id){const records=load();return Object.hasOwn(records,id)?clone(records[id]):null;},
  async create(id,record){const records=load();if(Object.hasOwn(records,id))throw failure('STORE_CONFLICT');records[id]={version:0,record:clone(record)};storage.setItem(key,JSON.stringify(records));return 0;},
  async commit(id,version,record){const records=load();if(records[id]?.version!==version)throw failure('STORE_CONFLICT');records[id]={version:version+1,record:clone(record)};storage.setItem(key,JSON.stringify(records));return version+1;},
 };
}
