import {COFFEE_PRODUCTS} from './kdw-interactions-model.mjs';
import content from './kdw-business-content.json' with {type:'json'};
import {businessCardImage} from './kdw-business-images.mjs';
import {createPostTimeline} from './kdw-post-stream.mjs';
import {activityRemaining} from './kdw-development.mjs';
export const STORE_TASK='business.store',STORE_SCREEN='business.store.start';
export function storeBank(type='cafe',version=7){
 if(version>=7&&content.banks[type])return content.banks[type].products.map(p=>({...p,name:p.title,image:businessCardImage(p.id)}));
 const goods=type==='auto'?[['auto-oil','Моторное масло','🛢',2200],['auto-filter','Воздушный фильтр','⚙',850],['auto-brakes','Тормозные колодки','🛞',3200],['auto-plugs','Комплект свечей','🔩',1800]]:type==='sports'?[['ball','Футбольный мяч','⚽',1900],['shoes','Беговые кроссовки','👟',5900],['mat','Коврик для тренировок','▱',1700],['weights','Набор гантелей','🏋',3900]]:
 type==='flowers'?[['roses','Букет роз','🌹',3900],['tulips','Букет тюльпанов','🌷',2900],['seasonal','Сезонный букет','💐',3500],['orchid','Орхидея в горшке','🌸',2700]]:
 type==='hotel'?[['room','Номер на двоих','🛏',4500],['breakfast','Завтрак в номер','🥐',700],['spa','Посещение спа','🧖',1500],['transfer','Трансфер до отеля','🚐',1200]]:
 type==='theater'?[['ticket','Билет на спектакль','🎭',1500],['tour','Экскурсия за кулисы','🎟',800],['program','Программа спектакля','📖',200],['subscription','Театральный абонемент','✨',5000]]:null;
 const bank=goods?goods.map(([id,name,emoji,price])=>({id,name,emoji,price,good:true})):COFFEE_PRODUCTS.map(p=>({...p,good:true}));
 if(type==='auto')return [...bank,{id:'bouquet',name:'Букет роз',emoji:'🌹',price:3900,good:false},{id:'coffee',name:'Кофе в зёрнах',emoji:'☕',price:790,good:false}];
 return [...bank,{id:'engine-oil',name:'Моторное масло',emoji:'🛢',price:2200,good:false},{id:'drill',name:'Ударная дрель',emoji:'🛠',price:3900,good:false}];
}
export function storeRating(activity){
 const ratings=Array(10).fill(40).concat((activity?.published??[]).map(p=>p.score*10)).slice(-10);
 return ratings.reduce((a,b)=>a+b,0)/100;
}
export const storeGoal=activity=>!!activity&&storeRating(activity)>=4.9;
export const storeElapsed=(activity,state,now)=>Math.max(0,activity.startRemainingMs-activityRemaining(state,now));
export function storeTimeline(activity){return createPostTimeline({...activity,version:activity.version>=6?11:activity.version>=5?10:activity.version>=4?9:activity.version>=3?8:activity.version>=2?7:6},storeBank(activity.businessType,activity.version??1));}
export function reduceStore(state,command,now,version=7){
 if(state.status!=='task'||state.taskId!==STORE_TASK||state.screenId!==STORE_SCREEN||command.taskId!==STORE_TASK||command.screenId!==STORE_SCREEN)return 'WRONG_STORE_CONTEXT';
 if(!state.ownerActive)return 'STORE_PAUSED';
 const p=state.progress.business;
 if(command.type==='START_STORE'){
  if(p.storeActivity)return 'STORE_ALREADY_STARTED';
  p.storeActivity={version,runId:state.runId,seed:714+state.runId,businessType:p.answers?.businessType??'cafe',startRemainingMs:activityRemaining(state,now),published:[]};return null;
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
 if(catalog.kdwBusinessAll&&r.reply?.snapshot?.screenId==='business.store.start'&&['ADVANCE_RESULT','SKIP_TASK','RESTART_TASK','SELECT_MISSION'].includes(r.command.type))catalog={...catalog,tasks:{...catalog.tasks,'business.store':{...catalog.tasks['business.store'],startScreenId:'business.store.start'}}};
 if(r.command.type==='START_STORE'&&[1,2,3,4,5,6].includes(r.reply?.snapshot?.progress?.business?.storeActivity?.version))return {...catalog,kdwStoreActivity:r.reply.snapshot.progress.business.storeActivity.version};
 if(r.command.type==='ACT'&&r.command.screenId?.startsWith('business.store.')&&!r.reply?.snapshot?.progress?.business?.storeActivity)return {...catalog,kdwStoreActivity:false};
 return catalog;
}
