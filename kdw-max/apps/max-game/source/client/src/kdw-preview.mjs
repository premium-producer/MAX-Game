import {activityRemaining} from './kdw-development.mjs';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
import {POSTS_SCREEN,POSTS_TASK,visiblePosts,postsElapsed,postsGoal} from './kdw-posts-model.mjs';
/** Isolated memory-session preview; follows real commands, never writes the player's IndexedDB. */
export async function prepareInteractionPreview(session,catalog,kind,businessType='cafe'){
 const missionId=kind==='channel'?'blogger':'business',target=kind==='channel'?'blogger.channel.name':kind==='posts'?POSTS_SCREEN:'business.store.start';
 await session.owner(true);await session.command('SELECT_MISSION',{missionId});
 await session.contact('kdw-preview','down',true);await sleep(825);await session.contact('kdw-preview','up',true);
 for(let i=0;i<400;i++){
  const s=session.snapshot.state;if(s.screenId===target)return;
  if(s.screenId===POSTS_SCREEN&&s.status==='task'){
   const p=s.progress.business.postsActivity;if(!p)await session.command('START_POSTS',{taskId:POSTS_TASK,screenId:POSTS_SCREEN});
   else if(!postsGoal(p)){await session.poll(Date.now());const elapsed=postsElapsed(p,activityRemaining(s,Date.now())),spawn=visiblePosts(p,elapsed).find(v=>v.post.good);if(spawn){const fields={taskId:POSTS_TASK,screenId:POSTS_SCREEN,spawnId:spawn.spawnId};const result=await session.command('PUBLISH_POST',fields);if(result?.reply.ok&&p.version>=16)await session.command('POST_ARRIVED',fields);}else await sleep(200);continue;}
   if(!p)continue;
  }
  if(s.status==='result'){await sleep(120);await session.poll(Date.now());continue;}
  if(s.status!=='task')throw Error('PREVIEW_FLOW_UNAVAILABLE');
  const screen=catalog.tasks[s.taskId].screens[s.screenId];
  if(screen.automaticMs!==null){await sleep(Math.min(screen.automaticMs,2000));await session.poll(Date.now());continue;}
  const choice=s.screenId==='business.platform.business-type'&&['cafe','flowers','auto'].includes(businessType)?screen.actions.find(a=>a.actionId==='business.platform.choose-'+businessType):null;
  const action=choice??screen.actions.find(a=>a.outcome.kind!=='incorrect'&&a.outcome.screenId!==s.screenId);
  if(!action)throw Error('PREVIEW_ACTION_UNAVAILABLE');
  const response=await session.act(s.screenId,action.actionId);if(!response?.reply.ok)throw Error('PREVIEW_COMMAND_REJECTED');
 }
 throw Error('PREVIEW_FLOW_TIMEOUT');
}
