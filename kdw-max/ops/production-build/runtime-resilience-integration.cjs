// Isolated real Electron processes; never runs against production ports or data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=process.cwd(),base=fs.mkdtempSync(path.join(root,'.cache/resilience-integration-'));
const electron=path.join(root,'production/KDW-Stand-20261027-RC4-1/runtime/electron/electron.exe');
const results=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(check,ms=20000){const deadline=Date.now()+ms;let last;while(Date.now()<deadline){try{const value=await check();if(value)return value;}catch(e){last=e;}await sleep(150);}throw last||Error('WAIT_TIMEOUT');}
async function run(name,port){
 const target=path.join(base,name);fs.mkdirSync(target,{recursive:true});fs.cpSync(path.join(root,'apps',name,'launcher'),path.join(target,'launcher'),{recursive:true});fs.symlinkSync(path.join(root,'apps',name,'www'),path.join(target,'www'),'junction');
 const original=JSON.parse(fs.readFileSync(path.join(root,'apps',name,'app.json')));fs.writeFileSync(path.join(target,'app.json'),JSON.stringify({...original,port,production:false,output:process.argv.includes('--spout')&&name==='max-game'?'spout-dual':'window',window:{width:800,height:600},entry:name==='stela'?'/stella/pixels/?voice=off':original.entry}));
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const child=spawn(electron,[path.join(target,'launcher/desktop-main.cjs'),'--serve-only'],{env,windowsHide:true,stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',b=>{stderr=(stderr+b).slice(-4000);});
 const origin='http://127.0.0.1:'+port,superOrigin='http://127.0.0.1:'+(port+100);
 const get=async(url)=>{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});if(!r.ok)throw Error(await r.text());return r.json();};
 const command=async(action)=>{const r=await fetch(superOrigin+'/__kdw/runtime/'+action,{method:'POST',headers:{Origin:superOrigin,'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error(await r.text());return r.json();};
 try{
  let h=await wait(async()=>{const h=await get(origin+'/__kdw/health');return h.runtime?h:null;});assert.notEqual(h.pid,child.pid);assert.equal(h.runtime.supervisorPid,child.pid);const firstApi=h.pid;
  // Start the output through the same coordinator used by the operator UI.
  await command('start-output');const first=await wait(async()=>{const s=await get(superOrigin+'/__kdw/runtime/state'),o=s.output.output;return s.output.status==='ready'&&o?.contentReady&&o.backgroundReady&&(!process.argv.includes('--spout')||o.fresh&&o.frames?.every(n=>n>20))?s:null;},40000);
  let nativeObservation=null;if(process.argv.includes('--spout')){await sleep(3000);const o=(await get(superOrigin+'/__kdw/runtime/state')).output.output;assert(o.fresh);assert(o.frames.every((n,i)=>n>first.output.output.frames[i]));nativeObservation={adapter:o.bridge.adapter,framesBefore:first.output.output.frames,framesAfter:o.frames,badFrames:o.badFrames,fresh:o.fresh};}
  process.kill(first.output.pid);const recovered=await wait(async()=>{const s=await get(superOrigin+'/__kdw/runtime/state');return s.output.pid&&s.output.pid!==first.output.pid&&s.output.status==='ready'?s:null;});
  assert.equal((await get(origin+'/__kdw/health')).pid,firstApi);
  // A dead API is replaced, with the old output owner terminated before a new one starts.
  process.kill(firstApi);h=await wait(async()=>{const h=await get(origin+'/__kdw/health');return h.pid!==firstApi?h:null;});assert.notEqual(h.pid,firstApi);
  let state=await wait(async()=>{const s=await get(superOrigin+'/__kdw/runtime/state');return s.output.pid&&s.output.status==='ready'?s:null;},40000);
  assert.notEqual(state.output.pid,recovered.output.pid);
  const previousApi=h.pid;
  const restart=await fetch(origin+'/__kdw/runtime/restart-api',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});assert.equal(restart.status,200);
  h=await wait(async()=>{const h=await get(origin+'/__kdw/health');return h.pid!==previousApi?h:null;});
  state=await wait(async()=>{const s=await get(superOrigin+'/__kdw/runtime/state');return s.output.pid&&s.output.status==='ready'?s:null;},40000);
  // A genuinely blocked worker cannot answer IPC; the supervisor must kill it and
  // stop retrying at its budget instead of hiding a crash loop.
  fs.writeFileSync(path.join(target,'launcher/display-worker.cjs'),`require('electron').app.whenReady().then(()=>{process.send({runtimeEvent:'output',value:{contentReady:true,backgroundReady:true}});setTimeout(()=>{while(true){}},200);});`);
  process.kill(state.output.pid);
  const degraded=await wait(async()=>{const s=await get(superOrigin+'/__kdw/runtime/state');return s.output.status==='degraded'?s:null;},50000);
  assert.equal(degraded.output.pid,null);assert.equal((await get(origin+'/__kdw/health')).pid,h.pid);
  const diagnostics=await get(superOrigin+'/__kdw/runtime/diagnostics');assert(diagnostics.logs.supervisor.some(row=>row.code==='CHILD_HEARTBEAT_TIMEOUT'));
  const rejected=await fetch(superOrigin+'/__kdw/runtime/restart-output',{method:'POST',headers:{Origin:'http://evil.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(rejected.status,403);
  await command('stop');await wait(()=>child.exitCode!==null,12000);assert.equal(JSON.parse(fs.readFileSync(path.join(target,'data/runtime-desired.json'))).state,'stopped');
  const probe=spawn(electron,[path.join(target,'launcher/desktop-main.cjs'),'--runtime-watchdog'],{env,windowsHide:true,stdio:'ignore'});await wait(()=>probe.exitCode!==null,12000);assert.equal(probe.exitCode,0);
  results.push({app:name,nativeObservation,checks:['separate supervisor and API PIDs','output kill retains API PID','API kill restarts API and replaces output owner','blocked worker recovered with bounded retries and degraded state','API survives output recovery exhaustion','diagnostic bundle contains heartbeat timeout','restart API acknowledges before closing its HTTP server','foreign Origin rejected','intentional Stop is durable and watchdog respects it'],passed:true});
 }catch(e){console.error({name,base,stderr});throw e;}finally{try{await command('stop');}catch{}if(child.exitCode===null)child.kill();}
}
(async()=>{await run('max-game',19252);if(!process.argv.includes('--spout'))await run('stela',19251);fs.mkdirSync('docs/verification-runtime-resilience-20261027',{recursive:true});fs.writeFileSync('docs/verification-runtime-resilience-20261027/'+(process.argv.includes('--spout')?'spout-process-tests.json':'process-tests.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));})().catch(e=>{console.error(e);process.exitCode=1;});
