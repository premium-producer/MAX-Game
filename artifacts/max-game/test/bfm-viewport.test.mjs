import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WALL} from '../src/circle-model.mjs';
import {BFM_PLAY_AREA,BFM_UI_REFERENCE_HEIGHT,bfmStagePlacement,bfmViewportPlacement} from '../src/bfm-play-area.mjs';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);
test('The fixed UI scale is enlarged from boot; authored phone baseline spans 1–1.8m',()=>{
 const p=bfmStagePlacement(),stageTop=p.y-950*p.scale/2;
 near(stageTop+(110+95)*p.scale,BFM_PLAY_AREA.top);
 near(stageTop+(110+95+BFM_UI_REFERENCE_HEIGHT)*p.scale,BFM_PLAY_AREA.bottom);
 assert.ok(p.scale>.7,'the initial scene already uses the enlarged UI scale');
 assert.deepEqual(bfmStagePlacement({top:0,height:950}),p,'content measurements no longer affect scale');
});
test('LiDAR view fits the selected physical bounds and shares the background coordinate plane',()=>{
 for(const [width,height] of [[1092,768],[1920,1080],[800,600],[2400,400]]){
  const p=bfmViewportPlacement(width,height,'lidar'),a=BFM_PLAY_AREA;
  const left=p.x+a.left*p.scale,right=p.x+a.right*p.scale;
  const top=p.y+a.top*p.scale,bottom=p.y+a.bottom*p.scale;
  assert.ok(left>=24-1e-7&&right<=width-24+1e-7);
  assert.ok(top>=24-1e-7&&bottom<=height-24+1e-7);
  assert.ok(Math.abs(left-24)<1e-7||Math.abs(top-24)<1e-7,'one axis fills the available area');
  const stage=bfmStagePlacement();near(p.x+stage.x*p.scale,width/2);near(p.y+stage.y*p.scale,height/2);
  near(p.x+a.left/WALL.width*p.backgroundWidth,left);
  near(p.y+a.top/WALL.height*p.backgroundHeight,top);
 }
});
test('Wall view preserves the full right-wall fit; invalid viewport cannot publish coordinates',()=>{
 const p=bfmViewportPlacement(1092,768,'wall');near(p.x,0);near(p.y,(768-1280*1092/4096)/2);
 near(p.backgroundWidth,1092);near(p.x+WALL.width*p.scale,1092);
 for(const value of [0,-1,NaN,Infinity])assert.throws(()=>bfmViewportPlacement(value,768),/Invalid BFM viewport/);
});
