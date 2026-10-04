/**
 * @typedef {{actionId:string,label:string,placement:'hotspot'|'below-screen',rect?:number[],selected?:boolean}} ViewAction
 * @typedef {{schemaVersion:1,sessionId:string,contentRevision:string,rulesRevision:string,missionId:string,taskId:string,screenId:string,revision:number,status:'active'|'completed',device:{kind:'phone'|'pc',asset:import('../contracts/task-catalog.mjs').TaskAsset,annotations:import('../contracts/task-catalog.mjs').TextAnnotation[]},instruction:{text:string,informational:true},actions:ViewAction[],prepareNext:import('../contracts/task-catalog.mjs').TaskAsset[]}} ViewDescriptor
 */
/** Project a confirmed task state into data for any renderer. No markup or callbacks. @returns {ViewDescriptor} */
export function projectTaskView(catalog, state) {
  const screen = catalog.screens[state.screenId];
  if (state.contentRevision !== catalog.contentRevision || state.taskId !== catalog.taskId || !screen) throw new TypeError('Incompatible view state/catalog');
  const actions = state.status === 'completed' ? [] : screen.actions.map(action => ({
    actionId:action.actionId, label:action.label, placement:action.placement,
    ...(action.rect ? {rect:[...action.rect]} : {}),
    ...(action.outcome.answer ? {selected:state.answers[action.outcome.answer.kind] === action.outcome.answer.value} : {}),
  }));
  const nextIds = state.status === 'completed' ? [] : [...new Set(screen.actions
    .filter(a => a.outcome.kind === 'navigate' && a.outcome.screenId !== screen.screenId)
    .map(a => catalog.screens[a.outcome.screenId].assetId))];
  return {
    schemaVersion:1, sessionId:state.sessionId, contentRevision:state.contentRevision,
    rulesRevision:state.rulesRevision, missionId:state.missionId, taskId:state.taskId,
    screenId:state.screenId, revision:state.revision, status:state.status,
    device:{kind:screen.deviceKind, asset:structuredClone(catalog.assets[screen.assetId]), annotations:structuredClone(screen.annotations)},
    instruction:{text:screen.instruction, informational:true}, actions,
    prepareNext:nextIds.map(id => structuredClone(catalog.assets[id])),
  };
}
