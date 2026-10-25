const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-unmasked-flights-20261020/posts');fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[],checks=[];let w,server;
const js=s=>w.webContents.executeJavaScript(s),shot=async name=>fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());
async function wait(s,ms=40000){for(let i=0;i<ms/25;i++){if(await js(s))return;await delay(25);}throw Error('Timeout '+s);}
async function click(selector){await wait(`!!document.querySelector(${JSON.stringify(selector)})`);const r=await js(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON()`),p={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await delay(25);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});}
setTimeout(()=>app.exit(2),180000);
app.whenReady().then(async()=>{
 server=createPortableServer({root,config:{id:'posts-landing',version:'test',port:18884,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,partition:'post-landing-'+Date.now()}});
 w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message);});
 await w.loadURL('http://127.0.0.1:18884/webgl-v5/client.html?backend=local&view=game&test=memory');
 await wait("document.documentElement.dataset.idleMenuReady==='kdw-local-standby'");await click('[data-idle-mission="business"]');
 await wait("document.querySelector('.journey-zone')?.dataset.revealPhase==='task'");await click('[data-skip-task]');
 for(let i=0;i<10;i++){
  await wait("document.querySelector('.journey-zone')?.dataset.revealPhase==='task'&&Number(document.querySelector('.journey-zone').dataset.contentPresence??1)>.99&&document.querySelector('.journey-zone').dataset.contentPhase==='idle'&&[...document.querySelectorAll('.route-phone [data-answer]')].some(e=>!e.disabled&&e.dataset.screenId===document.documentElement.dataset.kdwScreen)");
  const screen=await js('document.documentElement.dataset.kdwScreen');if(screen==='business.channel.publish')break;
  await js("document.querySelector('.route-phone [data-answer]:not(:disabled)').click()");await wait(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(screen)}`);
 }
 assert.equal(await js('document.documentElement.dataset.kdwScreen'),'business.channel.publish');await shot('before-posts');
 await js(`window.__postFrames=[];window.__samplePosts=true;function sample(){if(!window.__samplePosts)return;const r=document.querySelector('#kdw-posts'),p=r?.querySelector('.kdw-post-phone'),c=document.querySelector('.route-phone .task-media-canvas'),f=r?.querySelector('.kdw-post-feed');if(r&&!r.hidden&&p){window.__postFrames.push({aligned:p.dataset.activityAligned,phone:p.getBoundingClientRect().toJSON(),target:c?.getBoundingClientRect().toJSON(),visible:getComputedStyle(p).visibility,flights:[...r.querySelectorAll('.kdw-product-flight')].map(e=>({docked:!!e.dataset.docked,parent:e.parentElement.className,position:getComputedStyle(e).position,box:e.getBoundingClientRect().toJSON(),mask:e.parentElement.style.clipPath})),feed:f?.getBoundingClientRect().toJSON()});}requestAnimationFrame(sample)}requestAnimationFrame(sample);`);
 await js("document.querySelector('.route-phone [data-answer]:not(:disabled)').click()");await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");await delay(500);await shot('posts-entered');
 checks.push('normal screenshot-to-posts transition reaches active native feed');
 for(let i=0;i<6;i++){
  const selector="[...document.querySelectorAll('[data-spawn]')].find(b=>!b.disabled&&getComputedStyle(b).visibility!=='hidden'&&b.getBoundingClientRect().top>70&&b.getBoundingClientRect().bottom<innerHeight-40"+(i%2===0?"&&['spam','promise','unrelated'].includes(b.dataset.post)":"")+")";
  await wait(`!!(${selector})`);const id=await js(`(${selector}).dataset.spawn`);
  const state=await js(`(()=>{const b=document.querySelector('[data-spawn="${id}"]'),r=b.querySelector('.kdw-fall-photo').getBoundingClientRect();b.click();const f=document.querySelector('#kdw-posts .kdw-product-flight:last-child')||[...document.querySelectorAll('#kdw-posts .kdw-product-flight')].at(-1);return {present:!!f,source:getComputedStyle(b).visibility,opacity:f&&getComputedStyle(f).opacity}})()`);
  assert.ok(state.present&&state.source==='hidden'&&state.opacity==='1');
  await wait(`!!document.querySelector('[data-published="${id}"]')`);
  if(i===0){await delay(200);await shot('post-flight');}
  await wait(`!!document.querySelector('[data-published="${id}"][data-landing]')`,3000);
  if(i>=2){
   const follow=await js(`(()=>{const f=document.querySelector('#kdw-posts .kdw-product-flight[data-docked]'),s=document.querySelector('.kdw-post-feed');if(!f)return null;const a=f.getBoundingClientRect(),old=s.scrollTop;s.scrollTop=Math.max(0,old-100);const b=f.getBoundingClientRect();return {parent:f.parentElement===s,actual:a.top-b.top,expected:(s.scrollTop-old)*s.getBoundingClientRect().width/s.offsetWidth}})()`);
   assert.ok(follow?.parent&&Math.abs(follow.actual-follow.expected)<1);await shot('post-scrolled-'+i);
  }
  await wait("!document.querySelector('#kdw-posts .kdw-product-flight')",3000);await delay(100);
 }
 checks.push('six accepted posts: immediate opaque handoff, native masked landing and synchronous scroll during reveal');
 const pair="[...document.querySelectorAll('[data-spawn]')].filter(b=>!b.disabled&&getComputedStyle(b).visibility!=='hidden'&&b.getBoundingClientRect().top>70&&b.getBoundingClientRect().bottom<innerHeight-40)";
 await wait(pair+'.length>=2');
 const burst=await js(`(()=>{const buttons=${pair}.slice(0,2);buttons.forEach(b=>b.click());return {ids:buttons.map(b=>b.dataset.spawn),flights:document.querySelectorAll('#kdw-posts .kdw-product-flight').length}})()`);
 assert.equal(burst.flights,2);await delay(180);await shot('burst-flight');
 await wait("!document.querySelector('#kdw-posts .kdw-product-flight')",4000);
 for(const id of burst.ids)assert.ok(await js(`!!document.querySelector('[data-published="${id}"]')`));
 checks.push('two concurrent selections complete without losing a post or leaving a flight overlay');
 await js('window.__samplePosts=false');const frames=await js('window.__postFrames');fs.writeFileSync(path.join(report,'frames.json'),JSON.stringify(frames));
 assert.ok(frames.length>50);assert.ok(frames.every(f=>f.visible==='hidden'||f.aligned==='true'&&Math.abs(f.phone.left-f.target.left)<2&&Math.abs(f.phone.width-f.target.width)<2&&Math.abs(f.phone.top-f.target.top)<2&&Math.abs(f.phone.height-f.target.height)<2),'no unaligned or oversized native phone');
 const incoming=frames.flatMap(f=>f.flights).filter(x=>!x.docked);assert.ok(incoming.length>5);assert.ok(incoming.every(x=>x.position==='fixed'&&!x.mask),'all incoming frames remain unmasked');assert.ok(frames.some(f=>f.flights.some(x=>x.docked&&x.parent==='kdw-post-feed'&&x.position==='absolute')));
 checks.push('all visible entry frames align with device; incoming posts remain unmasked and dock inside feed');
 await shot('filled-feed');assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors},null,2));w.destroy();await server.close();app.exit(0);
}).catch(async e=>{fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,checks,errors},null,2));if(w){await shot('failure');fs.writeFileSync(path.join(report,'failure.html'),await js('document.documentElement.outerHTML'));w.destroy();}await server?.close();app.exit(1);});
