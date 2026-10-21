import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VISITOR_CAPTURE,visitorCrop,validVisitorPhoto,composeVisitorScreen} from '../src/kdw-conversation-photo.mjs';
import {applyConversationScreens,CONVERSATION_SCREENS} from '../src/kdw-conversation-model.mjs';
const base=()=>JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url)));
test('one circular capture region is reused by round messages and avatars; call crop remains inside the full portrait',()=>{
 assert.deepEqual(visitorCrop('circle'),{x:40,y:460,width:1000,height:1000});
 const r=visitorCrop('call');assert.equal(r.width/r.height,132/200);assert.equal(r.x,0);assert.ok(r.y>=0&&r.y+r.height<=1920);
 assert.throws(()=>visitorCrop('circle',{...VISITOR_CAPTURE,guide:{cx:100,cy:840,radius:432}}));
});
test('photo replacement accepts data only and preserves the rest of the screen template',()=>{
 const template='<svg><svg data-visitor-viewport="circle" viewBox="0 0 1 1"><image data-visitor-photo="true" href="old"/></svg><path id="controls"/></svg>';
 const photo={...VISITOR_CAPTURE,dataUri:'data:image/jpeg;base64,YWJj'};
 assert.ok(validVisitorPhoto(photo));const next=composeVisitorScreen(template,photo);
 assert.ok(next.includes('viewBox="40 460 1000 1000"'));assert.ok(next.includes('<path id="controls"/>'));
 for(const dataUri of ['https://other.example/photo.jpg','data:image/svg+xml;base64,YWJj','data:image/jpeg;base64,YWJj" onload="x'])assert.throws(()=>composeVisitorScreen(template,{...photo,dataUri}));
 assert.throws(()=>composeVisitorScreen('<svg/>',photo));
});
test('seven photo screens keep action identity, outcomes, instructions and normalized hotspots',()=>{
 const original=base(),before=structuredClone(original),next=applyConversationScreens(structuredClone(original));assert.deepEqual(original,before);
 assert.equal(Object.keys(CONVERSATION_SCREENS).length,7);
 for(const [taskId,task] of Object.entries(original.tasks))for(const [id,s] of Object.entries(task.screens)){
  const n=next.tasks[taskId].screens[id];if(!CONVERSATION_SCREENS[id]){assert.deepEqual(n,s);continue;}
  assert.equal(n.instruction,s.instruction);assert.equal(n.actions.length,s.actions.length);
  s.actions.forEach((a,i)=>{const b=n.actions[i];assert.equal(a.actionId,b.actionId);assert.deepEqual(a.outcome,b.outcome);assert.equal(a.placement,b.placement);if(a.rect){const old=original.assets[s.assetId],asset=next.assets[n.assetId];a.rect.forEach((v,j)=>assert.ok(Math.abs(v/(j%2?old.height:old.width)-b.rect[j]/(j%2?asset.height:asset.width))<1e-12));}});
 }
});
