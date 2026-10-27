import test from 'node:test';
import assert from 'node:assert/strict';
import {hit,flightPose,phoneLayout,slotPose,wrapText,textureBytes,generationKey} from '../src/activity-webgl/activity-model.mjs';
import {createActivityTrails} from '../src/activity-webgl/activity-trails.mjs';
test('GPU input uses visible order, clipping and the same rotation as drawing',()=>{
 const a={id:'back',x:10,y:10,w:100,h:100,interactive:true},b={...a,id:'front',clip:{x:50,y:50,w:20,h:20}};
 assert.equal(hit({x:60,y:60},[a,b]).id,'front');assert.equal(hit({x:20,y:20},[a,b]).id,'back');
 assert.equal(hit({x:60,y:60},[{...b,interactive:false}]),null);
 const rotated={x:0,y:0,w:100,h:20,rotation:Math.PI/2,interactive:true};
 assert.ok(hit({x:50,y:40},[rotated]));assert.equal(hit({x:10,y:10},[rotated]),null);
 assert.equal(hit({x:10,y:10},[{...a,radius:20}]),null);
});
test('Flight starts at the captured picture and lands exactly in the resized target',()=>{
 const from={x:500,y:20,w:200,h:100,radius:12},to={x:150,y:200,w:110,h:60,radius:6};
 const first=flightPose(from,to,0),last=flightPose(from,to,1);
 for(const key of ['x','y','w','h','radius']){assert.equal(first[key],from[key]);assert.ok(Math.abs(last[key]-to[key])<1e-9);}
 assert.ok(flightPose(from,to,.5).y<(from.y+to.y)/2);
});
test('Phone content and scroll are calculated in a single viewport coordinate system',()=>{
 const records=new Map([['p',{stored:{h:400}}]]),rows=[{postId:'p',spawnId:'1'},{postId:'p',spawnId:'2'}];
 const l=phoneLayout('posts',{x:100,y:50,width:195,height:400},records,rows);
 assert.equal(l.scale,.5);assert.equal(l.slots.get('2').y,414);assert.ok(l.maxScroll>0);
 const p=slotPose(l,l.slots.get('2'),l.maxScroll);assert.ok(p.y+p.h<=l.clip.y+l.clip.h);
 const store=phoneLayout('store',{x:0,y:0,width:390,height:800},records,rows);
 assert.equal(store.slots.get('1').y,store.slots.get('2').y);assert.equal(store.slots.get('2').x,199);
});
test('Text preparation respects explicit lines and nonbreaking spaces',()=>{
 const ctx={measureText:t=>({width:[...t].length})};
 assert.deepEqual(wrapText(ctx,'Кофе\nна\u00a0максимум',20),['Кофе','на\u00a0максимум']);
 assert.deepEqual(wrapText(ctx,'Один два три',8),['Один два','три']);
});
test('Resource accounting includes mipmaps and input generations include run and screen',()=>{
 assert.equal(textureBytes(1024,1024),5592406);assert.equal(textureBytes(1024,1024,false),4194304);
 assert.notEqual(generationKey({sessionId:'a',runId:1}),generationKey({sessionId:'a',runId:2}));
});
test('GPU trails are bounded, hold on a paused clock and clear for reduced motion',()=>{
 const trails=createActivityTrails(),sources=Array.from({length:30},(_,i)=>({x:i*70,y:900,w:300}));
 const first=trails.update(sources,1000,3072,1536,1);assert.ok(first.length>0&&first.length<=3600);
 assert.deepEqual(trails.update([],1000,3072,1536,1),first);
 assert.deepEqual(trails.update(sources,1100,3072,1536,1,true),[]);
});
