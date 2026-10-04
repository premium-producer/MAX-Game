import {readFile,writeFile} from 'node:fs/promises';
const root=process.cwd();
const T=await import(`${root}/app/node_modules/three/build/three.module.js`);
const W=await import(`${root}/app/src/webgl-field.js`);
const G=await import(`${root}/app/src/mission-game.mjs`);
const {loadMissionCatalog}=await import(`${root}/app/src/mission-config.mjs`);
const {parseUiShellConfig,resolveEarthFrameOffset}=await import(`${root}/app/src/ui-shell-config.mjs`);
const {createSurfaceMap}=await import(`${root}/app/src/surface-map.mjs`);
const json=async p=>JSON.parse(await readFile(`${root}/app/public/${p}`,'utf8'));
const c=await loadMissionCatalog('./config/missions/index.json',async p=>({ok:true,json:()=>json(p)}));G.configureMissions(c);
const s=parseUiShellConfig(await json('config/ui-shell.json')),v=s.states.MISSION_PLAY.cameraView;
const map=createSurfaceMap(await json('earth/Earth_Surface_4K.json'),await readFile(`${root}/app/public/earth/Earth_Surface_4K.bin`));
const {width,height}=s.designViewport;
const camera=new T.PerspectiveCamera(v.fov,width/height,.1,60),q=new T.Quaternion().setFromEuler(new T.Euler(...v.rotation,'YXZ'));
const target=new T.Vector3(...v.target);
camera.position.set(0,0,v.distance).applyQuaternion(q).add(target);camera.up.set(0,1,0).applyQuaternion(q);camera.lookAt(target);
const offset=resolveEarthFrameOffset(s,'MISSION_PLAY');camera.setViewOffset(width,height,-offset.x,-offset.y,width,height);camera.updateMatrixWorld(true);
const geoQ=new T.Quaternion().setFromEuler(new T.Euler(...W.RUSSIA_VIEW.rotation)).multiply(new T.Quaternion().setFromEuler(new T.Euler(0,Math.PI/2,0)));
const scene=g=>W.geoToVector(g).applyQuaternion(geoQ);
const project=p=>{const n=p.clone().project(camera);return {x:(n.x+1)*width/2,y:(1-n.y)*height/2};};
let polar=[];
const run=G.createMissionRun(1);run.placements=[{id:1,type:'satellite',latitude:80,longitude:0,altitude:.72,droppedAt:0}];
for(let lat=82.1;lat<90;lat+=.25)for(let lon=-180;lon<180;lon+=2){
 const raw={latitude:lat,longitude:lon,altitude:.72},point=scene(raw),px=project(point);
 if(px.x<24||px.x>width-268||px.y<112||px.y>height/2||!W.satellitePositionIsVisible(point,camera.position)||map.sample(lat,lon)!==1)continue;
 const normalized=G.previewPlacementMove(run,1,raw).placements[0];
 const committed=G.reduceMission(run,{type:"MOVE",id:1,...raw,now:1000}).placements[0];
 const after=project(scene(committed));
 polar.push({raw,normalizedLatitude:normalized.latitude,committedLatitude:committed.latitude,before:px,after,jumpPixels:Math.hypot(px.x-after.x,px.y-after.y)});
}
polar.sort((a,b)=>b.jumpPixels-a.jumpPixels);
// Continuous visible far-side orbit can be replaced with its near-side intersection at Earth's limb.
const cam=new T.Vector3(0,0,9),radius=3.72;
let ref=null,previous=null,visibilityJump=null;
for(let y=3.65;y>2;y-=.001){
 const ray=new T.Ray(cam,new T.Vector3(0,y,0).sub(cam).normalize());
 if(!ref){ref=W.intersectSphereContinuously(ray,radius,new T.Vector3(0,0,-radius));if(!ref)continue;}
 const hit=W.intersectVisibleSphereContinuously(ray,radius,cam,ref);
 if(!hit)continue;
 if(previous&&hit.distanceTo(previous)>.5){visibilityJump={deltaRayTargetY:.001,jumpWorld:hit.distanceTo(previous),from:previous.toArray(),to:hit.toArray(),angleDegrees:previous.angleTo(hit)*180/Math.PI};break;}
 previous=hit;ref=hit;
}
const report={viewport:{width,height},polarClamp:polar.slice(0,3),visibilityJump,satellitePolicy:c.system.objectTypes.satellite.placementSurface};
await writeFile('/tmp/satellite-drag-diagnosis.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
