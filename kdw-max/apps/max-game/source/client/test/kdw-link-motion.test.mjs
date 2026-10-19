import test from 'node:test';
import assert from 'node:assert/strict';
import {CalmLinkMotion} from '../src/kdw-link-motion.mjs';
import {sampleTileEdgeCurve,TileEdgeMotion} from '../src/journey-links.mjs';
const scale=.00312;
function links(width=392,height=800,y=0){
 const frame=(x,y,w,h,r)=>({x:x*scale,y:y*scale,w:w*scale,h:h*scale,radius:r*scale});
 return Array.from({length:5},(_,lane)=>({a:1,b:2,lane,scope:'guided-line',visibility:1,edgeCurve:{frames:[frame(0,0,256,256,59),frame(256/2+128+width/2,y,width,height,30)]}}));
}
test('fan stays on facing side edges with monotone, loop-free curves over device morph and resize',()=>{
 const motion=new CalmLinkMotion();let time=0;
 for(const [w,h,y]of [[392,800,0],[1450,800,80],[250,1000,-200],[1450,800,0],[392,800,0]]){
  const input=links(w,h,y),frames=input[0].edgeCurve.frames;
  motion.update(input,scale,time+=1/60);
  for(const link of input){
   const c=link.edgeCurve;
   assert.equal(c.start.x,frames[0].x+frames[0].w/2);assert.equal(c.end.x,frames[1].x-frames[1].w/2);
   assert.ok(Math.abs(c.start.y-frames[0].y)<=frames[0].h*.27+1e-9);
   assert.ok(Math.abs(c.end.y-frames[1].y)<=frames[1].h*.27+1e-9);
   let last=c.start.x;
   for(let i=0;i<=80;i++){const p=sampleTileEdgeCurve(c,i/80);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=last-1e-9&&p.x<=c.end.x+1e-9);last=p.x;}
   assert.ok(Math.abs(c.c1.y-c.start.y)<=6*scale+1e-9);
   assert.equal(new TileEdgeMotion().step(c,.016),c,'renderer must retain constrained handles');
  }
 }
});
test('small physical bend survives retarget then settles without moving either attachment',()=>{
 const motion=new CalmLinkMotion();motion.update(links(),scale,0);
 let current=links(1400,800,120);motion.update(current,scale,1/60);
 const c=current[2].edgeCurve;assert.ok(Math.abs(c.c1.y-c.start.y)>0);assert.ok(Math.abs(c.c1.y-c.start.y)<=6*scale);
 for(let i=2;i<=120;i++){current=links(1400,800,120);motion.update(current,scale,i/60);}
 assert.ok(Math.abs(current[2].edgeCurve.c1.y-current[2].edgeCurve.start.y)<.01*scale);
});
test('reduced motion and removed links clear inertia; overlapping tiles do not draw a reversed fan',()=>{
 const motion=new CalmLinkMotion();motion.update(links(),scale,0);
 const current=links(400,800,120);motion.update(current,scale,.016,true);
 assert.equal(current[2].edgeCurve.c1.y,current[2].edgeCurve.start.y);
 const overlap=links();overlap.forEach(l=>l.edgeCurve.frames[1].x=0);motion.update(overlap,scale,.032);
 assert.ok(overlap.every(l=>l.visibility===0));motion.update([],scale,.05);assert.equal(motion.links.size,0);
});
