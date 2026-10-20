import photos from './kdw-post-assets.json' with {type:'json'};
import {activityRemaining} from './kdw-development.mjs';
import {createPostTimeline} from './kdw-post-stream.mjs';
export const POSTS_SCREEN='business.channel.result',POSTS_TASK='business.channel';
export const POSTS_RULES=Object.freeze({version:6,initialAudience:14628,goal:300,good:120,bad:-100,interval:2300,travel:10500,maxPosts:20});
const banks={
 cafe:[
  ['coffee-duo','Два кофе + третий в подарок','До 12:00. Третий напиток того же объёма — в подарок.',2,true,'Понятная акция с условиями помогает выбрать.'],
  ['spam','КУПИ! КУПИ! КУПИ!','Срочно покупайте! Пришлём это сообщение ещё десять раз.',3,false,'Навязчивый спам раздражает подписчиков.'],
  ['hours','Теперь открываемся раньше','С понедельника ждём вас с 8:00. Кофе по пути на работу!',3,true,'Полезная новость отвечает на вопрос гостей.'],
  ['menu','Знакомьтесь: карамельный латте','Новая позиция меню. Нежная карамель и ароматный кофе.',4,true,'Конкретная новинка вызывает интерес.'],
  ['promise','Весь кофе бесплатно навсегда!','Просто приходите. Условия акции сообщим только на кассе.',2,false,'Обещание без честных условий подрывает доверие.'],
  ['breakfast','Доброе утро начинается здесь','Круассан и капучино за 390 ₽ каждый день до 11:00.',6,true,'Полезное предложение с ценой и временем.'],
  ['unrelated','Реклама, которую вы не просили','Продаём автомобиль. Пишите всем друзьям прямо сейчас!',5,false,'Пост не связан с интересами аудитории канала.'],
  ['space','Ваше место для спокойного утра','Тихий зал, мягкий свет и свежий кофе. Ждём в гости.',7,true,'История о месте помогает гостям познакомиться с вами.'],
 ],
 hotel:[
  ['breakfast','Завтрак с видом на город','Шведский стол с 7:00 до 11:00. Включён в стоимость номера.',0,true,'Гостям полезны конкретные условия проживания.'],
  ['spam','БРОНИРУЙ! БРОНИРУЙ!','Будем повторять эту рекламу каждый час!',0,false,'Частый навязчивый спам приводит к отпискам.'],
  ['arrival','Ранний заезд без сюрпризов','С 10:00 при наличии номера. Уточните доступность у администратора.',0,true,'Честное описание условий помогает спланировать поездку.'],
  ['weekend','Выходные в вашем ритме','Поздний выезд до 15:00 по воскресеньям — по запросу.',0,true,'Полезное предложение отвечает интересам гостей.'],
  ['promise','Любой номер всегда бесплатный','Приезжайте без брони. Настоящую цену узнаете на месте.',0,false,'Ложное обещание разрушает доверие.'],
  ['route','Как добраться от вокзала','Автобус №7 до остановки «Центр», затем пять минут пешком.',0,true,'Практичная информация делает поездку проще.'],
  ['unrelated','Срочно продаём автомобиль','Рассылайте объявление всем своим контактам!',0,false,'Нерелевантная реклама не помогает гостям.'],
  ['room','Знакомьтесь: семейный номер','Две комнаты, детская кроватка по запросу, тихий внутренний двор.',0,true,'Понятный рассказ о продукте помогает выбрать.'],
 ],
 theater:[
  ['premiere','Премьера в эту пятницу','«Город историй», 19:00. Продолжительность 1 час 40 минут, 12+.',0,true,'Афиша содержит важные сведения о спектакле.'],
  ['spam','КУПИТЕ БИЛЕТ НЕМЕДЛЕННО!','Пришлём это сообщение ещё десять раз сегодня!',0,false,'Навязчивая реклама утомляет зрителей.'],
  ['backstage','За кулисами нового спектакля','Рассказываем, как художники создают декорации к премьере.',0,true,'Закулисная история помогает заинтересовать зрителей.'],
  ['tickets','Студентам — особая цена','Скидка 20% по студенческому билету на вечерние показы среды.',0,true,'Чёткие условия делают предложение полезным.'],
  ['promise','Любые билеты бесплатно!','Приходите без билета. Условия и цену узнаете у входа.',0,false,'Нечестное обещание вызывает разочарование.'],
  ['access','Комфортный визит в театр','Доступный вход со стороны сквера. Поможем заранее выбрать места.',0,true,'Забота о зрителях повышает доверие.'],
  ['unrelated','Покупайте автомобиль','Этот пост не о театре. Отправьте всем знакомым!',0,false,'Случайная реклама не соответствует интересам зрителей.'],
  ['actors','Знакомство с труппой','Актёры рассказывают о любимых ролях и первой встрече со сценой.',0,true,'Люди и истории делают канал интереснее.'],
 ],
};
export const BUSINESS_CHANNELS=Object.freeze({cafe:'Кофейня',hotel:'Отель',theater:'Театр'});
export function postBank(type='cafe'){return (banks[type]??banks.cafe).map(([id,title,body,photo,good,reason])=>({id,title,body,photo,good,reason,delta:good?POSTS_RULES.good:POSTS_RULES.bad,reactions:good?128:34}));}
export const postPhoto=id=>photos.find(a=>a.assetId===`kdw.posts.photo-${id}`);
export function applyPostsCatalog(catalog){
 for(const asset of photos)catalog.assets[asset.assetId]=asset;
 const screen=catalog.tasks[POSTS_TASK].screens[POSTS_SCREEN];
 screen.assetId='kdw.native.store-phone';screen.deviceKind='phone';screen.annotations=[];
 screen.instruction='Выберите полезные публикации для канала';
 catalog.kdwPostsActivity=POSTS_RULES.version;
 return catalog;
}
export function postsElapsed(posts,remaining){return Math.max(0,posts.startRemainingMs-remaining);}
// A seeded cycle covers every batch size, with 2–6 simultaneous cards.
export function postWave(posts,wave){
 const count=2+(posts.seed+wave*3)%5;
 let first=0;for(let w=0;w<wave;w++)first+=2+(posts.seed+w*3)%5;
 return {first,count,start:wave*POSTS_RULES.travel};
}
export function postSpawn(posts,index){
 if(posts.version>=3)return createPostTimeline(posts,postBank(posts.businessType)).spawn(index);
 const bank=postBank(posts.businessType),cycle=Math.floor(index/bank.length),offset=(posts.seed+cycle*3)%bank.length;
 let wave=0,slot=index;
 if(posts.version>=2){while(slot>=2+(posts.seed+wave*3)%5){slot-=2+(posts.seed+wave*3)%5;wave++;}}
 return {index,spawnId:`${posts.runId}.${index}`,post:bank[(index+offset)%bank.length],lane:slot%2,column:posts.version>=2?Math.floor(slot/2):0,start:posts.version>=2?wave*POSTS_RULES.travel:index*POSTS_RULES.interval};
}
export function visiblePosts(posts,elapsed){
 if(posts.version>=3)return createPostTimeline(posts,postBank(posts.businessType)).at(elapsed);
 const rows=[],wave=postWave(posts,Math.floor(elapsed/POSTS_RULES.travel));
 const first=posts.version>=2?wave.first:Math.max(0,Math.floor((elapsed-POSTS_RULES.travel)/POSTS_RULES.interval)+1),last=posts.version>=2?wave.first+wave.count-1:Math.floor(elapsed/POSTS_RULES.interval);
 const used=new Set(posts.published.map(p=>posts.version>=2?p.spawnId:p.postId));
 for(let i=first;i<=last;i++){const spawn=postSpawn(posts,i);if(!used.has(posts.version>=2?spawn.spawnId:spawn.post.id))rows.push({...spawn,progress:(elapsed-spawn.start)/POSTS_RULES.travel});}
 return rows;
}
export function createPostStreamReader(){
 let signature='',timeline=null,lastTime=-1;
 return (posts,elapsed)=>{
  if(posts.version<3)return visiblePosts(posts,elapsed);
  const next=JSON.stringify([posts.version,posts.runId,posts.seed,posts.businessType,posts.published]);
  if(next!==signature||elapsed<lastTime){signature=next;timeline=createPostTimeline(posts,postBank(posts.businessType));}
  lastTime=elapsed;return timeline.at(elapsed);
 };
}
export function postsGoal(posts){return posts.audience>=POSTS_RULES.initialAudience+POSTS_RULES.goal;}
export function reducePosts(state,command,now,version=POSTS_RULES.version){
 if(state.status!=='task'||state.taskId!==POSTS_TASK||state.screenId!==POSTS_SCREEN||command.taskId!==state.taskId||command.screenId!==state.screenId)return 'WRONG_POST_CONTEXT';
 if(!state.ownerActive)return 'POSTS_PAUSED';
 const p=state.progress[state.missionId],remaining=activityRemaining(state,now);
 if(command.type==='START_POSTS'){
  if(p.postsActivity)return 'POSTS_ALREADY_STARTED';
  let seed=0;for(const ch of `${state.sessionId}:${state.runId}`)seed=(seed*31+ch.charCodeAt(0))>>>0;
  p.postsActivity={version,businessType:p.answers?.businessType??'cafe',runId:state.runId,seed:seed%8,startRemainingMs:remaining,audience:POSTS_RULES.initialAudience,published:[]};return null;
 }
 const posts=p.postsActivity;if(!posts)return 'POSTS_NOT_STARTED';
 if(posts.version<2&&posts.published.length>=POSTS_RULES.maxPosts||postsGoal(posts))return 'POSTS_FINISHED';
 const parts=String(command.spawnId).split('.');
 if(parts.length!==2||String(posts.runId)!==parts[0]||!/^\d{1,9}$/.test(parts[1]))return 'INVALID_POST';
 const index=Number(parts[1]),elapsed=postsElapsed(posts,remaining);
 if(posts.published.some(p=>p.spawnId===command.spawnId))return 'POST_ALREADY_PUBLISHED';
 const spawn=posts.version>=3?visiblePosts(posts,elapsed).find(row=>row.index===index):postSpawn(posts,index);
 if(!spawn||elapsed<spawn.start||elapsed>=spawn.start+(spawn.travel??POSTS_RULES.travel))return 'POST_NOT_AVAILABLE';
 if(posts.version<2&&posts.published.some(p=>p.postId===spawn.post.id))return 'POST_ALREADY_PUBLISHED';
 const post=spawn.post,before=posts.audience;posts.audience=Math.max(0,before+post.delta);
 posts.published.push({spawnId:spawn.spawnId,postId:post.id,index,good:post.good,delta:posts.audience-before,audience:posts.audience,...(posts.version>=3?{elapsedMs:elapsed}:{})});return null;
}
// Replaying an already accepted legacy completion must not retroactively impose
// the new activity. Live commands never receive this replay-only catalog.
export function catalogForPostsReceipt(catalog,r){
 if(r.command.type==='START_POSTS'&&[1,2,3,4,5].includes(r.reply?.snapshot?.progress?.business?.postsActivity?.version))return {...catalog,kdwPostsActivity:r.reply.snapshot.progress.business.postsActivity.version};
 if(r.command.type==='ACT'&&r.command.screenId===POSTS_SCREEN&&r.command.actionId==='business.channel.result.continue'&&!r.reply?.snapshot?.progress?.business?.postsActivity)return {...catalog,kdwPostsActivity:null};
 return catalog;
}
