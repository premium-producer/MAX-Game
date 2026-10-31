import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const output='docs/verification-max-screen-api-20261028';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']});
const origin='http://127.0.0.1:18782',events=[],errors=[];
const abort=new AbortController();
const stream=await fetch(origin+'/__kdw/screen/events',{signal:abort.signal});
const reading=(async()=>{let buffer='';try{for await(const bytes of stream.body){buffer+=new TextDecoder().decode(bytes);let end;while((end=buffer.indexOf('\n\n'))>=0){const chunk=buffer.slice(0,end);buffer=buffer.slice(end+2);const line=chunk.split('\n').find(l=>l.startsWith('data: '));if(line)events.push(JSON.parse(line.slice(6)));}}}catch(e){if(!abort.signal.aborted)throw e;}})();
try{
 const page=await browser.newPage({viewport:{width:1536,height:768},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 const shown=async stage=>{const deadline=Date.now()+60000;let s;while(Date.now()<deadline){s=await(await fetch(origin+'/__kdw/screen/state')).json();if(s.stage===stage&&s.visible&&s.online)return s;await new Promise(r=>setTimeout(r,200));}throw Error('Screen timeout '+stage+': '+JSON.stringify(s));};
 await page.goto(origin+'/webgl-v5/client.html?backend=local&view=pixel-map');
 const menu=await shown('menu');assert.equal(menu.screenId,'max-menu');assert.equal(menu.missionId,null);
 await page.locator('[data-idle-mission="digital-id"]').click({force:true});
 const scan=await shown('scan');assert.equal(scan.missionId,'digital-id');
 const palm=await page.getByRole('button',{name:'Приложи ладонь, чтобы начать',exact:true}).boundingBox();assert.ok(palm);
 await page.mouse.move(palm.x+palm.width/2,palm.y+palm.height/2);await page.mouse.down();await page.waitForTimeout(1200);await page.mouse.up();
 const task=await shown('task');assert.equal(task.missionId,'digital-id');assert.ok(task.taskId);assert.ok(task.screenId);
 assert.ok(events.some(e=>e.presentation==='transitioning'||e.presentation==='loading'));
 const csv=await(await fetch(origin+'/__kdw/screen/state.csv')).text();assert.equal(csv.trim().split('\r\n').length,2);assert.ok(csv.includes('"'+task.screenId+'"'));
 await page.close();await new Promise(r=>setTimeout(r,6500));const stale=await(await fetch(origin+'/__kdw/screen/state')).json();assert.equal(stale.online,false);assert.equal(stale.visible,false);
 assert.deepEqual(errors,[]);fs.writeFileSync(output+'/browser.json',JSON.stringify({passed:true,menu,scan,task,stale,events,errors},null,2));console.log(JSON.stringify({passed:true,screenId:task.screenId,events:events.length}));
}finally{abort.abort();await reading;await browser.close();}
