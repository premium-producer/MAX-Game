import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const hash=b=>createHash('sha256').update(b).digest('hex');
const missingSvg='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect x="3" y="3" width="114" height="114" fill="#230B10" stroke="#FF3030" stroke-width="6"/><path d="M43 43C43 22 79 22 79 43C79 55 61 56 61 70" fill="none" stroke="#FF3030" stroke-width="9" stroke-linecap="round"/><circle cx="61" cy="88" r="5" fill="#FF3030"/></svg>\n';

/** Explicit inspected source selection; an unknown role never borrows an unrelated icon. */
export async function applyMaxIcons(catalog,files){
 const selection=JSON.parse(await fs.readFile(new URL('./max-icon-selection.json',import.meta.url),'utf8'));
 const assignments=[],missing=[];
 const register=(key,bytes,width,height,origin,hasEmbeddedLabel)=>{
  const assetId=`max-icon.${key}`,assetPath=`assets/max-icons/${key}.svg`;
  catalog.assets[assetId]={assetId,path:assetPath,mimeType:'image/svg+xml',width,height,sha256:hash(bytes),origin,hasEmbeddedLabel};
  files.set(assetPath,bytes);return assetId;
 };
 const fallback=register('missing',Buffer.from(missingSvg),120,120,{kind:'explicit-missing-icon'},false);
 const ids={};
 for(const [key,name] of Object.entries(selection.files)){
  const relative=path.posix.join(selection.sourceRoot,name);
  const bytes=await fs.readFile(path.join(root,relative)),svg=bytes.toString('utf8');
  const box=svg.match(/<svg\b[^>]*viewBox="([^"]+)"/);if(!box)throw Error(`No SVG viewBox: ${name}`);
  const [, ,width,height]=box[1].trim().split(/\s+/).map(Number);
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<=0||height<=0)throw Error(`Invalid icon dimensions: ${name}`);
  ids[key]=register(key,bytes,width,height,{kind:'provided-ui-icon',sourcePath:relative},name.startsWith('Frame '));
 }
 const resolve=(role,key)=>{const id=ids[key]??fallback;assignments.push({role,assetId:id});if(id===fallback)missing.push(role);return id;};
 const oldIcons=new Set([...Object.values(catalog.tasks).map(t=>t.iconAssetId),...Object.values(catalog.missions).map(m=>m.startAssetId)]);
 for(const task of Object.values(catalog.tasks))task.iconAssetId=resolve(task.taskId,selection.tasks[task.taskId]);
 for(const mission of Object.values(catalog.missions)){
  mission.iconAssetId=resolve(`mission.${mission.missionId}`,selection.missions[mission.missionId]);
  mission.startAssetId=resolve(`start.${mission.missionId}`,'open-max');
 }
 catalog.uiIcons=Object.fromEntries(Object.entries(selection.controls).map(([role,key])=>[role,resolve(`control.${role}`,key)]));
 catalog.uiIcons.fallback=fallback;
 for(const id of oldIcons)if(id&&catalog.assets[id]){files.delete(catalog.assets[id].path);delete catalog.assets[id];}
 return {sourceRoot:selection.sourceRoot,assignments,missing,fallbackAssetId:fallback,sourceFiles:selection.files};
}
