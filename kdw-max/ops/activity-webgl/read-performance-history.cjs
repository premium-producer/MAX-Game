// Read a copied runtime-logs directory. No connection to or control of the game.
const fs=require('node:fs'),path=require('node:path'),readline=require('node:readline');
async function main(){
 const [directory,from,to]=process.argv.slice(2);if(!directory)throw Error('Usage: node ops/activity-webgl/read-performance-history.cjs <runtime-logs> [from ISO] [to ISO]');
 const start=from?Date.parse(from):-Infinity,end=to?Date.parse(to):Infinity;if(Number.isNaN(start)||Number.isNaN(end))throw Error('Invalid ISO time');
 const files=fs.readdirSync(directory).filter(n=>/^performance\.jsonl(?:\.\d+)?$/.test(n));
 let count=0,slow=0,invalid=0,first=null,last=null;const scenes={},incidents=[];
 for(const file of files){const lines=readline.createInterface({input:fs.createReadStream(path.join(directory,file)),crlfDelay:Infinity});for await(const line of lines){
  let row;try{row=JSON.parse(line);}catch{invalid++;continue;}const time=Date.parse(row.time);if(!Number.isFinite(time)||time<start||time>end)continue;
  count++;if(!first||row.time<first)first=row.time;if(!last||row.time>last)last=row.time;scenes[row.screen??'unknown']=(scenes[row.screen??'unknown']??0)+1;
  if(row.event==='slow-frame'){slow++;incidents.push({time:row.time,screen:row.screen,reasons:row.reasons,uiAgeMs:row.uiAgeMs,rendererMax:row.renderer?.max,timings:Object.fromEntries(Object.entries(row.timings??{}).map(([k,v])=>[k,{max:v.max,p95:v.p95,count:v.count}])),frameAge:row.frameAge,activity:row.activity,dropped:row.dropped});incidents.sort((a,b)=>b.time.localeCompare(a.time));incidents.length=Math.min(incidents.length,30);}
 }}
 console.log(JSON.stringify({files:files.length,count,slow,invalid,first,last,scenes,latestIncidents:incidents},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
