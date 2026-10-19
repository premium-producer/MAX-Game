import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalStandAdmission,browserSceneSize,browserDeviceCenter,BROWSER_ROUTE_GAP,createBrowserScenePlan} from '../src/kdw-stand-adapter.mjs';
import fs from 'node:fs';
const fixture=()=>{const calls=[],session={busy:false,snapshot:{state:{status:'scan',runId:1}},async owner(value){calls.push(['owner',value]);},async contact(...args){calls.push(args);}};return {session,calls};};
test('portable admission confirms the existing contact once without a palm UI',async()=>{
 const {session,calls}=fixture();let release;const gate=new LocalStandAdmission({wait:()=>new Promise(r=>{release=r;})});
 const pending=gate.update(session);await new Promise(r=>setImmediate(r));assert.equal(gate.update(session),undefined);release();await pending;
 assert.deepEqual(calls,[['owner',true],['portable-admission','down',true],['portable-admission','up',true]]);
});
test('hidden or disposed host cannot confirm a scan',async()=>{
 const {session,calls}=fixture();let active=false;const gate=new LocalStandAdmission({active:()=>active,wait:async()=>{active=false;}});
 await gate.update(session);assert.equal(calls.length,0);active=true;await gate.update(session);assert.equal(calls.at(-1)[1],'cancel');gate.dispose();calls.length=0;await gate.update(session);assert.equal(calls.length,0);
});
test('changed run cancels the old admission instead of confirming a new run',async()=>{
 const {session,calls}=fixture();const gate=new LocalStandAdmission({wait:async()=>{session.snapshot.state.runId=2;}});await gate.update(session);assert.equal(calls.at(-1)[1],'cancel');
});
test('responsive route reserves wide device and full instruction without fitting accumulated left history',()=>{
 for(const [width,height]of [[1280,720],[1920,1080],[2453,1171],[960,720]])for(const visibleCount of [2,3,4,5])for(const deviceWidth of [360,700,1300]){
  const scene=browserSceneSize(width,height,{visibleCount,deviceWidth}),hostWidth=scene.width-64,center=browserDeviceCenter(hostWidth,deviceWidth,visibleCount);
  assert.ok(center-deviceWidth/2-2*(256+BROWSER_ROUTE_GAP)>=48);
  assert.ok(center+deviceWidth/2+64+760<=hostWidth-32);
  assert.deepEqual(scene,browserSceneSize(width,height,{deviceWidth}));
 }
 assert.equal(BROWSER_ROUTE_GAP,128);
});

test('all missions share one catalog scale and reserve every device/copy; old icons may leave the left edge',()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../src/reviewed-content/mission-catalog.json',import.meta.url)));
 const measure=({asset})=>({width:asset?.width&&asset?.height?20+776*asset.width/asset.height:392});
 const plan=createBrowserScenePlan(catalog,measure);
 for(const [width,height]of [[1280,720],[2450,1077],[800,1000]])for(const mission of Object.values(catalog.missions)){
  const frame=plan(width,height),hostWidth=frame.width-64;
  mission.taskIds.forEach((taskId,index)=>{
   for(const screen of Object.values(catalog.tasks[taskId].screens)){
    const deviceWidth=measure({asset:catalog.assets[screen.assetId]}).width;
    const center=browserDeviceCenter(hostWidth,deviceWidth);
    assert.ok(center-deviceWidth/2-2*(256+BROWSER_ROUTE_GAP)>=48);
    assert.ok(center+deviceWidth/2+64+760<=hostWidth-32);
    assert.deepEqual(plan(width,height,mission.missionId),frame,'mission/state cannot change the common scale');
   }
  });
 }
 const frame=plan(1280,720),center=browserDeviceCenter(frame.width-64,1653);
 assert.ok(center-1653/2-5*(256+BROWSER_ROUTE_GAP)<0,'route may extend left instead of changing global scale');
 assert.ok(plan(1280,720,'business').width>browserSceneSize(1280,720).width,'business PC space reserved before the temporary phone shell');
 assert.notDeepEqual(plan(2450,1077,'business'),plan(4000,1000,'business'),'actual viewport change may reproject');
});
