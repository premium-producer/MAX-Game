import test from 'node:test';
import assert from 'node:assert/strict';
import {JourneyTransition} from '../src/journey-transition.mjs';
import {glassControlPresence} from '../../service/public/max-panel-optics.js';

test('scene mutation happens once at zero coverage; exit and entrance are monotonic',()=>{
 const m=new JourneyTransition();let commits=0;
 m.start(()=>{assert.equal(m.value,0);commits++;});
 let last=1;
 while(m.phase==='exit'){m.tick(.016);assert.ok(m.value<=last);last=m.value;}
 assert.equal(commits,1);assert.equal(last,0);
 while(m.busy){m.tick(.016);assert.ok(m.value>=last);last=m.value;}
 assert.equal(last,1);assert.equal(commits,1);assert.equal(m.tick(.1),false);
});
test('zones are independent; repeated input cannot replace pending action',()=>{
 const a=new JourneyTransition(),b=new JourneyTransition();let applied='';
 a.start(()=>applied+='a');assert.equal(a.start(()=>applied+='wrong'),false);
 b.start(()=>applied+='b');a.tick(.05);
 assert.equal(b.value,1);assert.ok(a.value<1);
 for(let i=0;i<20;i++)b.tick(.016);
 assert.equal(applied,'b');a.cancel();for(let i=0;i<20;i++)a.tick(.016);
 assert.equal(applied,'b');assert.equal(a.value,1);
});
test('reduced motion commits immediately; landing preserves node and only reveals surroundings',()=>{
 const m=new JourneyTransition();let commits=0;
 m.start(()=>commits++,{reduced:true});assert.equal(m.busy,false);assert.equal(m.value,1);
 m.start(()=>commits++,{enterOnly:true});assert.equal(commits,2);assert.equal(m.value,0);
 m.tick(.04);assert.ok(m.value>0&&m.value<1);assert.equal(commits,2);
});
test('frame stalls do not skip the exit or fire actions after cancellation',()=>{
 const m=new JourneyTransition();let n=0;m.start(()=>n++);m.tick(20);
 assert.equal(n,0);assert.equal(m.phase,'exit');m.cancel();m.tick(20);assert.equal(n,0);
});
test('Frost follows zone, parent and flight coverage but ignores invisible input root',()=>{
 const root={style:{opacity:'0'}};
 const zone={dataset:{uiPresence:'.5'},style:{opacity:'1'},parentElement:root};
 const field={style:{opacity:'.08'},parentElement:zone};
 const button={dataset:{uiFade:'.4'},style:{opacity:'1'},parentElement:field};
 const el={style:{opacity:'1'},parentElement:button,closest:s=>s==='.journey-zone'?zone:button};
 const doc={defaultView:{getComputedStyle:n=>n.style}};
 assert.ok(Math.abs(glassControlPresence(el,doc)-.016)<1e-9);
 zone.dataset.uiPresence='0';assert.equal(glassControlPresence(el,doc),0);
 zone.dataset.uiRetained='channel';button.dataset.object='channel';field.style.opacity='1';button.dataset.uiFade='1';
 assert.equal(glassControlPresence(el,doc),1);
 el.style.visibility='hidden';assert.equal(glassControlPresence(el,doc),0);
});
