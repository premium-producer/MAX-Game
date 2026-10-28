import {mountTransitionAction} from '../kdw-transition-action.mjs';
import {registerActivity} from './activity-runtime.mjs';
import {createActivityResources} from './activity-resources.mjs';
import {installActivityInput} from './activity-input.mjs';
import {createActivityTrails} from './activity-trails.mjs';
import {SELECTION_BRAKE_MS,selectionRimOpacity,brakingPose,orderedSprites,placeholderOpacity,ease,flightPose,generationKey,photoPose,phoneLayout,slotPose,summary} from './activity-model.mjs';
import {activityGeometry,alignActivityActions,createRightCardLayout} from '../kdw-activity-stage.mjs';
import {createPresentationClock} from '../kdw-card-clock.mjs';
import {createFlowEntry} from '../kdw-flow-entry.mjs';
import {postBank,createPostStreamReader,postsElapsed,postsGoal,POSTS_RULES,POSTS_SCREEN,POSTS_TASK} from '../kdw-posts-model.mjs';
import {storeBank,STORE_VERSION,storeTimeline,storeElapsed,storeGoal,storeRating,STORE_SCREEN,STORE_TASK} from '../kdw-store-rating.mjs';
import {activityRemaining} from '../kdw-development.mjs';
import {postMetrics,formatPostCount} from '../kdw-post-metrics.mjs';

export function mountWebGLActivity({kind,getSession}){
 const debug=new URLSearchParams(location.search).get('activityDebug')==='1';
 const imageOnly=new URLSearchParams(location.search).get('activityCards')!=='full';
 const posts=kind==='posts',taskId=posts?POSTS_TASK:STORE_TASK,screenId=posts?POSTS_SCREEN:STORE_SCREEN;
 const root=document.createElement('section');root.id=posts?'kdw-posts':'kdw-webgl-store';root.hidden=true;root.dataset.activityRenderer='webgl';root.setAttribute('aria-label',posts?'Публикации канала':'Витрина товаров');Object.assign(root.style,{pointerEvents:'none',position:'fixed',inset:'0',zIndex:'100',fontFamily:'Max Sans, sans-serif',color:'#fff'});document.body.append(root);
 root.innerHTML=`<div class="${posts?'kdw-post-actions':'kdw-store-actions'}"><button type="button" class="kdw-activity-button kdw-transition-button" data-activity-finish hidden>${posts?'Следующее задание':'Завершить миссию'}</button><button type="button" class="kdw-activity-button" data-activity-retry hidden>Повторить загрузку</button><p role="status" aria-live="polite" data-activity-error></p></div><div class="kdw-sr-only" data-activity-list></div>`;
 const footer=root.firstElementChild,finish=footer.querySelector('[data-activity-finish]'),retry=footer.querySelector('[data-activity-retry]'),error=root.querySelector('[data-activity-error]'),semantic=root.lastElementChild;
 const finishPresentation=mountTransitionAction(finish,root,posts?'kdw-post-actions':'kdw-store-actions');
 const newer=document.createElement('button');newer.type='button';newer.className='kdw-activity-button';newer.textContent='Новые публикации ↓';newer.hidden=true;footer.append(newer);
 let hasNewer=false;
 newer.addEventListener('click',()=>{autoScroll=true;hasNewer=false;if(layout)scrollTarget=layout.revealScroll;});
 const clock=createPresentationClock({smooth:true}),placement=createRightCardLayout(),entry=createFlowEntry(),readPosts=createPostStreamReader(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let snapshot=null,phase='',key='',contextKey='',epoch=0,resources=null,resourceKey='',disposed=false,active=false,starting=false,startFailed=false,commandBusy=false,chain=Promise.resolve(),lastNow=null,animationTime=0,lastReport=0,scroll=0,scrollTarget=0,autoScroll=true,layout=null,lastPublished='',elapsed=0,lastRows=[],items=[],current=null,submitted=null,lastSignature='',lastGoal=false,exits=[],closing=null,timeline=null,timelineSignature='';
 let movingItems=[],goalExit=null;const dismissed=new Set();
 const layerOrders=new Map();let nextLayerOrder=0;
 const flights=new Map(),reactions=new Set(),settledAt=new Map(),history=[],frameIntervals=[];
 const trails=createActivityTrails();
 let audience=POSTS_RULES.initialAudience,audienceFrom=audience,audienceAt=0;
 const owns=s=>s?.state?.taskId===taskId&&s.state.screenId===screenId&&['task','result'].includes(s.state.status);
 const activity=()=>posts?snapshot?.state.progress.business?.postsActivity:snapshot?.state.progress.business?.storeActivity;
 const goal=()=>posts?postsGoal(activity()):storeGoal(activity());
 const say=message=>{if(error.textContent!==message)error.textContent=message;};
 function ensure(next){
  const business=next?.state.progress.business;if(!business)return;
  const a=posts?business.postsActivity:business.storeActivity,type=a?.businessType??business.answers?.businessType??'cafe',version=a?.version??(posts?POSTS_RULES.version:STORE_VERSION),rkey=`${kind}:${type}:${version}`;
  if(resourceKey===rkey&&resources)return;resources?.dispose();resourceKey=rkey;resources=createActivityResources(kind,type,posts?postBank(type,version):storeBank(type,version),{imageOnly});
 }
 function reset(){movingItems=[];goalExit=null;dismissed.clear();finishPresentation.reset();epoch++;layerOrders.clear();nextLayerOrder=0;trails.clear();hasNewer=false;newer.hidden=true;flights.clear();settledAt.clear();reactions.clear();placement.clear();entry.clear();submitted=null;current=null;items=[];scroll=scrollTarget=0;autoScroll=true;lastPublished='';lastSignature='';lastGoal=false;exits=[];starting=false;startFailed=false;commandBusy=false;chain=Promise.resolve();lastNow=null;animationTime=0;timeline=null;timelineSignature='';semantic.replaceChildren();}
 function clearFlags(){if(posts){delete document.documentElement.dataset.kdwPosts;delete document.documentElement.dataset.kdwPostsComplete;}else{delete document.documentElement.dataset.kdwInteraction;delete document.documentElement.dataset.kdwStorePlaying;}}
 const draw=(texture,rect,extra={})=>{if(texture&&rect.w>0&&rect.h>0)items.push({texture,...rect,...extra});};
 const solid=(rect,color,opacity=1,radius=0,clip)=>draw(resources.extras.get('white'),rect,{color,opacity,radius,clip});
 function text(value,x,y,size,color,opacity=1,clip){
  const texture=resources.extras.get('glyphs'),atlas=resources.extras.get('glyphMetrics');if(!texture)return;
  for(const ch of String(value)){const glyph=atlas.get(ch);if(!glyph){x+=size*.5;continue;}const scale=size/30;draw(texture,{x,y:y-4*scale,w:glyph.w*scale,h:glyph.h*scale},{color,opacity,clip,uv:{x:glyph.x/texture.image.width,y:glyph.y/texture.image.height,w:glyph.w/texture.image.width,h:glyph.h/texture.image.height}});x+=glyph.advance*scale;}
 }
 function selectionBorder(pose,alpha,clip,radius=pose.radius??0){
  // Part of the same GPU sprite: follows its pose, clipping and layer order.
  const width=Math.max(2,5*pose.w/440);
  solid({...pose,x:pose.x-width,y:pose.y-width,w:pose.w+width*2,h:pose.h+width*2},'#00e5ff',alpha,radius+width,clip);
 }
 function drawCard(asset,pose,stored,alpha,clip,photoAlpha=alpha,selected=false){
  const surface=stored?asset.stored:asset.fall;
  if(!stored&&imageOnly){
   const photo=photoPose(pose,surface.photo,surface.w);
   if(selected)selectionBorder(photo,alpha*Number(selected),clip);
   draw(asset.photo,photo,{opacity:photoAlpha,fit:asset.fit,clip});return;
  }
  if(!stored)draw(resources.extras.get('white'),{x:pose.x-5,y:pose.y+5,w:pose.w+10,h:pose.h+12},{color:'#0d001a',opacity:alpha*.35,radius:40*pose.w/440+5,blur:7,clip});
  if(selected)selectionBorder(pose,alpha*Number(selected),clip,(stored?18:40)*pose.w/surface.w);
  draw(surface.texture,pose,{opacity:alpha,clip,radius:(stored?18:40)*pose.w/surface.w});
  draw(asset.photo,photoPose(pose,surface.photo,surface.w),{opacity:photoAlpha,fit:asset.fit,clip});
 }
 function rowsAt(a,time){if(posts)return readPosts(a,time);const signature=JSON.stringify(a);if(signature!==timelineSignature){timelineSignature=signature;timeline=storeTimeline(a);}return timeline.at(time);}
 function syncSemantics(hits){const signature=hits.filter(h=>h.action==='card'&&h.interactive).map(h=>h.id).join('|');if(signature===lastSignature)return;lastSignature=signature;semantic.replaceChildren();for(const h of hits.filter(h=>h.action==='card'&&h.interactive)){const b=document.createElement('button');b.textContent=(posts?'Опубликовать: ':'Добавить: ')+(h.asset.card.title??h.asset.card.name);b.addEventListener('click',()=>select(h.id));semantic.append(b);}}
 async function start(){
  const session=getSession();if(starting||startFailed||activity()||session.busy)return;starting=true;const expected=key;
  try{const r=await session.command(posts?'START_POSTS':'START_STORE',{taskId,screenId});if(key!==expected||!active)return;if(!r?.reply.ok){startFailed=true;say('Не удалось начать. Повторите попытку');}else say('');}
  catch{if(key===expected){startFailed=true;say('Не удалось начать. Повторите попытку');}}finally{if(key===expected)starting=false;}
 }
 function reconcile(){const published=activity()?.published??[];for(const [id,f]of flights){if(published.some(row=>row.spawnId===id)){if(f.phase==='pending'){f.phase='queued';f.acceptedAt=animationTime;}}else if(f.phase==='pending'&&f.failed){flights.delete(id);say('Не удалось сохранить выбор. Попробуйте ещё раз');}}}
 function select(id){
  if(debug)root.dataset.lastSelection=id;
  const frame=submitted,source=frame?.hits.find(h=>h.id===id&&h.action==='card'&&h.interactive),session=getSession();
  if(!source||!frame.interactive||frame.key!==key||flights.has(id)||goal()||flights.size>12||[...flights.values()].filter(f=>f.phase==='pending').length>=(posts?2:1))return false;
  if(!snapshot.state.ownerActive||session.connected===false||session.profile==='server'&&session.clockStale)return false;
  const f={id,asset:source.asset,layerOrder:source.layerOrder,velocity:{x:source.vx??0,y:source.vy??0},cardPose:{x:source.x,y:source.y,w:source.w,h:source.h},from:photoPose(source,source.asset.fall.photo,440),phase:'pending',at:animationTime,animate:!posts||autoScroll,wallAt:performance.now(),generation:key};f.origin={...f.cardPose};flights.set(id,f);source.action='occlusion';
  const expected=key;
  chain=chain.catch(()=>{}).then(async()=>{
   for(let count=0;session.busy&&count<80&&active&&key===expected;count++)await new Promise(r=>setTimeout(r,20));
   if(!active||key!==expected||goal())return;
   let timeout;
   try{const r=await Promise.race([session.command(posts?'PUBLISH_POST':'PICK_PRODUCT',{taskId,screenId,spawnId:id}),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('ACTIVITY_ACK_TIMEOUT')),15000);})]);if(!active||key!==expected)return;
    snapshot=session.snapshot;clock.accept(snapshot);f.failed=!r?.reply.ok;reconcile();if(!r?.reply.ok&&!activity()?.published.some(row=>row.spawnId===id)){flights.delete(id);say('Карточка уже недоступна. Выберите следующую');}else say('');
   }catch{if(key===expected&&active){f.failed=true;reconcile();}}finally{clearTimeout(timeout);}
  });
  return true;
 }
 async function complete(){
  const session=getSession();if(commandBusy||session.busy||!current?.interactive||!goal()||flights.size||exits.length||goalExit)return;
  commandBusy=true;finishPresentation.press();finish.disabled=true;const expected=key;
  try{const r=posts?await session.act(screenId,'business.channel.result.continue'):await session.command('ACT',{taskId,screenId,actionId:screenId+'.publish-now',expectedRevision:session.snapshot.state.revision});if(key===expected&&!r?.reply.ok){finishPresentation.retry();say('Не удалось продолжить. Попробуйте ещё раз');}}catch{if(key===expected){finishPresentation.retry();say('Нет связи. Попробуйте ещё раз');}}finally{if(key===expected)commandBusy=false;}
 }
 finish.addEventListener('click',complete);retry.addEventListener('click',()=>{startFailed=false;resources?.dispose();resources=null;resourceKey='';ensure(snapshot);say('');});
 Object.assign(semantic.style,{left:'50%',top:'50%'});
 const stopInput=installActivityInput({getFrame:()=>submitted,select,scroll:delta=>{if(!layout)return;autoScroll=false;scrollTarget=Math.max(0,Math.min(layout.maxScroll,scrollTarget+delta/layout.scale));},react:h=>{const id=h.id;if(reactions.has(id))reactions.delete(id);else reactions.add(id);}});
 function frame(now,frameId){
  if(disposed)return;
  if(!active){if(closing&&resources){const alpha=reduced.matches?0:1-(now-closing.at)/280;items=closing.items.map(item=>({...item,opacity:(item.opacity??1)*Math.max(0,alpha)}));if(alpha<=0){closing=null;items=[];resources.dispose();resources=null;resourceKey='';root.dataset.activityMetrics=JSON.stringify({kind,backend:'webgl',status:'released',resources:{bytes:0}});}}return;}
  const started=performance.now(),dt=lastNow===null?0:Math.max(0,now-lastNow);lastNow=now;
  if(dt>0){frameIntervals.push(dt);if(frameIntervals.length>600)frameIntervals.shift();}
  const g=activityGeometry(),ready=resources?.prepared&&g?.matched&&g.phone.dataset.sceneVersion?.includes(screenId);
  root.hidden=false;retry.hidden=!resources?.error&&!startFailed;if(resources?.error)say('Не удалось подготовить карточки. Повторите загрузку');
  if(!ready){if(g)alignActivityActions(footer,g,1,false);items=[];submitted=null;root.dataset.ready='false';return;}
  const read=clock.read(getSession()?.connected!==false,now),interactive=phase==='task'&&g.alpha>.97&&!g.phone.inert&&snapshot.state.ownerActive===true&&!read.stale&&!document.hidden;
  root.dataset.ready=String(interactive);if(interactive){animationTime+=Math.min(dt,100);if(!activity())void start();}
  if(read.time!==null)elapsed=activity()?(posts?postsElapsed(activity(),activityRemaining(snapshot.state,read.time)):storeElapsed(activity(),snapshot.state,read.time)):0;
  reconcile();
  const a=activity(),published=a?.published??[],done=goal();
  if(done&&!lastGoal){
   // Retire the last presented moving sprites together; scoring stays durable.
   // Cancelled arrivals must not reappear in the feed on the following frame.
   const landedLayers=new Set();
   for(const [id,f] of flights){
    if(f.phase==='docking'){landedLayers.add(f.layerOrder);continue;}
    dismissed.add(id);flights.delete(id);
   }
   const retiring=movingItems.filter(item=>!landedLayers.has(item.activityLayer));
   goalExit=reduced.matches||!retiring.length?null:{at:now,items:retiring};
   exits=[];trails.clear();
  }
  lastGoal=done;
  for(const f of flights.values())if(f.phase==='pending'||f.phase==='queued'){
   f.cardPose=brakingPose(f.origin,f.velocity,reduced.matches?SELECTION_BRAKE_MS:animationTime-f.at);
   f.from=photoPose(f.cardPose,f.asset.fall.photo,f.asset.fall.w);
  }
  if(![...flights.values()].some(f=>f.phase==='flying'||f.phase==='docking')){const next=[...flights.values()].find(f=>f.phase==='queued'&&(reduced.matches||animationTime-f.at>=SELECTION_BRAKE_MS));if(next){if(!posts)autoScroll=true;next.phase=next.animate?'flying':'fading';next.start=animationTime;if(!next.animate)hasNewer=true;}}
  const visibleRows=published.filter(row=>!dismissed.has(row.spawnId)&&(!flights.has(row.spawnId)||!['pending','queued','fading'].includes(flights.get(row.spawnId).phase)));
  layout=phoneLayout(kind,g.rect,resources.records,visibleRows);
  const signature=visibleRows.map(r=>r.spawnId).join('|');if(signature!==lastPublished){lastPublished=signature;if(autoScroll)scrollTarget=layout.revealScroll;}
  scrollTarget=Math.min(scrollTarget,layout.maxScroll);scroll=reduced.matches?scrollTarget:scroll+(scrollTarget-scroll)*(1-Math.exp(-dt/120));
  const alpha=g.alpha,hits=[],scale=layout.scale,rect={x:g.rect.x,y:g.rect.y,w:g.rect.width,h:g.rect.height},phoneClip={...rect,radius:28*scale},feedClip=layout.clip;
  items=[];solid(rect,posts?'#17181c':'#000',alpha,28*scale);solid(feedClip,posts?'#0d0e10':'#ededed',alpha,posts?0:29*scale,phoneClip);
  draw(resources.extras.get('header'),{x:rect.x,y:rect.y,w:rect.w,h:layout.header*scale},{opacity:alpha,clip:phoneClip});draw(resources.extras.get('label'),{x:rect.x,y:rect.y,w:rect.w,h:140*scale},{opacity:alpha,clip:phoneClip});
  if(posts){
   const next=a?.audience??POSTS_RULES.initialAudience;if(audience!==next){audienceFrom=audienceFrom+(audience-audienceFrom)*ease((animationTime-audienceAt)/700);audience=next;audienceAt=animationTime;}const number=Math.round(audienceFrom+(audience-audienceFrom)*ease((animationTime-audienceAt)/700));
   draw(resources.extras.get('avatar'),{x:rect.x+52*scale,y:rect.y+65.2*scale,w:42.95*scale,h:42.95*scale},{radius:22*scale,opacity:alpha,fit:1});
   text(number.toLocaleString('ru-RU')+' подписчиков',rect.x+103.6*scale,rect.y+85*scale,14*scale,'#818287',alpha,phoneClip);
   draw(resources.extras.get('footer'),{x:rect.x,y:rect.y+rect.h-78*scale,w:rect.w,h:78*scale},{opacity:alpha,clip:phoneClip});
  }else text(storeRating(a).toFixed(1).replace('.',','),rect.x+244*scale,rect.y+102*scale,15*scale,'#fff',alpha,phoneClip);
  // Placeholder grid is GPU-only as well; it never owns a hit rectangle.
  const revealFor=flight=>flight?flight.phase==='docking'?ease((animationTime-flight.landed)/420):0:1;
  if(!posts)for(let i=0;i<Math.max(8,Math.ceil((visibleRows.length+2)/2)*2);i++){
   const row=visibleRows[i],slot=row&&layout.slots.get(row.spawnId),flight=row&&flights.get(row.spawnId);
   const p=slot?slotPose(layout,slot,scroll):{x:feedClip.x+(9+i%2*190)*scale,y:feedClip.y+(9+Math.floor(i/2)*278-scroll)*scale,w:182*scale,h:270*scale};
   // Keep the white cell while the photo travels; fade it with the arriving card.
   solid(p,'#fff',alpha*(row?placeholderOpacity(revealFor(flight)):1),20*scale,feedClip);
  }
  for(const row of visibleRows){const slot=layout.slots.get(row.spawnId);if(!slot)continue;const pose=slotPose(layout,slot,scroll),flight=flights.get(row.spawnId);let reveal=revealFor(flight);
   drawCard(slot.asset,pose,true,alpha*reveal,feedClip,flight?0:alpha);
   if(posts){const at=settledAt.get(row.spawnId),m=postMetrics(row,elapsed,flight?0:at===undefined?700:animationTime-at),y=pose.y+slot.asset.stored.metrics.reactionY*scale;
    for(const [index,name]of ['fire','heart'].entries()){const x=pose.x+(index?113:10)*scale,id=`reaction:${row.spawnId}:${name}`;if(reactions.has(id))solid({x,y,w:(index?85:98)*scale,h:35*scale},'#4b6989',alpha*reveal,18*scale,feedClip);draw(resources.extras.get(name),{x:x+7*scale,y:y+4*scale,w:26*scale,h:26*scale},{opacity:alpha*reveal,clip:feedClip});text(formatPostCount(m[name]+Number(reactions.has(id))),x+37*scale,y+9*scale,15*scale,'#e0e0e4',alpha*reveal,feedClip);hits.push({id,action:'reaction',x,y,w:(index?85:98)*scale,h:35*scale,clip:feedClip,interactive:interactive&&!flight});}
    text(formatPostCount(m.views)+' · '+m.time,pose.x+215*scale,pose.y+slot.asset.stored.metrics.metaY*scale,11*scale,'#9295a6',alpha*reveal,feedClip);
   }else text('★ '+row.score.toFixed(1).replace('.',','),pose.x+136*scale,pose.y+(slot.asset.stored.photo.h+21)*scale,9*scale,row.score>=5?'#cf9400':'#e13b42',alpha*reveal,feedClip);
  }
  const rows=a&&!done?rowsAt(a,elapsed):[],selected=new Set(published.map(row=>row.spawnId)),field=g.flowArea?{x:g.flowArea.left,y:g.flowArea.top,w:g.flowArea.width,h:g.flowArea.height}:{x:0,y:0,w:innerWidth,h:innerHeight};
  const rects=placement.layout(g,rows,(spawn,w,unit)=>(resources.records.get(spawn.post.id)?.fall.h??600)*unit),admitted=entry.update(rows,r=>rects.get(r.spawnId),interactive),falling=[];
  const previousPoses=new Map(lastRows.map(p=>[p.id,p]));
  for(const spawn of rows){const asset=resources.records.get(spawn.post.id),r=rects.get(spawn.spawnId);if(!asset||!r||!admitted.has(spawn.spawnId)||selected.has(spawn.spawnId)||flights.has(spawn.spawnId))continue;
   if(!layerOrders.has(spawn.spawnId))layerOrders.set(spawn.spawnId,nextLayerOrder++);
   const previous=spawn.flow==='popup'?null:previousPoses.get(spawn.spawnId),vx=previous&&dt>0?(r.x-previous.x)/dt:0,vy=previous&&dt>0?(r.y-previous.y)/dt:0;
   const pose={x:r.x,y:r.y,w:r.w,h:r.h,vx,vy,flow:spawn.flow,start:spawn.start,travel:spawn.travel,layerOrder:layerOrders.get(spawn.spawnId),radius:(imageOnly?asset.fall.photo.radius:40)*r.w/440,id:spawn.spawnId,asset,action:'card',clip:field,interactive};falling.push(pose);
   hits.push(pose);
  }lastRows=falling;
  if(done||rows.some(r=>r.flow==='popup'))trails.clear();else for(const q of trails.update(falling,elapsed,innerWidth,innerHeight,g.scale,reduced.matches))solid(q,q.color,alpha*q.opacity,0,field);
  const sprites=[];
  const sprite=(layerOrder,paint)=>{const offset=items.length;paint();sprites.push({layerOrder,items:items.splice(offset)});};
  for(const pose of falling)sprite(pose.layerOrder,()=>drawCard(pose.asset,pose,false,alpha,field));
  exits=exits.filter(p=>animationTime-p.at<240);for(const p of exits){const t=Math.max(0,(animationTime-p.at)/240),s=reduced.matches?0:1-.45*ease(t);sprite(p.layerOrder,()=>drawCard(p.asset,{x:p.x+(1-s)*p.w/2,y:p.y+(1-s)*p.h/2,w:p.w*s,h:p.h*s},false,alpha*(1-ease(t)),field));}
  const flightPoses=debug?[]:null;
  for(const [id,f]of flights){
   if(f.phase==='fading'){
    const opacity=reduced.matches?0:1-ease((animationTime-f.start)/420);
    sprite(f.layerOrder,()=>drawCard(f.asset,f.cardPose,false,alpha*opacity,field,alpha*opacity,selectionRimOpacity(f.phase,animationTime-f.start,reduced.matches)));
    if(opacity>0)hits.push({...f.cardPose,id,layerOrder:f.layerOrder,action:'occlusion',clip:field,interactive});else flights.delete(id);
    continue;
   }
   if(f.phase==='pending'||f.phase==='queued'){
    sprite(f.layerOrder,()=>drawCard(f.asset,f.cardPose,false,alpha,field,alpha,selectionRimOpacity(f.phase,animationTime-f.at,reduced.matches)));
    hits.push({...f.cardPose,id,layerOrder:f.layerOrder,radius:(imageOnly?f.asset.fall.photo.radius:40)*f.cardPose.w/440,action:'occlusion',clip:field,interactive});
    flightPoses?.push({id,phase:f.phase,layerOrder:f.layerOrder,...f.cardPose});continue;
   }
   const slot=layout.slots.get(id);if(!slot)continue;const to=photoPose(slotPose(layout,slot,scroll),f.asset.stored.photo,f.asset.stored.w),t=reduced.matches?1:Math.min(1,(animationTime-f.start)/850);
   if(t>=1&&f.phase==='flying'){f.phase='docking';f.landed=animationTime;settledAt.set(id,animationTime);}
   const pose=f.phase==='docking'?to:flightPose(f.from,to,t);
   sprite(f.layerOrder,()=>{
    const shell=reduced.matches?0:1-ease((animationTime-f.start)/260);
    if(!imageOnly&&shell>0)drawCard(f.asset,f.cardPose,false,alpha*shell,field,0,selectionRimOpacity(f.phase,animationTime-f.start,reduced.matches));
    const rim=selectionRimOpacity(f.phase,animationTime-f.start,reduced.matches);
    if(rim>0)selectionBorder(pose,alpha*rim,f.phase==='docking'?feedClip:undefined);
    draw(f.asset.photo,pose,{opacity:alpha,fit:f.asset.fit,clip:f.phase==='docking'?feedClip:undefined});
   });
   hits.push({...pose,id,layerOrder:f.layerOrder,action:'occlusion',clip:f.phase==='docking'?feedClip:field,interactive});
   flightPoses?.push({id,phase:f.phase,layerOrder:f.layerOrder,...pose,target:to,reveal:revealFor(f)});
   if(f.phase==='docking'&&(reduced.matches||animationTime-f.landed>=420))flights.delete(id);
  }
  movingItems=orderedSprites(sprites).flatMap(group=>group.items.map(item=>({...item,activityLayer:group.layerOrder})));
  items.push(...movingItems);
  if(goalExit){const fade=reduced.matches?0:1-ease((now-goalExit.at)/280);
   if(fade<=0)goalExit=null;else for(const item of goalExit.items)items.push({...item,opacity:(item.opacity??1)*fade});
  }
  hits.sort((a,b)=>(a.layerOrder??-1)-(b.layerOrder??-1));
  current={frameId,key,hits,interactive,scrollClip:feedClip};syncSemantics(hits);
  alignActivityActions(footer,g,alpha,!interactive);finishPresentation.update(done,alpha,!interactive);finish.disabled=!interactive||flights.size>0||exits.length>0||!!goalExit||commandBusy||getSession()?.busy;
  newer.hidden=!posts||done||!hasNewer||autoScroll;
  if(posts)document.documentElement.dataset.kdwPostsComplete=String(done);else document.documentElement.dataset.kdwStorePlaying=String(!done);
  history.push(performance.now()-started);if(history.length>600)history.shift();
  if(now-lastReport>=1000){lastReport=now;root.dataset.activityMetrics=JSON.stringify({kind,backend:'webgl',frameId,frame:summary(frameIntervals),update:summary(history),resources:resources.stats,falling:falling.length,flights:flights.size,published:published.length,stale:read.stale});}
  if(debug)root.dataset.activityFrame=JSON.stringify({frameId,time:now,elapsed,key,interactive,phone:rect,goal:done,goalExit:!!goalExit,dismissed:[...dismissed],visiblePublished:visibleRows.length,rimCount:items.filter(item=>item.color==='#00e5ff'&&item.opacity>0).length,flights:flights.size,flightPoses,published:published.length,cards:falling.map(p=>({id:p.id,postId:p.asset.card.id,good:p.asset.card.good,flow:p.flow,start:p.start,travel:p.travel,layerOrder:p.layerOrder,vx:p.vx,vy:p.vy,x:p.x,y:p.y,w:p.w,h:p.h,interactive:p.interactive})),scroll,maxScroll:layout.maxScroll});
 }
 const controller={gpuActivity:true,frame,warm:renderer=>resources?.warm(renderer),items:()=>items,submitted(){submitted=current;},invalidateGPU(){submitted=null;resources?.invalidate();},
  ready(next){if(!owns(next))return true;ensure(next);return !!resources?.prepared;},flush:async()=>{},align(){},
  update(next,nextPhase){if(disposed)return;snapshot=next;phase=nextPhase;if(!owns(next)||!['trace','phone-enter','task','result','paused','phone-exit'].includes(phase)){if(active){active=false;closing={at:document.timeline.currentTime??performance.now(),items:[...items]};submitted=null;current=null;finishPresentation.reset();root.hidden=true;clearFlags();key='';contextKey='';}return;}
   ensure(next);const nextKey=generationKey(next.state)+':'+resourceKey;if(nextKey!==contextKey){reset();contextKey=nextKey;key=nextKey+':'+epoch;closing=null;}active=true;clock.accept(next);if(posts)document.documentElement.dataset.kdwPosts='active';else document.documentElement.dataset.kdwInteraction='store';
  },
  dispose(){disposed=true;active=false;finishPresentation.dispose();stopInput();unregister();resources?.dispose();reset();clearFlags();root.remove();},
 };
 const unregister=registerActivity(controller);return controller;
}
