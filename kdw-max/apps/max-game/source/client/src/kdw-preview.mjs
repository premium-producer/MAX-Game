const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
/** Isolated memory-session preview; follows real commands, never writes the player's IndexedDB. */
export async function prepareInteractionPreview(session,catalog,kind){
 const missionId=kind==='channel'?'blogger':'business',target=kind==='channel'?'blogger.channel.name':'business.store.start';
 await session.owner(true);await session.command('SELECT_MISSION',{missionId});
 await session.contact('kdw-preview','down',true);await sleep(825);await session.contact('kdw-preview','up',true);
 for(let i=0;i<160;i++){
  const s=session.snapshot.state;if(s.screenId===target)return;
  if(s.status==='result'){await sleep(120);await session.poll(Date.now());continue;}
  if(s.status!=='task')throw Error('PREVIEW_FLOW_UNAVAILABLE');
  const screen=catalog.tasks[s.taskId].screens[s.screenId];
  if(screen.automaticMs!==null){await sleep(Math.min(screen.automaticMs,2000));await session.poll(Date.now());continue;}
  const action=screen.actions.find(a=>a.outcome.kind!=='incorrect'&&a.outcome.screenId!==s.screenId);
  if(!action)throw Error('PREVIEW_ACTION_UNAVAILABLE');
  const response=await session.act(s.screenId,action.actionId);if(!response?.reply.ok)throw Error('PREVIEW_COMMAND_REJECTED');
 }
 throw Error('PREVIEW_FLOW_TIMEOUT');
}
