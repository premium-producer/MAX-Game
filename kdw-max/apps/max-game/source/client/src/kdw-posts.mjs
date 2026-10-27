import {webglActivitiesEnabled} from './activity-webgl/activity-runtime.mjs';
import {mountWebGLActivity} from './activity-webgl/activity-controller.mjs';
import {guardImage,fallbackImageSource,visitorMessage} from './kdw-graceful-media.mjs';
import {typographyText} from './kdw-typography.mjs';
import {preloadBusinessImages} from './kdw-business-images.mjs';
import {activityGeometry,alignActivityPhone,alignActivityActions,createRightCardLayout,fadeActivityOut} from './kdw-activity-stage.mjs';
import {activityRemaining} from './kdw-development.mjs';
import {createStoreMotion} from './kdw-store-motion.mjs';
import {createPostTrails} from './kdw-post-trails.mjs';
import {POSTS_SCREEN,POSTS_TASK,POSTS_RULES,BUSINESS_CHANNELS,postBank,postPhoto,createPostStreamReader,postsElapsed,postsGoal} from './kdw-posts-model.mjs';
import {createPresentationClock} from './kdw-card-clock.mjs';
import {createFlowEntry} from './kdw-flow-entry.mjs';
import {createCardPop} from './kdw-card-pop.mjs';
import {postMetrics,formatPostCount,counterProgress,COUNTER_DURATION} from './kdw-post-metrics.mjs';
import {businessProfile} from './kdw-business-profile.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>n.toLocaleString('ru-RU');
const setText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
const chrome=name=>`./assets/kdw-native/posts-chrome/${name}.svg`;
async function decodeImage(image){let timer;try{await Promise.race([image.decode(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Изображения пока недоступны')),10000);})]);}finally{clearTimeout(timer);}}
const art=(type)=>`<span class="kdw-post-art" data-theme="${type}"><svg viewBox="0 0 120 80" aria-hidden="true">${type==='hotel'?'<path d="M16 52V20h8v20h72V20h8v48h-8V56H24v12h-8Zm12-16V20h28v16Zm36 0V20h28v16Z"/>':'<path d="M15 15q23 12 45 0v28q-23 30-45 0Zm12 14 10 4m8-4 9-2M29 43q9 9 18 0M66 26q20 8 40-1v28q-20 22-40 0Zm10 11 7 2m9 0 7-2M78 56q8-7 16 0"/>'}</svg></span>`;
function photo(post,type){const a=post.image??postPhoto(post.photo);return a?`<img src="./${esc(a.path)}" alt="" draggable="false">`:['sports','flowers','auto'].includes(type)?`<span class="kdw-post-art kdw-post-theme-symbol" data-theme="${type}">${esc(post.emoji??businessProfile(type).symbol)}</span>`:art(type);}
export function mountPostActivity({getSession}){
 if(webglActivitiesEnabled())return mountWebGLActivity({kind:'posts',getSession});
 const root=document.createElement('section');root.id='kdw-posts';root.hidden=true;root.setAttribute('aria-label','Публикации канала');document.body.append(root);
 const clock=createPresentationClock({smooth:true}),reduced=matchMedia('(prefers-reduced-motion: reduce)'),readStream=createPostStreamReader();
 let context='',snapshot=null,phase='',disposed=false,loading=null,loadedType='',loadError='',ready=false,starting=false,startFailed=false,error='',pending=new Set(),chain=Promise.resolve(),feedSignature='',audience=null,lastClock=0,geometry=null,generation=0,autoScroll=true,scrollAnimation=null;
 const cards=new Map(),images=new Map(),placement=createRightCardLayout(),entry=createFlowEntry();
 const reactionStarts=new Map(),completionPop=createCardPop();
 let audienceFrom=0,audienceAt=0,metricsAt=0;
 const motion=createStoreMotion(root,{getSlot:id=>root.querySelector(`[data-published="${id}"]`),photoSelector:'.kdw-feed-photo',sourcePhotoSelector:'.kdw-fall-photo',scrollerSelector:'.kdw-post-feed',sequence:true,
  onApproach(id){feedSignature='';refreshFeed(id);}});
 let trails=null;
 const active=s=>s?.state?.taskId===POSTS_TASK&&s.state.screenId===POSTS_SCREEN&&['task','result'].includes(s.state.status);
 const posts=()=>snapshot?.state.progress.business?.postsActivity;
 function type(){return posts()?.businessType??snapshot?.state.progress.business?.answers?.businessType??'cafe';}
 function valid(key=context){return !disposed&&key===context&&active(getSession()?.snapshot);}
 function status(message){message=visitorMessage(message);error=message;const el=root.querySelector('[data-post-error]');if(el)el.textContent=message;}
 async function preload(kind){
  if(loadedType===kind)return true;if(loading)return loading;
  loading=(async()=>{
   try{const bank=postBank(kind,posts()?.version??POSTS_RULES.version);await preloadBusinessImages(bank);await Promise.all([...new Set(bank.filter(p=>!p.image).map(p=>p.photo).filter(Boolean))].map(async id=>{
    if(images.has(id))return;const asset=postPhoto(id),image=new Image();image.src='./'+asset.path;
    await decodeImage(image);images.set(id,image);
   }));const profile=businessProfile(kind);if(profile.logo&&!images.has('avatar:'+kind)){const avatar=new Image();avatar.src='./'+profile.logo;await decodeImage(avatar);images.set('avatar:'+kind,avatar);}await Promise.all(['header','composer','fire','heart','views','verified'].map(async name=>{
    const key='chrome:'+name;if(images.has(key))return;const image=new Image();image.src=chrome(name);await decodeImage(image);images.set(key,image);
   }));loadedType=kind;loadError='';return true;}
   catch(error){console.error('MAX_POST_ASSETS_FALLBACK',error?.name);loadedType=kind;loadError='';return true;}
   finally{loading=null;}
  })();return loading;
 }
 function build(){
  placement.clear();
  root.innerHTML=`<div class="kdw-post-phone"><header><img class="kdw-post-header-art" src="${chrome('header')}" alt=""><div class="kdw-post-identity"><strong><span class="kdw-post-channel-name">${esc(BUSINESS_CHANNELS[type()]??'Кофейня')}</span><img src="${chrome('verified')}" alt="Подтверждённый канал"></strong><small data-post-audience></small></div></header><div class="kdw-post-feed" tabindex="0" aria-label="Публикации канала"></div><button class="kdw-post-new" hidden>Новые публикации ↓</button><footer aria-label="Панель публикации MAX"><img src="${chrome('composer')}" alt="Пост · Вложения · Камера · Микрофон"></footer></div><div class="kdw-post-actions"><p data-post-hint></p><button class="kdw-activity-button kdw-transition-button" data-post-finish hidden>Следующее задание</button><button class="kdw-activity-button" data-post-retry hidden>Повторить загрузку</button><p data-post-error role="status" aria-live="polite"></p></div><div class="kdw-post-cards"></div>`;
  const profile=businessProfile(type()),avatar=document.createElement('span');avatar.className='kdw-post-bound-avatar';avatar.style.background=profile.accent;avatar.innerHTML=profile.logo?`<img src="./${profile.logo}" alt="">`:esc(profile.symbol);root.querySelector('.kdw-post-phone header').append(avatar);for(const image of root.querySelectorAll('img'))guardImage(image,{fallback:fallbackImageSource()});
  const trailCanvas=document.createElement('canvas');trailCanvas.className='kdw-post-trails';trailCanvas.setAttribute('aria-hidden','true');root.prepend(trailCanvas);trails=createPostTrails(trailCanvas);
  // The full header participates in entry; do not pop the counter in only
  // after START_POSTS returns and the phone has already become opaque.
  audience=posts()?.audience??POSTS_RULES.initialAudience;audienceFrom=audience;audienceAt=performance.now();
  root.querySelector('[data-post-audience]').textContent=number(audience)+' подписчиков';
  root.querySelector('.kdw-post-feed').addEventListener('wheel',()=>{autoScroll=false;stopScroll();},{passive:true});
  root.querySelector('.kdw-post-feed').addEventListener('pointerdown',()=>{autoScroll=false;stopScroll();});
  root.querySelector('.kdw-post-feed').addEventListener('scroll',()=>{const feed=root.querySelector('.kdw-post-feed');if(feed.scrollHeight-feed.clientHeight-feed.scrollTop<8){autoScroll=true;root.querySelector('.kdw-post-new').hidden=true;}},{passive:true});
 }
 function stopScroll(){scrollAnimation?.cancel();scrollAnimation=null;}
 function scrollToBottom(){
  if(!autoScroll){root.querySelector('.kdw-post-new').hidden=false;return;}
  const feed=root.querySelector('.kdw-post-feed'),from=feed.scrollTop,to=Math.max(0,feed.scrollHeight-feed.clientHeight),start=performance.now();stopScroll();
  if(reduced.matches){feed.scrollTop=to;return;}
  let cancelled=false;scrollAnimation={cancel(){cancelled=true;}};
  function tick(now){if(cancelled||!valid())return;const t=Math.min(1,(now-start)/400);feed.scrollTop=from+(to-from)*(1-(1-t)**3);if(t<1)requestAnimationFrame(tick);else scrollAnimation=null;}requestAnimationFrame(tick);
 }
 function refreshFeed(approaching=null){
  const p=posts();if(!p)return;const signature=p.published.map(row=>row.spawnId).join(',');
  if(signature!==feedSignature){
   const feed=root.querySelector('.kdw-post-feed');let appended=false;
   const bank=postBank(p.businessType,p.version);
   for(const row of p.published){if(feed.querySelector(`[data-published="${row.spawnId}"]`)||(motion.has(row.spawnId)&&row.spawnId!==approaching))continue;const post=bank.find(item=>item.id===row.postId),node=document.createElement('article');
    node.className='kdw-feed-post';node.dataset.published=row.spawnId;node.dataset.good=String(row.good);
    if(motion.has(row.spawnId)&&!reduced.matches)reactionStarts.set(row.spawnId,null);
    node.innerHTML=`<div class="kdw-feed-photo">${photo(post,p.businessType)}</div><div class="kdw-feed-copy"><strong>${esc(typographyText(post.title))}</strong><p>${esc(typographyText(post.body))}</p><div class="kdw-feed-reactions">${['fire','heart'].map((kind,i)=>`<button class="kdw-feed-reaction" data-reaction="${kind}" aria-label="${i?'Нравится':'Огонь'}" aria-pressed="false"><img src="${chrome(kind)}" alt=""><span data-count="${kind}">0</span></button>`).join('')}</div><div class="kdw-feed-meta"><img src="${chrome('views')}" alt="Просмотры"><span data-views>1</span><span>·</span><time>${postMetrics(row,0).time}</time></div></div>`;feed.append(node);for(const image of node.querySelectorAll('img'))guardImage(image,{fallback:fallbackImageSource({width:440,height:300})});appended=true;
   }
   feedSignature=signature;motion.sync();if(appended){feed.querySelector('.kdw-post-empty')?.remove();scrollToBottom();}
  }
  if(audience!==p.audience){audienceFrom=audience===null?p.audience:displayAudience();audienceAt=performance.now();audience=p.audience;}
  const goal=postsGoal(p);
  document.documentElement.dataset.kdwPostsComplete=String(goal);
  root.querySelector('[data-post-finish]').hidden=!goal;root.querySelector('[data-post-hint]').textContent='';
 }
 function displayAudience(){const progress=reduced.matches?1:counterProgress(performance.now()-audienceAt);return Math.round(audienceFrom+((audience??audienceFrom)-audienceFrom)*progress);}
 function updateMetrics(elapsed){
  setText(root.querySelector('[data-post-audience]'),number(displayAudience())+' подписчиков');
  if(performance.now()-metricsAt<32)return;metricsAt=performance.now();
  for(const row of posts()?.published??[]){const node=root.querySelector(`[data-published="${row.spawnId}"]`);if(!node)continue;
   let reactionAge=reduced.matches?COUNTER_DURATION:null;
   if(!reduced.matches&&reactionStarts.has(row.spawnId)){
    let start=reactionStarts.get(row.spawnId);
    if(start===null&&!node.hasAttribute('data-arriving')){start=performance.now();reactionStarts.set(row.spawnId,start);}
    reactionAge=start===null?0:performance.now()-start;
    if(reactionAge>=COUNTER_DURATION)reactionStarts.delete(row.spawnId);
   }
   const values=postMetrics(row,elapsed,reactionAge);
   setText(node.querySelector('[data-views]'),formatPostCount(values.views));
   for(const kind of ['fire','heart']){const button=node.querySelector(`[data-reaction="${kind}"]`);setText(button.querySelector('[data-count]'),formatPostCount(values[kind]+Number(button.getAttribute('aria-pressed')==='true')));}
  }
 }
 async function start(){
  if(starting||startFailed||posts()||!ready||!valid())return;const session=getSession();if(session.busy||!snapshot.state.ownerActive||session.profile==='server'&&session.clockStale)return;
  starting=true;const key=context;
  try{const result=await session.command('START_POSTS',{taskId:POSTS_TASK,screenId:POSTS_SCREEN});if(!valid(key))return;
   snapshot=session.snapshot;
   if(posts()){startFailed=false;status('');}
   else if(!result?.reply.ok){startFailed=true;status('Не удалось начать. Нажмите «Повторить».');}}
  catch{if(valid(key)){startFailed=true;status('Не удалось начать. Нажмите «Повторить».');}}
  finally{if(valid(key))starting=false;}
 }
 function publish(spawnId,button){
  if(pending.has(spawnId)||pending.size>=2||!ready||!valid()||postsGoal(posts()??{audience:0}))return;
  const key=context,animate=autoScroll;pending.add(spawnId);button.disabled=true;button.dataset.pending='true';
  if(animate)motion.begin(spawnId,button);
  chain=chain.catch(()=>{}).then(async()=>{
   const session=getSession();let retries=0;
   while(session.busy&&valid(key)&&retries++<80)await new Promise(r=>setTimeout(r,20));
   if(!valid(key)||!ready){if(valid(key))motion.cancel(spawnId);return;}
   const result=await session.command('PUBLISH_POST',{taskId:POSTS_TASK,screenId:POSTS_SCREEN,spawnId});
   if(!valid(key))return;
   if(result?.reply.ok){snapshot=session.snapshot;refreshFeed();const row=posts().published.find(p=>p.spawnId===spawnId);if(row&&animate)motion.add(row.postId,spawnId,button);status('');}
   else{motion.cancel(spawnId);status(result?.reply.code==='POST_NOT_AVAILABLE'?'Пост уже улетел. Выберите следующий.':'Не удалось сохранить публикацию. Попробуйте ещё раз.');}
  }).catch(()=>{if(valid(key)){motion.cancel(spawnId);status('Не удалось сохранить публикацию. Попробуйте ещё раз.');}}).finally(()=>{if(valid(key)){pending.delete(spawnId);if(button.isConnected){button.disabled=false;delete button.dataset.pending;}}});
 }
 function updateCards(elapsed){
  if(postsGoal(posts())){
   const selected=new Set(posts().published.map(row=>row.spawnId));
   for(const [id,node]of cards)if(selected.has(id)){node.remove();cards.delete(id);}
   completionPop.start(cards.values());trails?.clear();return;
  }
  const p=posts();let shown=p&&!postsGoal(p)?readStream(p,elapsed):[];
  const trailSources=[];
  const visible=new Set(shown.map(s=>s.spawnId));
  for(const [id,node]of cards)if(!visible.has(id)){node.remove();cards.delete(id);}
  for(const spawn of shown){
   let node=cards.get(spawn.spawnId);
   if(!node){node=document.createElement('button');node.type='button';node.className='kdw-falling-post';node.dataset.spawn=spawn.spawnId;node.dataset.post=spawn.post.id;node.setAttribute('aria-label','Опубликовать: '+spawn.post.title);
    Object.assign(node.style,{width:'440px',fontSize:'1px',transformOrigin:'0 0'});node.style.setProperty('--u','1px');
    node.innerHTML=`<span class="kdw-fall-photo">${photo(spawn.post,p.businessType)}</span><span class="kdw-fall-title">${esc(typographyText(spawn.post.title))}</span><span class="kdw-fall-body">${esc(typographyText(spawn.post.body))}</span><span class="kdw-fall-reactions">♡ <span>Опубликовать</span></span>`;
    node.dataset.lane=String(spawn.lane);node.dataset.start=String(spawn.start);node.dataset.travel=String(spawn.travel??POSTS_RULES.travel);
    root.querySelector('.kdw-post-cards').append(node);cards.set(spawn.spawnId,node);for(const image of node.querySelectorAll('img'))guardImage(image,{fallback:fallbackImageSource({width:440,height:220})});
   }
   node.dataset.flow=spawn.flow??'';node.dataset.column=String(spawn.column);
  }
  const rects=geometry?placement.layout(geometry,shown,(spawn,w,unit)=>{
   const node=cards.get(spawn.spawnId);
   return node.offsetHeight*unit;
  }):new Map();
  const admitted=entry.update(shown,s=>rects.get(s.spawnId),ready);
  for(const spawn of shown){
   const node=cards.get(spawn.spawnId);
   const visible=admitted.has(spawn.spawnId),state=visible?'admitted':'waiting';
   if(node.dataset.flowEntry!==state){node.dataset.flowEntry=state;node.style.visibility=visible?'':'hidden';}
   if(!pending.has(spawn.spawnId)&&geometry){
    const {x,y,w,unit:cardScale}=rects.get(spawn.spawnId);
    if(visible)trailSources.push({x,y,w});
    node.style.transform=`translate3d(${x}px,${y}px,0) scale(${cardScale})`;
   }
   const disabled=!visible||pending.has(spawn.spawnId)||!snapshot.state.ownerActive||getSession()?.profile==='server'&&getSession()?.clockStale||!ready;if(node.disabled!==disabled)node.disabled=disabled;
  }
  trails?.draw(trailSources,elapsed,geometry?.scale??1,reduced.matches);
 }
 root.addEventListener('pointerdown',event=>{
  const b=event.target.closest('[data-spawn]');if(!b||b.disabled)return;event.stopPropagation();b.dataset.held='true';b._press={id:event.pointerId,x:event.clientX,y:event.clientY};b.setPointerCapture(event.pointerId);
 });
 function release(event,cancel){const b=event.target.closest('[data-spawn]');if(!b?._press||b._press.id!==event.pointerId)return;event.stopPropagation();const press=b._press;delete b._press;delete b.dataset.held;if(!cancel&&Math.hypot(event.clientX-press.x,event.clientY-press.y)<16)publish(b.dataset.spawn,b);}
 root.addEventListener('pointerup',e=>release(e,false));root.addEventListener('pointercancel',e=>release(e,true));
 root.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.reaction){b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));metricsAt=0;return;}
  if(b.dataset.spawn&&event.detail===0)publish(b.dataset.spawn,b);
  if(b.hasAttribute('data-post-retry')){loadError='';status('');startFailed=false;if(!document.hidden)void getSession()?.owner(true);if(loadedType!==type()&&!loading)void preload(type());}
  if(b.classList.contains('kdw-post-new')){autoScroll=true;scrollToBottom();b.hidden=true;}
  if(b.hasAttribute('data-post-finish')&&!motion.active()&&!getSession().busy&&postsGoal(posts())){b.disabled=true;void getSession().act(POSTS_SCREEN,'business.channel.result.continue').then(r=>{if(!r?.reply.ok&&valid()){b.disabled=false;console.error('MAX_POST_CONTINUE_RETRY');}});}
 });
 function clear(){motion.clear();completionPop.clear();reactionStarts.clear();fadeActivityOut(root);generation++;context='';root.hidden=true;trails?.clear();trails=null;root.replaceChildren();cards.clear();entry.clear();pending.clear();stopScroll();ready=false;starting=false;startFailed=false;audience=null;feedSignature='';autoScroll=true;error='';delete document.documentElement.dataset.kdwPosts;delete document.documentElement.dataset.kdwPostsComplete;}
 return {
  ready(next){
   if(!active(next))return true;
   const kind=next.state.progress.business?.postsActivity?.businessType??next.state.progress.business?.answers?.businessType??'cafe';
   if(loadedType!==kind&&!loading&&!loadError)void preload(kind);
   return loadedType===kind||!!loadError;
  },
  update(next,nextPhase){
   if(snapshot===next&&phase===nextPhase)return;
   snapshot=next;phase=nextPhase;clock.accept(next);
   if(next?.state?.taskId===POSTS_TASK&&next.state.screenId!==POSTS_SCREEN&&!loading)void preload(next.state.progress.business?.answers?.businessType??'cafe');
   if(!active(next)||!['task','result','paused','phone-exit'].includes(phase)){if(context)clear();return;}
   const key=`${next.state.runId}:${next.state.taskId}`;
   if(context!==key){clear();context=key;build();void preload(type());}
   document.documentElement.dataset.kdwPosts='active';
   if(loadedType!==type()&&!loading&&!loadError)void preload(type());
   refreshFeed();
  },
  align(){
   if(!context)return;const g=activityGeometry(),phone=g?.phone;
   const available=g&&g.matched&&phone.dataset.sceneVersion?.includes(POSTS_SCREEN)&&(loadedType===type()||!!loadError);
   const editor=root.querySelector('.kdw-post-phone'),field=root.querySelector('.kdw-post-cards');
   ready=false;if(!available){root.hidden=true;root.dataset.ready='false';editor.style.opacity='0';field.style.opacity='0';return;}
   const entering=root.hidden;
   geometry=g;const phoneAlpha=alignActivityPhone(editor,g,{sharedPresence:true});field.style.opacity=String(g.alpha);root.hidden=false;
   alignActivityActions(root.querySelector('.kdw-post-actions'),g,phoneAlpha,editor.inert);
   if(entering&&feedSignature)scrollToBottom();
   root.querySelector('.kdw-post-trails').style.opacity=String(g.alpha);
   ready=loadedType===type()&&!document.hidden&&phase==='task'&&phoneAlpha>.97&&!editor.inert;
   root.dataset.ready=String(ready);root.querySelector('[data-post-retry]').hidden=!loadError&&!error;
   if(loadError)status(loadError);else if(!loadedType)root.querySelector('[data-post-hint]').textContent='Готовим публикации…';
   const read=clock.read(getSession()?.connected!==false);lastClock=read.time??snapshot.view.clock.serverTime;
   updateMetrics(posts()?postsElapsed(posts(),activityRemaining(snapshot.state,lastClock)):0);
   if(ready&&!read.stale&&snapshot.state.ownerActive){void start();const elapsed=posts()?postsElapsed(posts(),activityRemaining(snapshot.state,lastClock)):0;updateCards(elapsed);}
   else for(const node of cards.values())node.disabled=true;
   root.querySelector('[data-post-finish]').disabled=motion.active()||!ready||!snapshot.state.ownerActive||getSession()?.busy||read.stale;
  },
  dispose(){disposed=true;clear();images.clear();root.remove();},
 };
}

