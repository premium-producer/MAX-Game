// Classify by the authored outcome and mission route, never by translated labels.
export const transitionLabel=kind=>kind==='mission'?'Завершить миссию':'Следующее задание';
export function applyTransitionActions(catalog){
 for(const mission of Object.values(catalog.missions))for(const taskId of mission.taskIds){
  const kind=taskId===mission.taskIds.at(-1)?'mission':'task';
  for(const screen of Object.values(catalog.tasks[taskId].screens))for(const action of screen.actions){
   if(action.outcome.kind!=='complete-task')continue;
   action.transitionKind=kind;
   // Original SVG hotspots retain their accessible authored descriptions.
   if(action.placement==='below-screen')action.label=transitionLabel(kind);
  }
 }
 return catalog;
}
export function externalAction(snapshot,actionId,fallback){
 const action=snapshot?.view?.actions?.find(a=>a.actionId===actionId);
 return {label:action?.transitionKind?transitionLabel(action.transitionKind):fallback,
  className:action?.transitionKind?'kdw-activity-button kdw-transition-button':'kdw-activity-button'};
}
