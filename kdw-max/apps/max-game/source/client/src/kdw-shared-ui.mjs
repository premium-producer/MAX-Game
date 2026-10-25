import * as original from './journey-shared-ui.mjs';
import {v5Text,v5CopyMarkup} from './journey-v5-ui-copy.mjs';
import {typographyText,typographyMarkup,instructionText} from './kdw-typography.mjs';
import {completionCopy,COMPLETION_SCREENS,MISSION_COMPLETIONS} from './kdw-completion-copy.mjs';
import {storeGoal} from './kdw-store-rating.mjs';
export {sharedAssetUrl,warmSharedAssets} from './journey-shared-ui.mjs';
export function sharedInstructionBody(snapshot,options){
 const s=snapshot?.state;
 if(s?.taskId==='business.store'&&s.screenId==='business.store.start'&&(s.status==='result'||storeGoal(s.progress?.business?.storeActivity)))return MISSION_COMPLETIONS.business;
 const taskId=COMPLETION_SCREENS[s?.screenId];
 if(taskId)return completionCopy(taskId);
 if(s?.status==='result')return completionCopy(s.taskId)||String(snapshot?.view?.instruction?.text??'').trim();
 return original.sharedInstructionBody(snapshot,options);
}
export const sharedTaskMarkup=(snapshot,options)=>{
 const body=instructionText(sharedInstructionBody(snapshot,options));
 const markup=original.sharedTaskMarkup(snapshot,options).replace(/<button\b[^>]*>/g,tag=>{const id=tag.match(/data-answer="([^"]+)"/)?.[1];return snapshot.view.actions?.some(a=>a.actionId===id&&a.placement!=='hotspot'&&a.transitionKind)?tag.replace('class="','class="kdw-transition-button '):tag;});
 return typographyMarkup(markup.replace(/(<p\b[^>]*data-instruction-body[^>]*>)[\s\S]*?(<\/p>)/,(_match,open,close)=>open+v5CopyMarkup(body)+close));
};
// Compare the displayed copy, so spacing never restarts a retained panel's fade.
export const sharedInstructionRetention=(popup,options)=>original.sharedInstructionRetention(popup,{
 ...options,title:typographyText(v5Text(options.title)),body:typographyText(v5Text(instructionText(options.body)))
});
