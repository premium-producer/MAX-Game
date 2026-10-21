import assets from './kdw-business-ui-assets.json' with {type:'json'};
import original from './kdw-business-components.json' with {type:'json'};
export const BUSINESS_NATIVE_SCREENS=Object.freeze({
 'business.platform.business-type':'choice','business.platform.login':'landing',
 'business.platform.profile':'desktop','business.platform.verification':'desktop','business.platform.ready':'desktop',
 'business.channel.create':'dashboard','business.channel.continue':'method',
 'business.channel.open':'phone','business.channel.setup':'phone','business.channel.details':'phone',
 'business.channel.description':'phone','business.channel.type':'phone','business.channel.publish':'phone',
 'business.bot.create':'dashboard','business.bot.filled':'form','business.bot.ready':'bots','business.bot.result':'order',
});
export const BUSINESS_UI_ASSETS={...assets,...original.assets};
export function ownsBusinessScreen(state){return !!state&&['task','result'].includes(state.status)&&Object.hasOwn(BUSINESS_NATIVE_SCREENS,state.screenId);}
export function applyBusinessNative(catalog){
 Object.assign(catalog.assets,Object.fromEntries(Object.entries(BUSINESS_UI_ASSETS).filter(([,a])=>a.mimeType==='image/svg+xml')));
 for(const [id,kind] of Object.entries(BUSINESS_NATIVE_SCREENS)){
  const screen=catalog.tasks[id.split('.').slice(0,2).join('.')].screens[id];
  screen.assetId=original.screens[id]?.canvas??'kdw.business-ui.'+kind;screen.annotations=[];
  // DOM components own hit testing. Retain command IDs/outcomes for replay.
  for(const action of screen.actions){action.placement='below-screen';delete action.rect;}
 }
 catalog.kdwBusinessNative=2;return catalog;
}
