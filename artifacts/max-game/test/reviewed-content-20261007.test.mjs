import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {MISSION_CATALOG as base} from '../vendor/backend-figma-v2/src/content/mission-catalog.mjs';
import {assertMissionCatalog} from '../vendor/backend-figma-v2/src/contracts/mission-catalog.mjs';
import {createMissionModel,dispatchMissionCommand,restoreMissionModel} from '../vendor/backend-figma-v2/src/core/mission-core.mjs';
import {createMissionSessionApplication} from '../vendor/backend-figma-v2/src/application/mission-session.mjs';
import {createMemoryPersistencePort} from '../vendor/backend-figma-v2/src/application/memory-persistence.mjs';
import {applyAssetFlow} from '../scripts/apply-asset-flow.mjs';
import {applyReviewedAssets} from '../scripts/apply-reviewed-assets.mjs';
import {applyReviewedPresentation} from '../scripts/apply-reviewed-presentation.mjs';
import {fillReviewedBusinessPosts} from '../scripts/reviewed-business-posts.mjs';
import {prepareReviewedSvg,assertCanvasSafeReviewedSvg,sampleConicStops} from '../scripts/prepare-reviewed-svg.mjs';
import {V5_MISSION_CATALOG as catalog} from '../src/journey-v5-backend.mjs';

const json=async name=>JSON.parse(await fs.readFile(new URL('../src/reviewed-content/'+name,import.meta.url),'utf8'));
const flow=await json('flow.json'),rectCorrections=await json('flow-corrections.json');
const previous=applyAssetFlow(base,flow,{rectCorrections});
const completion='Цифровой ID создан – с помощью сервиса вы заселились в отель, подтвердили льготу и возраст. Поздравляем с прохождением миссии!';
const help='Заполним данные о чат-боте – логотип, название и выберем задачи, которые он будет решать';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('reviewed SVG preparation preserves every byte outside approved HTML paint wrappers and all supplied embedded photos',async()=>{
 const prepared=Object.values(catalog.assets).filter(a=>a.origin?.preparation?.kind==='canvas-safe-svg');
 assert.equal(prepared.length,6);
 for(const asset of prepared){
  const source=await fs.readFile(new URL('../public/'+asset.origin.sourceAssetPath,import.meta.url),'utf8');
  assert.equal(sha(source),asset.origin.sourceSha256);
  const output=await prepareReviewedSvg(source,{allowConic:asset.assetId==='figma.296-15260'});
  const accepted=await fs.readFile(new URL('../public/'+asset.path,import.meta.url),'utf8');
  assert.equal(accepted,output.svg);assert.equal(sha(accepted),asset.sha256);assertCanvasSafeReviewedSvg(accepted);
  assert.equal(output.removedBlurCount,asset.origin.preparation.removedBlurCount);
  assert.equal(output.convertedConicCount,asset.origin.preparation.convertedConicCount);
  let recovered=accepted;
  for(const edit of [...output.edits].reverse()){
   // Offset adjusts only for preceding edits; the untouched prefix is byte exact.
   const offset=edit.offset+output.edits.filter(e=>e.offset<edit.offset).reduce((n,e)=>n+e.replacement.length-e.original.length,0);
   assert.equal(recovered.slice(offset,offset+edit.replacement.length),edit.replacement);
   recovered=recovered.slice(0,offset)+edit.original+recovered.slice(offset+edit.replacement.length);
  }
  assert.equal(recovered,source,'restoring precisely the approved wrappers recovers the original source byte-for-byte');
  const images=s=>[...s.matchAll(/<image\b[^>]*>/g)].map(m=>m[0]);
  const originals=images(source);assert.ok(originals.length>0);
  assert.deepEqual(images(accepted).filter(m=>originals.includes(m)),originals,'all original image elements/photos retain exact data and geometry');
  const before=await sharp(Buffer.from(source)).ensureAlpha().raw().toBuffer();
  const after=await sharp(Buffer.from(accepted)).ensureAlpha().raw().toBuffer();
  if(output.convertedConicCount===0)assert.deepEqual(after,before,'comments rendering is unchanged after removing decorative HTML blur');
  else{
   assert.equal(output.convertedConicCount,7);assert.equal(output.removedBlurCount,1);
   let outside=0,paintChanges=0;
   for(let y=0;y<800;y++)for(let x=0;x<360;x++){
    const i=(y*360+x)*4,changed=!before.subarray(i,i+4).equals(after.subarray(i,i+4));
    if(changed&&!(x>=150&&x<=210&&y>=430&&y<=492))outside++;
    if(changed)paintChanges++;
   }
   assert.equal(outside,0,'only the embedded MAX conic paint area changes in the CPU rasterizer');
   assert.ok(paintChanges>500,'native gradient paints retain the MAX mark color');
  }
 }
});

test('SVG preparation rejects meaningful HTML, unknown CSS, unsafe references and malformed conic paint',async()=>{
 const box=style=>`<svg><foreignObject x="-10" y="-10" width="20" height="20"><div xmlns="http://www.w3.org/1999/xhtml" style="${style}"></div></foreignObject></svg>`;
 const valid='background:conic-gradient(from 90deg,rgba(255, 0, 0, 1) 0deg,rgba(0, 0, 255, 1) 360deg);height:100%;width:100%;opacity:1';
 await assert.rejects(()=>prepareReviewedSvg(box(valid)),/UNSUPPORTED_FOREIGN_OBJECT/);
 await assert.rejects(()=>prepareReviewedSvg(box(valid).replace('</div>','text</div>'),{allowConic:true}),/UNSUPPORTED_FOREIGN_OBJECT/);
 await assert.rejects(()=>prepareReviewedSvg(box(valid.replace('from 90deg','from 0deg')),{allowConic:true}),/UNSUPPORTED_FOREIGN_OBJECT/);
 await assert.rejects(()=>prepareReviewedSvg(box(valid.replace('360deg','300deg')),{allowConic:true}),/UNSUPPORTED_CONIC_STOPS/);
 await assert.rejects(()=>prepareReviewedSvg(box(valid).replace('width="20"','width="-20"'),{allowConic:true}),/UNSUPPORTED_CONIC_BOUNDS/);
 await assert.rejects(()=>prepareReviewedSvg(box(valid).replace('width="20"','width="2.0.0"'),{allowConic:true}),/UNSUPPORTED_CONIC_BOUNDS/);
 await assert.rejects(()=>prepareReviewedSvg(box(valid.replace('255, 0, 0, 1','255, 0, 0, 1.2.3')),{allowConic:true}),/UNSUPPORTED_CONIC_STOPS/);
 assert.throws(()=>assertCanvasSafeReviewedSvg('<svg><image href="https://example.test/p.png"/></svg>'),/NOT_CANVAS_SAFE/);
 assert.throws(()=>assertCanvasSafeReviewedSvg('<svg><image href="../unsafe.png"/></svg>'),/NOT_CANVAS_SAFE/);
 assert.throws(()=>assertCanvasSafeReviewedSvg('<svg><path fill="url(https://example.test/p.svg#id)"/></svg>'),/NOT_CANVAS_SAFE/);
 const stops=[{angle:0,color:[255,0,0,255]},{angle:180,color:[0,0,255,255]},{angle:360,color:[255,0,0,255]}];
 assert.deepEqual(sampleConicStops(stops,0),[255,0,0,255]);assert.deepEqual(sampleConicStops(stops,90),[128,0,128,255]);
 assert.deepEqual(sampleConicStops(stops,180),[0,0,255,255]);assert.deepEqual(sampleConicStops(stops,-90),[128,0,128,255]);
 const output=await prepareReviewedSvg(box(valid),{allowConic:true});
 const png=Buffer.from(/href="data:image\/png;base64,([^"]+)"/.exec(output.svg)[1],'base64');
 const {data,info}=await sharp(png).raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,512);assert.equal(info.height,512);
 const pixel=(x,y)=>[...data.subarray((y*512+x)*4,(y*512+x)*4+4)];
 assert.ok(pixel(511,256)[0]>254,'positive X begins the supplied CSS stops');
 assert.ok(Math.abs(pixel(256,511)[0]-191)<=1,'positive Y advances clockwise to 90 degrees');
});

test('reviewed compiler includes exact requested copy while preserving export/revision/IDs/outcomes',()=>{
 const before=JSON.stringify(flow),compiled=applyReviewedAssets(previous);
 assert.deepEqual(compiled.catalog,catalog);assertMissionCatalog(catalog);
 assert.equal(JSON.stringify(flow),before);assert.equal(catalog.contentRevision,previous.catalog.contentRevision);
 assert.equal(catalog.tasks['communication.message'].title,'Голосовое / видеосообщение');
 assert.equal(catalog.tasks['business.bot'].screens['business.bot.filled'].instruction,help);
 assert.equal(catalog.tasks['communication.message'].screens['communication.message.voice-start'].instruction,'Отправим голосовое сообщение!');
 assert.equal(catalog.tasks['communication.message'].screens['communication.message.voice-stop'].instruction,'Приступим к записи');
 assert.equal(catalog.tasks['business.channel'].screens['business.channel.publish'].instruction,'Канал создан – продолжаем делиться новостями вашего бизнеса');
 assert.equal(catalog.tasks['digital-id.hotel'].screens['digital-id.hotel.present'].actions[0].label,'Заселиться с Цифровым ID');
 assert.equal(catalog.missions['digital-id'].completionText,completion);
 assert.equal(catalog.missions['digital-id'].qr.label,'Узнать больше о возможностях MAX');
 for(const [id,task] of Object.entries(previous.catalog.tasks)){
  assert.equal(catalog.tasks[id].startScreenId,task.startScreenId);
  assert.deepEqual(Object.keys(catalog.tasks[id].screens),Object.keys(task.screens));
  for(const [screenId,screen] of Object.entries(task.screens))assert.deepEqual(catalog.tasks[id].screens[screenId].actions.map(a=>({id:a.actionId,outcome:a.outcome})),screen.actions.map(a=>({id:a.actionId,outcome:a.outcome})));
 }
 const stale=structuredClone(previous.catalog);stale.tasks['communication.message'].title='Changed upstream title';
 assert.throws(()=>applyReviewedPresentation(stale),/PRESENTATION_OVERRIDE_STALE/);
});

test('requested voice and channel captions occur on actual active backend screens without restoring disabled intermediates',async()=>{
 const expected={
  'communication.message.voice-start':{assetId:'figma.296-16039',text:'Отправим голосовое сообщение!'},
  'communication.message.voice-stop':{assetId:'figma.296-16061',text:'Приступим к записи'},
  'business.channel.publish':{assetId:'figma.296-17887',text:'Канал создан – продолжаем делиться новостями вашего бизнеса'}
 };
 assert.equal(catalog.tasks['communication.message'].screens['communication.message.voice-recording'],undefined);
 assert.equal(catalog.tasks['business.channel'].screens['business.channel.ready'],undefined);
 assert.equal(catalog.tasks['communication.message'].screens['communication.message.voice-start'].actions[0].outcome.screenId,'communication.message.voice-stop');
 assert.equal(catalog.tasks['business.channel'].screens['business.channel.publish'].actions[0].outcome.screenId,'business.channel.result');
 assert.equal(catalog.tasks['communication.message'].screens['communication.message.voice-preview'].instruction,previous.catalog.tasks['communication.message'].screens['communication.message.voice-preview'].instruction);
 assert.equal(catalog.tasks['business.channel'].screens['business.channel.result'].instruction,previous.catalog.tasks['business.channel'].screens['business.channel.result'].instruction);
 const seen=[];
 for(const missionId of ['communication','business']){
  let model=createMissionModel(catalog,{sessionId:'requested-caption.'+missionId}),now=1000,serial=0;
  const send=(type,fields={},internal=false)=>{
   const result=dispatchMissionCommand(catalog,model,{schemaVersion:1,type,commandId:'caption.'+(++serial),sessionId:model.state.sessionId,contentRevision:catalog.contentRevision,expectedRevision:model.state.revision,...fields},{now,internal});
   assert.equal(result.reply.ok,true,result.reply.code);model=result.model;
  };
  send('OWNER_CHANGED',{active:true},true);send('SELECT_MISSION',{missionId});send('HOLD_CONFIRMED',{},true);
  for(let i=0;i<100&&model.state.status!=='completed';i++){
   if(model.state.status==='result'){now+=800;send('ADVANCE_RESULT');continue;}
   const screen=catalog.tasks[model.state.taskId].screens[model.state.screenId],copy=expected[screen.screenId];
   if(copy){
    const persistence=createMemoryPersistencePort();await persistence.create(model.state.sessionId,{schemaVersion:2,mission:model,layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:now});
    const app=createMissionSessionApplication({catalog,persistence,now:()=>now}),snapshot=await app.getSnapshot(model.state.sessionId);
    assert.equal(snapshot.state.screenId,screen.screenId);assert.equal(snapshot.view.instruction.text,copy.text);
    assert.equal(snapshot.view.device.asset.assetId,copy.assetId);seen.push(screen.screenId);await app.close();
   }
   send('ACT',{screenId:screen.screenId,actionId:screen.actions.find(a=>a.outcome.kind!=='incorrect').actionId});
  }
 }
 assert.deepEqual(seen,Object.keys(expected));
 for(const screenId of Object.keys(expected)){
  const stale=structuredClone(previous.catalog),taskId=screenId.startsWith('communication')?'communication.message':'business.channel';
  stale.tasks[taskId].screens[screenId].instruction='Unexpected upstream copy';
  assert.throws(()=>applyReviewedPresentation(stale),new RegExp('PRESENTATION_OVERRIDE_STALE: '+screenId.replaceAll('.','\\.')));
 }
});

test('all supplied comment SVG states are explicit; active hotspots hit the actual image controls',async()=>{
 const expected={post:'Комментарии.svg',input:'Комментарии-3.svg',reply:'Комментарии-4.svg',sent:'Комментарии-2.svg',result:'Комментарии-1.svg'};
 for(const [suffix,sourcePath] of Object.entries(expected)){
  const id='blogger.comments.'+suffix,assetId=base.tasks['blogger.comments'].screens[id].assetId,asset=catalog.assets[assetId];
  assert.equal(asset.origin.sourcePath,sourcePath);assert.equal(asset.width,360);assert.equal(asset.height,800);
  const bytes=await fs.readFile(new URL('../public/'+asset.path,import.meta.url));assert.equal(sha(bytes),asset.sha256);
  const svg=bytes.toString();assert.match(svg,/<image\b/);assert.match(svg,/data:image\/[^;]+;base64,/);
  assert.equal(/<script\b|(?:href|src)="https?:/.test(svg),false);
 }
 const hit=(screenId,x,y)=>{const [rx,ry,w,h]=catalog.tasks['blogger.comments'].screens[screenId].actions[0].rect;return x>=rx&&x<=rx+w&&y>=ry&&y<=ry+h;};
 assert.equal(hit('blogger.comments.post',150,698),true);
 assert.equal(hit('blogger.comments.input',170,491),true);
 assert.equal(hit('blogger.comments.reply',334,492),true,'the original normalized region missed the supplied SVG send button');
 assert.equal(hit('blogger.comments.reply',334,600),false,'keyboard taps cannot send the prepared response');
 const asset=catalog.assets[catalog.tasks['blogger.comments'].screens['blogger.comments.post'].assetId];
 const {data}=await sharp(await fs.readFile(new URL('../public/'+asset.path,import.meta.url))).extract({left:8,top:140,width:286,height:194}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 let colorPixels=0;for(let i=0;i<data.length;i+=3)if(Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])>20)colorPixels++;
 assert.ok(colorPixels>5000,'the supplied post contains the real colorful photo instead of a flat grey placeholder');
});

test('all mission finals use the supplied branded QR while retaining IDs, labels and digital-ID custom copy',async()=>{
 assert.equal(catalog.missions['digital-id'].qr.assetId,'official.digital-id-qr');
 assert.equal(catalog.missions['digital-id'].qr.url,'https://max.ru/');
 for(const id of ['blogger','communication','business']){
  assert.equal(catalog.missions[id].qr.assetId,previous.catalog.missions[id].qr.assetId);
  assert.equal(catalog.missions[id].qr.label,previous.catalog.missions[id].qr.label);
 }
 assert.equal(catalog.missions['digital-id'].qr.label,'Узнать больше о возможностях MAX');
 assert.equal(catalog.missions['digital-id'].completionText,completion);
 const shared=catalog.assets['official.max-qr'];
 for(const mission of Object.values(catalog.missions)){
  assert.equal(mission.qr.url,'https://max.ru/');
  assert.equal(catalog.assets[mission.qr.assetId].path,shared.path);
  assert.equal(catalog.assets[mission.qr.assetId].sha256,shared.sha256);
 }
 const old=previous.catalog.assets['official.max-qr'];
 assert.equal(sha(await fs.readFile(new URL('../vendor/backend-figma-v2/'+old.path,import.meta.url))),old.sha256,'the original accepted QR asset is unchanged');
 for(const id of ['official.max-qr','official.max-qr-png','official.digital-id-qr','official.digital-id-qr-png']){
  const asset=catalog.assets[id],bytes=await fs.readFile(new URL('../public/'+asset.path,import.meta.url));assert.equal(sha(bytes),asset.sha256);
  const image=await sharp(bytes).metadata();assert.equal(image.width,asset.width);assert.equal(image.height,asset.height);
  assert.equal(asset.origin.decodedUrl,'https://max.ru/');assert.match(asset.origin.sourcePath,/^logo\/qr913234(?:59\.svg|63\.png)$/);
 }
 const svg=await fs.readFile(new URL('../public/'+shared.path,import.meta.url));assert.match(svg.toString(),/<image\b/,'native SVG includes its supplied central MAX logo');
 const logo=await sharp(svg).resize(625,625).extract({left:250,top:250,width:125,height:125}).removeAlpha().raw().toBuffer();
 let colorful=0;for(let i=0;i<logo.length;i+=3)if(Math.max(logo[i],logo[i+1],logo[i+2])-Math.min(logo[i],logo[i+1],logo[i+2])>80)colorful++;
 assert.ok(colorful>5000,'the central MAX logo retains its original blue/purple artwork');
 const stale=structuredClone(previous);stale.catalog.assets['official.max-qr'].sha256='0'.repeat(64);
 assert.throws(()=>applyReviewedAssets(stale),/Invalid shared reviewed QR asset/);
 const gameplay=structuredClone(previous);gameplay.catalog.tasks['digital-id.hotel'].screens['digital-id.hotel.present'].assetId='official.max-qr';
 assert.throws(()=>applyReviewedAssets(gameplay),/Invalid shared reviewed QR asset/,'a shared gameplay image cannot pass the QR-only replacement gate');
 for(const path of ['integration/current/code/client/src/reviewed-content/mission-catalog.json','integration/current/code/stand/src/reviewed-content/mission-catalog.json','integration/current/host/MASTER/app/canonical-max/artifacts/max-game/src/reviewed-content/mission-catalog.json']){
  const value=JSON.parse(await fs.readFile(new URL('../../../'+path,import.meta.url),'utf8'));assert.deepEqual(value,catalog);assertMissionCatalog(value);
 }
});

test('business post photos reuse supplied SVG bytes and preserve every opaque pixel outside their grey regions',async()=>{
 const asset=catalog.assets[catalog.tasks['business.channel'].screens['business.channel.result'].assetId];
 const sourceSvg=await fs.readFile(new URL('../../../'+asset.origin.sourcePath,import.meta.url),'utf8');
 const sourcePng=await fs.readFile(new URL('../vendor/backend-figma-v2/'+base.assets['figma.296-18120'].path,import.meta.url));
 assert.equal(sha(sourceSvg),asset.origin.sourceSha256);assert.equal(sha(sourcePng),asset.origin.basePngSha256);
 const generated=await fillReviewedBusinessPosts(sourceSvg,sourcePng),bytes=await fs.readFile(new URL('../public/'+asset.path,import.meta.url));
 assert.equal(generated.svg,bytes.toString());assert.equal(sha(bytes),asset.sha256);
 assert.equal(generated.width,1742);assert.equal(generated.height,1162);assert.deepEqual(generated.maskPixels,[40704,93690]);
 const before=await sharp(sourcePng).ensureAlpha().raw().toBuffer();
 const {data:after,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let changedInside=0,changedOutside=0,greyRemaining=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const i=(y*info.width+x)*4,inside=x>=615&&x<=1044&&(y>=164&&y<=265||y>=591&&y<=879);
  const changed=before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2]||before[i+3]!==after[i+3];
  if(changed&&inside)changedInside++;if(changed&&!inside&&before[i+3]===255)changedOutside++;
  if(inside&&before[i]===82&&before[i+1]===82&&before[i+2]===82&&after[i]===82&&after[i+1]===82&&after[i+2]===82)greyRemaining++;
 }
 assert.ok(changedInside>130000,'both originally blank photo areas are filled');
 assert.equal(changedOutside,0,'phone controls/text and surrounding coffee cards remain unchanged');
 assert.ok(greyRemaining<3000,'only antialiased borders remain grey');
});

test('digital-ID ready home uses the supplied actual portrait without changing onboarding or Continue semantics',async()=>{
 const task=catalog.tasks['digital-id.create-id'],ready=task.screens['digital-id.create-id.ready'];
 const original=previous.catalog.tasks['digital-id.create-id'].screens['digital-id.create-id.ready'];
 assert.equal(ready.assetId,original.assetId);assert.deepEqual(ready.actions,original.actions);
 assert.equal(ready.actions[0].placement,'below-screen');assert.equal(ready.actions[0].outcome.kind,'complete-task');
 assert.equal(ready.instruction,original.instruction);assert.equal(task.startScreenId,'digital-id.create-id.start');
 const start=task.screens[task.startScreenId];assert.deepEqual(catalog.assets[start.assetId],previous.catalog.assets[start.assetId]);
 const asset=catalog.assets[ready.assetId],bytes=await fs.readFile(new URL('../public/'+asset.path,import.meta.url));
 assert.equal(asset.origin.sourcePath,'Главная с фото. Нет льгот.svg');assert.equal(sha(bytes),asset.sha256);
 assert.equal(asset.width,360);assert.equal(asset.height,800);assert.equal(asset.mimeType,'image/svg+xml');
 const source=base.assets[original.assetId];assert.equal(sha(await fs.readFile(new URL('../vendor/backend-figma-v2/'+source.path,import.meta.url))),source.sha256,'original accepted home is retained');
 const portrait=await sharp(bytes).extract({left:105,top:145,width:150,height:185}).removeAlpha().raw().toBuffer();
 let colors=0;for(let i=0;i<portrait.length;i+=3)if(Math.max(portrait[i],portrait[i+1],portrait[i+2])-Math.min(portrait[i],portrait[i+1],portrait[i+2])>25)colors++;
 assert.ok(colors>10000,'the portrait region contains the supplied real photo');
});

for(const missionId of Object.keys(catalog.missions))test(`saved ${missionId} progress and receipts restore after copy/assets update`,async()=>{
 let model=createMissionModel(previous.catalog,{sessionId:'content-update.'+missionId}),now=1000,serial=0;
 const send=(type,fields={},internal=false)=>{
  const command={schemaVersion:1,type,commandId:'content.'+(++serial),sessionId:model.state.sessionId,contentRevision:previous.catalog.contentRevision,expectedRevision:model.state.revision,...fields};
  const result=dispatchMissionCommand(previous.catalog,model,command,{now,internal});assert.equal(result.reply.ok,true,result.reply.code);model=result.model;
  const restored=restoreMissionModel(catalog,model);assert.equal(restored.ok,true,restored.message);assert.deepEqual(restored.model,model);
 };
 send('OWNER_CHANGED',{active:true},true);send('SELECT_MISSION',{missionId});send('HOLD_CONFIRMED',{},true);
 for(let i=0;i<100&&model.state.status!=='completed';i++){
  if(model.state.status==='result'){now+=800;send('ADVANCE_RESULT');continue;}
  const screen=previous.catalog.tasks[model.state.taskId].screens[model.state.screenId];
  const action=screen.screenId==='blogger.channel.privacy'?screen.actions.find(a=>a.actionId==='channel.continue-private'):
   screen.actions.find(a=>a.outcome.kind!=='incorrect'&&a.actionId!=='channel.keep-old-link');
  send('ACT',{screenId:screen.screenId,actionId:action.actionId});
 }
 assert.equal(model.state.status,'completed');
 const persistence=createMemoryPersistencePort();await persistence.create(model.state.sessionId,{schemaVersion:2,mission:model,layouts:{layoutRevision:0,positions:{},receipts:[]},clockCheckpointAt:now});
 const app=createMissionSessionApplication({catalog,persistence,now:()=>now});
 const snapshot=await app.getSnapshot(model.state.sessionId);
 const publicProgress=structuredClone(model.state.progress);for(const p of Object.values(publicProgress))delete p.channelModel;
 assert.deepEqual(snapshot.state.progress,publicProgress);
 assert.equal(snapshot.view.qr.asset.assetId,catalog.missions[missionId].qr.assetId);
 assert.equal(snapshot.view.qr.asset.path,catalog.assets['official.max-qr'].path);
 assert.equal(snapshot.view.qr.asset.sha256,catalog.assets['official.max-qr'].sha256);
 if(missionId==='digital-id'){assert.equal(snapshot.view.result.text,completion);assert.equal(snapshot.view.qr.label,'Узнать больше о возможностях MAX');}
 await app.close();
});
