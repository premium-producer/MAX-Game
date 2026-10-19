import {missionToken} from './mission-command.mjs';
import {assertTaskCatalog} from './task-catalog.mjs';
export function assertMissionCatalog(c){
 const fail=msg=>{throw new TypeError(`MissionCatalog: ${msg}`);};
 if(c?.schemaVersion!==1||!missionToken(c.contentRevision)||!c.assets||!c.tasks||!c.missions)fail('missing registry');
 if(!Object.keys(c.missions).length||!Object.keys(c.tasks).length||!Object.keys(c.assets).length)fail('empty registry');
 const seen=new Set(),ancestor=new Set();
 const json=v=>{if(v===null||['string','boolean'].includes(typeof v)||typeof v==='number'&&Number.isFinite(v))return;if(!v||typeof v!=='object'||!Array.isArray(v)&&![Object.prototype,null].includes(Object.getPrototypeOf(v))||ancestor.has(v))fail('non JSON data');ancestor.add(v);Object.values(v).forEach(json);ancestor.delete(v);};json(c);
 for(const [id,a] of Object.entries(c.assets)){if(a.assetId!==id||!missionToken(id)||!/^assets\/[a-zA-Z0-9/_-]+\.(png|svg)$/.test(a.path)||!['image/png','image/svg+xml'].includes(a.mimeType)||!Number.isSafeInteger(a.width)||!Number.isSafeInteger(a.height)||a.width<=0||a.height<=0||!/^[a-f0-9]{64}$/.test(a.sha256))fail(`invalid asset ${id}`);}
 for(const [id,t] of Object.entries(c.tasks)){
  if(t.taskId!==id||!missionToken(id)||typeof t.title!=='string'||!t.screens?.[t.startScreenId])fail(`invalid task ${id}`);
  if(t.coreCatalog)assertTaskCatalog(t.coreCatalog);
  for(const [sid,s] of Object.entries(t.screens)){
   if(s.screenId!==sid||!missionToken(sid)||!['phone','pc'].includes(s.deviceKind)||typeof s.instruction!=='string'||s.assetId&&!c.assets[s.assetId]||!s.assetId&&!s.missing||s.missing!==null&&typeof s.missing!=='string'||s.automaticMs!==null&&(!Number.isSafeInteger(s.automaticMs)||s.automaticMs<0)||!Array.isArray(s.actions)||!s.actions.length)fail(`invalid screen ${sid}`);
   for(const a of s.actions){if(!missionToken(a.actionId)||seen.has(a.actionId)||typeof a.label!=='string'||!a.label||!['hotspot','below-screen'].includes(a.placement))fail(`invalid action ${a.actionId}`);seen.add(a.actionId);
    if(a.placement==='hotspot'){const r=a.rect,asset=c.assets[s.assetId];if(!asset||!Array.isArray(r)||r.length!==4||!r.every(Number.isFinite)||r[0]<0||r[1]<0||r[2]<=0||r[3]<=0||r[0]+r[2]>asset.width||r[1]+r[3]>asset.height)fail(`hotspot ${a.actionId}`);}
    const o=a.outcome;if(!o||!['navigate','complete-task','skip-screen','skip-task','incorrect','choose-tool'].includes(o.kind)||['navigate','skip-screen'].includes(o.kind)&&!t.screens[o.screenId]||o.kind==='choose-tool'&&!['channel','bot','store'].includes(o.value))fail(`outcome ${a.actionId}`);
    if(o.kind==='choose-tool'&&!c.tasks[`business.${o.value}`])fail(`unknown business task ${a.actionId}`);
    if(o.answer&&(!missionToken(o.answer.kind)||typeof o.answer.value!=='string'||!o.answer.value))fail(`answer ${a.actionId}`);
   }
  }
  const visited=new Set(),walk=id=>{if(visited.has(id))return;visited.add(id);for(const a of t.screens[id].actions)if(['navigate','skip-screen'].includes(a.outcome.kind))walk(a.outcome.screenId);};walk(t.startScreenId);if(visited.size!==Object.keys(t.screens).length)fail(`unreachable screen ${id}`);
 }
 for(const [id,m] of Object.entries(c.missions)){if(m.missionId!==id||!missionToken(id)||typeof m.title!=='string'||!m.title||typeof m.test!=='boolean'||m.completionText!==undefined&&(typeof m.completionText!=='string'||!m.completionText)||!Array.isArray(m.taskIds)||!m.taskIds.length||new Set(m.taskIds).size!==m.taskIds.length||m.taskIds.some(t=>!c.tasks[t])||!c.assets[m.qr?.assetId])fail(`invalid mission ${id}`);}
 return c;
}
