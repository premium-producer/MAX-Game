import {PERSONAL_ASSETS} from './kdw-personal-channel-assets.mjs';
export const PERSONAL_AVATARS=Object.freeze(['cinema','cat','game','island','heart']);
export const PERSONAL_LIMITS=Object.freeze({name:64,description:160,slug:32,reply:400});
export const PERSONAL_TASKS=Object.freeze(['blogger.channel','blogger.comments']);
export const PERSONAL_SCREEN_NUMBERS=Object.freeze({'blogger.channel.chats':1,'blogger.channel.menu':2,'blogger.channel.name':4,'blogger.channel.filled':4,'blogger.channel.privacy':5,'blogger.channel.public-confirm':6,'blogger.channel.public-link':7,'blogger.channel.public-filled':8,'blogger.channel.subscribers':9,'blogger.channel.created':10,'blogger.comments.post':11,'blogger.comments.input':12,'blogger.comments.reply':13,'blogger.comments.result':14,'blogger.comments.returned-post':15});
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===[...keys].sort().join('|');
const text=(v,n,multiline=false)=>typeof v==='string'&&v.length<=n&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)&&(multiline||!/[\r\n]/.test(v));
export const validSlug=v=>typeof v==='string'&&/^[a-z][a-z0-9_]{3,31}$/.test(v);
export function validPersonalDraft(v){return exact(v,['schemaVersion','name','description','avatar','visibility','slug'])&&v.schemaVersion===2&&text(v.name,64)&&text(v.description,160,true)&&PERSONAL_AVATARS.includes(v.avatar)&&['private','public'].includes(v.visibility)&&text(v.slug,32);}
export const validReply=v=>exact(v,['schemaVersion','reply'])&&v.schemaVersion===1&&text(v.reply,400,true);
export const personalComplete=v=>validPersonalDraft(v)&&v.name.trim().length>=2;
export function personalDraft(state){const p=state?.progress?.blogger,v=p?.interactions?.['blogger.channel']??p?.personalChannel??{};return {schemaVersion:2,name:v.name??'',description:v.description??'',avatar:PERSONAL_AVATARS.includes(v.avatar)?v.avatar:'cinema',visibility:v.visibility??p?.answers?.['channel-type']??'private',slug:v.slug??''};}
export function personalProfile(state){const p=state?.progress?.blogger,v=p?.personalChannel;return v??{...personalDraft(state),id:'legacy-channel',created:!!p?.answers?.['blogger.channel.filled']};}
export function savePersonal(state,c){
 if(!state.ownerActive)return 'OWNER_REQUIRED';
 const p=state.progress.blogger;
 if(c.taskId==='blogger.channel'){
  if(!['blogger.channel.name','blogger.channel.filled','blogger.channel.privacy','blogger.channel.public-confirm','blogger.channel.public-link','blogger.channel.public-filled'].includes(state.screenId)||!validPersonalDraft(c.value))return 'INVALID_INTERACTION';
  p.interactions??={};p.interactions[c.taskId]=structuredClone(c.value);
  if(p.personalChannel)p.personalChannel={...p.personalChannel,...structuredClone(c.value)};
 }else{
  if(!['blogger.comments.input','blogger.comments.reply'].includes(state.screenId)||!validReply(c.value))return 'INVALID_INTERACTION';
  p.interactions??={};p.interactions[c.taskId]=structuredClone(c.value);
 }
 return null;
}
export function personalAction(state,c,now){
 const p=state.progress.blogger;if(!p)return null;
 const draft=p.interactions?.['blogger.channel'];
 const actionId=({'personal.channel.create':'channel.create','personal.channel.save-public-link':'channel.save-public-link','personal.comments.send':'blogger.comments.reply.action-1'})[c.actionId]??c.actionId;
 if(c.actionId==='personal.channel.create'&&!personalComplete(draft))return 'CHANNEL_NAME_REQUIRED';
 if(c.actionId==='personal.channel.save-public-link'&&(!personalComplete(draft)||!validSlug(draft.slug)))return 'CHANNEL_LINK_REQUIRED';
 if(draft?.schemaVersion===2){
  if(['channel.fill-name-example','channel.create'].includes(actionId)&&!personalComplete(draft))return 'CHANNEL_NAME_REQUIRED';
  if(['channel.fill-link-example','channel.save-public-link'].includes(actionId)&&!validSlug(draft.slug))return 'CHANNEL_LINK_REQUIRED';
  if(actionId==='channel.create')p.personalChannel={...structuredClone(draft),id:p.personalChannel?.id??'channel.'+state.runId,created:true};
  const privacy={'channel.choose-public':'public','channel.continue-private':'private','channel.choose-private':'private','channel.keep-old-link':'private','channel.save-public-link':'public'}[actionId];
  if(privacy){draft.visibility=privacy;if(p.personalChannel)p.personalChannel.visibility=privacy;}
 }
 if(actionId==='blogger.comments.reply.action-1'){
  const value=p.interactions?.['blogger.comments'];
  if(!validReply(value)||!value.reply.trim())return 'COMMENT_REPLY_REQUIRED';
  p.personalComments={schemaVersion:1,channelId:personalProfile(state).id,reply:value.reply.trim(),submittedAt:now};
 }
 return null;
}
export function applyPersonalChannel(catalog){
 catalog.kdwPersonalChannel=1;for(const [id,a]of Object.entries(PERSONAL_ASSETS))if(id.startsWith('kdw.personal.underlay-'))catalog.assets[id]=a;
 for(const taskId of PERSONAL_TASKS)for(const screen of Object.values(catalog.tasks[taskId].screens)){
  screen.assetId='kdw.personal.underlay-'+PERSONAL_SCREEN_NUMBERS[screen.screenId];screen.deviceKind='phone';screen.annotations=[];
  for(const a of screen.actions){a.placement='below-screen';delete a.rect;}
 }
 const task=catalog.tasks['blogger.comments'],last=task.screens['blogger.comments.result'];
 const returned=structuredClone(last);returned.screenId='blogger.comments.returned-post';returned.assetId='kdw.personal.underlay-15';returned.actions=[{...structuredClone(last.actions[0]),actionId:'blogger.comments.returned-post.continue',label:'К следующему заданию',outcome:{kind:'complete-task'}}];
 task.screens[returned.screenId]=returned;last.actions[0].label='Вернуться к посту';last.actions[0].outcome={kind:'navigate',screenId:returned.screenId};
 const backs={'blogger.channel.menu':'blogger.channel.chats','blogger.channel.name':'blogger.channel.menu','blogger.channel.filled':'blogger.channel.name','blogger.channel.privacy':'blogger.channel.filled','blogger.channel.public-link':'blogger.channel.privacy','blogger.channel.public-filled':'blogger.channel.public-link','blogger.comments.input':'blogger.comments.post','blogger.comments.reply':'blogger.comments.input'};
 for(const [id,to]of Object.entries(backs)){const t=catalog.tasks[id.startsWith('blogger.channel.')?'blogger.channel':'blogger.comments'],a={actionId:'personal.back.'+id,label:'Назад',placement:'below-screen',outcome:{kind:'navigate',screenId:to}};t.screens[id].actions.push(a);if(t.coreCatalog)t.coreCatalog.screens[id].actions.push(structuredClone(a));}
 // Native forms already contain the entered value. Confirm once in the kernel,
 // without publishing the legacy filled/preview screen to the presentation queue.
 // Keep the original actions unchanged so existing receipt histories replay exactly.
 const direct=[
  ['blogger.channel.name','blogger.channel.filled','channel.create','personal.channel.create'],
  ['blogger.channel.public-link','blogger.channel.public-filled','channel.save-public-link','personal.channel.save-public-link'],
  ['blogger.comments.input','blogger.comments.reply','blogger.comments.reply.action-1','personal.comments.send']
 ];
 for(const [from,to,original,id]of direct){const t=catalog.tasks[from.startsWith('blogger.channel.')?'blogger.channel':'blogger.comments'];const a={...structuredClone(t.screens[to].actions.find(a=>a.actionId===original)),actionId:id};t.screens[from].actions.push(a);if(t.coreCatalog)t.coreCatalog.screens[from].actions.push(structuredClone(a));}
 const directBacks={'blogger.channel.filled':'blogger.channel.menu','blogger.channel.public-filled':'blogger.channel.privacy','blogger.comments.reply':'blogger.comments.post'};
 for(const [from,to]of Object.entries(directBacks)){const t=catalog.tasks[from.startsWith('blogger.channel.')?'blogger.channel':'blogger.comments'],a={actionId:'personal.direct-back.'+from,label:'Назад',placement:'below-screen',outcome:{kind:'navigate',screenId:to}};t.screens[from].actions.push(a);if(t.coreCatalog)t.coreCatalog.screens[from].actions.push(structuredClone(a));}
 return catalog;
}
// Replay old receipts with their exact original semantics; new saves opt in via v2.
export function catalogForPersonalReceipt(catalog,r){
 if(!catalog.kdwPersonalChannel)return catalog;
 const progress=r.reply?.snapshot?.progress?.blogger;
 const legacy=!progress?.personalComments&&!progress?.interactions?.['blogger.comments']&&progress?.interactions?.['blogger.channel']?.schemaVersion!==2;
 const oldFinish=legacy&&r.command.type==='ACT'&&r.command.actionId==='blogger.comments.result.continue'&&r.reply?.snapshot?.status==='result';
 const oldReply=legacy&&r.command.type==='ACT'&&r.command.actionId==='blogger.comments.reply.action-1';
 if(!oldFinish&&!oldReply)return catalog;
 const c={...catalog,kdwPersonalReplayLegacy:oldReply,tasks:{...catalog.tasks}};
 if(oldFinish){const t=structuredClone(catalog.tasks['blogger.comments']);t.screens['blogger.comments.result'].actions[0].outcome={kind:'complete-task'};c.tasks['blogger.comments']=t;}
 return c;
}
