import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {VISITOR_CAPTURE,visitorCrop,composeVisitorScreen} from './client/src/kdw-conversation-photo.mjs';
const source=path.dirname(fileURLToPath(import.meta.url)),input=path.resolve(source,'../../../UI/new_screens/conversation'),base='assets/kdw-native/conversation/';
const require=createRequire(import.meta.url),sharp=require(path.resolve(process.argv[2]??path.join(source,'client/node_modules'),'sharp'));
const parsed=spawnSync(process.env.KDW_PREP_PYTHON??'python',[path.join(source,'conversation-source-map.py'),input],{encoding:'utf8',maxBuffer:10*1024*1024});
if(parsed.status!==0)throw Error(parsed.error?.message??parsed.stderr);
const map=JSON.parse(parsed.stdout),sha=b=>createHash('sha256').update(b).digest('hex'),assets={},records=[];
const output=path.join(source,'client/public',base);fs.mkdirSync(output,{recursive:true});
// Explicit local fixture supplied by the user, simulating an upright stela capture.
const photoSource='fixtures/visitor-photo.jpg',photoInput=fs.readFileSync(path.join(source,photoSource));
const photo=await sharp(photoInput).rotate().resize(1080,1920,{fit:'cover',position:'centre'}).webp({quality:90}).toBuffer();
fs.writeFileSync(path.join(output,'visitor-placeholder.webp'),photo);
const descriptor={...VISITOR_CAPTURE,dataUri:'data:image/webp;base64,'+photo.toString('base64')};
const placeholder=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><image width="1080" height="1920" href="${descriptor.dataUri}"/></svg>\n`;
fs.writeFileSync(path.join(output,'visitor-placeholder.svg'),placeholder);
const circle=visitorCrop('circle'),avatar=`<svg xmlns="http://www.w3.org/2000/svg" width="${circle.width}" height="${circle.height}" viewBox="${circle.x} ${circle.y} ${circle.width} ${circle.height}"><image width="1080" height="1920" href="${descriptor.dataUri}"/></svg>\n`;
fs.writeFileSync(path.join(output,'visitor-avatar.svg'),avatar);
assets['kdw.conversation.avatar']={assetId:'kdw.conversation.avatar',path:base+'visitor-avatar.svg',mimeType:'image/svg+xml',width:circle.width,height:circle.height,sha256:sha(avatar)};

assets['kdw.conversation.placeholder']={assetId:'kdw.conversation.placeholder',path:base+'visitor-placeholder.svg',mimeType:'image/svg+xml',width:1080,height:1920,sha256:sha(placeholder)};
for(const s of map.screens){
 const png=fs.readFileSync(path.join(input,`screen_${s.number}@2x.png`)),svgSource=fs.readFileSync(path.join(input,`screen_${s.number}.svg`));
 const background=png;
 const [x,y,w,h]=s.bounds,kind=s.number<=2?'call':'circle',r=visitorCrop(kind);
 const template=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="${s.height}" viewBox="0 0 360 ${s.height}"><defs><clipPath id="visitor-clip">${s.shape}</clipPath>${s.occlusion?`<clipPath id="visitor-occlusion">${s.occlusion}</clipPath>`:''}${s.defs}</defs><image width="360" height="${s.height}" href="data:image/png;base64,${background.toString('base64')}"/><g clip-path="url(#visitor-clip)">${s.occlusion?'<g clip-path="url(#visitor-occlusion)">':''}<svg data-visitor-viewport="${kind}" x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${r.x} ${r.y} ${r.width} ${r.height}" preserveAspectRatio="none"><image data-visitor-photo="true" width="1080" height="1920" href="${descriptor.dataUri}"/></svg>${s.occlusion?'</g>':''}${s.overlays}</g></svg>\n`;
 const bytes=composeVisitorScreen(template,descriptor),name=`screen_${s.number}.svg`,assetId=`kdw.conversation.screen-${s.number}`;
 fs.writeFileSync(path.join(output,name),bytes);assets[assetId]={assetId,path:base+name,mimeType:'image/svg+xml',width:360,height:s.height,sha256:sha(bytes)};
 records.push({...s,overlays:undefined,defs:undefined,shape:undefined,occlusion:undefined,kind,sourceSvgSha256:sha(svgSource),sourcePngSha256:sha(png),assetId,bytes:Buffer.byteLength(bytes)});
}
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({schemaVersion:1,capture:VISITOR_CAPTURE,placeholderSource:photoSource,photoInputSha256:sha(photoInput),photoSha256:sha(photo),screens:records},null,2)+'\n');
fs.writeFileSync(path.join(source,'client/src/kdw-conversation-assets.json'),JSON.stringify(assets,null,2)+'\n');
console.log(JSON.stringify({screens:records.length,bytes:records.reduce((n,s)=>n+s.bytes,photo.length),placeholderBytes:photo.length}));
