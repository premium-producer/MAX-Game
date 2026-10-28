import test from 'node:test';
import assert from 'node:assert/strict';
import {fallingCardGeometry} from '../src/kdw-falling-card-layout.mjs';
import {createRightCardLayout} from '../src/kdw-activity-stage.mjs';
const geometry={rect:{right:1640,width:400},scale:1,playArea:{left:683.2,right:2196.8,height:1320.96},flowArea:{top:0,bottom:1536,height:1536},displayRight:3072,viewportScale:1};
test('default doubles previous falling card size by exactly 2.2; extension is independent of size and speed',()=>{
 const old=fallingCardGeometry({...geometry,cardScale:1}),large=fallingCardGeometry(geometry),wide=fallingCardGeometry({...geometry,spawnRight:650});
 assert.equal(large.width,old.width*2.2);assert(wide.right>large.right);assert.equal(wide.width,large.width);assert.equal(wide.path,large.path);assert(wide.right<=3072);
 const capped=fallingCardGeometry({...geometry,spawnRight:1600});assert.equal(capped.right,3072);
});
test('geometry scales with viewport, contains cards, and live settings update the shared render/hit rectangles',()=>{
 const half={...geometry,rect:{right:820,width:200},scale:.5,playArea:{left:341.6,right:1098.4,height:660.48},flowArea:{top:0,bottom:768,height:768},displayRight:1536,viewportScale:.5};
 const full=fallingCardGeometry({...geometry,spawnRight:500}),small=fallingCardGeometry({...half,spawnRight:500});for(const k of ['left','right','width','entry','path'])assert(Math.abs(full[k]/2-small[k])<1e-6);
 const layout=createRightCardLayout(),rows=[{spawnId:'1',flow:'free',size:1,offset:.8,progress:.4,travel:8000,post:{id:'x'}}],measure=(_s,w)=>w*1.3;
 const a=layout.layout({...geometry,cardScale:1},rows,measure).get('1'),b=layout.layout({...geometry,cardScale:2.2,spawnRight:600},rows,measure).get('1');assert(Math.abs(b.w/a.w-2.2)<1e-8);assert.equal(b.h,b.w*1.3);assert(b.x+b.w<=3072);assert.equal(b.v,full.path/8000);
});
