import test from 'node:test';
import assert from 'node:assert/strict';
import {startupErrorText} from '../src/startup-error.mjs';
import {createBrowserPersistence} from '../src/application/browser-persistence.mjs';
import {createV5MissionSessionApplication} from '../src/journey-v5-backend.mjs';

test('quota on real session ownership commit remains distinguishable and preserves prior save',async()=>{
 const data=new Map();let full=false;
 const store={getItem:k=>data.get(k)??null,setItem(k,v){if(full)throw new DOMException('test quota','QuotaExceededError');data.set(k,v);}};
 const app=createV5MissionSessionApplication({now:()=>1000,persistence:createBrowserPersistence({storage:store,key:'test'})});
 await app.createSession({sessionId:'diagnostic'});const before=data.get('test');full=true;
 await assert.rejects(app.inputOwnerChanged('diagnostic',{active:true}),e=>{
  assert.equal(e.code,'STORAGE_UNAVAILABLE');assert.equal(e.cause.name,'QuotaExceededError');
  assert.match(startupErrorText(e),/STORAGE_UNAVAILABLE → QuotaExceededError/);assert.match(startupErrorText(e),/переполнении/);return true;
 });
 assert.equal(data.get('test'),before);await app.close();
});
test('denied access and malformed saves are not labelled as quota; payloads stay private',()=>{
 assert.match(startupErrorText(new DOMException('private payload','SecurityError')),/запретил/);
 assert.match(startupErrorText(new SyntaxError('private payload')),/формат/);
 const e=new Error('private payload');e.cause=e;assert.doesNotMatch(startupErrorText(e),/private payload/);
});
