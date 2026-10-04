import test from 'node:test';
import assert from 'node:assert/strict';
import {objectMetrics,placementAt,placementAnchor} from '../src/journey-radial.mjs';
import {scenarioLayout,routeSchema} from '../src/journey-topology.mjs';
import {enlargeRouteLayout,LARGE_BLOCK_SCALE} from '../src/journey-large-blocks.mjs';
import {findFreeSlot,slotBox} from '../src/journey-slot-placement.mjs';

test('large initial routes retain room for every next plus, including final statistics',()=>{
 const metrics=objectMetrics(false,LARGE_BLOCK_SCALE),shape={left:metrics.cx+2,right:metrics.w-metrics.cx+2,top:metrics.tile/2+2,bottom:metrics.tile/2+2};
 const bounds={x:18,y:18,w:1532,h:832};
 for(const mission of ['blogger','digital-id','communication','business']){
  const s={mission,runs:{[mission]:[]},starts:{[mission]:{step:'open-max'}},branch:'channel'};
  const layout=enlargeRouteLayout(scenarioLayout(s,1568,868),1568,868,metrics),obstacles=[];
  for(const [id,point]of Object.entries(layout.points)){
   const p=findFreeSlot(point,shape,bounds,obstacles,2);
   assert.ok(p,`${mission}: no room for ${id}`);obstacles.push(slotBox(p,shape));
  }
 }
});

test('experimental tiles are reduced 1.5 times from 2.5x; coordinates use their actual hit box',()=>{
 const normal=objectMetrics(false),large=objectMetrics(false,LARGE_BLOCK_SCALE);
 assert.equal(large.tile,normal.tile*2.5/1.5);assert.deepEqual(normal,{w:170,h:160,tile:108});
 const field={x:18,y:18,w:1532,h:832},point={x:800,y:610};
 const restored=placementAnchor(placementAt(point.x,point.y,field,large),field,large);
 assert.ok(Math.abs(restored.x-point.x)<1e-8&&Math.abs(restored.y-point.y)<1e-8);
});
test('all client layouts fit large tiles and complete captions without overlap',()=>{
 const m=objectMetrics(false,2.5),width=1568,height=868;
 for(const mission of ['blogger','digital-id','communication','business']){
  const runs=routeSchema(mission).map(slot=>({step:slot.accept[0],slot:slot.id}));
  const s={mission,runs:{[mission]:runs},starts:{[mission]:{step:'open-max'}},branch:'channel'};
  const layout=enlargeRouteLayout(scenarioLayout(s,width,height),width,height,m);
  const boxes=Object.values(layout.points).map(p=>({x:p.x-m.cx,y:p.y-m.tile/2,w:m.w,h:m.h}));
  for(const b of boxes)assert.ok(b.x>=18&&b.y>=18&&b.x+b.w<=width-18&&b.y+b.h<=height-18,mission);
  for(let i=0;i<boxes.length;i++)for(const b of boxes.slice(i+1)){const a=boxes[i];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,mission);}
  for(const [id,p]of Object.entries(layout.positions))assert.ok(Object.values(layout.points).includes(p),id);
 }
});

test('oversized task window fits the viewport without changing the phone aspect ratio',async()=>{
 const {anchoredTaskBounds}=await import('../src/journey-popup.mjs');
 for(const [w,h]of [[1568,868],[900,1000],[4096,1280]]){
  const b=anchoredTaskBounds({x:w-140,y:140,radius:135},w,h,2.5);
  assert.ok(b.x>=16-.001&&b.y>=16-.001&&b.x+b.w<=w-16+.001&&b.y+b.h<=h-16+.001);
  assert.ok(Math.abs(b.w/b.h-1.22)<.001);assert.equal(b.detached,true);
 }
});
