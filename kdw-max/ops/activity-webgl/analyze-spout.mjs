import fs from 'node:fs';
const file=process.argv[2],log=JSON.parse(fs.readFileSync(file,'utf8'));
const q=(a,p)=>[...a].sort((a,b)=>a-b)[Math.max(0,Math.ceil(a.length*p)-1)]??null;
const results={started:log.started,ended:log.ended,errors:log.errors,processes:log.processes,scenarios:{},input:{samples:log.samples.length,active:log.samples.filter(s=>s.active).length,bound:log.samples.filter(s=>s.lidar?.bound).length,ports:[...new Set(log.samples.map(s=>s.lidar?.port))],packetCounts:[log.samples[0]?.lidar?.packetCount,log.samples.at(-1)?.lidar?.packetCount],boots:[...new Set(log.samples.map(s=>s.boot))]}};
for(const [kind,capture] of Object.entries(log.captures)){
 const rows=(capture.csv??'').trim().split(/\r?\n/).slice(1).map(l=>l.split(',').map(Number));
 const frames=log.samples.filter(s=>s.ui?.activity?.kind===kind).map(s=>s.ui.activity),unique=[...new Map(frames.map(s=>[s.frameId,s])).values()];
 results.scenarios[kind]={completed:capture.summary?.completed,content:capture.content,metricsSamples:unique.length,webgl:unique.length>0&&unique.every(s=>s.backend==='webgl'),rendererP95Max:q(unique.map(s=>s.frame.p95),1),rendererP99Max:q(unique.map(s=>s.frame.p99),1),cpuUpdateP95Max:q(unique.map(s=>s.update.p95),1),maxPublished:q(unique.map(s=>s.published),1),channels:[0,1].map(channel=>{
  const all=rows.filter(r=>r[1]===channel),steady=all.filter(r=>r[0]>=5000),intervals=steady.slice(1).map((r,i)=>r[0]-steady[i][0]);
  return {channel,frames:all.length,steadyFrames:steady.length,observedFps:steady.length>1?1000*(steady.length-1)/(steady.at(-1)[0]-steady[0][0]):null,intervalMs:{p50:q(intervals,.5),p95:q(intervals,.95),p99:q(intervals,.99),max:q(intervals,1),over50:intervals.filter(v=>v>50).length},senderFrameGaps:steady.slice(1).reduce((n,r,i)=>n+Math.max(0,r[2]-steady[i][2]-1),0)};
 })};
}
fs.writeFileSync(file.replace('.json','-summary.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
