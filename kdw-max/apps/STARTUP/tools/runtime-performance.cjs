'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {createRuntimeJournal}=require('./runtime-journal.cjs');

// One-second windows, bounded memory, no disk work in paint/IPC callbacks.
function createPerformanceRecorder({root,now=()=>performance.now(),wallNow=Date.now,maxBytes=16*1024*1024,copies=7}){
 const file=path.join(root,'data/runtime-logs/performance.jsonl');
 const clean=createRuntimeJournal({root,role:'performance'}).clean;
 const buckets=new Map();let previous=now(),scene=null,chain=Promise.resolve(),queued=0,dropped=0,writeError=null,size=null,closed=false;
 function observe(name,ms){if(!Number.isFinite(ms)||ms<0)return;let b=buckets.get(name);if(!b){if(buckets.size>=12)return;b={count:0,sum:0,max:0,over25:0,over50:0,values:[]};buckets.set(name,b);}b.count++;b.sum+=ms;b.max=Math.max(b.max,ms);if(ms>25)b.over25++;if(ms>50)b.over50++;if(b.values.length<240)b.values.push(Math.round(ms*100)/100);}
 function enqueue(row){
  if(queued>=8){dropped++;return;}let line;try{
   const safe=clean(row);
   // Preserve bounded numeric frame history; the general journal limits arrays to 24.
   for(const [name,timing]of Object.entries(row.timings??{}))safe.timings[name].intervals=timing.intervals.slice(0,240);
   if(Array.isArray(row.renderer?.intervals))safe.renderer.intervals=row.renderer.intervals.filter(Number.isFinite).slice(0,120);
   line=JSON.stringify(safe)+'\n';
  }catch{return;}queued++;
  chain=chain.then(async()=>{
   await fs.mkdir(path.dirname(file),{recursive:true});
   if(size===null)size=await fs.stat(file).then(s=>s.size,e=>{if(e.code==='ENOENT')return 0;throw e;});
   const bytes=Buffer.byteLength(line);
   if(size+bytes>maxBytes){
    await fs.rm(file+'.'+copies,{force:true});
    for(let i=copies-1;i>=0;i--){const from=i?file+'.'+i:file;try{await fs.rename(from,file+'.'+(i+1));}catch(e){if(e.code!=='ENOENT')throw e;}}
    size=0;
   }
   await fs.appendFile(file,line);size+=bytes;writeError=null;
  }).catch(e=>{writeError=e.code||'LOG_WRITE_FAILED';size=null;}).finally(()=>{queued--;});
 }
 function sample(state,force=false){
  if(closed)return;const at=now(),nextScene=state.ui?.screen??null;
  if(!force&&at-previous<1000&&scene===nextScene)return;
  const timings={};for(const [name,b]of buckets){const sorted=[...b.values].sort((a,b)=>a-b);timings[name]={count:b.count,mean:b.sum/b.count,max:b.max,p95:sorted[Math.floor((sorted.length-1)*.95)]??0,over25:b.over25,over50:b.over50,intervals:b.values};}buckets.clear();
  const reasons=Object.entries(timings).filter(([,v])=>v.max>50).map(([k])=>k);
  if(state.active&&state.frameAge?.some(age=>age===null||age>250))reasons.push('output-stale');
  if(state.ui?.timing?.over50>0)reasons.push('renderer');
  if(state.ui?.timing?.longTasks?.length)reasons.push('long-task');
  const ui=state.ui??{},activity=ui.activity;
  enqueue({time:new Date(wallNow()).toISOString(),pid:process.pid,event:force?'final':reasons.length?'slow-frame':'sample',reasons,windowMs:at-previous,sceneChanged:scene!==nextScene,bootId:state.bootId,screen:nextScene,phase:ui.phase,epoch:state.epoch,active:state.active,ready:state.contentReady,calibrating:state.calibrating,uiAgeMs:Number.isFinite(ui.at)?wallNow()-ui.at:null,frames:state.frames,frameAge:state.frameAge,pending:state.pending,bridge:state.bridge,input:state.input,renderer:ui.timing,activity,timings,dropped,writeError});
  previous=at;scene=nextScene;
 }
 return{observe,sample,status:()=>({queued,dropped,writeError}),flush:()=>chain,async close(state){if(closed)return chain;if(state)sample(state,true);closed=true;await chain;}};
}
module.exports={createPerformanceRecorder};
