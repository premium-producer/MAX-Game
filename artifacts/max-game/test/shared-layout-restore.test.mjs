import test from 'node:test';
import assert from 'node:assert/strict';
import {MISSION_CATALOG} from '../src/content/mission-catalog.mjs';
import {createMissionSessionApplication} from '../src/application/mission-session.mjs';
import {createBrowserPersistence} from '../src/application/browser-persistence.mjs';

test('Cold restore accepts committed WebGL layout and retains public-link state and Site positions',async()=>{
 let time=1000,serial=0;const data=new Map();
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const create=()=>createMissionSessionApplication({catalog:MISSION_CATALOG,now:()=>time,persistence:createBrowserPersistence({storage,key:'shared-preview'})});
 let app=create();await app.createSession({sessionId:'site-shared'});await app.inputOwnerChanged('site-shared',{active:true});
 const command=async(type,fields={})=>{const snapshot=await app.getSnapshot('site-shared');const result=await app.sendCommand({schemaVersion:1,type,commandId:`restore.${++serial}`,sessionId:'site-shared',contentRevision:MISSION_CATALOG.contentRevision,expectedRevision:snapshot.state.revision,...fields});assert.equal(result.reply.ok,true,result.reply.code);return result.snapshot;};
 await command('SELECT_MISSION',{missionId:'blogger'});await app.handleContact('site-shared',{contactId:'p1',sequence:1,type:'down',inside:true});time+=800;await app.handleContact('site-shared',{contactId:'p1',sequence:2,type:'up',inside:true});
 let snapshot=await app.getSnapshot('site-shared');
 for(let i=0;snapshot.state.screenId!=='blogger.channel.public-link'&&i<15;i++){
  const action=snapshot.view.actions.find(a=>a.actionId==='channel.choose-public')??snapshot.view.actions.find(a=>a.actionId==='channel.use-new-link')??snapshot.view.actions[0];
  snapshot=await command('ACT',{taskId:snapshot.state.taskId,screenId:snapshot.state.screenId,actionId:action.actionId});
 }
 assert.equal(snapshot.state.screenId,'blogger.channel.public-link');
 const positions={'blogger.channel':{x:2800,y:815},'renderer:webgl:blogger:blogger.channel':{x:600,y:40}};
 await command('SET_LAYOUT',{layoutId:'base',expectedLayoutRevision:0,positions});
 const before=await app.inputOwnerChanged('site-shared',{active:false}),bytes=data.get('shared-preview');await app.close();
 app=create();const restored=await app.getSnapshot('site-shared');assert.deepEqual(restored,before);assert.deepEqual(restored.layouts.positions,positions);assert.equal(data.get('shared-preview'),bytes);await app.close();
});
