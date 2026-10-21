import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createKdwCatalog} from './client/src/kdw-interactions-model.mjs';
import {BUSINESS_UI_ASSETS} from './client/src/kdw-business-native-model.mjs';
const source=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(source,'..'),www=path.join(root,'www'),out=path.resolve(source,'../../../dist/max-game-web');
const modules=path.resolve(process.argv[2]??path.join(source,'client/node_modules')),{build}=await import(pathToFileURL(path.join(modules,'esbuild/lib/main.js')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),files=new Map();
function put(name,bytes){if(name.startsWith('/')||name.split('/').includes('..'))throw Error('Invalid export path');files.set(name,Buffer.from(bytes));}
function add(name){name=name.replaceAll('\\','/');if(files.has(name))return;const full=path.resolve(www,name);if(!full.startsWith(www+path.sep))throw Error('Asset outside www');if(!fs.existsSync(full))throw Error('Missing web asset: '+name);put(name,fs.readFileSync(full));}
function tree(dir){for(const e of fs.readdirSync(path.join(www,dir),{withFileTypes:true})){const name=dir+'/'+e.name;if(e.isDirectory())tree(name);else add(name);}}
const catalog=createKdwCatalog(JSON.parse(fs.readFileSync(path.join(source,'client/src/reviewed-content/mission-catalog.json'))));
for(const a of Object.values({...catalog.assets,...BUSINESS_UI_ASSETS}))if(a.path)add(a.path);
for(const dir of ['brand','config','icons','licenses','webgl-v5/icon-glyphs','assets/kdw-r7'])tree(dir);
for(const name of ['app.js','journey.css','journey-guided.css','journey-guided-line.css','journey-guided-reveal.css','v5.css','kdw-interactions.css'])add('webgl-v5/'+name);
// Include literal local resources referenced by the actual bundle inputs, not historical bundles.
const inputManifest=JSON.parse(fs.readFileSync(path.join(www,'webgl-v5/r9-build.json')));
if(hash(fs.readFileSync(path.join(www,'webgl-v5/app.js')))!==inputManifest.bundleSha256)throw Error('Portable bundle differs from its build receipt');
for(const name of Object.keys(inputManifest.inputs)){
 const text=fs.readFileSync(path.resolve(source,name),'utf8');
 if(hash(Buffer.from(text))!==inputManifest.inputs[name])throw Error('Rebuild the portable game before web export: '+name);
 for(const m of text.matchAll(/["'`]\.\/(assets|brand|icons|audio|webgl-v5|earth)\/([^"'`\s${}]+)["'`]/g))if(fs.existsSync(path.join(www,m[1],m[2]))&&fs.statSync(path.join(www,m[1],m[2])).isFile())add(m[1]+'/'+m[2]);
}
// Resolve stylesheet resource dependencies and reject a missing font/image during export.
for(const [name,bytes] of files)if(name.endsWith('.css'))for(const m of bytes.toString().matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)){if(/^(data:|https?:|#)/.test(m[1]))continue;add(path.posix.normalize(path.posix.join(path.posix.dirname(name),m[1].split('?')[0])));}
// Lossless web derivatives; original source art and the portable www stay intact.
const sharp=(await import(pathToFileURL(path.join(modules,'sharp/dist/index.mjs')))).default;
const cacheDir=path.resolve(out,'../.max-game-web-cache');fs.mkdirSync(cacheDir,{recursive:true});
const independentCatalog=JSON.parse(fs.readFileSync(path.join(source,'client/src/independent-assets-catalog.json'))),idleVideo=independentCatalog.devices.find(a=>a.assetId==='device.custom.tv-first-30s');
if(!idleVideo)throw Error('Native standby video missing');
const videoSource=fs.readFileSync(path.join(www,idleVideo.path));if(hash(videoSource)!==idleVideo.sha256)throw Error('Native standby video source differs');
const webVideoFile=path.join(cacheDir,idleVideo.sha256+'-720p-crf26-aac64-v1.mp4');
if(!fs.existsSync(webVideoFile))execFileSync('ffmpeg',['-v','error','-nostdin','-i',path.join(www,idleVideo.path),'-vf','scale=1280:720','-c:v','libx264','-preset','medium','-crf','26','-pix_fmt','yuv420p','-c:a','aac','-b:a','64k','-movflags','+faststart',webVideoFile],{stdio:'inherit'});
const videoBytes=fs.readFileSync(webVideoFile),webIdleVideo={...idleVideo,width:1280,height:720,sha256:hash(videoBytes)};
put(idleVideo.path,videoBytes);
async function compress(bytes){const file=path.join(cacheDir,hash(bytes)+'.webp');if(fs.existsSync(file))return fs.readFileSync(file);const result=await sharp(bytes).webp({lossless:true,effort:4}).toBuffer();fs.writeFileSync(file,result);return result;}
const aliases={},origins={},embedded=new Map(),rasterPaths=new Set([...Object.values(catalog.assets).map(a=>a.path),'assets/kdw-r7/catalog-reference.png']);
origins[idleVideo.path]={path:idleVideo.path,sha256:idleVideo.sha256};
for(const [name,bytes] of [...files]){
 if(/\.(png|jpe?g)$/i.test(name)&&rasterPaths.has(name)){
  const converted=await compress(bytes);
  if(converted.length<bytes.length){const next=name.replace(/\.[^.]+$/,'.webp');if(files.has(next))continue;files.delete(name);put(next,converted);aliases[name]=next;origins[next]={path:name,sha256:hash(bytes)};}
 }else if(name.endsWith('.svg')){
  let text=bytes.toString();for(const m of text.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=\r\n]+)/g)){const raw=Buffer.from(m[1],'base64'),key=hash(raw);if(!embedded.has(key))embedded.set(key,await compress(raw));const webp=embedded.get(key);if(webp.length<raw.length)text=text.replace(m[0],'data:image/webp;base64,'+webp.toString('base64'));}
  if(text!==bytes.toString()){put(name,text);origins[name]={path:name,sha256:hash(bytes)};}
 }
}
const rewrite=text=>{for(const [from,to] of Object.entries(aliases))text=text.replaceAll(from,to);return text;};
// Keep the canonical catalog and game contracts byte-for-byte. Only the web
// presentation resolves a logical source path to its compressed derivative.
const webAssetsPlugin={name:'web-asset-urls',setup(api){
api.onLoad({filter:/independent-assets-catalog\.json$/},()=>({contents:JSON.stringify({...independentCatalog,devices:independentCatalog.devices.map(a=>a.assetId===idleVideo.assetId?webIdleVideo:a)}),loader:'json'}));
api.onLoad({filter:/\.[mc]?js$/},async({path:filename})=>{
 let text=fs.readFileSync(filename,'utf8');
 if(filename.endsWith('journey-shared-ui.mjs')){const from='asset?.path?`./${asset.path}`:null';if(!text.includes(from))throw Error('Shared asset resolver changed');text=text.replace(from,'asset?.path?globalThis.maxWebAssets.url(asset.path):null');}
 if(filename.endsWith('journey-webgl-ui.mjs')){const from='new URL(`./${asset.path}`,document.baseURI).href';if(!text.includes(from))throw Error('Device warmup resolver changed');text=text.replace(from,'globalThis.maxWebAssets.url(asset.path)');}
 return {contents:rewrite(text),loader:'js'};
});}};
for(const [name,input] of [['entry.js','web/entry.mjs'],['webgl-v5/app.js','client/src/journey-guided-main.js']]){
 const result=await build({entryPoints:[path.join(source,input)],nodePaths:[path.join(source,'vendor'),modules],plugins:[webAssetsPlugin],bundle:true,external:['./touch.js','./webgl-v5/app.js'],format:'esm',platform:'browser',target:['es2022'],minify:true,write:false,legalComments:'inline'});put(name,result.outputFiles[0].contents);
}
for(const [name,bytes] of files)if(name.endsWith('.css'))put(name,rewrite(bytes.toString()));
const resolved=name=>aliases[name]??name;
const records=Object.fromEntries([...files].sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>[name,{bytes:bytes.length,sha256:hash(bytes),...(origins[name]?{source:origins[name]}:{})}]));
const release=hash(JSON.stringify(records)).slice(0,20),releaseDir=path.join(out,'releases',release);
const tasks=Object.fromEntries(Object.entries(catalog.tasks).map(([id,t])=>[id,[...new Set(Object.values(t.screens).map(s=>catalog.assets[s.assetId]?.path).filter(Boolean).map(resolved))]]));
const missions=Object.fromEntries(Object.entries(catalog.missions).map(([id,m])=>[id,[...new Set([...m.taskIds.flatMap(t=>tasks[t]),catalog.assets[m.qr.assetId]?.path].filter(Boolean).map(resolved))]]));
const shell=Object.keys(records).filter(n=>n.startsWith('brand/')||n.startsWith('webgl-v5/icon-glyphs/'));
const manifest={schemaVersion:1,release,contentRevision:catalog.contentRevision,desktopBundleSha256:inputManifest.bundleSha256,files:records,aliases,shell,tasks,missions,standby:{renderer:'journey-v5-idle-menu.mjs',video:webIdleVideo}};
for(const [name,bytes] of files){const target=path.join(releaseDir,name);fs.mkdirSync(path.dirname(target),{recursive:true});if(fs.existsSync(target)&&hash(fs.readFileSync(target))!==hash(bytes))throw Error('Immutable release conflict');fs.writeFileSync(target,bytes);}
fs.writeFileSync(path.join(releaseDir,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#100821"><title>MAX — игра</title><link rel="icon" href="data:,"><style>body{margin:0;background:#100821;color:white;font-family:Arial,sans-serif}#web-status{position:fixed;inset:0;z-index:10001;display:grid;place-content:center;gap:20px;text-align:center;padding:24px;background:#100821}#web-status button{padding:16px;border-radius:16px;font-size:18px}[hidden]{display:none!important}.guided-restart,[data-menu],[data-continue-mission]{display:none!important}html[data-web-display=touch] [data-menu]{display:block!important}html[data-web-display=touch] [data-menu][hidden]{display:none!important}#managed-status,#version-label{display:none!important}</style></head><body><section id="web-status" role="status">Загрузка MAX…</section><noscript>Для игры необходимо включить JavaScript.</noscript><script type="module" src="./releases/${release}/entry.js"></script></body></html>`;
fs.writeFileSync(path.join(out,'index.html'),html);fs.writeFileSync(path.join(out,'release.json'),JSON.stringify({release,files:Object.keys(records).length,bytes:[...files.values()].reduce((n,b)=>n+b.length,0),desktopBundleSha256:inputManifest.bundleSha256},null,2)+'\n');
fs.writeFileSync(path.join(out,'README.txt'),'MAX — веб-поставка\nЗагрузите index.html и папку releases целиком в одну папку HTTPS-сайта. Поддерживается корень и подкаталог, например /games/max/. Открывайте URL с завершающим /.\nСервер: обычная статическая раздача, корректные MIME для JS/CSS/SVG/WOFF2/MP4 и HTTP Range для видео, без SPA-fallback для отсутствующих ассетов. index.html и release.json: Cache-Control: no-cache. releases/: Cache-Control: public, max-age=31536000, immutable. Включите gzip/brotli для JS/CSS/JSON/SVG.\nПри обновлении сначала загрузите новый releases/<id>/, затем index.html. Старые releases не удалять до завершения открытых сеансов. Runtime Electron, launcher, source, data и секреты сюда не входят.\nОсновной вход на всех устройствах — настоящая стендовая сцена: standby с роликом и иконками заданий. Старое мобильное меню не используется. debug=1 — только явный технический просмотр. Прогресс хранится в браузере; между устройствами не синхронизируется.\n');
console.log(JSON.stringify({output:out,...JSON.parse(fs.readFileSync(path.join(out,'release.json')))}));
