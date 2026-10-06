import {MISSION_CATALOG} from './mission-catalog.mjs';
import {reviewTaskId} from './client-review.mjs';

// Historical content shape, projected from the same definitions. New adapters
// send canonical commands through SessionPort instead of this flow.
export const REVIEW_FLOWS=Object.freeze(Object.fromEntries(Object.values(MISSION_CATALOG.tasks).filter(task=>!task.coreCatalog).map(task=>{
 const taskId=reviewTaskId(task.taskId),hasGaps=Object.values(task.screens).some(screen=>screen.missing);
 const localId=id=>id.slice(task.taskId.length+1);
 const screens=Object.fromEntries(Object.values(task.screens).map(screen=>{
  const id=localId(screen.screenId),actions=screen.actions.filter(action=>action.outcome.kind!=='incorrect').map(action=>({
   id:action.actionId,label:screen.automaticMs===null?action.label:'',
   to:['navigate','skip-screen'].includes(action.outcome.kind)?localId(action.outcome.screenId):hasGaps?'skip':'complete'
  }));
  return [id,{id,media:screen.assetId?MISSION_CATALOG.assets[screen.assetId].path:null,copy:screen.instruction,
   actions,...(screen.automaticMs===null?{}:{autoTo:actions[0].to,automaticMs:screen.automaticMs})}];
 }));
 return [taskId,{taskId,canonicalTaskId:task.taskId,device:Object.values(task.screens)[0].deviceKind,start:localId(task.startScreenId),screens}];
})));
