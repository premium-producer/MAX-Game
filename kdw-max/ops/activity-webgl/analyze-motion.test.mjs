import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeMotion} from './analyze-motion.mjs';

function fixture(){
 return {tag:'synthetic',kind:'posts',viewport:{width:3072,height:1536},start:0,end:1200,longTasks:[],visibility:[],errors:[],samples:Array.from({length:121},(_,i)=>({id:i,t:i*10,frameTime:i*10,interactive:true,visible:true,cards:[{id:'a',x:100,y:100+i*2,w:100,h:100}]}))};
}
test('constant velocity with exact frame timestamps passes',()=>{const r=analyzeMotion(fixture());assert.equal(r.passed,true);assert.equal(r.frameMs.p99,10);assert.equal(r.motion.maxVelocityChange,0);});
test('backward movement is rejected',()=>{const log=fixture();log.samples[50].cards[0].y-=40;assert.equal(analyzeMotion(log).passed,false);assert.ok(analyzeMotion(log).motion.backward>0);});
test('horizontal jump is rejected',()=>{const log=fixture();log.samples[50].cards[0].x+=10;assert.ok(analyzeMotion(log).motion.horizontalJumps>0);assert.equal(analyzeMotion(log).passed,false);});
test('long frame and browser errors fail the check',()=>{const log=fixture();for(let i=60;i<log.samples.length;i++)log.samples[i].frameTime+=60;assert.equal(analyzeMotion(log).passed,false);const errorLog=fixture();errorLog.errors.push({message:'context lost'});assert.equal(analyzeMotion(errorLog).passed,false);});
