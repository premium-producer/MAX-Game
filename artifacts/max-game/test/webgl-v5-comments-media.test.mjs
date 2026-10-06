import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const profiles=[new URL('../src/',import.meta.url),new URL('../../../integration/current/code/client/src/',import.meta.url),new URL('../../../integration/current/code/stand/src/',import.meta.url)];
const publicRoot=new URL('../public/',import.meta.url);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const rasters=new Map();

for(const dir of profiles){
 const label=dir.pathname.includes('/integration/')?dir.pathname.includes('/stand/')?'stand':'pinned client':'client source';
 const {V5_MISSION_CATALOG:catalog}=await import(new URL('journey-v5-backend.mjs',dir));
 const {V5RevealJourney}=await import(new URL('journey-v5-route-layout.mjs',dir));
 const {sharedRevealContent}=await import(new URL('journey-shared-reveal.mjs',dir));
 const {sharedTaskMarkup,sharedAssetUrl}=await import(new URL('journey-shared-ui.mjs',dir));
 const {v5StartupPlan}=await import(new URL('journey-v5-startup-assets.mjs',dir));
 const {createMissionSessionApplication}=await import(new URL('../vendor/backend-figma-v2/src/application/mission-session.mjs',dir));
 const {createMemoryPersistencePort}=await import(new URL('../vendor/backend-figma-v2/src/application/memory-persistence.mjs',dir));
 const {createWebGLSession}=await import(new URL('application/webgl-session.mjs',dir));

 test(`${label}: all five imported comments frames are URL-image canvas safe and render nonblack pixels`,async()=>{
  const assets=Object.values(catalog.assets).filter(a=>/reviewed-20261007\/comments-/.test(a.path));
  assert.equal(assets.length,5);
  const plan=v5StartupPlan(catalog);
  for(const asset of assets){
   const bytes=await readFile(new URL(asset.path,publicRoot)),svg=bytes.toString('utf8');
   assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.path);
   assert.ok(!/<(?:\w+:)?foreignObject\b/i.test(svg),`${asset.path}: URL SVG foreignObject taints canvas`);
   assert.ok(!/<script\b|(?:href|xlink:href)=["'](?:https?:|\/\/)/i.test(svg));
   assert.ok(/<image\b[^>]*(?:href|xlink:href)=["']data:image\//i.test(svg),'embedded photographic content survives');
   const referenced=plan.screens.some(row=>row.asset?.path===asset.path);
   if(referenced)assert.ok([...(plan.contentUrls??[]),...plan.urls].includes(sharedAssetUrl(asset)),`${asset.path}: active media enumeration`);
   assert.ok(asset.origin.sourceSha256,'retain the supplied original hash');
   const originalPath=asset.origin.sourceAssetPath??asset.path.replace(/-[0-9a-f]{12}\.svg$/,`-${asset.origin.sourceSha256.slice(0,12)}.svg`);
   const original=await readFile(new URL(originalPath,publicRoot));
   assert.equal(createHash('sha256').update(original).digest('hex'),asset.origin.sourceSha256,'original bytes remain intact');
   assert.equal(svg,original.toString('utf8').replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/g,''),'only empty blur HTML removed; photo/vector/XML bytes preserved');
   if(!rasters.has(asset.sha256))rasters.set(asset.sha256,sharp(bytes).resize(360,800).ensureAlpha().raw().toBuffer({resolveWithObject:true}));
   const {data,info}=await rasters.get(asset.sha256);
   assert.equal(info.width,360);assert.equal(info.height,800);
   let bright=0,opaque=0;
   for(let i=0;i<data.length;i+=4){if(data[i+3]>200)opaque++;if(Math.max(data[i],data[i+1],data[i+2])>64&&data[i+3]>200)bright++;}
   assert.ok(opaque>360*800*.9,`${asset.path}: complete phone frame`);
   assert.ok(bright>360*800*.15,`${asset.path}: frame must not be solid black`);
  }
 });

 test(`${label}: native channel→comments handoff waits for media then the actual hotspot accepts a tap`,async()=>{
  let now=1000,c;
  const app=createMissionSessionApplication({catalog,persistence:createMemoryPersistencePort(),now:()=>now});
  const session=createWebGLSession({catalog,port:app,sessionId:`comments-media-${label.replaceAll(' ','-')}`,onSnapshot:s=>c?.accept(s),onError:assert.fail});
  const settle=(ready=true)=>{for(let i=0;i<30;i++)c.tick(.05,{active:true,settled:true,deviceReady:ready,deviceHidden:true,deviceShown:true,reduced:true});};
  try{
   await session.start();c=new V5RevealJourney(sharedRevealContent(catalog),session);c.configure(3200,1800,256);
   await session.command('SELECT_MISSION',{missionId:'blogger'});
   await session.contact('hand','down',true);now+=800;await session.contact('hand','up',true);settle();
   let reached=false;
   for(let i=0;i<100&&!reached;i++){
    const s=session.snapshot.state;
    if(s.status==='result'){now=s.resultReadyAt;await app.pollTime(s.sessionId);await flush();if(session.snapshot.state.screenId==='blogger.comments.post'){reached=true;break;}settle();continue;}
    settle();const screen=catalog.tasks[s.taskId].screens[s.screenId];
    if(screen.automaticMs!==null){now+=screen.automaticMs+1;await app.pollTime(s.sessionId);}
    else {const action=c.descriptor.actions.find(a=>a.actionId==='channel.continue-private')??c.descriptor.actions.find(a=>a.disabled!==true);assert.ok(action);assert.equal(c.answer(action.actionId,c.token()),true);await flush();}
    await flush();
   }
   assert.equal(reached,true);assert.equal(session.snapshot.state.screenId,'blogger.comments.post');
   settle(false);assert.equal(c.handoff?.stage,'trace');assert.notEqual(c.phase,'task');
   const actionId='blogger.comments.post.action-1',revision=session.snapshot.state.revision;
   assert.equal(c.answer(actionId,c.token()),false,'unready media handoff cannot accept invisible hotspot');
   assert.equal(session.snapshot.state.revision,revision);
   settle(true);assert.equal(c.handoff,null);assert.equal(c.phase,'task');
   assert.equal(c.descriptor.instruction.text.replaceAll('\u00a0',' '),'Начинаем общение с подписчиками – переходим к комментариям!');
   const action=c.descriptor.actions.find(a=>a.actionId===actionId);
   assert.deepEqual(action.rect,[8,677,289,42]);assert.equal(action.placement,'hotspot');
   assert.equal(catalog.tasks['blogger.comments'].screens['blogger.comments.post'].actions.find(a=>a.actionId===actionId).outcome.screenId,'blogger.comments.input');
   const markup=sharedTaskMarkup(c.displaySnapshot);
   assert.ok(markup.includes(sharedAssetUrl(c.descriptor.device.asset)));assert.ok(markup.includes(`data-answer="${actionId}"`));
   assert.equal(c.answer(actionId,c.token()),true);await flush();
   assert.equal(session.snapshot.state.screenId,'blogger.comments.input');
   assert.ok(session.snapshot.state.revision>revision);
   for(const target of ['blogger.comments.reply','blogger.comments.result']){
    settle();const next=c.descriptor.actions[0];assert.ok(next);
    assert.equal(catalog.tasks['blogger.comments'].screens[session.snapshot.state.screenId].actions.find(a=>a.actionId===next.actionId).outcome.screenId,target);
    assert.equal(c.answer(next.actionId,c.token()),true);await flush();assert.equal(session.snapshot.state.screenId,target);
   }
  }finally{await session.close();await app.close();}
 });
}
