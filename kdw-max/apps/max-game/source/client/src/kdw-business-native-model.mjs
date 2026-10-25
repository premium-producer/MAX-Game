import assets from './kdw-business-ui-assets.json' with {type:'json'};
import original from './kdw-business-components.json' with {type:'json'};
import confirmation from './kdw-business-confirmation.json' with {type:'json'};
import {BUSINESS_ALL_ASSETS,BUSINESS_ALL_ROUTE} from './kdw-business-all-model.mjs';
export const BUSINESS_NATIVE_SCREENS=Object.freeze({
 'business.platform.business-type':'choice','business.platform.login':'landing',
 'business.platform.profile':'desktop','business.platform.verification':'desktop','business.platform.ready':'desktop',
 'business.channel.create':'dashboard','business.channel.continue':'method',
 'business.channel.open':'phone','business.channel.setup':'phone','business.channel.details':'phone',
 'business.channel.description':'phone','business.channel.type':'phone','business.channel.publish':'phone',
 'business.bot.create':'dashboard','business.bot.filled':'form','business.bot.ready':'bots','business.bot.result':'order',
});
export const BUSINESS_UI_ASSETS={...assets,...original.assets,...confirmation.assets,...BUSINESS_ALL_ASSETS};
export function businessConfirmationLinkRect(rect){if(!rect)return rect;const h=rect.w*78/455;return {...rect,y:rect.y+(rect.h-h)/2,h};}
export function businessDeviceLinkRect(rect,{screenId,original=false,mediaRect}={}){
 return screenId==='business.platform.ready'&&!original?businessConfirmationLinkRect(mediaRect??rect):rect;
}
export function ownsBusinessScreen(state){return !!state&&['task','result'].includes(state.status)&&(Object.hasOwn(BUSINESS_NATIVE_SCREENS,state.screenId)||Object.hasOwn(BUSINESS_ALL_ROUTE,state.screenId));}
export function applyBusinessNative(catalog){
 Object.assign(catalog.assets,Object.fromEntries(Object.entries(BUSINESS_UI_ASSETS).filter(([,a])=>a.mimeType==='image/svg+xml')));
 for(const [id,kind] of Object.entries(BUSINESS_NATIVE_SCREENS)){
  const screen=catalog.tasks[id.split('.').slice(0,2).join('.')].screens[id];
  screen.assetId=confirmation.screens[id]?.canvas??original.screens[id]?.canvas??'kdw.business-ui.'+kind;screen.annotations=[];
  // DOM components own hit testing. Retain command IDs/outcomes for replay.
  for(const action of screen.actions){action.placement='below-screen';delete action.rect;}
 }
 const platform=catalog.tasks['business.platform'];
 catalog.kdwBusinessPlatformLegacy={verification:structuredClone(platform.screens['business.platform.verification']),ready:structuredClone(platform.screens['business.platform.ready'])};
 platform.screens['business.platform.verification'].actions[0].outcome={kind:'complete-task'};
 catalog.kdwBusinessConfirmation={from:'business.platform.verification',screenId:'business.platform.ready'};
 catalog.kdwBusinessNative=2;return catalog;
}
