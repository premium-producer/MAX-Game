import overrides from '../src/reviewed-content/presentation-overrides.json' with {type:'json'};
export const REVIEWED_PRESENTATION_OVERRIDES=overrides;

// Reviewed copy and replacement-image hit regions, applied AFTER the immutable
// annotation export. Command/action IDs, outcomes and content revision stay intact.
export function applyReviewedPresentation(catalog, changes=overrides){
 if(changes.schemaVersion!==1||changes.contentRevision!==catalog.contentRevision)throw Error('PRESENTATION_REVISION_CONFLICT');
 const result=structuredClone(catalog),stale=id=>{throw Error('PRESENTATION_OVERRIDE_STALE: '+id);};
 for(const [id,change] of Object.entries(changes.tasks)){
  const task=result.tasks[id];if(!task||task.title!==change.expectedTitle)stale(id);
  task.title=change.title;
 }
 for(const [id,change] of Object.entries(changes.screens)){
  const task=result.tasks[change.taskId],screen=task?.screens[id];if(!screen)stale(id);
  if(change.instruction!==undefined){if(screen.instruction!==change.expectedInstruction)stale(id);screen.instruction=change.instruction;}
  for(const [actionId,copy] of Object.entries(change.actions??{})){
   const action=screen.actions.find(a=>a.actionId===actionId);if(!action)stale(actionId);
   if(copy.label!==undefined){if(action.label!==copy.expectedLabel)stale(actionId);action.label=copy.label;}
   if(copy.rect!==undefined){if(action.placement!=='hotspot')stale(actionId);action.rect=[...copy.rect];}
  }
  if(task.coreCatalog)task.coreCatalog.screens[id]=structuredClone(screen);
 }
 for(const [id,change] of Object.entries(changes.missions)){
  const mission=result.missions[id];if(!mission||mission.completionText!==change.expectedCompletionText)stale(id);
  mission.completionText=change.completionText;
  if(change.qr){if(!result.assets[change.qr.assetId])stale(change.qr.assetId);mission.qr={...mission.qr,...change.qr};}
 }
 return result;
}
