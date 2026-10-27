import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export function analyzeMotion(log){
 const q=(a,p)=>{const s=[...a].sort((a,b)=>a-b);return s[Math.max(0,Math.ceil(s.length*p)-1)]??0;};
 const times=[],cards=new Map(),velocities=[],anomalies=[],flightSteps=[];let previous=null,duplicateFrames=0,backward=0,horizontalJumps=0,maxHorizontal=0,maxVelocityChange=0,pairs=0;
 const scale=log.viewport.width/3072,flights=new Map();
 for(const frame of log.samples){
  if(previous&&frame.id===previous.id){duplicateFrames++;continue;}
  const time=frame.frameTime??frame.t;if(previous)times.push(time-(previous.frameTime??previous.t));
  if(frame.interactive&&frame.visible){
   for(const c of frame.cards){const old=cards.get(c.id),inside=c.y+c.h>0&&c.y<log.viewport.height;
    if(old&&old.frameId===previous?.id&&inside){const dt=time-old.time;if(dt>0){const dx=(c.x-old.x)/scale,dy=(c.y-old.y)/scale,v=dy/dt;maxHorizontal=Math.max(maxHorizontal,Math.abs(dx));pairs++;
     if(dy<-.25){backward++;anomalies.push({type:'backward',id:c.id,dt,dy});}
     if(Math.abs(dx)>2){horizontalJumps++;anomalies.push({type:'horizontal-jump',id:c.id,dt,dx});}
     if(old.v!==undefined){const change=Math.abs(v-old.v);maxVelocityChange=Math.max(maxVelocityChange,change);velocities.push(change);if(change>.035)anomalies.push({type:'velocity-change',id:c.id,dt,change});}
     cards.set(c.id,{...c,time,frameId:frame.id,v});continue;
    }}cards.set(c.id,{...c,time,frameId:frame.id});
   }
   for(const f of frame.flightPoses??[]){const old=flights.get(f.id);if(old&&old.phase===f.phase&&old.frameId===previous?.id)flightSteps.push({id:f.id,phase:f.phase,dt:time-old.time,px:Math.hypot(f.x-old.x,f.y-old.y)/scale});flights.set(f.id,{...f,time,frameId:frame.id});}
  }else cards.clear();previous=frame;
 }
 const median=q(times,.5),activeLongTasks=log.longTasks.filter(t=>t.at>=log.start&&t.at<=log.end);
 const result={tag:log.tag,kind:log.kind,viewport:log.viewport,gpu:log.gpu,samples:log.samples.length,uniqueFrames:times.length+1,duplicateFrames,durationMs:log.end-log.start,frameMs:{median,p95:q(times,.95),p99:q(times,.99),max:Math.max(0,...times),over25:times.filter(t=>t>25).length,over50:times.filter(t=>t>50).length},motion:{pairs,backward,horizontalJumps,maxHorizontalPxAt3072:maxHorizontal,velocityChangeP99:q(velocities,.99),maxVelocityChange,anomalies:anomalies.slice(0,40),flightSamples:flightSteps.length,maxFlightStepPxAt3072:Math.max(0,...flightSteps.map(s=>s.px))},longTasks:activeLongTasks,visibility:log.visibility,errors:log.errors,metrics:log.metrics,exactFrameTimes:log.samples.every(f=>Number.isFinite(f.frameTime))};
 result.passed=times.length>100&&log.samples.every(f=>f.visible)&&log.errors.length===0&&backward===0&&horizontalJumps===0&&anomalies.length===0&&q(times,.95)<=median*1.2+1&&times.filter(t=>t>50).length===0;
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const dir=process.argv[2]||'docs/verification-activity-webgl-iab-20261028';const results=fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='motion-summary.json').map(f=>JSON.parse(fs.readFileSync(path.join(dir,f)))).filter(l=>Array.isArray(l.samples)).map(analyzeMotion);fs.writeFileSync(path.join(dir,'motion-summary.json'),JSON.stringify(results,null,2));for(const r of results)console.log(JSON.stringify({tag:r.tag,passed:r.passed,frame:r.frameMs,motion:r.motion,errors:r.errors.length,exactFrameTimes:r.exactFrameTimes}));}
