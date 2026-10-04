import test from 'node:test';
import assert from 'node:assert/strict';
import {guidedIconGeometry,GUIDED_ICON_SCALE} from '../src/journey-icon-scale.mjs';

test('fixed ×2 tile and caption footprint keep the route centre',()=>{
 const g=guidedIconGeometry(560,24,90,952);
 assert.equal(GUIDED_ICON_SCALE,2);
 assert.equal(g.tile,256);
 assert.equal(g.width,256);
 assert.equal(g.height,256);
 assert.equal(g.left+g.width/2,470);
 assert.equal(g.top+100+g.tile/2,500);
});
