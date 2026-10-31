import test from 'node:test';import assert from 'node:assert/strict';
import {installNativeTouch} from '../src/kdw-native-touch.mjs';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('game contact releases outside its root, ignores other pointers and rearms after cancellation',()=>{
 const source=readFileSync(new URL('../src/journey-guided-main.js',import.meta.url),'utf8');
 const begin=source.indexOf('function finishPointerContact(e){'),end=source.indexOf("root.addEventListener('pointercancel',cancelGesture);",begin);
 assert.ok(begin>=0&&end>begin);
 const listeners={root:{},window:{}},released=[];
 const context={tapHand:{id:7},controller:{contact:7,up(id){released.push(id);this.contact=null;}},root:{addEventListener:(type,fn)=>listeners.root[type]=fn},window:{addEventListener:(type,fn)=>listeners.window[type]=fn}};
 context.cancelGesture=()=>{context.tapHand=null;context.controller.contact=null;};
 runInNewContext(source.slice(begin,end),context);
 listeners.window.pointerup({pointerId:8});assert.equal(context.tapHand.id,7);
 listeners.window.pointerup({pointerId:7});assert.equal(context.tapHand,null);assert.deepEqual(released,[7]);
 listeners.root.pointerup({pointerId:7});assert.deepEqual(released,[7]);
 context.tapHand={id:9};context.controller.contact=null; // Palm already retired during startup.
 listeners.window.pointerup({pointerId:9});assert.equal(context.tapHand,null);
 context.tapHand={id:10};listeners.window.pointercancel({pointerId:9});assert.equal(context.tapHand.id,10);
 listeners.window.pointercancel({pointerId:10});assert.equal(context.tapHand,null);
 context.tapHand={id:11};listeners.window.pointerup({pointerId:11});assert.equal(context.tapHand,null);
});
function fixture(){const handlers={},clicks=[];let current,enabled=true;const document={addEventListener:(k,fn)=>handlers[k]=fn,removeEventListener:k=>delete handlers[k],elementFromPoint:()=>current};const stop=installNativeTouch({document,active:()=>enabled,now:()=>100});const button=(id,left=100)=>({disabled:false,inert:false,closest(selector){return selector==='button,input,textarea'?this:selector==='[hidden],[inert]'?(this.inert?this:null):document;},getBoundingClientRect:()=>({left,right:left+100,top:100,bottom:200}),click(){clicks.push(id);}});const send=(type,props={})=>{const e={isTrusted:true,pointerType:'touch',pointerId:7,clientX:150,clientY:150,buttons:1,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...props};handlers[type](e);return e;};return{clicks,button,send,stop,get current(){return current;},set current(v){current=v;},set active(v){enabled=v;}};}
test('native touch activates on down, permits another target after leaving, and suppresses release click',()=>{const f=fixture();try{f.current=f.button('first');f.send('pointerdown');assert.deepEqual(f.clicks,['first']);f.current=f.button('replacement');f.send('pointermove');assert.deepEqual(f.clicks,['first']);f.current=f.button('second',300);f.send('pointermove',{clientX:350});assert.deepEqual(f.clicks,['first','second']);f.send('pointerup',{clientX:350,buttons:0});assert.equal(f.send('click').stopped,true);assert.equal(f.send('click',{pointerType:'mouse'}).stopped,undefined);assert.equal(f.send('click',{isTrusted:false}).stopped,undefined);}finally{f.stop();}});
test('native touch respects disabled, inert, inactive and synthetic pointer guards',()=>{const f=fixture();try{f.current=f.button('blocked');f.active=false;f.send('pointerdown');f.active=true;f.current.disabled=true;f.send('pointerdown');f.current.disabled=false;f.current.inert=true;f.send('pointerdown');f.current.inert=false;f.send('pointerdown',{isTrusted:false});assert.deepEqual(f.clicks,[]);f.send('pointerdown');assert.deepEqual(f.clicks,['blocked']);}finally{f.stop();}});

test('touching a native input focuses it before invoking the keyboard handler',()=>{const f=fixture(),events=[];try{const input=f.button('input');input.tagName='INPUT';input.focus=()=>events.push('focus');const click=input.click;input.click=()=>{events.push('click');click();};f.current=input;f.send('pointerdown');assert.deepEqual(events,['focus','click']);assert.deepEqual(f.clicks,['input']);f.send('pointerup');assert.equal(f.send('click').stopped,true);}finally{f.stop();}});


test('one navigation contact cannot reactivate the same button after jitter or a busy toggle',()=>{const f=fixture();try{const b=f.button('next');b.dataset={};b.classList={contains:v=>v==='kdw-transition-button'};f.current=b;f.send('pointerdown');assert.equal(b.dataset.transitionContact,'true');b.disabled=true;f.send('pointermove',{clientX:250});b.disabled=false;f.send('pointermove');assert.deepEqual(f.clicks,['next']);f.send('pointerup');assert.equal(b.dataset.transitionContact,undefined);f.send('pointerdown');assert.deepEqual(f.clicks,['next','next']);}finally{f.stop();}});

test('overlapping hit zones allow another live button but never auto-advance a replacement screen',()=>{const f=fixture();try{const a=f.button('a'),b=f.button('b',170);a.isConnected=true;b.isConnected=true;f.current=a;f.send('pointerdown');f.current=b;f.send('pointermove',{clientX:185});assert.deepEqual(f.clicks,['a','b']);b.isConnected=false;f.current=f.button('next-screen',170);f.send('pointermove',{clientX:185});assert.deepEqual(f.clicks,['a','b']);}finally{f.stop();}});
