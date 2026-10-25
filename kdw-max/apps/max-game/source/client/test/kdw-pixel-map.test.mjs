import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PIXEL_MAP,pixelMapViewport,createPixelMapPlan,pixelIdleLayout} from '../src/kdw-pixel-map.mjs';
test('PDF pixel bounds and seven percent safe inset on all central edges',()=>{
 const v=pixelMapViewport(3072,1536);assert.equal(PIXEL_MAP.left+PIXEL_MAP.gameWidth+PIXEL_MAP.right,3072);
 assert.deepEqual(v.touch,{left:560,top:0,width:1760,height:1536,right:2320,bottom:1536});
 for(const [a,b] of [[v.safe.left,683.2],[v.safe.top,107.52],[v.safe.width,1513.6],[v.safe.height,1320.96],[v.safe.right,2196.8]])assert.ok(Math.abs(a-b)<1e-8);
});
test('production menu keeps logo above video and a separate two-by-two mission grid',()=>{
 for(const w of [2048,2240,2304]){
  const zone={w,h:1280},l=pixelIdleLayout(zone),[a,b,c,d]=l.icons;
  assert.deepEqual(l.missionOrder,['digital-id','business','blogger','communication']);
  assert.equal(a.y,b.y);assert.equal(c.y,d.y);assert.equal(a.x,c.x);assert.equal(b.x,d.x);
  assert.ok(a.x<b.x&&a.y<c.y);assert.equal(l.logo.x+l.logo.width/2,w/2);
  assert.ok(l.logo.y+l.logo.height<Math.min(l.video.y,a.y));
  assert.ok(Math.abs(l.video.width/l.video.height-960/550)<1e-10);
  // Include the real 30px caption overhang and its 96px vertical allowance.
  for(const p of l.icons){assert.ok(p.x-30>l.video.x+l.video.width);assert.ok(p.x+l.iconSize+30<=w);assert.ok(p.y+l.iconSize+96<=zone.h);}
  assert.ok(a.x+l.iconSize+30<b.x-30);assert.ok(a.y+l.iconSize+96<c.y);
  assert.ok(l.logo.y>=0&&l.video.y+l.video.height<=zone.h);
 }
});
test('preview preserves native mapping and letterboxes without stretching',()=>{
 for(const [w,h] of [[1536,768],[1920,1080],[1200,1200],[3072,1536]]){const v=pixelMapViewport(w,h);assert.ok(Math.abs(v.width/v.height-2)<1e-8);assert.equal((v.touch.left-v.left)/v.scale,560);assert.ok(v.safe.right<=w&&v.safe.bottom<=h);}
});
test('one projection fits widest device plus reference; history does not affect scale',()=>{
 const catalog={tasks:{a:{screens:{one:{assetId:'p'},two:{assetId:'pc'}}}},assets:{p:{width:392},pc:{width:1300}}};
 const p=createPixelMapPlan(catalog,d=>({width:d.asset.width})),v=pixelMapViewport(3072,1536);assert.ok(Math.abs(p.width*p.scale-3072)<1e-8);assert.ok(Math.abs(p.height*p.scale-1536)<1e-8);
 assert.ok(Math.abs(p.zone.left*p.scale-v.safe.left)<1e-8);assert.ok(p.zone.w*p.scale<=v.safe.width+1e-8);assert.ok(p.zone.h*p.scale<=v.safe.height+1e-8);
 assert.ok(1300+760+64+64<=p.zone.w);const idle=pixelIdleLayout(p.zone);
 for(const r of [idle.logo,idle.video,...idle.icons.map(i=>({...i,width:idle.iconSize,height:idle.iconSize+96}))])assert.ok(r.x>=0&&r.x+r.width<=p.zone.w&&r.y>=0&&r.y+r.height<=p.zone.h);
});
