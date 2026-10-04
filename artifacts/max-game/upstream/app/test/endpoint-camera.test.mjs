import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import * as T from 'three';
import { loadMissionCatalog } from '../src/mission-config.mjs';
import { parseUiShellConfig, resolveEndpointSafeArea, resolveEarthFrameOffset } from '../src/ui-shell-config.mjs';
import { endpointVerticalBounds, fitEndpointSafeArea, geoToVector, RUSSIA_VIEW, NODE_SURFACE_ALTITUDE } from '../src/webgl-field.js';

const root = new URL('../public/', import.meta.url);
const catalog = await loadMissionCatalog('./config/missions/index.json', async path => ({ok:true,json:async()=>JSON.parse(await readFile(new URL(path,root),'utf8'))}));
const shell = parseUiShellConfig(JSON.parse(await readFile(new URL('config/ui-shell.json',root),'utf8')));

test('endpoint safe area follows the gameplay frame and is absent on other screens', () => {
  const area = resolveEndpointSafeArea(shell, 'MISSION_PLAY');
  assert.ok(area.top > 0 && area.bottom < 1 && area.top < area.bottom);
  for(const screen of ['CTA','ONBOARDING','MISSION_SELECT','END']) assert.equal(resolveEndpointSafeArea(shell, screen), null);
});

test('safe framing preserves valid views, clamps both edges and fits oversized spans', () => {
  assert.deepEqual(fitEndpointSafeArea(300,700,150,900,1080,0),{zoom:1,offset:0});
  assert.equal(fitEndpointSafeArea(300,950,150,900,1080,0).offset,-50);
  assert.equal(fitEndpointSafeArea(50,700,150,900,1080,0).offset,100);
  const fit=fitEndpointSafeArea(-200,1500,150,900,1080,140);
  assert.ok(fit.zoom < 1);
  assert.ok(Math.abs(540+(-200-540)*fit.zoom+fit.offset-150)<1e-9);
  assert.ok(Math.abs(540+(1500-540)*fit.zoom+fit.offset-900)<1e-9);
});

test('complete endpoint glyphs and ground rings stay within safe edges across all mission camera sweeps', () => {
  const view = shell.states.MISSION_PLAY.cameraView, area = resolveEndpointSafeArea(shell,'MISSION_PLAY');
  const geoQ=new T.Quaternion().setFromEuler(new T.Euler(...RUSSIA_VIEW.rotation)).multiply(new T.Quaternion().setFromEuler(new T.Euler(0,Math.PI/2,0)));
  let corrections=0;
  for(const height of [540,1080,2160]) for(const mission of catalog.missions) {
    const markers=Object.entries(mission.endpoints).map(([id,geo])=>({position:geoToVector({...geo,altitude:NODE_SURFACE_ALTITUDE}).applyQuaternion(geoQ),size:geo.size ?? (catalog.objectSettings[`endpoint:${id}`] || catalog.objectSettings['endpoint:A']).size}));
    for(const pitch of [-12,-6,0,6,12]) for(const yaw of [-25,0,25]) for(const distance of [6,9,12]) {
      const camera=new T.PerspectiveCamera(view.fov,16/9,.1,60);
      const q=new T.Quaternion().setFromEuler(new T.Euler(view.rotation[0]+T.MathUtils.degToRad(pitch),view.rotation[1]+T.MathUtils.degToRad(yaw),view.rotation[2],'YXZ'));
      camera.position.set(0,0,distance).applyQuaternion(q).add(new T.Vector3(...view.target));
      camera.up.set(0,1,0).applyQuaternion(q);camera.lookAt(new T.Vector3(...view.target));camera.updateMatrixWorld(true);
      let top=Infinity,bottom=-Infinity;
      for(const m of markers){const b=endpointVerticalBounds(m.position,m.size,camera,height);top=Math.min(top,b.top);bottom=Math.max(bottom,b.bottom);}
      const preferred=(resolveEarthFrameOffset(shell,'MISSION_PLAY').y+(mission.number===2?140*Math.abs(pitch)/12:0))*height/1080;
      const fit=fitEndpointSafeArea(top,bottom,area.top*height,area.bottom*height,height,preferred);
      if(fit.offset!==preferred || fit.zoom<1)corrections++;
      camera.zoom=fit.zoom;camera.setViewOffset(height*16/9,height,0,-fit.offset,height*16/9,height);camera.updateProjectionMatrix();
      for(const m of markers) for(const y of [-.12,.32]) for(const z of [-.12,.12]) {
        const point=new T.Vector3(0,y*m.size,z*m.size).applyQuaternion(camera.quaternion).add(m.position).project(camera);
        const pixel=(1-point.y)*height/2;
        assert.ok(pixel>=area.top*height-1e-7 && pixel<=area.bottom*height+1e-7,`${mission.id}: ${pixel} at pitch ${pitch}, yaw ${yaw}, distance ${distance}`);
      }
    }
  }
  assert.ok(corrections>0);
});
