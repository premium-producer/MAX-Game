import {V5_MOTION} from './journey-v5-motion-profile.mjs';
import {V5MotionValue} from './journey-v5-inertia.mjs';

// Orchestration only. maath (V5MotionValue) owns the fade on the existing frame
// clock; backend commands own mission selection/restart. No timer or second RAF.
export class V5MissionContinuation{
 constructor({commit,reveal,done,error}){Object.assign(this,{commit,reveal,done,error});this.opacity=new V5MotionValue(1);this.phase='idle';this.epoch=0;}
 get active(){return this.phase!=='idle';}
 start(){if(this.active)return false;this.phase='leaving';this.epoch++;return true;}
 tick(dt,{active=true,reduced=false}={}){
  if(!active||!this.active)return;
  if(this.phase==='committing')return;
  const leaving=this.phase==='leaving',goal=leaving?0:1;
  this.opacity.step(goal,Math.min(.05,Math.max(0,dt)),V5_MOTION.presenceOmega,reduced);
  if(!this.opacity.at(goal,V5_MOTION.presenceDistance,V5_MOTION.presenceSpeed))return;
  this.opacity.value=goal;this.opacity.velocity=0;
  if(!leaving){this.phase='idle';this.done();return;}
  this.phase='committing';const epoch=this.epoch;
  Promise.resolve().then(()=>{if(epoch===this.epoch)return this.commit();}).then(()=>{
   if(epoch!==this.epoch)return;this.reveal();this.phase='entering';
  }).catch(error=>{if(epoch!==this.epoch)return;this.error(error);this.phase='entering';});
 }
 cancel(){this.epoch++;this.phase='idle';}
}

export function nextV5Mission(content,missionId){
 const index=content.missions.findIndex(m=>m.id===missionId);
 return index<0?null:content.missions[index+1]?.id??null;
}

export async function continueV5Mission(session,content,expected){
 const s=session.snapshot?.state;
 if(!s||s.runId!==expected.runId||s.missionId!==expected.missionId||!['completed','incomplete'].includes(s.status))throw Error('STALE_MISSION_CONTINUATION');
 const id=nextV5Mission(content,s.missionId);
 let result=await session.command(id?'SELECT_MISSION':'RETURN_MENU',id?{missionId:id}:{});
 if(!result?.reply.ok)throw Error('MISSION_CONTINUATION_REJECTED');
 // A previously visited next mission must also start at the activation hand.
 // Restart only that next mission, never clear the completed mission or profile.
 if(id&&session.snapshot.state.status!=='scan'){
  result=await session.restart();if(!result?.reply.ok)throw Error('MISSION_ACTIVATION_REJECTED');
 }
}
