import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pixelMapViewport,pixelFlowViewport} from '../src/kdw-pixel-map.mjs';
import {createRightCardLayout,rightCardRect} from '../src/kdw-activity-stage.mjs';

test('posts and products cross display edges without clipping at the layout inset',()=>{
 for(const [width,height] of [[3072,1536],[1536,768],[1920,1080]]){
  const v=pixelMapViewport(width,height),flow=pixelFlowViewport(width,height);
  assert.equal(flow.left,v.safe.left);assert.equal(flow.right,v.safe.right);
  assert.equal(flow.top,v.touch.top);assert.equal(flow.bottom,v.touch.bottom);
  assert.ok(flow.top<v.safe.top&&flow.bottom>v.safe.bottom);
  const g={rect:{right:width*.51},scale:v.scale,playArea:v.safe,flowArea:flow};
  for(const mode of ['lanes','free']){
   const layout=createRightCardLayout();
   const at=progress=>{const row={spawnId:'test',flow:mode,progress,size:1,column:0,offset:.5,travel:10000};return mode==='lanes'?rightCardRect(g,row):layout.layout(g,[row],(_s,_w,unit)=>440*unit).get('test');};
   const start=at(0),end=at(1);
   assert.ok(start.y+start.w<=flow.top,'whole card starts above the display');
   assert.ok(end.y>flow.bottom,'card leaves below the display before retirement');
   const nearSafe=at(.15);assert.ok(nearSafe.x>=v.safe.left&&nearSafe.x+nearSafe.w<=v.safe.right);
  }
 }
});
