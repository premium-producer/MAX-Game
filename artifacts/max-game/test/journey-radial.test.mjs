import test from 'node:test';
import assert from 'node:assert/strict';
import {placementAt,placementAnchor,objectMetrics,radialLayout,paddedBounds,intersects,revealOrigin} from '../src/journey-radial.mjs';
import {routeLayout} from '../src/journey-route-layout.mjs';

test('tap coordinates round-trip to the icon centre instead of shifting with the caption',()=>{
 for(const compact of [true,false]){const f={x:18,y:106,w:780,h:compact?234:530},m=objectMetrics(compact),point={x:410,y:compact?203:320};
  const p=placementAt(point.x,point.y,f,m),a=placementAnchor(p,f,m);assert.ok(Math.abs(a.x-point.x)<1e-9);assert.ok(Math.abs(a.y-point.y)<1e-9);
  const edge=placementAt(-100,9999,f,m);assert.equal(edge.x,0);assert.equal(edge.y,1);
 }
});
test('picker reserves tiles, long captions and bob margins across one/two-zone route stages',()=>{
 for(const [width,height,compact]of [[816,405,true],[1712,405,true],[820,880,false],[1520,780,false]])for(let placed=1;placed<=5;placed++){
  const route=routeLayout(placed,true,width,height,compact),m=objectMetrics(compact),pad=compact?14:20;
  const obstacles=route.centers.slice(0,-1).map(p=>paddedBounds([
   {x:p.x-m.w/2,y:p.y-m.tile/2,w:m.w,h:m.h},
   {x:p.x-route.captionWidth/2,y:p.y+m.tile/2+7,w:route.captionWidth,h:compact?52:75}
  ],pad));
  const point=route.centers.at(-1),count=Math.min(5,6-placed),sizes=Array.from({length:count},()=>({w:compact?100:128,h:compact?125:169}));
  const layout=radialLayout(point,count,width,height,compact,obstacles,sizes);
  assert.equal(layout.length,count,`${width} / ${placed} placed: every choice remains available`);
  for(const r of layout){
   assert.ok(r.x>=14&&r.y>=14&&r.x+r.w<=width-14&&r.y+r.h<=height-14);
   assert.ok(obstacles.every(o=>!intersects(r,o,6)),'safe zone includes caption');
   const other=layout.filter(o=>o!==r),origin=revealOrigin(point,r,[...obstacles,...other]);
   for(let f=0;f<=1;f+=.05){
    const x=origin.x+(r.x+r.w/2-origin.x)*f,y=origin.y+(r.y+r.tile/2-origin.y)*f;
    assert.ok([...obstacles,...other].every(o=>!intersects({x:x-r.w/2,y:y-r.tile/2,w:r.w,h:r.h},o,6)),'emergence corridor stays clear');
   }
  }
  for(let i=0;i<count;i++)for(let j=i+1;j<count;j++)assert.ok(!intersects(layout[i],layout[j],12));
 }
});
test('safe bounds include overflowing MAX subtitle rather than only the tile',()=>{
 assert.deepEqual(paddedBounds([{x:30,y:40,w:100,h:100},{x:0,y:150,w:180,h:60}],20),{x:-20,y:20,w:220,h:210});
});
test('radial menus stay in the 1–1.8m band, including labels and floating margin',()=>{
 for(const [w,h,compact]of [[816,405,true],[1712,405,true],[820,880,false],[1520,780,false]])for(let count=1;count<=5;count++)for(const x of [0,w/2,w])for(const y of [0,h/2,h]){
  const layout=radialLayout({x,y},count,w,h,compact);assert.equal(layout.length,count);
  for(const r of layout){assert.ok(r.x>=10&&r.y>=10);assert.ok(r.x+r.w<=w-10&&r.y+r.h<=h-10);}
  for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){const a=layout[i],b=layout[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'hit targets must not overlap');}
 }
});
