import test from 'node:test';
import assert from 'node:assert/strict';
import {installJourneyDrag,dragPosition} from '../src/journey-drag.mjs';

test('pointer displacement stays linear near the boundary, with no repulsion or return',()=>{
 assert.deepEqual(dragPosition({x:.02,y:.97},10,-10,1000,1000),{x:.03,y:.96});
 assert.deepEqual(dragPosition({x:.99,y:.01},20,-20,1000,1000),{x:1,y:0});
 assert.deepEqual(dragPosition({x:1,y:0},-20,20,1000,1000),{x:.98,y:.02});
});

function fixture(){
 const handlers={},commits=[],previews=[];const root={addEventListener:(k,fn)=>handlers[k]=fn};
 const el=zone=>{const values={'--x':'.3','--y':'.4'},captured=new Set();return {dataset:{object:'call'},style:{setProperty:(k,v)=>values[k]=v,getPropertyValue:k=>values[k]},closest:selector=>selector==='[data-zone]'?{dataset:{zone}}:null,getBoundingClientRect:()=>({width:100,height:100}),parentElement:{getBoundingClientRect:()=>({width:600,height:400})},setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};};
 const a=el(0),b=el(1),api=installJourneyDrag({root,enabled:()=>true,onCommit:(...v)=>commits.push(v),onPreview:()=>previews.push(true)});
 const event=(target,id,x,y)=>({pointerId:id,button:0,clientX:x,clientY:y,detail:1,target:{closest:()=>target},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
 return {handlers,commits,previews,a,b,api,event};
}
test('tap does not move; drag commits once and suppresses the following activation',()=>{
 const {handlers:h,commits,a,event:e}=fixture();h.pointerdown(e(a,1,10,20));h.pointerup(e(a,1,12,21));assert.equal(commits.length,0);
 h.pointerdown(e(a,2,10,20));h.pointermove(e(a,2,110,80));h.pointerup(e(a,2,110,80));assert.equal(commits.length,1);assert.equal(commits[0][2].x,.5);
 const click=e(a,2,110,80);h.click(click);assert.ok(click.stopped);
});
test('cancel restores preview and never commits, even on a subsequent pointerup',()=>{
 const {handlers:h,commits,a,event:e}=fixture();h.pointerdown(e(a,1,0,0));h.pointermove(e(a,1,150,60));h.pointercancel(e(a,1,150,60));h.pointerup(e(a,1,150,60));assert.equal(commits.length,0);assert.equal(a.style.getPropertyValue('--x'),.3);assert.equal(a.dataset.dragging,undefined);
});
test('two zones own independent pointer gestures; external cancellation cancels both',()=>{
 const {handlers:h,commits,a,b,event:e,api}=fixture();h.pointerdown(e(a,1,0,0));h.pointerdown(e(b,2,0,0));h.pointermove(e(a,1,50,30));h.pointermove(e(b,2,-50,-30));h.pointerup(e(a,1,50,30));assert.equal(commits.length,1);assert.equal(commits[0][0],0);api.cancel();assert.equal(commits.length,1);assert.equal(b.style.getPropertyValue('--x'),.3);
});
