import test from 'node:test';
import assert from 'node:assert/strict';
import {installActivityInput} from '../src/activity-webgl/activity-input.mjs';
import {reportActivityContact} from '../src/activity-webgl/activity-runtime.mjs';
import {startProduction} from '../src/kdw-production.mjs';
test('GPU contact entry deduplicates selection, obeys modal controls and accepts held contact in a new generation',()=>{
 const handlers=new Map(),windowHandlers=new Map(),oldDoc=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={addEventListener:(n,f)=>handlers.set(n,f),removeEventListener:n=>handlers.delete(n)};
 globalThis.window={addEventListener:(n,f)=>windowHandlers.set(n,f),removeEventListener:n=>windowHandlers.delete(n)};
 let frame={key:'run1',interactive:true,hits:[{id:'card',x:100,y:100,w:50,h:50,interactive:true,action:'card'}],scrollClip:{x:200,y:100,w:100,h:200}},selected=[],scroll=0;
 const cleanup=installActivityInput({getFrame:()=>frame,select:id=>selected.push(id),scroll:d=>scroll+=d,react:()=>assert.fail('Unexpected reaction')});
 const event=(x,y,blocked=false,buttons=1)=>({pointerId:7,clientX:x,clientY:y,buttons,target:{closest:()=>blocked?{}:null},preventDefault(){},stopImmediatePropagation(){}});
 try{
  handlers.get('pointerdown')(event(90,110));handlers.get('pointermove')(event(110,110));handlers.get('pointermove')(event(120,120));assert.deepEqual(selected,['card']);
  frame={...frame,key:'run2',hits:[{...frame.hits[0],id:'new'}]};handlers.get('pointermove')(event(110,110,false,0));assert.equal(selected.length,1);
  handlers.get('pointermove')(event(110,110));assert.deepEqual(selected,['card','new']);
  handlers.get('pointerup')(event(110,110));handlers.get('pointerdown')(event(110,110,true));assert.equal(selected.length,2);
  handlers.get('pointerdown')(event(110,110));assert.deepEqual(selected,['card','new','new']);
  handlers.get('pointerup')(event(110,110));handlers.get('pointerdown')(event(220,150));handlers.get('pointermove')(event(220,130));assert.equal(scroll,20);
  windowHandlers.get('blur')();handlers.get('pointermove')(event(110,110,false,0));assert.equal(selected.length,3);
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

test('a product rejected while another choice is pending can be retried by the same hand',()=>{
 const handlers=new Map(),oldDoc=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={addEventListener:(n,f)=>handlers.set(n,f),removeEventListener:n=>handlers.delete(n)};
 globalThis.window={addEventListener(){},removeEventListener(){}};
 const frame={key:'store-run',interactive:true,hits:[{id:'first',x:100,y:100,w:50,h:50,interactive:true,action:'card'},{id:'second',x:200,y:100,w:50,h:50,interactive:true,action:'card'}]};
 let pending=false;const accepted=[];
 const cleanup=installActivityInput({getFrame:()=>frame,select:id=>{if(pending)return false;pending=true;accepted.push(id);return true;},scroll(){},react(){}});
 const e=x=>({pointerId:7,clientX:x,clientY:110,buttons:1,target:{closest:()=>null},preventDefault(){},stopImmediatePropagation(){}});
 try{
  handlers.get('pointerdown')(e(110));handlers.get('pointermove')(e(210));assert.deepEqual(accepted,['first']);
  pending=false;handlers.get('pointermove')(e(211));assert.deepEqual(accepted,['first','second']);
  pending=false;handlers.get('pointermove')(e(212));assert.deepEqual(accepted,['first','second']);
 }finally{cleanup();globalThis.document=oldDoc;globalThis.window=oldWindow;}
});
