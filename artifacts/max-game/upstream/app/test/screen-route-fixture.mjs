// Offline test adapter for the shipped camera/safe-area math. Panel boxes are
// conservative fixtures, not a substitute for device-level UI acceptance.
import {readFile} from 'node:fs/promises';
import {PerspectiveCamera,Vector3,Quaternion,Euler} from 'three';
import {loadMissionCatalog,serializeMissionCatalog,parseMissionCatalog} from '../src/mission-config.mjs';
import {configureMissions,createMissionRun,OBJECT_SETTINGS,signalRadiusFor} from '../src/mission-game.mjs';
import {missionMarkerFrame,nodeMarkerFrame,nodeStemHeight,endpointVerticalBounds,fitEndpointSafeArea,verticalCenteringOffset} from '../src/webgl-field.js';
import {parseUiShellConfig,resolveEarthFrameOffset,resolveEndpointSafeArea,resolveUiShellState} from '../src/ui-shell-config.mjs';
import {ConnectionProjector} from '../src/connection-projection.mjs';
import {evaluateMission} from '../src/mission-evaluation.mjs';
import {connectionMode} from '../src/screen-connectivity.mjs';
import {screenObjectSize,screenFieldRadius} from '../src/screen-appearance.mjs';

const root=new URL('../public/',import.meta.url);
const cat=await loadMissionCatalog('./config/missions/index.json',async p=>({ok:true,json:async()=>JSON.parse(await readFile(new URL(p,root),'utf8'))}));
const raw=serializeMissionCatalog(cat);for(const m of raw.missions)for(const p of m.topology.paths)p.connection.policy='screenProjected';
export const screenCatalog=parseMissionCatalog(raw);
const shell=parseUiShellConfig(JSON.parse(await readFile(new URL('config/ui-shell.json',root),'utf8')));
const view=shell.states.MISSION_PLAY.cameraView, area=resolveEndpointSafeArea(shell,'MISSION_PLAY'),offset=resolveEarthFrameOffset(shell,'MISSION_PLAY');
const state=resolveUiShellState(shell,'MISSION_PLAY');
const width=1920,height=1080;
const bounds={left:40,right:width-state.frameRight-16,top:128,bottom:height-state.frameBottom-16,occluders:[{left:48,right:388,top:136,bottom:580},{left:width-state.frameRight-324,right:width-state.frameRight-24,top:136,bottom:465}]};
export function cameraFor(m,yaw,pitch) {
 const cam=new PerspectiveCamera(view.fov,width/height,.1,60),q=new Quaternion().setFromEuler(new Euler(view.rotation[0]+pitch,view.rotation[1]+yaw,view.rotation[2],'YXZ'));
 cam.position.set(0,0,view.distance).applyQuaternion(q).add(new Vector3().fromArray(view.target));cam.up.set(0,1,0).applyQuaternion(q);cam.lookAt(new Vector3().fromArray(view.target));cam.updateMatrixWorld(true);
 let top=Infinity,bottom=-Infinity;for(const [id,p] of Object.entries(m.endpoints)){const b=endpointVerticalBounds(missionMarkerFrame(p).anchorPosition,p.size??OBJECT_SETTINGS['endpoint:A'].size,cam,height);top=Math.min(top,b.top);bottom=Math.max(bottom,b.bottom);}
 const fit=fitEndpointSafeArea(top,bottom,area.top*height,area.bottom*height,height,offset.y+(m.number===2?verticalCenteringOffset(pitch,12*Math.PI/180,12*Math.PI/180,140):0));
 cam.zoom=fit.zoom;cam.setViewOffset(width,height,-offset.x,-fit.offset,width,height);cam.updateProjectionMatrix();return cam;
}
export function capture(m,placements,cam,projector=new ConnectionProjector(),appearance=false) {
 projector.begin(cam,width,height,bounds,m.number,placements,1000,false);
 for(const [id,p] of Object.entries(m.endpoints)){const type=OBJECT_SETTINGS['endpoint:'+id]?'endpoint:'+id:'endpoint:A';const enabled=appearance&&connectionMode(m)==='screen',size=screenObjectSize(type,p.size??OBJECT_SETTINGS[type].size,enabled);projector.add('endpoint:'+id,missionMarkerFrame(p).anchorPosition,.23*size,screenFieldRadius(signalRadiusFor(p,type),enabled),.084*size);}
 for(const p of placements){const enabled=appearance&&(connectionMode(m)==='screen'||m.orbitalTypes.includes(p.type)),size=screenObjectSize(p.type,OBJECT_SETTINGS[p.type].size,enabled);projector.add(p.id,nodeMarkerFrame(p).anchorPosition,nodeStemHeight(p.type)*size,screenFieldRadius(signalRadiusFor(p),enabled),.127*size);}
 return projector.finish();
}
