const fs=require('node:fs'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
process.env.KDW_MARIONETTE_PORT='2864';
const {Marionette}=require('../verification-20261018/stela-contextual/marionette.cjs');
const dir=__dirname,profile=dir+'/firefox-profile',delay=ms=>new Promise(r=>setTimeout(r,ms));let child,rpc;const report={checks:[]};
(async()=>{try{
 fs.mkdirSync(profile,{recursive:true});fs.writeFileSync(profile+'/user.js','user_pref("marionette.port",2864);');
 child=spawn('C:/Program Files/Mozilla Firefox/firefox.exe',['--headless','--no-remote','--profile',profile,'--marionette'],{windowsHide:true,stdio:'ignore'});
 for(let i=0;i<70;i++){try{rpc=new Marionette();await rpc.connect();break;}catch{rpc?.close();await delay(150);}}
 await rpc.call('WebDriver:NewSession',{});await rpc.call('WebDriver:SetWindowRect',{width:1625,height:950});
 await rpc.call('WebDriver:Navigate',{url:'http://127.0.0.1:18752/webgl-v5/client.html?backend=local&view=game&interaction=store'});
 let ready=false;for(let i=0;i<40;i++){await delay(1000);ready=await rpc.js("return [...document.querySelectorAll('[data-product-spawn]')].some(n=>!n.disabled)");if(ready)break;}
 assert.ok(ready);report.checks.push('actual local Firefox URL starts cards without a click');
 await rpc.js("dispatchEvent(new Event('blur'));return true");await delay(300);
 const read=()=>rpc.js("return [...document.querySelectorAll('[data-product-spawn]')].map(n=>n.style.top)");
 const a=await read();await delay(800);assert.notDeepEqual(await read(),a);report.checks.push('visible window blur does not freeze stream');
 await rpc.js("const b=[...document.querySelectorAll('[data-product-spawn]')].find(n=>!n.disabled);b.click();return true");await delay(250);
 assert.equal(await rpc.js("return getComputedStyle(document.querySelector('.kdw-slot-content')).visibility"),'hidden');report.checks.push('slot hidden during flight');
 await delay(900);assert.equal(await rpc.js("return getComputedStyle(document.querySelector('.kdw-slot-content')).visibility"),'visible');report.checks.push('slot revealed after landing');
 const shot=await rpc.call('WebDriver:TakeScreenshot',{});fs.writeFileSync(dir+'/firefox.png',Buffer.from(shot.value||shot,'base64'));report.passed=true;
 }catch(e){report.error=e.stack;process.exitCode=1;}
 finally{fs.writeFileSync(dir+'/firefox.json',JSON.stringify(report,null,2));try{await rpc?.call('Marionette:Quit',{flags:['eForceQuit']});}catch{}rpc?.close();child?.kill();}
})();
