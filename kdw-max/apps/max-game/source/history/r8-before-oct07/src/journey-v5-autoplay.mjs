import graphlib from '@dagrejs/graphlib';
import {assertMissionCatalog} from '../vendor/backend-figma-v2/src/contracts/mission-catalog.mjs';
import {deepFreeze} from '../vendor/backend-figma-v2/src/contracts/mission-command.mjs';
import {missionViewKey,presentationAllowsPoll} from './bfm-mission-screen.mjs';

export const V5_AUTOPLAY_MS=500;
const preferred={
 'blogger.channel.privacy':'channel.choose-public',
 'blogger.channel.public-confirm':'channel.use-new-link',
};

// A separate local demonstration catalog. The reviewed source and manual saves
// retain their IDs/revision; only the isolated demo authority consumes this copy.
export function createV5AutomaticCatalog(base){
 const catalog=structuredClone(base);
 catalog.contentRevision=`${base.contentRevision}.autoplay500.v1`;
 for(const task of Object.values(catalog.tasks)){
  const route=new graphlib.Graph({directed:true});
  for(const screen of Object.values(task.screens)){
   if(screen.missing)throw Error(`AUTOPLAY_MISSING_SCREEN: ${screen.screenId}`);
   const action=preferred[screen.screenId]
    ?screen.actions.find(a=>a.actionId===preferred[screen.screenId])
    :screen.actions.find(a=>['navigate','complete-task','choose-tool'].includes(a.outcome.kind)&&a.outcome.screenId!==screen.screenId);
   if(!action)throw Error(`AUTOPLAY_ACTION_UNAVAILABLE: ${screen.screenId}`);
   // Keep alternative actions for the original graph's reachability contract.
   screen.actions=[action,...screen.actions.filter(a=>a!==action)];
   screen.automaticMs=V5_AUTOPLAY_MS;
   route.setNode(screen.screenId);
   if(action.outcome.kind==='navigate')route.setEdge(screen.screenId,action.outcome.screenId);
  }
  if(!graphlib.alg.isAcyclic(route))throw Error(`AUTOPLAY_ROUTE_CYCLE: ${task.taskId}`);
 }
 return deepFreeze(assertMissionCatalog(catalog));
}

// Uses the existing BFM presentation gate and WebGL frame clock. No timeout,
// independent scheduler, speculative completion or renderer-authored answer.
export class V5AutoplayPresentation{
 constructor(){this.key=null;this.visibleMs=0;this.ready=false;this.active=false;}
 update(snapshot,dt,{ready=false,active=false}={}){
  const key=snapshot?missionViewKey(snapshot.state):null;
  if(key!==this.key){this.key=key;this.visibleMs=0;this.ready=false;}
  if(active&&ready&&this.ready)this.visibleMs+=Math.max(0,Math.min(.05,dt))*1000;
  if(!ready)this.visibleMs=0;
  this.ready=ready;this.active=active;
 }
 allows(snapshot){
  return this.active&&this.key===missionViewKey(snapshot.state)&&presentationAllowsPoll(snapshot,{ready:this.ready,visibleMs:this.visibleMs});
 }
}

export function v5AutoplayUrl(href,missionId){
 const url=new URL(href);
 url.searchParams.delete('session');
 if(missionId){url.searchParams.set('backend','local');url.searchParams.set('autoplay',missionId);}
 else url.searchParams.delete('autoplay');
 return url.href;
}

export function v5MissionMenuEntries(missions,{automaticCopies=false}={}){
 const manual=missions.map(m=>({...m,automatic:false}));
 return automaticCopies?[...manual,...missions.map(m=>({...m,automatic:true,title:`${m.title} — автопрохождение`,description:'Автоматически · 0,5 секунды на экран'}))]:manual;
}
