import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const profiles=[new URL('../src/',import.meta.url),new URL('../../../integration/current/code/client/src/',import.meta.url),new URL('../../../integration/current/code/stand/src/',import.meta.url)];
for(const dir of profiles){
 const label=dir.pathname.includes('/integration/')?dir.pathname.includes('/stand/')?'stand':'pinned client':'client source';
 const main=(await fs.readFile(new URL('journey-guided-main.js',dir),'utf8')).replaceAll('\r\n','\n');
 const renderer=(await fs.readFile(new URL('journey-webgl-ui.mjs',dir),'utf8')).replaceAll('\r\n','\n');
 const popupSource=main.slice(main.indexOf('function popupContentToken('),main.indexOf('function tick(delta)'));
 const retentionSource=main.slice(main.indexOf('function syncInstructionRetention(){'),main.indexOf('function syncLinePhone(){'));
 const adapter=renderer.slice(renderer.indexOf('  joinContentTransition(host,commit)'),renderer.indexOf('  cancelInstruction(el)'));
 const {V5DeviceMorph}=await import(new URL('journey-v5-device-morph.mjs',dir));
 const {TaskContentTransition,joinTaskContentCommit}=await import(new URL('journey-popup-motion.mjs',dir));
 const {syncV5InstructionVisibility}=await import(new URL('journey-v5-ui-copy.mjs',dir));
 const {sharedInstructionBody,sharedTaskMarkup,sharedInstructionRetention}=await import(new URL('journey-shared-ui.mjs',dir));
 const {V5RevealJourney,v5RedundantCompletion}=await import(new URL('journey-v5-route-layout.mjs',dir));
 const {sharedRevealContent}=await import(new URL('journey-shared-reveal.mjs',dir));
 const {V5_MISSION_CATALOG:catalog}=await import(new URL('journey-v5-backend.mjs',dir));
 const {createMissionSessionApplication}=await import(new URL('../vendor/backend-figma-v2/src/application/mission-session.mjs',dir));
 const {createMemoryPersistencePort}=await import(new URL('../vendor/backend-figma-v2/src/application/memory-persistence.mjs',dir));
 const {createWebGLSession}=await import(new URL('application/webgl-session.mjs',dir));

 function fixture({reduced=false,bfm=true,controller:providedController}={}){
  const writes=[],refreshes=[],contentTransitions=new Map();let context;
  // A minimal DOM adapter with real retained-copy replacement semantics. The
  // production syncPopup and renderer adapter run unchanged in the VM below.
  class Dialog{
   constructor(text){
    this.dataset={task:'task'};
    this.adoptCopy({text,scrollHeight:120});
    this.instruction={hidden:text==='',style:{},querySelector:()=>this.copy,getBoundingClientRect:()=>({height:160})};
   }
   adoptCopy(copy){
    this.copy=copy;
    // These R3 fixtures exercise the full-copy fallback with no matching
    // immutable header. The R4 stable-instruction suite covers header retention.
    copy.querySelector=selector=>selector==='p'?{textContent:copy.text}:null;
    copy.replaceWith=next=>{writes.push({text:next.text,alpha:Number(host.dataset.contentPresence)});this.adoptCopy(next);};
   }
   querySelector(selector){return selector==='.instruction'?this.instruction:selector==='.instruction-copy'?this.copy:null;}
   remove(){host.dialog=null;}
   replaceWith(next){host.dialog=next;}
  }
  const host={dataset:{contentPresence:'1',popupPresence:'1'},isConnected:true,dialog:null,querySelector:selector=>selector==='.task-dialog'?host.dialog:selector==='.task-dialog .instruction'?host.dialog?.instruction:null,append:dialog=>{host.dialog=dialog;}};
  const controller=providedController??{session:{screen:'field',task:'task',mission:'blogger',notice:''},phase:'task',phoneContentKey:'run.1:task:screen.old:task',current:{step:'task'},steps:[{id:'task',label:'Task'}],instruction:'OLD instruction',get displaySnapshot(){return {state:{status:'task'},view:{instruction:{text:this.instruction}}};}};
  host.dialog=new Dialog(sharedInstructionBody(controller.displaySnapshot));host.dialog.dataset.task=controller.session.task;
  context=vm.createContext({controller,host,popupToken:controller.phoneContentKey+':0',popupPage:0,popupPending:null,screenEpoch:0,
   revealMode:true,bfmVisual:bfm,sharedBackend:true,inlinePhone:true,phoneToken:controller.phoneContentKey,phonePresence:{value:1},referenceVisual:false,servicePaused:false,
   contentTransitions,reduced:{matches:reduced},V5DeviceMorph,TaskContentTransition,joinTaskContentCommit,syncV5InstructionVisibility,sharedInstructionBody,sharedInstructionRetention,
   document:{createElement:()=>({content:{firstElementChild:null},set innerHTML(text){this.content.firstElementChild=new Dialog(text);}})},
   popupMarkup:()=>sharedInstructionBody(context.controller.displaySnapshot),displayPhoneKey:()=>context.controller.phoneContentKey,phoneContentReady:()=>true,
   getComputedStyle:()=>({top:'100',paddingTop:'20',paddingBottom:'20'}),arena:{getBoundingClientRect:()=>({width:1600})},size:{width:1600},v5InstructionTop:h=>String(h),changed:()=>{},
   recordRefresh:()=>refreshes.push({text:host.dialog.copy.text,alpha:Number(host.dataset.contentPresence)}),onMotion:()=>{}
  });
  vm.runInContext(`foreground={${adapter}
   contentBusy:host=>contentTransitions.get(host)?.busy===true,
   refreshPart:recordRefresh,refreshParts:recordRefresh,invalidate:()=>{},resizeInstruction:()=>{},cancelInstruction:()=>{},
   cancelContent:host=>contentTransitions.get(host)?.restore(reduced.matches),transition:(host,commit)=>{commit();return true;},releaseObject:()=>{},instructionReady:()=>true
  };${retentionSource}${popupSource}`,context);
  context.popupToken=vm.runInContext('popupContentToken(controller.session.task)',context);
  const snapshot=(screen,text)=>{context.controller.phoneContentKey=`run.1:task:${screen}:task`;context.controller.instruction=text;};
  const sync=()=>vm.runInContext('syncPopup()',context);
  const presented=()=>vm.runInContext('markInstructionPresented()',context);
  const retry=()=>vm.runInContext(main.match(/^ if\(popupPending[^\n]+syncPopup\(\);$/m)[0],context);
  const tick=(dt,{paused=false}={})=>{
   const motion=contentTransitions.get(host);motion?.tick(paused?0:dt);
   if(motion){host.dataset.contentPresence=String(motion.value);host.dataset.contentPhase=motion.phase;if(!motion.busy)contentTransitions.delete(host);}
  };
  const phone=(ready=()=>true)=>{const key=context.controller.phoneContentKey;context.foreground.transitionContent(host,()=>{if(context.controller.phoneContentKey===key)context.phoneToken=key;},{from:392,to:392,ready});};
  const flush=(hz=60)=>{for(let i=0;i<hz*10&&contentTransitions.size;i++)tick(1/hz);assert.equal(contentTransitions.size,0);};
  return {context,host,writes,refreshes,snapshot,sync,presented,retry,tick,phone,flush,contentTransitions};
 }

 for(const hz of [30,60,120])test(`${label}: old instruction fades before a single hidden swap and new entrance at ${hz}Hz`,()=>{
  const f=fixture();f.snapshot('screen.new','NEW instruction');f.phone();f.sync();f.sync();
  assert.equal(f.host.dialog.copy.text,'OLD instruction');assert.equal(f.writes.length,0);
  let prior=1;
  for(let i=0;i<hz*5&&!f.writes.length;i++){
   f.tick(1/hz);const alpha=Number(f.host.dataset.contentPresence);assert.ok(alpha<=prior);prior=alpha;
   if(!f.writes.length)assert.equal(f.host.dialog.copy.text,'OLD instruction');
  }
  assert.deepEqual(f.writes,[{text:'NEW instruction',alpha:0}]);
  assert.ok(f.refreshes.every(x=>x.alpha===0),'GPU refresh must observe the invisible DOM alpha');
  for(let i=0;i<hz*5&&f.contentTransitions.size;i++){
   f.tick(1/hz);const alpha=Number(f.host.dataset.contentPresence);assert.ok(alpha>=prior);prior=alpha;f.sync();
  }
  assert.equal(prior,1);assert.equal(f.writes.length,1);assert.equal(f.context.popupPending,null);
 });

 test(`${label}: pause freezes old content and media preparation holds the new copy invisible`,()=>{
  const f=fixture();let mediaReady=false;f.snapshot('screen.new','NEW instruction');f.phone(()=>mediaReady);f.sync();f.tick(1/60);
  const alpha=f.host.dataset.contentPresence;for(let i=0;i<30;i++)f.tick(1,{paused:true});
  assert.equal(f.host.dataset.contentPresence,alpha);assert.equal(f.host.dialog.copy.text,'OLD instruction');
  for(let i=0;i<180&&!f.writes.length;i++)f.tick(1/60);
  assert.equal(f.writes.length,1);assert.equal(f.writes[0].alpha,0);
  for(let i=0;i<30;i++)f.tick(1/60);assert.equal(f.host.dataset.contentPresence,'0');
  mediaReady=true;f.flush();assert.equal(f.host.dataset.contentPresence,'1');
 });

 test(`${label}: newer snapshot supersedes pending copy without mismatching the still mounted phone`,()=>{
  const f=fixture();f.snapshot('screen.a','Intermediate instruction');f.phone();f.sync();f.tick(1/60);
  f.snapshot('screen.b','Latest instruction');f.sync();f.sync();f.flush();
  assert.equal(f.writes.length,0);assert.equal(f.host.dialog.copy.text,'OLD instruction');assert.equal(f.context.popupPending.joined,false);
  f.phone();f.retry();f.flush();assert.deepEqual(f.writes,[{text:'Latest instruction',alpha:0}]);
 });

 test(`${label}: new copy arriving during entrance waits for the latest phone fade instead of changing visible text`,()=>{
  const f=fixture();f.snapshot('screen.a','First instruction');f.phone();f.sync();
  for(let i=0;i<180&&Number(f.host.dataset.contentPresence)!==0;i++)f.tick(1/60);
  while(f.contentTransitions.get(f.host).phase!=='in')f.tick(1/60);
  f.tick(1/60);assert.ok(Number(f.host.dataset.contentPresence)>0);
  f.snapshot('screen.b','Latest instruction');f.sync();
  assert.equal(f.context.popupPending.joined,false);assert.equal(f.host.dialog.copy.text,'First instruction');
  for(let i=0;i<180&&f.contentTransitions.size;i++){f.retry();f.tick(1/60);assert.equal(f.host.dialog.copy.text,'First instruction');}
  f.phone();f.retry();f.flush();
  assert.deepEqual(f.writes,[{text:'First instruction',alpha:0},{text:'Latest instruction',alpha:0}]);
 });

 test(`${label}: close/restart and controller replacement reject late copy callbacks`,()=>{
  for(const change of [f=>{f.context.screenEpoch++;},f=>{f.context.controller={...f.context.controller,session:{...f.context.controller.session}};},f=>{f.context.controller.phoneContentKey='run.2:task:screen.new:task';}]){
   const f=fixture();f.snapshot('screen.new','NEW instruction');f.phone();f.sync();f.tick(1/60);change(f);f.flush();
   assert.equal(f.writes.length,0);assert.equal(f.host.dialog.copy.text,'OLD instruction');
  }
  const f=fixture();f.snapshot('screen.new','NEW instruction');f.phone();f.sync();f.context.controller.session.task=null;f.sync();f.flush();assert.equal(f.writes.length,0);assert.equal(f.context.popupPending,null);
 });

 test(`${label}: reduced motion has one hidden commit and no duplicate instruction entrance`,()=>{
  const f=fixture({reduced:true});f.snapshot('screen.new','NEW instruction');f.phone();f.sync();f.flush();
  assert.deepEqual(f.writes,[{text:'NEW instruction',alpha:0}]);assert.equal(f.host.dataset.contentPresence,'1');
  f.sync();f.flush();assert.equal(f.writes.length,1);
  const legacy=fixture({reduced:true,bfm:false});legacy.snapshot('screen.new','NEW instruction');legacy.context.phoneToken=legacy.context.controller.phoneContentKey;legacy.sync();
  assert.deepEqual(legacy.writes,[{text:'NEW instruction',alpha:0}]);assert.equal(legacy.host.dataset.contentPresence,'1');
 });

 test(`${label}: same-screen restored help changes empty → text → empty without a bubble ghost`,()=>{
  const f=fixture();f.snapshot('screen.old','');f.sync();f.flush();assert.equal(f.host.dialog.instruction.hidden,true);
  const emptyToken=f.context.popupToken;f.snapshot('screen.old','Restored instruction');f.sync();
  assert.equal(f.host.dialog.instruction.hidden,true);f.flush();assert.equal(f.host.dialog.instruction.hidden,false);assert.equal(f.host.dialog.copy.text,'Restored instruction');
  assert.notEqual(f.context.popupToken,emptyToken);f.snapshot('screen.old',' \n ');f.sync();f.flush();assert.equal(f.host.dialog.instruction.hidden,true);
  assert.ok(f.writes.every(write=>write.alpha===0));assert.equal(f.writes.length,3);
 });

 test(`${label}: actual main marks completion presented only after live text, media, matching copy and alpha are ready`,()=>{
  const f=fixture();let seen=0;f.context.controller.markInstructionPresented=()=>seen++;
  f.context.foreground.instructionReady=()=>false;f.presented();assert.equal(seen,0);
  f.context.foreground.instructionReady=()=>true;f.context.phoneContentReady=()=>false;f.presented();assert.equal(seen,0);
  f.context.phoneContentReady=()=>true;f.host.dataset.contentPresence='0';f.presented();assert.equal(seen,0);
  f.host.dataset.contentPresence='1';f.snapshot('screen.old','Changed but unpainted');f.presented();assert.equal(seen,0);
  f.sync();f.flush();f.presented();assert.equal(seen,1);
  const query=f.host.querySelector;f.host.querySelector=selector=>selector.includes('.phone-media-error')?{}:query(selector);f.presented();assert.equal(seen,1,'failed ready media must not suppress sole feedback');
  f.host.querySelector=query;f.context.document.hidden=true;f.presented();assert.equal(seen,1);f.context.document.hidden=false;
  f.context.servicePaused=true;f.presented();assert.equal(seen,1);f.context.servicePaused=false;
  f.context.controller.snapshot={assignment:{lifecycle:{status:'cancelled'}}};f.presented();assert.equal(seen,1);
 });

 for(const mission of Object.keys(catalog.missions))test(`${label}: ${mission} native backend keeps one authored completion at every task endpoint through replay and pause`,async()=>{
  let now=1000,c,lastCommand;const persistence=createMemoryPersistencePort(),app=createMissionSessionApplication({catalog,persistence,now:()=>now});
  const port={...app,sendCommand:command=>{lastCommand=structuredClone(command);return app.sendCommand(command);}};
  const session=createWebGLSession({catalog,port,sessionId:`completion-${label.replaceAll(' ','-')}-${mission}`,onSnapshot:s=>c?.accept(s),onError:assert.fail});
  const settle=()=>{for(let i=0;i<20;i++)c.tick(.05,{settled:true,deviceReady:true,deviceHidden:true,deviceShown:true,reduced:true});};
  try{
   await session.start();c=new V5RevealJourney(sharedRevealContent(catalog),session);c.configure(3200,1800,256);
   await session.command('SELECT_MISSION',{missionId:mission});await session.contact('hand','down',true);now+=800;await session.contact('hand','up',true);settle();
   let terminal=null,prior=null,intermediate=0,blank=0;const endpoints=[];
   for(let i=0;i<150&&!terminal;i++){
    const s=session.snapshot.state;assert.equal(s.status,'task');settle();
    const current=catalog.tasks[s.taskId].screens[s.screenId],body=sharedInstructionBody(c.displaySnapshot),visual=fixture({controller:c});
    if(!body){blank++;assert.equal(visual.host.dialog.instruction.hidden,true);visual.presented();assert.notEqual(c.presentedInstruction?.key,c.phoneContentKey);assert.match(sharedTaskMarkup(c.displaySnapshot),/class="instruction glass-control" hidden/);}
    else {visual.presented();assert.equal(c.presentedInstruction.body,body);}
    const key=c.phoneContentKey,before=structuredClone(session.snapshot);
    if(current.automaticMs!==null){now+=current.automaticMs+1;await app.pollTime(s.sessionId);}
    else{
     const action=c.descriptor.actions.find(a=>a.actionId==='channel.continue-private')??c.descriptor.actions.find(a=>a.disabled!==true);
     assert.ok(action,`${mission}:${s.screenId} has no action`);const result=await session.act(s.screenId,action.actionId,s.revision);assert.equal(result.reply.ok,true,`${mission}:${s.screenId}:${action.actionId}`);
    }
    await new Promise(resolve=>setImmediate(resolve));
    if(session.snapshot.state.status==='result'){
     const result=structuredClone(session.snapshot);endpoints.push(s.taskId);
     assert.equal(result.state.resultReadyAt,now+800,'native result delay is unchanged');
     assert.equal(c.snapshot.state.status,'result');assert.equal(c.displayedState.status,'result','presentation must keep authoritative status');
     assert.equal(c.phoneContentKey,key,'no second phone transition for an already displayed task completion');
     assert.equal(sharedInstructionBody(c.displaySnapshot),body);visual.sync();assert.equal(visual.writes.length,0);
     assert.ok(v5RedundantCompletion(result,before,c.presentedInstruction));
     assert.equal(v5RedundantCompletion(result,before,null),false,'unpresented completion needs its sole feedback');
     const restored=new V5RevealJourney(sharedRevealContent(catalog),{snapshot:before});restored.phase='task';restored.session.task=before.state.taskId;restored.accept(result);
     assert.equal(restored.displayedState.status,'result');assert.equal(sharedInstructionBody(restored.displaySnapshot),'Задание выполнено.');
     const replay=await app.sendCommand(lastCommand);assert.equal(replay.duplicate,true);assert.equal(replay.reply.ok,true);
     assert.deepEqual(replay.snapshot.state,result.state,'same ACT receipt cannot reset result time or progress');
     c.accept(replay.snapshot);assert.equal(c.phoneContentKey,key);assert.equal(sharedInstructionBody(c.displaySnapshot),body);
     for(const text of ['', 'Проверим статистику канала']){const changed=structuredClone(before);changed.view.instruction={text};const altered=structuredClone(result);altered.view.instruction={text};assert.equal(v5RedundantCompletion(altered,changed,{key,body:text}),false);}
     const missing=structuredClone(result);missing.view.missing='Недоступен кадр';assert.equal(v5RedundantCompletion(missing,before,c.presentedInstruction),false);
     const skipped=structuredClone(result);skipped.view.nodes.find(n=>n.taskId===s.taskId).skipped=true;assert.equal(v5RedundantCompletion(skipped,before,c.presentedInstruction),false);
     const incomplete=structuredClone(result);incomplete.view.nodes.find(n=>n.taskId===s.taskId).completed=false;assert.equal(v5RedundantCompletion(incomplete,before,c.presentedInstruction),false);
     const changedAsset=structuredClone(result);changedAsset.view.device.asset.path='missing.svg';assert.equal(v5RedundantCompletion(changedAsset,before,c.presentedInstruction),false);
     const nonterminal=Object.values(catalog.tasks[s.taskId].screens).find(screen=>!screen.actions.some(action=>action.outcome?.kind==='complete-task')&&screen.instruction?.trim());
     if(nonterminal){
      const earlier=structuredClone(before),altered=structuredClone(result);
      for(const value of [earlier,altered]){value.state.screenId=nonterminal.screenId;value.view.instruction={text:nonterminal.instruction};value.view.device.asset=catalog.assets[nonterminal.assetId];}
      assert.equal(v5RedundantCompletion(altered,earlier,{key:`${s.runId}:${s.taskId}:${nonterminal.screenId}:task`,body:nonterminal.instruction.trim()}),false,'a displayed instructional screen cannot stand in for task completion');
     }
     await session.owner(false);const pausedPhase=c.phase,pausedProgress=structuredClone(session.snapshot.state.progress);now+=1200;await app.pollTime(s.sessionId);
     c.tick(.05,{active:false,settled:true,deviceReady:true,reduced:true});assert.equal(c.phase,pausedPhase);
     assert.equal(session.snapshot.state.status,'result');assert.equal(session.snapshot.state.resultReadyAt,result.state.resultReadyAt);
     await session.owner(true);assert.equal(session.snapshot.state.resultReadyAt,result.state.resultReadyAt+1200);
     assert.equal(session.snapshot.state.deadlineAt,result.state.deadlineAt===null?null:result.state.deadlineAt+1200,'pause shifts an active backend timer and preserves its terminal null');
     assert.deepEqual(session.snapshot.state.progress,pausedProgress);assert.deepEqual(session.snapshot.state.progress[mission].completed,result.state.progress[mission].completed);assert.deepEqual(session.snapshot.state.progress[mission].answers,result.state.progress[mission].answers);assert.equal(c.phoneContentKey,key);assert.equal(sharedInstructionBody(c.displaySnapshot),body);
     now=session.snapshot.state.resultReadyAt-1;await app.pollTime(s.sessionId);assert.equal(session.snapshot.state.status,'result');
     const last=session.snapshot.view.nodes.filter(n=>n.taskId).every(n=>n.completed);
     if(last){
      terminal=structuredClone(session.snapshot);prior=before;
     }else{
      intermediate++;
      now=session.snapshot.state.resultReadyAt;await app.pollTime(s.sessionId);settle();
     }
    }
   }
   assert.ok(terminal,`${mission} did not finish`);assert.ok(intermediate>0);assert.deepEqual(endpoints,catalog.missions[mission].taskIds,'visit every native terminal task screen');if(['digital-id','communication','business'].includes(mission))assert.ok(blank>0);
   const live=c.snapshot;now=terminal.state.resultReadyAt-1;await app.pollTime(session.snapshot.state.sessionId);assert.equal(session.snapshot.state.status,'result');
   const lastPhone=c.phoneContentKey;now++;await app.pollTime(session.snapshot.state.sessionId);assert.equal(c.phoneContentKey,lastPhone,'terminal exit must not start a second phone content fade');settle();assert.equal(session.snapshot.state.status,'completed');assert.equal(c.displayedState.status,'completed');assert.equal(c.phase,'complete');
   assert.equal(live.state.resultReadyAt-terminal.state.resultReadyAt,0);assert.equal(session.snapshot.state.runId,terminal.state.runId);assert.deepEqual(session.snapshot.state.progress[mission].completed,catalog.missions[mission].taskIds);
   assert.ok(session.snapshot.view.result.text.trim());assert.equal(prior.state.screenId,terminal.state.screenId);
  }finally{await session.close();await app.close();}
 });
}
