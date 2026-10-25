const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const out=path.join(__dirname,'prepared'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourcePins=JSON.parse(fs.readFileSync(path.join(__dirname,'vector-source-pins.json')));
app.setPath('userData',path.join(out,'.vector-profile'));
const icons=[
 {id:'back',screen:3,nodes:[7]}, {id:'camera-add',screen:3,nodes:[10]},
 {id:'search',screen:2,nodes:[57]}, {id:'create-channel',screen:2,nodes:[5]},
 {id:'create-group',screen:2,nodes:[1,2,3]}, {id:'more',screen:10,nodes:[16,17,18]},
 {id:'attachment',screen:10,nodes:[35]}, {id:'smile',screen:10,nodes:[31,32,33]},
 {id:'microphone',screen:10,nodes:[37,38]}, {id:'comments',screen:11,nodes:[54]},
 {id:'chevron-right',screen:11,nodes:[56]},
 {id:'send',screen:13,nodes:[70]}, {id:'close',screen:13,nodes:[64]},
 {id:'check',screen:5,nodes:[9]}, {id:'copy-link',screen:5,nodes:[66]},
 {id:'share',screen:5,nodes:[68]}, {id:'business',screen:5,nodes:[64]},
];
app.whenReady().then(async()=>{
 fs.mkdirSync(path.join(out,'icons'),{recursive:true});
 const w=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true}});await w.loadURL('about:blank');
 const assets=[],symbols=[];
 for(const screen of [...new Set(icons.map(x=>x.screen))]){
  const source=fs.readFileSync(path.join(__dirname,`svg/screen_${screen}.svg`),'utf8');
  if(sha(source)!==sourcePins[screen])throw Error('SVG changed; inspect and update the vector selections before rebuilding screen '+screen);
  const extracted=await w.webContents.executeJavaScript(`(()=>{document.body.replaceChildren();const root=new DOMParser().parseFromString(${JSON.stringify(source)},'image/svg+xml').documentElement;document.body.append(document.importNode(root,true));const shapes=[...document.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon')].filter(e=>!e.closest('defs,clipPath,mask,pattern'));return ${JSON.stringify(icons.filter(x=>x.screen===screen))}.map(spec=>{const rows=spec.nodes.map(i=>{const e=shapes[i];if(!e)throw Error('Missing shape '+i);const b=e.getBBox(),m=e.getCTM(),p=new DOMPoint(b.x,b.y).matrixTransform(m),q=new DOMPoint(b.x+b.width,b.y+b.height).matrixTransform(m),s=getComputedStyle(e),clone=e.cloneNode(true);for(const a of [...clone.attributes])if(['id','style','transform','clip-path','mask','filter'].includes(a.name))clone.removeAttribute(a.name);clone.setAttribute('transform','matrix('+[m.a,m.b,m.c,m.d,m.e,m.f].join(' ')+')');clone.setAttribute('fill',s.fill==='none'?'none':'currentColor');clone.setAttribute('stroke',s.stroke==='none'?'none':'currentColor');return {html:clone.outerHTML,x:p.x,y:p.y,right:q.x,bottom:q.y,color:s.fill==='none'?s.stroke:s.fill};});const x=Math.min(...rows.map(r=>r.x))-2,y=Math.min(...rows.map(r=>r.y))-2,w=Math.max(...rows.map(r=>r.right))-x+2,h=Math.max(...rows.map(r=>r.bottom))-y+2;return {id:spec.id,viewBox:[0,0,w,h],defaultColor:rows.find(r=>r.color!=='none')?.color,body:'<g transform="translate('+(-x)+' '+(-y)+')">'+rows.map(r=>r.html).join('')+'</g>'};});})()`);
  for(const row of extracted){
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${row.viewBox.join(' ')}" color="${row.defaultColor}">${row.body}</svg>\n`;
   if(/data:|url\(|<image|<text|foreignObject/.test(svg))throw Error('Unexpected dependency in icon '+row.id);
   fs.writeFileSync(path.join(out,'icons',row.id+'.svg'),svg);
   assets.push({id:'icon-'+row.id,kind:'vector-icon',path:'icons/'+row.id+'.svg',mimeType:'image/svg+xml',bytes:Buffer.byteLength(svg),sha256:sha(svg),viewBox:row.viewBox,defaultColor:row.defaultColor,sourceScreen:screen,sourceShapeIndices:icons.find(x=>x.id===row.id).nodes});
   symbols.push(`<symbol id="${row.id}" viewBox="${row.viewBox.join(' ')}">${row.body}</symbol>`);
  }
 }
 const sprite=`<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`;fs.writeFileSync(path.join(out,'icons/sprite.svg'),sprite);
 assets.push({id:'icon-sprite',kind:'vector-sprite',path:'icons/sprite.svg',mimeType:'image/svg+xml',bytes:Buffer.byteLength(sprite),sha256:sha(sprite)});
 const file=path.join(out,'manifest.json'),manifest=JSON.parse(fs.readFileSync(file));manifest.assets=manifest.assets.filter(a=>!a.kind.startsWith('vector-')).concat(assets);manifest.totals.vectorIconCount=icons.length;manifest.totals.vectorBytes=assets.reduce((a,b)=>a+b.bytes,0);manifest.totals.preparedAssetBytes=manifest.assets.reduce((a,b)=>a+b.bytes,0);fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
 w.destroy();console.log(JSON.stringify(manifest.totals));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
