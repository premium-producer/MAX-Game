// Exercise the production Canvas2D texture code without a slow whole-mission GPU run.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {chromium} from 'playwright';
import {highQualityRasterScale} from '../../apps/max-game/source/client/src/kdw-conversation-model.mjs';
const root=path.resolve('apps/max-game/www'),out=path.resolve('docs/verification-hq-screens-20261028');fs.mkdirSync(out,{recursive:true});
const src=fs.readFileSync('apps/max-game/source/client/src/journey-webgl-ui.mjs','utf8');
const functions=src.slice(src.indexOf(' function texture('),src.indexOf(' const idTextureKey='))+src.slice(src.indexOf(' function imageRasterSpec('),src.indexOf(' // CSS remains authoritative.'));
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':'image/png');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const results=[];
try{
 await page.goto(origin+'/assets/kdw-native/hq/communication-message-voice-start.png');
 await page.evaluate(({functions,hq})=>{
  window.raster=new Function('const highQualityRasterScale='+hq+'; const cache=new Map(),used=new Set(),startupTextureKeys=new Set();let captureStartup=false; const bfmVisual=true,devicePixelScale=.5,cachePixels=v=>Math.round(v*64)/64,v5DeviceRasterScale=()=>.5,preparationStats={rasters:0,rasterMs:0,maxRasterMs:0},reportPreparation=()=>{};const THREE={CanvasTexture:class{constructor(image){this.image=image;}}};'+functions+';return async function(url,original){const el=new Image();el.className="task-media-image";if(original)el.dataset.mediaOriginal=original;el.src=url;await el.decode();document.body.append(el);const t=imageTexture(el,{w:349.2,h:776},el);el.remove();return t.image;};')();
 },{functions,hq:highQualityRasterScale.toString()});
 const paths=['assets/kdw-native/hq/communication-message-voice-start.png','assets/kdw-native/conversation/hq-communication-message-video-stop.svg','assets/kdw-native/visitor-details/hq-digital-id-create-id-ready.svg'];
 for(const [i,p]of paths.entries()){
  const r=await page.evaluate(async url=>{const c=await window.raster(url);return{width:c.width,height:c.height,png:c.toDataURL('image/png')};},origin+'/'+p);
  assert.ok(r.width>=1400&&r.height>=2900);assert.ok(r.width*r.height<=1440*3200+3200);
  fs.writeFileSync(path.join(out,'texture-'+i+'.png'),Buffer.from(r.png.split(',')[1],'base64'));results.push({path:p,width:r.width,height:r.height});
 }
 // Fallback data URLs must keep the HQ policy through their original-source tag.
 const templates=JSON.parse(fs.readFileSync('apps/max-game/source/client/src/kdw-template-media.json'));
 const fallback=await page.evaluate(async({uri,original})=>{const c=await window.raster(uri,original);return{width:c.width,height:c.height};},{uri:templates.images[templates.media[paths[1]]],original:origin+'/'+paths[1]});
 assert.ok(fallback.width>=1400&&fallback.height>=2900);
 const report={passed:true,productionTextureFunctions:true,physicalScale:.5,results,fallback};fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
