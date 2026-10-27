import {mountPostActivity} from '../../apps/max-game/source/client/src/kdw-posts.mjs';
import {mountKdwInteractions} from '../../apps/max-game/source/client/src/kdw-interactions.mjs';
import {POSTS_RULES,POSTS_TASK,POSTS_SCREEN,reducePosts} from '../../apps/max-game/source/client/src/kdw-posts-model.mjs';
import {STORE_TASK,STORE_SCREEN,reduceStore} from '../../apps/max-game/source/client/src/kdw-store-rating.mjs';

const kind=new URLSearchParams(location.search).get('kind')??'posts',posts=kind==='posts';
const taskId=posts?POSTS_TASK:STORE_TASK,screenId=posts?POSTS_SCREEN:STORE_SCREEN;
const start=Date.now(),origin=performance.now(),key=`1:${taskId}:${screenId}:task`;
const arena=document.querySelector('#arena'),host=document.querySelector('.journey-zone'),phone=document.querySelector('.route-phone');
arena.style.width='3072px';arena.style.height='1536px';arena.style.transform=`scale(${innerWidth/3072})`;
host.dataset.contentPresence=host.dataset.uiPresence='1';
phone.dataset.pathPresence='1';phone.dataset.sceneVersion=phone.dataset.mediaReadyKey=key;
const activity={version:posts?POSTS_RULES.version:7,runId:1,seed:7,businessType:'cafe',startRemainingMs:60000,published:[],...(posts?{audience:POSTS_RULES.initialAudience}:{})};
const state={sessionId:'flow-fixture',runId:1,revision:1,status:'task',taskId,screenId,missionId:'business',ownerActive:true,pausedAt:null,deadlineAt:start+60000,progress:{business:{answers:{businessType:'cafe'},[posts?'postsActivity':'storeActivity']:activity}}};
const snap=()=>({state,view:{clock:{schemaVersion:1,serverTime:Date.now(),checkpointAt:Date.now(),maxExtrapolationMs:1000,held:false}}});
const session={snapshot:snap(),profile:'local',connected:true,busy:false,async command(type,fields){this.busy=true;try{await new Promise(r=>setTimeout(r,60));const error=(posts?reducePosts:reduceStore)(state,{type,...fields},Date.now());state.revision++;this.snapshot=snap();return{reply:{ok:!error,code:error}};}finally{this.busy=false;}}};
const mounted=posts?mountPostActivity({getSession:()=>session}):mountKdwInteractions({getSession:()=>session,deferAlignment:true,onMenu(){}});
const selector=posts?'.kdw-falling-post':'.kdw-product-stream .kdw-product';
const nativeHeight=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetHeight');let heightReads=0;
Object.defineProperty(HTMLElement.prototype,'offsetHeight',{configurable:true,get(){if(this.matches(selector))heightReads++;return nativeHeight.get.call(this);}});
let textMutations=0,disabledMutations=0;const observer=new MutationObserver(rows=>{for(const row of rows){if(row.type==='childList'||row.type==='characterData')textMutations++;else if(row.attributeName==='disabled')disabledMutations++;}});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled']});
const previous=new Map(),nodeIds=new WeakMap(),clicks=[],report={frames:0,workMs:[],rafMs:[],horizontalJumps:[],earlyRemovals:[],nodeReplacements:[],maxVerticalStep:0};
let serial=0,checkpoint=0,priorFrame=0,done=false;
function frame(now){
 if(done)return;const t=now-origin,work=performance.now();
 // Reproduce the authored phone drift without changing the actual viewport.
 phone.style.translate=`${Math.sin(t/500)*4}px ${Math.cos(t/850)*2}px`;
 if(t-checkpoint>=350&&!(t>4000&&t<5300)){checkpoint=t;state.revision++;session.snapshot=snap();}
 mounted.update(session.snapshot,'task');mounted.align();
 const selected=new Set(activity.published.map(r=>r.spawnId)),live=new Set();
 for(const node of document.querySelectorAll(selector)){
  const id=node.dataset.spawn??node.dataset.productSpawn,r=node.getBoundingClientRect(),visible=getComputedStyle(node).visibility!=='hidden';live.add(id);
  if(!nodeIds.has(node))nodeIds.set(node,++serial);
  const old=previous.get(id),pending=node.dataset.pending||node.style.visibility==='hidden';
  if(old&&old.visible&&visible&&!pending&&!selected.has(id)){
   if(old.node!==nodeIds.get(node))report.nodeReplacements.push(id);
   if(Math.abs(r.x-old.x)>5)report.horizontalJumps.push({id,dx:r.x-old.x,t});
   report.maxVerticalStep=Math.max(report.maxVerticalStep,Math.abs(r.y-old.y));
  }
  previous.set(id,{node:nodeIds.get(node),x:r.x,y:r.y,bottom:r.bottom,visible,pending});
 }
 for(const [id,old]of previous)if(!live.has(id)){if(old.visible&&!old.pending&&!selected.has(id)&&old.bottom>0&&old.y<innerHeight)report.earlyRemovals.push({id,y:old.y});previous.delete(id);}
 if(clicks.length<2&&t>(clicks.length?9000:6500)){
  const node=[...document.querySelectorAll(selector)].find(n=>{const r=n.getBoundingClientRect();return !n.disabled&&getComputedStyle(n).visibility!=='hidden'&&r.y>40&&r.bottom<innerHeight-20;});
  if(node){clicks.push(node.dataset.spawn??node.dataset.productSpawn);node.click();}
 }
 report.workMs.push(performance.now()-work);if(priorFrame)report.rafMs.push(now-priorFrame);priorFrame=now;report.frames++;
 requestAnimationFrame(frame);
}
window.flowAudit={finish(){done=true;observer.disconnect();mounted.dispose();Object.defineProperty(HTMLElement.prototype,'offsetHeight',nativeHeight);return{...report,heightReads,textMutations,disabledMutations,clicks,published:activity.published.length,kind};}};
requestAnimationFrame(frame);
