import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(source,'../../..');
const input=path.join(root,'docs/review-business-screens-20261022/unpacked'),out=path.join(source,'client/public/assets/kdw-native/business-all');
fs.mkdirSync(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),assets={},screens={};
function save(name,bytes,width,height,mimeType,extra={}){const assetId='kdw.business-all.'+name.replace(/\.[^.]+$/,'');fs.writeFileSync(path.join(out,name),bytes);assets[assetId]={assetId,path:'assets/kdw-native/business-all/'+name,width,height,mimeType,sha256:sha(bytes),...extra};return assetId;}
for(const [group,sector,suffix]of [['general-screens','general',''],['coffe-screens','cafe','.1'],['flower-screens','flowers','.2'],['auto-screens','auto','.3']]){
 for(const file of fs.readdirSync(path.join(input,group)).filter(n=>n.endsWith('.svg'))){
  const original=fs.readFileSync(path.join(input,group,file)),number=Number(file.match(/screen(\d+)/)[1]);let svg=original.toString();
  const [,width,height]=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number),dependencies=[];
  svg=svg.replace(/data:(image\/[\w+.-]+);base64,([A-Za-z0-9+/=\r\n]+)/g,(_m,mime,encoded)=>{const b=Buffer.from(encoded,'base64'),name='raster-'+sha(b)+'.'+(mime==='image/jpeg'?'jpg':'png');if(!dependencies.includes(name))dependencies.push(name);if(!fs.existsSync(path.join(out,name)))fs.writeFileSync(path.join(out,name),b);const id='kdw.business-all.'+name.replace(/\.[^.]+$/,'');assets[id]={assetId:id,path:'assets/kdw-native/business-all/'+name,width:1,height:1,mimeType:mime,sha256:sha(b)};return './'+name;});
  const assetId=save(`${sector}-${number}.svg`,svg,width,height,'image/svg+xml',{dependencies,origin:{file:group+'/'+file,sha256:sha(original)}});
  screens[sector+'-'+number]={assetId,width,height};
 }
}
// The common presentation engine measures these transparent canvases; the DOM
// layer paints the exact source SVG only after it has decoded.
for(const s of Object.values(screens)){const name=`canvas-${s.width}-${s.height}.svg`;s.canvas=save(name,`<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"></svg>`,s.width,s.height,'image/svg+xml');}
fs.writeFileSync(path.join(source,'client/src/kdw-business-all-assets.json'),JSON.stringify({assets,screens},null,2)+'\n');
console.log(JSON.stringify({screens:Object.keys(screens).length,assets:Object.keys(assets).length,bytes:Object.values(assets).reduce((n,a)=>n+fs.statSync(path.join(source,'client/public',a.path)).size,0)}));
