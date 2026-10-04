import test from 'node:test';
import assert from 'node:assert/strict';
import {findFreeSlot,slotBox} from '../src/journey-slot-placement.mjs';
import {INTERACTION_BAND,journeyFieldBounds} from '../src/circle-model.mjs';
const shape={left:100,right:100,top:50,bottom:130};
const bounds={x:0,y:0,w:1000,h:600},point={x:500,y:250};
const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
test('unchanged safe composition keeps its plus; a blocked plus goes below first',()=>{
 assert.deepEqual(findFreeSlot(point,shape,bounds,[]),point);
 const moved=slotBox(point,shape),p=findFreeSlot(point,shape,bounds,[moved]);
 assert.equal(p.x,point.x);assert.ok(p.y>point.y);assert.ok(!intersects(slotBox(p,shape),moved));
 // Once a plus has moved, removing the old obstacle must not pull it back.
 assert.deepEqual(findFreeSlot(p,shape,bounds,[]),p);
});
test('above wins before lateral; right wins before left when both vertical sides are full',()=>{
 const low={x:500,y:450},p=findFreeSlot(low,shape,bounds,[slotBox(low,shape)]);
 assert.equal(p.x,low.x);assert.ok(p.y<low.y);
 const column={x:400,y:0,w:200,h:600},right=findFreeSlot(point,shape,bounds,[column]);
 assert.ok(right.x>point.x);assert.equal(right.y,point.y);
 const left=findFreeSlot(point,shape,bounds,[column,{x:600,y:0,w:400,h:600}]);
 assert.ok(left.x<point.x);assert.equal(left.y,point.y);
});
test('full caption and hit target stay inside physical UX band; movement band is wider',()=>{
 const h=INTERACTION_BAND.bottom-INTERACTION_BAND.top,field=journeyFieldBounds(1712,h,true);
 assert.ok(field.y<0&&field.h>h);
 const band={x:18,y:18,w:1676,h:h-36};
 const serviceShape={left:94,right:94,top:50,bottom:110};
 for(const y of [-100,0,h,h+100]){
  const p=findFreeSlot({x:800,y},serviceShape,band,[]),b=slotBox(p,serviceShape);
  assert.ok(b.y>=18&&b.y+b.h<=h-18+.001);
 }
});
test('three parallel pluses reserve one another and preserve placed boxes',()=>{
 const existing=[{x:420,y:200,w:160,h:160}],copy=structuredClone(existing),positions=[];
 for(let i=0;i<3;i++){
  const p=findFreeSlot(point,shape,bounds,existing.concat(positions));assert.ok(p);
  const b=slotBox(p,shape);assert.ok([...existing,...positions].every(o=>!intersects(b,o)));positions.push(b);
 }
 assert.deepEqual(existing,copy);
});
test('oversized or full field has no unsafe fallback; larger tiles use the same priorities',()=>{
 assert.equal(findFreeSlot(point,shape,bounds,[bounds]),null);
 assert.equal(findFreeSlot(point,{left:600,right:600,top:50,bottom:100},bounds,[]),null);
 const large={left:147,right:457,top:147,bottom:147},area={x:18,y:18,w:1532,h:832};
 const p={x:600,y:200},obstacle=slotBox(p,large),next=findFreeSlot(p,large,area,[obstacle]);
 assert.equal(next.x,p.x);assert.ok(next.y>p.y);assert.ok(!intersects(slotBox(next,large),obstacle));
});
