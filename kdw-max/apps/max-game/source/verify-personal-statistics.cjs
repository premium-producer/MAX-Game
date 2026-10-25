const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-personal-statistics-20261022');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'profile'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
 const server=createPortableServer({root,config:{id:'statistics-check',version:'test',port:18898,entry:'/'}});await server.listen();
 const w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true,backgroundThrottling:false}}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3)errors.push(e.message)});
 const js=s=>w.webContents.executeJavaScript(s);
 async function wait(s){for(let i=0;i<500;i++){if(await js(s))return;await sleep(80)}throw Error('Timeout '+s)}
 async function screen(id){await wait(`document.documentElement.dataset.kdwScreen===${JSON.stringify(id)} && document.querySelector('.pc-phone') && !document.querySelector('.pc-phone').inert && Number(document.querySelector('.pc-phone').style.opacity)>.97`);await sleep(150)}
 async function click(selector){await wait(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return e&&!e.disabled&&!e.closest('[inert]')})()`);const p=await js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await sleep(40);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});await sleep(120)}
 const act=id=>click(`[data-pc-action="${id}"]`);
 const field=(id,value)=>js(`(()=>{const e=document.querySelector('[data-pc-field="${id}"]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
 async function shot(name){await sleep(400);fs.writeFileSync(path.join(report,name+'.png'),(await w.webContents.capturePage()).toPNG());const r=await js("document.querySelector('.pc-phone').getBoundingClientRect().toJSON()");fs.writeFileSync(path.join(report,name+'-phone.png'),(await w.webContents.capturePage({x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)})).resize({height:1200}).toPNG())}
 try{
  await w.loadURL(server.origin+'/webgl-v5/client.html?backend=local&view=game&test=memory');
  await click('[data-idle-mission=blogger]');await wait("Number(document.querySelector('[data-palm]')?.dataset.pathPresence)>.97");
  const p=await js("(()=>{const r=document.querySelector('[data-palm] .tile').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
  w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});await sleep(950);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});
  await screen('blogger.channel.chats');await act('channel.open-create-menu');await screen('blogger.channel.menu');await act('channel.choose-create');await screen('blogger.channel.name');
  const name='Наши фильмы & открытия',description='Обсуждаем кино, делимся находками.\nНовые истории каждую неделю.',slug='film_club_2026';
  await click('[data-pc-avatar="heart"]');await field('name',name);await field('description',description);await act('pc.create');
  await screen('blogger.channel.privacy');await act('channel.choose-public');await screen('blogger.channel.public-confirm');await act('channel.use-new-link');await screen('blogger.channel.public-link');await field('slug',slug);await act('pc.link');
  await screen('blogger.channel.subscribers');await act('channel.skip-invites');await screen('blogger.channel.created');await act('channel.complete');
  await screen('blogger.comments.post');await act('blogger.comments.post.action-1');await screen('blogger.comments.input');await field('reply','Будем смотреть вместе!');await act('pc.send');await screen('blogger.comments.result');await act('blogger.comments.result.continue');await screen('blogger.comments.returned-post');await act('blogger.comments.returned-post.continue');
  await screen('blogger.statistics.menu');
  assert.equal(await js("document.querySelector('[data-channel-name]').textContent"),name);
  assert.equal(await js("document.querySelector('[data-channel-avatar]').dataset.channelAvatar"),'heart');
  assert.ok(await js(`document.querySelector('[data-channel-description]').textContent.startsWith(${JSON.stringify(description)})`));
  assert.equal(await js("document.querySelector('[data-channel-link]').textContent"),'max.ru/'+slug);
  assert.ok(await js("document.querySelector('.pc-reference').src.endsWith('underlay_16.svg')"));
  const descriptionLayout=await js("(()=>{const e=document.querySelector('.pc-stat-description'),s=getComputedStyle(e),more=document.querySelector('[data-pc-action=\"pc.description\"]');return {lines:parseFloat(s.height)/parseFloat(s.lineHeight),bottom:e.offsetTop+e.offsetHeight,footerTop:more.offsetTop}})()");
  assert.equal(descriptionLayout.lines,2);assert.ok(descriptionLayout.bottom<=descriptionLayout.footerTop);
  const underlay=fs.readFileSync(path.join(root,'www/assets/kdw-native/personal-channel/screens/underlay_16.svg'),'utf8');
  for(const dot of ['M98.7499 1620.53','M112.152 1620.53','M124.879 1620.53'])assert.ok(underlay.includes(dot),'Authored ellipsis retained');
  const sourceSvg=fs.readFileSync(path.resolve(root,'../../UI/new_screens/personal_channel/statistic/Профиль.svg'));
  const pixels=await js(`(async()=>{const sources=['data:image/svg+xml;base64,${sourceSvg.toString('base64')}',document.querySelector('.pc-reference').src],canvas=document.createElement('canvas');canvas.width=360;canvas.height=800;const c=canvas.getContext('2d'),data=[];for(const src of sources){const i=new Image();i.src=src;await i.decode();c.clearRect(0,0,360,800);c.drawImage(i,0,0,360,800);data.push(c.getImageData(0,0,360,800).data)}const masks=[[131,63,98,98],[24,172,312,32],[23,358,314,67],[262,678,53,16]];let outside=0,inside=0;for(let y=0;y<800;y++)for(let x=0;x<360;x++){const at=(y*360+x)*4;if(![0,1,2,3].some(k=>Math.abs(data[0][at+k]-data[1][at+k])>1))continue;if(masks.some(([mx,my,mw,mh])=>x>=mx&&x<mx+mw&&y>=my&&y<my+mh))inside++;else outside++}return {outside,inside}})()`);
  assert.equal(pixels.outside,0,JSON.stringify(pixels));assert.ok(pixels.inside>5000);
  await shot('profile');w.setContentSize(1450,900);await sleep(500);await shot('profile-fractional');
  await act('pc.description');await wait("document.querySelector('.pc-stat-description').scrollTop>0");await sleep(400);await shot('profile-description');
  // Use the authored bottom row, not the duplicate external Continue control.
  await click('.pc-bindings [data-pc-action="blogger.statistics.menu.action-1"]');await screen('blogger.statistics.statistics');
  assert.ok(await js("document.querySelector('.pc-reference').src.endsWith('underlay_17.svg')"));await shot('statistics');
  await act('blogger.statistics.statistics.action-1');await wait("document.documentElement.dataset.kdwScreen!=='blogger.statistics.statistics' || document.querySelector('.pc-phone')?.inert");
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,name,description,avatar:'heart',slug,pixels,screens:['blogger.statistics.menu','blogger.statistics.statistics'],errors,build:JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json')))},null,2));
  w.destroy();await server.close();app.exit(0);
 }catch(e){fs.writeFileSync(path.join(report,'error.txt'),e.stack);fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();await server.close();app.exit(1)}
});
