import {COFFEE_PRODUCTS} from './kdw-interactions-model.mjs';
import {createPostTimeline} from './kdw-post-stream.mjs';
import {activityRemaining} from './kdw-development.mjs';
export const STORE_TASK='business.store',STORE_SCREEN='business.store.start';
export function storeBank(type='cafe'){
 const goods=type==='hotel'?[['room','Номер на двоих','🛏',4500],['breakfast','Завтрак в номер','🥐',700],['spa','Посещение спа','🧖',1500],['transfer','Трансфер до отеля','🚐',1200]]:
 type==='theater'?[['ticket','Билет на спектакль','🎭',1500],['tour','Экскурсия за кулисы','🎟',800],['program','Программа спектакля','📖',200],['subscription','Театральный абонемент','✨',5000]]:null;
 const bank=goods?goods.map(([id,name,emoji,price])=>({id,name,emoji,price,good:true})):COFFEE_PRODUCTS.map(p=>({...p,good:true}));
 return [...bank,{id:'engine-oil',name:'Моторное масло',emoji:'🛢',price:2200,good:false},{id:'drill',name:'Ударная дрель',emoji:'🛠',price:3900,good:false}];
}
export function storeRating(activity){
 const ratings=Array(10).fill(40).concat((activity?.published??[]).map(p=>p.score*10)).slice(-10);
 return ratings.reduce((a,b)=>a+b,0)/100;
}
export const storeGoal=activity=>!!activity&&storeRating(activity)>=4.9;
export const storeElapsed=(activity,state,now)=>Math.max(0,activity.startRemainingMs-activityRemaining(state,now));
export function storeTimeline(activity){return createPostTimeline({...activity,version:6},storeBank(activity.businessType));}
export function reduceStore(state,command,now){
 if(state.status!=='task'||state.taskId!==STORE_TASK||state.screenId!==STORE_SCREEN||command.taskId!==STORE_TASK||command.screenId!==STORE_SCREEN)return 'WRONG_STORE_CONTEXT';
 if(!state.ownerActive)return 'STORE_PAUSED';
 const p=state.progress.business;
 if(command.type==='START_STORE'){
  if(p.storeActivity)return 'STORE_ALREADY_STARTED';
  p.storeActivity={version:1,runId:state.runId,seed:714+state.runId,businessType:p.answers?.businessType??'cafe',startRemainingMs:activityRemaining(state,now),published:[]};return null;
 }
 const activity=p.storeActivity;if(!activity)return 'STORE_NOT_STARTED';
 if(storeGoal(activity))return 'STORE_FINISHED';
 if(activity.published.some(r=>r.spawnId===command.spawnId))return 'PRODUCT_ALREADY_ADDED';
 const elapsed=storeElapsed(activity,state,now),spawn=storeTimeline(activity).at(elapsed).find(r=>r.spawnId===command.spawnId);
 if(!spawn)return 'PRODUCT_NOT_AVAILABLE';
 activity.published.push({spawnId:spawn.spawnId,index:spawn.index,postId:spawn.post.id,elapsedMs:elapsed,score:spawn.post.good?5:3});
 return null;
}
export function catalogForStoreReceipt(catalog,r){
 if(r.command.type==='ACT'&&r.command.screenId?.startsWith('business.store.')&&!r.reply?.snapshot?.progress?.business?.storeActivity)return {...catalog,kdwStoreActivity:false};
 return catalog;
}
