import reviewed from './kdw-reviewed-texts.json' with {type:'json'};
export const KDW_TEXT_REVISION='KDW-MAX-TEXTS-20261018';
export function applyReviewedTexts(catalog){
 if(reviewed.schema!=='max-clean-screen-texts/v1'||reviewed.contentRevision!==catalog.contentRevision)throw Error('KDW text source revision mismatch');
 for(const change of reviewed.changes){
  const task=catalog.tasks[change.taskId];
  const target=change.field==='title'?task:change.field==='instruction'?task?.screens[change.screenId]:null;
  if(!target||target[change.field]!==change.before)throw Error('KDW text baseline mismatch: '+(change.screenId??change.taskId));
  target[change.field]=change.after;
 }
 // Editorial punctuation agreed while reviewing this export; original stays intact.
 catalog.tasks['business.store'].screens['business.store.start'].instruction=catalog.tasks['business.store'].screens['business.store.start'].instruction.replace('покупки не выходя','покупки, не выходя');
 catalog.textRevision=KDW_TEXT_REVISION;
 return catalog;
}
