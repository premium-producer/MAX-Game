import test from 'node:test';
import assert from 'node:assert/strict';
import {popupBounds,anchoredTaskBounds,instructionLayout} from '../src/journey-popup.mjs';
import {JourneyTransition} from '../src/journey-transition.mjs';
import {glassControlPresence} from '../../service/public/max-panel-optics.js';

test('context popup fits both physical reachable zones and standalone at every edge',()=>{
 for(const [w,h]of [[816,405],[1712,405],[1520,780],[820,880]])for(const compact of [false,true]){
  for(const x of [0,w*.1,w*.5,w*.9,w])for(const y of [0,h*.5,h]){
   const p=popupBounds({x,y},w,h,{compact});
   assert.ok(p.x>=8&&p.y>=8&&p.x+p.w<=w-8+.001&&p.y+p.h<=h-8+.001);
   assert.ok(p.w<w*.8);if(!compact)assert.ok(p.w-p.h*.49>=250);
  }
 }
});
test('popup chooses the available side of its icon instead of centering on wall',()=>{
 const left=popupBounds({x:180,y:200},1712,405),right=popupBounds({x:1510,y:200},1712,405);
 assert.equal(left.x,204);assert.ok(right.x+right.w<1510);
});
test('task tile stays exactly on its field anchor with phone mirrored at the right edge',()=>{
 for(const [w,h,tile]of [[816,405,76],[1712,405,76],[1520,780,108],[820,880,108]]){
  for(const x of [76,w/2,w-76])for(const y of [144,h/2,h-100]){
   const p=anchoredTaskBounds({x,y,radius:tile/2},w,h);
   assert.equal(p.x+p.iconX,x);assert.equal(p.y+p.iconY,y);assert.equal(p.tile,tile);
   assert.ok(p.x>=8&&p.y>=8&&p.x+p.w<=w-8+.001&&p.y+p.h<=h-8+.001);
   assert.ok(p.iconX-tile/2>=p.instructionX-1&&p.iconX+tile/2<=p.instructionX+p.copy+1);
   assert.ok(p.instructionTop<=p.iconY-tile/2&&p.instructionBottom>=p.iconY+tile/2);
  }
  assert.equal(anchoredTaskBounds({x:w-76,y:h/2,radius:tile/2},w,h).mirrored,true);
 }
});
test('closing a context popup ends immediately after exit without a blank entrance',()=>{
 const m=new JourneyTransition();let committed=false;
 m.start(()=>{assert.equal(m.value,0);committed=true;},{exitOnly:true});
 for(let i=0;i<4;i++)m.tick(.04);
 assert.equal(committed,true);assert.equal(m.busy,false);assert.equal(m.value,1);
});
test('popup opacity affects only popup glass, never the surrounding field',()=>{
 const zone={dataset:{uiPresence:'1',popupPresence:'.2'}};
 const doc={defaultView:{getComputedStyle:()=>({opacity:'1'})}};
 const field={closest:s=>s==='.journey-zone'?zone:null};
 const popup={closest:s=>s==='.journey-zone'?zone:s==='.context-popup,.picker'?{}:null};
 assert.equal(glassControlPresence(field,doc),1);assert.equal(glassControlPresence(popup,doc),.2);
});

test('instruction hugs measured copy and retains its icon while the phone stays independent',()=>{
 const b=anchoredTaskBounds({x:750,y:580,radius:54},1520,780);
 const short=instructionLayout(b,60),long=instructionLayout(b,180);
 assert.equal(long.height-short.height,120);
 assert.equal(short.top+short.iconTop+b.tile/2,b.iconY);
 assert.equal(long.top+long.iconTop+b.tile/2,b.iconY);
 assert.equal(short.iconTop-18-60,18);
 assert.ok(short.height<b.h);
 const high=anchoredTaskBounds({x:180,y:144,radius:38},816,405);
 const down=instructionLayout(high,130);
 assert.equal(down.above,false);assert.ok(down.top>=0&&down.top+down.height<=high.h);
});
