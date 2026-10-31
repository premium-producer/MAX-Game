import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLidarFilter,inputFilterOptions} from './lidar-filter.mjs';
const point=(x,y=768)=>({x,y,inside:true});

test('confirmation needs fresh data, not duplicate timestamps or elapsed silence',()=>{
 const f=createLidarFilter();assert.equal(f.update(point(1440),'a',1000),null);assert.equal(f.update(point(1440),'a',1000),null);
 assert.equal(f.update(point(1440),'a',1016),null);assert.equal(f.update(point(1440),'a',1032).point.x,1440);
 f.reset();assert.equal(f.update(point(1700),'b',2000),null);assert.equal(f.snapshot().point,null);
});

test('fast continuous motion follows the hand without a long averaging tail',()=>{
 const f=createLidarFilter();let result;
 for(let i=0;i<65;i++){const x=900+16*i;result=f.update(point(x),'a',1000+i*16);}
 assert.ok(result.point.x>1850,JSON.stringify(result));assert.ok(result.point.x<=1924);
});

test('isolated large spike is suppressed and a persistent relocation is accepted without interpolation',()=>{
 const f=createLidarFilter();for(let i=0;i<3;i++)f.update(point(1000),'a',1000+i*16);
 assert.equal(f.update(point(2000),'a',1048),null);assert.equal(f.update(point(1000),'a',1064).point.x,1000);
 for(let i=0;i<3;i++){const r=f.update(point(2000),'a',1080+i*16);if(i===2){assert.equal(r.point.x,2000);assert.equal(r.restart,true);}}
});

test('stale timestamps cannot contaminate speed and a long gap requires reconfirmation',()=>{
 const f=createLidarFilter();for(let i=0;i<3;i++)f.update(point(1000),'a',1000+i*16);
 assert.equal(f.update(point(2000),'a',1001),null);assert.equal(f.update(point(NaN),'a',1040),null);
 assert.deepEqual(f.update(point(1700),'a',1400),{cancel:true});assert.equal(f.update(point(1700),'a',1416),null);assert.equal(f.update(point(1700),'a',1432).point.x,1700);
});

test('filter settings reject invalid values and inherited/unknown keys',()=>{
 for(const value of [null,[],{enabled:'yes'},{minCutoff:0},{beta:-1},{confirmMs:NaN},{unknown:1},{toString:1}])assert.throws(()=>inputFilterOptions(value));
 assert.equal(inputFilterOptions({enabled:false}).enabled,false);
});

test('a fast swipe starts during motion instead of requiring the hand to stop',()=>{
 const f=createLidarFilter();let starts=0,result;
 for(let i=0;i<30;i++){result=f.update(point(800+40*i),'a',1000+i*16);if(result?.restart)starts++;}
 assert.equal(starts,1);assert.ok(result.point.x>1850);assert.equal(f.snapshot().pending,false);
});

test('alternating unconfirmed ghosts cannot keep an abandoned accepted touch held forever',()=>{
 const f=createLidarFilter();for(let i=0;i<3;i++)f.update(point(1000),'a',1000+i*16);
 let cancelled=false;for(let i=0;i<20;i++){const r=f.update(point(i%2?1900:2100),i%2?'b':'c',1048+i*16);cancelled||=!!r?.cancel;}
 assert.equal(cancelled,true);assert.equal(f.snapshot().point,null);
});


test('8 Hz fresh contacts confirm with the production gap default',()=>{
 const f=createLidarFilter();assert.equal(f.update(point(1440),'a',1000),null);
 assert.equal(f.update(point(1440),'a',1125).point.x,1440);
 assert.ok(f.update(point(1450),'a',1250).point);
});
