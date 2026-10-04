import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {V5_MISSION_CATALOG as catalog,createV5MissionSessionApplication as createApp} from '../src/journey-v5-backend.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {createWebGLSession} from '../src/application/webgl-session.mjs';
import {sharedRevealContent} from '../src/journey-shared-reveal.mjs';
import {v5StartupPlan,v5StartupScreen} from '../src/journey-v5-startup-assets.mjs';
import {v5IconAsset,v5IconTile,v5IconUrls} from '../src/journey-v5-icons.mjs';
import {MISSION_CATALOG as old} from '../src/content/mission-catalog.mjs';

test('v5 imports final catalog/core; previous edition remains separate; final screens enumerate without eager preparation',async()=>{
 const metadata=JSON.parse(await fs.readFile(new URL('../src/reviewed-content/annotation-source.json',import.meta.url),'utf8'));
 assert.equal(catalog.contentRevision,metadata.revision);
 assert.equal(metadata.flowSchemaVersion,3);
 assert.equal(Object.keys(old.missions).length,6);
 const content=sharedRevealContent(catalog),plan=v5StartupPlan(catalog,v5IconUrls());
 assert.equal(content.missions.length,4);assert.equal(plan.screens.length,70);assert.deepEqual(plan.urls,[...new Set(v5IconUrls())]);assert.equal(plan.contentUrls.length,71);
 for(const row of plan.screens){assert.ok(row.asset);assert.match(v5StartupScreen(row).markup,/task-media-image/);}
 const ids=[...Object.keys(catalog.tasks),...Object.keys(catalog.missions),...Object.keys(catalog.uiIcons),'unassigned-new-task'];
 for(const id of ids){
  const {asset,glyph}=v5IconAsset(catalog,id),markup=v5IconTile(catalog,id);
  const svg=await fs.readFile(new URL('../public/'+glyph.path,import.meta.url),'utf8');
  assert.equal(createHash('sha256').update(svg).digest('hex'),glyph.sha256);
  assert.ok(markup.includes(asset.assetId));assert.ok(markup.includes(glyph.path));
  assert.doesNotMatch(svg,/foreignObject|<text|data-figma/);
  assert.equal(glyph.hasEmbeddedLabel,false);
  if(asset.hasEmbeddedLabel){assert.match(svg,/viewBox="[\d.]+ 0 120 120"/);assert.equal(glyph.radiusRatio,31.305/120);}
 }
 assert.equal(v5IconAsset(catalog,'unassigned-new-task').asset.assetId,'max-icon.missing');
});

for(const [missionId,branch] of [['blogger','public'],['blogger','private'],['digital-id','public'],['communication','public'],['business','public']]){
 test(`installed backend through actual WebGL SessionPort: ${missionId}/${branch}`,async()=>{
  let now=1000;const persistence=createMemoryPersistencePort(),id=`v5.${missionId}.${branch}`,errors=[];
  let app=createApp({persistence,now:()=>now});
  let session=createWebGLSession({port:app,catalog,sessionId:id,onError:e=>errors.push(e.code)});
  await session.start();await session.command('SELECT_MISSION',{missionId});
  await session.contact('hand','down',true);now+=400;await session.contact('hand','up',true);
  assert.equal(session.snapshot.state.status,'scan');
  await session.contact('hand2','down',true);now+=800;await session.contact('hand2','up',true);
  assert.equal(session.snapshot.state.status,'task');
  const seen=[];
  for(let n=0;n<160&&session.snapshot.state.status!=='completed';n++){
   const snap=session.snapshot,s=snap.state;
   if(s.status==='result'){now+=1000;await session.poll(now);continue;}
   seen.push(s.screenId);assert.ok(snap.view.nodes.every(node=>node.icon));
   const screen=catalog.tasks[s.taskId].screens[s.screenId];
   if(screen.automaticMs!==null){now+=screen.automaticMs+100;await session.poll(now);continue;}
   let action=snap.view.actions[0];
   if(s.screenId==='blogger.channel.privacy')action=snap.view.actions.find(a=>a.actionId===(branch==='public'?'channel.choose-public':'channel.continue-private'));
   if(s.screenId==='blogger.channel.public-confirm')action=snap.view.actions.find(a=>a.actionId==='channel.use-new-link');
   assert.equal(await session.act(s.screenId,'invalid',s.revision),null);
   const result=await session.act(s.screenId,action.actionId,s.revision);assert.equal(result.reply.ok,true);
   assert.equal(await session.act(s.screenId,action.actionId,s.revision),null,'stale second tap cannot advance');
   // Restore across the real adapter/app boundary on the public-link screen.
   if(session.snapshot.state.screenId==='blogger.channel.public-link'){
    await session.close();await app.close();now+=100;
    app=createApp({persistence,now:()=>now});session=createWebGLSession({port:app,catalog,sessionId:id,onError:e=>errors.push(e.code)});
    await session.start();assert.equal(session.snapshot.state.screenId,'blogger.channel.public-link');
    assert.equal(session.snapshot.state.progress.blogger.answers['channel-type'],'public');
   }
  }
  assert.equal(session.snapshot.state.status,'completed');assert.ok(session.snapshot.view.qr.asset.path);
  assert.deepEqual(session.snapshot.state.progress[missionId].completed,catalog.missions[missionId].taskIds);
  assert.deepEqual(session.snapshot.state.progress[missionId].skipped,[]);assert.deepEqual(errors,[]);
  if(missionId==='blogger')assert.equal(seen.includes('blogger.channel.public-link'),branch==='public');
  await session.restart();assert.equal(session.snapshot.state.status,'scan');assert.equal(session.snapshot.state.scanned,false);
  await session.close();await app.close();
 });
}
