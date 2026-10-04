import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clientContent,CLIENT_TASKS} from '../src/journey-client.mjs';
import {freshSession,reduce,restoreSession} from '../src/journey-state.mjs';
import {routeAssignments,routeSlots,scenarioLayout,scenarioLinks,safeFlightPath,placementFlightPath,routeValid,routeChoices} from '../src/journey-topology.mjs';
import {journeyFieldBounds} from '../src/circle-model.mjs';
import {objectMetrics,placementAt,placementAnchor,intersects} from '../src/journey-radial.mjs';
const content=clientContent(JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url))));
const act=(s,a)=>reduce(s,a,content);

test('client construction allows free movement of MAX and wrong steps, preserving position through restore and replacement',()=>{
 let s=act(freshSession(),{type:'MISSION',id:'blogger'});
 s=act(s,{type:'BEGIN_ROUTE',x:.5,y:.5});
 s=act(s,{type:'PICK',slot:'blog-0',x:.7,y:.6});s=act(s,{type:'PLACE',step:'comments'});
 const assignments=routeAssignments(s);
 s=act(s,{type:'MOVE',step:'comments',x:.18,y:.78});s=act(s,{type:'MOVE',step:'open-max',x:.81,y:.21});
 assert.deepEqual(routeAssignments(s),assignments);assert.equal(s.plans.blogger,'building');
 assert.equal(s.runs.blogger[0].x,.18);assert.equal(s.runs.blogger[0].freePosition,true);
 assert.equal(s.starts.blogger.x,.81);assert.equal(s.starts.blogger.freePosition,true);
 s=act(restoreSession(JSON.stringify({...s,version:1}),content),{type:'MISSION',id:'blogger'});
 assert.equal(s.runs.blogger[0].x,.18);assert.equal(s.runs.blogger[0].freePosition,true);assert.equal(s.starts.blogger.freePosition,true);
 s=act(s,{type:'PICK',slot:'blog-1',x:.7,y:.6});s=act(s,{type:'PLACE',step:'statistics'});
 assert.equal(s.runs.blogger[0].x,.18);
 s=act(s,{type:'EDIT',step:'comments'});s=act(s,{type:'PLACE',step:'channel'});
 const channel=s.runs.blogger.find(o=>o.step==='channel');assert.equal(channel.x,.18);assert.equal(channel.y,.78);assert.equal(channel.freePosition,true);
 s=act(s,{type:'SWAP',step:'channel',target:'statistics'});
 assert.equal(s.runs.blogger.find(o=>o.step==='statistics').x,.18);assert.ok(s.runs.blogger.every(o=>o.freePosition));
});
function start(id){return act(act(freshSession(),{type:'MISSION',id}),{type:'BEGIN_ROUTE',x:.5,y:.5});}
function place(s,slot,step,branch){s=act(s,{type:'PICK',slot,x:.5,y:.5});return act(s,{type:'PLACE',step,branch});}
test('ID offers all icons, then three independent slots; placement is not completion',()=>{
 let s=start('digital-id');assert.deepEqual(routeSlots(s).map(v=>v.id),['create-id']);
 assert.equal(act(s,{type:'PICK',slot:'id-0',x:.5,y:.5}),s);
 s=act(s,{type:'PICK',slot:'create-id',x:.5,y:.5});assert.equal(act(s,{type:'PLACE',step:'age'}).runs['digital-id'][0].step,'age');
 s=act(s,{type:'PLACE',step:'create-id'});assert.equal(routeSlots(s).length,3);
 s=place(s,'id-2','hotel');assert.equal(routeAssignments(s).hotel,'id-2');
 assert.deepEqual(routeSlots(s).map(v=>v.id),['id-0','id-1']);
 s=place(s,'id-0','age');s=place(s,'id-1','benefit');assert.equal(s.plans['digital-id'],'ready');
 assert.ok(s.runs['digital-id'].every(o=>!o.done));s=act(s,{type:'CONTINUE_ROUTE'});
 assert.equal(act(s,{type:'OPEN',step:'hotel'}),s);
 s=act(s,{type:'OPEN',step:'create-id'});for(const _ of CLIENT_TASKS['create-id'])s=act(s,{type:'ANSWER',choice:0});
 s=act(s,{type:'CLOSE'});assert.equal(act(s,{type:'OPEN',step:'hotel'}).task,'hotel');
 const restored=act(restoreSession(JSON.stringify({...s,version:1}),content),{type:'MISSION',id:'digital-id'});
 assert.deepEqual(routeAssignments(restored),routeAssignments(s));assert.deepEqual(restored.runs['digital-id'],s.runs['digital-id']);
});
test('square order, five freely selected communication tasks, business selects one branch',()=>{
 let s=start('blogger');for(const step of ['channel','comments','statistics']){const slot=routeSlots(s)[0];assert.ok(slot.allowed.includes(step));s=place(s,slot.id,step);}
 assert.equal(routeSlots(s).length,0);
 s=start('communication');for(const step of ['story','reaction','message','call','group']){assert.equal(routeSlots(s).length,1);s=place(s,routeSlots(s)[0].id,step);}
 assert.equal(new Set(Object.values(routeAssignments(s))).size,6);assert.equal(routeSlots(s).length,0);
 for(const branch of ['channel','bot','store']){s=start('business');s=place(s,'account','account');assert.equal(routeSlots(s).length,1);assert.equal(routeSlots(s)[0].allowed.length,3);s=place(s,'business-tool','business-'+branch,branch);assert.equal(s.runs.business.length,2);assert.equal(s.plans.business,'ready');}
});
test('templates fit tile+caption safe bounds and retain positions as slots fill',()=>{
 for(const [w,h,compact] of [[1712,405,true],[816,405,true],[1520,780,false],[820,880,false]])for(const mission of ['blogger','digital-id','communication','business']){
  let s=start(mission),prior={};const field=journeyFieldBounds(w,h,compact),metrics=objectMetrics(compact);
  for(let pass=0;pass<7;pass++){
   const layout=scenarioLayout(s,w,h,compact),boxes=[];
   for(const [id,p] of Object.entries(layout.positions)){if(prior[id])assert.deepEqual(p,prior[id]);prior[id]=p;}
   for(const [id,p] of Object.entries(layout.points)){
    const actual=placementAnchor(placementAt(p.x,p.y,field,metrics),field,metrics);
    assert.ok(Math.abs(actual.x-p.x)<.01&&Math.abs(actual.y-p.y)<.01,`${mission}/${id} clipped`);
    const parts=[{x:p.x-metrics.tile/2,y:p.y-metrics.tile/2,w:metrics.tile,h:metrics.tile},{x:p.x-layout.captionWidth/2,y:p.y+metrics.tile/2+8,w:layout.captionWidth,h:compact?56:72}];
    for(const box of parts){assert.ok(box.x>=0&&box.y>=0&&box.x+box.w<=w&&box.y+box.h<=h,`${mission}/${id} outside`);assert.ok(boxes.every(b=>!intersects(box,b,6)),`${mission}/${id} overlaps`);}
    boxes.push(...parts);
   }
   const slot=routeSlots(s)[0];if(!slot)break;const step=slot.allowed[0];s=place(s,slot.id,step,step.startsWith('business-')?step.slice(9):undefined);
  }
 }
});
test('scenario links retain dependencies even when unrelated nodes are closer',()=>{
 const nodes=['open-max','create-id','hotel','benefit','age'].map((step,i)=>({step,id:i,x:i*2,y:0}));
 assert.deepEqual(scenarioLinks('digital-id',nodes).map(l=>[l.a,l.b]),[[0,1],[1,2],[1,3],[1,4]]);
 assert.equal(scenarioLinks('digital-id',nodes,1).length,0);
 assert.equal(scenarioLinks('business',[{step:'open-max',id:1,x:0,y:0},{step:'business-bot',id:2,x:1,y:0}]).length,0);
});
test('flights route around protected icons, fail closed in sealed corridors',()=>{
 const start={x:30,y:100},end={x:370,y:100},obstacle={x:150,y:60,w:80,h:80};
 const path=safeFlightPath(start,end,[obstacle],400,260,20);assert.ok(path.length>1);assert.deepEqual(path.at(-1),end);
 let a=start;for(const b of path){for(let i=0;i<=100;i++){const t=i/100,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;assert.ok(!(x>130&&x<250&&y>40&&y<160));}a=b;}
 assert.equal(safeFlightPath(start,end,[{x:150,y:0,w:80,h:260}],400,260,20),null);
 assert.deepEqual(safeFlightPath(start,end,[],400,260,20),[end]);
});

test('caption clearance cannot block selection; flight still routes around the actual tile',()=>{
 const start={x:30,y:100},end={x:370,y:100},tile={x:150,y:60,w:80,h:80};
 const clearance={x:0,y:0,w:400,h:260};
 assert.equal(safeFlightPath(start,end,[clearance],400,260,20),null);
 const path=placementFlightPath(start,end,[clearance],[tile],400,260,20);
 assert.ok(path.length>1);assert.deepEqual(path.at(-1),end);
 assert.deepEqual(path,safeFlightPath(start,end,[tile],400,260,20));
});

test('even a sealed or overlapping placement has a finite landing path instead of rejecting the icon',()=>{
 const end={x:300,y:100},sealed=[{x:0,y:0,w:400,h:260}];
 for(const start of [{x:20,y:100},end]){
  const path=placementFlightPath(start,end,sealed,sealed,400,260,54);
  assert.deepEqual(path,[end]);assert.ok(path.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 }
});


test('wrong blogger order stays editable, red slot links survive restore, swap corrects it',()=>{
 let s=start('blogger');s=place(s,'blog-0','statistics');s=place(s,'blog-1','comments');
 assert.equal(routeValid(s),false);
 s=act(s,{type:'REVEAL',slot:'blog-2',x:.2,y:.4});assert.equal(s.picker,null);assert.equal(s.runs.blogger.length,3);assert.equal(s.plans.blogger,'building');
 assert.equal(act(s,{type:'CONTINUE_ROUTE'}),s);
 const restored=act(restoreSession(JSON.stringify({...s,version:1}),content),{type:'MISSION',id:'blogger'});
 assert.deepEqual(routeAssignments(restored),routeAssignments(s));
 const assigned=routeAssignments(s),nodes=[{step:'open-max',id:0,x:0,y:0},...s.runs.blogger.map((o,i)=>({...o,slot:assigned[o.step],id:i+1}))];
 assert.ok(scenarioLinks('blogger',nodes).some(l=>!l.correct));
 s=act(s,{type:'SWAP',step:'statistics',target:'channel'});assert.equal(routeValid(s),true);assert.equal(s.plans.blogger,'ready');assert.deepEqual(s.runs.blogger.map(o=>o.stage),[0,0,0]);
 s=act(s,{type:'EDIT',step:'statistics'});assert.ok(s.picker);assert.equal(act(s,{type:'CONTINUE_ROUTE'}),s);
});
test('replacement returns removed icon to choices; picker can swap existing icons',()=>{
 let s=start('blogger');s=place(s,'blog-0','statistics');s=act(s,{type:'EDIT',step:'statistics'});s=act(s,{type:'PLACE',step:'channel'});
 assert.deepEqual(s.runs.blogger.map(o=>o.step),['channel']);assert.ok(routeChoices(s).includes('statistics'));
 s=place(s,'blog-1','statistics');s=act(s,{type:'REVEAL',slot:'blog-2',x:.5,y:.5});
 s=act(s,{type:'EDIT',step:'statistics'});s=act(s,{type:'PLACE',step:'comments'});
 assert.equal(s.runs.blogger.length,3);assert.equal(routeValid(s),true);assert.equal(s.plans.blogger,'ready');
});
test('ID and business allow wrong first choice, then correction without duplicate tools',()=>{
 let s=start('digital-id');s=place(s,'create-id','age');s=place(s,'id-2','create-id');s=place(s,'id-0','benefit');s=act(s,{type:'REVEAL',slot:'id-1',x:.5,y:.5});
 assert.equal(routeValid(s),false);s=act(s,{type:'SWAP',step:'age',target:'create-id'});assert.equal(routeValid(s),true);
 s=start('business');s=place(s,'account','business-bot');assert.deepEqual(routeSlots(s)[0].allowed,['account']);
 s=act(s,{type:'REVEAL',slot:'business-tool',x:.5,y:.5});assert.equal(s.branch,'bot');assert.equal(routeValid(s),false);
 s=act(s,{type:'EDIT',step:'account'});assert.equal(s.picker,null);assert.equal(s.plans.business,'ready');
});
test('direct reveal rejects ambiguous choice; communication accepts every ordering',()=>{
 let s=start('blogger');assert.equal(act(s,{type:'REVEAL',slot:'blog-0',x:.5,y:.5}),s);
 s=start('communication');for(const step of ['story','group','reaction','message'])s=place(s,routeSlots(s)[0].id,step);
 const slot=routeSlots(s)[0];assert.deepEqual(slot.allowed,['call']);s=act(s,{type:'REVEAL',slot:slot.id,x:.5,y:.5});assert.equal(s.picker,null);assert.equal(s.plans.communication,'ready');
});

test('new and final icons retain the chosen free-slot destination through restore',()=>{
 let s=start('blogger');
 s=act(s,{type:'PICK',slot:'blog-0',x:.12,y:.82});s=act(s,{type:'PLACE',step:'channel'});
 s=act(s,{type:'PICK',slot:'blog-1',x:.73,y:.22});s=act(s,{type:'PLACE',step:'comments'});
 s=act(s,{type:'REVEAL',slot:'blog-2',x:.41,y:.61});
 assert.deepEqual(s.runs.blogger.map(o=>[o.x,o.y,o.freePosition]),[[.12,.82,true],[.73,.22,true],[.41,.61,true]]);
 const restored=restoreSession(JSON.stringify({...s,version:1}),content);
 assert.deepEqual(restored.runs.blogger.map(o=>[o.x,o.y,o.freePosition]),s.runs.blogger.map(o=>[o.x,o.y,o.freePosition]));
});
