export const IDLE_VIDEO_ASSET='device.custom.tv-first-30s';
export const IDLE_LOGO_WIDTH=600;
export function idleMissionChoices(catalog){
 return Object.values(catalog.missions).map(mission=>{
  const taskId=mission.taskIds[0],task=catalog.tasks[taskId];
  if(!task?.iconAssetId)throw Error('MAX_IDLE_MISSION_ICON_MISSING');
  return {missionId:mission.missionId,taskId,title:mission.title};
 });
}
// Same horizontal centreline and edge gaps as the device row. No phone slot,
// next-task icon or mission state is created by this presentation.
export function idleLayout(count=4,{width=4096,height=1280,videoWidth=1172,videoHeight=672,iconSize=256,margin=64}={}){
 const right=width/2-videoWidth/2-margin;
 const gap=Math.min(400,(right-count*iconSize)/count);
 if(!(gap>0))throw Error('MAX_IDLE_LAYOUT_TOO_SMALL');
 const rowShift=iconSize+gap,centre={x:width/2-rowShift,y:height/2};
 const logoWidth=Math.min(IDLE_LOGO_WIDTH,centre.x-videoWidth/2-gap-margin);
 return {centre,gap,iconSize,rowShift,video:{x:centre.x-videoWidth/2,y:centre.y-videoHeight/2,width:videoWidth,height:videoHeight},
  logo:{x:centre.x-videoWidth/2-gap-logoWidth,y:centre.y-logoWidth*140/440.4539794921875/2,width:logoWidth,height:logoWidth*140/440.4539794921875},
  icons:Array.from({length:count},(_,index)=>({x:centre.x+videoWidth/2+gap+index*(iconSize+gap),y:centre.y-iconSize/2}))};
}
