import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {CHANNEL_CATALOG as previousChannel} from '../src/content/channel-catalog.mjs';
import {MISSION_CATALOG as previousMissions} from '../src/content/mission-catalog.mjs';
import {assertMissionCatalog} from '../src/contracts/mission-catalog.mjs';
import {assertTaskCatalog} from '../src/contracts/task-catalog.mjs';
import {applyMaxIcons} from './apply-max-icons.mjs';

export const REVISION='missions-figma-20261003-151916-v2';
export const EXPORT_FOLDER='2026-10-03_15-19-16';
const sha=b=>createHash('sha256').update(b).digest('hex');
// An explicit mapping of the approved ordered map, never inferred from frame names.
const mapping=[
 ['blogger',[
  ['blogger.channel',['chats','menu','name','filled','privacy','public-confirm','public-link','public-filled','subscribers','created','result']],
  ['blogger.comments',['post','input','reply','sent','result']],
  ['blogger.statistics',['menu','statistics']]]],
 ['digital-id',[
  ['digital-id.create-id',['start','documents','redirect','confirm','quick','biometry','ready']],
  ['digital-id.hotel',['arrival','present','result']],
  ['digital-id.benefit',['arrival','present','result']],
  ['digital-id.age',['arrival','present','result']]]],
 ['communication',[
  ['communication.call',['chat','calling','connected','result']],
  ['communication.message',['voice-start','voice-recording','voice-stop','voice-preview','voice-sent','video-start','video-ready','video-recording','video-stop','video-preview','video-sent']],
  ['communication.reaction',['chat','stickers','preview','sent']],
  ['communication.story',['start','duration','audience','publish','ready']]]],
 ['business',[
  ['business.platform',['login','profile','verification','ready','result']],
  ['business.channel',['create','continue','open','setup','details','description','type','publish','ready','result']],
  ['business.bot',['create','details','filled','ready','conversation','result']],
  ['business.store',['start','connect','publish','ready','result']]]]
];
const editorial=new Set(['текст убран','текст справки удалён по комментарию клиента','без текста, продолжение прошлого экрана']);
const within=(root,relative)=>{const full=path.resolve(root,relative),rel=path.relative(root,full);if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('Unsafe export path');return full;};
const requireValue=(ok,message)=>{if(!ok)throw Error(message);};

export async function loadFigmaContentRelease(exportRoot,publicRoot){
 const catalogBytes=await fs.readFile(path.join(exportRoot,'catalog.json'));
 const exported=JSON.parse(catalogBytes),journal=JSON.parse(await fs.readFile(path.join(exportRoot,'export.json'),'utf8'));
 requireValue(exported.status==='complete'&&journal.state==='complete'&&!exported.unexported.length,'Export must be complete');
 const map=exported.source.contentMap,records=new Map(exported.screens.map(r=>[r.id,r]));
 requireValue(map?.missions?.length===mapping.length,'Expected four approved missions');
 requireValue(records.size===103&&exported.requested.length===103&&new Set(exported.requested).size===103&&exported.requested.every(id=>records.has(id)),'Expected exactly 103 unique approved visuals');
 const evidence=new Map(journal.frames.flatMap(f=>f.files).map(f=>[f.path,f]));
 const files=new Map(),assets={},tasks={},missions={},reviewNotes=[],used=new Set(),sourceRows=[];
 async function asset(nodeId){
  requireValue(!used.has(nodeId),`Repeated visual ${nodeId}`);used.add(nodeId);
  const r=records.get(nodeId);requireValue(r,`Missing record ${nodeId}`);
  const proof=evidence.get(r.pngFile);requireValue(proof,`PNG not in journal ${nodeId}`);
  const bytes=await fs.readFile(within(exportRoot,r.pngFile));
  requireValue(bytes.length===proof.bytes&&sha(bytes)===proof.sha256,`PNG checksum mismatch ${nodeId}`);
  requireValue(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`Invalid PNG ${nodeId}`);
  const id=`figma.${nodeId.replaceAll(':','-')}`,filename=`assets/figma-20261003/${nodeId.replaceAll(':','-')}.png`;
  assets[id]={assetId:id,path:filename,mimeType:'image/png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:proof.sha256,origin:{kind:'figma-content-export',exportFolder:EXPORT_FOLDER,nodeId,sourcePath:r.pngFile}};
  files.set(filename,bytes);return {r,id};
 }
 for(let mi=0;mi<mapping.length;mi++){
  const [missionId,taskMap]=mapping[mi],m=map.missions[mi];
  requireValue(m.order===mi+1&&m.icons.length===taskMap.length+1&&m.icons[0].screens.length===0,`Unexpected mission structure ${missionId}`);
  const start=await asset(m.icons[0].visualNodeId),taskIds=[];
  for(let ti=0;ti<taskMap.length;ti++){
   const [taskId,keys]=taskMap[ti],i=m.icons[ti+1],screens={};taskIds.push(taskId);
   requireValue(i.screens.length===keys.length,`Screen sequence changed ${taskId}`);
   const icon=await asset(i.visualNodeId);
   for(let si=0;si<keys.length;si++){
    const source=i.screens[si],screenId=`${taskId}.${keys[si]}`;
    requireValue(source.status==='ready'&&source.visualCount===1&&source.order===si+1,`Unresolved screen ${screenId}`);
    const {r,id}=await asset(source.visualNodeId);
    requireValue(JSON.stringify(r.instruction)===JSON.stringify(source.instruction),`Instruction mismatch ${screenId}`);
    const raw=r.instruction.text,suppressed=editorial.has(raw.trim().toLowerCase());
    if(suppressed)reviewNotes.push({screenId,kind:'editorial-instruction-suppressed',raw});
    const instruction=suppressed?'':raw;
    const next=keys[si+1]?`${taskId}.${keys[si+1]}`:null;
    const baseline=previousMissions.tasks[taskId]?.screens[screenId];
    const label=next?'Продолжить':'К следующему заданию';
    screens[screenId]={screenId,deviceKind:assets[id].width>assets[id].height?'pc':'phone',assetId:id,instruction,
     annotations:[],missing:null,automaticMs:null,
     actions:[{actionId:`${screenId}.continue`,label,placement:'below-screen',outcome:next?{kind:'navigate',screenId:next}:{kind:'complete-task'}}],
     origin:{exportFolder:EXPORT_FOLDER,missionNodeId:m.nodeId,iconNodeId:i.nodeId,screenNodeId:source.nodeId,visualNodeId:r.id,screenOrder:si+1,instructionRaw:raw,instructionBlocks:r.instruction.blocks},
     interactionSource:'ordered-content-map'};
    // Preserve established actions only when the semantic screen and its successor match.
    if(baseline&&!baseline.missing&&taskId!=='blogger.channel'){
     const b=structuredClone(baseline);
     screens[screenId].actions=b.actions;
     for(const a of screens[screenId].actions){
      if(a.outcome.kind==='complete-task'&&next){a.outcome={kind:'navigate',screenId:next};if(a.label==='К следующему заданию')a.label='Продолжить';}
      if(a.outcome.kind==='navigate'&&(taskId!=='digital-id.create-id'||!keys.some(k=>`${taskId}.${k}`===a.outcome.screenId)))a.outcome=next?{kind:'navigate',screenId:next}:{kind:'complete-task'};
     }
     screens[screenId].automaticMs=b.automaticMs;
     screens[screenId].interactionSource='existing-semantic-action';
    }
    sourceRows.push({missionId,taskId,screenId,sourceOrder:si+1,visualNodeId:r.id,assetId:id,deviceKind:screens[screenId].deviceKind});
   }
   tasks[taskId]={taskId,title:i.text,iconAssetId:icon.id,startScreenId:`${taskId}.${keys[0]}`,screens};
  }
  missions[missionId]={...structuredClone(previousMissions.missions[missionId]),title:m.text,taskIds,missing:[],startAssetId:start.id};
 }
 requireValue(used.size===records.size,'Some source visuals were omitted');
 // Preserve the approved public/private graph and rescale hotspots to the new PNGs.
 const channelTask=tasks['blogger.channel'];
 for(const [sid,old] of Object.entries(previousChannel.screens)){
  const screen=channelTask.screens[sid],a=assets[screen.assetId],oldAsset=previousChannel.assets[old.assetId];
  requireValue(Math.abs(a.width/a.height-oldAsset.width/oldAsset.height)<0.005,`Channel aspect changed ${sid}`);
  screen.mode=old.mode;screen.actions=structuredClone(old.actions);screen.interactionSource='existing-channel-graph';
  for(const action of screen.actions){
   if(action.rect)action.rect=action.rect.map((v,j)=>v*(j%2?a.height/oldAsset.height:a.width/oldAsset.width));
   if(action.outcome.kind==='complete-task'){action.outcome={kind:'navigate',screenId:'blogger.channel.result'};action.label='Продолжить';}
  }
 }
 channelTask.screens['blogger.channel.result'].mode='manual';
 const channel={...structuredClone(previousChannel),contentRevision:'channel-figma-20261003-151916-v1',assets:Object.fromEntries(Object.values(channelTask.screens).map(s=>[s.assetId,assets[s.assetId]])),screens:structuredClone(channelTask.screens)};
 assertTaskCatalog(channel);channelTask.coreCatalog=channel;
 const qr=structuredClone(previousMissions.assets['official.max-qr']),qrBytes=await fs.readFile(within(publicRoot,qr.path));
 requireValue(sha(qrBytes)===qr.sha256,'QR checksum mismatch');assets[qr.assetId]=qr;files.set(qr.path,qrBytes);
 const catalog={schemaVersion:1,contentRevision:REVISION,assets,tasks,missions};
 const iconSelection=await applyMaxIcons(catalog,files);assertMissionCatalog(catalog);
 const metadata={schemaVersion:1,revision:REVISION,sourceFolder:EXPORT_FOLDER,sourceCatalogSha256:sha(catalogBytes),sourceRecords:records.size,missions:4,tasks:15,screens:84,icons:19,reviewNotes,sourceRows,
  limitations:['Explicit new sessions; old progress is not auto-migrated.','Four source missions only; old test missions remain in the previous release.','Unknown screenshot hit-targets use one existing below-screen action; visual acceptance remains pending.','Original images are unchanged, including text drawn inside screenshots.']};
 metadata.sourceIcons=metadata.icons;metadata.icons=Object.keys(catalog.assets).filter(id=>id.startsWith('max-icon.')).length;
 metadata.iconSelection=iconSelection;
 return {catalog,channel,files,metadata};
}

export function releaseModules({catalog,channel}){
 const json=v=>JSON.stringify(v,null,2);
 return new Map([
  ['src/content/mission-catalog.mjs',Buffer.from(`import {deepFreeze} from '../contracts/mission-command.mjs';\nexport const MISSION_CONTENT_REVISION=${json(REVISION)};\nexport const MISSION_CATALOG=deepFreeze(${json(catalog)});\nexport const BUSINESS_TASKS=deepFreeze({channel:'business.channel',bot:'business.bot',store:'business.store'});\n`)],
  ['src/content/channel-catalog.mjs',Buffer.from(`import {freezeTaskCatalog} from '../contracts/task-catalog.mjs';\nexport const CHANNEL_CATALOG=freezeTaskCatalog(${json(channel)});\n`)]
 ]);
}
