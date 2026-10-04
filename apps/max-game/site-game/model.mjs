import {REVEAL_TIMING,revealTracePresence} from './site-reveal-motion.mjs';
import {siteMenuMissions} from './client-review.mjs';

export const missions=siteMenuMissions;
export const SAVE_KEY='max-site-game:v1';
export const SCENE={width:1600,height:900};
// SCREEN_RIGHT physical pixels and the measured single-zone/LiDAR UX band.
export const WALL_SCENE=Object.freeze({width:4096,height:1280});
export const WALL_GAME=Object.freeze({left:2264,right:4024,top:192,bottom:1216});
export const WALL_MOVE=Object.freeze({left:0,right:WALL_SCENE.width,top:WALL_GAME.top,bottom:WALL_GAME.bottom});
export const WALL_INPUT=Object.freeze({left:2264,right:4024,top:615,bottom:1020});
export const WALL_ROUTE=Object.freeze({centerX:3070,centerY:815,firstActionX:2744,spacing:400});
export function wallLinePositions(count){
 return Array.from({length:count},(_,i)=>WALL_ROUTE.firstActionX+(i-1)*WALL_ROUTE.spacing);
}
export function clampNodeToField(x,y,field,width=240,height=230){
 const halfW=width/2,halfH=height/2;
 return {x:Math.max(field.left+halfW,Math.min(field.right-halfW,x)),y:Math.max(field.top+halfH,Math.min(field.bottom-halfH,y))};
}
export function planPhoneInsertion(base,activeIndex,field=WALL_GAME,deviceWidth=370,{manualIndices=[],side:fixedSide}={}){
 const center=(field.left+field.right)/2,manual=new Set(manualIndices);
 const positions=base.map(p=>({...p})),shiftedIndices=[];
 if(deviceWidth>370){
  const active=positions[activeIndex].x,side=fixedSide??(field.right-active-120>=deviceWidth+500?'right':'left');
  const left=side==='right'?Math.max(center-deviceWidth/2,active+152):Math.min(center-deviceWidth/2,active-152-deviceWidth);
  const shift=deviceWidth+72;
  for(let i=0;i<positions.length;i++)if(!manual.has(i)&&((side==='right'&&i>activeIndex)||(side==='left'&&i<activeIndex))){positions[i].x+=side==='right'?shift:-shift;shiftedIndices.push(i);}
  return {side,left,positions,displacedIndex:shiftedIndices[0]??null,shiftedIndices};
 }
 const left=center-deviceWidth/2;
 // The phone occupies the former third slot; only the suffix moves one slot right.
 for(let i=2;i<positions.length;i++)if(!manual.has(i)){
  positions[i].x+=WALL_ROUTE.spacing;
  shiftedIndices.push(i);
 }
 const side=fixedSide??(positions[activeIndex].x<=center?'right':'left');
 return {side,left,positions,displacedIndex:shiftedIndices[0]??null,shiftedIndices};
}
export function translatePhonePlan(plan,{x=0}={}){
 return {...plan,left:plan.left+x,positions:plan.positions.map(p=>({x:p.x+x,y:p.y}))};
}
export const SITE_ROUTE_MOTION=Object.freeze({phoneFollowOmega:16,idleOmega:4,idleX:6,idleY:4});
export function routeIdleOffset(time,index){
 return {x:Math.sin(time*.83+index*1.7)*SITE_ROUTE_MOTION.idleX,y:Math.sin(time*.71+index*2.3)*SITE_ROUTE_MOTION.idleY};
}
export function clampPhonePose(left,centerY,width,height,scene=WALL_SCENE){
 return {left:Math.max(0,Math.min(scene.width-width,left)),centerY:Math.max(height/2,Math.min(scene.height-height/2,centerY))};
}
export function phoneFiberPorts(icon,device,side){
 return Array.from({length:PHONE_FIBER_COUNT},(_,i)=>{const fraction=.1+i*.2;return {start:{x:side==='right'?icon.x+icon.w:icon.x,y:icon.y+icon.h*fraction},end:{x:side==='right'?device.x:device.x+device.w,y:device.y+device.h*fraction}};});
}
export const ROUTE_LINK_STAGGER=.2;
export const visibleRouteLinkCount=(completedStep,total)=>Math.max(0,Math.min(total,completedStep+1));
export const PHONE_FIBER_COUNT=5;
export const PHONE_FIBER_STAGGER=.05;
export const PHONE_FIBER_DURATION=REVEAL_TIMING.trace-(PHONE_FIBER_COUNT-1)*PHONE_FIBER_STAGGER;
export function phoneFiberReveal(elapsed,index,reduced=false){
 if(reduced)return 1;
 return revealTracePresence((elapsed-index*PHONE_FIBER_STAGGER)/PHONE_FIBER_DURATION);
}
export function fitScene(width,height,scene=SCENE){const scale=Math.min(Math.max(0,width)/scene.width,Math.max(0,height)/scene.height);return {scale,x:(width-scene.width*scale)/2,y:(height-scene.height*scale)/2};}
export class Hold {
 constructor(){this.cancel();}
 down(id,now){if(this.owner!==null)return false;this.owner=id;this.start=now;return true;}
 release(id){if(id===this.owner)this.cancel();}
 cancel(){this.owner=null;this.start=0;}
 progress(now){return this.owner===null?0:Math.min(1,Math.max(0,(now-this.start)/800));}
}
export function restore(raw){try{const p=JSON.parse(raw);if(p?.version!==1||!missions.some(m=>m.id===p.mission)||p.scanned!==true)return null;const result={mission:p.mission,scanned:true};if(['wall','standard'].includes(p.layout)&&p.positions&&typeof p.positions==='object'){result.layout=p.layout;result.positions=Object.fromEntries(Object.entries(p.positions).filter(([key,value])=>/^\d+$/.test(key)&&Number.isFinite(value?.x)&&Number.isFinite(value?.y)).map(([key,value])=>[key,{x:value.x,y:value.y}]));if(p.layout==='wall'&&Number.isFinite(p.phoneShift?.x)&&Number.isFinite(p.phoneShift?.y))result.phoneShift={x:p.phoneShift.x,y:p.phoneShift.y};}return result;}catch{return null;}}
