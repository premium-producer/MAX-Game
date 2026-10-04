import test from 'node:test';
import assert from 'node:assert/strict';
import {trimSignalStrand,nearestLinks,JOURNEY_LINK_STYLE,updateSignalParticles,linkReachPresence,JOURNEY_LINK_REACH_TILES,tileEdgeCurve,sampleTileEdgeCurve,TileEdgeMotion} from '../src/journey-links.mjs';
import {suspendSignalLink,stepSignalLinkPresence} from '../src/journey-links.mjs';

test('moving and retiring ribbons hide completely and resume from zero at fresh ports',()=>{
 for(const removing of [false,true]){
  const entry={opacity:1,group:{visible:true},removing};
  suspendSignalLink(entry,true);assert.equal(entry.opacity,1);
  assert.equal(stepSignalLinkPresence(entry,1/60),false);assert.ok(entry.opacity>0&&entry.opacity<1);
  for(let i=0;i<30;i++)assert.equal(stepSignalLinkPresence(entry,1/60),false);
  assert.equal(entry.group.visible,false);assert.equal(entry.opacity,0);
  assert.equal(entry.resetEdgeAfterMove,true);
  suspendSignalLink(entry,false);assert.equal(entry.opacity,0);
  stepSignalLinkPresence(entry,1/60);assert.equal(entry.opacity,0);
  stepSignalLinkPresence(entry,1/60);assert.equal(entry.group.visible,!removing);
  assert.equal(entry.resetEdgeAfterMove,true,'renderer must reset geometry before fading in');
 }
 const moving=new TileEdgeMotion(),fresh=new TileEdgeMotion();
 moving.step(motionGoal('right'),.016);moving.step(motionGoal('bottom'),.016);
 const goal=motionGoal('left',{x:50,y:230,w:100,h:100,radius:28});
 assert.deepEqual(moving.step(goal,.016,true),fresh.step(goal,0),'no old curve interpolates across the new pair');
});

const motionGoal=(side,frame={x:0,y:0,w:100,h:100,radius:28})=>{
 const offsets={right:[50,0],bottom:[0,50],left:[-50,0],top:[0,-50]},[x,y]=offsets[side];
 return {start:{x:frame.x+x,y:frame.y+y},end:{x:300,y:0},frames:[frame,{x:350,y:0,w:100,h:100,radius:28}]};
};

test('port transitions slide on the rounded boundary without jumps at 30/60/120 Hz',()=>{
 const results=[];
 for(const hz of [30,60,120]){
  const motion=new TileEdgeMotion(),goal=motionGoal('top');
  motion.step(motionGoal('right'),0);
  let previous={...motion.curve.start};
  for(let i=0;i<hz;i++){
   const p=motion.step(goal,1/hz).start;
   const qx=Math.abs(p.x)-22,qy=Math.abs(p.y)-22;
   const sdf=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-28;
   assert.ok(Math.abs(sdf)<1e-7,'attachment remains on the tile rim');
   assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<17,'no side-to-side teleport');
   previous={...p};
  }
  results.push(motion.angles[0].value);
  assert.ok(Math.hypot(motion.curve.start.x,motion.curve.start.y+50)<.002);
 }
 assert.ok(Math.max(...results)-Math.min(...results)<1e-12);
});

test('mid-turn retarget preserves port velocity; translating the tile adds no attachment lag',()=>{
 const motion=new TileEdgeMotion();motion.step(motionGoal('right'),0);
 motion.step(motionGoal('top'),.1);
 const value=motion.angles[0].value,velocity=motion.angles[0].velocity,point={...motion.curve.start};
 motion.step(motionGoal('bottom'),0);
 assert.equal(motion.angles[0].value,value);assert.equal(motion.angles[0].velocity,velocity);
 const goal=motionGoal('bottom',{x:125,y:-40,w:100,h:100,radius:28});
 const p=motion.step(goal,0).start;
 assert.ok(Math.abs(p.x-point.x-125)<1e-9);assert.ok(Math.abs(p.y-point.y+40)<1e-9);
 motion.step(goal,1/60);assert.ok(Number.isFinite(motion.angles[0].velocity));
});

test('circle ports, angle wrap, pause and reduced motion stay finite and retain state',()=>{
 const frame={x:0,y:0,w:100,h:100,radius:50},motion=new TileEdgeMotion();
 motion.step(motionGoal('left',frame),0);
 const curve=motion.step(motionGoal('top',frame),.1);
 assert.ok(Math.abs(Math.hypot(curve.start.x,curve.start.y)-50)<1e-8);
 assert.ok(motion.angles[0].value>Math.PI,'left to top crosses the short angle wrap');
 const angle=motion.angles[0].value;
 assert.strictEqual(motion.step(motionGoal('top',frame),0),curve);
 assert.equal(motion.angles[0].value,angle);
 motion.step(motionGoal('bottom',frame),0,true);
 assert.ok(Math.abs(curve.start.x)<1e-8);assert.ok(Math.abs(curve.start.y-50)<1e-8);
 assert.equal(motion.angles[0].velocity,0);
});

test('links dock at facing side midpoints in all four directions, with outward tangents',()=>{
 const a={x:0,y:0,w:100,h:100};
 for(const [x,y,first,last]of [[240,0,'right','left'],[-240,0,'left','right'],[0,240,'bottom','top'],[0,-240,'top','bottom']]){
  const curve=tileEdgeCurve(a,{...a,x,y});
  assert.equal(curve.start.side,first);assert.equal(curve.end.side,last);
  assert.deepEqual(sampleTileEdgeCurve(curve,0),{x:curve.start.x,y:curve.start.y});
  assert.deepEqual(sampleTileEdgeCurve(curve,1),{x:curve.end.x,y:curve.end.y});
  const nearStart=sampleTileEdgeCurve(curve,.00001),nearEnd=sampleTileEdgeCurve(curve,.99999);
  assert.ok((nearStart.x-curve.start.x)*curve.start.nx+(nearStart.y-curve.start.y)*curve.start.ny>0);
  assert.ok((nearEnd.x-curve.end.x)*curve.end.nx+(nearEnd.y-curve.end.y)*curve.end.ny>0);
  const midpoint=sampleTileEdgeCurve(curve,.5);
  assert.ok(Math.hypot(midpoint.x-(curve.start.x+curve.end.x)/2,midpoint.y-(curve.start.y+curve.end.y)/2)>1);
 }
});

test('diagonal curves stay outside both tiles and use live scaled bounds',()=>{
 for(const dx of [-220,220])for(const dy of [-180,180]){
  const a={x:0,y:0,w:108,h:108},b={x:dx,y:dy,w:76,h:76},curve=tileEdgeCurve(a,b);
  const inside=(p,r)=>p.x>r.x+.001&&p.x<r.x+r.w-.001&&p.y>r.y+.001&&p.y<r.y+r.h-.001;
  for(let n=0;n<=80;n++){const p=sampleTileEdgeCurve(curve,n/80);assert.ok(!inside(p,a)&&!inside(p,b));}
  const moved=tileEdgeCurve(a,{...b,x:b.x+15,w:40,h:40},curve);
  assert.notDeepEqual(moved.end,curve.end);
 }
});

test('port selection survives small diagonal bob but switches after a substantial move',()=>{
 const a={x:0,y:0,w:100,h:100},b={...a,x:200,y:200},initial=tileEdgeCurve(a,b);
 let curve=initial;
 for(let i=0;i<60;i++){
  curve=tileEdgeCurve(a,{...b,x:b.x+Math.sin(i)*2,y:b.y+Math.cos(i)*2},curve);
  assert.equal(curve.start.side,initial.start.side);assert.equal(curve.end.side,initial.end.side);
 }
 curve=tileEdgeCurve(a,{...b,x:-250,y:0},curve);
 assert.equal(curve.start.side,'left');assert.equal(curve.end.side,'right');
 const collapsed=tileEdgeCurve({x:0,y:0,w:0,h:0},{x:0,y:0,w:0,h:0});
 for(const t of [0,.5,1])assert.deepEqual(sampleTileEdgeCurve(collapsed,t),{x:0,y:0});
});

test('near-vertical gap between side ports reconnects the upper tile from below',()=>{
 // Geometry reconstructed from the reported crop: a large circle below-left,
 // a square above-right, with nearly coincident facing vertical edges.
 const a={x:-210,y:262,w:420,h:420},b={x:216,y:-74,w:370,h:370};
 const old={start:{side:'right'},end:{side:'left'}};
 const curve=tileEdgeCurve(a,b,old);
 assert.equal(curve.start.side,'right');assert.equal(curve.end.side,'bottom');
 const dx=curve.end.x-curve.start.x,dy=curve.end.y-curve.start.y;
 let p=sampleTileEdgeCurve(curve,0);
 for(let n=1;n<=100;n++){
  const q=sampleTileEdgeCurve(curve,n/100);
  assert.ok((q.x-p.x)*dx+(q.y-p.y)*dy>=0,'no backward fold along the route');
  assert.ok(q.x>=curve.start.x&&q.x<=curve.end.x,'no lateral hook');
  p=q;
 }
 for(const scale of [.25,1,2.5]){
  const scaled=r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v*scale]));
  const c=tileEdgeCurve(scaled(a),scaled(b),old);
  assert.equal(c.start.side,curve.start.side);assert.equal(c.end.side,curve.end.side);
 }
 const reversed=tileEdgeCurve(b,a);
 assert.equal(reversed.start.side,'bottom');assert.equal(reversed.end.side,'right');
 const equal=tileEdgeCurve({x:222,y:400,w:144,h:144},{x:378,y:268,w:144,h:144},old);
 assert.equal(equal.start.side,'right','equivalent routes preserve the source port');
 assert.equal(equal.end.side,'bottom');
});

test('port slide keeps its owner and limits the transient sideways hook',()=>{
 const frames=[{x:0,y:472,w:420,h:420,radius:210},{x:401,y:111,w:370,h:370,radius:90}];
 const motion=new TileEdgeMotion();
 const first=motion.step({start:{x:210,y:472},end:{x:216,y:111},frames},0);
 assert.ok(first.c1.x-first.start.x<1,'perpendicular handle is shortened before sliding');
 const goal={start:{x:210,y:472},end:{x:401,y:296},frames};
 let previous={...first.end};
 for(let n=0;n<120;n++){
  const curve=motion.step(goal,1/60);
  assert.strictEqual(curve,first);
  assert.ok(Math.hypot(curve.end.x-previous.x,curve.end.y-previous.y)<40,'no instant side switch');
  for(const t of [0,.25,.5,.75,1])assert.ok(Object.values(sampleTileEdgeCurve(curve,t)).every(Number.isFinite));
  previous={...curve.end};
 }
 assert.ok(Math.hypot(first.end.x-401,first.end.y-296)<.001);
});

test('a flying node joins in range before landing; its edge identity survives the handoff',()=>{
 const reach=76*JOURNEY_LINK_REACH_TILES,rest={id:100001,x:0,y:0};
 const flight={id:100002,x:reach+1,y:0};
 assert.equal(nearestLinks([rest,flight],reach).length,0);
 flight.x=reach*.95;const early=nearestLinks([rest,flight],reach)[0];
 assert.ok(linkReachPresence(early.distance,reach)>0&&linkReachPresence(early.distance,reach)<1);
 flight.x=reach*.7;const landed=nearestLinks([rest,{...flight}],reach)[0];
 assert.deepEqual([early.a,early.b],[landed.a,landed.b]);assert.equal(linkReachPresence(landed.distance,reach),1);
 assert.deepEqual(nearestLinks([rest],reach),[]); // cancelled preview leaves no permanent node/link
});
test('reach blends monotonically across its boundary and cannot connect distant groups',()=>{
 const reach=532;let previous=0;
 for(let d=reach+20;d>=reach*.75;d--){const value=linkReachPresence(d,reach);assert.ok(value>=previous&&value-previous<.02);previous=value;}
 assert.equal(linkReachPresence(reach,reach),0);
 assert.equal(nearestLinks([{id:1,x:0,y:0},{id:2,x:100,y:0},{id:3,x:2000,y:0}],reach).length,1);
});

const pairs=nodes=>nearestLinks(nodes).map(e=>`${e.a}:${e.b}`).sort();
test('middle detail links nearest neighbours instead of a mission hub across the field',()=>{
 const nodes=[{id:1,x:0,y:0},{id:2,x:130,y:25},{id:3,x:300,y:0}];
 assert.deepEqual(pairs(nodes),['1:2','2:3']);
 assert.deepEqual(pairs(nodes.reverse()),['1:2','2:3']);
});
test('moving details recomputes nearest links, not task completion or a frozen placement order',()=>{
 const nodes=[{id:1,x:0,y:0},{id:2,x:130,y:25},{id:3,x:300,y:0}];
 nodes[2].x=20;nodes[2].y=-20;
 assert.deepEqual(pairs(nodes),['1:3','2:3']);
});
test('ties and coincident points are deterministic; shortest forest connects all nodes without cycles',()=>{
 const nodes=[{id:1,x:0,y:0},{id:2,x:0,y:0},{id:3,x:1,y:0},{id:4,x:1,y:1},{id:5,x:0,y:1}];
 assert.equal(nearestLinks(nodes).length,4);
 assert.deepEqual(pairs(nodes),pairs([...nodes].reverse()));
 assert.ok(nearestLinks(nodes).every(e=>Number.isFinite(e.distance)&&e.screen&&e.correct));
 assert.deepEqual(nearestLinks([]),[]);assert.deepEqual(nearestLinks([nodes[0]]),[]);
 assert.deepEqual(nearestLinks([{id:6,x:NaN,y:0},nodes[0]]),[]);
});
test('zones remain independent when their local graphs are merged',()=>{
 const a=[{id:100,x:0,y:0},{id:101,x:10,y:0}],b=[{id:200,x:1,y:0},{id:201,x:11,y:0}];
 assert.deepEqual([...nearestLinks(a),...nearestLinks(b)].map(e=>[e.a,e.b]),[[100,101],[200,201]]);
});
test('upstream particle motion advances, undulates independently, and reuses finite buffers',()=>{
 const style=JOURNEY_LINK_STYLE,center=new Float32Array((style.segmentCount+1)*3),normal=new Float32Array(center.length);
 for(let i=0;i<=style.segmentCount;i++){center[i*3]=i/style.segmentCount;normal[i*3+1]=1;}
 const positions=new Float32Array(style.particleCount*3),entry={style,offset:0,centerPositions:center,normalPositions:normal,particleAttribute:{array:positions}};
 updateSignalParticles(entry,0);const first=positions.slice();
 updateSignalParticles(entry,1);assert.equal(entry.particleAttribute.array,positions);
 assert.ok(Math.abs(positions[0]-.19)<1e-6);assert.notDeepEqual(positions,first);
 assert.ok([...positions].every(Number.isFinite));assert.ok([...positions].some((v,i)=>i%3===1&&Math.abs(v)>.001));
 updateSignalParticles(entry,0);assert.deepEqual(positions,first);
});


test('link reveal preserves the old curve and clips only its moving tip',()=>{
 const original=Float32Array.from([0,0,0, 10,20,0, 20,10,0, 30,0,0]);
 for(const [progress,count] of [[0,0],[.5,2],[1,3]]){
  const points=original.slice();assert.equal(trimSignalStrand(points,3,progress),count);
  if(progress===.5){assert.deepEqual([...points.slice(0,6)],[...original.slice(0,6)]);assert.deepEqual([...points.slice(6,9)],[15,15,0]);}
  if(progress===1)assert.deepEqual(points,original);
 }
});
test('particles never appear ahead of the revealed tip',()=>{
 const style={...JOURNEY_LINK_STYLE,particleCount:4,segmentCount:2},entry={style,offset:0,reveal:.4,centerPositions:new Float32Array(9),normalPositions:new Float32Array(9),particleAttribute:{array:new Float32Array(12)},particleRevealAttribute:{array:new Float32Array(4)}};
 updateSignalParticles(entry,0);assert.deepEqual([...entry.particleRevealAttribute.array],[1,1,0,0]);
 entry.reveal=0;updateSignalParticles(entry,0);assert.deepEqual([...entry.particleRevealAttribute.array],[0,0,0,0]);
 entry.reveal=1;updateSignalParticles(entry,0);assert.deepEqual([...entry.particleRevealAttribute.array],[1,1,1,1]);
});
