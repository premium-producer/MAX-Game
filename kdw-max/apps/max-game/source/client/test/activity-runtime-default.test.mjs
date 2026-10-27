import test from 'node:test';
import assert from 'node:assert/strict';
import {webglActivitiesEnabled} from '../src/activity-webgl/activity-runtime.mjs';
test('Spout uses WebGL by default and preserves explicit DOM rollback',()=>{
 const oldLocation=globalThis.location,oldOutput=globalThis.kdwStandOutput;
 try{
  globalThis.location={search:''};delete globalThis.kdwStandOutput;assert.equal(webglActivitiesEnabled(),false);
  globalThis.kdwStandOutput={};assert.equal(webglActivitiesEnabled(),true);
  globalThis.location.search='?activityRenderer=dom';assert.equal(webglActivitiesEnabled(),false);
  delete globalThis.kdwStandOutput;globalThis.location.search='?activityRenderer=webgl';assert.equal(webglActivitiesEnabled(),true);
 }finally{if(oldLocation===undefined)delete globalThis.location;else globalThis.location=oldLocation;if(oldOutput===undefined)delete globalThis.kdwStandOutput;else globalThis.kdwStandOutput=oldOutput;}
});
