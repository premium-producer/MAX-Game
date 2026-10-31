// Lossless PNG deliveries, preserving existing photo masks and action geometry.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const source=path.dirname(fileURLToPath(import.meta.url)),input=path.resolve(source,'../../../UI/new_screens/hq-20261028'),publicRoot=path.join(source,'client/public');
const sha=b=>createHash('sha256').update(b).digest('hex');
const communication=['call.chat','call.connected','call.result','message.voice-start','message.voice-stop','message.voice-preview','message.voice-sent','message.video-start','message.video-stop','message.video-preview','message.video-sent','reaction.chat','reaction.stickers','reaction.preview','reaction.sent','story.start','story.duration','story.audience','story.ready'];
const digital=['start','documents','confirm','quick','biometry','ready'];
const photos={2:1,3:2,9:3,10:4,11:5,16:6,19:7};
const assets={},screens={},sources={};
function save(screenId,relative,bytes,width,height,mimeType){
 const assetId='kdw.hq.'+screenId,file=path.join(publicRoot,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);
 assets[assetId]={assetId,path:relative,width,height,mimeType,sha256:sha(bytes)};screens[screenId]=assetId;
}
for(const [group,list] of [['communication',communication],['digital-id',digital]])for(const [index,key]of list.entries()){
 const number=index+1,screenId=group==='communication'?group+'.'+key:'digital-id.create-id.'+key;
 const file=path.join(input,group,`screen_${number}.png`),png=fs.readFileSync(file),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 if(width!==1440||![3200,3052].includes(height))throw Error('Unexpected HQ dimensions: '+file);
 sources[screenId]={path:path.relative(path.resolve(source,'../../..'),file).replaceAll('\\','/'),sha256:sha(png)};
 const uri='data:image/png;base64,'+png.toString('base64');let svg,dir='conversation';
 if(group==='communication'&&photos[number]){
  svg=fs.readFileSync(path.join(publicRoot,`assets/kdw-native/conversation/screen_${photos[number]}.svg`),'utf8');
  let count=0;svg=svg.replace(/(<image width="360" height="\d+" href=")data:image\/png;base64,[^"]+("\/?>)/,(_m,a,b)=>{count++;return a+uri+b;});
  if(count!==1)throw Error('Photo background anchor missing: '+screenId);
 }else if(group==='communication'&&number===1){
  // Preserve reviewed call timestamps, with the new PNG underneath.
  dir='visitor-details';svg=fs.readFileSync(path.join(publicRoot,'assets/kdw-native/visitor-details/communication-call-chat.svg'),'utf8');
  svg=svg.replace(/(<image id="source"[^>]*href=")[^"]+("\/?>)/,(_m,a,b)=>a+uri+b);
 }else if(group==='digital-id'&&number===6){
  dir='visitor-details';const original=fs.readFileSync(path.join(publicRoot,'assets/kdw-native/visitor-details/digital-id-create-id-ready.svg'),'utf8');
  const shape=original.match(/<path d="([^"]+)" fill="url\(#pattern0_[^)]+\)"\/>/)?.[1];
  const portrait=fs.readFileSync(path.join(publicRoot,'assets/kdw-native/conversation/visitor-placeholder.webp')).toString('base64');
  if(!shape)throw Error('ID portrait clip missing');
  svg=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="800" viewBox="0 0 360 800"><defs><clipPath id="hq-id-photo"><path d="${shape}"/></clipPath></defs><image width="360" height="800" href="${uri}"/><g clip-path="url(#hq-id-photo)"><svg data-visitor-viewport="circle" data-visitor-mask="portrait" x="69" y="129" width="222" height="222" viewBox="100 100 880 880" preserveAspectRatio="none"><image data-visitor-photo="true" width="1080" height="1920" href="data:image/webp;base64,${portrait}"/></svg></g></svg>`;
 }
 if(svg){
  // Intrinsic pixel dimensions also keep the offline fallback at full resolution.
  svg=svg.replace(/(<svg\b[^>]*?)width="\d+" height="\d+"/,`$1width="${width}" height="${height}"`);
  save(screenId,`assets/kdw-native/${dir}/hq-${screenId.replaceAll('.','-')}.svg`,svg,width,height,'image/svg+xml');
 }else save(screenId,`assets/kdw-native/hq/${screenId.replaceAll('.','-')}.png`,png,width,height,'image/png');
}
fs.writeFileSync(path.join(source,'client/src/kdw-hq-screen-assets.json'),JSON.stringify({assets,screens,sources},null,2)+'\n');
console.log(JSON.stringify({screens:Object.keys(screens).length,photoScreens:Object.values(assets).filter(a=>a.mimeType==='image/svg+xml').length}));
