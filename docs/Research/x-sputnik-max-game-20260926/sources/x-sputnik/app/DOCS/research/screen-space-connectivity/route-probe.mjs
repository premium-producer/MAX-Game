// Reproduce real PLACE → projected evaluation → held CHECK for shipped missions.
// Camera search is bounded by the current authored orbit limits; this is test tooling.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {screenCatalog,cameraFor,capture} from '../../../test/screen-route-fixture.mjs';
import {routeCandidates} from '../../../test/route-fixture.mjs';
import {configureMissions,configurePlacementSurface,createMissionRun,reduceMission,getPlacementRejection,deriveNetwork,altitudeSettingsFor,isOrbitalType} from '../../../src/mission-game.mjs';
import {createSurfaceMap} from '../../../src/surface-map.mjs';
const root=new URL('../../../public/',import.meta.url);
const map=createSurfaceMap(JSON.parse(await readFile(new URL('earth/Earth_Surface_4K.json',root),'utf8')),new Uint8Array(await readFile(new URL('earth/Earth_Surface_4K.bin',root))));
configureMissions(screenCatalog);configurePlacementSurface(map);
const results=[];
for(const mission of screenCatalog.missions) {
 let run=createMissionRun(mission.number);
 for(const p of routeCandidates(mission)) {
  if(isOrbitalType(p.type)) p.altitude=altitudeSettingsFor(p.type).defaultAltitude;
  let geo=p;
  if(getPlacementRejection(p.type,geo)) {
   let found=null;
   for(let radius=.25;radius<=15&&!found;radius+=.25)for(let angle=0;angle<360&&!found;angle+=15){
    const candidate={...p,latitude:p.latitude+radius*Math.sin(angle*Math.PI/180),longitude:p.longitude+radius*Math.cos(angle*Math.PI/180)};
    if(Math.abs(candidate.latitude)<=82&&!getPlacementRejection(p.type,candidate))found=candidate;
   }
   assert.ok(found,mission.id+' land');geo=found;
  }
  const next=reduceMission(run,{...geo,type:'PLACE',item:p.type,now:0});
  assert.equal(next.placements.length,run.placements.length+1);run=next;
 }
 let solution=null;
 search:for(let yaw=-24;yaw<=24;yaw+=3)for(let pitch=-12;pitch<=12;pitch+=2){
  const camera=cameraFor(mission,yaw*Math.PI/180,pitch*Math.PI/180);
  let snapshot=capture(mission,run.placements,camera);
  // Without altitude controls, align orbital icons by geographic movement at
  // their authored default altitude. This is an offline witness search only.
  if(!deriveNetwork({...run,connectionProjection:snapshot},1000).complete) {
   const path=mission.topology.paths[0],a=snapshot.nodes['endpoint:'+path.from],b=snapshot.nodes['endpoint:'+path.to];
   if(!a?.eligible||!b?.eligible)continue;
   const adjusted=run.placements.map(p=>({...p}));
   for(let i=0;i<adjusted.length;i++) {
    const node=adjusted[i];if(!isOrbitalType(node.type))continue;
    const t=(i+1)/(adjusted.length+1),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    let best=null,score=Infinity;
    for(let lat=40;lat<=90;lat+=2)for(let lon=-180;lon<=180;lon+=4){
     const candidate={...node,latitude:lat,longitude:lon},v=capture(mission,[candidate],camera).nodes[node.id];
     const error=(v.x-x)**2+(v.y-y)**2;
     if(v.eligible&&error<score){score=error;best=candidate;}
    }
    if(best)adjusted[i]=best;
   }
   let candidateRun=run;
   for(const p of adjusted)if(isOrbitalType(p.type))candidateRun=reduceMission(candidateRun,{...p,type:'MOVE',id:p.id,now:0});
   const candidateView=capture(mission,candidateRun.placements,camera);
   if(!deriveNetwork({...candidateRun,connectionProjection:candidateView},1000).complete)continue;
   run=candidateRun;snapshot=candidateView;
  }
  let viewed=reduceMission(run,{type:'CONNECTION_VIEW',snapshot,now:1000});
  if(!deriveNetwork(viewed,1000).complete)continue;
  assert.notEqual(reduceMission(viewed,{type:'CHECK',now:1000}).status,'complete');
  snapshot.timestamp=1400;
  assert.equal(reduceMission(viewed,{type:'CHECK',now:1400}).status,'complete');
  for(const satellite of run.placements.filter(p=>p.type==='satellite')){
   const removed=reduceMission(viewed,{type:'REMOVE',id:satellite.id});
   const incomplete=capture(mission,removed.placements,cameraFor(mission,yaw*Math.PI/180,pitch*Math.PI/180));
   const checked=reduceMission(removed,{type:'CONNECTION_VIEW',snapshot:incomplete,now:1000});
   assert.equal(deriveNetwork(checked,1000).complete,false);
  }
  solution={mission:mission.id,yawOffsetDegrees:yaw,pitchOffsetDegrees:pitch,placements:run.placements};break search;
 }
 assert.ok(solution,mission.id+' screen solution within authored camera limits');results.push(solution);
}
console.log(JSON.stringify({scope:'Actual shipped land mask, inventory, PLACE, projected camera, endpoint fit and held CHECK; conservative panel fixtures; no interactive QA',results},null,2));
