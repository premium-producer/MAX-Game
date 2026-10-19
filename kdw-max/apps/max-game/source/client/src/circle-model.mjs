export const WALL={width:4096,height:1280};
// Long planar segment measured from SCREEN_RIGHT POSITION/TEXCOORD_0 in stand.glb.
export const FLAT_SCREEN={left:2192.025,right:4096,top:0,bottom:1280};
// SCREEN_RIGHT Y and finished-floor datum measured from stand.glb, without editing it.
export const SCREEN_METRES=Object.freeze({bottom:.4881106913089752,top:3.0132200717926025,floor:0});
export const heightToPixel=h=>WALL.height*(SCREEN_METRES.top-h)/(SCREEN_METRES.top-SCREEN_METRES.bottom);
export const pixelToHeight=y=>SCREEN_METRES.top-y/WALL.height*(SCREEN_METRES.top-SCREEN_METRES.bottom);
export const INTERACTION_BAND=Object.freeze({top:Math.ceil(heightToPixel(1.8)),bottom:Math.floor(heightToPixel(1))});
// Movable Journey objects have their own wider safe area; screen UX stays above.
export const MOVEMENT_BAND=Object.freeze({top:Math.ceil(heightToPixel(2.2)),bottom:Math.floor(heightToPixel(.8))});
export function journeyFieldBounds(width,height,service=false){
 const padding=18;
 return {x:padding,y:service?MOVEMENT_BAND.top-INTERACTION_BAND.top+padding:padding,
  w:width-padding*2,h:(service?MOVEMENT_BAND.bottom-MOVEMENT_BAND.top:height)-padding*2};
}
// .4 world hit plane at .65 object scale projects to ~84px; reserve 44px per side.
export const NODE_HIT_RADIUS=44;
export function playBounds(index){const c=CIRCLES[index];return {left:c.left+c.w*.14,right:c.left+c.w*.86,top:INTERACTION_BAND.top+194,bottom:INTERACTION_BAND.top+232};}
export function zonesForLayout(mode='two'){
 const rects=mode==='single'?[[2264,192,1760,1024]]:[[2264,272,864,864],[3160,272,864,864]];
 return rects.map(([left,top,w,h],index)=>({index,left,top,w,h,x:left+w/2,y:top+h/2,r:Math.min(w,h)/2}));
}
export let CIRCLES=zonesForLayout();
export function setZoneLayout(mode){CIRCLES=zonesForLayout(mode);return CIRCLES;}
export function zoneContains(index,x,y){const c=CIRCLES[index];return !!c&&x>=c.left&&x<=c.left+c.w&&y>=c.top&&y<=c.top+c.h;}
export function zoneSignalScale(index){return CIRCLES[index].w/1040;}
const worldHeight=18*Math.tan(25*Math.PI/360);
export function pixelToGeo(x,y){return {longitude:(x-WALL.width/2)*worldHeight/WALL.height/.03,latitude:(WALL.height/2-y)*worldHeight/WALL.height/.03,altitude:.08};}
export function geoToPixel(geo){return {x:WALL.width/2+geo.longitude*.03/worldHeight*WALL.height,y:WALL.height/2-geo.latitude*.03/worldHeight*WALL.height};}
export function insideCircle(index,geo){const c=CIRCLES[index],p=geoToPixel(geo);if(!c)return false;const b=playBounds(index);return Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>b.left&&p.x<b.right&&p.y>b.top&&p.y<b.bottom;}
export function newZone(index,mission=null){return {index,mission,placements:[],nextId:1,selected:null,selectedId:null,branch:'channel',complete:false,hold:null,projectionKey:'',revision:0};}
export function placeInZone(zone,type,geo,inventory,now){
 if(zone.complete||!insideCircle(zone.index,geo)||!inventory[type]||zone.placements.filter(p=>p.type===type).length>=inventory[type])return zone;
 return {...zone,nextId:zone.nextId+1,hold:null,selected:null,selectedId:null,placements:[...zone.placements,{id:(zone.index+1)*100000+zone.nextId,type,...geo,droppedAt:now}]};
}
export function moveInZone(zone,id,geo,now){
 if(zone.complete||!insideCircle(zone.index,geo)||!zone.placements.some(p=>p.id===id))return zone;
 return {...zone,hold:null,selectedId:null,placements:zone.placements.map(p=>p.id===id?{...p,...geo,droppedAt:now}:p)};
}
export function removeInZone(zone,id){return {...zone,complete:false,hold:null,selectedId:null,placements:zone.placements.filter(p=>p.id!==id)};}
export function circleMission(source,index){
 const c=CIRCLES[index],mission=structuredClone(source);
 for(const [name,sign] of [['A',-1],['B',1]])mission.endpoints[name]={...mission.endpoints[name],...pixelToGeo(c.x+sign*c.w*.32,INTERACTION_BAND.top+213),size:.65,signalRadius:mission.objectSettings[`endpoint:${name}`].signalRadius*.64*zoneSignalScale(index)};
 mission.connectEndpointsOnComplete=false;
 return mission;
}
// A zone's stable hold is unaffected by changes or drags in the other two zones.
export function updateZoneHold(zone,snapshot,evaluation,now,blocked){
 const key=JSON.stringify(Object.entries(snapshot.nodes).map(([id,n])=>[id,Math.round(n.x*10),Math.round(n.y*10),Math.round(n.radius*10),n.eligible]));
 const changed=zone.projectionKey!==key;
 const revision=zone.revision+(changed?1:0);
 const ready=evaluation.complete&&!blocked&&!snapshot.hidden&&now-snapshot.timestamp<=120;
 const hold=ready?(changed||zone.hold===null?now:zone.hold):null;
 return {...zone,projectionKey:key,revision,hold,complete:zone.complete||Boolean(ready&&now-hold>=300)};
}
