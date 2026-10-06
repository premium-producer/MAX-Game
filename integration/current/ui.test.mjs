import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const flush=()=>new Promise(r=>setImmediate(r));
for(const profile of ['client','stand']){
 const dir=new URL(`./code/${profile}/src/`,import.meta.url);
 const {v5Text,v5CopyMarkup,v5ButtonMarkup,syncV5InstructionVisibility,V5_COPY_STYLES}=await import(new URL('journey-v5-ui-copy.mjs',dir));
 const {sharedTaskMarkup}=await import(new URL('journey-shared-ui.mjs',dir));
 const {V5RevealJourney}=await import(new URL('journey-v5-route-layout.mjs',dir));
 const {sharedRevealContent}=await import(new URL('journey-shared-reveal.mjs',dir));
 const {V5_MISSION_CATALOG:catalog}=await import(new URL('journey-v5-backend.mjs',dir));
 // Memory app is only a test port; production stand keeps MANAGED_ONLY.
 const {createMissionSessionApplication}=await import(new URL('../vendor/backend-figma-v2/src/application/mission-session.mjs',dir));
 const createApp=options=>createMissionSessionApplication({...options,catalog});
 const {createWebGLSession}=await import(new URL('application/webgl-session.mjs',dir));
 const {createMemoryPersistencePort}=await import(new URL('../vendor/backend-figma-v2/src/application/memory-persistence.mjs',dir));
 test(`${profile}: UI terminology is idempotent, nonbreaking and escaped`,()=>{
  for(const text of ['ID','Цифровой ID','Цифрового ID','Создать Цифровой ID','Цифровым ID','Цифровой\u00a0ID']){
   const normal=v5Text(text),expected=text==='ID'?'Цифровой\u00a0ID':text.replace(/\s+ID/u,'\u00a0ID');assert.equal(normal,expected);assert.equal(v5Text(normal),normal);assert.ok(!normal.includes('Цифровой Цифровой'));
  }
  assert.equal(v5CopyMarkup('Заселиться с Цифровым ID'),'Заселиться с <span class="v5-copy-nowrap">Цифровым\u00a0ID</span>');
  assert.equal(v5Text('screenID _ID XID3'),'screenID _ID XID3');
  assert.equal(v5CopyMarkup('<img onerror="evil"> ID'), '&lt;img onerror=&quot;evil&quot;&gt; <span class="v5-copy-nowrap">Цифровой\u00a0ID</span>');
  assert.equal(v5CopyMarkup('Голосовое / видео-сообщение'),'Голосовое / видеосообщение');
  assert.match(V5_COPY_STYLES,/white-space:nowrap/);assert.match(V5_COPY_STYLES,/width:min\(760px,calc/);assert.match(V5_COPY_STYLES,/\[hidden\]\{display:none!important/);
 });
 test(`${profile}: protected ID phrase remains inside one button text flow and requested breaks stay presentation-only`,()=>{
  assert.equal(v5ButtonMarkup('Заселиться с Цифровым ID'),'<span class="v5-button-label">Заселиться с <span class="v5-copy-nowrap">Цифровым\u00a0ID</span></span>');
  const instruction='А теперь отправим сообщение! Выберем формат: голосовое сообщение или видеосообщение';
  const completion='Вы познакомились с возможностями общения в MAX.';
  const body=v5CopyMarkup(instruction),result=v5CopyMarkup(completion);
  assert.match(body,/сообщение! <br>Выберем/);assert.equal(body.replace(/<[^>]+>/gu,''),instruction);
  assert.match(result,/возможностями <br><span class="v5-copy-nowrap">общения в MAX\.<\/span>/);assert.equal(result.replace(/<[^>]+>/gu,''),completion);
  const s={state:{status:'task',screenId:'hotel.check-in'},view:{instruction:{text:''},actions:[{actionId:'hotel.check-in',placement:'below',label:'Заселиться с Цифровым ID'}]}};
  const before=structuredClone(s);assert.match(sharedTaskMarkup(s),/data-answer="hotel.check-in"[^>]*><span class="v5-button-label">Заселиться с /);assert.deepEqual(s,before);
 });
 const snapshot=text=>({state:{status:'task',screenId:'screen.1'},view:{instruction:{text},device:{kind:'phone',asset:{path:'assets/a.svg',width:400,height:800}},actions:[{actionId:'hot',placement:'hotspot',rect:[100,200,100,50],label:'ID'},{actionId:'button',placement:'below',label:'ID',disabled:true}]}});
 test(`${profile}: empty body hides only help, result and controls remain`,()=>{
  for(const body of ['',null,'  \n ']){const html=sharedTaskMarkup(snapshot(body),{title:'Канал',token:'safe'});assert.match(html,/<div class="instruction glass-control" hidden>/);assert.match(html,/class="demo-app"/);assert.match(html,/data-answer="hot"/);assert.match(html,/left:25%;top:25%;width:25%;height:6.25%/);assert.match(html,/data-answer="button"/);}
  assert.doesNotMatch(sharedTaskMarkup(snapshot('Нажмите кнопку')),/glass-control" hidden/);
  const s=snapshot('');s.state.status='result';assert.match(sharedTaskMarkup(s),/Задание выполнено\./);assert.doesNotMatch(sharedTaskMarkup(s),/glass-control" hidden/);
  if(profile==='stand')assert.match(sharedTaskMarkup(snapshot('')),/disabled aria-disabled="true" data-action-disabled="true" data-answer="button"/);
 });
 test(`${profile}: retained popup text → empty → text invalidates GPU owner and cancels stale resize`,async()=>{
  const source=(await fs.readFile(new URL('journey-guided-main.js',dir),'utf8')).replaceAll('\r\n','\n');
  const start=source.indexOf(' const commit=()=>{',source.indexOf('function syncPopup()'))+' const commit=()=>{'.length;
  const end=source.indexOf('\n };\n if(old',start);assert.ok(start>0&&end>start);
  const calls=[],copy={scrollHeight:120,replaceWith(){}},phone={replaceWith(){}},instruction={hidden:false,style:{},querySelector:()=>copy,getBoundingClientRect:()=>({height:190})};
  const mounted={dataset:{task:'task'},querySelector:sel=>sel==='.instruction'?instruction:sel==='.instruction-copy'?copy:phone};
  let freshInstruction={hidden:true};const fresh={querySelector:sel=>sel==='.instruction'?freshInstruction:{}};
  const controller={session:{task:'task',screen:'field'}};
  const context={controller,owner:controller,screenEpoch:0,epoch:0,popupContentToken:()=> 'new',preview:null,displayTask:'task',token:'new',popupToken:'old',inlinePhone:true,
   document:{createElement:()=>({content:{firstElementChild:fresh},set innerHTML(v){}})},popupMarkup:()=>'',host:{dataset:{},querySelector:()=>mounted},
   getComputedStyle:()=>({top:'100',paddingTop:'20',paddingBottom:'20'}),arena:{getBoundingClientRect:()=>({width:3200})},size:{width:3200},
   syncV5InstructionVisibility,referenceVisual:false,bfmVisual:true,v5InstructionTop:h=>String(h),changed:()=>calls.push(['changed']),
   foreground:{cancelInstruction:el=>calls.push(['cancel',el]),refreshPart:el=>calls.push(['refresh',el]),invalidate:()=>calls.push(['invalidate']),resizeInstruction:()=>calls.push(['resize']),refreshParts:()=>calls.push(['parts'])}};
  const run=()=>vm.runInNewContext(`(()=>{${source.slice(start,end)}})()`,context);
  run();assert.equal(instruction.hidden,true);assert.ok(calls.some(([a,el])=>a==='refresh'&&el===mounted));assert.ok(calls.some(([a])=>a==='cancel'));assert.ok(!calls.some(([a])=>a==='resize'));
  calls.length=0;freshInstruction={hidden:false};run();assert.equal(instruction.hidden,false);assert.equal(instruction.style.height,'160px');assert.ok(calls.some(([a,el])=>a==='refresh'&&el===mounted));assert.ok(calls.some(([a])=>a==='cancel'));
  calls.length=0;run();assert.ok(calls.some(([a])=>a==='resize'));assert.ok(calls.some(([a,el])=>a==='refresh'&&el===mounted));
 });
 async function fixture(mission){
  let now=1000,c;const app=createApp({persistence:createMemoryPersistencePort(),now:()=>now});
  const session=createWebGLSession({catalog,port:app,sessionId:`ui-${profile}-${mission}`,onSnapshot:s=>c?.accept(s),onError:assert.fail});
  await session.start();c=new V5RevealJourney(sharedRevealContent(catalog),session);c.configure(3200,1800,256);
  await session.command('SELECT_MISSION',{missionId:mission});await session.contact('hand','down',true);now+=800;await app.pollTime(session.snapshot.state.sessionId);await session.contact('hand','up',true);
  for(let i=0;i<14;i++)c.tick(.1,{settled:true,deviceReady:true,deviceShown:true,reduced:true});
  return {c,session,app,advance:async()=>{now+=1000;await app.pollTime(session.snapshot.state.sessionId);},close:async()=>{await session.close();await app.close();}};
 }
 for(const mission of Object.keys(catalog.missions))test(`${profile}: ${mission} future icons hidden, layout/node IDs retained, restart clears visibility`,async()=>{
  const f=await fixture(mission);try{
   const {c}=f;assert.equal(c.phase,'task');assert.equal(c.nodes.length,c.steps.length+1);
   for(const n of c.nodes)assert.equal(c.presence(n),Number(n.step==='open-max'||n===c.current));
   const future=c.nodes.find(n=>n!==c.current&&n.step!=='open-max');if(future){
    c._activeId=future.step;c.tick(.016,{settled:false});assert.ok(c.presence(future)>0&&c.presence(future)<1);
    const value=c.presence(future);c.tick(10,{active:false});assert.equal(c.presence(future),value);
    c.tick(.016,{reduced:true});assert.equal(c.presence(future),1);
   }
   await c.restart();assert.equal(c.phase,'palm');assert.equal(c.iconPresence.size,0);
  }finally{await f.close();}
 });
 test(`${profile}: next icon appears only after device exit and completion icon remains`,async()=>{
  const f=await fixture('blogger');try{
   const {c,session}=f;const next=c.nodes.find(n=>n.step==='blogger.comments'),done=c.current;
   for(let i=0;i<40&&session.snapshot.state.status!=='result';i++){
    const action=c.descriptor.actions.find(a=>a.actionId==='channel.continue-private')??c.descriptor.actions.find(a=>a.disabled!==true);
    assert.equal(c.answer(action.actionId),true);await flush();
   }
   assert.equal(session.snapshot.state.status,'result');await f.advance();assert.equal(c.handoff.stage,'unlink');assert.equal(c.presence(next),0);
   c.tick(.016,{reduced:true});assert.equal(c.handoff.stage,'exit');assert.equal(c.presence(next),0);
   c.tick(.016,{reduced:true,deviceHidden:false});assert.equal(c.presence(next),0);
   c.tick(.016,{deviceHidden:true});assert.equal(c.handoff.stage,'pack');assert.equal(c.presence(next),0);
   c.tick(.016,{});assert.ok(c.presence(next)>0&&c.presence(next)<1);assert.equal(c.presence(done),1);
  }finally{await f.close();}
 });
}
