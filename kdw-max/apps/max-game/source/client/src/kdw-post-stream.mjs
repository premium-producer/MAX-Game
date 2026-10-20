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
