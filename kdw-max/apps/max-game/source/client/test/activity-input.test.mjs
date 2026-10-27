import test from 'node:test';
import assert from 'node:assert/strict';
import {installActivityInput} from '../src/activity-webgl/activity-input.mjs';
import {reportActivityContact} from '../src/activity-webgl/activity-runtime.mjs';
import {startProduction} from '../src/kdw-production.mjs';
test('GPU contact entry deduplicates selection, obeys modal controls and rejects old generations',()=>{
 const handlers=new Map(),windowHandlers=new Map(),oldDoc=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={addEventListener:(n,f)=>handlers.set(n,f),removeEventListener:n=>handlers.delete(n)};
 globalThis.window={addEventListener:(n,f)=>windowHandlers.set(n,f),removeEventListener:n=>windowHandlers.delete(n)};
 let frame={key:'run1',interactive:true,hits:[{id:'card',x:100,y:100,w:50,h:50,interactive:true,action:'card'}],scrollClip:{x:200,y:100,w:100,h:200}},selected=[],scroll=0;
 const cleanup=installActivityInput({getFrame:()=>frame,select:id=>selected.push(id),scroll:d=>scroll+=d,react:()=>assert.fail('Unexpected reaction')});
 const event=(x,y,blocked=false)=>({pointerId:7,clientX:x,clientY:y,target:{closest:()=>blocked?{}:null},preventDefault(){},stopImmediatePropagation(){}});
 try{
  handlers.get('pointerdown')(event(90,110));handlers.get('pointermove')(event(110,110));handlers.get('pointermove')(event(120,120));assert.deepEqual(selected,['card']);
  frame={...frame,key:'run2',hits:[{...frame.hits[0],id:'new'}]};handlers.get('pointermove')(event(110,110));assert.equal(selected.length,1);
  handlers.get('pointerup')(event(110,110));handlers.get('pointerdown')(event(110,110,true));assert.equal(selected.length,1);
  handlers.get('pointerdown')(event(110,110));assert.deepEqual(selected,['card','new']);
  handlers.get('pointerup')(event(110,110));handlers.get('pointerdown')(event(220,150));handlers.get('pointermove')(event(220,130));assert.equal(scroll,20);
  windowHandlers.get('blur')();handlers.get('pointermove')(event(110,110));assert.equal(selected.length,2);
 }finally{cleanup();globalThis.document=oldDoc;globalThis.window=oldWindow;}
 assert.equal(handlers.size,0);assert.equal(windowHandlers.size,0);
});
test('Consumed GPU contact preserves production inactivity tracking and trust checks',async()=>{
 const saved={document:globalThis.document,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};
 globalThis.document={addEventListener(){},removeEventListener(){}};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 const commands=[],session={snapshot:{state:{status:'task',standPolicy:{},standReady:true}},command:async type=>commands.push(type)};
 const stop=startProduction({getSession:()=>session,ready:()=>false});
 try{reportActivityContact({isTrusted:false});assert.equal(commands.length,0);reportActivityContact({isTrusted:true});assert.deepEqual(commands,['STAND_TOUCH']);reportActivityContact({isTrusted:true});assert.equal(commands.length,1);}
 finally{stop();Object.assign(globalThis,saved);}
});
