// Isolated geometry experiment. Does not load or modify game state/configs.
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
const points=[new Vector3(-.35,1,3),new Vector3(.35,1,4.3)];
const radius=.4;
function sample(yaw, width=1920, height=1080, zoom=1) {
  const camera=new PerspectiveCamera(42,width/height,.1,60);
  camera.position.set(8*Math.sin(yaw),0,8*Math.cos(yaw));
  camera.lookAt(0,0,0);camera.zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const right=new Vector3(1,0,0).applyQuaternion(camera.quaternion);
  const project=p=>{const n=p.clone().project(camera);return [(n.x+1)*width/2,(1-n.y)*height/2];};
  const centers=points.map(project);
  const radii=points.map((p,i)=>{const q=project(p.clone().addScaledVector(right,radius));return Math.hypot(q[0]-centers[i][0],q[1]-centers[i][1]);});
  const distance=Math.hypot(centers[1][0]-centers[0][0],centers[1][1]-centers[0][1]);
  return {yawDegrees:yaw*180/Math.PI,width,height,zoom,distancePx:distance,rangePx:radii[0]+radii[1],ratio:distance/(radii[0]+radii[1]),connected:distance<=radii[0]+radii[1]};
}
const front=sample(0), rotated=sample(-.35), hiDpiLayout=sample(0,3840,2160),zoomed=sample(0,1920,1080,1.5);
assert.equal(front.connected,true);assert.equal(rotated.connected,false);
assert.ok(Math.abs(front.ratio-hiDpiLayout.ratio)<1e-12);
assert.ok(Math.abs(front.ratio-zoomed.ratio)<1e-12);
assert.ok(points[0].distanceTo(points[1])>radius*2);
console.log(JSON.stringify({scope:'Two isolated billboard circles; no Earth occlusion, UI, topology or mission solvability checked',worldDistance:points[0].distanceTo(points[1]),worldRange:radius*2,samples:[front,rotated,hiDpiLayout,zoomed]},null,2));
