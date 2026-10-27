// Test-server instrumentation only; never shipped with the application.
(() => {
 const params=new URLSearchParams(location.search),kind=params.get('interaction')==='store'?'store':'posts',tag=params.get('audit')||kind;
 const selector=kind==='posts'?'#kdw-posts':'#kdw-webgl-store';
 const errors=[],longTasks=[],visibility=[],samples=[];let start=null,finished=false,observer;
 const error=(type,value)=>{if(errors.length<100)errors.push({type,at:performance.now(),message:String(value).slice(0,1500)});};
 addEventListener('error',e=>error('error',e.message||e.target?.src),true);addEventListener('unhandledrejection',e=>error('rejection',e.reason?.message||e.reason));
 for(const name of ['error','warn']){const original=console[name];console[name]=(...args)=>{error(name,args.map(a=>a?.message??String(a)).join(' '));original.apply(console,args);};}
 document.addEventListener('visibilitychange',()=>visibility.push({at:performance.now(),state:document.visibilityState}));
 try{observer=new PerformanceObserver(list=>{for(const e of list.getEntries())longTasks.push({at:e.startTime,ms:e.duration});});observer.observe({type:'longtask',buffered:true});}catch{}
 const output=document.createElement('output');output.id='motion-audit-status';output.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99999;background:#16082acc;color:white;padding:6px;font:12px Arial;pointer-events:none';
 document.addEventListener('DOMContentLoaded',()=>{document.body.append(output);output.textContent='Замер: ожидание карточек';});
 async function finish(){finished=true;observer?.disconnect();
  const canvas=document.querySelector('.webgl-canvas'),gl=canvas?.getContext('webgl2'),ext=gl?.getExtension('WEBGL_debug_renderer_info');
  const payload={tag,kind,at:new Date().toISOString(),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},userAgent:navigator.userAgent,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,start,end:performance.now(),samples,longTasks,visibility,errors,metrics:JSON.parse(document.querySelector(selector)?.dataset.activityMetrics??'{}')};
  output.textContent='Замер завершён: '+samples.length+' кадров';
  try{const r=await fetch('/__motion/report/'+encodeURIComponent(tag),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw Error('REPORT_'+r.status);output.textContent+=' · журнал сохранён';}catch(e){output.textContent+=' · '+e.message;}
 }
 function frame(t){if(finished)return;const raw=document.querySelector(selector)?.dataset.activityFrame;
  if(raw){const f=JSON.parse(raw);if(start===null&&f.interactive&&f.cards.some(c=>c.y>0&&c.y<innerHeight))start=t;
   if(start!==null){samples.push({t,frameTime:f.time,elapsed:f.elapsed,visible:!document.hidden,id:f.frameId,interactive:f.interactive,published:f.published,flights:f.flights,flightPoses:f.flightPoses,phone:f.phone,cards:f.cards});output.textContent='Замер плавности: '+Math.min(20,Math.floor((t-start)/1000))+'/20 с';if(t-start>=20000){void finish();return;}}
  }requestAnimationFrame(frame);
 }requestAnimationFrame(frame);
})();
