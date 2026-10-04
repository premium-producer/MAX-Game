import {readFile} from 'node:fs/promises';
const root=process.cwd()+'/app/';
const G=await import(root+'src/mission-game.mjs');
const {loadMissionCatalog}=await import(root+'src/mission-config.mjs');
const {evaluateMission}=await import(root+'src/mission-evaluation.mjs');
const {createSurfaceMap}=await import(root+'src/surface-map.mjs');
const catalog=await loadMissionCatalog('./config/missions/index.json',async p=>({ok:true,json:async()=>JSON.parse(await readFile(root+'public/'+p,'utf8'))}));
const m=catalog.missions.find(m=>m.id==='arctic-route'),path=m.topology.paths[0],a=m.endpoints[path.from],b=m.endpoints[path.to];
const vector=({latitude,longitude})=>{const lat=latitude*Math.PI/180,lon=longitude*Math.PI/180;return [Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)]};
const av=vector(a),bv=vector(b);
const angle=Math.acos(av.reduce((s,v,i)=>s+v*bv[i],0));
function geo(t){const v=av.map((n,i)=>(n*Math.sin((1-t)*angle)+bv[i]*Math.sin(t*angle))/Math.sin(angle));return {latitude:Math.asin(v[1])*180/Math.PI,longitude:Math.atan2(v[2],v[0])*180/Math.PI};}
const map=createSurfaceMap(JSON.parse(await readFile(root+'public/earth/Earth_Surface_4K.json','utf8')),new Uint8Array(await readFile(root+'public/earth/Earth_Surface_4K.bin')));
G.configureMissions(catalog);G.configurePlacementSurface(map);
for(const mode of ['linear-test','great-circle','great-circle-land']){
 let run=G.createMissionRun(m.number);
 const nodes=path.steps.map((step,i)=>{
  const t=(i+1)/(path.steps.length+1);
  let p=mode==='linear-test'?{latitude:a.latitude+(b.latitude-a.latitude)*t,longitude:a.longitude+(b.longitude-a.longitude)*t}:geo(t);
  if(mode==='great-circle-land'&&G.getPlacementRejection(step.type,p)){
   let found;
   for(let radius=.25;radius<=15&&!found;radius+=.25)for(let deg=0;deg<360;deg+=15){let c={latitude:p.latitude+radius*Math.sin(deg*Math.PI/180),longitude:p.longitude+radius*Math.cos(deg*Math.PI/180)};if(Math.abs(c.latitude)<=82&&!G.getPlacementRejection(step.type,c)){found=c;break;}}
   if(found)p=found;
  }
  const node={id:i+1,type:step.type,...p,altitude:step.type==='satellite'?.34:.08,droppedAt:0};
  run=G.reduceMission(run,{type:'PLACE',item:step.type,...p,altitude:node.altitude,now:0});return node;
 });
 const evaluation=evaluateMission(m,nodes,catalog.objectSettings,1000);
 const checked=G.reduceMission(run,{type:'CHECK',now:1000});
 console.log(JSON.stringify({mode,complete:evaluation.complete,diagnostics:evaluation.diagnostics,placed:run.placements.length,runStatus:checked.status,nodes,committed:run.placements},null,2));
}
