// Read-only CPU reproduction of the current optical handoff contract.
// No browser, GPU, application state, or source files are changed.
import assert from 'node:assert/strict';
import {MotionRegistry} from '../../max-game/src/journey-motion.mjs';
import {glassControlPresence} from '../../service/public/max-panel-optics.js';

const zone={dataset:{},querySelector:()=>null};
const button={dataset:{},parentElement:zone};
const tile={dataset:{},parentElement:button};
for(const el of [zone,button,tile])el.closest=selector=>selector==='.journey-zone'?zone:null;
const doc={defaultView:{getComputedStyle:()=>({display:'block',visibility:'visible',opacity:'1'})}};
const registry=new MotionRegistry();
const initial={x:100,y:100,size:88,radius:44,menu:true,next:true};
const motion=registry.get(zone,'route-add:next',initial);
motion.adopt();
// A plus disabled behind the picker has already faded to zero.
motion.alpha.value=0;button.dataset.uiFade='0';
const before=glassControlPresence(tile,doc);
// render() replaces the button: the markup has no transform or data-ui-fade.
delete button.dataset.uiFade;
const betweenCommitAndPrepare=glassControlPresence(tile,doc);
const sameMotion=registry.get(zone,'route-add:next',initial)===motion;
// prepare() keeps the existing hidden motion while it travels to the next slot.
motion.step(1/60,{x:500,y:300,size:108,radius:54,present:true,planning:true,time:1});
button.dataset.uiFade=String(motion.alpha.value);
const afterPrepare=glassControlPresence(tile,doc);
assert.equal(before,0);
assert.equal(betweenCommitAndPrepare,1);
assert.equal(afterPrepare,0);
assert.equal(sameMotion,true);
delete button.dataset.uiFade;
const newPlusBeforePrepare=glassControlPresence(tile,doc);
const newPlus=registry.get(zone,'route-add:blog-1',{x:468,y:300,size:86.4,radius:43.2,menu:true,next:true});
newPlus.adopt();newPlus.step(1/60,{x:500,y:300,size:108,radius:54,present:true,planning:true,time:1});
button.dataset.uiFade=String(newPlus.alpha.value);
const newPlusAfterPrepare=glassControlPresence(tile,doc);
assert.equal(newPlusBeforePrepare,1);assert.equal(newPlusAfterPrepare,0);
console.log(JSON.stringify({case:'recreated hidden next-plus',before,betweenCommitAndPrepare,afterPrepare,sameMotion,
  newSlot:{newPlusBeforePrepare,newPlusAfterPrepare},
  interpretation:'Optical presence flashes 0 -> 1 -> 0 despite continuous hidden MotionRegistry state. CPU contract reproduction, not a captured GPU frame or measured flash duration.'},null,2));
