const COMPACT_STREAM=Object.freeze({minGap:300,maxGap:600,travel:14000,sideLimit:4,columnHeadway:4200,columns:2});
const LEGACY_STREAM=Object.freeze({...COMPACT_STREAM,minGap:850,maxGap:1650,columns:3});
export const POST_STREAM=Object.freeze({...COMPACT_STREAM,minGap:600,maxGap:1200,minTravel:10000,maxTravel:18000,columnHeadway:0});
export const postStreamRules=posts=>posts.version>=5?POST_STREAM:posts.version>=4?COMPACT_STREAM:LEGACY_STREAM;
const random=(seed,index,salt)=>{
 let x=(seed^Math.imul(index+1,0x9e3779b1)^Math.imul(salt+1,0x85ebca6b))>>>0;
 x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);
 return ((x^(x>>>16))>>>0)/4294967296;
};

// Authoritative event schedule, independent of frames, viewport and Math.random.
// Accepted publication times release capacity; merely pressing a card does not.
export function createPostTimeline(posts,bank){
 if(posts.version>=10){
  // Double the whole conveyor clock, including refill, to preserve density.
  // Persisted elapsed times and the mission timer remain real milliseconds.
  const timeline=createFreeTimeline({...posts,published:posts.published.map(r=>({...r,elapsedMs:r.elapsedMs*2}))},bank);
  const project=r=>({...r,start:r.start/2,travel:r.travel/2,velocity:r.velocity*2});
  return {spawn:index=>project(timeline.spawn(index)),at:elapsed=>timeline.at(elapsed*2).map(project)};
 }
 if(posts.version>=9)return createFreeTimeline(posts,bank);
 if(posts.version>=8)return createLaneTimeline(posts,bank);
 if(posts.version>=7)return createDenseTimeline(posts,bank);
 const rules=postStreamRules(posts);
 const selected=new Map(posts.published.map(row=>[row.index,row.elapsedMs]));
 const columns=Array.from({length:2},()=>Array(rules.columns).fill(-Infinity));
 const history=[];let active=[],lastLane=-1,streak=0;
 const end=row=>Math.min(row.start+row.travel,selected.get(row.index)??Infinity);
 function next(){
  const index=history.length,gap=rules.minGap+Math.floor(random(posts.seed,index,0)*(rules.maxGap-rules.minGap+1));
  const proposed=index?history.at(-1).start+gap:0,candidates=[];
  for(let lane=posts.version>=6?1:0;lane<2;lane++){
   const live=active.filter(row=>row.lane===lane&&end(row)>proposed);
   const capacity=live.length>=rules.sideLimit?Math.min(...live.map(end)):proposed;
   for(let column=0;column<rules.columns;column++)candidates.push({lane,column,start:Math.max(proposed,capacity,columns[lane][column]+rules.columnHeadway)});
  }
  const earliest=Math.min(...candidates.map(row=>row.start));
  let choices=candidates.filter(row=>row.start===earliest);
  // A close follower in the other column makes neighbouring cards visible
  // together. Only prefer an equally early slot; never wait just to form a pair.
  if(posts.version>=4&&streak===1&&choices.some(row=>row.lane===lastLane))choices=choices.filter(row=>row.lane===lastLane);
  if(streak>=2&&choices.some(row=>row.lane!==lastLane))choices=choices.filter(row=>row.lane!==lastLane);
  const place=choices[Math.floor(random(posts.seed,index,1)*choices.length)];
  active=active.filter(row=>end(row)>place.start);
  const available=bank.filter(post=>!active.some(row=>row.post.id===post.id)&&history.at(-1)?.post.id!==post.id);
  const pool=available.length?available:bank.filter(post=>history.at(-1)?.post.id!==post.id);
  const post=pool[Math.floor(random(posts.seed,index,2)*pool.length)];
  const row={index,spawnId:`${posts.runId}.${index}`,post,...place,
   size:.76+random(posts.seed,index,3)*.24,offset:.1+random(posts.seed,index,4)*.8,
   travel:posts.version>=5?rules.minTravel+Math.floor(random(posts.seed,index,5)*(rules.maxTravel-rules.minTravel+1)):rules.travel};
  columns[row.lane][row.column]=row.start;
  streak=row.lane===lastLane?streak+1:1;lastLane=row.lane;
  history.push(row);active.push(row);return row;
 }
 return {
  spawn(index){while(history.length<=index)next();return history[index];},
  at(elapsed){
   while(!history.length||history.at(-1).start<=elapsed)next();
   // At most eight live cards plus the next scheduled arrival. Historical rows
   // are kept for deterministic lookup, never mounted as DOM or GPU objects.
   return history.slice(-Math.ceil((rules.maxTravel??rules.travel)/rules.minGap)-2).filter(row=>row.start<=elapsed&&end(row)>elapsed)
    .map(row=>({...row,progress:(elapsed-row.start)/row.travel}));
  },
 };
}

// v9: admission/selection remain authoritative and viewport-independent.
// Horizontal trajectory planning belongs to the shared presentation geometry.
export const FREE_FLOW=Object.freeze({limit:10,initial:8,minTravel:12500,maxTravel:18500,envelope:600,maxHeight:.25});
function createFreeTimeline(posts,bank){
 const selected=new Map(posts.published.map(r=>[r.index,r.elapsedMs]));
 const history=[];let active=[],last=0;
 const end=r=>Math.min(r.start+r.travel,selected.get(r.index)??Infinity);
 function make(start,progress=0){
  const index=history.length,travel=FREE_FLOW.minTravel+random(posts.seed,index,5)*(FREE_FLOW.maxTravel-FREE_FLOW.minTravel);
  // With ten places and six products repeats are necessary. Prefer the least
  // represented content, never immediately repeat the preceding admission.
  const choices=bank.filter(p=>bank.length===1||p.id!==history.at(-1)?.post.id);
  const count=p=>active.filter(r=>r.post.id===p.id).length,min=Math.min(...choices.map(count));
  const pool=choices.filter(p=>count(p)===min);
  const row={index,spawnId:`${posts.runId}.${index}`,post:pool[Math.floor(random(posts.seed,index,2)*pool.length)],
   lane:1,flow:'free',start:start-progress*travel,travel,size:.82+random(posts.seed,index,3)*.18,
   offset:random(posts.seed,index,4),velocity:1/travel};
  history.push(row);active.push(row);return row;
 }
 // v11 starts empty. Legacy schedules retain their prefilled positions so
 // already accepted choices still replay against the same spawn IDs/times.
 const cold=posts.version>=11;
 if(!cold)for(let i=0;i<FREE_FLOW.initial;i++)make(0,.10+i*.10);
 function next(){
  active=active.filter(r=>end(r)>last);
  const filling=cold&&history.length<FREE_FLOW.limit;
  const gap=!filling&&active.length<8?220+random(posts.seed,history.length,6)*260:850+random(posts.seed,history.length,6)*500;
  let start=last+gap;
  if(active.length>=FREE_FLOW.limit)start=Math.max(start,Math.min(...active.map(end))+180);
  active=active.filter(r=>end(r)>start);last=start;return make(start);
 }
 return {
  spawn(index){while(history.length<=index)next();return {...history[index]};},
  at(elapsed){
   while(last<=elapsed)next();
   return history.filter(r=>r.start<=elapsed&&end(r)>elapsed)
    .map(r=>({...r,progress:(elapsed-r.start)/r.travel}));
  },
 };
}

// v8: independent, non-overtaking lanes. Geometry reserves a 600-unit card
// envelope; projection caps it at 32% of the viewport height. A .48 headway
// therefore leaves positive clearance throughout the fall, including resize.
export const LANE_FLOW=Object.freeze({step:32,headway:.48,envelope:600,maxHeight:.32});
function createLaneTimeline(posts,bank){
 const selected=new Map(posts.published.map(r=>[r.index,r.elapsedMs]));
 let time,active,history,lanes,lastAdmission;
 function make(column,progress,start){
  const index=history.length,liveIds=new Set(active.map(r=>r.post.id));
  const available=bank.filter(p=>!liveIds.has(p.id)&&history.at(-1)?.post.id!==p.id);
  const pool=available.length?available:bank.filter(p=>history.at(-1)?.post.id!==p.id);
  const row={index,spawnId:`${posts.runId}.${index}`,post:pool[Math.floor(random(posts.seed,index,2)*pool.length)],
   lane:1,column,start,progress,flow:'lanes',size:.88+random(posts.seed,index,3)*.12,
   offset:.15+random(posts.seed,index,4)*.7,travel:1/lanes[column].base};
  active.push(row);history.push({...row});lastAdmission=time;
 }
 function reset(){
  time=0;active=[];history=[];lastAdmission=-Infinity;
  const base=(.078+random(posts.seed,0,21)*.012)/1000;
  lanes=[0,1].map(()=>({base,velocity:base,readyAt:0}));
  make(0,.68,-8000);make(1,.91,-11000);make(0,.20,-2400);make(1,.43,-5100);
 }
 reset();
 function tick(){
  time+=LANE_FLOW.step;
  for(const row of active)row.progress+=lanes[row.column].velocity*LANE_FLOW.step;
  const removed=active.filter(r=>r.progress>=1||(selected.get(r.index)??Infinity)<=time);
  for(const row of removed)lanes[row.column].readyAt=time+128;
  active=active.filter(r=>!removed.includes(r));
  // Oldest vacancy first, and stagger simultaneous vacancies across lanes.
  for(const column of [0,1].sort((a,b)=>lanes[a].readyAt-lanes[b].readyAt)){
   const live=active.filter(r=>r.column===column);
   if(live.length<2&&time>=lanes[column].readyAt&&time-lastAdmission>=160&&
      live.every(r=>r.progress>=LANE_FLOW.headway))make(column,0,time);
  }
  const groups=[0,1].map(column=>active.filter(r=>r.column===column));
  // Keep the two streams half a slot apart. This is a bounded tempo change
  // of the whole lane, never a per-card push or a positional correction.
  const phase=groups.map(rows=>rows.length?Math.min(...rows.map(r=>r.progress))%LANE_FLOW.headway:0);
  const phaseError=((phase[0]+LANE_FLOW.headway/2-phase[1]+LANE_FLOW.headway*1.5)%LANE_FLOW.headway)-LANE_FLOW.headway/2;
  const correction=groups.every(rows=>rows.length===2)?Math.max(-.018,Math.min(.018,phaseError*.18))/1000:0;
  for(let column=0;column<2;column++){
   const lane=lanes[column],count=active.filter(r=>r.column===column).length;
   // A depleted lane catches up smoothly; every object shares its velocity,
   // so it cannot catch/overlap its predecessor. Never couple separate lanes.
   const desired=count<2?.18/1000:lane.base+(column===1?correction:0);
   lane.velocity+=(desired-lane.velocity)*(1-Math.exp(-LANE_FLOW.step/420));
  }
 }
 return {
  spawn(index){while(history.length<=index)tick();return {...history[index]};},
  at(elapsed){
   if(elapsed<time)reset();
   const target=Math.floor(Math.max(0,elapsed)/LANE_FLOW.step)*LANE_FLOW.step;
   while(time<target)tick();
   return active.filter(r=>(selected.get(r.index)??Infinity)>elapsed)
    .map(r=>({...r,progress:r.progress+lanes[r.column].velocity*(elapsed-time)})).filter(r=>r.progress<1);
  },
 };
}

// v7: a deterministic conveyor with density feedback. The renderer and authority
// replay identical 32 ms steps; frame rate and viewport never affect admission.
function createDenseTimeline(posts,bank){
 const stepMs=32,selected=new Map(posts.published.map(r=>[r.index,r.elapsedMs]));
 let time=0,nextAt=0,active=[],history=[];
 const make=(start,progress=0)=>{
  const index=history.length,liveIds=new Set(active.map(r=>r.post.id));
  const available=bank.filter(p=>!liveIds.has(p.id)&&history.at(-1)?.post.id!==p.id);
  const pool=available.length?available:bank.filter(p=>history.at(-1)?.post.id!==p.id);
  const counts=[0,1].map(c=>active.filter(r=>r.column===c).length);
  const column=counts[0]===counts[1]?Math.floor(random(posts.seed,index,1)*2):counts[0]<counts[1]?0:1;
  const travel=10000+Math.floor(random(posts.seed,index,5)*8001);
  const row={index,spawnId:posts.runId+'.'+index,post:pool[Math.floor(random(posts.seed,index,2)*pool.length)],lane:1,column,start,travel,
   size:.76+random(posts.seed,index,3)*.24,offset:.1+random(posts.seed,index,4)*.8,progress,velocity:1/travel};
  active.push(row);history.push({...row});return row;
 };
 const reset=()=>{time=0;nextAt=0;active=[];history=[];
  // Enter an already populated conveyor, instead of waiting a full fall for it
  // to fill. Staggered initial positions are revealed with the activity itself.
  for(let i=0;i<4;i++)make(-(3-i)*3400,.81-i*.245);
 };
 reset();
 function tick(){
  time+=stepMs;
  for(const row of active)row.progress+=row.velocity*stepMs;
  const removed=active.filter(r=>r.progress>=1||(selected.get(r.index)??Infinity)<=time);
  if(removed.length){const wasFull=active.length===4;active=active.filter(r=>!removed.includes(r));const refill=time+120+Math.floor(random(posts.seed,history.length,6)*141);nextAt=wasFull?refill:Math.min(nextAt,refill);}
  if(active.length<4&&time>=nextAt){make(time);nextAt=time+160+Math.floor(random(posts.seed,history.length,7)*161);}
  const ordered=[...active].sort((a,b)=>a.progress-b.progress);
  for(let i=0;i<ordered.length;i++){
   const row=ordered[i],ahead=ordered[(i+1)%ordered.length],gap=ordered.length===1?1:ahead.progress+(i===ordered.length-1?1:0)-row.progress;
   const desired=Math.max(.035,Math.min(.48,1000/row.travel+.7*(gap-.25)))/1000;
   row.nextVelocity=row.velocity+(desired-row.velocity)*(1-Math.exp(-stepMs/240));
  }
  for(const row of active){row.velocity=row.nextVelocity;delete row.nextVelocity;}
 }
 return {
  spawn(index){while(history.length<=index)tick();const {velocity,...row}=history[index];return {...row};},
  at(elapsed){
   if(elapsed<time)reset();
   const target=Math.floor(Math.max(0,elapsed)/stepMs)*stepMs;while(time<target)tick();
   return active.filter(r=>(selected.get(r.index)??Infinity)>elapsed&&r.progress<1).map(r=>{const {velocity,...row}=r;return {...row,progress:Math.min(1,r.progress+velocity*(elapsed-time))};});
  },
 };
}
