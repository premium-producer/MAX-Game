import test from 'node:test';import assert from 'node:assert/strict';
import {createStoreMotion} from '../src/kdw-store-motion.mjs';
test('selection keeps its card until commit and survives a temporarily hidden activity',()=>{
 const names=['matchMedia','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','performance'],old=Object.fromEntries(names.map(k=>[k,globalThis[k]]));
 let time=0,animations=0;const frames=[],nodes=[];
 const rect=(x=0)=>({x,y:100,left:x,top:100,right:x+100,bottom:200,width:100,height:100,toJSON(){return{...this};}});
 const node=x=>({style:{setProperty(){},removeProperty(){}},dataset:{},isConnected:true,offsetWidth:100,offsetHeight:100,classList:{add(){},contains(){return false;}},setAttribute(){},removeAttribute(){},getBoundingClientRect:()=>rect(x),closest:()=>null,remove(){this.isConnected=false;},animate(){animations++;return{finished:new Promise(()=>{}),cancel(){}};},cloneNode(){return node(x);}});
 const source=node(1000),button=node(1000),destination=node(100);button.querySelector=()=>source;button.cloneNode=()=>{const n=node(1000);n.querySelector=()=>node(1000);return n;};
 const target=node(100);target.querySelector=()=>destination;
 const root={hidden:false,querySelector:()=>target,append(...values){nodes.push(...values);}};
 Object.assign(globalThis,{matchMedia:()=>({matches:false}),getComputedStyle:()=>({fontSize:'20px',borderTopLeftRadius:'16px',borderTopRightRadius:'16px',borderBottomLeftRadius:'16px',borderBottomRightRadius:'16px'}),requestAnimationFrame:fn=>(frames.push(fn),frames.length),cancelAnimationFrame(){},performance:{now:()=>time}});
 let motion;try{
  motion=createStoreMotion(root,{getSlot:()=>target,duration:1000});motion.begin(0,button);assert.equal(animations,0);assert.equal(nodes[0].isConnected,true);
  time=100;motion.add('product',0,button);assert.equal(animations,1);time=200;frames.shift()(time);const before=parseFloat(nodes[1].style.left);
  root.hidden=true;time=300;frames.shift()(time);time=1000;frames.shift()(time);assert.equal(motion.has(0),true);assert.equal(nodes[1].isConnected,true);
  root.hidden=false;time=1100;frames.shift()(time);assert.equal(motion.has(0),true);assert.ok(Math.abs(parseFloat(nodes[1].style.left)-before)<100);
  motion.clear();assert.equal(motion.active(),false);
 }finally{motion?.clear();for(const k of names)if(old[k]===undefined)delete globalThis[k];else globalThis[k]=old[k];}
});
