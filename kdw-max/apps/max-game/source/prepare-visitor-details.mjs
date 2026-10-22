import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {applyBusinessScreens} from './client/src/kdw-business-screens.mjs';
import {VISITOR_CAPTURE,visitorCrop,composeVisitorScreen} from './client/src/kdw-conversation-photo.mjs';
const source=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(source,'..'),base='assets/kdw-native/visitor-details/';
const catalog=applyBusinessScreens(JSON.parse(fs.readFileSync(path.join(source,'client/src/reviewed-content/mission-catalog.json'))));
const sha=b=>createHash('sha256').update(b).digest('hex'),assets={},screens={},regions={},sourcePins={};
const photo={...VISITOR_CAPTURE,dataUri:'data:image/webp;base64,'+fs.readFileSync(path.join(source,'client/public/assets/kdw-native/conversation/visitor-placeholder.webp')).toString('base64')};
const output=path.join(source,'client/public',base);fs.mkdirSync(output,{recursive:true});
function original(screenId){const task=screenId.split('.').slice(0,2).join('.'),s=catalog.tasks[task].screens[screenId],asset=catalog.assets[s.assetId],file=path.join(asset.path.startsWith('assets/kdw-native/')?path.join(source,'client/public'):path.join(root,'www'),asset.path),bytes=fs.readFileSync(file);if(sha(bytes)!==asset.sha256)throw Error('Source changed: '+asset.assetId);sourcePins[screenId]={assetId:asset.assetId,sha256:asset.sha256};return {asset,bytes};}
function save(screenId,asset,svg,region){const name=screenId.replaceAll('.','-'),assetId='kdw.visitor.'+name,file=name+'.svg';fs.writeFileSync(path.join(output,file),svg);assets[assetId]={assetId,path:base+file,width:asset.width,height:asset.height,mimeType:'image/svg+xml',sha256:sha(svg)};screens[screenId]=assetId;regions[screenId]=region;}
const profiles=[
 ['business.platform.profile',1525,72,26],
 ['business.platform.verification',749.723,35.4179,13.4343],
 ['business.channel.create',1213,62,20],
 ['business.channel.continue',1264,65,20],
 ['business.bot.create',1213,62,20],
 ['business.bot.filled',1166,59,19,{dim:.32}],
 ['business.bot.ready',1075.5,54.5,17.5,{visibleFrom:65,dim:.35}],
];
for(const [id,cx,cy,r,options={}] of profiles){
 const {asset,bytes}=original(id),x=cx-r,y=cy-r,d=r*2,crop=visitorCrop('circle');
 const background=asset.mimeType==='image/svg+xml'?bytes.toString('utf8'):`<image width="${asset.width}" height="${asset.height}" href="data:${asset.mimeType};base64,${bytes.toString('base64')}"/>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${asset.width}" height="${asset.height}" viewBox="0 0 ${asset.width} ${asset.height}"><defs><clipPath id="avatar"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><clipPath id="visible"><rect width="${asset.width}" height="${asset.height}" y="${options.visibleFrom??0}"/></clipPath></defs>${background}<g clip-path="url(#avatar)"><g clip-path="url(#visible)"><svg data-visitor-viewport="circle" x="${x}" y="${y}" width="${d}" height="${d}" viewBox="${crop.x} ${crop.y} ${crop.width} ${crop.height}" preserveAspectRatio="none"><image data-visitor-photo="true" width="1080" height="1920" href="${photo.dataUri}"/></svg>${options.dim?`<rect x="${x}" y="${y}" width="${d}" height="${d}" fill="black" opacity="${options.dim}"/>`:''}</g></g></svg>\n`;
 save(id,asset,composeVisitorScreen(svg,photo),{kind:'avatar',cx,cy,r,...options});
}
// Keep the canvas-safe reviewed ID artwork. The newly supplied SVG uses the
// same portrait path; replace its pattern contents, not the surrounding UI.
{
 const id='digital-id.create-id.ready',{asset,bytes}=original(id),svg=bytes.toString('utf8');
 const referencePath=path.resolve(source,'../../../UI/new_screens/ID/Главная с фото. Нет льгот.svg'),reference=fs.readFileSync(referencePath,'utf8');
 const portrait=/<path d="([^"]+)" fill="url\(#(pattern0_[^)]+)\)"\/>/;
 const sourcePath=svg.match(portrait),referenceShape=reference.match(portrait);
 if(!sourcePath||!referenceShape||sourcePath[1]!==referenceShape[1])throw Error('ID portrait geometry changed');
 const patternId=sourcePath[2],pattern=new RegExp(`(<pattern id="${patternId}"[^>]*>)[\\s\\S]*?</pattern>`),old=svg.match(pattern);
 const imageId=old?.[0].match(/xlink:href="#([^"]+)"/)?.[1];
 if(!imageId)throw Error('ID portrait source missing');
 const r=visitorCrop('circle');
 const viewport=`<svg data-visitor-viewport="circle" x="0" y="0" width="1" height="1" viewBox="${r.x} ${r.y} ${r.width} ${r.height}" preserveAspectRatio="none"><image data-visitor-photo="true" width="1080" height="1920" href="${photo.dataUri}"/></svg>`;
 const prepared=svg.replace(pattern,(_,open)=>open+viewport+'</pattern>').replace(new RegExp(`<image id="${imageId}"[^>]*\\/>`),'');
 if(prepared.includes(`#${imageId}`))throw Error('Unexpected shared ID portrait');
 sourcePins[id].reference={path:'UI/new_screens/ID/Главная с фото. Нет льгот.svg',sha256:sha(reference)};
 save(id,asset,composeVisitorScreen(prepared,photo),{kind:'id-photo',x:69,y:129,width:222,height:222,crop:'circle'});
}
// Reconstruct only each timestamp's local background from clean scanlines.
// Keep source gradients and delivery ticks; no rectangular solid-colour patches.
const chat='communication.call.chat',{asset,bytes}=original(chat);
const times=Array.from({length:8},(_,i)=>`09:${23+i}`),baselines=[529,681,833,986,1139,1291,1443,1596];
const patches=baselines.map((baseline,i)=>{
 const x=i<4?507:664,y=baseline-21,w=i<4?72:74,h=25,anchor=i<4?573:735;
 return {x,y,w,h,time:times[i],baseline,anchor};
});
const definitions=patches.map((p,i)=>`<linearGradient id="blend${i}" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="white"/></linearGradient><mask id="mask${i}" maskUnits="userSpaceOnUse" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="url(#blend${i})"/></mask>`).join('');
const patchesSvg=patches.map((p,i)=>{
 const strip=(row,mask='')=>`<g ${mask}><svg x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" viewBox="${p.x} ${row} ${p.w} 1" preserveAspectRatio="none"><use href="#source"/></svg></g>`;
 return strip(p.y-1)+strip(p.y+p.h,`mask="url(#mask${i})"`)+`<text x="${p.anchor}" y="${p.baseline}" text-anchor="end" font-family="Arial, sans-serif" font-size="24" fill="white" fill-opacity=".48">${p.time}</text>`;
}).join('');
save(chat,asset,`<svg xmlns="http://www.w3.org/2000/svg" width="${asset.width}" height="${asset.height}" viewBox="0 0 ${asset.width} ${asset.height}"><defs><image id="source" width="${asset.width}" height="${asset.height}" href="data:image/png;base64,${bytes.toString('base64')}"/>${definitions}</defs><use href="#source"/>${patchesSvg}</svg>\n`,{kind:'times',patches});
fs.writeFileSync(path.join(source,'client/src/kdw-visitor-details-assets.json'),JSON.stringify({assets,screens,regions,sourcePins,times},null,2)+'\n');
console.log(JSON.stringify({profiles:profiles.length,times,assets:Object.keys(assets).length}));
