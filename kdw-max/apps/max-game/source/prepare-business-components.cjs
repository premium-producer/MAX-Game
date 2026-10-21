// Run with the bundled Electron. SVG geometry comes from Chromium's SVG DOM;
// no guessed glyphs, traced logos, reconstructed static text, or edited originals.
const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const source=__dirname,project=path.resolve(source,'../../..'),input=path.join(project,'UI/new_screens/busines_no_sort'),out=path.join(source,'client/public/assets/kdw-native/business-components');
const report=path.join(project,'docs/verification-business-fidelity-20261021');fs.mkdirSync(report,{recursive:true});fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(report,'extract-runtime'));app.on('window-all-closed',()=>{});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sharp=require('D:/job/production/FUTURONIKA/VK_DigitalProducts/artifacts/max-game/node_modules/sharp');
const screens={
 'business.platform.login':{file:'Вход на платформу.svg',parts:[[0,0,1440,140],[0,140,800,700],[800,140,640,700]]},
 'business.platform.profile':{file:'Frame 2087330771.svg'},
 'business.platform.verification':{file:'Frame 2087330772.svg'},
 'business.platform.ready':{file:'Frame 2087330773.svg'},
 'business.channel.create':{file:'Platform.svg'},
 'business.channel.continue':{file:'Frame 2087330775.svg'},
 'business.channel.open':{file:'1. botStart.svg',phone:true},
 'business.channel.setup':{file:'4. number.svg',phone:true},
 'business.channel.details':{file:'5. confirmRequest.svg',phone:true},
 'business.channel.description':{file:'5. confirmRequest-3.svg',phone:true},
 'business.channel.type':{file:'5. confirmRequest-1.svg',phone:true},
 'business.channel.publish':{file:'5. confirmRequest-2.svg',phone:true},
 'business.bot.create':{file:'Platform.svg'},
 'business.bot.filled':{file:'busines-2.svg'},
 'business.bot.ready':{file:'busines-3.svg'},
 'business.bot.result':{file:'экран.svg',phone:true},
};
// Only these fields may differ from the supplied client interface. Coordinates
// are in the source document, not the game's physical display projection.
const text=(key,box,font=10,options={})=>({key,box,font,color:'#0D0D0D',...options}),photo=box=>({key:'visitor',box,kind:'photo'}),emblem=box=>({key:'logo',box,kind:'logo'});
const bindings={
 'business.platform.profile':[photo([748,22,28,28])],
 'business.platform.verification':[photo([736,22,28,28])],
 'business.channel.create':[photo([618,18,24,24]),text('name',[648,31,66,13],10)],
 'business.channel.continue':[photo([644,20,24,24]),text('name',[674,32,66,13],10)],
 'business.bot.create':[photo([618,18,24,24]),text('name',[648,31,66,13],10)],
 'business.bot.filled':[photo([594,18,23,23]),text('name',[623,29,57,12],9,{opacity:.45}),emblem([39,97,30,30]),text('filename',[76,105,175,15],8),text('name',[38,166,230,14],8),text('botHandle',[38,215,230,15],8),text('description',[38,263,240,25],8,{multiline:true,line:10}),emblem([423,96,38,38]),text('name',[403,137,80,15],10,{align:'center'}),text('botLink',[402,152,82,9],6,{color:'#007AFF',align:'center'}),text('name',[402,218,94,12],8),text('description',[380,282,116,32],7,{multiline:true,line:8})],
 'business.bot.ready':[emblem([187,131,28,28]),text('name',[187,166,150,15],10),text('botHandle',[187,181,160,11],8,{color:'#65707D'}),text('description',[187,194,175,22],8,{multiline:true,line:10})],
 'business.channel.setup':[text('number',[16,593,185,21],16,{color:'#fff',weight:600})],
 'business.channel.type':[text('name',[221,536,68,21],16,{color:'#fff',textWidth:126}),text('channelHandle',[111,625,175,21],16,{color:'#fff'}),text('name',[159,645,129,21],16,{color:'#fff'})],
 'business.channel.publish':[text('name',[221,294,68,21],16,{color:'#fff',textWidth:126}),text('channelHandle',[111,383,175,21],16,{color:'#fff'}),text('name',[159,403,129,21],16,{color:'#fff'})],
 'business.bot.result':[emblem([45,56,40,40]),text('name',[91,59,202,23],18,{color:'#fff',weight:600}),text('orderQuestion',[65,181,244,67],17,{color:'#fff',multiline:true,line:20}),text('deliveryQuestion',[65,380,244,66],17,{color:'#fff',multiline:true,line:20}),text('deliveryAnswer',[15,472,243,80],17,{color:'#fff',multiline:true,line:20})],
};
const actions={
 'business.platform.login':[[1140,35,220,80,'Войти на платформу'],[140,620,200,80,'Подключить']],
 'business.platform.profile':[[317,257,260,51,'Юридическое лицо или ИП'],[317,317,260,51,'Самозанятый']],
 'business.platform.verification':[[312,253,255,50,'Госуслуги'],[312,312,255,50,'Банковские сервисы']],
 'business.channel.create':[[199,229,211,25,'Создать канал']],
 'business.channel.continue':[[359,269,240,45,'Создать новый канал для бизнеса']],
 'business.channel.open':[[6,726,348,43,'Начать']],
 'business.channel.setup':[[6,516,291,40,'Поделиться номером']],
 'business.channel.details':[[6,632,291,40,'Создать канал']],
 'business.channel.description':[[110,728,200,36,'Отправить название канала']],
 'business.channel.type':[[6,674,291,40,'Создать канал']],
 'business.channel.publish':[[6,590,291,40,'Перейти в канал']],
 'business.bot.create':[[476,229,211,25,'Создать чат-бот']],
 'business.bot.filled':[[32,373,257,24,'Создать']],
 'business.bot.ready':[[308,137,54,15,'Настроить']],
 'business.bot.result':[[6,563,275,39,'С 10:00 до 16:00'],[6,603,275,39,'С 16:00 до 22:00'],[6,643,275,39,'Выбрать другой день']],
};
const imageCache=new Map();
async function compact(svg){const matches=[...svg.matchAll(/data:image\/(png|webp);base64,([A-Za-z0-9+/=]+)/g)];for(const m of matches){const key=sha(m[2]);if(!imageCache.has(key)){const bytes=Buffer.from(m[2],'base64'),meta=await sharp(bytes).metadata(),name='raster-'+key.slice(0,24),assetId='kdw.business-component.'+name,ext=m[1];fs.writeFileSync(path.join(out,name+'.'+ext),bytes);assetRecords[assetId]={assetId,path:'assets/kdw-native/business-components/'+name+'.'+ext,width:meta.width,height:meta.height,mimeType:'image/'+ext,sha256:sha(bytes)};imageCache.set(key,'./'+name+'.'+ext);}svg=svg.replaceAll(m[0],imageCache.get(key));}return svg;}
const assetRecords={},layouts={},geometry={};let w;
function put(name,bytes,width,height,origin){const assetId='kdw.business-component.'+name;fs.writeFileSync(path.join(out,name+'.svg'),bytes);const dependencies=[...new Set([...bytes.toString().matchAll(/\.\/raster-[a-f0-9]+\.(?:webp|png)/g)].map(m=>m[0].slice(2)))];assetRecords[assetId]={assetId,path:'assets/kdw-native/business-components/'+name+'.svg',width,height,mimeType:'image/svg+xml',sha256:sha(bytes),origin,...(dependencies.length?{dependencies}: {})};return assetId;}
app.whenReady().then(async()=>{try{
 w=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true}});
 const memo=new Map();
 for(const [id,config] of Object.entries(screens)){
  const bytes=fs.readFileSync(path.join(input,config.file));await w.loadFile(path.join(input,config.file));
  const info=await w.webContents.executeJavaScript(`(()=>{const r=document.documentElement;const inv=r.getCTM().inverse();const rows=[];for(const [i,n]of [...r.querySelectorAll('*')].entries()){if(n.closest('defs,mask,clipPath,filter,pattern,linearGradient,radialGradient,symbol')||!['path','rect','image','use','circle','ellipse','line','polygon','polyline','text'].includes(n.localName))continue;try{let b=n.getBBox(),m=inv.multiply(n.getCTM()),p=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m)),x=Math.min(...p.map(p=>p.x)),y=Math.min(...p.map(p=>p.y)),w=Math.max(...p.map(p=>p.x))-x,h=Math.max(...p.map(p=>p.y))-y;rows.push({index:i,tag:n.localName,box:[x,y,w,h].map(v=>Math.round(v*1000)/1000),fill:n.getAttribute('fill'),opacity:n.getAttribute('opacity')});}catch{}}return {width:r.viewBox.baseVal.width,height:r.viewBox.baseVal.height,rows};})()`);
  geometry[id]={file:config.file,...info};
  const holes=bindings[id]??[],parts=config.parts??(config.phone?[[0,0,info.width,112],[0,112,info.width,info.height-180],[0,info.height-68,info.width,68]]:config.file==='busines-2.svg'?[[0,0,380,info.height],[380,0,190,info.height],[570,0,info.width-570,info.height]]:[[0,0,info.width,72],[0,72,165,info.height-72],[165,72,info.width-165,info.height-72]]);
  const components=[];
  // Adjacent opaque surfaces overlap by one source pixel. Without this guard,
  // fractional device scaling exposes hairline seams between separate images.
  for(const [index,part] of parts.entries()){
   const left=Math.max(0,part[0]-1),top=Math.max(0,part[1]-1),right=Math.min(info.width,part[0]+part[2]+1),bottom=Math.min(info.height,part[1]+part[3]+1),box=[left,top,right-left,bottom-top];
   const request={box,holes:holes.map(b=>b.box),backgroundOnly:false};
   const svg=await compact(await extract(request));const signature=sha(svg),name=memo.get(signature)??id.replaceAll('.','-')+'-'+index;
   if(!memo.has(signature)){put(name,Buffer.from(svg),box[2],box[3],{file:config.file,sha256:sha(bytes),box});memo.set(signature,name);}
   components.push({assetId:'kdw.business-component.'+name,box});
  }
  for(const [index,binding] of holes.entries()){
   const [x,y,w,h]=binding.box,box=[Math.max(0,x-2),Math.max(0,y-2),Math.min(info.width,x+w+2)-Math.max(0,x-2),Math.min(info.height,y+h+2)-Math.max(0,y-2)];
   const svg=await compact(await extract({box,holes:[],backgroundOnly:true}));const name=id.replaceAll('.','-')+'-binding-'+index;
   binding.backgroundBox=box;binding.background=put(name,Buffer.from(svg),box[2],box[3],{file:config.file,sha256:sha(bytes),box,backgroundOnly:true});
  }
  const canvas='canvas-'+id.replaceAll('.','-');put(canvas,Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}"/>`),info.width,info.height,{kind:'transparent-canvas'});
  layouts[id]={width:info.width,height:info.height,source:config.file,components,bindings:holes,actions:actions[id]??[],canvas:'kdw.business-component.'+canvas,forward:id==='business.platform.ready'};
  if(['business.channel.type','business.channel.publish'].includes(id)){
   const y=id==='business.channel.type'?528:286,index=id==='business.channel.type'?47:40;
   const part=async(name,box,mode={})=>{const svg=await compact(await extract({box,holes:[],backgroundOnly:false,...mode}));return {assetId:put(id.replaceAll('.','-')+'-name-'+name,Buffer.from(svg),box[2],box[3],{file:config.file,sha256:sha(bytes),box,...mode}),box};};
   layouts[id].channelName={y,
    shell:[await part('header',[0,0,360,112]),await part('footer',[0,722,360,72])],
    background:await part('wallpaper',[0,112,360,610],{surfaceIndices:[1,3,4]}),
    prefix:await part('prefix',[0,112,360,y-112],{omitIndices:[1,3,4]}),
    tail:await part('tail',[0,y+40,360,722-y-40],{omitIndices:[1,3,4],holes:holes.slice(1).map(b=>b.box)}),
    skin:await part('skin',[211,y,143,40],{surfaceIndices:[index]}),
    meta:await part('meta',[297,y+23,48,12],{foregroundOnly:true}),
   };
  }
  if(id==='business.bot.result'){
   layouts[id].overlays=[];
   for(const [i,box]of [[278,239,49,13],[278,438,49,13],[243,544,29,13]].entries()){
    const svg=await compact(await extract({box,holes:[],backgroundOnly:false})),assetId=put('order-message-meta-'+i,Buffer.from(svg),box[2],box[3],{file:config.file,sha256:sha(bytes),box,reason:'Preserve original time and delivery ticks above variable message text'});
    layouts[id].overlays.push({assetId,box});
   }
   const part=async(name,box,mode={})=>{const svg=await compact(await extract({box,holes:[],backgroundOnly:false,...mode}));return {assetId:put('order-flow-'+name,Buffer.from(svg),box[2],box[3],{file:config.file,sha256:sha(bytes),box,...mode}),box};};
   // Reflow only the variable conversation. All immutable graphics remain
   // original SVG fragments; nine-sliced skins retain authored corner geometry.
   layouts[id].messageFlow={
    shell:[await part('header',[0,0,341,107],{holes:holes.slice(0,2).map(b=>b.box)}),await part('footer',[0,688,341,56])],
    outgoingSkin:await part('outgoing-skin',[55,175,282,83],{surfaceIndices:[120]}),
    incomingSkin:await part('incoming-skin',[6,462,276,100],{surfaceIndices:[144]}),
    outgoingMeta:await part('outgoing-meta',[280,240,45,11],{foregroundOnly:true}),
    incomingMeta:await part('incoming-meta',[244,545,28,11],{foregroundOnly:true}),
    previous:[await part('status-button',[6,106,276,24]),await part('cancel-button',[6,131,276,39])],
    status:await part('status-message',[11,263,263,68]),
    action:await part('action-button',[11,332,263,37]),
    choices:[await part('delivery-0',[6,563,276,40]),await part('delivery-1',[6,603,276,40]),await part('delivery-2',[6,643,276,40])],
   };
  }
 }
 // The new export omits the bank glyph. Recover the exact, previously supplied
 // vector tile (not a redraw) from the game's pinned reviewed source.
 const bankFile=path.join(project,'apps/max-game/www/assets/reviewed-20261004/business-platform-verification-98d2a4483c08.svg'),bankBytes=fs.readFileSync(bankFile),bankBox=[322,322,30,30];
 if(sha(bankBytes)!=='98d2a4483c086caba7159b8497349f5d1b8c58f8aeebf511b842a380f0673274')throw Error('Reviewed bank source changed');
 await w.loadFile(bankFile);const bankSvg=await compact(await extract({box:bankBox,holes:[],backgroundOnly:false}));
 const bankId=put('verification-bank',Buffer.from(bankSvg),30,30,{file:'reviewed-20261004/business-platform-verification-98d2a4483c08.svg',sha256:sha(bankBytes),box:bankBox,reason:'Exact original bank tile omitted by the new export'});
 layouts['business.platform.verification'].overlays=[{assetId:bankId,box:bankBox}];
 fs.writeFileSync(path.join(source,'client/src/kdw-business-components.json'),JSON.stringify({assets:assetRecords,screens:layouts},null,2)+'\n');
 fs.writeFileSync(path.join(report,'source-geometry.json'),JSON.stringify(geometry,null,2));
 console.log(JSON.stringify({screens:Object.keys(layouts).length,components:Object.keys(assetRecords).length,bytes:Object.values(assetRecords).reduce((n,a)=>n+fs.statSync(path.join(source,'client/public',a.path)).size,0)}));w.destroy();app.exit(0);
 }catch(e){console.error(e);w?.destroy();app.exit(1);}});
async function extract(request){return w.webContents.executeJavaScript(`(${extractInPage.toString()})(${JSON.stringify(request)})`);}
function extractInPage({box,holes,backgroundOnly,foregroundOnly=false,surfaceIndices=null,omitIndices=[]}){
 const root=document.documentElement,inv=root.getCTM().inverse(),[x,y,width,height]=box,ns='http://www.w3.org/2000/svg';
 const definitions=new Map([...root.querySelectorAll('[id]')].map(n=>[n.id,n]));
 const definitionTags=new Set(['defs','mask','clipPath','filter','pattern','linearGradient','radialGradient','symbol']);
 const indices=surfaceIndices||omitIndices.length?new Map([...root.querySelectorAll('*')].map((n,i)=>[n,i])):null;
 function bounds(n){try{const b=n.getBBox(),m=inv.multiply(n.getCTM()),p=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));return [Math.min(...p.map(p=>p.x)),Math.min(...p.map(p=>p.y)),Math.max(...p.map(p=>p.x)),Math.max(...p.map(p=>p.y))];}catch{return null;}}
 function copy(n){if(n.nodeType!==1||definitionTags.has(n.localName))return null;const b=bounds(n);
  if(surfaceIndices&&n.localName!=='g'&&!surfaceIndices.includes(indices.get(n)))return null;
  if(omitIndices.length&&omitIndices.includes(indices.get(n)))return null;
  if(backgroundOnly&&n.localName!=='g'&&(!b||b[0]>x+.1||b[1]>y+.1||b[2]<x+width-.1||b[3]<y+height-.1))return null;
  if(foregroundOnly&&n.localName!=='g'&&(!b||b[0]<x||b[1]<y||b[2]>x+width||b[3]>y+height))return null;
  if(!backgroundOnly&&b&&holes.some(([a,c,w,h])=>b[0]>=a&&b[1]>=c&&b[2]<=a+w&&b[3]<=c+h))return null;
  const node=n.cloneNode(false);for(const c of n.childNodes){if(c.nodeType===3){node.append(c.cloneNode());continue;}const child=copy(c);if(child)node.append(child);}if(n.localName==='g'&&!node.childElementCount)return null;return node;
 }
 const result=document.createElementNS(ns,'svg');result.setAttribute('xmlns',ns);result.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');result.setAttribute('width',width);result.setAttribute('height',height);result.setAttribute('viewBox',box.join(' '));result.setAttribute('fill',root.getAttribute('fill')??'none');
 // Preserve the original SVG viewport as well as its geometry. Filters and
 // Figma's foreignObject gradients use this viewport even inside a cropped part.
 const originalViewport=root.cloneNode(false);originalViewport.removeAttribute('xmlns');originalViewport.setAttribute('x','0');originalViewport.setAttribute('y','0');originalViewport.setAttribute('width',root.viewBox.baseVal.width);originalViewport.setAttribute('height',root.viewBox.baseVal.height);result.append(originalViewport);
 const layer=document.createElementNS(ns,'g');for(const child of root.children){const n=copy(child);if(n)layer.append(n);}originalViewport.append(layer);
 const defs=document.createElementNS(ns,'defs');originalViewport.prepend(defs);const done=new Set();
 function deps(node){const text=new XMLSerializer().serializeToString(node),ids=[...text.matchAll(/url\(#([^\)]+)\)|(?:[A-Za-z_][\w.-]*:)?href="#([^"]+)"/g)].map(m=>m[1]??m[2]);for(const id of ids){if(done.has(id))continue;done.add(id);const original=definitions.get(id);if(original){const clone=original.cloneNode(true);defs.append(clone);deps(clone);}}}
 deps(layer);
 if(holes.length){const clip=document.createElementNS(ns,'clipPath');clip.id='component-dynamic-cutouts';clip.setAttribute('clipPathUnits','userSpaceOnUse');const p=document.createElementNS(ns,'path'),rect=([a,b,w,h])=>`M${a} ${b}h${w}v${h}h${-w}Z`;p.setAttribute('d',rect(box)+holes.map(rect).join(''));p.setAttribute('clip-rule','evenodd');clip.append(p);defs.append(clip);layer.setAttribute('clip-path','url(#component-dynamic-cutouts)');}
 return new XMLSerializer().serializeToString(result);
}
