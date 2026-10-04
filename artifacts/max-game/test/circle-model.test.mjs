import test from 'node:test';
import assert from 'node:assert/strict';
import {CIRCLES,INTERACTION_BAND,NODE_HIT_RADIUS,pixelToHeight,playBounds,WALL,FLAT_SCREEN,zonesForLayout,setZoneLayout,newZone,pixelToGeo,geoToPixel,insideCircle,placeInZone,moveInZone,removeInZone,updateZoneHold} from '../src/circle-model.mjs';
test('two square zones fit the planar wall and never overlap',()=>{
 for(const c of CIRCLES){assert.ok(c.x-c.r>=0&&c.x+c.r<=WALL.width&&c.y-c.r>=0&&c.y+c.r<=WALL.height);assert.deepEqual(geoToPixel(pixelToGeo(c.x,c.y)),{x:c.x,y:c.y});}
 assert.ok(CIRCLES.every((c,i)=>!i||c.x-CIRCLES[i-1].x>c.r+CIRCLES[i-1].r));
});
test('placements/moves are owned by one zone; cross-circle and invalid input cannot commit',()=>{
 const zones=CIRCLES.map(c=>newZone(c.index,1)),first=zones[0],geo=pixelToGeo(CIRCLES[0].x,INTERACTION_BAND.top+213);
 zones[0]=placeInZone(first,'node',geo,{node:1},1000);assert.equal(zones[0].placements.length,1);
 assert.equal(zones[1].placements.length,0);assert.equal(zones.length,2);
 assert.equal(placeInZone(zones[0],'node',geo,{node:1},1000),zones[0]);
 for(const invalid of [pixelToGeo(CIRCLES[1].x,INTERACTION_BAND.top+213),pixelToGeo(0,0),{longitude:NaN,latitude:0}]){
  assert.equal(insideCircle(0,invalid),false);assert.equal(moveInZone(zones[0],100001,invalid,1500),zones[0]);
 }
 const second=placeInZone(zones[1],'node',pixelToGeo(CIRCLES[1].x,INTERACTION_BAND.top+213),{node:1},1000);
 assert.notEqual(zones[0].placements[0].id,second.placements[0].id);
 assert.equal(removeInZone(zones[0],100001).placements.length,0);assert.equal(second.placements.length,1);
});
test('stable victory is local, delayed, cancelled by interaction and never trusts stale snapshots',()=>{
 let z=newZone(0,1);const s={nodes:{1:{x:100,y:100,radius:60,eligible:true}},timestamp:1000,hidden:false},ok={complete:true};
 z=updateZoneHold(z,s,ok,1000,false);assert.equal(z.complete,false);
 z=updateZoneHold(z,{...s,timestamp:1299},ok,1299,false);assert.equal(z.complete,false);
 assert.equal(updateZoneHold(z,{...s,timestamp:1300},ok,1300,false).complete,true);
 assert.equal(updateZoneHold(z,{...s,timestamp:1300},ok,1300,true).hold,null);
 assert.equal(updateZoneHold(z,s,ok,1300,false).hold,null);
 assert.equal(updateZoneHold(z,{...s,hidden:true,timestamp:1300},ok,1300,false).hold,null);
 const shifted={...s,timestamp:1300,nodes:{1:{...s.nodes[1],x:101}}};assert.equal(updateZoneHold(z,shifted,ok,1300,false).hold,1300);
});

test('both variants keep all zone rectangles and input inside the measured flat screen',()=>{
 for(const mode of ['two','single']){
  const layout=setZoneLayout(mode);assert.equal(layout.length,mode==='two'?2:1);
  for(const c of layout){
   assert.ok(c.left>FLAT_SCREEN.left+64);assert.ok(c.left+c.w<=FLAT_SCREEN.right-64);
   assert.ok(c.top>=96&&c.top+c.h<=WALL.height-64);
   assert.ok(insideCircle(c.index,pixelToGeo(c.x,INTERACTION_BAND.top+213)));
   for(const [x,y] of [[FLAT_SCREEN.left-1,c.y],[4095,c.y],[c.x,c.top+20],[c.x,c.top+c.h-20]])assert.equal(insideCircle(c.index,pixelToGeo(x,y)),false);
  }
 }
 setZoneLayout('two');
});

test('full hit planes and UI strip stay between 1m and 1.8m in both layouts',()=>{
 assert.ok(pixelToHeight(INTERACTION_BAND.top)<=1.8);assert.ok(pixelToHeight(INTERACTION_BAND.bottom)>=1);
 assert.ok(INTERACTION_BAND.bottom-INTERACTION_BAND.top>=404);
 for(const mode of ['two','single']){setZoneLayout(mode);for(const c of CIRCLES){
  const b=playBounds(c.index);assert.ok(b.top-NODE_HIT_RADIUS>INTERACTION_BAND.top);assert.ok(b.bottom+NODE_HIT_RADIUS<INTERACTION_BAND.bottom);
  assert.ok(b.left-NODE_HIT_RADIUS>FLAT_SCREEN.left);assert.ok(b.right+NODE_HIT_RADIUS<FLAT_SCREEN.right);
  for(const y of [INTERACTION_BAND.top,INTERACTION_BAND.bottom,b.top-1,b.bottom+1])assert.equal(insideCircle(c.index,pixelToGeo(c.x,y)),false);
 }}setZoneLayout('two');
});
import {readFileSync} from 'node:fs';
test('physical band follows actual SCREEN_RIGHT UV and STAND_PLINTH top',()=>{
 const b=readFileSync(new URL('../../web/assets/stand.glb',import.meta.url)),len=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+len)),bin=b.subarray(28+len);
 const read=(id)=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView],size=a.type==='VEC3'?3:2;return Array.from({length:a.count},(_,i)=>Array.from({length:size},(_,j)=>bin.readFloatLE((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||size*4)+j*4)));};
 const screen=g.nodes.find(n=>n.name==='SCREEN_RIGHT'),floor=g.nodes.find(n=>n.name==='STAND_PLINTH');
 assert.equal(screen.matrix,undefined);assert.equal(screen.translation,undefined);
 const floorY=g.meshes[floor.mesh].primitives.flatMap(p=>read(p.attributes.POSITION).map(p=>p[1]));
 assert.ok(Math.abs(Math.max(...floorY))<1e-6);
 for(const p of g.meshes[screen.mesh].primitives){const pts=read(p.attributes.POSITION),uv=read(p.attributes.TEXCOORD_0);for(let i=0;i<pts.length;i++)assert.ok(Math.abs(pixelToHeight(uv[i][1]*1280)-pts[i][1])<1e-5);}
});
