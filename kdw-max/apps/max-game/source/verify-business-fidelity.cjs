const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const sharp=require('./client/node_modules/sharp');
const project=path.resolve(__dirname,'../../..'),pub=path.join(__dirname,'client/public'),report=path.join(project,'docs/verification-business-fidelity-20261021'),registry=require('./client/src/kdw-business-components.json');
app.setPath('userData',path.join(report,'pixel-runtime'));app.on('window-all-closed',()=>{});let w;
function resolved(a){let s=fs.readFileSync(path.join(pub,a.path),'utf8');for(const name of a.dependencies??[])s=s.replaceAll('./'+name,'data:image/'+path.extname(name).slice(1)+';base64,'+fs.readFileSync(path.join(pub,path.dirname(a.path),name)).toString('base64'));return s;}
const src=s=>'data:image/svg+xml;base64,'+Buffer.from(s).toString('base64');
async function capture(html,width,height){const file=path.join(report,'pixel-page.html');fs.writeFileSync(file,`<html><style>html,body{margin:0;background:transparent}img{position:absolute;max-width:none}</style>${html}</html>`);w.setContentSize(width,height);await w.loadFile(file);await w.webContents.executeJavaScript('Promise.all([...document.images].map(i=>i.decode()))');await new Promise(r=>setTimeout(r,350));for(let i=0;i<5;i++){try{return (await w.webContents.capturePage()).toPNG();}catch(e){if(i===4)throw e;await new Promise(r=>setTimeout(r,400));}}}
app.whenReady().then(async()=>{const rows=[];try{w=new BrowserWindow({show:false,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
for(const [id,l]of Object.entries(registry.screens)){
 const full=await capture(`<img width="${l.width}" height="${l.height}" src="${src(fs.readFileSync(path.join(project,'UI/new_screens/busines_no_sort',l.source)))}">`,l.width,l.height);
 const foreground=(l.overlays??[]).filter(c=>!c.assetId.endsWith('verification-bank'));
 const parts=await capture([...l.components,...l.bindings.map(b=>({assetId:b.background,box:b.backgroundBox??b.box})),...foreground].map(c=>`<img width="${c.box[2]}" height="${c.box[3]}" style="left:${c.box[0]}px;top:${c.box[1]}px" src="${src(resolved(registry.assets[c.assetId]))}">`).join(''),l.width,l.height);
 const a=await sharp(full).extract({left:0,top:0,width:l.width,height:l.height}).ensureAlpha().raw().toBuffer(),b=await sharp(parts).extract({left:0,top:0,width:l.width,height:l.height}).ensureAlpha().raw().toBuffer();let sum=0,large=0,count=0,max=0;
 for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++){const inside=([a,c,w,h],pad=0)=>x>=a-pad&&x<a+w+pad&&y>=c-pad&&y<c+h+pad;if(l.bindings.some(b=>inside(b.box,2))&&!foreground.some(c=>inside(c.box)))continue;let diff=0;for(let k=0;k<4;k++){const d=Math.abs(a[(y*l.width+x)*4+k]-b[(y*l.width+x)*4+k]);sum+=d;diff=Math.max(diff,d);}count++;max=Math.max(diff,max);if(diff>3)large++;}
 rows.push({id,mean:sum/(count*4),largeFraction:large/count,max});
 if(['business.platform.login','business.platform.verification','business.channel.create','business.channel.publish','business.bot.result'].includes(id)){fs.writeFileSync(path.join(report,'reference-'+id+'.png'),full);fs.writeFileSync(path.join(report,'static-'+id+'.png'),parts);}
}
const failed=rows.filter(r=>r.mean>.2||r.largeFraction>.003);fs.writeFileSync(path.join(report,'chromium-pixels.json'),JSON.stringify({passed:!failed.length,rows,failed},null,2));console.log(JSON.stringify({screens:rows.length,failed}));app.exit(failed.length?1:0);
}catch(e){console.error(e);app.exit(2);}});
