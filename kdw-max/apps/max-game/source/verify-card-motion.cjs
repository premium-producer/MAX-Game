const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path');
const {createPortableServer}=require('../launcher/portable-server.cjs');
const root=path.resolve(__dirname,'..'),report=path.resolve(root,'../../docs/verification-card-motion-20261022');
fs.mkdirSync(report,{recursive:true});app.setPath('userData',path.join(report,'test-runtime'));app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),errors=[];let w,server;const js=s=>w.webContents.executeJavaScript(s);
async function wait(s){for(let i=0;i<1000;i++){if(await js(s))return;await delay(40);}throw Error('Timeout '+s);}
app.whenReady().then(async()=>{try{
 server=createPortableServer({root,config:{id:'card-motion',version:'test',port:18913,entry:'/'}});await server.listen();
 w=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 w.webContents.on('console-message',(_e,d)=>{if(d.level==='error')errors.push(d.message);});
 await w.loadURL(server.origin+'/webgl-v5/cafe-original.html?backend=local&view=game&interaction=posts&test=memory');await wait("document.querySelector('#kdw-posts')?.dataset.ready==='true'");
 const sample=await js(`new Promise(resolve=>{const frames=[];let start=null;function frame(t){start??=t;frames.push({t,phone:document.querySelector('.task-media-canvas').getBoundingClientRect().right,cards:[...document.querySelectorAll('.kdw-falling-post[data-flow-entry=admitted]')].map(n=>{const r=n.getBoundingClientRect();return{id:n.dataset.spawn,x:r.x,y:r.y,w:r.width}})});if(t-start<7000)requestAnimationFrame(frame);else resolve(frames)}requestAnimationFrame(frame)})`);
 const previous=new Map(),jumps=[];let maxX=0,backward=0,maxDt=0,maxVelocityChange=0;
 for(const f of sample)for(const c of f.cards){const p=previous.get(c.id);let v=null;if(p){const dx=c.x-p.x,dy=c.y-p.y,dt=f.t-p.t;v=dy/dt;if(p.v!==null)maxVelocityChange=Math.max(maxVelocityChange,Math.abs(v-p.v));maxX=Math.max(maxX,Math.abs(dx));maxDt=Math.max(maxDt,dt);if(dy<-.1)backward++;if(Math.abs(dx)>2||dy<-.1||p.v!==null&&Math.abs(v-p.v)>.035)jumps.push({id:c.id,dx,dy,dt,v,priorV:p.v});}previous.set(c.id,{...c,t:f.t,v});}
 const tag=process.argv.includes('--after')?'after':'before';fs.writeFileSync(path.join(report,tag+'.json'),JSON.stringify({frames:sample.length,maxX,backward,maxDt,maxVelocityChange,jumps:jumps.slice(0,30),hint:await js("document.querySelector('[data-post-hint]')?.textContent"),errors},null,2));
 fs.writeFileSync(path.join(report,tag+'.png'),(await w.webContents.capturePage()).toPNG());w.destroy();await server.close();app.exit(0);
}catch(e){fs.writeFileSync(path.join(report,'failure.json'),JSON.stringify({error:e.stack,errors}));if(w)w.destroy();await server?.close();app.exit(1);}});setTimeout(()=>app.exit(2),120000);
