import {activityGeometry,alignActivityPhone,rightCardRect,fadeActivityOut} from './kdw-activity-stage.mjs';
import {activityRemaining} from './kdw-development.mjs';
import {createPostTrails} from './kdw-post-trails.mjs';
import {POSTS_SCREEN,POSTS_TASK,POSTS_RULES,BUSINESS_CHANNELS,postBank,postPhoto,createPostStreamReader,postsElapsed,postsGoal} from './kdw-posts-model.mjs';
import {createPresentationClock} from './application/presentation-clock.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>n.toLocaleString('ru-RU');
const icon=(down=false)=>`<svg viewBox="0 0 24 24" aria-hidden="true" ${down?'style="transform:rotate(180deg)"':''}><path d="M8 10 12 3c2 0 3 1 2 4l-1 3h6c2 0 2 2 2 3l-2 7H8V10Zm-5 0h3v10H3Z" fill="currentColor"/></svg>`;
const art=(type)=>`<span class="kdw-post-art" data-theme="${type}"><svg viewBox="0 0 120 80" aria-hidden="true">${type==='hotel'?'<path d="M16 52V20h8v20h72V20h8v48h-8V56H24v12h-8Zm12-16V20h28v16Zm36 0V20h28v16Z"/>':'<path d="M15 15q23 12 45 0v28q-23 30-45 0Zm12 14 10 4m8-4 9-2M29 43q9 9 18 0M66 26q20 8 40-1v28q-20 22-40 0Zm10 11 7 2m9 0 7-2M78 56q8-7 16 0"/>'}</svg></span>`;
function photo(post,type){const a=postPhoto(post.photo);return a?`<img src="./${a.path}" alt="" draggable="false">`:art(type);}
export function mountPostActivity({getSession}){
 const root=document.createElement('section');root.id='kdw-posts';root.hidden=true;root.setAttribute('aria-label','Публикации канала');document.body.append(root);
 const clock=createPresentationClock(),reduced=matchMedia('(prefers-reduced-motion: reduce)'),readStream=createPostStreamReader();
 let context='',snapshot=null,phase='',disposed=false,loading=null,loadedType='',loadError='',ready=false,starting=false,startFailed=false,error='',pending=new Set(),chain=Promise.resolve(),feedSignature='',audience=null,lastClock=0,geometry=null,generation=0,autoScroll=true,scrollAnimation=null;
 const cards=new Map(),flights=new Set(),images=new Map();
 let trails=null;
 const active=s=>s?.state?.taskId===POSTS_TASK&&s.state.screenId===POSTS_SCREEN&&['task','result'].includes(s.state.status);
 const posts=()=>snapshot?.state.progress.business?.postsActivity;
 function type(){return posts()?.businessType??snapshot?.state.progress.business?.answers?.businessType??'cafe';}
 function valid(key=context){return !disposed&&key===context&&active(getSession()?.snapshot);}
 function status(message){error=message;const el=root.querySelector('[data-post-error]');if(el)el.textContent=message;}
 async function preload(kind){
  if(loadedType===kind)return true;if(loading)return loading;
  loading=(async()=>{
   try{await Promise.all([...new Set(postBank(kind).map(p=>p.photo).filter(Boolean))].map(async id=>{
    if(images.has(id))return;const asset=postPhoto(id),image=new Image();image.src='./'+asset.path;
    await Promise.race([image.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Изображения пока недоступны')),10000))]);images.set(id,image);
   }));loadedType=kind;loadError='';return true;}
   catch{loadError='Не удалось загрузить фотографии';return false;}
   finally{loading=null;}
  })();return loading;
 }
 function build(){
  root.innerHTML=`<div class="kdw-post-phone"><div class="kdw-post-status">9:41 <span>▴ ▰ ▰</span></div><header><span class="kdw-post-avatar">${type()==='cafe'?'☕':type()==='hotel'?'⌂':'✦'}</span><div><strong>${BUSINESS_CHANNELS[type()]??'Кофейня'} <b>●</b></strong><small data-post-audience></small></div><i>⋮</i></header><div class="kdw-post-feed" tabindex="0" aria-label="Публикации канала"><div class="kdw-post-empty">Ваш канал готов<br><strong>Выберите полезные посты</strong></div></div><button class="kdw-post-new" hidden>Новые публикации ↓</button><footer><div class="kdw-post-goal"><span>Рост аудитории</span><strong data-post-growth>+0 / +300</strong></div><div class="kdw-post-progress"><i></i></div><p data-post-hint>Выбирайте посты справа</p><button data-post-finish hidden>К следующему заданию →</button><button data-post-retry hidden>Повторить загрузку</button><p data-post-error role="status" aria-live="polite"></p></footer><span class="kdw-post-home"></span></div><div class="kdw-post-cards"></div><div class="kdw-post-notice" role="status" aria-live="polite"></div>`;
  const trailCanvas=document.createElement('canvas');trailCanvas.className='kdw-post-trails';trailCanvas.setAttribute('aria-hidden','true');root.prepend(trailCanvas);trails=createPostTrails(trailCanvas);
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
 function refreshFeed(){
  const p=posts();if(!p)return;const signature=p.published.map(row=>row.spawnId).join(',');
  if(signature!==feedSignature){
   const feed=root.querySelector('.kdw-post-feed');feed.querySelector('.kdw-post-empty')?.remove();
   const bank=postBank(p.businessType);
   for(const row of p.published){if(feed.querySelector(`[data-published="${row.spawnId}"]`))continue;const post=bank.find(item=>item.id===row.postId),node=document.createElement('article');
    node.className='kdw-feed-post';node.dataset.published=row.spawnId;node.dataset.good=String(row.good);
    node.innerHTML=`<div class="kdw-feed-photo">${photo(post,p.businessType)}</div><div class="kdw-feed-copy"><strong>${esc(post.title)}</strong><p>${esc(post.body)}</p><span class="kdw-feed-reaction">${icon(!row.good)} ${number(post.reactions)}</span><small>${row.delta>0?'+':''}${row.delta} подписчиков</small></div>`;feed.append(node);
   }
   feedSignature=signature;scrollToBottom();
  }
  const previous=audience;audience=p.audience;root.querySelector('[data-post-audience]').textContent=number(audience)+' подписчиков';
  const gain=audience-POSTS_RULES.initialAudience,goal=postsGoal(p);root.querySelector('[data-post-growth]').textContent=`${gain>=0?'+':''}${gain} / +${POSTS_RULES.goal}`;
  root.querySelector('.kdw-post-progress i').style.width=Math.max(0,Math.min(100,gain/POSTS_RULES.goal*100))+'%';
  root.querySelector('[data-post-finish]').hidden=!goal;root.querySelector('[data-post-hint]').textContent=goal?'Канал растёт. Отличная работа!':'Выбирайте посты справа';
  if(previous!==null&&previous!==audience){const row=p.published.at(-1),post=postBank(p.businessType).find(item=>item.id===row.postId),notice=root.querySelector('.kdw-post-notice');notice.dataset.good=String(row.good);notice.textContent=`${row.delta>0?'+':''}${row.delta} подписчиков · ${post.reason}`;}
 }
 async function start(){
  if(starting||startFailed||posts()||!ready||!valid())return;const session=getSession();if(session.busy||!snapshot.state.ownerActive||session.profile==='server'&&session.clockStale)return;
  starting=true;const key=context;
  try{const result=await session.command('START_POSTS',{taskId:POSTS_TASK,screenId:POSTS_SCREEN});if(!valid(key))return;if(!result?.reply.ok){startFailed=true;status('Не удалось начать. Нажмите «Повторить».');}}
  finally{if(valid(key))starting=false;}
 }
 function flight(from,row){
  if(reduced.matches||!autoScroll)return;const node=root.querySelector(`[data-published="${row.spawnId}"]`),target=node?.querySelector('.kdw-feed-photo');if(!target)return;
  const el=document.createElement('div');el.className='kdw-post-flight';const post=postBank(type()).find(p=>p.id===row.postId);el.innerHTML=photo(post,type());root.append(el);node.dataset.arriving='true';
  const start=performance.now(),key=context,f={el,node};flights.add(f);
  function tick(now){
   if(!valid(key)||!ready||document.hidden){end();return;}const to=target.getBoundingClientRect(),t=Math.min(1,(now-start)/570),e=1-(1-t)**3,arc=Math.sin(Math.PI*e)*80;
   Object.assign(el.style,{left:from.left+(to.left-from.left)*e+'px',top:from.top+(to.top-from.top)*e-arc+'px',width:from.width+(to.width-from.width)*e+'px',height:from.height+(to.height-from.height)*e+'px',transform:`rotate(${Math.sin(Math.PI*t)*-6}deg)`,opacity:String(Math.min(1,t*8))});
   if(t<1)requestAnimationFrame(tick);else end();
  }
  function end(){el.remove();delete node.dataset.arriving;flights.delete(f);}requestAnimationFrame(tick);
 }
 function publish(spawnId,button){
  if(pending.has(spawnId)||pending.size>=2||!ready||!valid()||postsGoal(posts()??{audience:0}))return;
  const key=context,from=button.querySelector('.kdw-fall-photo').getBoundingClientRect();pending.add(spawnId);button.disabled=true;button.dataset.pending='true';
  chain=chain.catch(()=>{}).then(async()=>{
   const session=getSession();let retries=0;
   while(session.busy&&valid(key)&&retries++<80)await new Promise(r=>setTimeout(r,20));
   if(!valid(key)||!ready)return;
   const result=await session.command('PUBLISH_POST',{taskId:POSTS_TASK,screenId:POSTS_SCREEN,spawnId});
   if(!valid(key))return;
   if(result?.reply.ok){snapshot=session.snapshot;refreshFeed();const row=posts().published.find(p=>p.spawnId===spawnId);if(row)flight(from,row);status('');}
   else status(result?.reply.code==='POST_NOT_AVAILABLE'?'Пост уже улетел. Выберите следующий.':'Не удалось сохранить публикацию. Попробуйте ещё раз.');
  }).finally(()=>{if(valid(key)){pending.delete(spawnId);if(button.isConnected){button.disabled=false;delete button.dataset.pending;}}});
 }
 function updateCards(elapsed){
  const p=posts();let shown=p&&!postsGoal(p)?readStream(p,elapsed):[];
  const trailSources=[];
  const visible=new Set(shown.map(s=>s.spawnId));
  for(const [id,node]of cards)if(!visible.has(id)){node.remove();cards.delete(id);}
  for(const spawn of shown){
   let node=cards.get(spawn.spawnId);
   if(!node){node=document.createElement('button');node.type='button';node.className='kdw-falling-post';node.dataset.spawn=spawn.spawnId;node.dataset.post=spawn.post.id;node.setAttribute('aria-label','Опубликовать: '+spawn.post.title);
    node.innerHTML=`<span class="kdw-fall-photo">${photo(spawn.post,p.businessType)}</span><span class="kdw-fall-title">${esc(spawn.post.title)}</span><span class="kdw-fall-body">${esc(spawn.post.body)}</span><span class="kdw-fall-reactions">♡ <span>Опубликовать</span></span>`;
    node.dataset.lane=String(spawn.lane);node.dataset.start=String(spawn.start);node.dataset.travel=String(spawn.travel??POSTS_RULES.travel);
    root.querySelector('.kdw-post-cards').append(node);cards.set(spawn.spawnId,node);
   }
   if(!pending.has(spawn.spawnId)&&!node.dataset.held&&geometry){
    const {x,y,w,unit:cardScale}=rightCardRect(geometry,spawn);
    trailSources.push({x,y,w});
    Object.assign(node.style,{width:w+'px',fontSize:cardScale+'px',transform:`translate(${x}px,${y}px)`});node.style.setProperty('--u',cardScale+'px');
   }
   node.disabled=pending.has(spawn.spawnId)||!snapshot.state.ownerActive||getSession()?.profile==='server'&&getSession()?.clockStale||!ready;
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
  if(b.dataset.spawn&&event.detail===0)publish(b.dataset.spawn,b);
  if(b.hasAttribute('data-post-retry')){loadError='';status('');startFailed=false;if(!document.hidden)void getSession()?.owner(true);if(loadedType!==type()&&!loading)void preload(type());}
  if(b.classList.contains('kdw-post-new')){autoScroll=true;scrollToBottom();b.hidden=true;}
  if(b.hasAttribute('data-post-finish')&&!getSession().busy&&postsGoal(posts())){b.disabled=true;void getSession().act(POSTS_SCREEN,'business.channel.result.continue').then(r=>{if(!r?.reply.ok&&valid()){b.disabled=false;status('Не удалось продолжить. Попробуйте ещё раз.');}});}
 });
 function clear(){fadeActivityOut(root);generation++;context='';root.hidden=true;trails?.clear();trails=null;root.replaceChildren();for(const f of flights){f.el.remove();delete f.node.dataset.arriving;}flights.clear();cards.clear();pending.clear();stopScroll();ready=false;starting=false;startFailed=false;audience=null;feedSignature='';autoScroll=true;error='';delete document.documentElement.dataset.kdwPosts;}
 return {
  update(next,nextPhase){
   snapshot=next;phase=nextPhase;clock.accept(next);
   if(next?.state?.taskId===POSTS_TASK&&next.state.screenId!==POSTS_SCREEN&&!loading)void preload(next.state.progress.business?.answers?.businessType??'cafe');
   if(!active(next)||!['task','result','paused'].includes(phase)){if(context)clear();return;}
   const key=`${next.state.runId}:${next.state.taskId}`;
   if(context!==key){clear();context=key;build();void preload(type());}
   document.documentElement.dataset.kdwPosts='active';root.hidden=false;
   if(loadedType!==type()&&!loading&&!loadError)void preload(type());
   refreshFeed();
  },
  align(){
   if(!context)return;const g=activityGeometry(),phone=g?.phone;
   const available=g&&g.matched&&phone.dataset.sceneVersion?.includes(POSTS_SCREEN);
   const editor=root.querySelector('.kdw-post-phone'),field=root.querySelector('.kdw-post-cards');
   ready=false;if(!available){editor.style.opacity='0';field.style.opacity='0';return;}
   geometry=g;alignActivityPhone(editor,g);field.style.opacity=String(g.alpha);
   root.querySelector('.kdw-post-trails').style.opacity=String(g.alpha);
   ready=loadedType===type()&&!document.hidden&&phase==='task'&&g.alpha>.97;
   root.dataset.ready=String(ready);root.querySelector('[data-post-retry]').hidden=!loadError&&!error;
   if(loadError)status(loadError);else if(!loadedType)root.querySelector('[data-post-hint]').textContent='Готовим публикации…';
   const read=clock.read(getSession()?.connected!==false);lastClock=read.time??snapshot.view.clock.serverTime;
   if(ready&&!read.stale&&snapshot.state.ownerActive){void start();if(posts()){const elapsed=postsElapsed(posts(),activityRemaining(snapshot.state,lastClock));updateCards(elapsed);}}
   else for(const node of cards.values())node.disabled=true;
   root.querySelector('[data-post-finish]').disabled=!ready||!snapshot.state.ownerActive||getSession()?.busy||read.stale;
  },
  dispose(){disposed=true;clear();images.clear();root.remove();},
 };
}
