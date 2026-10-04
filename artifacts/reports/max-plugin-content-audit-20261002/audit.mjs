// Read-only comparison of preserved plugin payloads. No browser, Figma, or game execution.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {ID_TASKS,ID_IMAGES} from '../../max-game/src/journey-id.mjs';
const dir=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const oldDir='artifacts/DESIGN/figma-plugins/max-journey/internal/';
const newDir='artifacts/DESIGN/figma-plugins/max-content-builder/';
const ui=read(oldDir+'ui.html'),start=ui.indexOf('const DATA=');
const end=ui.indexOf(';\r\nconst $=',start)>=0?ui.indexOf(';\r\nconst $=',start):ui.indexOf(';\nconst $=',start);
const old=JSON.parse(ui.slice(start+11,end));
const html=Buffer.from(old.html,'base64').toString();
const bundle=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const oldManifest=json(oldDir+'source-manifest.json');
if(hash('artifacts/max-game/src/journey-id.mjs')!==oldManifest.files['artifacts/max-game/src/journey-id.mjs'])throw Error('Historical ID source changed');
// Evaluate only the extracted content literals, with local data factories; never the renderer.
const stage=(title,copy,scene,options=['Продолжить'],extra={})=>({title,copy,scene,options,correct:'*',...extra});
const edStart=bundle.indexOf('ed={'),edEnd=bundle.indexOf(',Kh=',edStart);
const presentation=vm.runInNewContext('('+bundle.slice(edStart+3,edEnd)+')',{ca:stage,oi:ID_TASKS},{timeout:1000});
const taskStart=bundle.indexOf('Kl={'),taskEnd=bundle.indexOf(';function nd',taskStart);
const tasks=vm.runInNewContext('('+bundle.slice(taskStart+3,taskEnd)+')',{wt:stage,oi:ID_TASKS,ed:presentation},{timeout:1000});
const currentCode=read(newDir+'code.js'),packStart=currentCode.indexOf('const PACK=');
const packEnd=currentCode.indexOf(';\n',packStart);
const current=JSON.parse(currentCode.slice(packStart+11,packEnd)).catalog;
const review=json('artifacts/DESIGN/max-game/max-review.json');
const savedText=json('artifacts/reports/max-copy-audit-20261002/figma-live-text.json');
const idText=json('artifacts/reports/max-copy-audit-20261002/figma-id-text.json');
const textMap=new Map(savedText.missions.flatMap(m=>m.frames).map(f=>[f.id,f.copy]));
for(const f of idText)textMap.set(f.id,f.texts.filter(t=>t.x>1000));
const revMap=new Map(review.screenMap.filter(s=>s.source?.revision===old.revision).map(s=>[s.source.id,s]));
const stepMap={channel:'blogger.channel',comments:'blogger.comments',statistics:'blogger.statistics','create-id':'digital-id.create-id',hotel:'digital-id.hotel',benefit:'digital-id.benefit',age:'digital-id.age',call:'communication.call',message:'communication.message',group:null,reaction:'communication.reaction',story:'communication.story',account:'business.platform','business-channel':'business.channel','business-bot':'business.bot','business-store':'business.store','demo-id':'digital-id.create-id','demo-benefit':'digital-id.benefit','demo-account':'business.platform','demo-tool':null};
const pathNorm=p=>p?.replace(/^\.\//,'')||null;
const oldScreens=old.catalogs.reveal.map(({state,...s})=>{
 const r=revMap.get(s.id),node=state.session.runs?.[s.mission]?.find(n=>n.step===s.step);
 const list=tasks[s.step],t=list?.[Math.min(s.stage??0,(list?.length??1)-1)];
 return {...s,nodeId:r?.nodeId??null,matchedCurrentTaskId:stepMap[s.step]??null,
  primaryAsset:pathNorm(['create-id','demo-id'].includes(s.step)?ID_IMAGES[Math.min(s.stage,ID_IMAGES.length-1)]:s.media?.frames?.[s.mediaIndex??0]?.src),
  originalTaskCopy:t?.copy??null,originalTaskTitle:t?.title??null,originalTaskResult:t?.result??null,
  originalOptions:t?.options??null,selectedAnswers:node?.answers??[],
  savedFigmaTextLines:textMap.get(r?.nodeId)??null,
  comments:review.commentMap.filter(c=>c.association?.screenIds?.includes(r?.nodeId)).map(c=>c.id)};
});
const newScreens=Object.values(current.tasks).flatMap(t=>Object.values(t.screens).map(s=>({...s,taskId:t.taskId,assetPath:current.assets[s.assetId]?.path??null})));
const assetComparison=Object.values(current.assets).map(a=>({assetId:a.assetId,path:a.path,newHash:a.sha256,oldHash:old.sources['artifacts/max-game/public/'+a.path]??null})).map(a=>({...a,status:!a.oldHash?'not-in-old-manifest':a.oldHash===a.newHash?'same-bytes':'changed-bytes'}));
const newUi=read(newDir+'ui.html'),mediaStart=newUi.indexOf('const media=');
const mediaEnd=newUi.indexOf(';\r\nconst $=',mediaStart)>=0?newUi.indexOf(';\r\nconst $=',mediaStart):newUi.indexOf(';\nconst $=',mediaStart);
const media=JSON.parse(newUi.slice(mediaStart+12,mediaEnd));
for(const a of assetComparison){const embedded=media[a.assetId];const bytes=embedded.svg?Buffer.from(embedded.svg):Buffer.from(embedded.base64,'base64');a.embeddedHash=createHash('sha256').update(bytes).digest('hex');if(a.embeddedHash!==a.newHash)throw Error('Embedded asset hash mismatch: '+a.assetId);}
const copySnapshot=json('artifacts/reports/max-copy-audit-20261002/applied-copy.json');
const liveSourceDifferences=newScreens.flatMap(s=>{const source=copySnapshot.instructions[s.screenId];return source&&source.text!==s.instruction?[{screenId:s.screenId,pluginInstruction:s.instruction,separateCopySnapshot:source.text}]:[];});
const counts=Object.values(current.missions).map(m=>{
 const oldId={'benefit-test':'demo-benefit','business-test':'demo-business'}[m.missionId]??m.missionId;
 const a=oldScreens.filter(s=>s.mission===oldId&&s.default);
 return {mission:m.title,oldTask:a.filter(s=>s.kind==='task').length,oldResults:a.filter(s=>s.kind==='result').length,oldLayouts:a.filter(s=>['palm','ring','line'].includes(s.kind)).length,newTaskCards:m.taskIds.reduce((n,t)=>n+Object.keys(current.tasks[t].screens).length,0),newPresentationResults:m.taskIds.reduce((n,t)=>n+Object.values(current.tasks[t].screens).filter(s=>s.presentationOnly).length,0)};
});
const comments=review.commentMap.map(c=>({id:c.id,parentId:c.parent_id,resolvedAt:c.resolved_at,message:c.message,status:c.association?.status,screenIds:c.association?.screenIds??[],candidates:c.association?.candidates??[],oldScreens:oldScreens.filter(s=>s.comments.includes(c.id)).map(s=>s.id),currentDirectCopyTargets:newScreens.filter(s=>s.instructionSource?.commentId===c.id).map(s=>s.screenId),decision:current.reviewSource?.decisions?.find(d=>d.commentId===c.id)??null}));
const sources=[oldDir+'ui.html',oldDir+'screen-inventory.json',newDir+'code.js',newDir+'ui.html',newDir+'content-index.json','artifacts/DESIGN/max-game/max-review.json','artifacts/reports/max-copy-audit-20261002/figma-live-text.json','artifacts/reports/max-copy-audit-20261002/figma-id-text.json','artifacts/reports/max-copy-audit-20261002/applied-copy.json','apps/max-game/docs/MISSIONS.md'];
const data={auditedAt:new Date().toISOString(),sources:sources.map(p=>({path:p,sha256:hash(p)})),oldRevision:old.revision,currentRevision:current.contentRevision,reviewExportedAt:review.exportedAt,counts,assetComparison,liveSourceDifferences,oldScreens,newScreens,comments};
fs.writeFileSync(path.join(dir,'comparison.json'),JSON.stringify(data,null,2)+'\n');
const esc=v=>String(v??'—').replaceAll('|','\\|').replace(/\r?\n/g,'<br>');
let md='# Покадровое сопоставление MAX\n\nДанные извлечены локально из сохранённых сборок; сравнение не меняет плагины. Старый task.copy — исходный текст до преобразования результата/переносов. Сохранённые строки Figma отдельно показывают фактический текст ранее прочитанного макета; свежего чтения Figma нет. Числовые stages не сопоставляются автоматически с новыми IDs.\n';
for(const [step,taskId] of Object.entries(stepMap)){
 const screens=oldScreens.filter(s=>s.step===step&&s.default&&['task','result'].includes(s.kind));if(!screens.length)continue;
 md+=`\n## ${step} → ${taskId??'разделённый сценарий'}\n\n### Прежний плагин\n\n| Экран / миссия | Основной ассет | Исходный текст задания | Сохранённые строки справки | Комментарии |\n|---|---|---|---|---|\n`;
 for(const s of screens)md+=`| ${esc(s.id+' / '+s.mission+' / '+s.name)} | ${esc(s.primaryAsset)} | ${esc(s.originalTaskCopy)} | ${esc(s.savedFigmaTextLines?.map(x=>x.text).join(' / '))} | ${s.comments.join(', ')} |\n`;
 md+='\n### Текущий собранный плагин\n\n| screenId | Ассет | Текст справки | Источник текста |\n|---|---|---|---|\n';
 for(const s of newScreens.filter(s=>s.taskId===taskId))md+=`| ${s.screenId} | ${esc(s.assetPath)} | ${esc(s.instruction||'(нет справки)')} | ${esc(s.instructionSource?.commentId??s.instructionSource?.kind)} |\n`;
}
md+='\n## Новые задания без прямого старого step\n\n| screenId | Ассет | Текст справки |\n|---|---|---|\n';
for(const s of newScreens.filter(s=>!Object.values(stepMap).includes(s.taskId)))md+=`| ${s.screenId} | ${esc(s.assetPath)} | ${esc(s.instruction)} |\n`;
md+='\n## Все комментарии из выгрузки\n\nОтсутствие direct-copy цели не доказывает, что структурная правка не выполнена. Оценка структурных изменений — в README.\n\n| ID | Привязка | Прежний экран | Текст | Прямое применение / решение нового плагина |\n|---|---|---|---|---|\n';
for(const c of comments)md+=`| ${c.id}${c.parentId?' → '+c.parentId:''}${c.resolvedAt?' (resolved)':''} | ${c.status} | ${c.oldScreens.join(', ')} | ${esc(c.message)} | ${esc(c.currentDirectCopyTargets.join(', ')||c.decision?.reason||'Нет прямой текстовой привязки')} |\n`;
fs.writeFileSync(path.join(dir,'screens-and-comments.md'),md);
console.log(JSON.stringify({counts,oldScreens:oldScreens.length,newScreens:newScreens.length,oldResults:oldScreens.filter(s=>s.kind==='result'&&s.default).length,comments:comments.length,copyCommentIds:new Set(newScreens.map(s=>s.instructionSource?.commentId).filter(Boolean)).size,savedTextScreens:oldScreens.filter(s=>s.savedFigmaTextLines).length},null,2));
