import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {screenCatalog} from './catalog.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),project=path.resolve(dir,'../../../../..'),game=path.join(project,'artifacts/max-game');
const require=createRequire(path.join(game,'package.json')),{build}=require('esbuild');
const read=p=>fs.readFile(p,'utf8'),hash=b=>createHash('sha256').update(b).digest('hex'),sourceHashes={};
async function source(p){const b=await fs.readFile(p);sourceHashes[path.relative(project,p).replaceAll('\\','/')]=hash(b);return b;}
const reviewUI=(await source(path.join(dir,'review-ui.js'))).toString();
const sandboxSource=async()=>['review-core.js','review-sandbox.js','code.source.js'].map(name=>path.join(dir,name));
async function buildSandbox(){const names=await sandboxSource(),parts=[];for(const name of names)parts.push((await source(name)).toString());const {transform}=require('esbuild');return (await transform(parts.join('\n'),{target:'es2017',minify:false,loader:'js'})).code;}
// UI-only iteration retains the exact previously built game/asset payload.
if(process.argv.includes('--plugin-only')){
 const old=await read(path.join(dir,'ui.html')),start=old.indexOf('const DATA='),end=old.indexOf(';\nconst $=',start);
 const crlfEnd=old.indexOf(';\r\nconst $=',start),stop=end>=0?end:crlfEnd;
 if(start<0||stop<0)throw Error('Previous offline payload not found');
 const embedded=old.slice(start,stop+1),payload=JSON.parse(embedded.slice('const DATA='.length,-1));
 const template=(await source(path.join(dir,'ui.template.html'))).toString();
 if(template.split('/*__MAX_PAYLOAD__*/').length!==2||template.split('/*__MAX_REVIEW_UI__*/').length!==2)throw Error('Plugin template marker drift');
 const ui=template.replace('/*__MAX_PAYLOAD__*/',()=>embedded).replace('/*__MAX_REVIEW_UI__*/',()=>reviewUI);
 const code=await buildSandbox();await fs.writeFile(path.join(dir,'ui.html'),ui);await fs.writeFile(path.join(dir,'code.js'),code);
 await source(path.join(dir,'build.mjs'));await source(path.join(dir,'../manifest.json'));
 await fs.writeFile(path.join(dir,'plugin-build.json'),JSON.stringify({builtAt:new Date().toISOString(),mode:'plugin-only',retainedGameRevision:payload.revision,retainedGameSha256:hash(Buffer.from(payload.html,'base64')),files:sourceHashes},null,2)+'\n');
 console.log(JSON.stringify({mode:'plugin-only',retainedGameRevision:payload.revision,bytes:Buffer.byteLength(ui)}));
 process.exit(0);
}
await source(path.join(dir,'build.mjs'));await source(path.join(dir,'code.source.js'));
async function walk(p){const out=[];for(const f of await fs.readdir(p,{withFileTypes:true})){const n=path.join(p,f.name);if(f.isDirectory())out.push(...await walk(n));else if(f.isFile())out.push(n);}return out;}
const assets={},types={'.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.png':'image/png','.webp':'image/webp'};
for(const folder of ['config','icons','brand','assets/digital-id','assets/client-media','assets/presentation'])for(const p of await walk(path.join(game,'public',folder))){
 if(p.endsWith('sources.json'))continue;const rel=path.relative(path.join(game,'public'),p).replaceAll('\\','/'),b=await source(p);assets[rel]='data:'+(types[path.extname(p)]||'application/octet-stream')+';base64,'+b.toString('base64');
}
assets['brand/assets/logos/max-symbol-white.svg']='data:image/svg+xml;base64,'+(await source(path.join(project,'artifacts/DESIGN/BRANDS/MAX/assets/logos/max-symbol-white.svg'))).toString('base64');
const bridge=(await source(path.join(dir,'bridge.js'))).toString(),layers=(await source(path.join(dir,'layers.js'))).toString();
function once(text,from,to){if(text.split(from).length!==2)throw Error('Source adapter drift: '+from.slice(0,90));return text.replace(from,to);}
const built=await build({entryPoints:[path.join(game,'src/journey-guided-main.js')],nodePaths:[path.join(game,'node_modules')],bundle:true,format:'iife',define:{'import.meta.url':JSON.stringify('https://offline.invalid/')},platform:'browser',target:['es2020'],minify:true,write:false,metafile:true,legalComments:'inline',plugins:[{name:'max-reveal-export-only',setup(b){
 b.onLoad({filter:/\.(js|mjs)$/},async args=>{
  if(args.path.includes('node_modules'))return;let t=(await source(args.path)).toString().replaceAll('\r\n','\n');
  if(args.path.endsWith('journey-guided-main.js')){
   t=once(t,'boot().catch(e=>{console.error(e);',"boot().then(()=>parent.postMessage({type:'max-render-ready'},'*')).catch(e=>{parent.postMessage({type:'max-render-error',error:e.message},'*');console.error(e);");
   t=once(t,'function tick(delta){','function tick(delta){\n if(exportFrozen){updateTargets();return;}');
   t=once(t," const wall=zonesForLayout('single')[0];"," return window.__maxExportSize||{width:1600,height:1000};\n const wall=zonesForLayout('single')[0];");
   t+='\n'+bridge;
  }else if(args.path.endsWith('journey-background.mjs'))t=once(t,'canvas,antialias:false','canvas,preserveDrawingBuffer:true,antialias:false');
  else if(args.path.endsWith('webgl-field.js')){
   t=once(t,'new THREE.WebGLRenderer({ antialias: true,','new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true,');
   t=once(t,'setScreenForeground(value) { screenForeground = value; },',`setScreenForeground(value) { screenForeground = value; },
   __figmaCapture(){renderFrame(0);const full=renderer.domElement.toDataURL('image/png');const parts=screenForeground.exportLayers();try{renderFrame(0);return {full,base:renderer.domElement.toDataURL('image/png'),layers:parts.layers};}finally{parts.restore();renderFrame(0);}},`);
  }else if(args.path.endsWith('journey-webgl-ui.mjs')){
   t=once(t,'mesh.scale.y=-h;','mesh.scale.y=-h;mesh.userData.maxExport={kind:"text",text:l.text,png:map.image.toDataURL("image/png"),fontSize:parseFloat(style.fontSize),weight:style.fontWeight,color:style.color,letterSpacing:style.letterSpacing};');
   t=once(t,'for(const geo of shapes){','let exportPart=0;for(const geo of shapes){');
   t=once(t,'parent.add(mesh);\n  }\n }\n function motionId',`mesh.userData.maxExport={kind:'svg',svg:serialized,secondary:exportPart++>0,x:r.x-origin.x,y:r.y-origin.y,w:r.w,h:r.h};parent.add(mesh);
  }
 }
 function motionId`);
   t=once(t,"if(el.matches('.route-brand'))mesh.userData.logoSize={w:r.w,h:r.h};",`if(el.matches('.route-brand'))mesh.userData.logoSize={w:r.w,h:r.h};
   mesh.userData.maxExport={kind:'image',png:map.image.toDataURL('image/png')};
   if(el.src.startsWith('data:image/svg+xml;base64,')){mesh.userData.maxExport={kind:'svg',svg:new TextDecoder().decode(Uint8Array.from(atob(el.src.split(',')[1]),c=>c.charCodeAt(0))),x:r.x-origin.x,y:r.y-origin.y,w:r.w,h:r.h};}`);
   t=once(t,'async prepareGPU(renderer){','exportLayers,\n  async prepareGPU(renderer){');
   t=once(t,' function cancelPlacement(host,{leaving=false}={}){',layers+'\n function cancelPlacement(host,{leaving=false}={}){');
  }
  return {contents:t,loader:'js'};
 });
}}]});
let css=(await source(path.join(game,'public/brand/tokens/brand.css'))).toString().replace(/url\("\.\.\/([^\"]+)"\)/g,(_,p)=>`url("${assets['brand/'+p]}")`);
for(const name of ['circular.css','journey.css','journey-guided.css','journey-guided-line.css','journey-guided-reveal.css'])css+='\n'+(await source(path.join(game,'src',name))).toString();
const original=JSON.parse((await source(path.join(game,'public/config/client-missions.json'))).toString()),catalogs={reveal:screenCatalog(original)};
await source(path.join(dir,'catalog.mjs'));
const bootstrap=`window.addEventListener('error',event=>parent.postMessage({type:'max-render-error',error:event.message},'*'));
window.addEventListener('unhandledrejection',event=>parent.postMessage({type:'max-render-error',error:String(event.reason?.message||event.reason)},'*'));
const offlineAssets=${JSON.stringify(assets)};
const asset=s=>offlineAssets[String(s).replace(/^\.\\//,'')]||s;
const nativeFetch=window.fetch.bind(window);window.fetch=(input,options)=>{const s=String(input);if(s.startsWith('blob:')||s.startsWith('data:'))return nativeFetch(input,options);const value=offlineAssets[s.replace(/^\.\\//,'')];if(!value)return Promise.reject(Error('Offline asset missing: '+s));return nativeFetch(value);};
const imageSrc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{get:imageSrc.get,set(value){imageSrc.set.call(this,asset(value));},configurable:true});
const markup=s=>s.replace(/src=(['"])(\\.\\/[^'"]+)\\1/g,(_,q,url)=>'src='+q+asset(url)+q);
const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{get:inner.get,set(value){inner.set.call(this,markup(value));},configurable:true});
const insert=Element.prototype.insertAdjacentHTML;Element.prototype.insertAdjacentHTML=function(where,html){return insert.call(this,where,markup(html));};
const memory=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)},configurable:true});
let seed=9302026;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};`;
let html=(await source(path.join(game,'index.html'))).toString().replace('<html lang="ru">','<html lang="ru" data-edition="client" data-experiment="guided" data-phone-layout="path" data-reveal="true">');
html=html.replace(/<link rel="stylesheet"[^>]*>/g,'').replace('</head>',()=>`<style>${css}</style></head>`);
html=html.replace('<script type="module" src="./app.js"></script>',()=>`<script>${bootstrap.replaceAll('</script','<\\/script')}</script><script>${built.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`);
const payload={html:Buffer.from(html).toString('base64'),catalogs,revision:new Date().toISOString(),sources:sourceHashes};
let ui=(await source(path.join(dir,'ui.template.html'))).toString().replace('/*__MAX_PAYLOAD__*/',()=>`const DATA=${JSON.stringify(payload).replaceAll('<','\\u003c')};`).replace('/*__MAX_REVIEW_UI__*/',()=>reviewUI);
await fs.writeFile(path.join(dir,'ui.html'),ui);
await fs.writeFile(path.join(dir,'code.js'),await buildSandbox());
await fs.writeFile(path.join(dir,'THREE-LICENSE.txt'),await fs.readFile(path.join(game,'node_modules/three/LICENSE')));
await fs.writeFile(path.join(dir,'source-manifest.json'),JSON.stringify({revision:payload.revision,files:sourceHashes,screens:catalogs.reveal.length,defaultScreens:catalogs.reveal.filter(s=>s.default).length,missions:6},null,2)+'\n');
await fs.writeFile(path.join(dir,'screen-inventory.json'),JSON.stringify(catalogs.reveal.map(({state,...s})=>s),null,2)+'\n');
console.log(JSON.stringify({screens:catalogs.reveal.length,defaultScreens:catalogs.reveal.filter(s=>s.default).length,bytes:Buffer.byteLength(ui),sources:Object.keys(sourceHashes).length}));
