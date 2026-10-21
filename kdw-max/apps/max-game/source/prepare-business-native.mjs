import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url)),project=path.resolve(source,'../../..');
const input=path.join(project,'UI/new_screens/busines_no_sort'),base='assets/kdw-native/business-ui/',out=path.join(source,'client/public',base);
const sharp=createRequire(import.meta.url)(process.argv[2]??'D:/job/production/FUTURONIKA/VK_DigitalProducts/artifacts/max-game/node_modules/sharp');
const sha=b=>createHash('sha256').update(b).digest('hex');fs.mkdirSync(out,{recursive:true});
const assets={},origins=[];
function save(name,bytes,width,height,mimeType){const assetId='kdw.business-ui.'+name.replace(/\.[^.]+$/,'');fs.writeFileSync(path.join(out,name),bytes);assets[assetId]={assetId,path:base+name,width,height,mimeType,sha256:sha(bytes)};return assetId;}
async function raster(file,index,name){const bytes=fs.readFileSync(path.join(input,file)),svg=bytes.toString('utf8'),images=[...svg.matchAll(/<image\b[^>]*?(?:xlink:)?href="data:([^;]+);base64,([^"]+)"[^>]*>/g)];if(!images[index])throw Error('Missing source image '+file+':'+index);const original=Buffer.from(images[index][2],'base64'),image=sharp(original).resize({width:1632,withoutEnlargement:true}),meta=await image.metadata(),result=await image.webp({quality:90}).toBuffer(),m=await sharp(result).metadata();save(name,result,m.width,m.height,'image/webp');origins.push({asset:name,file,image:index,sourceSha256:sha(bytes),embeddedSha256:sha(original),originalSize:[meta.width,meta.height]});}
await raster('1. botStart.svg',1,'channel-bot.webp');
await raster('1. botStart.svg',0,'wallpaper.webp');
// The café emblem is a standalone business image, never a raster phone preview.
const order=fs.readFileSync(path.join(input,'экран.svg'));
const emblem=await sharp(order,{density:288}).extract({left:48*4,top:58*4,width:38*4,height:38*4}).webp({quality:95}).toBuffer();
save('cafe.webp',emblem,152,152,'image/webp');origins.push({asset:'cafe.webp',file:'экран.svg',sourceSha256:sha(order),region:[48,58,38,38]});
// Decorative landing illustration only; all navigation, headings and controls are HTML.
const landing=fs.readFileSync(path.join(input,'Вход на платформу.svg'));
const hero=await sharp(landing).extract({left:800,top:170,width:600,height:670}).webp({quality:92}).toBuffer();
save('landing-art.webp',hero,600,670,'image/webp');origins.push({asset:'landing-art.webp',file:'Вход на платформу.svg',sourceSha256:sha(landing),region:[800,170,600,670]});
const sizes={choice:[1280,800],landing:[1440,840],desktop:[895,559],dashboard:[757,493],method:[794,496],form:[723,452],bots:[666,416],phone:[360,794],order:[341,744]};
for(const [name,[w,h]] of Object.entries(sizes)){const bg=name==='landing'?'#0d0d0d':['phone','order'].includes(name)?'#17181c':'#f3f5f9';save(name+'.svg',Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/></svg>`),w,h,'image/svg+xml');}
fs.writeFileSync(path.join(source,'client/src/kdw-business-ui-assets.json'),JSON.stringify(assets,null,2)+'\n');
fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify({source:'UI/new_screens/busines_no_sort',origins},null,2)+'\n');
console.log(JSON.stringify({assets:Object.keys(assets).length,bytes:Object.values(assets).reduce((n,a)=>n+fs.statSync(path.join(source,'client/public',a.path)).size,0)}));
