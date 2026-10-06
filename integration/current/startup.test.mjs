import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
for(const profile of ['stand','client']){
 const dir=new URL(`./code/${profile}/src/`,import.meta.url);
 const {V5RevealJourney}=await import(new URL('journey-v5-route-layout.mjs',dir));
 const {sharedRevealContent}=await import(new URL('journey-shared-reveal.mjs',dir));
 const {V5_MISSION_CATALOG:catalog}=await import(new URL('journey-v5-backend.mjs',dir));
 const {IconMotion}=await import(new URL('journey-motion.mjs',dir));
 const {createMissionSessionApplication}=await import(new URL('../vendor/backend-figma-v2/src/application/mission-session.mjs',dir));
 const {createWebGLSession}=await import(new URL('application/webgl-session.mjs',dir));
 const {createMemoryPersistencePort}=await import(new URL('../vendor/backend-figma-v2/src/application/memory-persistence.mjs',dir));
 const main=await fs.readFile(new URL('journey-guided-main.js',dir),'utf8');
 const expression=main.match(/const settled=(.*);/)[1];
 const renderer=await fs.readFile(new URL('journey-webgl-ui.mjs',dir),'utf8');
 const body=renderer.match(/isSettled\(host,id\)\{([^\n]*?)\},/)[1];
 assert.match(main,/const settlingNodes=bfmVisual\?controller.settlingNodes:controller.nodes;/);
 async function fixture(mission){
  let now=1000,c;const app=createMissionSessionApplication({catalog,persistence:createMemoryPersistencePort(),now:()=>now});
  const session=createWebGLSession({catalog,port:app,sessionId:`gate-${profile}-${mission}`,onSnapshot:s=>c?.accept(s),onError:assert.fail});
  await session.start();c=new V5RevealJourney(sharedRevealContent(catalog),session);c.configure(3200,1800,256);
  await session.command('SELECT_MISSION',{missionId:mission});await session.contact('hand','down',true);now+=800;await app.pollTime(session.snapshot.state.sessionId);await session.contact('hand','up',true);
  const host={},zone=new Map(),motions={zones:new Map([[host,zone]])};
  const isSettled=vm.runInNewContext(`(host,id)=>{${body}}`,{motions});
  const context={controller:c,revealMode:true,bfmVisual:true,foreground:{isSettled},host,phoneX:{at:()=>true},phoneY:{at:()=>true},phonePresence:{at:()=>true},phoneTarget:1,phoneReady:true,inlinePhone:true,current:c.current.step};
  const settle=(nodes=c.settlingNodes)=>vm.runInNewContext(expression,{...context,settlingNodes:nodes});
  const render=()=>{for(const n of c.nodes)if(c.presence(n)>0&&!zone.has(n.step))zone.set(n.step,new IconMotion({x:0,y:0,size:256,radius:40}));};
  return {c,session,app,zone,render,settle,context,advance:async()=>{now+=1000;await app.pollTime(session.snapshot.state.sessionId);},close:async()=>{await session.close();await app.close();}};
 }
 for(const mission of Object.keys(catalog.missions))test(`${profile}: ${mission} actual renderer gate releases startup at 30/60/120 Hz`,async()=>{
  for(const fps of [30,60,120])for(const reduced of [false,true]){
   const f=await fixture(mission);try{
    const {c}=f;assert.equal(c.startup.stage,'shell');assert.ok(c.nodes.length>c.settlingNodes.length);
    // Shell can enter row without icons; row cannot pass until admitted groups exist.
    c.tick(1/fps,{deviceShown:true,deviceReady:true,settled:f.settle(),reduced});assert.equal(c.startup.stage,'row');
    assert.equal(f.settle(),false);
    let oldAlwaysBlocked=true;
    for(let i=0;i<fps*10&&c.startup;i++){
     f.render();oldAlwaysBlocked&&=!f.settle(c.nodes);
     c.tick(1/fps,{deviceShown:true,deviceReady:true,settled:f.settle(),reduced});
    }
    assert.equal(oldAlwaysBlocked,true,'old all-nodes gate must reproduce the incident');
    assert.equal(c.startup,null);assert.equal(c.phase,'task');
    for(const n of c.nodes.filter(n=>!c.nodeAdmitted(n))){assert.equal(c.presence(n),0);assert.equal(f.zone.has(n.step),false);}
   }finally{await f.close();}
  }
 });
 test(`${profile}: handoff requires newly admitted motion without future groups`,async()=>{
  const f=await fixture('blogger');try{
   const {c,session}=f;
   const tick=()=>{f.render();c.tick(.05,{deviceShown:true,deviceHidden:true,deviceReady:true,settled:f.settle(),reduced:true});};
   for(let i=0;i<100&&c.startup;i++)tick();assert.equal(c.phase,'task');
   const prior=c.current,next=c.nodes.find(n=>n.step==='blogger.comments');assert.equal(f.zone.has(next.step),false);
   for(let i=0;i<40&&session.snapshot.state.status!=='result';i++){
    const action=c.descriptor.actions.find(a=>a.actionId==='channel.continue-private')??c.descriptor.actions.find(a=>a.disabled!==true);
    assert.equal(c.answer(action.actionId),true);await new Promise(r=>setImmediate(r));
   }
   assert.equal(session.snapshot.state.status,'result');await f.advance();assert.equal(c.handoff.stage,'unlink');
   tick();assert.equal(c.handoff.stage,'exit');assert.equal(f.zone.has(next.step),false);
   tick();assert.equal(c.handoff.stage,'pack');assert.ok(c.settlingNodes.includes(next));assert.equal(f.settle(),false);
   c.tick(.05,{deviceReady:true,settled:f.settle(),reduced:true});assert.equal(c.handoff.stage,'pack','missing newly admitted group blocks');
   for(let i=0;i<100&&c.handoff;i++)tick();assert.equal(c.handoff,null);assert.equal(c.phase,'task');assert.equal(c.current.step,next.step);
   assert.ok(c.settlingNodes.includes(prior));assert.ok(f.zone.has(next.step));
   for(const n of c.nodes.filter(n=>!c.nodeAdmitted(n)))assert.equal(f.zone.has(n.step),false);
  }finally{await f.close();}
 });
 test(`${profile}: admitted transparent icon, phone, busy, pause and media remain blocking`,async()=>{
  const f=await fixture('blogger');try{
   const {c}=f;c.tick(.016,{deviceShown:true,deviceReady:true});f.render();
   // Admission rather than opacity determines which objects require real renderer readiness.
   const current=c.current;assert.ok(c.settlingNodes.includes(current));assert.equal(f.settle(),false);
   for(let i=0;i<60;i++){f.render();c.paths?.tick(.05,true);c.tickIconPresence(.05,{reduced:true});}
   f.render();assert.equal(f.settle(),true);
   const m=f.zone.get(current.step);m.alpha.value=0;assert.equal(f.settle(),false);m.alpha.value=1;
   m.connectionsMoving=true;assert.equal(f.settle(),false);m.connectionsMoving=false;
   m.intro={};assert.equal(f.settle(),false);m.intro=null;
   f.context.phoneReady=false;c.phase='phone-enter';assert.equal(f.settle(),false);c.phase='arrange';f.context.phoneReady=true;
   f.context.phoneX.at=()=>false;assert.equal(f.settle(),false);f.context.phoneX.at=()=>true;
   for(const gate of [{deviceReady:false},{busy:true},{active:false}]){
    c.tick(.05,{deviceReady:true,settled:f.settle(),reduced:true,...gate});assert.equal(c.startup.stage,'row');
   }
   c.tick(.05,{deviceReady:true,settled:f.settle(),reduced:true});assert.equal(c.startup.stage,'trace');
   const future=c.nodes.find(n=>!c.nodeAdmitted(n));c._activeId=future.step;
   assert.ok(c.settlingNodes.includes(future));assert.equal(c.nodePresence(future),0);assert.equal(f.settle(),false);
  }finally{await f.close();}
 });
}
