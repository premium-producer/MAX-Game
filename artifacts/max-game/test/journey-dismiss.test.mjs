import test from 'node:test';
import assert from 'node:assert/strict';
import {installTaskDismiss} from '../src/journey-dismiss.mjs';

function fixture(){
 const handlers={},popup={},calls=[];
 const item={popup,panels:[{contains:t=>['card','phone','answer','close'].includes(t)}]};
 let active=true;
 installTaskDismiss({root:{addEventListener:(type,fn)=>handlers[type]=fn},getOpen:()=>active?[item]:[],close:i=>{calls.push(i);active=false;}});
 const event=(target,x=10,y=10)=>({target,pointerId:1,button:0,detail:1,clientX:x,clientY:y,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
 return {handlers,calls,event};
}

test('outside viewport space, panel gaps and underlying buttons close and consume the whole tap',()=>{
 for(const target of ['body','canvas','popup-gap','underlying-button']){
  const {handlers:h,calls,event:e}=fixture();h.pointerdown(e(target));const up=e(target);h.pointerup(up);
  assert.equal(calls.length,1);assert.ok(up.prevented&&up.stopped);
  const click=e(target);h.click(click);assert.ok(click.prevented&&click.stopped,'no click-through after dismissal');
 }
});

test('instruction, phone, answer and close controls keep their existing activation',()=>{
 for(const target of ['card','phone','answer','close']){
  const {handlers:h,calls,event:e}=fixture();h.pointerdown(e(target));const up=e(target);h.pointerup(up);const click=e(target);h.click(click);
  assert.equal(calls.length,0);assert.ok(!up.prevented&&!click.prevented);
 }
});

test('drags, cancelled pointers and gestures starting inside do not become outside taps',()=>{
 const {handlers:h,calls,event:e}=fixture();
 h.pointerdown(e('body'));h.pointerup(e('body',100,100));
 h.pointerdown(e('body'));h.pointercancel(e('body'));h.pointerup(e('body'));
 h.pointerdown(e('phone'));h.pointerup(e('body'));
 assert.equal(calls.length,0);
});
