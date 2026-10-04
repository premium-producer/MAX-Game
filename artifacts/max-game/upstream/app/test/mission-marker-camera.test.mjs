import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { fitMissionMarkerSafeArea } from '../src/mission-marker-safe-area.mjs';
import { missionMarkerFrame } from '../src/webgl-field.js';
import { loadMissionCatalog } from '../src/mission-config.mjs';
import { parseUiShellConfig } from '../src/ui-shell-config.mjs';

const root = new URL('../public/', import.meta.url);
const raw = JSON.parse(await readFile(new URL('config/ui-shell.json', root), 'utf8'));
const catalog = await loadMissionCatalog('./config/missions/index.json', async path => ({ok:true,json:async()=>JSON.parse(await readFile(new URL(path,root),'utf8'))}));
const source = await readFile(new URL('../src/webgl-field.js', import.meta.url), 'utf8');
const implementation = source.slice(source.indexOf('  const applyPresentationOffset = () => {'), source.indexOf('  const updatePresentationOffset ='));

test('mission safe padding defaults to 50 and round-trips without changing gameplay padding', () => {
  const old = structuredClone(raw);
  delete old.interaction.earthOrbit.missionMarkerSafePaddingPx;
  assert.equal(parseUiShellConfig(old).interaction.earthOrbit.missionMarkerSafePaddingPx, 50);
  assert.equal(parseUiShellConfig(raw).interaction.earthOrbit.endpointSafePaddingPx, 32);
});

test('actual camera projection keeps menu cards and entire bases 50 CSS pixels inside all edges', () => {
  const width=1920,height=1080, view=raw.states.MISSION_SELECT.cameraView;
  let corrections=0;
  for (const scale of [.5,.75,1,2]) for (const expanded of [false,true]) {
    const padding=50/scale;
    const area={left:24+padding,right:width-24-padding,top:raw.geometry.headerHeight+raw.geometry.frameGap+padding,bottom:height-24-padding};
    const entries=catalog.missions.map((mission,index)=>({position:missionMarkerFrame(mission.mapPosition).anchorPosition,
      card:{padLeft:149,padRight:149,padTop:(expanded||index===0?440:230)+58,padBottom:0},
      base:{padLeft:0,padRight:0,padTop:0,padBottom:0}}));
    const camera=new THREE.PerspectiveCamera(view.fov,width/height,.1,60);
    const context=vm.createContext({THREE, camera,container:{clientWidth:width,clientHeight:height},controls:null,
      presentationOffset:{current:{x:0,y:44}},endpointSafeArea:null,
      missionMarkerSafeArea:area,missionMarkerSafeEntries:entries,missionMarkerSafeRects:entries.flatMap(e=>[e.card,e.base]),
      missionMarkerCameraPoint:new THREE.Vector3(),missionMarkerFit:{},fitMissionMarkerSafeArea,
      appliedProjectionZoom:1,appliedProjectionWidth:0,appliedProjectionHeight:0,appliedProjectionX:NaN,appliedProjectionY:NaN});
    vm.runInContext(implementation,context);
    for(const pitch of [-12,-6,0,6,12]) for(const yaw of [-13,-6,0,5,10]) {
      const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(view.rotation[0]+THREE.MathUtils.degToRad(pitch),view.rotation[1]+THREE.MathUtils.degToRad(yaw),view.rotation[2],'YXZ'));
      camera.position.set(0,0,view.distance).applyQuaternion(q).add(new THREE.Vector3(...view.target));
      camera.up.set(0,1,0).applyQuaternion(q);camera.lookAt(new THREE.Vector3(...view.target));camera.updateMatrixWorld(true);
      vm.runInContext('applyPresentationOffset()',context);
      if(camera.zoom<1)corrections++;
      const firstMatrix=camera.projectionMatrix.clone();
      vm.runInContext('applyPresentationOffset()',context);
      assert.deepEqual(camera.projectionMatrix.elements,firstMatrix.elements,'fitting must not oscillate or accumulate zoom');
      const inside=(point,left=0,right=0,top=0,bottom=0)=>{
        const p=point.project(camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;
        assert.ok(x-left>=area.left-1e-6 && x+right<=area.right+1e-6 && y-top>=area.top-1e-6 && y+bottom<=area.bottom+1e-6,`${scale}, ${pitch}, ${yaw}: ${x}, ${y}`);
      };
      for(const entry of entries){
        inside(entry.position.clone(),entry.card.padLeft,entry.card.padRight,entry.card.padTop,0);
        for(const x of [-.12,.12]) for(const y of [-.12,.12]) for(const z of [-.12,.12])
          inside(new THREE.Vector3(x,y,z).applyQuaternion(camera.quaternion).add(entry.position));
      }
    }
    context.missionMarkerSafeArea=null;
    vm.runInContext('applyPresentationOffset()',context);
    assert.equal(camera.zoom,1,'leaving menu restores the normal projection');
  }
  assert.ok(corrections>0,'oversized/edge views exercised');
});
