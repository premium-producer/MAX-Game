import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clientContent} from '../src/journey-client.mjs';
import {taskFor} from '../src/journey-tasks.mjs';
import {RevealJourney,revealLayout,revealPhoneLayout,revealRing,revealArc,revealLaunchPoint,revealLaunchInterval,revealLaunchTime,revealBurstDuration,revealArrangeEnd,REVEAL_TIMING,REVEAL_MOTION,revealTracePresence,revealTimerLabel} from '../src/journey-guided-reveal.mjs';
import {IconMotion} from '../src/journey-motion.mjs';
import {phoneLaneCurves} from '../src/journey-guided-line.mjs';
const content=clientContent(JSON.parse(fs.readFileSync(new URL('../public/config/client-missions.json',import.meta.url))));
test('three-minute clock runs through drag/transitions, pauses hidden and survives restore',()=>{
 const g=new RevealJourney(content);g.select('blogger');assert.equal(revealTimerLabel(g.secondsLeft),'3:00');
 tick(g,1.2,{busy:true,dragging:true});assert.equal(revealTimerLabel(g.secondsLeft),'2:59');
 const left=g.secondsLeft;tick(g,10,{active:false});assert.equal(g.secondsLeft,left);
 const h=new RevealJourney(content,g.serialize());assert.equal(h.secondsLeft,left);h.remaining.blogger=.5;
 const token=h.token();tick(h,.6,{busy:true,dragging:true});assert.equal(h.session.screen,'missions');assert.equal(h.session.task,null);assert.equal(h.expired,true);assert.equal(revealTimerLabel(h.secondsLeft),'0:00');assert.equal(h.answer(0,token),false);
 h.select('blogger');assert.equal(h.secondsLeft,180);
});
test('restart resets only selected mission and invalidates the old answer token',()=>{
 const g=new RevealJourney(content);g.select('digital-id');g.scanned['digital-id']=true;g.populate();g.move('create-id',850,40);g.select('business');g.scanned.business=true;g.populate();g.session.branch='bot';g.session.branchChosen=true;g.remaining.business=12;g.reached.business=['account'];g.session.completed=['business'];
 const token=g.token();assert.equal(g.restart(),true);assert.equal(g.phase,'palm');assert.equal(g.nodes.length,0);assert.equal(g.secondsLeft,180);assert.equal(g.session.branch,null);assert.deepEqual(g.session.completed,[]);assert.equal(g.answer(0,token),false);
 g.select('digital-id');assert.equal(g.scanned['digital-id'],true);assert.equal(g.nodes.find(n=>n.step==='create-id').worldX,850);
});
test('manual closing never cancels an incomplete phone or business choice',()=>{
 const g=new RevealJourney(content);g.select('blogger');
 for(const phase of ['trace','phone-enter','task','branch','result','phone-exit']){g.phase=phase;g.session.task='channel';const token=g.token(),epoch=g.epoch;assert.equal(g.close(),false);assert.equal(g.phase,phase);assert.equal(g.session.task,'channel');assert.equal(g.token(),token);assert.equal(g.epoch,epoch);}
});
test('phone screen stays mounted when the task answer token becomes active',()=>{
 const g=begin();until(g,['phone-enter']);
 const screen=g.phoneContentKey,token=g.token();assert.match(token,/:null:/);
 until(g,['task']);assert.notEqual(g.token(),token);assert.equal(g.phoneContentKey,screen);
 g.answer(0);assert.notEqual(g.phoneContentKey,screen);
});
test('a missed visual settle acknowledgement cannot strand the ID phone entrance',()=>{
 for(const hz of [30,60,120]){
  const g=begin('digital-id');until(g,['phone-enter']);
  for(let i=0;i<hz;i++)tick(g,1/hz,{settled:false,dragging:true});
  assert.equal(g.phase,'phone-enter');
  for(let i=0;i<hz*5&&g.phase==='phone-enter';i++)tick(g,1/hz,{settled:false});
  assert.equal(g.phase,'task');assert.equal(g.session.task,'create-id');
 }
});
const tick=(g,dt=.1,opts={})=>g.tick(dt,{settled:true,...opts});
function until(g,phase){for(let i=0;i<200&&!phase.includes(g.phase);i++)tick(g);assert.ok(phase.includes(g.phase),g.phase);}
function begin(id='blogger'){const g=new RevealJourney(content);g.configure(1552,952);g.select(id);assert.equal(g.phase,'palm');g.down(1);for(let i=0;i<8;i++)tick(g,.1,{dragging:true});assert.equal(g.phase,'burst');return g;}

test('all missions/branches complete with all nodes revealed but zero early credit',()=>{
 for(const m of content.missions)for(const branch of m.branches?['channel','bot','store']:[null])for(const variant of [0,1,2]){
  const g=begin(m.id);assert.equal(g.nodes.length,1+g.steps.length);assert.ok(g.nodes.slice(1).every(n=>!n.done));
  let safety=0;while(g.phase!=='complete'&&safety++<30){until(g,['task','branch','complete']);if(g.phase==='complete')break;
   if(g.phase==='branch'){assert.equal(g.choose(branch),true);continue;}
   const id=g.activeId;while(g.phase==='task'){const t=taskFor(g.current,content);assert.ok(t,id);g.answer(t.correct==='*'?variant%t.options.length:t.correct);}
   assert.equal(g.phase,'result');assert.equal(g.activeId,id);assert.ok(g.current.done);tick(g,.1,{dragging:true});assert.equal(g.phase,'result');
  }assert.equal(g.phase,'complete',`${m.id}/${branch}`);assert.ok(g.session.completed.includes(m.id));
 }
});
test('scan cancels early/leave/hidden and only owner can hold; reduced motion keeps .8s',()=>{
 const g=new RevealJourney(content);g.select('blogger');g.down(1);assert.equal(g.down(2),false);tick(g,.1,{dragging:true});g.moveContact(1,false);assert.equal(g.phase,'palm');assert.equal(g.nodes.length,0);
 g.down(2);for(let i=0;i<7;i++)tick(g,.1,{reduced:true,dragging:true});assert.equal(g.phase,'holding');tick(g,.1,{reduced:true,dragging:true});assert.equal(g.phase,'burst');
 const h=new RevealJourney(content);h.select('blogger');h.down(3);tick(h,.1,{active:false});assert.equal(h.phase,'palm');
});

test('link tracing overlaps the icon shift and flows directly into the phone; next edge waits for its exit',()=>{
 for(const hz of [30,60,120]){
  const g=begin(),dt=1/hz;
  until(g,['trace']);assert.ok(g.nodes.every(n=>!g.captionVisible(n)));
  assert.deepEqual(g.edges(),[{a:'open-max',b:'channel',revealing:true}]);
  assert.equal(g.spread,true);assert.ok(Object.values(g.phoneLayout.offsets).some(Boolean));
  tick(g,dt,{settled:false});assert.equal(g.phase,'trace');assert.equal(g.phoneVisible,false);
  while(g.phase==='trace')tick(g,dt,{settled:false});
  assert.equal(g.phase,'phone-enter');assert.equal(g.phoneVisible,true);assert.ok(g.captionVisible(g.nodes[0]));assert.ok(g.captionVisible(g.current));assert.equal(g.captionVisible(g.nodes[2]),false);
  until(g,['task']);while(g.phase==='task'){const t=taskFor(g.current,content);g.answer(t.correct==='*'?0:t.correct);}
  const next=g.nodes.find(n=>n.step===g.next.id),old=[{a:'open-max',b:'channel'}];
  for(const phase of ['result','phone-exit']){until(g,[phase]);assert.deepEqual(g.edges(),old);assert.equal(g.captionVisible(next),false);assert.equal(g.phoneVisible,true);}
  for(let i=0;i<hz;i++)tick(g,dt,{settled:false});assert.equal(g.phase,'phone-exit');assert.deepEqual(g.edges(),old);
  tick(g,dt);assert.equal(g.phase,'trace');assert.equal(g.activeId,'comments');assert.equal(g.phoneVisible,false);assert.equal(g.captionVisible(next),false);
  assert.deepEqual(g.edges(),[...old,{a:'channel',b:'comments',revealing:true}]);
  until(g,['phone-enter']);assert.equal(g.captionVisible(next),true);
 }
});

test('link and phone-bundle presence ease continuously from zero to full visibility',()=>{
 const values=Array.from({length:121},(_,i)=>revealTracePresence(i/120));
 assert.equal(values[0],0);assert.equal(values.at(-1),1);
 assert.ok(values.every((value,i)=>i===0||value>=values[i-1]));
 assert.ok(values[30]<.25&&values[90]>.75);
 assert.equal(revealTracePresence(-1),0);assert.equal(revealTracePresence(2),1);
});

test('reveal field motion uses a measured spring without slowing direct drag',()=>{
 const base={x:240,y:0,size:128,radius:28,planning:true};
 const regular=new IconMotion({x:0,y:0,size:128,radius:28});
 const reveal=new IconMotion({x:0,y:0,size:128,radius:28});
 regular.step(.1,base);reveal.step(.1,{...base,movementOmega:REVEAL_MOTION.fieldOmega});
 assert.ok(reveal.x.value>0&&reveal.x.value<regular.x.value);
 const dragged=new IconMotion({x:0,y:0,size:128,radius:28});
 const direct=new IconMotion({x:0,y:0,size:128,radius:28});
 dragged.step(.1,{...base,movementOmega:REVEAL_MOTION.fieldOmega,dragging:true});
 direct.step(.1,{...base,dragging:true});
 assert.equal(dragged.x.value,direct.x.value);
});

test('unconnected captions stay hidden through restore, cancellation and reduced motion',()=>{
 const g=begin();assert.ok(g.nodes.every(n=>!g.captionVisible(n)));until(g,['arrange']);assert.ok(g.nodes.every(n=>!g.captionVisible(n)));
 until(g,['task']);assert.equal(g.close(),false);const h=new RevealJourney(content,g.serialize());
 assert.equal(h.captionVisible(h.current),true);assert.equal(h.captionVisible(h.nodes[2]),false);
 h.resume(h.activeId);until(h,['task']);while(h.phase==='task'){const t=taskFor(h.current,content);h.answer(t.correct==='*'?0:t.correct);}
 until(h,['trace']);assert.equal(h.activeId,'comments');assert.equal(h.captionVisible(h.current),false);
 tick(h,.01,{reduced:true});assert.equal(h.phase,'phone-enter');assert.equal(h.captionVisible(h.current),true);
});
test('actual landing gates reveal and drag pauses transitions; cancel cannot open stale task',()=>{
 const g=begin();until(g,['arrange']);for(let i=0;i<30;i++)tick(g,.1,{settled:false});assert.equal(g.phase,'arrange');until(g,['phone-enter']);
 const phase=g.phase;for(let i=0;i<20;i++)tick(g,.1,{dragging:true});assert.equal(g.phase,phase);assert.equal(g.close(),false);assert.equal(g.phase,phase);g.menu();g.select('blogger');assert.equal(g.phase,'paused');assert.equal(g.session.task,null);for(let i=0;i<20;i++)tick(g);assert.equal(g.phase,'paused');
 assert.equal(g.resume('statistics'),false);assert.ok(g.resume(g.activeId));until(g,['task']);const token=g.token();g.menu();assert.equal(g.answer(0,token),false);
});
test('wrong ID answer and repeated stale answers do not advance',()=>{
 const g=begin('digital-id');until(g,['task']);let t=taskFor(g.current,content);let steps=0;while(t.correct==='*'&&steps++<10){g.answer(0);t=taskFor(g.current,content);}assert.notEqual(t.correct,'*');
 const stage=g.current.stage;g.answer((t.correct+1)%t.options.length);assert.equal(g.current.stage,stage);assert.equal(g.phase,'task');
 const token=g.token();g.answer(t.correct);assert.equal(g.answer(t.correct,token),false);
});
test('restore keeps answers/base positions and pauses without rescan or phone',()=>{
 const g=begin();until(g,['task']);g.move('channel',1234,91);g.movePhone(1460,-22);g.answer(0);const restored=new RevealJourney(content,g.serialize());
 assert.equal(restored.phase,'paused');assert.equal(restored.session.task,null);assert.deepEqual(restored.current.answers,[0]);assert.equal(restored.current.worldX,1234);assert.equal(restored.current.worldY,91);assert.equal(restored.phone.y,-22);assert.equal(restored.phoneVisible,false);
 const no=new RevealJourney(content,{guidedVersion:1});assert.equal(no.phase,'menu');
});
test('result ignores manual closing and automatically advances once',()=>{
 const g=begin();until(g,['task']);while(g.phase==='task'){const t=taskFor(g.current,content);g.answer(t.correct==='*'?0:t.correct);}assert.equal(g.close(),false);until(g,['task']);assert.equal(g.activeId,'comments');assert.equal(g.session.task,'comments');
});
test('phone insertion preserves saved coordinates and side-neighbour distances',()=>{
 for(const m of content.missions){const g=begin(m.id);const points=revealLayout(m.id,g.steps,1552,952);assert.equal(Object.keys(points).length,g.nodes.length);
  for(const active of g.nodes.slice(1)){const before=g.nodes.map(n=>[n.worldX,n.worldY]),layout=revealPhoneLayout(g.nodes,active,1552,952);assert.deepEqual(g.nodes.map(n=>[n.worldX,n.worldY]),before);
   const shifted=g.nodes.filter(n=>layout.offsets[n.step]);if(shifted.length>1)assert.equal(new Set(shifted.map(n=>layout.offsets[n.step])).size,1);
   for(const n of g.nodes){const x=n.worldX+layout.offsets[n.step];assert.ok(x+120<=layout.phone.x-196-399.9||x-120>=layout.phone.x+196+399.9,`${m.id}/${active.step}/${n.step}`);}
  }
 }
});
test('local ×2 tiles keep a 400px gap to the inserted phone',()=>{
 const g=begin('blogger');g.configure(1552,952,256);
 const layout=g.phoneLayout,phoneLeft=layout.phone.x-g.phoneMetrics.width/2;
 assert.equal(phoneLeft-(g.current.worldX+128),400);
 for(const n of g.nodes.slice(g.nodes.indexOf(g.current)+1)){
  const shiftedLeft=n.worldX+layout.offsets[n.step]-128;
  assert.ok(shiftedLeft>=layout.phone.x+g.phoneMetrics.width/2+400);
 }
});
test('five phone ports cover 10–90 percent of its full height',()=>{
 const a={x:0,y:330,w:128,h:128,radius:30},b={x:420,y:0,w:392,h:800,radius:38};const {curves}=phoneLaneCurves(a,b);assert.deepEqual(curves.map(c=>c.end.y),[80,240,400,560,720]);assert.equal(new Set(curves.map(c=>c.end.y)).size,5);
});
test('PC insertion reserves its actual width, distributes ports and restores base coordinates',()=>{
 const g=begin('business');assert.equal(g.phoneMetrics.kind,'pc');const original=g.nodes.map(n=>[n.worldX,n.worldY]);
 const layout=g.phoneLayout,w=g.phoneMetrics.width,h=g.phoneMetrics.height;
 for(const n of g.nodes){const x=n.worldX+layout.offsets[n.step];assert.ok(x+120<=layout.phone.x-w/2-399.9||x-120>=layout.phone.x+w/2+399.9);}
 assert.deepEqual(g.nodes.map(n=>[n.worldX,n.worldY]),original);
 const {curves}=phoneLaneCurves({x:0,y:100,w:128,h:128,radius:30},{x:600,y:0,w,h,radius:28});assert.deepEqual(curves.map(c=>c.end.y),[56,168,280,392,504]);
 g.menu();g.select('business');assert.deepEqual(g.nodes.map(n=>[n.worldX,n.worldY]),original);
});
test('business drag survives same-step restore, then resets before the next branch',()=>{
 const g=begin('business');g.move('business-tool',1270,88);g.menu();g.select('business');assert.equal(g.placeholder.worldX,1270);
 const restored=new RevealJourney(content,g.serialize());assert.equal(restored.placeholder.worldY,88);assert.equal(restored.phase,'paused');restored.resume(restored.activeId);until(restored,['task']);
 while(restored.phase==='task'){const t=taskFor(restored.current,content);restored.answer(t.correct==='*'?0:t.correct);}until(restored,['branch']);restored.choose('bot');restored.configure(1552,952);assert.equal(restored.current.worldX,revealLayout('business',restored.steps,1552,952)[restored.current.step].x);assert.equal(restored.current.worldY,0);assert.equal(restored.nodes.some(n=>n.step==='business-tool'),false);
});
test('overlapping births have delayed starts and do not fly invisibly before their turn',()=>{
 const g=begin();const [a,b,c]=g.nodes;
 assert.equal(revealLaunchInterval(),.25);assert.equal(revealLaunchTime(1),.78);assert.equal(revealLaunchTime(2),1.03);
 const maxRing=revealRing(0,g.nodes.length,1552);assert.equal(maxRing.worldX,1552/2);assert.equal(maxRing.worldY,-260);
 for(const time of [.01,.2,.5,.78,.9]){g.elapsed=time;const p=g.pose(a);assert.ok(Math.abs(p.worldX-1552/2)<.001);assert.ok(p.worldY<=0&&p.worldY>=maxRing.worldY);}
 g.elapsed=.1;assert.ok(g.presence(a)>0&&g.presence(a)<1);assert.equal(g.presence(b),0);assert.deepEqual(g.pose(b),revealLaunchPoint(1,g.nodes.length,1552));
 g.elapsed=revealLaunchTime(1)+.03;assert.ok(g.presence(a)===1);assert.ok(g.presence(b)>0&&g.presence(b)<1);assert.equal(g.presence(c),0);
 const maxNearLanding=g.pose(a);assert.ok(Math.hypot(maxNearLanding.worldX-revealRing(0,g.nodes.length,1552).worldX,maxNearLanding.worldY-revealRing(0,g.nodes.length,1552).worldY)<12);
 g.elapsed=1.06;const driftA=g.pose(a);g.elapsed=1.13;const driftB=g.pose(a);assert.ok(Math.hypot(driftA.worldX-driftB.worldX,driftA.worldY-driftB.worldY)>.1);
 g.elapsed=revealBurstDuration(g.nodes.length);tick(g,.01,{settled:false});assert.equal(g.phase,'burst');tick(g,.01);assert.equal(g.phase,'arrange');
 assert.deepEqual(g.pose(a),revealRing(0,g.nodes.length,1552));
 tick(g,.1);assert.equal(g.phase,'arrange');assert.notDeepEqual(g.pose(a),revealRing(0,g.nodes.length,1552));
});
test('arc phase starts on the ring and ends in an ordered row without a phase jump',()=>{
 for(const m of content.missions){const g=begin(m.id);until(g,['arrange']);const start=g.pose(g.nodes[0]),ring=revealRing(0,g.nodes.length,1552);assert.deepEqual(start,ring);
  const target=g.nodes[0];g.elapsed=REVEAL_TIMING.arrange/2;const mid=g.pose(target),straight={x:(ring.worldX+target.worldX)/2,y:(ring.worldY+target.worldY)/2};assert.ok(Math.hypot(mid.worldX-straight.x,mid.worldY-straight.y)>50);
  g.elapsed=10;g.nodes.forEach(n=>assert.deepEqual(g.pose(n),{worldX:n.worldX,worldY:n.worldY}));tick(g,.01);assert.equal(g.phase,'trace');
  assert.equal(new Set(g.nodes.map(n=>n.worldY)).size,1);assert.ok(g.nodes.every((n,i)=>!i||n.worldX-g.nodes[i-1].worldX===640));
 }
 const a={worldX:0,worldY:-200},b={worldX:500,worldY:0};assert.deepEqual(revealArc(a,b,0),a);assert.deepEqual(revealArc(a,b,1),b);
});
test('ring enters non-crossing arcs without an idle hold in all missions',()=>{
 for(const width of [1024,1552,4096])for(const m of content.missions){const g=begin(m.id);g.configure(width,width===4096?1280:952);const count=g.nodes.length,burst=revealBurstDuration(count);
  assert.equal(revealArrangeEnd(count),burst+REVEAL_TIMING.arrange);
  const ring=g.nodes.map((_,i)=>revealRing(i,count,width));assert.ok(Math.abs(ring[0].worldX-width/2)<.001);assert.equal(ring[0].worldY,-260);assert.ok(ring.slice(1).every(p=>p.worldY>ring[0].worldY));assert.ok(ring.some(p=>p.worldX<width/2)&&ring.some(p=>p.worldX>width/2));if(count>3)assert.ok(ring.some(p=>p.worldY>0));
  for(const phase of ['burst','arrange']){const duration=phase==='burst'?burst:REVEAL_TIMING.arrange;
   for(let time=0;time<=duration;time+=.01){g.phase=phase;g.elapsed=time;assert.deepEqual(g.edges(),[]);
    const visible=g.nodes.map((node,i)=>({i,pose:g.pose(node),presence:g.presence(node)})).filter(n=>n.presence>.5);
    for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
     const a=visible[i].pose,b=visible[j].pose;
     assert.ok(Math.hypot(a.worldX-b.worldX,a.worldY-b.worldY)>150,`${width}/${m.id}/${phase}/${time.toFixed(2)}: ${visible[i].i},${visible[j].i}`);
    }
    if(phase==='arrange')for(let i=2;i<visible.length;i++)assert.ok(visible[i].pose.worldX>visible[i-1].pose.worldX,`${m.id}/${time.toFixed(2)}`);
   }
  }
 }
});
test('drag during the arc preserves the grabbed pose and pauses the remaining schedule',()=>{
 const g=begin();until(g,['arrange']);tick(g,.3);g.move('channel',900,77);const elapsed=g.elapsed;
 for(let i=0;i<8;i++)tick(g,.1,{dragging:true});assert.equal(g.elapsed,elapsed);assert.equal(g.pose(g.current).worldY,77);
 until(g,['task']);assert.equal(g.close(),false);assert.equal(g.current.worldY,77);const h=new RevealJourney(content,g.serialize());assert.equal(h.current.worldX,900);assert.equal(h.current.worldY,77);
});
test('legacy compositions become a row while custom positions and answers survive',()=>{
 const g=begin();until(g,['task']);g.answer(0);const saved=JSON.parse(g.serialize());delete saved.layoutVersion;delete saved.manualNodes;
 saved.positions.blogger={'open-max':{x:776,y:-250},channel:{x:1076,y:-20},comments:{x:845,y:88},statistics:{x:476,y:-20}};
 const h=new RevealJourney(content,saved);assert.equal(h.phase,'paused');assert.deepEqual(h.current.answers,[0]);assert.equal(h.nodes[0].worldX,140);assert.equal(h.current.worldX,780);assert.equal(h.current.worldY,0);
 const custom=h.nodes.find(n=>n.step==='comments');assert.equal(custom.worldX,845);assert.equal(custom.worldY,88);
 h.configure(1712,1027);assert.equal(custom.worldY,88);assert.equal(h.current.worldY,0);
});
test('row links are demonstration order, including ID applications',()=>{
 const g=begin('digital-id');g.steps.forEach(s=>g.reach(s.id));assert.deepEqual(g.edges(),[{a:'open-max',b:'create-id'},{a:'create-id',b:'hotel'},{a:'hotel',b:'benefit'},{a:'benefit',b:'age'}]);
});
test('existing pose owners follow curved targets consistently at 30/60/120 Hz',()=>{
 const times=[];for(const hz of [30,60,120]){const g=begin('communication'),owners=new Map();let time=0;
  while(g.phase!=='trace'&&time<12){
   for(const n of g.nodes){if(g.presence(n)===0&&!owners.has(n.step))continue;
    if(!owners.has(n.step))owners.set(n.step,new IconMotion({x:776,y:0,size:128,radius:30}));
    const m=owners.get(n.step),p=g.pose(n);m.step(1/hz,{x:p.worldX,y:p.worldY,size:128,radius:30,badgeVisible:false,time});
   }
   const settled=g.nodes.every(n=>owners.has(n.step)&&!owners.get(n.step).connectionsMoving);tick(g,1/hz,{settled});time+=1/hz;
  }
  assert.equal(g.phase,'trace');for(const n of g.nodes){const m=owners.get(n.step);assert.ok(Math.hypot(m.x.value-n.worldX,m.y.value-n.worldY)<2);}
  times.push(time);
 }assert.ok(Math.max(...times)-Math.min(...times)<.15,JSON.stringify(times));
});
test('phase timing is consistent at 30/60/120 Hz and reduced motion preserves sequence',()=>{
 const times=[];for(const hz of [30,60,120]){const g=begin();let time=0;while(g.phase!=='task'&&time<10){tick(g,1/hz);time+=1/hz;}assert.equal(g.phase,'task');times.push(time);}assert.ok(Math.max(...times)-Math.min(...times)<.15);
 const g=begin();for(let i=0;i<20&&g.phase!=='task';i++)tick(g,.01,{reduced:true});assert.equal(g.phase,'task');assert.equal(g.current.done,false);
});


test('equal 400px edge gaps around icons and either device size',()=>{
 for(const nodeWidth of [240,256])for(const width of [392,880]){
  const nodes=[0,1,2,3].map(i=>({step:String(i),worldX:140+i*(nodeWidth+400),worldY:0}));
  const plan=revealPhoneLayout(nodes,nodes[1],1760,1024,null,true,{width},nodeWidth);
  assert.equal(nodes[1].worldX-nodes[0].worldX-nodeWidth,400);
  assert.equal(plan.phone.x-width/2-(nodes[1].worldX+nodeWidth/2),400);
  assert.equal(nodes[2].worldX+plan.offsets['2']-nodeWidth/2-(plan.phone.x+width/2),400);
  assert.equal(nodes[3].worldX+plan.offsets['3']-(nodes[2].worldX+plan.offsets['2'])-nodeWidth,400);
 }
});
