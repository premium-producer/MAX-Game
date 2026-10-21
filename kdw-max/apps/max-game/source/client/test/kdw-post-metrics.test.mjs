import test from 'node:test';
import assert from 'node:assert/strict';
import {postMetrics,formatPostCount,counterProgress} from '../src/kdw-post-metrics.mjs';
test('publication counters grow, settle, and reconstruct from the publication clock',()=>{
 const row={index:2,good:true,elapsedMs:3000};
 assert.equal(postMetrics(row,0).views,1);
 const samples=[3000,4000,8000,20000,100000].map(t=>postMetrics(row,t));
 for(let i=1;i<samples.length;i++)for(const key of ['views','fire','heart'])assert.ok(samples[i][key]>=samples[i-1][key]);
 assert.deepEqual(postMetrics(JSON.parse(JSON.stringify(row)),8000),samples[2]);
 assert.ok(postMetrics({...row,good:false},20000).views<samples[3].views);
 assert.equal(formatPostCount(1200),'1,2К');
 assert.equal(formatPostCount(108),'108');
});
test('reactions finish in 700ms and can wait for a queued thumbnail to land',()=>{
 const row={index:0,good:true,elapsedMs:0};
 assert.equal(counterProgress(350),.875);
 assert.equal(postMetrics(row,5000,0).heart,0);
 assert.equal(postMetrics(row,5000,350).heart,95);
 assert.equal(postMetrics(row,5000,700).heart,108);
 assert.equal(postMetrics(row,5000,700).fire,1200);
 assert.equal(postMetrics(row,100000).heart,postMetrics(row,700).heart);
 assert.equal(postMetrics({...row,good:false},700).heart,3);
});
