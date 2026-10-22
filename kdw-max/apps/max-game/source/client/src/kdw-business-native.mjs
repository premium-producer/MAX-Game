import {activityGeometry} from './kdw-activity-stage.mjs';
import {ownsBusinessScreen} from './kdw-business-native-model.mjs';
import {businessProfile} from './kdw-business-profile.mjs';
import {businessScreenMarkup as businessSourceMarkup,businessScreenLayout as businessSourceLayout,createBusinessScreenLoader as createBusinessComponentLoader} from './kdw-business-all-ui.mjs';
import {fitBusinessFields} from './kdw-business-source-ui.mjs';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const businessScreenMarkup=businessSourceMarkup;
/** One scene authority: use only the presented snapshot, and commit HTML only
 * after its shell owns the same scene. Resource readiness never waits for alpha. */
export function mountBusinessNative({getSession,enabled=true}){
 if(!enabled)return {ready:()=>true,align(){},update(){},dispose(){}};
 const root=document.createElement('section');root.id='kdw-business-native';root.hidden=true;root.setAttribute('aria-label','MAX для бизнеса');document.body.append(root);
 const componentLoader=createBusinessComponentLoader();
 let candidate=null,snapshot=null,key='',phase='',disposed=false,busy=false;
 const scene=s=>`${s.runId}:${s.taskId}:${s.screenId}:`,current=()=>{const a=snapshot?.state,b=getSession()?.snapshot?.state;return a&&b&&scene(a)===scene(b)&&(b.status==='task'||b.screenId==='business.platform.ready'&&b.status==='result');};
 function ready(next){if(!ownsBusinessScreen(next?.state))return true;return componentLoader.ready(next.state.screenId,next.state);}
 function render(){const s=snapshot.state,layout=businessSourceLayout(s.screenId,s),width=layout?.width??1280,height=layout?.height??800;root.innerHTML=`<div class="bn-surface" data-bn-screen="${esc(s.screenId)}" data-business="${businessProfile(s).id}" style="width:${width}px;height:${height}px">${businessScreenMarkup(snapshot)}<p class="bn-error" role="status"></p></div>`;componentLoader.apply(root);root.dataset.width=width;root.hidden=false;fitBusinessFields(root);document.documentElement.dataset.businessNative='true';}
 function align(){if(disposed||!ownsBusinessScreen(candidate?.state))return;const g=activityGeometry(),s=candidate.state;if(g?.matched&&g.phone.dataset.sceneVersion?.startsWith(scene(s))&&ready(candidate)){const next=scene(s);if(next!==key){snapshot=candidate;key=next;busy=false;render();}else snapshot=candidate;}if(root.hidden)return;const node=root.firstElementChild;if(!g?.matched||!g.phone.dataset.sceneVersion?.startsWith(scene(snapshot.state))){node.style.opacity='0';node.inert=true;return;}const scale=g.rect.width/Number(root.dataset.width);Object.assign(node.style,{left:g.rect.left+'px',top:g.rect.top+'px',transform:`scale(${scale})`,opacity:String(g.alpha)});node.inert=busy||g.alpha<.97||g.phone.inert||!(phase==='task'||phase==='result'&&s.screenId==='business.platform.ready')||!current();}
 root.addEventListener('click',async e=>{const retry=e.target.closest('[data-bn-retry]');if(retry){componentLoader.retry(retry.dataset.bnRetry);key='';return;}const button=e.target.closest('[data-bn-action]');if(!button||button.disabled||root.firstElementChild.inert||busy||!current())return;const expected=key,s=getSession().snapshot.state;busy=true;align();try{const result=await (s.status==='result'&&s.screenId==='business.platform.ready'?getSession().command('ADVANCE_RESULT'):getSession().act(s.screenId,button.dataset.bnAction,s.revision));if(!result?.reply.ok)throw Error('Не удалось продолжить. Попробуйте ещё раз.');}catch(error){if(key===expected)root.querySelector('.bn-error').textContent=error.message;}finally{if(key===expected){busy=false;align();}}});
 root.addEventListener('error',e=>{if(e.target.tagName!=='IMG')return;e.target.hidden=true;e.target.parentElement.dataset.imageUnavailable='true';},true);
 function hide(){root.hidden=true;root.replaceChildren();snapshot=null;key='';busy=false;delete document.documentElement.dataset.businessNative;}
 return {ready,align,update(next,nextPhase){candidate=next;phase=nextPhase;if(!ownsBusinessScreen(next?.state)){if(!root.hidden)hide();return;}ready(next);align();},dispose(){disposed=true;componentLoader.dispose();hide();root.remove();}};
}
