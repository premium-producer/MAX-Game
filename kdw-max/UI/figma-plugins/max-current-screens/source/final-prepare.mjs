import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../../..'),src=root+'/apps/max-game/source/client/src';
const {createKdwCatalog}=await import(pathToFileURL(src+'/kdw-interactions-model.mjs'));
const {createMissionModel,dispatchMissionCommand,TASK_CLOCK_RULES_REVISION}=await import(pathToFileURL(src+'/core/mission-core.mjs'));
const {createMissionSessionApplication}=await import(pathToFileURL(src+'/application/mission-session.mjs'));
const {createMemoryPersistencePort}=await import(pathToFileURL(src+'/application/memory-persistence.mjs'));
const {visiblePosts,postsGoal}=await import(pathToFileURL(src+'/kdw-posts-model.mjs'));
const {storeTimeline,storeGoal}=await import(pathToFileURL(src+'/kdw-store-rating.mjs'));
const {activityRemaining}=await import(pathToFileURL(src+'/kdw-development.mjs'));
const {TEXT_POLICY}=await import(pathToFileURL(src+'/kdw-text-policy.mjs'));
const productionRoot=fs.existsSync(root+'/production/startup-one-pc/max-game/app.json')?root+'/production/startup-one-pc/max-game':root+'/apps/max-game';
const settingsModule=createRequire(import.meta.url)(root+'/apps/max-game/launcher/stand-settings.cjs'),value=settingsModule.validate(JSON.parse(fs.readFileSync(productionRoot+'/settings/stand.json','utf8'))),policy={production:true,revision:settingsModule.revision(value),error:null,value};
const {productionCatalog}=await import(pathToFileURL(src+'/kdw-production.mjs'));
const catalog=productionCatalog(createKdwCatalog(JSON.parse(fs.readFileSync(src+'/reviewed-content/mission-catalog.json'))),policy);
fs.writeFileSync(dir+'/final-policy.json',JSON.stringify(policy,null,2));
const profile={schemaVersion:2,name:'Мой канал о кино',description:'Новости кино, премьеры и обсуждения. Делимся впечатлениями каждый день.',avatar:'cinema',visibility:'public',slug:'my_cinema'};
const excluded=['blogger.channel.filled','blogger.channel.public-filled','blogger.comments.reply','business.store.publish','business.store.result'];
const fixtures=[],omittedTransitions=[],seen=new Set(),time=Date.now();let serial=0;
function command(entry,type,fields={},internal=false,advance=1){
 const now=entry.now+advance,c={schemaVersion:1,type,commandId:'figma.'+(++serial),sessionId:entry.model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:entry.model.state.revision,...(['ACT','SAVE_INTERACTION'].includes(type)?{textPolicy:TEXT_POLICY}:{}),...fields};
 const r=dispatchMissionCommand(catalog,entry.model,c,{now,internal});if(!r.reply.ok)throw Error(type+':'+JSON.stringify(fields)+':'+r.reply.code);return {model:r.model,now,previous:entry};
}
async function snapshotAt(entry){
 const persistence=createMemoryPersistencePort(),app=createMissionSessionApplication({catalog,persistence,now:()=>entry.now,missionRulesRevision:TASK_CLOCK_RULES_REVISION});
 await persistence.create(entry.model.state.sessionId,{schemaVersion:2,mission:entry.model,layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:entry.now});
 await app.getSnapshot(entry.model.state.sessionId);const snapshot=await app.inputOwnerChanged(entry.model.state.sessionId,{active:true});await app.close();return snapshot;
}
async function capture(entry,variant='screen',sector=null){
 const s=entry.model.state,screenId=s.screenId??s.status,key=[s.missionId,sector,screenId,variant].filter(Boolean).join('.');if(seen.has(key))return;seen.add(key);
 // Task completion briefly keeps the same screen while applying the checkmark.
 // This is a transition, not another authored screen. Keep unique result screens.
 const prior=variant==='result'&&fixtures.findLast(f=>f.missionId===s.missionId&&f.taskId===s.taskId&&f.screenId===screenId&&f.sector===sector);
 if(prior){omittedTransitions.push({id:key,screenId,sector,representedBy:prior.id,reason:'same-screen completion transition'});return;}
 const snapshot=await snapshotAt(entry),warmupSnapshot=s.status==='result'&&entry.previous?.model.state.status==='task'?await snapshotAt(entry.previous):undefined;
 fixtures.push({id:key,missionId:s.missionId,taskId:s.taskId,screenId,variant,sector,snapshot,...(warmupSnapshot?{warmupSnapshot}:{})});
}
async function activity(entry,kind,sector){
 const posts=kind==='posts',taskId=entry.model.state.taskId,screenId=entry.model.state.screenId;
 let e=command(entry,posts?'START_POSTS':'START_STORE',{taskId,screenId});
 // Pick only available, correct objects through real reducers; never invent scores.
 const initial={model:e.model,now:e.now+4500};await capture(initial,'activity',sector);
 for(let i=0;i<650;i++){
  const s=e.model.state,a=s.progress.business[posts?'postsActivity':'storeActivity'];
  if((posts?postsGoal:storeGoal)(a)){await capture(e,'success',sector);return e;}
  e={...e,now:e.now+200};
  const elapsed=a.startRemainingMs-activityRemaining(s,e.now),available=posts?visiblePosts(a,elapsed):storeTimeline(a).at(elapsed),spawn=available.find(v=>v.post.good&&!a.published.some(p=>p.spawnId===v.spawnId));
  if(spawn)e=command(e,posts?'PUBLISH_POST':'PICK_PRODUCT',{taskId,screenId,spawnId:spawn.spawnId},false,0);
 }
 throw Error('Activity goal timeout: '+kind);
}
for(const mission of Object.values(catalog.missions))for(const sector of mission.missionId==='business'?['cafe','flowers','auto']:[null]){
 let entry={model:createMissionModel(catalog,{sessionId:'figma.'+mission.missionId+'.'+(sector??'default'),rulesRevision:TASK_CLOCK_RULES_REVISION}),now:time};
 entry=command(entry,'OWNER_CHANGED',{active:true},true);entry=command(entry,'SELECT_MISSION',{missionId:mission.missionId});entry=command(entry,'STAND_READY',{screenId:'scan'});await capture(entry,'palm',sector);entry=command(entry,'HOLD_CONFIRMED',{},true);
 const queue=[entry],visited=new Set();
 while(queue.length){
  let e=queue.shift(),s=e.model.state;
  if(s.status==='result'){await capture(e,'result',sector);e=command(e,'ADVANCE_RESULT',{},false,Math.max(1000,(s.resultReadyAt??e.now)-e.now+1));s=e.model.state;}
  const visit=s.screenId??s.status;if(visited.has(visit))continue;visited.add(visit);
  if(s.status==='task'&&!s.standReady){e=command(e,'STAND_READY',{screenId:s.screenId});s=e.model.state;}
  if(['completed','incomplete'].includes(s.status)){await capture(e,'final',sector);continue;}
  if(s.status!=='task')throw Error('Unexpected state '+s.status);
  if(s.screenId==='business.channel.result')e=await activity(e,'posts',sector);
  else if(s.screenId==='business.store.start')e=await activity(e,'store',sector);
  else await capture(e,'screen',sector);
  s=e.model.state;const screen=catalog.tasks[s.taskId].screens[s.screenId];
  if(s.screenId==='blogger.channel.name'){
   e=command(e,'SAVE_INTERACTION',{taskId:s.taskId,screenId:s.screenId,value:profile});await capture(e,'filled',sector);await capture(e,'keyboard',sector);
  }
  if(s.screenId==='blogger.channel.public-link')e=command(e,'SAVE_INTERACTION',{taskId:s.taskId,screenId:s.screenId,value:profile});
  if(s.screenId==='blogger.comments.input'){
   e=command(e,'SAVE_INTERACTION',{taskId:s.taskId,screenId:s.screenId,value:{schemaVersion:2,reply:'Спасибо за вопрос! Премьера уже завтра 🎬'}});await capture(e,'filled',sector);await capture(e,'keyboard',sector);
  }
  const blocked=new Set(['channel.fill-name-example','channel.fill-link-example','blogger.comments.input.action-1','channel.continue-private','channel.choose-private']);
  for(const action of screen.actions){
   if(action.disabled||action.enabled===false||action.outcome.kind==='incorrect'||blocked.has(action.actionId)||/personal\.(?:direct-)?back\./.test(action.actionId)||action.outcome.screenId===s.screenId||excluded.includes(action.outcome.screenId))continue;
   if(s.screenId==='business.platform.business-type'&&action.actionId!=='business.platform.choose-'+sector)continue;
   if(s.screenId==='business.store.start'&&!action.actionId.endsWith('publish-now'))continue;
   try{queue.push(command(e,'ACT',{taskId:s.taskId,screenId:s.screenId,actionId:action.actionId}));}catch(error){throw Error(s.screenId+' '+error.message);}
  }
 }
}
const expected=Object.values(catalog.missions).flatMap(m=>m.taskIds.flatMap(id=>Object.keys(catalog.tasks[id].screens))).filter(id=>!excluded.includes(id)),missing=expected.filter(id=>!fixtures.some(f=>f.screenId===id));if(missing.length)throw Error('Missing screens: '+missing.join(','));
fs.writeFileSync(dir+'/final-fixtures.json',JSON.stringify({revision:'max-current-screens-20261023.pixel-map',catalog,excluded,omittedTransitions,fixtures}));
// Export-only hook: render code and styling are unchanged; only state injection.
const packages=process.argv[2]??path.resolve(src,'../node_modules');
const {build}=await import(pathToFileURL(packages+'/esbuild/lib/main.js'));
const hook=`
globalThis.__figmaCapture={
 clock(time){__captureSnapshot.view.clock.serverTime=time;__captureSnapshot.view.clock.checkpointAt=time;__captureSnapshot.view.clock.held=false;},
 ready:()=>!!foreground&&!!sharedSession&&!!controller,
 async show(snapshot,warmup){stopProduction();stopGameLink();await disposeIdleMenu();await personalChannel.flush();personalChannel.update(null,'');kdwInteractions.update(null,'');kdwPosts.update(null,'');businessNative.update(null,'');const target=snapshot;__captureSnapshot=warmup??target;let active=__captureSnapshot;sharedSession={snapshot:active,connected:true,busy:false,owner:async()=>active,poll:async()=>active,command:async()=>({reply:{ok:true},snapshot:active}),act:async()=>({reply:{ok:true},snapshot:active}),contact:async()=>active,layout:async()=>active};clearManagedScene();view='';configureController();fit();if(controller.phase==='paused')controller.resume(controller.activeId);render(true);if(warmup){const started=performance.now();while(performance.now()-started<30000){const p=host.querySelector('.route-phone');if(controller.phase==='task'&&!controller.startup&&!controller.handoff&&phonePresence.value>.995&&!foreground.contentBusy(host)&&Number(host.dataset.contentPresence)>.995&&p?.dataset.gpuReadyKey===p?.dataset.sceneVersion)break;await new Promise(r=>setTimeout(r,30));}active=target;__captureSnapshot=target;sharedSession.snapshot=target;controller.accept(target);render(true);}},
 state:()=>({phase:controller?.phase,startup:controller?.startup?.stage,handoff:controller?.handoff?.stage,screen:controller?.displayedState?.screenId,phonePresence:phonePresence.value,contentPresence:Number(host.dataset.contentPresence??1),busy:foreground?.busy(host,true),contentBusy:foreground?.contentBusy(host),viewport:{width:innerWidth,height:innerHeight},pixelMap:!!pixelPlan,production:productionMode,development:localDevelopment})};
`;
await build({entryPoints:[src+'/journey-guided-main.js'],nodePaths:[root+'/apps/max-game/source/vendor',packages],bundle:true,format:'esm',platform:'browser',target:['es2022'],outfile:dir+'/final-capture-app.js',minify:true,plugins:[{name:'capture-state-only',setup(b){b.onLoad({filter:/journey-guided-main\.js$/},args=>{const original=fs.readFileSync(args.path,'utf8'),needle='onSnapshot:snapshot=>{managedSnapshot(snapshot);';if(!original.includes(needle))throw Error('Snapshot hook changed');return {contents:'let __captureSnapshot=null;\n'+original.replace(needle,'onSnapshot:snapshot=>{if(__captureSnapshot)return;managedSnapshot(snapshot);')+hook,loader:'js'};});}}]});
const sha=filename=>createHash('sha256').update(fs.readFileSync(filename)).digest('hex'),sourceBuild=JSON.parse(fs.readFileSync(root+'/apps/max-game/www/webgl-v5/r9-build.json'));
const mismatches=Object.entries(sourceBuild.inputs).filter(([p,h])=>p.startsWith('client/')&&fs.existsSync(root+'/apps/max-game/source/'+p)&&sha(root+'/apps/max-game/source/'+p)!==h);if(mismatches.length)throw Error('Source differs from final build: '+mismatches.map(([p])=>p));
fs.writeFileSync(dir+'/final-provenance.json',JSON.stringify({revision:'max-current-screens-20261023.pixel-map',created:new Date().toISOString(),resolution:{width:3072,height:1536},view:'pixel-map',base:'UI/figma-plugins/max-current-screens',catalogRevision:catalog.contentRevision,sourceBuild,snapshotCount:fixtures.length,uniqueScreens:expected.length,excluded,productionBundleSha256:sha(productionRoot+'/www/webgl-v5/app.js'),productionRoot:path.relative(root,productionRoot).replaceAll('\\','/'),productionEntry:JSON.parse(fs.readFileSync(productionRoot+'/app.json')).entry,policy,captureBundleSha256:sha(dir+'/final-capture-app.js'),instrumentation:'State injection only; no renderer, CSS, opacity, layout or text substitutions'},null,2));
console.log({fixtures:fixtures.length,uniqueScreens:expected.length,excluded});
