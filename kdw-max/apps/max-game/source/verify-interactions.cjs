const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const reports=path.resolve(root,'../../docs/'+(process.argv.includes('--native-store')?'verification-native-store-regression-20261018':process.argv.includes('--texts')?'verification-texts-20261018':'verification-global-scale-20261018')+'');fs.mkdirSync(reports,{recursive:true});
app.setPath('userData',path.join(reports,'test-runtime'));
app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('force-device-scale-factor','1');
app.on('window-all-closed',()=>{});
const {createPortableServer}=require('../launcher/portable-server.cjs');
const missing=[],errors=[],checks=[],missionFrames=[];let host,window;
async function waitFor(expression,ms=40000){const end=Date.now()+ms;while(Date.now()<end){if(await window.webContents.executeJavaScript(expression))return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Timeout: '+expression);}
const js=code=>Promise.race([window.webContents.executeJavaScript(code),new Promise((_,reject)=>setTimeout(()=>reject(Error('Renderer script timeout')),5000))]);
const click=selector=>js(`document.querySelector(${JSON.stringify(selector)})?.click()`);
async function beginScaleProbe(){
 await js(`{globalThis.__scaleFrames=[];globalThis.__scaleRecording=true;const sample=()=>{if(!globalThis.__scaleRecording)return;const phone=document.querySelector('.route-phone'),arena=document.querySelector('#arena'),info=document.querySelector('.task-dialog .instruction'),host=document.querySelector('.journey-zone');if(phone)globalThis.__scaleFrames.push({width:arena.style.width,height:arena.style.height,transform:arena.style.transform,screen:document.documentElement.dataset.kdwScreen,phase:host?.dataset.revealPhase,info:!!info&&!info.hidden&&Number(host?.dataset.popupPresence??0)>.05});requestAnimationFrame(sample)};requestAnimationFrame(sample);}`);
}
async function endScaleProbe(label,{startup=false}={}){
 const frames=await js(`globalThis.__scaleRecording=false;globalThis.__scaleFrames`);
 fs.writeFileSync(path.join(reports,'scale-'+label+'.json'),JSON.stringify(frames,null,2));
 assert.ok(frames.length>5,'missing scale samples: '+label);
 assert.equal(new Set(frames.map(f=>f.width+'/'+f.height+'/'+f.transform)).size,1,'scene scale changed inside '+label);
 if(startup){assert.ok(frames.some(f=>!f.info),'no before-copy frame: '+label);assert.ok(frames.some(f=>f.info),'no revealed-copy frame: '+label);}
 checks.push('one scene scale through '+label+(startup?' including copy reveal':''));
}
async function open(kind,width=1280,height=720){
 fs.writeFileSync(path.join(reports,'stage.txt'),'opening '+kind);
 window=new BrowserWindow({width,height,useContentSize:true,show:false,backgroundColor:'#0D001A',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false,offscreen:true}});
 window.webContents.on('console-message',(event,details,message)=>{const row=details&&typeof details==='object'?details:typeof event?.message==='string'?event:{level:details,message};if(row.level===3||row.level==='error')errors.push(row.message);});
 await Promise.race([window.loadURL(host.origin+'/webgl-v5/client.html?backend=local&view=game'+(kind?'&interaction='+kind:'&test=memory')),new Promise((_,reject)=>setTimeout(()=>reject(Error('Page load timeout')),20000))]);
 fs.writeFileSync(path.join(reports,'stage.txt'),'loaded '+kind);
 await waitFor(`document.documentElement.dataset.gameReady==='true'${kind?" && !document.querySelector('#kdw-interactions').hidden":""}`);
 fs.writeFileSync(path.join(reports,'stage.txt'),'ready '+kind);
 if(kind==='channel')await waitFor(`Number(getComputedStyle(document.querySelector('.kdw-scene')).opacity)>.99`);if(kind==='store')await waitFor(`!document.querySelector('.kdw-native-catalog').hidden&&!document.querySelector('.kdw-native-catalog').inert`);
}
app.whenReady().then(async()=>{
 host=createPortableServer({root,config:{id:'kdw-r9-verification',version:'R9-STAND',port:18762,entry:'/'},onMissing:url=>missing.push(url)});await host.listen();
 await open('channel');
 await beginScaleProbe();
 assert.equal(await js(`document.querySelector('[data-object="blogger.comments"]')===null`),true);checks.push('future right-hand icon is not mounted during channel task');
 await waitFor(`!document.querySelector('.kdw-channel-editor').hidden`);
 assert.equal(await js(`document.querySelector('.kdw-keyboard').inert`),true);
 assert.equal(await js(`getComputedStyle(document.querySelector('#world')).visibility`),'visible');
 assert.equal(await js(`document.querySelector('#circles').inert`),false);
 assert.equal(await js(`document.querySelectorAll('#kdw-interactions .kdw-phone,#kdw-interactions .kdw-brand,#kdw-interactions .kdw-instruction,#kdw-interactions .kdw-timer').length`),0);
 const phoneRect=await js(`document.querySelector('.route-phone').getBoundingClientRect().toJSON()`);
 fs.writeFileSync(path.join(reports,'channel-closed.png'),(await window.webContents.capturePage()).toPNG());
 await click('[name=name]');
 await waitFor(`!document.querySelector('.kdw-keyboard').inert && Number(getComputedStyle(document.querySelector('.kdw-keyboard')).opacity)>.99`);
 const openRect=await js(`document.querySelector('.route-phone').getBoundingClientRect().toJSON()`);
 for(const key of ['x','y','width','height'])assert.ok(Math.abs(openRect[key]-phoneRect[key])<1,'phone geometry changed: '+key);
 checks.push('keyboard starts closed; opens over visible original foreground without moving phone or replacing composition');
 assert.equal(await js(`document.querySelector('[data-kdw-submit]').disabled`),true);checks.push('channel empty submit disabled');
 for(const key of ['м','о','й',' ','к','а','н','а','л'])await click(`[data-kdw-key="${key}"]`);
 assert.equal(await js(`document.querySelector('[name=name]').value`),'Мой канал');checks.push('on-screen Cyrillic keyboard enters actual name');
 await click('[data-kdw-key=enter]');for(const key of ['т','е','с','т'])await click(`[data-kdw-key="${key}"]`);
 assert.equal(await js(`document.querySelector('[name=description]').value`),'тест');
 await click('[data-kdw-avatar=heart]');await new Promise(resolve=>setTimeout(resolve,400));
 await new Promise(resolve=>setTimeout(resolve,500));
 fs.writeFileSync(path.join(reports,'channel-layout.json'),JSON.stringify(await js(`({active:document.documentElement.dataset.kdwInteraction,overlayStyle:getComputedStyle(document.querySelector('#kdw-interactions')).cssText,display:getComputedStyle(document.querySelector('#kdw-interactions')).display,zIndex:getComputedStyle(document.querySelector('#kdw-interactions')).zIndex,sceneOpacity:getComputedStyle(document.querySelector('.kdw-scene')).opacity,rect:document.querySelector('.kdw-scene').getBoundingClientRect().toJSON(),sheets:[...document.styleSheets].map(s=>s.href),body:document.body.innerText.slice(-1000)})`),null,2));
 fs.writeFileSync(path.join(reports,'channel.png'),(await window.webContents.capturePage()).toPNG());
 await click('[data-kdw-key=enter]');await waitFor(`getComputedStyle(document.querySelector('.kdw-keyboard')).visibility==='hidden'`);
 await click('[name=name]');await waitFor(`!document.querySelector('.kdw-keyboard').inert`);
 assert.equal(await js(`document.querySelector('[name=name]').value`),'Мой канал');
 await click('[data-kdw-key=dismiss]');await waitFor(`document.querySelector('.kdw-keyboard').inert`);
 checks.push('dismiss and reopen retain typed name and description');
 await click('[data-kdw-submit]');
 await waitFor(`document.documentElement.dataset.kdwScreen==='blogger.channel.privacy'`);checks.push('single Create commits typed data and advances through existing channel flow');
 for(const action of ['channel.continue-private','channel.skip-invites','channel.complete']){
  fs.writeFileSync(path.join(reports,'stage.txt'),'channel action '+action);
  await waitFor(`!!document.querySelector('.route-phone [data-answer="${action}"]:not(:disabled)')`);
  const before=await js(`document.documentElement.dataset.kdwScreen`);
  for(let attempt=0;attempt<16;attempt++){
   await new Promise(resolve=>setTimeout(resolve,300));await click(`.route-phone [data-answer="${action}"]`);
   if(await js(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(before)}`))break;
  }
 }
 await waitFor(`!!document.querySelector('[data-object="blogger.channel"] .v5-completion-check')`);
 assert.equal(await js(`document.querySelector('[data-object="blogger.channel"] [data-node-status]').textContent`),'');
 await new Promise(resolve=>setTimeout(resolve,900));
 fs.writeFileSync(path.join(reports,'completed-channel.png'),(await window.webContents.capturePage()).toPNG());
 checks.push('actual channel completion displays imported vector check instead of legacy status caption');
 await waitFor(`document.documentElement.dataset.kdwScreen?.startsWith('blogger.comments.') && document.querySelector('.journey-zone')?.dataset.revealPhase==='task'`,30000);
 assert.equal(await js(`!!document.querySelector('[data-object="blogger.comments"]')`),true);
 assert.equal(await js(`document.querySelector('[data-object="blogger.statistics"]')===null`),true);
 checks.push('next icon appears after handoff; later future icon remains unmounted');
 await endScaleProbe('channel-screens-and-task-handoff');
 window.destroy();
 await open('store');
 assert.equal(await js(`document.querySelector('.task-dialog .instruction p').textContent`),'Подключим витрину товаров и услуг, чтобы клиенты могли совершать покупки, не выходя из мессенджера');checks.push('native store uses reviewed catalog instruction');
 assert.equal(await js(`document.querySelector('[data-kdw-submit]').disabled`),true);
 await click('[data-kdw-product=brazil]');await click('[data-kdw-product=ethiopia]');
 assert.equal(await js(`document.querySelectorAll('.kdw-slot[data-filled=true]').length`),2);checks.push('product choices fill phone slots');
 await click('[data-kdw-remove="0"]');assert.equal(await js(`document.querySelectorAll('.kdw-slot[data-filled=true]').length`),1);
 await click('[data-kdw-product=colombia]');assert.equal(await js(`document.querySelectorAll('.kdw-slot[data-filled=true]').length`),2);checks.push('product removal and replacement');
 await new Promise(resolve=>setTimeout(resolve,500));fs.writeFileSync(path.join(reports,'store.png'),(await window.webContents.capturePage()).toPNG());
 await click('[data-kdw-submit]');await waitFor(`document.documentElement.dataset.kdwScreen==='business.store.publish'`);checks.push('selection confirmed by real backend command');
 await waitFor(`document.querySelector('[data-kdw-submit]')?.textContent==='Опубликовать витрину' && !document.querySelector('[data-kdw-submit]').disabled && !document.querySelector('.kdw-native-catalog').hidden && !document.querySelector('.kdw-native-catalog').inert`);await click('[data-kdw-submit]');await waitFor(`document.documentElement.dataset.kdwScreen==='business.store.result'`);
 await waitFor(`!document.querySelector('.kdw-native-catalog').hidden&&!document.querySelector('.kdw-native-catalog').inert&&document.querySelector('.task-dialog .instruction p').textContent.startsWith('Задание выполнено, теперь')`);
 assert.equal(await js(`document.querySelector('.task-dialog .instruction p').textContent`),'Задание выполнено, теперь ваши клиенты могут подробнее изучить витрину товаров и услуг.');checks.push('native result uses reviewed text');
 await waitFor(`!document.querySelector('[data-kdw-submit]').disabled`);await click('[data-kdw-submit]');await waitFor(`document.querySelector('.field-success,.v5-mission-qr')!==null`,20000);checks.push('publish and completion use existing gameplay transitions');
 window.destroy();
 const {createKdwCatalog}=await import(require('node:url').pathToFileURL(path.join(root,'source/client/src/kdw-interactions-model.mjs')).href);
 const standCatalog=createKdwCatalog(JSON.parse(fs.readFileSync(path.join(root,'source/client/src/reviewed-content/mission-catalog.json'))));
 for(const mission of Object.values(standCatalog.missions)){
  await open(null,2450,1077);
  await beginScaleProbe();
  await js(`globalThis.__kdwPrematureIcons=[];globalThis.__kdwIconObserver=new MutationObserver(()=>{for(const el of document.querySelectorAll('[data-object]'))if(!${JSON.stringify(['open-max',mission.taskIds[0]])}.includes(el.dataset.object))globalThis.__kdwPrematureIcons.push(el.dataset.object)});globalThis.__kdwIconObserver.observe(document.querySelector('#circles'),{childList:true,subtree:true});`);
  await click(`[data-mission="${mission.missionId}"]`);
  const first=standCatalog.tasks[mission.taskIds[0]].startScreenId;
  await waitFor(`document.documentElement.dataset.kdwScreen===${JSON.stringify(first)} && document.querySelector('.journey-zone')?.dataset.revealPhase==='task'`,50000);
  await js(`globalThis.__kdwIconObserver.disconnect()`);assert.deepEqual(await js(`globalThis.__kdwPrematureIcons`),[]);
  assert.equal(await js(`document.querySelectorAll('[data-palm]').length`),0);
  assert.equal(await js(`document.body.textContent.includes('Удерживай 0,8 секунды')`),false);
  assert.equal(await js(`document.querySelectorAll('link[href*="client.css"]').length`),0);
  assert.match(await js(`document.querySelector('[data-mission-timer]').textContent`),/^\d+:\d{2}$/);
  assert.equal(await js(`getComputedStyle(document.querySelector('[data-mission-timer]')).display`),'flex');
  await waitFor(`(()=>{const [m,s]=document.querySelector('[data-mission-timer]').textContent.split(':').map(Number);return m*60+s<=60&&m*60+s>0})()`,3000);
  await new Promise(resolve=>setTimeout(resolve,900));
  const frame=await js(`(()=>{const arena=document.querySelector('#arena'),scale=arena.getBoundingClientRect().width/parseFloat(arena.style.width),tiles=[...document.querySelectorAll('[data-object] .tile')].map(el=>el.getBoundingClientRect()).sort((a,b)=>a.left-b.left),phone=document.querySelector('.route-phone').getBoundingClientRect();return {width:arena.style.width,height:arena.style.height,transform:arena.style.transform,iconGap:(tiles[1].left-tiles[0].right)/scale,deviceGap:(phone.left-tiles[1].right)/scale}})()`);
  missionFrames.push({missionId:mission.missionId,...frame});
  assert.ok(Math.abs(frame.iconGap-128)<2,'icon gap differs from 128: '+JSON.stringify(frame));
  assert.ok(Math.abs(frame.deviceGap-128)<2,'icon/device gap differs from 128: '+JSON.stringify(frame));
  checks.push('doubled icon/icon and icon/device gaps in '+mission.missionId);
  if(mission.missionId==='business'){
   fs.writeFileSync(path.join(reports,'business-first-copy.png'),(await window.webContents.capturePage()).toPNG());
   for(const screen of Object.values(standCatalog.tasks[mission.taskIds[0]].screens)){
    await waitFor(`document.documentElement.dataset.kdwScreen===${JSON.stringify(screen.screenId)} && document.querySelector('.journey-zone')?.dataset.revealPhase==='task'`);
    const action=screen.actions[0],before=screen.screenId;
    for(let attempt=0;attempt<25;attempt++){
     await new Promise(r=>setTimeout(r,250));await click(`.route-phone [data-answer="${action.actionId}"]`);
     if(await js(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(before)}`))break;
    }
    await waitFor(`document.documentElement.dataset.kdwScreen!==${JSON.stringify(before)}`);
   }
   await waitFor(`document.documentElement.dataset.kdwScreen?.startsWith('business.channel.') && document.querySelector('.journey-zone')?.dataset.revealPhase==='task'`,30000);
   await new Promise(r=>setTimeout(r,900));
   const clipped=await js(`[...document.querySelectorAll('.route-phone .demo-app,.task-dialog .instruction:not([hidden])')].map(el=>el.getBoundingClientRect()).some(r=>r.left< -1||r.right>innerWidth+1||r.top< -1||r.bottom>innerHeight+1)`);
   assert.equal(clipped,false,'business content clipped after handoff');
   fs.writeFileSync(path.join(reports,'business-after-handoff.png'),(await window.webContents.capturePage()).toPNG());
  }
  await endScaleProbe('startup-'+mission.missionId,{startup:true});
  if(mission.missionId==='blogger')for(const [width,height] of [[1280,720],[1920,1080],[2453,1171],[1366,768],[960,720]]){
   window.setContentSize(width,height);await new Promise(resolve=>setTimeout(resolve,1300));
   const layout=await js(`({width:innerWidth,height:innerHeight,items:[...document.querySelectorAll('[data-object] .tile,.route-phone .demo-app,.v5-brand')].map(el=>({kind:el.closest('[data-object]')?.dataset.object??el.className,rect:el.getBoundingClientRect().toJSON()}))})`);
   for(const item of layout.items){const routeIcon=item.kind==='open-max'||standCatalog.tasks[item.kind];assert.ok((routeIcon||item.rect.left>=-1)&&item.rect.right<=width+1&&item.rect.top>=-1&&item.rect.bottom<=height+1,'clipped '+item.kind+' at '+width+'x'+height+': '+JSON.stringify(item.rect));}
   const popup=await js(`(()=>{const el=document.querySelector('.task-dialog .instruction:not([hidden])');if(!el)return null;const r=el.getBoundingClientRect();return r.toJSON()})()`);
   if(popup)assert.ok(popup.left>=-1&&popup.right<=width+1&&popup.bottom<=height+1,'instruction clipped at '+width+'x'+height);
   assert.equal(await js(`document.querySelector('[data-object="blogger.comments"]')===null`),true);
   fs.writeFileSync(path.join(reports,'layout-'+width+'x'+height+'.json'),JSON.stringify({...layout,instruction:popup},null,2));
   fs.writeFileSync(path.join(reports,'layout-'+width+'x'+height+'.png'),(await window.webContents.capturePage()).toPNG());
   checks.push('visible route/device/brand/instruction fit '+width+'x'+height+' with future icon hidden');
  }
  fs.writeFileSync(path.join(reports,'start-'+mission.missionId+'.png'),(await window.webContents.capturePage()).toPNG());
  checks.push('stand '+mission.missionId+' starts without palm UI; installed device timer and first screen verified');window.destroy();
 }
 assert.equal(new Set(missionFrames.map(f=>f.width+'/'+f.height+'/'+f.transform)).size,1,'scale differs between missions at identical viewport');
 fs.writeFileSync(path.join(reports,'common-mission-frames.json'),JSON.stringify(missionFrames,null,2));
 checks.push('all four missions share identical scene dimensions and scale at 2450x1077');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 fs.writeFileSync(path.join(reports,'browser-checks.json'),JSON.stringify({passed:true,bundleSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'www/webgl-v5/app.js'))).digest('hex'),checks,errors,missing},null,2));
 await host.close();app.exit(0);
}).catch(async error=>{fs.writeFileSync(path.join(reports,'browser-checks.json'),JSON.stringify({passed:false,checks,errors,missing,error:error.stack},null,2));if(window&&!window.isDestroyed()){fs.writeFileSync(path.join(reports,'failure.png'),(await window.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(reports,'failure.html'),await window.webContents.executeJavaScript('document.documentElement.outerHTML'));window.destroy();}await host?.close();app.exit(1);});
