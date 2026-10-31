import assets from './kdw-conversation-assets.json' with {type:'json'};
import highQuality from './kdw-hq-screen-assets.json' with {type:'json'};
export function applyHighQualityScreens(catalog){
 for(const [id,assetId]of Object.entries(highQuality.screens)){
  const screen=catalog.tasks[id.split('.').slice(0,2).join('.')].screens[id],before=catalog.assets[screen.assetId],asset=highQuality.assets[assetId];
  (catalog.kdwHighQualitySources??={})[before.path]=asset.path;
  screen.actions=screen.actions.map(action=>{
   if(!action.rect)return action;
   const rect=action.rect.map((v,i)=>v*(i%2?asset.height/before.height:asset.width/before.width));
   rect[2]=Math.min(rect[2],asset.width-rect[0]);rect[3]=Math.min(rect[3],asset.height-rect[1]);
   return {...action,rect};
  });
  catalog.assets[assetId]=asset;screen.assetId=assetId;
 }
 return catalog;
}

// Keep a fixed, bounded high-resolution raster while the device animates.
// No intermediate animation frame creates a new size/cache key.
export function highQualityRasterScale(width,height,padding=0){
 return Math.min(1440/Math.max(1,width+padding*2),3200/Math.max(1,height+padding*2));
}
export const CONVERSATION_SCREENS=Object.freeze({
 'communication.call.connected':1,'communication.call.result':2,
 'communication.message.video-stop':3,'communication.message.video-preview':4,'communication.message.video-sent':5,
 'communication.story.start':6,'communication.story.ready':7,
});
export function applyConversationScreens(catalog){
 Object.assign(catalog.assets,assets);
 for(const [screenId,number] of Object.entries(CONVERSATION_SCREENS)){
  const taskId=screenId.split('.').slice(0,2).join('.'),screen=catalog.tasks[taskId].screens[screenId],before=catalog.assets[screen.assetId],asset=assets[`kdw.conversation.screen-${number}`];
  screen.actions=screen.actions.map(a=>{
   if(!a.rect)return a;
   const rect=a.rect.map((v,i)=>v*(i%2?asset.height/before.height:asset.width/before.width));
   // Avoid floating-point overshoot when an authored hotspot touches the edge.
   rect[2]=Math.min(rect[2],asset.width-rect[0]);rect[3]=Math.min(rect[3],asset.height-rect[1]);
   return {...a,rect};
  });
  screen.assetId=asset.assetId;
 }
 return catalog;
}
