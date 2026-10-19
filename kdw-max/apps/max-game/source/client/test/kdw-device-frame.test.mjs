import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deviceFrameSlices} from '../src/kdw-device-frame.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);

test('retained bezel keeps square corner/light patches through phone/PC and height changes',()=>{
 for(const [w,h]of [[160,800],[369.46,800],[1300,800],[270,1200],[700,300]]){
  const parts=deviceFrameSlices(392,800,w,h,72,38);
  for(const i of [0,2,6,8]){assert.equal(parts[i].w,110);assert.equal(parts[i].h,110);}
  for(let row=0;row<3;row++){
   const p=parts.slice(row*3,row*3+3);
   close(p[0].x,-72);close(p[2].x+p[2].w,w+72);
   close(p[0].x+p[0].w,p[1].x);close(p[1].x+p[1].w,p[2].x);
  }
  for(let col=0;col<3;col++){
   const p=[parts[col],parts[col+3],parts[col+6]];
   close(p[0].y,-72);close(p[2].y+p[2].h,h+72);
   close(p[0].y+p[0].h,p[1].y);close(p[1].y+p[1].h,p[2].y);
  }
  assert.ok(parts.every(p=>p.w>=0&&p.h>=0&&p.u0>=0&&p.u1<=1&&p.v0>=0&&p.v1<=1));
 }
});

test('small device clamps radius without inverted patches',()=>{
 const parts=deviceFrameSlices(392,800,50,70,72,38);
 assert.equal(parts[0].w,97);assert.equal(parts[0].h,97);
 assert.ok(parts.every(p=>p.w>=0&&p.h>=0));
});
