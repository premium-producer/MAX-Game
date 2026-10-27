// Runs only inside an isolated fixture app, never against the operator's data.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const fixture=path.resolve(process.argv[2]);
process.env.NODE_PATH=path.resolve(__dirname,'../../apps/max-game/source/stand-output/vendor');require('module').Module._initPaths();
const osc=require('osc'),udp=require('node:dgram').createSocket('udp4');
const packet=(address,id,p)=>udp.send(Buffer.from(osc.writePacket({address,args:[{type:'i',value:id},...(p?[p.x/3072,p.y/1536,0,0].map(value=>({type:'f',value})):[])]},{metadata:true})),19001,'127.0.0.1');
require(path.join(fixture,'launcher/desktop-main.cjs'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms=45000){const end=Date.now()+ms;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(100);}throw Error('Timed out');}
app.whenReady().then(async()=>{
 try{
  const stateFile=path.join(fixture,'data/output-state.json');
  const state=await until(()=>{try{const s=JSON.parse(fs.readFileSync(stateFile));return s.pid===process.pid&&s.frames?.every(x=>x>2)&&s;}catch{}});
  assert.equal(state.active,false);assert.equal(state.armed,false);
  const content=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('client.html'));
  assert(content);assert.deepEqual(content.getContentSize(),[3072,1536]);
  await until(()=>content.webContents.executeJavaScript("document.documentElement.dataset.gameReady==='true'"));
  const cold=await content.webContents.executeJavaScript("({state:JSON.parse(render_game_to_text()),active:kdwStandOutput.active(),alpha:getComputedStyle(document.body).backgroundColor})");
  assert.equal(cold.active,false);assert.equal(cold.alpha,'rgba(0, 0, 0, 0)');
  fs.writeFileSync(path.join(fixture,'data/output-arm.json'),JSON.stringify({bootId:state.bootId,armed:true}));
  await until(()=>content.webContents.executeJavaScript('kdwStandOutput.active()'));
  await sleep(4000);
  const warm=await content.webContents.executeJavaScript("JSON.parse(render_game_to_text())");
  assert.equal(warm.status,'menu');
  fs.writeFileSync(path.join(fixture,'data/test-dom.json'),await content.webContents.executeJavaScript("JSON.stringify({buttons:[...document.querySelectorAll('button')].map(b=>({text:b.textContent,data:{...b.dataset}})),state:JSON.parse(render_game_to_text())})"));
  const missionPoint=await content.webContents.executeJavaScript("(()=>{const el=document.querySelector('[data-idle-mission=communication]');const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  packet('/create',101,missionPoint);await sleep(100);packet('/delete',101);
  await until(()=>content.webContents.executeJavaScript("typeof render_game_to_text==='function'&&JSON.parse(render_game_to_text()).phase==='palm'&&!!document.querySelector('[data-palm]')"));
  await sleep(2000);
  const palmPoint=await content.webContents.executeJavaScript("(()=>{const r=document.querySelector('[data-palm]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  packet('/create',102,palmPoint);
  for(let i=0;i<16;i++){await sleep(80);packet('/update',102,palmPoint);}
  packet('/delete',102);
  const task=await until(async()=>{const s=await content.webContents.executeJavaScript("typeof render_game_to_text==='function'?JSON.parse(render_game_to_text()):null");return s?.status==='task'&&s;});
  assert.equal(task.mission,'communication');
  // The real receiver samples after this point; background and content must both render.
  await sleep(12000);
  fs.writeFileSync(path.join(fixture,'data/output-arm.json'),JSON.stringify({bootId:state.bootId,armed:false}));
  await until(()=>content.webContents.executeJavaScript('!kdwStandOutput.active()'));
  const final=JSON.parse(fs.readFileSync(stateFile));
  assert(final.frames[0]>100&&final.frames[1]>100);
  fs.writeFileSync(path.join(fixture,'data/stand-test.json'),JSON.stringify({passed:true,cold,warm,task,final,nativeOscMenuAndPalm:true},null,2));
  udp.close();
  app.quit();
 }catch(error){fs.mkdirSync(path.join(fixture,'data'),{recursive:true});fs.writeFileSync(path.join(fixture,'data/stand-test.json'),JSON.stringify({passed:false,error:error.stack}));app.exit(1);}
});
