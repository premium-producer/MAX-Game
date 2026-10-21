const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-personal-field-20261020');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
let w,fixture,server;const errors=[],checks=[],delay=ms=>new Promise(r=>setTimeout(r,ms)),js=s=>w.webContents.executeJavaScript(s);
const testedBuild=JSON.parse(fs.readFileSync(path.join(root,'www/webgl-v5/r9-build.json')));
async function wait(s){for(let i=0;i<500;i++){if(await js(s))return;await delay(100);}throw Error('Timeout '+s);}
async function click(s){await wait(`(()=>{const e=document.querySelector(${JSON.stringify(s)});return e&&!e.disabled&&!e.closest('[inert]')})()`);const r=await js(`document.querySelector(${JSON.stringify(s)}).getBoundingClientRect().toJSON()`),p={x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...p});w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...p});await delay(120);}
const action=id=>click(`[data-pc-action="${id}"]`);
const screen=id=>wait(`document.documentElement.dataset.kdwScreen===${JSON.stringify(id)}&&!!document.querySelector('.pc-phone')&&!document.querySelector('.pc-phone').inert`);
const field=(id,v)=>js(`(()=>{const e=document.querySelector('[data-pc-field="${id}"]');e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
async function fieldStyle(id){return js(`(()=>{const e=document.querySelector('[data-pc-field="${id}"]'),s=getComputedStyle(e),r=e.getBoundingClientRect(),p=document.querySelector('.pc-phone').getBoundingClientRect(),scale=p.width/360;return {rect:{x:(r.x-p.x)/scale,y:(r.y-p.y)/scale,width:r.width/scale,height:r.height/scale},background:s.backgroundColor,border:s.borderWidth,outline:s.outlineWidth,shadow:s.boxShadow,appearance:s.appearance}})()`);}
async function noFocusChange(id){const before=await fieldStyle(id);await click(`[data-pc-field="${id}"]`);const after=await fieldStyle(id);assert.deepEqual({...after,rect:null},{...before,rect:null});for(const k of Object.keys(after.rect))assert.ok(Math.abs(after.rect[k]-before.rect[k])<.02,'Field geometry changed: '+k);assert.equal(after.border,'0px');assert.equal(after.outline,'0px');assert.equal(after.shadow,'none');await click('[data-pc-key="dismiss"]');checks.push({field:id,focusStable:true,style:after});}
async function fixtureField(n){
 const html=await js("document.querySelector('.pc-phone').outerHTML");
 fixture=new BrowserWindow({width:360,height:800,useContentSize:true,show:false,webPreferences:{offscreen:true,sandbox:true}});
 await fixture.loadURL('about:blank');await fixture.webContents.insertCSS(fs.readFileSync(path.join(root,'www/webgl-v5/kdw-interactions.css'),'utf8')+' .pc-phone{left:0!important;top:0!important;height:800px!important;transform:none!important;opacity:1!important} body{margin:0;background:#17181c}');
 await fixture.webContents.executeJavaScript(`document.head.insertAdjacentHTML('beforeend','<base href="http://127.0.0.1:18784/">');document.body.innerHTML=${JSON.stringify('<section id="kdw-personal-channel">'+html+'</section>')};document.querySelector('.pc-phone').inert=false;document.querySelector('.pc-phone').dataset.reference=${JSON.stringify(String(n))};document.querySelector('.pc-reference').src='assets/kdw-native/personal-channel/screens/screen_${n}.png';Promise.all([...document.images].map(i=>i.decode()))`);
 const captures=[];
 for(const focus of [false,true]){
  await fixture.webContents.executeJavaScript(`(()=>{const e=document.querySelector('[data-pc-field=slug]');e.value='my_channel';${focus?'e.focus()':'e.blur()'};})()`);await delay(80);
  const image=await fixture.webContents.capturePage({x:0,y:0,width:360,height:800}),pixels=image.toBitmap(),rgb=n===7?[77,78,97]:[57,58,64];let sampled=0,bad=0;
  // Compare the editor's whole perimeter with its surrounding original flat fill.
  // A one-pixel focus stroke or a mismatched rectangular background fails this.
  for(let y=351;y<398;y++)for(let x=88;x<303;x++){if(x>=90&&x<299&&y>=354&&y<395)continue;const i=(y*360+x)*4;if(rgb.some((v,k)=>pixels[i+2-k]!==v))bad++;sampled++;}
  fs.writeFileSync(path.join(report,`link-${n}-${focus?'focused':'blurred'}.png`),image.toPNG());assert.equal(bad,0,'Editor perimeter differs from original capsule');captures.push({focus,sampled,bad});
 }
 checks.push({reference:n,backgroundSeamless:true,captures});fixture.destroy();fixture=null;
}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'personal-field',version:'test',port:18784,entry:'/'},onMissing:u=>errors.push(u)});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});w.webContents.on('console-message',e=>{if(e.level===3||e.level==='error')errors.push(e.message)});
 await w.loadURL('http://127.0.0.1:18784/webgl-v5/client.html?backend=local&view=game');await click('[data-idle-mission="blogger"]');await screen('blogger.channel.chats');await action('channel.open-create-menu');await screen('blogger.channel.menu');await action('channel.choose-create');await screen('blogger.channel.name');
 await noFocusChange('name');await noFocusChange('description');await field('name','Мой канал');await field('description','Описание');await action('pc.create');await screen('blogger.channel.privacy');await action('channel.choose-public');await screen('blogger.channel.public-confirm');await action('channel.use-new-link');await screen('blogger.channel.public-link');
 await noFocusChange('slug');assert.equal((await fieldStyle('slug')).background,'rgb(77, 78, 97)');await click('[data-pc-field="slug"]');await click('[data-pc-key="m"]');assert.equal(await js("document.querySelector('[data-pc-field=slug]').value"),'m');await click('[data-pc-key="dismiss"]');
 await fixtureField(7);await fixtureField(8);await field('slug','my_channel');await action('pc.link');await screen('blogger.channel.subscribers');checks.push({keyboardAndSave:true});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(report,'checks.json'),JSON.stringify({passed:true,checks,errors,testedBuild},null,2));w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,checks,errors},null,2));fixture?.destroy();if(w){fs.writeFileSync(path.join(report,'failure.png'),(await w.webContents.capturePage()).toPNG());w.destroy();}await server?.close();app.exit(1);}});
setTimeout(()=>app.exit(2),180000);
