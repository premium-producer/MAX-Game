import {mergeFlowDocuments,flowDocumentsEqual} from './collaboration.mjs';

export const sameDocument=flowDocumentsEqual;
export const pollReceiptIsCurrent=(requestedRevision,currentRevision)=>requestedRevision===currentRevision;

// Edits made while a request was in flight belong to the next save, not its receipt.
export function acknowledgeSave(sent,current,acknowledged){
 const result=mergeFlowDocuments(sent,current,acknowledged);
 return {...result,dirty:!sameDocument(result.document,acknowledged)};
}

// Undo is the inverse of one local edit, rebased over all changes received since then.
export function undoLocalEdit(edit,current,options){
 return mergeFlowDocuments(edit.after,edit.before,current,options);
}

export function recoveryKey(contentRevision,clientId){
 return `${contentRevision}:tab:${clientId}`;
}
